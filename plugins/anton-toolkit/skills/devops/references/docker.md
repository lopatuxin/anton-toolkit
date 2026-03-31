# Docker Reference — шаблоны Dockerfile

## Spring Boot + Gradle (multi-stage)

Основной шаблон для Spring Boot проектов с Gradle.

```dockerfile
# --- Stage 1: Build ---
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app

# Кешируем зависимости (отдельный слой)
COPY gradle/ gradle/
COPY gradlew build.gradle.kts settings.gradle.kts ./
RUN ./gradlew dependencies --no-daemon || true

# Копируем исходники и собираем
COPY src/ src/
RUN ./gradlew bootJar --no-daemon -x test

# --- Stage 2: Runtime ---
FROM eclipse-temurin:21-jre
WORKDIR /app

# Не запускай от root
RUN groupadd -r app && useradd -r -g app app
USER app

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Адаптация шаблона

**Версия Java**: замени `21` на нужную (17, 21, 23). Проверь в `build.gradle.kts`:
```kotlin
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}
```

**Multi-module проект**: если проект мульти-модульный, адаптируй COPY:
```dockerfile
COPY gradle/ gradle/
COPY gradlew build.gradle.kts settings.gradle.kts ./
COPY module-a/build.gradle.kts module-a/
COPY module-b/build.gradle.kts module-b/
RUN ./gradlew dependencies --no-daemon || true

COPY module-a/src/ module-a/src/
COPY module-b/src/ module-b/src/
RUN ./gradlew :module-b:bootJar --no-daemon -x test
```

**Maven**: замени Gradle команды:
```dockerfile
COPY pom.xml ./
RUN mvn dependency:go-offline

COPY src/ src/
RUN mvn package -DskipTests

# В runtime stage:
COPY --from=builder /app/target/*.jar app.jar
```

**JVM-тюнинг для контейнеров**:
```dockerfile
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:InitialRAMPercentage=50.0", \
  "-jar", "app.jar"]
```

## .dockerignore

Всегда создавай рядом с Dockerfile:

```
.git
.gitignore
.gradle
build
.idea
*.iml
*.log
.env
docker-compose*.yml
README.md
```

## Spring Boot Actuator (для healthcheck)

Если в проекте нет actuator — добавь зависимость:

```kotlin
// build.gradle.kts
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-actuator")
}
```

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health
  endpoint:
    health:
      show-details: never
```

Если actuator не подходит — используй liveness probe через TCP:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD nc -z localhost 8080 || exit 1
```

## Оптимизация слоёв

Порядок COPY от редко меняющегося к часто:
1. `gradlew`, `gradle/` — почти никогда не меняются
2. `build.gradle.kts`, `settings.gradle.kts` — редко
3. `src/` — часто

Это максимизирует cache hit при пересборке.
