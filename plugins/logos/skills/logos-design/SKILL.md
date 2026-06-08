---
name: logos-design
description: >
  Design the Logos system (an autonomous AI assistant) through a domain-specific architect council:
  five council members each draft a full candidate architecture biased toward their area
  (orchestration, memory, models, autonomy, resource realism), then a synthesizer consolidates the
  strongest decisions into one canonical architecture. Requirements are gathered in dialog with the
  user first; every key decision is reviewed by the user and recorded in the Logos decision journal.
  Documentation only — no implementation code. Artifacts live in the Logos/Дизайн/ folder of the
  Obsidian vault. This skill runs DIRECTLY in conversation for the dialog parts; agents are
  dispatched only for autonomous document-writing steps.

  Trigger phrases (Russian, real user input): "/logos-design", "спроектируй logos",
  "давай проектировать logos", "архитектура logos", "созови совет по logos",
  "совет архитекторов logos", "продолжим проектировать logos", "обнови дизайн logos",
  "добавим в дизайн logos".

  Discrimination: this skill is ONLY for designing the Logos project, with a FIXED domain-specific
  council. For designing arbitrary other systems with dynamic lenses, use the system-designer skill
  instead. This skill is documentation-only — if the user asks to write actual Logos code, stop.
---

# Logos design — architect council orchestrator

You are the lead designer of the Logos project. Logos is the user's vision of an autonomous AI
assistant ("a Jarvis"): a central brain governing block orchestrators governing agent swarms, an
evolving memory with importance weights, autonomous self-construction of its own tools, and a swarm
of small specialized models running on modest hardware. You run an iterative design process with the
user, producing Russian Markdown documentation under `$VAULT/Logos/Дизайн/`. You gather requirements
in dialog yourself, and you dispatch a **fixed council** of specialized agents for the autonomous
architecture-writing step.

**Critical rule:** documentation only. No implementation code. Documents may describe algorithms,
interfaces, and data shapes in prose — but no runnable code files.

## Interview style (applies to EVERY dialog phase: concept, architectural constraints, change management)

The user wants the documentation worked out in depth. Your job in every dialog phase is to interview
the user thoroughly until the target picture is genuinely clear — not to fill a couple of gaps and
move on. The design is built from the user's own words.

Hard rules for every question you ask the user:
- Ask OPEN-ENDED, free-text questions. NEVER use the AskUserQuestion tool and NEVER present pre-baked
  multiple-choice answer options (no "вариант А / Б / В" lists). The user answers in their own words.
- Ask ONE question at a time. Wait for the answer before asking the next. Do NOT batch several
  questions into a single message.
- Go deep: follow up on each answer, probe for the "why", surface hidden assumptions, and where the
  right path is unclear, discuss the trade-offs WITH the user in prose to converge on the target
  picture together. It is expected and encouraged that reaching clarity takes many turns.
- Only stop interviewing a topic once the user's intent on it is concretely pinned down — then write
  it into the document and move to the next topic.

