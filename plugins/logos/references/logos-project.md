# Logos project — canonical build context

This reference is the single source of truth about WHERE Logos lives, HOW its code must be
written, and HOW code and documentation stay in sync. Every Logos build tool — the `logos-build`
orchestrator skill and the `logos-coder` / `logos-reviewer` / `logos-test-writer` / `logos-qa` /
`logos-devops` / `logos-sync` agents — reads this file and follows it verbatim. The design skills
(`logos-design`, `logos-phases`, `logos-ui`, `logos-log`) also point here so the whole plugin shares
one picture of the project.

Logos is the user's autonomous AI assistant ("a Jarvis"): a central brain governing block
orchestrators governing agent swarms, an evolving weighted memory, autonomous self-construction of
its own tools, and a swarm of small specialized models on modest hardware. This plugin's design half
produces the documentation; this build half turns that documentation into running code.

## 1. The two locations (and the one rule that binds them)

| Thing | Location | Git |
|---|---|---|
| **Code** | `<code-repo>` — the Logos source repository | remote `git@github.com:lopatuxin/Logos.git`, committed manually by the build tools |
| **Documentation** | `<vault>/Logos/` in the Obsidian vault (design, phases, journal) | auto-synced by `obsidian-git` — never `git commit` the vault by hand |

**The binding rule — documentation is the source of truth.** Code implements what the design
documents specify. Code never silently diverges from the docs: if the code must do something the
docs do not describe (or contradict), that is a *drift*, and it is resolved by either changing the
code to match the docs or recording a decision and updating the docs — never by leaving them
disagreeing. `logos-sync` audits this; the orchestrator enforces it after every phase.

## 2. Resolve the paths (every run, by every tool)

Find the Obsidian vault root (the directory containing `.obsidian/`), then derive the code repo as
its sibling `Logos/` directory. Walk up from the current directory, with a fallback to the known
machine path:

```bash
VAULT=""
DIR="$(pwd)"
while [ "$DIR" != "/" ] && [ -n "$DIR" ]; do
  if [ -d "$DIR/.obsidian" ]; then VAULT="$DIR"; break; fi
  DIR="$(dirname "$DIR")"
done
[ -z "$VAULT" ] && [ -d "/c/projects/Claude/.obsidian" ] && VAULT="/c/projects/Claude"

DOCS="$VAULT/Logos"                 # design docs, phases, journal (vault, auto-synced)
CODE="$(dirname "$VAULT")/Logos"    # code repo, e.g. /c/projects/Logos
echo "VAULT=$VAULT  DOCS=$DOCS  CODE=$CODE"
```

If `$VAULT` is empty, tell the user in Russian: «Не нашёл хранилище Obsidian (папку `.obsidian`).
Запусти из папки хранилища.» — then stop.

Canonical documentation paths (Russian names — never assume English folder names):

| Document | Path |
|---|---|
| Concept | `$DOCS/Дизайн/Концепт.md` |
| Architecture (source of truth for the build) | `$DOCS/Дизайн/Архитектура.md` |
| Web-interface spec | `$DOCS/Дизайн/Веб-интерфейс.md` |
| Phases folder | `$DOCS/Дизайн/Фазы/` |
| One phase | `$DOCS/Дизайн/Фазы/Фаза-NN-<имя>.md` |
| Decision journal | `$DOCS/Журнал/` (format in `references/diary-format.md`) |

## 3. The code repository — bootstrap and layout

The `logos-build` orchestrator owns the code repo. On first run, if `$CODE` does not exist or is not
a git repo, it bootstraps it (clone the remote; if the remote is empty, `git init` + add the remote)
— see the orchestrator skill for the exact procedure. All other agents assume `$CODE` already
exists and operate inside it.

- **Polyglot by design.** Per `Архитектура.md` → «Стек и инфраструктура», Logos is *not* one
  language. "Под каждый слой — свой инструмент": the web frontend, the model gateway, the brain, the
  block orchestrators, the inference server may each use a different stack. Tools route work by
  *layer*, reading the architecture's stack section to decide — they never assume Java just because
  that is the user's day-job stack.
- **The code repo carries its own `CLAUDE.md`** at `$CODE/CLAUDE.md` pointing back at the vault docs
  as the source of truth and restating the doctrine in section 4, so any session opened directly in
  the code repo inherits the same rules. The orchestrator creates/refreshes it on bootstrap.
- **Manual git for code.** The code repo is committed and pushed by the build tools with Russian
  commit messages (this is the OPPOSITE of the vault, which auto-syncs). Branch per phase; never
  force-push; never commit secrets (API keys for the model gateway live in untracked config / env).

## 4. The doctrine — code for AI, not for humans

**The user will never read this code.** He stated it explicitly: do not spend any effort making the
code ergonomic, pretty, or approachable for a human reader. Optimize the code so that an LLM agent
can read it, understand it fully, and *extend* it later without breaking it. This doctrine is binding
on `logos-coder` (how to write) and `logos-reviewer` (what to enforce). Concretely:

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
   are stable and explicit; the core is closed for modification, open for extension.
