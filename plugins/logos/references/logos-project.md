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

## 2. Paths: locating the vault and the code repo

Every tool resolves these paths on every run — this section is the ONLY copy of the vault search in
the plugin; other files point here instead of repeating it. Find the Obsidian vault root (the
directory containing `.obsidian/`), then derive the code repo as its sibling `Logos/` directory. The
vault is found BY CONTENT, in three widening steps — never from a hardcoded path, because the vault
has moved before and a stale hardcoded path fails silently:

```bash
VAULT=""
DIR="$(pwd)"
# 1. Walk up — finds the vault when a tool runs from inside it.
while [ "$DIR" != "/" ] && [ -n "$DIR" ]; do
  if [ -d "$DIR/.obsidian" ]; then VAULT="$DIR"; break; fi
  DIR="$(dirname "$DIR")"
done
# 2. Scan every level one directory deep. REQUIRED, not a nicety: the code repo is the vault's
#    SIBLING, never its child, so walking up from the code repo can never reach the vault. A
#    candidate must hold BOTH `.obsidian/` and `Logos/`, so an unrelated vault is not picked up.
if [ -z "$VAULT" ]; then
  DIR="$(pwd)"
  while [ "$DIR" != "/" ] && [ -n "$DIR" ]; do
    for CANDIDATE in "$DIR"/*/; do
      if [ -d "$CANDIDATE/.obsidian" ] && [ -d "$CANDIDATE/Logos" ]; then VAULT="${CANDIDATE%/}"; break; fi
    done
    [ -n "$VAULT" ] && break
    DIR="$(dirname "$DIR")"
  done
fi
# 3. Last resort — the usual project roots, scanned the same way and matched the same way (by
#    content). Renaming or moving the vault inside these roots keeps working.
if [ -z "$VAULT" ]; then
  for CANDIDATE in /c/projects/*/ "$HOME"/*/; do
    if [ -d "$CANDIDATE/.obsidian" ] && [ -d "$CANDIDATE/Logos" ]; then VAULT="${CANDIDATE%/}"; break; fi
  done
fi

DOCS="$VAULT/Logos"                 # design docs, phases, journal (vault, auto-synced)
CODE="$(dirname "$VAULT")/Logos"    # code repo, e.g. /c/projects/Logos
echo "VAULT=$VAULT  DOCS=$DOCS  CODE=$CODE"
```

Never replace this search with a literal path, and never "simplify" it back to the walk-up alone —
the walk-up alone resolves nothing when a tool is invoked from the code repo, which is the normal case.

If `$VAULT` is empty, tell the user in Russian: «Не нашёл хранилище Obsidian (папку `.obsidian`).
Запусти из папки хранилища.» — then stop.

Canonical documentation paths (Russian names — never assume English folder names):

| Document | Path |
|---|---|
| Concept | `$DOCS/Дизайн/Концепт.md` |
| Architecture (source of truth for the build) | `$DOCS/Дизайн/Архитектура.md` — the hub (обзор, ключевые решения, карта архитектуры, потоки данных, «Стек и инфраструктура», риски); the domain sections are separate pages in the folder `$DOCS/Дизайн/Архитектура/` (`Иерархия-оркестрации.md`, `Подсистема-памяти.md`, `Модельный-слой.md`, `Автономность.md`, `Ресурсный-бюджет.md`). That folder also holds a folder note `Архитектура/Архитектура.md` that is NOT the document, so the bare wikilink `[[Архитектура]]` is ambiguous — link the hub as `[[Дизайн/Архитектура]]` |
| Web-interface spec | the folder `$DOCS/Дизайн/Веб-интерфейс/`: the hub `Веб-интерфейс.md` inside it (shell, navigation, shared components, cross-cutting flows) plus one module document per screen (`Чат.md`, `Метрики.md`, `Память.md`, `Панель-управления.md`, `Уведомления.md`) and `Контракты-с-системой.md` |
| Phases folder | `$DOCS/Дизайн/Фазы/` |
| One phase | `$DOCS/Дизайн/Фазы/Фаза-NN-<имя>.md` |
| Decision journal | `$DOCS/Журнал/` (format in `${CLAUDE_PLUGIN_ROOT}/references/diary-format.md`) |

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
- **The code repo carries its own `CLAUDE.md`** at `$CODE/CLAUDE.md` holding ONLY what the repo alone
  knows (where the docs live, the stands, how to run the tests, which agent does what) plus a pointer to
  the `logos-doctrine` skill for the doctrine. It NEVER restates the doctrine — the doctrine has ONE
  home, that skill; a copy drifts (the repo once carried an eight-point copy while the doctrine had
  eleven). The orchestrator creates it on bootstrap; nobody pastes §4 into it.
