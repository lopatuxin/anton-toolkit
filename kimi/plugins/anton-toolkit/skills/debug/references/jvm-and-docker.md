# JVM and Docker specifics for the debug ladder

Commands for the stack the toolkit meets most often: a Spring Boot service (Kotlin or Java, Gradle) running in Docker Compose next to PostgreSQL and Redis. Adjust service names, users, and ports to the project's `compose.yml`. Each section maps to a level of the ladder in `SKILL.md`.

## Level 1 — logs and reproduction

```bash
# Container logs, then only the interesting lines
docker compose logs --tail=100 <service>
docker compose logs --tail=100 <service> | grep -i "error\|exception\|warn"

# File logs
tail -100 logs/app.log | grep -i "error\|exception"

# API — repeat the failing request verbatim
curl -v -X POST http://localhost:8080/api/... -H "Content-Type: application/json" -d '{...}'
```

A JVM stack trace lists the innermost frame first; the line to start from is the first frame in the project's own package, not the Spring or Hibernate frames above it. `Caused by:` sections further down hold the original exception — read to the last one.

## Level 2 — data and configuration

```bash
# What is actually in the database?
docker compose exec postgres psql -U app -d appdb -c "SELECT * FROM orders WHERE id = ..."

# What is in the cache?
docker compose exec redis redis-cli GET "key"

# Environment the process really runs with (not the repo's .env)
docker compose exec <service> env | grep -i "spring\|db\|redis"

# Application config — remember the active profile overrides the base file
cat src/main/resources/application.yml
cat src/main/resources/application-<profile>.yml
```

## Level 3 — dynamic analysis

Temporary logging in Kotlin or Java:

```java
log.debug(">>> Input: {}, State: {}", input, state);
```

Spring Boot Actuator (when the `actuator` starter is on the classpath and the endpoints are exposed):

```bash
# Is the service up, and what does it think of its dependencies?
curl http://localhost:8080/actuator/health

# Is the component loaded at all?
curl http://localhost:8080/actuator/beans | jq '.contexts[].beans | keys[]' | grep -i "order"

# Recent HTTP exchanges (if enabled)
curl http://localhost:8080/actuator/httpexchanges

# Effective configuration properties and which source set them
curl http://localhost:8080/actuator/env | jq '.propertySources[] | {name, properties: (.properties | keys)}'
```

Network between containers:

```bash
# Is the port listening?
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health

# DNS and connectivity from inside the calling container
docker compose exec <service> curl -v http://other-service:8080/health
```

## Level 4 — profiling

Hibernate SQL logging, temporary — add to the active profile, remove after:

```yaml
logging.level.org.hibernate.SQL: DEBUG
logging.level.org.hibernate.orm.jdbc.bind: TRACE   # Hibernate 6; on Hibernate 5 use org.hibernate.type.descriptor.sql
```

Reproduce the slow request once and count the statements — an N+1 shows as the same `select` repeated once per parent row.

JVM diagnostics inside the container (`jcmd` ships with the JDK; a JRE-only image needs a JDK-based debug image):

```bash
# Thread dump — what are the threads doing right now?
docker compose exec <service> jcmd 1 Thread.print

# Heap and GC state
docker compose exec <service> jcmd 1 GC.heap_info

# 30-second Flight Recorder profile; copy it out and open in JDK Mission Control
docker compose exec <service> jcmd 1 JFR.start duration=30s filename=/tmp/profile.jfr
docker compose cp <service>:/tmp/profile.jfr ./profile.jfr
```

Request timing split:

```bash
curl -w "\n  DNS: %{time_namelookup}s\n  Connect: %{time_connect}s\n  TTFB: %{time_starttransfer}s\n  Total: %{time_total}s\n" \
  http://localhost:8080/api/...
```

## Level 5 — comparison between environments

```bash
# Compare the environment of two containers
diff <(docker compose exec service1 env | sort) <(docker compose exec service2 env | sort)

# Compare resolved dependency versions against a known-good snapshot
./gradlew dependencies --configuration runtimeClasspath > deps.txt
diff deps.txt expected-deps.txt
```

When bisecting with `git bisect` on a Gradle project, rebuild the image at each step (`docker compose build <service>` or `./gradlew bootJar`) — testing an old commit against a stale image proves nothing.
