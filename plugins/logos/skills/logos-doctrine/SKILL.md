---
name: logos-doctrine
description: >
  The binding Logos doctrine "code for AI, not for humans": eleven numbered points (0–11) every
  Logos coder, reviewer, test-writer, QA, devops and sync agent obeys — smallest mechanism the
  spec names, explicit wiring, comments only for traps and invariants, no manifests or history
  in code, extension by registration, 1000-line module ceiling, correctness over everything.
  Preloaded into the Logos build agents; not a user command.
user-invocable: false
---

# Doctrine — code for AI, not for humans (Logos build context §4)

**The user will never read this code.** He stated it explicitly: do not spend any effort making the
code ergonomic, pretty, or approachable for a human reader. Optimize the code so that an LLM agent
can read it, understand it fully, and *extend* it later without breaking it. This doctrine is binding
on `logos-coder` (how to write) and `logos-reviewer` (what to enforce). Concretely:

0. **THE FIRST RULE — the simplest mechanism that meets the criteria, and nothing else. This point
   outranks every point below it; where any of them pulls toward more code, this one wins.** Logos is
   built to be simple, functional, easy to extend and easy to debug. A mechanism is built ONLY for a
   need that exists today — named in the phase spec or the architecture, or already observed and
   reported by the owner — never for a problem that has not happened yet («не выдумывай проблемы там,
   где они ещё не возникли»). Every mechanism must be explainable to the owner in ONE plain Russian
   sentence; if that sentence cannot be written, the mechanism is not built. Failure is not hidden:
   when something fails, the owner sees an honest error in the chat feed; the code does NOT swallow the
   exception into a log, does NOT degrade silently to a lesser path, does NOT retry with a "stronger"
   prompt, does NOT quietly swap models or components. Code never judges what a model answered — its
   language, length, quality, «is this a stub» — that judgment belongs to the model and to the owner,
   whose remedy for a bad model is «Панель управления». Extension points, registries, telemetry, config
   knobs, background channels, caches and extra model calls are COSTS, not virtues: add each one only
   when the spec names it or the owner asked for it. Before adding a unit, check whether an existing one
   already does the job; when touching a unit, ask whether something in it can now be DELETED, and
   delete it. When two designs both meet the criteria, the one with fewer moving parts wins, even if the
   other is "more robust" — robustness the owner cannot see and did not ask for is complexity he pays
   for and cannot debug.
   Correct: the spec says «редактор переводит черновик» → one call to the editor; its answer goes to the
   owner as it came; a provider error surfaces as an honest error line in the feed.
   Incorrect: the same call wrapped in a Cyrillic-ratio check, a length floor, a retry with a scolding
   reminder, a walk down the registry's other candidates and a final «brain as editor» rung — five
   mechanisms, none in the spec, all invisible to the owner.
1. **Explicit over implicit, always.** No magic, no clever implicit conventions, no relying on the
   reader's intuition. Full descriptive names, explicit types/contracts at every boundary, explicit
   wiring. An agent should never have to *infer* what is happening.
