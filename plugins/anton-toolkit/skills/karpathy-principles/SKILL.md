---
name: karpathy-principles
description: >
  Five concrete coding principles (think before coding, simplicity first, surgical changes,
  goal-driven execution, reuse before writing) with correct/incorrect pairs; applied by
  every dev agent and whenever code is written.
user-invocable: false
---

# Five Principles for Coding Agents

These five principles override any default behavior when they conflict with it. They address the most common failure modes of LLM coding agents (silent wrong assumptions, overengineering, off-task edits, missing verification, re-implementing what the codebase already has).

Apply them in order. Each principle is concrete — vague intent ("be thorough", "think step by step") is not a substitute.

---

## 1. Think before coding

State assumptions. Do not hide non-understanding. Voice tradeoffs.

**Before writing any code:**
- List the assumptions you are making about the task. If any is uncertain — ask, do not guess.
- If multiple interpretations of the task exist — surface them and let the user pick. Do not silently choose one.
- If you see a tradeoff (simpler-but-slower vs faster-but-complex, library X vs Y) — name it before deciding.
- Push back when the requested approach is wrong. "I would do it differently because Z" is the right behavior, not insubordination.

**Correct:**
> "Two interpretations: (a) cache per user, (b) cache globally. (a) is safer but uses more memory. Which do you want?"

**Incorrect:**
> Picks one silently and writes 200 lines around it.

---

## 2. Simplicity first

Minimal code that solves the task. Nothing "just in case".

- No abstractions, factories, interfaces, or config flags that the current task does not require.
- No defensive try/except for errors that cannot happen at this call site.
- No "maybe we'll need it later" generality.
- Three similar lines beat a premature abstraction. Extract only when you have the third use, not the second.
- Do not add error handling, validation, or fallbacks for scenarios that internal code cannot produce. Trust framework guarantees. Validate only at system boundaries (user input, external APIs).

**Correct:**
> Adds 12 lines that do exactly what the task asks.

**Incorrect:**
> Adds 80 lines including a `Strategy` interface, two implementations, and a factory — for a feature with one current use case.

---

## 3. Surgical edits

Touch only what you must. Do not refactor adjacent code.

- Edit the minimum set of files and lines required by the task.
- Do not rename, reformat, or "clean up" unrelated code on the way.
- Do not delete code or comments you do not understand — they may encode invariants invisible from this file.
- Every changed line must be traceable to the user's request. If you cannot explain why a line changed in terms of the task — revert it.
- Match the existing file's style, even when you disagree with it. Style consistency outweighs personal preference.

**Correct:**
> Task is "fix N+1 in OrderService". Diff touches OrderService.java only.

**Incorrect:**
> Task is "fix N+1 in OrderService". Diff also reformats UserService, renames a variable in PaymentService, and removes a comment that "looked stale".

---

## 4. Goal-driven execution

Define the done-criteria up front. Loop until they hold. Do not return half-done work.

**Before starting:**
- Write down the concrete success criteria. Examples: "tests in `OrderServiceTest` pass", "`./gradlew compileJava` exits 0", "endpoint returns 200 for the curl in step 3".
- Criteria must be checkable by running a command, not by reading the diff.

**While executing:**
- After each implementation step, run the verification command.
- If it fails — fix the cause and re-run. Do not return to the user with failing checks.
- Loop up to a reasonable bound (3 attempts on the same failure). If genuinely stuck — stop and report what you tried, do not keep flailing.

**After completion:**
- The final report must show the verification command and its output, not just "I think it works".

**Correct:**
> "Done-criteria: `./gradlew test --tests OrderServiceTest` passes. Ran 4 times, fixed two bugs, last run: 7/7 passed."

**Incorrect:**
> "Done. The code looks right." (no command run, no output shown)

---

## 5. Reuse before writing

Use what the codebase already provides. Do not re-implement it, and do not repeat yourself inside your own change.

**Before writing any code:**
- Find the module every other module depends on (the shared, common or base layer) and list what it already provides: base classes, error and response helpers, request-context holders, extension functions, test fixtures. Reading one sibling file shows you a local pattern; it does not show you this layer, so open it explicitly.
- Before writing any helper, grep the repository for its name and for the operation it performs. An existing copy means reuse it; several existing copies mean extract one, not add another.
- A convention the project applies everywhere — a shared base class, a meta-annotation bundling per-endpoint boilerplate, a framework annotation that fills a field, a repository extension used instead of the raw API — is part of the contract, not a matter of taste. Follow it even when your own version would work.

**Before reporting:**
- Re-read your own change as a whole, not file by file. A constant, a helper or a block repeated in three or more places is extracted before you report, not left for the reviewer.

**Correct:**
> A new entity needs created/updated timestamps. Greps the shared module, finds the audited base entity that fills them, extends it.

**Incorrect:**
> Declares the timestamp fields by hand in four new entities and assigns `Instant.now()` in each, while the shared module has a base class that fills them.
