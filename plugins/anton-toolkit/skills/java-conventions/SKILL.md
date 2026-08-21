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
- Use the libraries already in the project; a new dependency needs a justification in the report.
- Test identifiers are English camelCase with the Russian description in `@DisplayName` on the class and on each `@Test` method — not Russian in backticks, even where the project already has such names. Cases that differ only in input are one `@ParameterizedTest` with `@MethodSource` or `@CsvSource`.

## Done criteria

A change is done when all of these pass:

- `./gradlew compileJava` (or `mvn compile`)
- the tests: `./gradlew test --tests "fully.qualified.TestClassName"` (or `mvn -Dtest=TestClassName test`) for the touched classes, then `./gradlew test` (or `mvn test`) for the module
- the coverage gate when the project configures one (the JaCoCo verification task)

Tests use the project's existing framework and style — JUnit 5, Mockito, AssertJ, Testcontainers, whatever the build file already declares — and live in the same package under `src/test/`.

## Library documentation

When unsure about the API of a library version, use the documentation tools available in the session: the Context7 connector (resolve-library-id, then query-docs) when present, otherwise WebFetch of the official docs. Do not guess signatures.
