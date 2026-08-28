# Docker Reference — Dockerfile templates

## Spring Boot + Gradle (multi-stage)

Main template for Spring Boot projects with Gradle.

```dockerfile
# --- Stage 1: Build ---
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app

# Cache dependencies (separate layer)
COPY gradle/ gradle/
COPY gradlew build.gradle.kts settings.gradle.kts ./
RUN ./gradlew dependencies --no-daemon || true

# Copy sources and build
COPY src/ src/
RUN ./gradlew bootJar --no-daemon -x test

# --- Stage 2: Runtime ---
FROM eclipse-temurin:21-jre
WORKDIR /app

# Do not run as root
RUN groupadd -r app && useradd -r -g app app
USER app

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Template adaptation

**Java version**: replace `21` with the required version (17, 21, 23). Check `build.gradle.kts`:
```kotlin
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}
```

**Multi-module project**: if the project is multi-module, adapt COPY:
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

**Maven**: replace Gradle commands:
```dockerfile
COPY pom.xml ./
RUN mvn dependency:go-offline

COPY src/ src/
RUN mvn package -DskipTests

# In runtime stage:
COPY --from=builder /app/target/*.jar app.jar
```

**JVM tuning for containers**:
```dockerfile
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:InitialRAMPercentage=50.0", \
  "-jar", "app.jar"]
```

## .dockerignore

Always create next to the Dockerfile:

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

## Spring Boot Actuator (for healthcheck)

If actuator is not in the project — add the dependency:

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

If actuator is not suitable — use a TCP liveness probe:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD nc -z localhost 8080 || exit 1
```

## Layer optimization

Order COPY from least-changed to most-changed:
1. `gradlew`, `gradle/` — almost never change
2. `build.gradle.kts`, `settings.gradle.kts` — rarely
3. `src/` — frequently

This maximizes cache hits on rebuild.
