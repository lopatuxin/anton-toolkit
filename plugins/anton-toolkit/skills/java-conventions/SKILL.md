---
name: java-conventions
description: >
  Java conventions of this toolkit: Spring Boot project patterns, mandatory braces, one
  guard per loop, MapStruct mapping, decomposition, and the compile/test done criteria.
  Loaded automatically when working with Java files; also preloaded into the java-dev
  agent.
user-invocable: false
paths:
  - "**/*.java"
---

# Java conventions

These rules apply to every Java change, a one-line edit included. A concrete project's existing conventions win over anything here: find the analogue in the repo (an existing Controller, Service, Repository, test) and follow its pattern before writing. Check `pom.xml` or `build.gradle.kts` for the stack, and `application.yml` when configuration is involved.

## Hard rules

- Braces on every `if`, `else`, `else if`, `for`, `while`, `do` body, single-statement bodies included.
  - Correct: `if (qty.signum() <= 0) {\n    continue;\n}`
  - Incorrect: `if (qty.signum() <= 0) continue;` and `if (x) doA();\nelse doB();`
- At most one `continue` / `break` per loop — Sonar flags a second one. Several guards that all skip the iteration become one `if` joined with `||` and one `continue` (same for an early-exit `break`, joined with `&&`). Hoist the cheap side-effect-free lookups the combined condition needs (`Map.get`, list indexing, pure parsing) above the guard.
  ```java
  for (Map.Entry<String, BigDecimal> entry : quantities.entrySet()) {
      BigDecimal qty = entry.getValue();
      BigDecimal price = lastKnownClose.get(entry.getKey());
      if (qty.signum() <= 0 || price == null) {
          continue;
      }
      total = total.add(qty.multiply(price));
  }
  ```
  Incorrect: the same loop with `if (qty.signum() <= 0) { continue; }` followed by a second `if (price == null) { continue; }`.
- No logic duplication: before writing, check the class and its neighbours for an equivalent and reuse it or extract a shared private method.
- Decompose: private methods stay under ~30 lines; DB access, calculations and DTO assembly are separate methods.
- One endpoint — one page: before creating or changing a service method, Grep its callers; if it serves several pages, split it.
- MapStruct for every entity→DTO mapping, no manual `.builder().field(...).build()` chains. If the project has no MapStruct yet, add the dependencies and create the mapper in `mapper/`.
- No comments on obvious code, no abstractions for hypothetical future needs.
- On Java 21+ take the ends of a list through the `SequencedCollection` methods, in main code and tests alike — IDEA flags the index form and the owner rejects it in review.
  - Correct: `values.getFirst()`, `values.getLast()`, `queue.removeFirst()`
  - Incorrect: `values.get(0)`, `values.get(values.size() - 1)`, `queue.remove(0)`
- Use the libraries already in the project; a new dependency needs a justification in the report.
- Test identifiers are English camelCase with the Russian description in `@DisplayName` on the class and on each `@Test` method — not Russian in backticks, even where the project already has such names. Cases that differ only in input are one `@ParameterizedTest` with `@MethodSource` or `@CsvSource`.
- No `var`; write the type. No public fields.
- Code you create or move into a new class meets every rule here, even when the method body is copied from old code. Old code the task does not touch stays as it is.

## Spring design

The owner rejects hand-made mechanisms and inheritance bent to fit one case. Before writing infrastructure, look for the standard Spring, Boot or library way and use it.

- Ready mechanism first. Shared defaults for several services — `spring.config.import` of a library YAML, not a custom `EnvironmentPostProcessor`. Concurrency and rate limits — resilience4j `Bulkhead` / `RateLimiter` configured in `application.yml`, not a hand-made semaphore or token bucket with a table of property keys. A metric name — an attribute of the annotation on the measured method, not a table of class names held as strings. Mapping — MapStruct or builders, not setter chains.
- No template method bent by flags. A base class with hooks that return `null`/`true` by default, boolean switches, or stubs that throw because they "must not be called", added so one or two subclasses fit, is a design error. Use composition: one component with the shared loop plus a strategy per variant; take the variant that does not fit out of the shared path.
- No combinatorial helpers. A helper with `persistX`, `persistWithY`, `persistWithYAndZ` and a profile flag becomes a few plain operations the caller invokes explicitly, in its own order.
- `@Qualifier` is a smell: it usually patches a bean registered twice or picks one of several implementations. Register each bean once; inject `List<Impl>` where every implementation reports its own key and build an `EnumMap`. The exception is several connections of one type (several `DataSource` / `JdbcTemplate`).
- `@ConfigurationProperties` classes are immutable `record`s registered once (`@ConfigurationPropertiesScan`), not `@Component` + `@Data` scattered across `@EnableConfigurationProperties` on unrelated classes. Default values live in `application.yml`, not in Java field initializers. Secrets live in neither — only in the stand's secrets.
- Development settings (limits, pool sizes, timeouts) go to `application.yml`; Helm values carry only what differs per stand (addresses, credentials, topic names).
- Every Feign call is an explicit `try` with two `catch` blocks — `FeignException` and everything else — each writing one WARN line with context (provider, method, address, HTTP status) and no stack trace; the exception type thrown outward does not change. The stack trace is logged once, at the boundary that handles the error.
- Delete dead code instead of refactoring it: before touching a chain, check that its entry point is reachable — the event it listens to is published somewhere, the method has a caller.
- Do not test configuration wiring: no `ApplicationContextRunner` checks of which bean exists or lands in which field, no `ReflectionTestUtils.getField`, no assertions on bound property values, no mock-based tests of three-line helpers. Wiring is checked on a running stand; tests pin behaviour.

## Done criteria

A change is done when all of these pass:

- `./gradlew compileJava` (or `mvn compile`)
- the tests: `./gradlew test --tests "fully.qualified.TestClassName"` (or `mvn -Dtest=TestClassName test`) for the touched classes, then `./gradlew test` (or `mvn test`) for the module
- the coverage gate when the project configures one (the JaCoCo verification task)

Tests use the project's existing framework and style — JUnit 5, Mockito, AssertJ, Testcontainers, whatever the build file already declares — and live in the same package under `src/test/`.

## Library documentation

When unsure about the API of a library version, use the documentation tools available in the session: the Context7 connector (resolve-library-id, then query-docs) when present, otherwise WebFetch of the official docs. Do not guess signatures.
