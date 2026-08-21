---
name: kotlin-conventions
description: >
  Kotlin conventions of this toolkit: Spring Boot module patterns, the no-comment and brace
  rules, idiomatic-Kotlin rewrites, null safety, atomic writes, detekt discipline, and the
  compile/detekt/test done criteria. Loaded automatically when working with Kotlin files;
  also preloaded into the kotlin-dev agent.
user-invocable: false
paths:
  - "**/*.kt"
  - "**/*.kts"
---

# Kotlin conventions

These rules apply to every Kotlin change, a one-line edit included. A concrete project's existing conventions win over anything here: find the analogue in the repo (an existing controller, service, entity, converter, test) and follow its pattern before writing. Check `build.gradle.kts`, `gradle/libs.versions.toml` and `settings.gradle.kts` for the stack, and `application.yml` when configuration is involved.

For module layout, error model, logging and JPA rules read `${CLAUDE_PLUGIN_ROOT}/references/kotlin-backend-manifest.md`; a concrete project's existing conventions win over the manifest.

## Hard rules

- No comments in code: no KDoc, no block comments, no line comments, in new code and in edits alike. Code explains itself through naming and small functions — when tempted to explain what or why, rename the symbol or extract a well-named private function or `val`. The only exceptions are machine-read directives that tooling requires: `// language=SQL`, `// ktlint-disable`, `@Suppress` (an annotation, always fine), and a license header the project already mandates.
  - Incorrect: `// calculate total price` above `val total = items.sumOf { it.price }`
  - Correct: `val total = items.sumOf { it.price }` with a descriptive name and no comment
- Braces on every `if`, `else`, `else if`, `for`, `while`, `do` body, single-statement bodies included: `if (qty.signum() <= 0) {\n    continue\n}`, not `if (qty.signum() <= 0) continue`. The one exception is an `if`/`when` used as an expression and assigned or returned (`val x = if (a) b else c`) — that is idiomatic and stays.
- At most one `continue` / `break` per loop. Several guards that all skip the iteration become one `if` joined with `||` and one `continue` (same for an early-exit `break`, joined with `&&`). Hoist the cheap side-effect-free lookups the combined condition needs (`Map.get`, list indexing, pure parsing) above the guard. Prefer `filter`, `firstOrNull`, `sumOf` over a manual loop when they state the intent more directly.
- Null safety through `?.let { }`, `?:`, `requireNotNull()`. Do not use `!!`.
- No logic duplication: before writing, check the class and its neighbours for an equivalent and reuse it or extract a shared private or extension function.
- No dead or speculative public API. Do not add a method, field, port or interface member that has no caller in this change — "we'll need it later" widens a public contract that others must implement, mock and maintain. Grep for a real caller before adding a member to an interface or facade.
  - Incorrect: adding `findActive`, `complete`, `block` to a facade when only `startOAuth` and `consumeActive` are called anywhere.
  - Correct: the facade exposes exactly the members its callers invoke; `complete` arrives in the same change as its caller.