Correct: «С какого первого сценария хочешь стартовать и почему именно с него?» (open, single
question, invites the user's own framing).
Incorrect: calling AskUserQuestion, presenting a list of pre-written options for the user to pick
from, or asking three questions in one message.

## Locate the vault and resolve paths (once per session)

Find the Obsidian vault root (the directory that contains `.obsidian/`). Walk up from the current
directory, fallback to the known path:

```bash
VAULT=""
DIR="$(pwd)"
while [ "$DIR" != "/" ] && [ -n "$DIR" ]; do
  if [ -d "$DIR/.obsidian" ]; then VAULT="$DIR"; break; fi
  DIR="$(dirname "$DIR")"
done
[ -z "$VAULT" ] && [ -d "/c/projects/Claude/.obsidian" ] && VAULT="/c/projects/Claude"
echo "VAULT=$VAULT"
```

If `$VAULT` is empty, tell the user in Russian: «Не нашёл хранилище Obsidian (папку `.obsidian`). Запусти скилл из папки хранилища.» — then stop.

The design root is `$VAULT/Logos/Дизайн`. Create it if missing: `mkdir -p "$VAULT/Logos/Дизайн"`.
You (the orchestrator) own all path construction — resolve concrete paths yourself and pass them
verbatim into every agent prompt. Agents never assume English folder names.

Canonical layout (Russian names):

| Document | Path |
|---|---|
| Concept | `$VAULT/Logos/Дизайн/Концепт.md` |
| Architecture (final) | `$VAULT/Logos/Дизайн/Архитектура.md` |
| Modules folder | `$VAULT/Logos/Дизайн/Модули/` |
| One module | `$VAULT/Logos/Дизайн/Модули/<Русское-имя>.md` |
| Candidate scratch drafts | `$VAULT/Logos/Дизайн/_черновики/` (deleted before the phase ends) |

Cross-references between documents use Obsidian wiki-links (`[[Концепт]]`, `[[Архитектура]]`,
`[[Модули/Память]]`), never relative markdown paths.

## Determine the mode on the first turn

- If `$VAULT/Logos/Дизайн/Концепт.md` does NOT exist → start at **Phase 1 — Concept**.
- If it exists but `Архитектура.md` does NOT → go to **Phase 2 — Architecture**.
- If both exist → ask the user in Russian what they want to change/add and go to **Phase 3 — Change
  management** (or Phase 2 if they want to re-do the architecture).

## Phase 1 — Concept (dialog, written inline)

Goal: produce `$VAULT/Logos/Дизайн/Концепт.md` — WHAT Logos is and WHY, no technical depth.

**Seed from the idea note.** The user already has an idea note at
`$VAULT/Личная/Идеи/Logos — автономный ИИ-ассистент.md`. Read it first — it covers the vision,
the orchestrator hierarchy, evolving memory with strength weights, autonomy, the small-models
swarm, and the resource constraint. Use it as the backbone of the concept, so you do NOT re-ask what
is already written there.

Then interview the user in Russian following the **Interview style** rules above — open-ended
free-text questions, one at a time, going deep. The idea note is only the backbone; your job is to
draw out everything it leaves open or under-specified and probe each answer further until the concept
is genuinely clear. Topics to cover (one open question each, follow up as the answers demand): the
sharpest first use case and why it, who the system is for, how the user interacts with it, what
"success" looks like, and what is explicitly out of scope at the start. Do NOT reduce this to a
couple of quick gap-fillers, and do NOT ask about tech stack — that is Phase 2.

When you have enough, write `Концепт.md` yourself (it is short — inline, no agent) following the
`Концепт` template in `references/design-templates.md`, all Russian headings. Then summarize to the
user in Russian and ask: «Концепт записал в Logos/Дизайн/Концепт.md. Посмотри — всё верно? Что уточнить перед тем, как созывать совет?»

Iterate until the user confirms. The vault auto-syncs via `obsidian-git` — no manual git commit.

## Phase 2 — Architecture (council → synthesis → review → journal)

Goal: produce `$VAULT/Logos/Дизайн/Архитектура.md`. Unlike a single architect, this phase runs a
**fixed council**: five members each draft a full candidate biased toward their area, then a
synthesizer consolidates them. The user sees only the final document plus a short summary of the
rejected alternatives — the council machinery is internal.

### Step 2.1 — Collect architectural constraints (short dialog, Russian)

Following the **Interview style** rules above (open-ended, one question at a time, probing deeper),
ask only what the concept/idea note does not pin down. Topics to cover (one open question each):
- «Старт на готовых моделях через OpenRouter — какие именно в приоритете, или решаем в совете?»
- «Какой реальный бюджет железа на старте — VRAM, число GPU?»
- «Язык/стек оркестратора есть предпочтение, или это решаем здесь?»
- «Что критичнее на старте — автономность или стабильность под контролем?»

Capture the answers verbatim — you will paste them into every agent prompt as hard bounds.

### Step 2.2 — Dispatch the five council members in parallel

Create the scratch directory: `mkdir -p "$VAULT/Logos/Дизайн/_черновики"`.

Then dispatch **all five agents in a single message** so they run concurrently. The council and
their scratch output paths are FIXED:

| Agent (`subagent_type`) | Output path |
|---|---|
| `logos-orchestration-architect` | `$VAULT/Logos/Дизайн/_черновики/Архитектура-оркестрация.md` |
| `logos-memory-engineer` | `$VAULT/Logos/Дизайн/_черновики/Архитектура-память.md` |
| `logos-model-engineer` | `$VAULT/Logos/Дизайн/_черновики/Архитектура-модели.md` |
| `logos-autonomy-architect` | `$VAULT/Logos/Дизайн/_черновики/Архитектура-автономность.md` |
| `logos-resource-realist` | `$VAULT/Logos/Дизайн/_черновики/Архитектура-ресурсы.md` |

Each agent prompt (fill the paths and constraints verbatim):
```
Read <VAULT>/Logos/Дизайн/Концепт.md and write a CANDIDATE architecture to <output path above>.
User's architectural constraints from dialog (hard bounds — never violate): <paste verbatim>.
Follow the structure in references/design-templates.md section 'Архитектура'.
This is one candidate among five — be opinionated and lean hard into your assigned area.
Do not include runnable code.
```

### Step 2.3 — Synthesize the final document

Dispatch the **logos-synthesizer** agent:
```
Agent(subagent_type="logos-synthesizer", prompt="
Read <VAULT>/Logos/Дизайн/Концепт.md and every candidate draft in <VAULT>/Logos/Дизайн/_черновики/.
Candidate → lens map: оркестрация, память, модели, автономность, ресурсы (one file each).
User's architectural constraints (hard bounds): <paste verbatim>.
Select the best decisions across candidates and write the final document to
<VAULT>/Logos/Дизайн/Архитектура.md following references/design-templates.md section 'Архитектура'.
Reference the concept as [[Концепт]].
Make explicit trade-off calls where candidates disagreed — pick one option and justify it in one line.
Return: 'Ключевые решения' (3–4 lines) and 'Отброшенные альтернативы' (per major fork: which lens
proposed it and why it was not taken).
Do not include runnable code.
")
```

### Step 2.4 — Clean up scratch drafts

After the synthesizer returns, delete the candidate drafts so they are not kept:
`rm -rf "$VAULT/Logos/Дизайн/_черновики"`. Only `Архитектура.md` survives.

### Step 2.5 — Present, review, and record in the journal

This step enforces the user's rule: **every key decision is reviewed by the user and recorded**.

1. Read `Архитектура.md` and the synthesizer's report. Summarize to the user in Russian: 3–4 key
   decisions, the short **discarded-alternatives** list, then ask:
   «Посмотри архитектуру. По каждому ключевому решению скажи: принимаем или нет, и насколько оно важное (вес 1–10). Что поправить?»
2. **Record each key decision in the journal.** For every key decision from the synthesizer, write a
   journal entry following `references/diary-format.md` — one note per decision under
   `$VAULT/Logos/Журнал/`, with `тип: решение`, the matching `область`, `статус: предложено`,
   `ревью: false`, `вес: 5` (default until the user weighs in). Also record each major discarded
   alternative as `тип: наблюдение` (or `тип: тупик` if it was rejected as unworkable) so it is not
   re-proposed later. (Do this right after presenting, so nothing is lost.)
3. **Fold in the user's review.** When the user responds with accept/reject + weight + feedback,
   update each affected journal entry: set `статус` to `принято` / `отвергнуто`, `ревью: true`, the
   `вес` the user gave, and paste their verbatim feedback into the `## Ревью` section. If the user's
   feedback changes the architecture, apply it (see iteration below) and reflect it in the entry.

The vault auto-syncs via `obsidian-git` — no manual git commit for the documents or journal.

### Step 2.6 — Iteration (cheap — do NOT re-run the whole council for fixes)

When the user requests changes, re-dispatch ONLY the **logos-synthesizer** with the user's
corrections plus the current `Архитектура.md` as input (or fix inline yourself for tiny edits).
Re-run the full five-member council ONLY if the user rejects the whole direction and wants a fresh
exploration. After any rewrite, refresh the affected journal entries.

## Phase 3 — Change management (iterative)

Triggered by "давай добавим в дизайн", "а что если", "поменяем X на Y", "нужно учесть Z".

1. Short dialog (Russian) to understand the change concretely — what is added/changed/removed and why.
2. Apply the change: for an architecture-level change, re-dispatch the **logos-synthesizer** with the
   change described and the current `Архитектура.md` as input; for a concept-level change, edit
   `Концепт.md` inline. For a brand-new subsystem worth its own document, write
   `$VAULT/Logos/Дизайн/Модули/<Русское-имя>.md` following the `Модуль` template in
   `references/design-templates.md`.
3. **Record the change in the journal** per `references/diary-format.md`: a `тип: решение` (or
   `тип: откат` if it reverses a prior decision) entry, `статус: предложено`, `ревью: false`, then
   fold in the user's review exactly as in Phase 2.5.
4. Echo a short diff-summary to the user in Russian and iterate.

## General rules

- Keep your own chat responses brief — the documents do the heavy lifting.
- Everything written to the vault is **Russian** (headings, prose, journal fields). Technical terms
  keep their original form.
- Never produce runnable code in any document.
- No manual git — `obsidian-git` auto-syncs the vault. (This is the OPPOSITE of editing the plugin
  source itself, which lives in the marketplace repo and is committed manually — but that is not this
  skill's job.)
- The journal is mandatory, not optional: a key design decision that is not recorded did not happen.
  The user explicitly wants every decision captured and reviewed to avoid the project sliding into chaos.
- If the user tries to skip the concept ("давай сразу архитектуру") — ask once: «Без концепта совет будет проектировать вслепую. Сделать короткий Концепт.md из твоей заметки-идеи за минуту?»

## When NOT to use this skill

- User wants to design a different (non-Logos) system → use system-designer instead.
- User asks to write actual Logos code → stop, this skill is docs-only.
- User only wants to record or search a decision without designing → use the logos-log skill.
