# Kotlin Backend Manifest

Normative conventions for Kotlin + Spring Boot backend projects. This is the default standard. **A concrete project always wins on conflict** — if the repo already has an established structure, naming, or library choice, follow the repo and ignore this file where it diverges. Use this manifest only to fill gaps the project does not yet answer.

## 1. Stack

| Layer | Technology | Min version |
|-------|-----------|-------------|
| Language | Kotlin | 2.1+ |
| JDK | Java | 21+ |
| Framework | Spring Boot | 3.5+ |
| Build | Gradle (Kotlin DSL) | 8.10+ |
| HTTP | Spring MVC | — |
| Security | Spring Security + JWT (RS256, JJWT) | — |
| Persistence | Spring Data JPA + Hibernate | — |
| Migrations | Liquibase (XML) | — |
| DB | PostgreSQL | — |
| API docs | SpringDoc OpenAPI | 2.8+ |
| Logging | kotlin-logging-jvm (KLogger) + Logback | 7.0+ |
| Metrics | Micrometer + Prometheus | — |
| Linter | detekt | 1.23+ |
| Testing | JUnit 5, MockK, Testcontainers | — |

## 2. Multi-module structure

Each bounded context is a separate Gradle module. Module dependency direction is strict:

```
base              → (nothing, kotlin-stdlib only)
core              → base
security:shared   → base
security:auth     → security:shared, core
<domain-module>   → core, security:shared [+ other domain modules as needed]
service           → all modules (assembly point, the only module with bootJar)
```

- `base` — cross-cutting: exceptions, logging, converters, extensions. Zero Spring dependency where possible.
- `core` — global infrastructure: exception handler, CORS, OpenAPI config.
- `security:shared` / `security:auth` — annotations, aspects, JWT filter, login/register.
- Domain modules — `entity`, `repository`, `service`, `controller`. May depend on each other; avoid cycles.

Domain module package layout:

```
<module>/
├── api/
│   ├── annotation/   # custom @RestController annotations
│   ├── controller/   # REST controllers
│   └── model/        # Request/Response DTO
├── entity/           # JPA entities, enums
├── repository/       # Spring Data JPA repositories
├── service/          # business logic
├── converter/        # Entity → Model converters (@Component)
├── function/         # Function<ID, Entity> reusable lookups
├── property/         # @ConfigurationProperties
├── configuration/    # Spring @Configuration
└── scheduler/        # @Scheduled tasks
```

## 3. Gradle rules

| Rule | Detail |
|------|--------|
| Version Catalog | All versions in `gradle/libs.versions.toml`. Hardcoded versions in `build.gradle.kts` are forbidden. |
| Kotlin DSL only | `build.gradle.kts`, never Groovy. |
| Multi-module | One Gradle module per bounded context. |
| `TYPESAFE_PROJECT_ACCESSORS` | Use `projects.user`, not `project(":user")`. |
| `api` vs `implementation` | Transitive deps → `api()`, internal-only → `implementation()`. |
| Spring Boot plugin | Only on the `service` module (`bootJar`). Other modules produce plain `jar`. |
| `allOpen` | JPA `@Entity`, `@MappedSuperclass`, `@Embeddable` are made open via the kotlin-jpa plugin. |
| detekt | Applied to every Kotlin module via the root `subprojects` block. |
| `-Xjsr305=strict` | Java nullability is enforced strictly. |
| Tests | `failFast = true`. |

## 4. Layered architecture

```
Controller (api/controller/) → Service (service/) → Repository (repository/) → Entity (entity/)
```

| Layer | Contains | Forbidden |
|-------|----------|-----------|
| Controller | accepts HTTP, calls Service | direct Repository access, business logic |
| Service | business logic, transactions, orchestration, MDC context | knowledge of HTTP, DTO formats |
| Repository | JPA interfaces, custom `@Query`, Specifications | business logic |
| Entity | JPA entities, enums, value objects | presentation logic |

### Naming