- **Manual git for code.** The code repo is committed and pushed by the build tools with Russian
  commit messages (this is the OPPOSITE of the vault, which auto-syncs). Branch per phase; never
  force-push; never commit secrets (API keys for the model gateway live in untracked config / env).

## 4. The doctrine — code for AI, not for humans

The doctrine lives in the skill `logos-doctrine` (`${CLAUDE_PLUGIN_ROOT}/skills/logos-doctrine/SKILL.md`)
and is preloaded into every build agent; its points are numbered 0–11 and cited as «§4 point N»
throughout this plugin.

## 5. Phase-driven workflow (how a phase becomes code)

Logos is built one **delivery phase** at a time. Phases are defined by the `logos-phases` skill in
`$DOCS/Дизайн/Фазы/`; each is a finished, end-to-end, hand-testable slice (Фаза-00 is the MVP-zero:
a text web-chat over one hard-wired model with a diagnostic log panel). The build pipeline for one
phase, orchestrated by `logos-build`:

1. **Read the spec** — the phase file + the architecture sections it touches. The phase's «Критерии
   готовности» are the acceptance tests; «Что НЕ входит» are hard scope boundaries.
2. **Implement** — `logos-coder` writes the code per the doctrine, routing each layer to its stack;
   it also bumps the product version per §9 (plain semver BY THE MEANING of the release, decoupled from the phase number).
3. **Review** — `logos-reviewer` checks the diff against the architecture docs AND the doctrine — first
   of all §4 point 0: every mechanism the diff adds must be one the spec names, and the reviewer names
   what the diff could DELETE.
4. **Test** — `logos-test-writer` writes machine-checkable tests covering the «Критерии готовности» —
   the criteria, not every internal branch.
5. **DevOps + local deploy** — `logos-devops` makes the phase runnable (containers/run scripts/infra)
   per the stack AND deploys the new version to the LOCAL stand (build + (re)start) so the running
   system serves the just-built version. Runs BEFORE QA — automatic; the user never asks for it.
6. **QA** — `logos-qa` first checks the running stand serves the new `PRODUCT_VERSION`
   (`GET /api/version`; redeploy via `logos-devops` if stale), then exercises the phase end-to-end
   against its «Критерии готовности».
7. **Sync + record** — `logos-sync` audits code-vs-docs drift; the orchestrator updates the phase
   `статус` and writes a journal entry per `${CLAUDE_PLUGIN_ROOT}/references/diary-format.md`.

**How findings are routed — the rule that keeps §4 point 0 from eroding one fix at a time.** A review,
QA or sync finding is fixed in code ONLY when it is a bug in what the spec asked for. Three classes of
finding never go to a coder as "add a mechanism":
- **A model behaved badly** (wrong language, a stub, a hallucinated capability, ignored an instruction)
  → reported to the OWNER as a model-quality observation; his remedy is a different model in «Панель
  управления» or a prompt change he approves — never code around the model.
- **A provider or infrastructure hiccup** (timeout, 429, 5xx, empty completion) → the provider's own
  documented retry, and beyond that an honest error the owner sees; never a new fallback path.
- **"It crashed / an exception escaped"** → the fix is to SHOW the failure to the owner honestly, never
  to swallow it into a log and continue.
If a fix genuinely requires a mechanism the spec does not name, the orchestrator STOPS and asks the owner
in one open Russian question; on his yes the design document is updated FIRST, then the code.
**Drift resolution default:** when `logos-sync` finds a mechanism in the code that no design document
names, the CODE is the wrong side by default — it is deleted, not written into the documents. Documents
absorb code only on the owner's explicit decision (recorded in the journal).
**Every phase asks what to delete:** the reviewer names removable code in every review, and the
orchestrator carries those deletions into the same phase rather than leaving them "for later".

## 6. Status field on a phase document

A phase document's frontmatter carries `статус`. The build pipeline advances it:
`планируется` → `в работе` (when implementation starts) → `готово` (when the «Критерии готовности»
pass QA and sync is clean). If a phase is blocked, set `статус: заблокирована` and record why in the
journal. Only `logos-build` / `logos-sync` change a phase's build status; the `logos-phases` skill
owns its initial creation.

## 7. Recording build work in the journal