2. **Comment ONLY what the code cannot say. The default is NO comment.** Silence is the correct default,
   not a gap to be filled. The agent who will extend this file reads Python and TypeScript fluently:
   names, signatures, types and control flow already tell it *what the code does*. Restating that in
   prose is not "self-description" — it is duplication, paid for on every read, and it buries the few
   lines that actually matter. Before writing any comment, ask: *would a competent agent, reading only
   the code, get this WRONG?* If no — write nothing.
   **There is NO manifest template.** Do not open a file with a structured header. There are no required
   sections and no `purpose:` / `contract:` / `invariants:` / `how-to-extend:` scaffold to fill in.
   A template is the very machine that produced this codebase's bloat: sections get written because the
   shape demands them, not because there was anything to say. A file with nothing non-derivable to say
   carries **no module docstring at all** — that is a finished, correct file, not an unfinished one.
   **Write a comment when, and ONLY when, it carries one of these:**
   - **An edge case or a trap** — behavior a reader would guess wrong (`must_not` on a field a point
     LACKS does not match, so untyped points still return; `array_to_string` is only STABLE, so the
     index and the query must reference the same named expression or the search silently seq-scans).
   - **The justification of a tuned constant** — what it was measured against and what breaks above and
     below. A bare `0.95` reads as arbitrary and the next agent will "improve" it and break the system.
   - **An invariant or ordering the code does not enforce** — "the text is written synchronously BEFORE
     the fingerprint"; "callable only after X has run".
   - **A must-NOT** — including dependency direction, and rules whose violation fails silently.
   - **A cross-boundary promise an implementation cannot state for itself** — on an ABC/endpoint/wire
     type: ordering, bounds, idempotency, what an empty or `limit<=0` input returns.
   Everything else — what a function does, what a type holds, what a module contains, which names it
   exports — is READ FROM THE CODE. **The names and the types ARE the manifest**, and unlike prose they
   cannot fall out of sync. When a type can carry the knowledge, use the type, not a sentence.
   Correct: `# 0.95 sits in the measured gap: same-topic drift >= 0.965, different topics <= 0.927. Raw cosine cannot separate them.`
   Incorrect: `purpose: the value types of the facts subsystem: FactState, FactSort, FactSource, …` — the code directly below says exactly that.
   Incorrect: a `contract:` block restating the signature; a `how-to-extend:` block on a unit nobody extends; a `purpose:` on a file whose name already says it.
   When you edit a file that carries such padding, **DELETE it** — do not rewrite it, do not "condense"
   it, and never re-add a header because the file looks bare without one.
   **NEVER state in a comment a fact that lives in ANOTHER file.** This is the single largest source of
   lying comments, and it lies *by construction*: the other file changes, this prose does not. Banned in a
   comment or docstring, with no exceptions:
   - **Who calls this** — "called from the notification card", "the panel button calls this", "its only
     caller is X", "the ONE web-reachable owner-only write".
   - **What the UI has** — buttons, cards, screens, tabs, whether a surface exists at all.
   - **Inventories and counts of things defined elsewhere** — "there are four write doors", "the only
     endpoint that …", lists of routes/fields/kinds owned by another module.
   - **Names owned elsewhere** — a field name, a route path, a module path, a frame `kind` quoted in prose
     ("`snapshot` carries `open_conflicts`"). Quote a name only where that name is DEFINED, never where it
     is merely referenced.
   If the knowledge genuinely matters, it belongs at its own definition site, in a type, or in a test —
   all three fail loudly when they go stale, whereas a comment about another file fails silently and
   misleads the next agent into hunting something that no longer exists.
   Correct (at the definition, about ITSELF): `# limit <= 0 returns ([], False) — callers must not treat it as "no more pages".`
   Incorrect (about another file): `# the frontend card calls this after the owner clicks «Принять».`
3. **Uniformity over brevity or cleverness.** The same problem is solved the same way everywhere, so
   an agent can pattern-match across the codebase. Regular, repetitive, predictable structure beats a
   terse clever one-off. Never optimize for fewer lines at the cost of predictability.
4. **When a comment IS warranted (point 2), keep it short and factual.** State the trap, the number, the
   invariant — one or two lines, at the line it protects. No onboarding narrative, no motivational prose,
   no restating the code in words, and no ceremonial header wrapping it. A comment is a warning sign
   nailed to a specific hazard, not a description of the road.
   **Mandatory comment self-audit before you hand work back.** Prose is cheap to delete and expensive to
   catch once it has gone stale, so the deletion pass happens BEFORE review, by you, not after review, by
   a second round-trip. As the LAST step of every coder dispatch, re-read every comment and docstring your
   diff ADDS (`git diff main -- <your layer>`, look at `+` lines) and, for each one, answer out loud:
   *which of the five allowed kinds in point 2 is this, and does it state any fact owned by another file?*
   **DELETE every comment that is not one of the five kinds, and every comment that reaches into another
   file.** Do not soften them, do not rewrite them — delete. Then report, in your final message, how many
   you deleted and how many you kept. A coder report with no self-audit line is an incomplete report.
5. **Extensibility by registration, not by core edits.** New capabilities are added by registering a
   new unit against a stable interface (plugin/registry pattern), not by editing the core. Interfaces
   are stable and explicit; the core is closed for modification, open for extension. A registry or
   extension point exists ONLY where the design names one (point 0) — never speculatively "so a future
   phase can plug in".
6. **Inspectable by construction.** Structured logging/telemetry on the steps the design says the
   owner sees (the pass log, the metrics pages) — so an agent can read *what actually happened* from
   machine-readable output, not guess. Not on every internal branch: a log line is never a substitute
   for showing the owner a failure (point 0), and telemetry nobody reads is cost (point 0).
7. **Determinism and isolation.** Prefer pure, deterministic units with explicit dependencies passed
   in (so they are trivially testable and reasoned about) over hidden global state.