6. **Inspectable by construction.** Structured logging/telemetry on every meaningful step (this is
   also the architecture's telemetry/diagnostic-panel requirement), so an agent can read *what
   actually happened* from machine-readable output, not guess.
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

When a human-ergonomics convention (short names, "self-evident" code, minimal comments, idiomatic
terseness) conflicts with these ten points, the doctrine wins. The reviewer rejects human-oriented
"cleanups" that reduce explicitness or machine-readability.

## 5. Phase-driven workflow (how a phase becomes code)

Logos is built one **delivery phase** at a time. Phases are defined by the `logos-phases` skill in
`$DOCS/Дизайн/Фазы/`; each is a finished, end-to-end, hand-testable slice (Фаза-00 is the MVP-zero:
a text web-chat over one hard-wired model with a diagnostic log panel). The build pipeline for one
phase, orchestrated by `logos-build`:

1. **Read the spec** — the phase file + the architecture sections it touches. The phase's «Критерии
   готовности» are the acceptance tests; «Что НЕ входит» are hard scope boundaries.
2. **Implement** — `logos-coder` writes the code per the doctrine, routing each layer to its stack;
   it also bumps the product version per §9 (`MINOR` = phase number for a phase build).
3. **Review** — `logos-reviewer` checks the diff against the architecture docs AND the doctrine.
4. **Test** — `logos-test-writer` writes machine-checkable tests covering the «Критерии готовности».
5. **DevOps + local deploy** — `logos-devops` makes the phase runnable (containers/run scripts/infra)
   per the stack AND deploys the new version to the LOCAL stand (build + (re)start) so the running
   system serves the just-built version. Runs BEFORE QA — automatic; the user never asks for it.
6. **QA** — `logos-qa` first checks the running stand serves the new `PRODUCT_VERSION`
   (`GET /api/version`; redeploy via `logos-devops` if stale), then exercises the phase end-to-end
   against its «Критерии готовности».
7. **Sync + record** — `logos-sync` audits code-vs-docs drift; the orchestrator updates the phase
   `статус` and writes a journal entry per `references/diary-format.md`.

## 6. Status field on a phase document

A phase document's frontmatter carries `статус`. The build pipeline advances it:
`планируется` → `в работе` (when implementation starts) → `готово` (when the «Критерии готовности»
pass QA and sync is clean). If a phase is blocked, set `статус: заблокирована` and record why in the
journal. Only `logos-build` / `logos-sync` change a phase's build status; the `logos-phases` skill
owns its initial creation.

## 7. Recording build work in the journal

Every significant build decision or outcome is recorded in the Logos decision journal exactly like
design decisions — one note per event under `$DOCS/Журнал/`, format in `references/diary-format.md`.
Use `тип: решение` for a build/stack/structure decision, `тип: эксперимент` for something tried,
`тип: наблюдение` for a recorded drift or a completed phase, `тип: тупик` for an approach proven
unworkable. Set `область` to the architecture layer touched (`оркестрация` / `память` / `модели` /
`автономность` / `ресурсы` / `общее`). The journal is mandatory: a build decision that is not
recorded did not happen.

## 8. Language

- **Code, identifiers, code comments, commit messages for the code repo** — written for the machine;
  identifiers and code in their natural (usually English) technical form, commit messages in Russian.
- **All vault content** (journal entries, doc edits) — Russian, technical terms keep their form.
- **All chat with the user** — Russian.

## 9. Product version — one semver, the build maintains it

Logos carries ONE product-wide semver `MAJOR.MINOR.PATCH`, and maintaining it is a MANDATORY,
non-skippable part of every change the build tools ship — never an afterthought. This is exactly what
the user means by «версионирование проекта»: the build must never leave the version stale.

- **Single source of truth.** The literal lives in EXACTLY one place — `$CODE/gateway/app/version.py`
  (`PRODUCT_VERSION`). Everything else reads it (the frontend via `GET /api/version`); never hard-code
  or duplicate the number anywhere else, and never introduce per-layer versions.
- **MINOR = phase number.** Building Фаза-NN sets the version to `0.NN.0` (Фаза-01 → `0.1.0`,
  Фаза-03 → `0.3.0`, …). A phase is NOT `готово` until `PRODUCT_VERSION` reflects its number.
- **PATCH = an in-phase fix.** Any shipped change AFTER a phase was built — a bugfix, a conformance
  fix, a touch-up that is NOT a new phase — bumps the PATCH: `0.3.0` → `0.3.1` → `0.3.2` … . This holds
  even for a change made by a direct `logos-coder` dispatch outside a full phase build: **if you ship
  code to the repo, you bump the version.**
- **MAJOR = 0.** The product is pre-release; the move to `1.0.0` is a separate, deliberate future
  decision, never mechanical.
- **Who bumps it.** The bump is a one-line edit to `version.py`, made by `logos-coder` as part of the
  change (the orchestrator never writes production code). `logos-build` VERIFIES the version reflects
  the build before it commits and before it marks a phase `готово`; if the bump was missed, it sends
  `logos-coder` back to do only the bump.
- **`version.py` holds the literal and its rule — NOTHING else.** It is a SHORT file (tens of lines):
  the constant, its contract, its invariants, and the MINOR=phase / PATCH=fix rule above. It is NOT a
  changelog. Never append a per-phase narrative, a `history:` section, a "what the previous value was"
  note, or a summary of what a phase delivered — that is a §4 point-10 violation and it is what let this
  one-constant file bloat past 800 lines. What each phase delivered belongs to the journal
  (`$DOCS/Журнал/`) and the commit message; the version's own history is `git log gateway/app/version.py`.
  When you bump the version, you CHANGE the literal — you do not add to a story.
- **Must NOT.** Never duplicate the literal, never auto-derive it from git tags / CI, never add
  per-layer versions. It stays one manual literal in `version.py`.