- Atomic write over check-then-act. "Insert only if absent" or "update only if unchanged" is one atomic statement, because a read followed by a conditional write is a race under concurrency. For JPA/Postgres use a single upsert (`INSERT ... ON CONFLICT ... DO NOTHING/UPDATE`) or a conditional `UPDATE ... WHERE`, backed by the matching unique constraint, instead of `if (!repo.existsBy(...)) repo.save(...)`. If a native upsert bypasses Hibernate id or timestamp generation, add the DB-side default (`DEFAULT gen_random_uuid()`, `now()`) in the same migration.
- Extract responsibility instead of suppressing the smell. `@Suppress("TooManyFunctions")` or `@Suppress("LongParameterList")` on a class signals more than one responsibility: carve a cohesive slice of its methods and their exclusive dependencies into a new `@Component`/`@Service` (a dedicated `*Finalizer`, `*Resolver`). A constructor past ~6 dependencies is the same signal. Suppress detekt only for a genuinely irreducible case, and justify it in the report.
- Decompose: private functions stay under ~30 lines (the detekt `LongMethod` threshold); DB access, calculations and DTO assembly are separate functions.
- One endpoint — one page: before creating or changing a service function, Grep its callers; if it serves several pages, split it.
- Mapping through extension functions (`.toResponse()`, `.toDomain()`) or `@Component` converters, following the project's existing pattern; no hand-rolled inline mapping in controllers.
- Data classes for DTOs and value objects, never for JPA entities.
- Logging: `private val logger = KotlinLogging.logger {}` at file level, lambda syntax (`logger.info { "..." }`), never `println`.
- Dependencies come from the Version Catalog; a new dependency needs a justification in the report.
- Test identifiers are English camelCase with the Russian description in `@DisplayName` (JUnit 5) or the Kotest spec string — not Russian in backticks, even where the project already has such names. Cases that differ only in input are one `@ParameterizedTest` with `@MethodSource` or `@CsvSource`.

## Idiomatic Kotlin checklist

Reviewers flag every one of these; rewrite them before finishing, including in a one-line edit when the touched line matches a pattern.

- `String.substring(0, n)` → `take(n)`, and `substring(s.length - n)` → `takeLast(n)`: `take` is safe past the boundary, `substring` throws.
- `if (x == null) return Y; val z = x.foo()` → `val z = x?.foo() ?: return Y`; the same with `?: error(...)` and `?: throw ...`.
- `map.containsKey(k)` → `k in map`; `set.contains(e)` → `e in set`; `list.contains(e)` → `e in list`.
- `var acc = init; for (x in xs) acc = f(acc, x); return acc` → `xs.fold(init) { acc, x -> f(acc, x) }` as a single-expression function; the same shape applies to chained `Regex.replace` over a list of patterns.
- `mutableMapOf<K, V>().also { it["a"] = 1; if (cond) it["b"] = 2 }` → `buildMap { put("a", 1); if (cond) put("b", 2) }`; likewise `buildList`, `buildSet`. The result is read-only, which is what consumers should accept.
- Multi-statement `if/else` with `return` in both branches → a single-expression function: `fun f(): T = if (a) X else Y`, or `fun f(): T = when { a -> X; b -> Y; else -> Z }` for three or more branches or a guard prefix such as an empty-input fast path.
- Snapshot then mutate: `keys.associateWith { sideRead(it) }` followed by `forEach { (k, v) -> sideWrite(k, v) }`. Two clean passes beat one loop that mixes reading and writing shared state (MDC, ThreadLocal, any external mutable store).
- `iterator.asSequence().toList()` for a plain snapshot → drop `.asSequence()`; `ObjectNode.properties()`, `entries` and `keys` are collections you can copy directly. Keep `asSequence` only when the chain has a lazy operator (`map`, `filter`, `take`) that benefits from short-circuiting.
- `for ((k, v) in map)` is fine for read-only iteration; for "do something per entry" without accumulation use `map.forEach { (k, v) -> ... }`.
- `if (s != null && s.isNotEmpty())` → `if (!s.isNullOrEmpty())`; the same with `isNullOrBlank`.

## Done criteria

A change is done when all of these pass:

- `./gradlew compileKotlin`
- `./gradlew detekt` — new code passes clean; the baseline is for legacy only
- the tests: `./gradlew test --tests "fully.qualified.TestClassName"` for the touched classes, then `./gradlew test` for the module
- `./gradlew koverVerify` when the project configures a coverage gate

Tests use the project's existing framework and style — JUnit 5 with MockK, Kotest, Testcontainers, whatever `src/test/` already uses — and live next to their production package under `src/test/`.

## Library documentation

When unsure about the API of a library version, use the documentation tools available in the session: the Context7 connector (resolve-library-id, then query-docs) when present, otherwise WebFetch of the official docs. Do not guess signatures.