Every significant build decision or outcome is recorded in the Logos decision journal exactly like
design decisions — one note per event under `$DOCS/Журнал/`, format in
`${CLAUDE_PLUGIN_ROOT}/references/diary-format.md`.
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
- **Version by MEANING, DECOUPLED from the phase number.** The number moves by the SUBSTANCE of the
  release, never by a phase counter: **MAJOR** — a large or incompatible leap; **MINOR** — a notable new
  capability; **PATCH** — a bugfix or small in-phase change. A phase is NOT `готово` until
  `PRODUCT_VERSION` reflects the release it delivered. (The early history `0.1.0`…`0.34.0` happened to
  track phase numbers — that was a documentation drift corrected in Фаза-34, not the rule. Do NOT set
  `0.NN.0` from the phase number.)
- **PATCH = an in-phase fix.** Any shipped change AFTER a phase was built — a bugfix, a conformance
  fix, a touch-up that is NOT a new phase — bumps the PATCH: `0.3.0` → `0.3.1` → `0.3.2` … . This holds
  even for a change made by a direct `logos-coder` dispatch outside a full phase build: **if you ship
  code to the repo, you bump the version.**
- **MAJOR rises on a large/incompatible leap.** The first real release on the owner's own machine —
  `1.0.0` — shipped in Фаза-34 (exit from pre-release), so MAJOR is no longer pinned to 0. A further
  MAJOR bump is a deliberate call on the substance of the change, never mechanical.
- **Who bumps it.** The bump is a one-line edit to `version.py`, made by `logos-coder` as part of the
  change (the orchestrator never writes production code). `logos-build` VERIFIES the version reflects
  the build before it commits and before it marks a phase `готово`; if the bump was missed, it sends
  `logos-coder` back to do only the bump.
- **`version.py` holds the literal and its rule — NOTHING else.** It is a SHORT file (tens of lines):
  the constant, its contract, its invariants, and the semver-by-meaning rule above. It is NOT a
  changelog. Never append a per-phase narrative, a `history:` section, a "what the previous value was"
  note, or a summary of what a phase delivered — that is a §4 point-10 violation and it is what let this
  one-constant file bloat past 800 lines. What each phase delivered belongs to the journal
  (`$DOCS/Журнал/`) and the commit message; the version's own history is `git log gateway/app/version.py`.
  When you bump the version, you CHANGE the literal — you do not add to a story.
- **Must NOT.** Never duplicate the literal, never auto-derive it from git tags / CI, never add
  per-layer versions. It stays one manual literal in `version.py`.

## 10. The research branch — Исследования + Logos-Lab (founded 2026-08-12)

Logos has a SEPARATE research branch: moving away from big LLMs toward a swarm of small
specialized self-learning models on cheap hardware (tiny recursive models, continual learning,
ternary networks, neuromorphic hardware). It deliberately does NOT mix with the production
system's development — different docs, different repo, different discipline.

- **Documentation:** `$DOCS/Исследования/` in the vault — `Концепт-исследований.md` (goal,
  hypotheses, constraints), `Направления/` (one note per research direction), `Эксперименты/`
  (the experiment diary: one note = one experiment, hypothesis written BEFORE the code), and
  `Анализ/` (summary reviews over the branch: what the experiments so far add up to and the
  course set from them; one note = one dated review, `ГГГГ-ММ-ДД-<слаг>.md`, past reviews are
  never rewritten). On-disk format: `${CLAUDE_PLUGIN_ROOT}/references/lab-format.md`.
- **Code:** the SEPARATE repo `Logos-Lab` (`git@github.com:lopatuxin/Logos-Lab.git`), locally
  the vault's sibling `Logos-Lab/` next to the main code repo. One root folder = one
  experiment, named as its diary note slug.
- **Discipline differs by design.** The production rules of this reference — the §4 doctrine's
  production overhead, §5 phase pipeline, §9 product semver, the mandatory full test suite —
  do NOT apply in `Logos-Lab`. Research code is disposable; that is normal there. Russian
  commits and no-secrets-in-git still hold.
- **Diary vs journal.** The experiment diary (`$DOCS/Исследования/Эксперименты/`) is NOT the
  decision journal (`$DOCS/Журнал/`): the journal records PROJECT decisions (including the
  decision that this branch exists, and any matured conclusion entering the main design); the
  diary records the branch's hypothesis→result loop. `logos-log` owns the journal; the
  **`logos-lab` skill owns the diary** (record / outcome / search / direction notes).
- **Routing.** `logos-chat` routes research-branch work (record an experiment, append a
  result, search the diary, maintain directions) to `logos-lab`. The build tools
  (`logos-build`, `logos-coder`, `logos-qa`, `logos-sync`, …) never touch `Logos-Lab` or
  `$DOCS/Исследования/` — drift audits and phase pipelines apply to the production system
  only.