8. **It must still run and be correct.** AI-readability is never an excuse for broken, insecure, or
   untested code. The doctrine governs *style and structure*, not correctness — correctness is
   non-negotiable. Tests (section: `logos-test-writer`) are the executable, machine-checkable spec.
9. **One responsibility per module — no god-modules.** Each file/module holds a SINGLE, clearly-named
   responsibility (domain types, ranking math, a repository, a router, a service, a client, …), and
   each responsibility is its own unit. A module that bundles several responsibilities, or that grows
   so large an agent must ingest the whole file to change one part, clogs the extending agent's context
   window and forces it to read everything to change anything —
   so decomposition is an AI-readability requirement here, not a human-ergonomics nicety. Decompose by
   responsibility from the FIRST phase and keep it decomposed; never let a file accrete across phases
   into a thousand-line monolith. Treat a module crossing ~400–500 lines as a decomposition checkpoint
   (does it hold more than one responsibility? split it), and NEVER ship a module that mixes unrelated
   responsibilities or exceeds the module-size guard the code repo enforces (a machine test that fails
   any `app/**` module over 1000 lines — that ceiling is a backstop, aim far below it). Correct: the
   memory subsystem split into `domain` / `substrate` / `ranking` / `service` / repository / `router`,
   each one responsibility. Incorrect: a single `memory_service.py` holding domain types + ranking math
   + the retrieval pipeline + the write path + repository wiring in 1800 lines — one file no agent can
   safely extend without loading all of it. This is the exact debt Фаза-11 had to spend a whole phase
   cleaning up; do not let it re-accumulate.
10. **No history in the code — a unit describes its PRESENT contract, never how it got there.** A
   docstring states what the unit does NOW: purpose, contract, invariants, how to extend it. It NEVER
   narrates the path that led there. Changelogs, per-phase narratives, "what this used to be",
   superseded designs, and enumerations of past versions are BANNED from every file under `app/**` and
   `web/src/**`. History already has two homes an agent can query on demand — `git log` and the decision
   journal (`$DOCS/Журнал/`) — and duplicating it into docstrings actively HARMS the extending agent:
   it buries the current contract under dead prose, and it grows without bound (every phase appends a
   paragraph; every agent of every later phase then pays to read it — the cost compounds quadratically).
   Concretely banned in code: the tokens `Фаза-NN` / `ДРЕЙФ-NN` used as narrative, `superseded`,
   `legacy`, `RETROSPECTIVE`, `prior standing value was`, "the phase that introduced this", lists of
   past version literals, and any `history:` / `changelog:` docstring section.
   Correct — a manifest that stands alone in the present tense:
   `contract: PRODUCT_VERSION is a semver string; the ONLY place the literal appears; GET /api/version returns exactly this value.`
   Incorrect — the same manifest followed by 800 lines retelling what each past phase changed and which
   value the constant used to hold.
   Pointing at a phase document as the SPEC a unit implements is allowed ONLY in the terse pointer form
   `spec: Фазы/Фаза-23-самость.md` — a reference, never a retelling. When you edit a file that already
   carries such history, DELETE the historical prose rather than appending to it.
11. **The concrete shapes point 0 bans over a model's output** — recognise them on sight, in code and in
   review: a language/script check (Cyrillic ratio, forbidden-alphabet list), a length or similarity
   floor, a word-list/regex/substring test on model text, a quality score, a retry of the same call
   because the answer "looked wrong", a silent swap to another model or capability, a "safe default"
   substituted for a model's answer. All of these decide about the MEANING or QUALITY of text, which is
   the architecture's standing decision «смысл текста судит модель, а не код»; code keeps only counting
   and normalization that feed a mechanism the design names (token budgets, vector similarity, canonical
   keys, maturity counters). If a real failure mode genuinely needs a mechanism, it goes into the design
   documents FIRST and is shown to the owner in the chat feed — a line in the pass log is not visibility.
   A silent invented safeguard is a BLOCKER even when it "works": the owner cannot debug a mechanism he
   was never told exists, and it eventually misfires on a path its author never considered.

When a human-ergonomics convention (short names, "self-evident" code, minimal comments, idiomatic
terseness) conflicts with these points, the doctrine wins. The reviewer rejects human-oriented
"cleanups" that reduce explicitness or machine-readability. And when the doctrine's own points 1–11
pull toward MORE code than the criteria need, point 0 wins over them.