| Type | Pattern | Examples |
|------|---------|----------|
| Controller | `XyzController` | `UserController` |
| Service | `XyzService`, `XyzCreateService` | `UserService`, `UserCreateService` |
| Repository | `XyzRepository` | `UserRepository` |
| Entity | `XyzEntity` | `UserEntity` |
| Converter | `XyzEntity2XyzConverter` | `UserEntity2UserConverter` |
| Function | `GetXyzFunction` | `GetUserEntityFunction` |
| DTO | `Xyz`, `XyzRequest`, `XyzResponse` | `User`, `CreateUserRequest` |

### Patterns in use

Strategy (interface + implementations selected via `@Configuration`), Converter (`@Component`, auto-registered in `ConversionService`), `Function<ID, Entity>` as `@Component` for reusable lookups with access checks, composable `Specification` for complex filters, AOP with custom annotations + aspects (`@RequireUser`), servlet filter chain (JWT validation, CORS), `@Scheduled` schedulers, argument resolvers injecting the current user.

## 5. Security

- **JWT RS256**, stateless. Private key on the server only, never in code — env/vault. Access token TTL ~15m, refresh ~7–30d.
- Refresh token in `httpOnly` cookie with `Secure`, `SameSite=Strict`, `Path=/api/v1/auth/refresh`. If `csrf.disable()` is used, the refresh cookie MUST be `SameSite=Strict` or there is a CSRF hole on `/api/v1/auth/refresh`.
- JWT claims minimal: `sub` (userId), `roles`, `iat`, `exp`.
- Authorization: `@PreAuthorize("hasRole('ADMIN')")` for role-based access; aspect + argument resolver to extract the user from `SecurityContext`.
- CORS: explicit domain whitelist. `allowedOrigins = listOf("*")` is forbidden in production.
- Input validation: `@Valid` on `@RequestBody`; whitelist patterns (`@Pattern`), size limits (`@Size`, `@Max`); validate both at DTO level and at domain invariant level.
- SQL injection: parameterized `@Query` with `:param` or Spring Data derived queries only. String concatenation into queries is forbidden.
- Secrets via `${ENV_VAR:default}` in `application.yml`. Never commit passwords, API keys, private keys, or connection strings with credentials.

## 6. Error handling

`BaseException` extends Spring 6 `org.springframework.web.ErrorResponseException`, so Spring renders the body as RFC 7807 `ProblemDetail`. **Do not** introduce a custom `ErrorResponse` data class — `ErrorResponseException` replaces it with `ProblemDetail` on serialization and custom fields are lost.

```kotlin
open class BaseException(
    status: HttpStatus,
    detail: String,
    val readableError: String? = null,
) : ErrorResponseException(status) {
    init {
        body.detail = detail
        readableError?.let { body.setProperty("readableError", it) }
    }
}
```

Concrete exceptions extend `BaseException` and add custom fields via `body.setProperty(...)`. `detail` is mandatory.

| Exception | HTTP | Purpose |
|-----------|------|---------|
| `EntityNotFoundException` | 404 | resource not found |
| `BadRequestException` | 400 | malformed request |
| `ValidationException` | 400 | validation failure |
| `UnauthorizedException` | 401 | not authenticated / invalid token |
| `MfaRequiredException` | 401 | 2FA required; body carries `challenge_id`, `methods`, `expires_at` |
| `NotAllowedException` | 403 | no access |
| `ConflictException` | 409 | state conflict, broken business precondition, optimistic lock |
| `UnprocessableEntityException` | 422 | semantically invalid request |
| `LimitExceededException` | 429 | rate limit / too many requests |

- `429` (not `426`) for rate limits; the global handler MUST set the `Retry-After` header (RFC 6585) by reading `retryAfterSeconds` from `ProblemDetail.properties`.
- Broken business precondition → `409 Conflict`, not `412` (`412` is reserved for conditional HTTP requests).
- Global handler is a `@RestControllerAdvice`. Rules: never return a stack trace to the client; one error format for the whole API; domain exceptions map to meaningful HTTP codes (not blanket 500); `readableError` is the human-readable message for the frontend; log the error before returning it.

## 7. Logging (KLogger)

```kotlin
import io.github.oshai.kotlinlogging.KotlinLogging

private val logger = KotlinLogging.logger {}   // top-level, once per file
```

