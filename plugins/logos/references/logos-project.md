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
2. **Machine-readable self-description.** Every module, agent, tool, and capability carries a
   structured manifest (schema / declared inputs-outputs / contract / capabilities / invariants) that
   an LLM can read to understand and extend the unit *without reading all of its code*. This mirrors
   Logos's own autonomy layer, where the system registers and reasons about its own tools.
3. **Uniformity over brevity or cleverness.** The same problem is solved the same way everywhere, so
   an agent can pattern-match across the codebase. Regular, repetitive, predictable structure beats a
   terse clever one-off. Never optimize for fewer lines at the cost of predictability.
4. **Comments and docstrings are LLM context, not a human tutorial.** Dense, factual, structured:
   what this unit does, its contract, its invariants, how to extend it, what it must NOT do. No
   onboarding narrative, no motivational prose. Write them for the future agent that will modify this
   file with no other context.
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

When a human-ergonomics convention (short names, "self-evident" code, minimal comments, idiomatic
terseness) conflicts with these eight points, the doctrine wins. The reviewer rejects human-oriented
"cleanups" that reduce explicitness or machine-readability.

## 5. Phase-driven workflow (how a phase becomes code)

Logos is built one **delivery phase** at a time. Phases are defined by the `logos-phases` skill in
`$DOCS/Дизайн/Фазы/`; each is a finished, end-to-end, hand-testable slice (Фаза-00 is the MVP-zero:
a text web-chat over one hard-wired model with a diagnostic log panel). The build pipeline for one
phase, orchestrated by `logos-build`:

1. **Read the spec** — the phase file + the architecture sections it touches. The phase's «Критерии
   готовности» are the acceptance tests; «Что НЕ входит» are hard scope boundaries.
2. **Implement** — `logos-coder` writes the code per the doctrine, routing each layer to its stack.
3. **Review** — `logos-reviewer` checks the diff against the architecture docs AND the doctrine.
4. **Test** — `logos-test-writer` writes machine-checkable tests covering the «Критерии готовности».
5. **QA** — `logos-qa` exercises the phase end-to-end against its «Критерии готовности».
6. **DevOps** — `logos-devops` makes the phase runnable (containers/run scripts/infra) per the stack.
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