| Rule | Detail |
|------|--------|
| Declaration | `private val logger = KotlinLogging.logger {}` at file level. NOT via `companion object`. |
| Lambda syntax | `logger.info { "..." }` — lazy interpolation. No string concatenation with `+`. |
| Exceptions | first argument: `logger.error(ex) { "description" }`. Every `catch` logs with the exception, never loses the stack trace. |
| Forbidden | `println` / `System.out`. |
| Never log | tokens, keys, passwords, PII. |
| Levels | `ERROR` failures, `WARN` anomalies, `INFO` business events, `DEBUG` diagnostics. |
| MDC | enrich context via `withLoggingContext(MdcKey.USER_ID to userId) { ... }`; MDC keys are an enum. |
| Messages | structured key-value: `"action=create userId=$id status=success"`. |

## 8. API design

- URLs: `/api/v{n}/resource-name` — plural, kebab-case. Versioning in the URL.
- `/api/**` is JWT-protected; public: `/api/v1/auth/**`, `/actuator/health`, `/swagger-ui/**`, `/v3/api-docs/**`.
- HTTP methods: GET read, POST create, PUT replace, PATCH partial, DELETE. Status codes: 200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500.
- Pagination via Spring Data `Pageable`: `?page=0&size=20&sort=createdAt,desc`.
- Controllers use custom annotations (`@UserRestController`, etc.).
- SpringDoc OpenAPI: per-module `OpenApiConfiguration` with groups; `@SecurityRequirement` for JWT.

## 9. Database & migrations

- Liquibase XML. Layout: `db/changelog/db.changelog-master.xml` includes `YYYY/MM/DD_HHMM.xml`.
- Migrations are **immutable** — never edit an already-applied changeset. One migration = one logical change.
- `spring.jpa.hibernate.ddl-auto: validate` — Hibernate only validates, never creates.
- `spring.jpa.open-in-view: false` — mandatory, set it explicitly.
- Backward-compatible column changes: nullable → backfill → NOT NULL. `CONCURRENTLY` indexes on large tables.

JPA entity rules:

| Rule | Detail |
|------|--------|
| `allOpen` | for `@Entity`, `@MappedSuperclass`, `@Embeddable`. |
| Enums | `@Enumerated(EnumType.STRING)`. |
| Fetch | `FetchType.LAZY` preferred for all associations. |
| `@DynamicUpdate` | NOT by default. Apply only on entities with LOB / very wide `VARCHAR` / `JSONB` / `BYTEA` columns. |
| Soft delete | `@SQLDelete` + `@SQLRestriction`. |
| Audit | `@CreationTimestamp`, `@UpdateTimestamp`. |
| N+1 | solve via `@EntityGraph` or `JOIN FETCH`. |
| Custom queries | `@Query` with `:param`. |
| Data classes | NOT for JPA entities (only for DTO / value objects). |

## 10. Kotlin code style

| Rule | Detail |
|------|--------|
| Data classes | for DTO / value objects, never for JPA entities. |
| Sealed types | `sealed class` / `sealed interface` for states and errors. |
| Extension functions | for mapping: `.toResponse()`, `.toDomain()`. |
| Null safety | `?.let { }`, `?:`, `requireNotNull()`. Avoid `!!`. |
| `companion object` | only for constants and factory methods. |
| File size | up to ~350 lines; split when exceeded. One responsibility per file. |
| Design | composition over inheritance. KISS, YAGNI, DRY. |

### detekt

- Config in `detekt/detekt.yml`, `buildUponDefaultConfig = true`.
- Thresholds: `LongMethod` 30, `LongParameterList` function 7 / constructor 10, `CyclomaticComplexMethod` 10, `MaxLineLength` 150.
- `ForbiddenMethodCall` blocks `kotlin.io.println` and `java.lang.System.out.println`.
- `@Suppress("detekt:RuleName")` only with a justification. New code passes clean; baseline is for legacy only.

## 11. Testing

Tests are out of scope for the dev agent — they go to `test-writer`. For reference, the project pyramid is: Unit (JUnit 5 + MockK + AssertJ, no Spring) → Integration (Testcontainers, `@DataJpaTest`) → API (`@SpringBootTest`, MockMvc) → Contract.
