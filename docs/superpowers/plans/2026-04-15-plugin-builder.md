# Plugin Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать централизованный плагин `plugin-builder` с двумя скиллами (create-plugin, extend-plugin) и одним Opus-агентом (improve-plugin), зарегистрировать в маркетплейсе, мигрировать существующие `improve-plugin` SKILL из `anton-toolkit` и `personal-strategist`.

**Architecture:** Один плагин с тремя компонентами. Диалоговые компоненты — скиллы на default model, реактивное исправление — агент на Opus. Общий reference-файл с правилами генерации, чтобы все три компонента применяли единые стандарты. Миграция — разовая операция в рамках этого плана: вынос логики из двух старых SKILL в новый агент + удаление дублей + инкремент версий у обоих старых плагинов.

**Tech Stack:** Claude Code plugin format (SKILL.md с YAML-frontmatter, agents/*.md с YAML-frontmatter, plugin.json, marketplace.json), git, Markdown, JSON, Node.js (для валидации JSON через `node -e`).

---

## Task 0: Подготовка окружения

**Files:** нет (только чтение)

- [ ] **Step 1: Убедиться, что рабочее дерево чистое, кроме ожидаемых untracked-файлов**

Run:
```bash
cd /c/projects/anton-toolkit && git status --short
```
Expected: либо пусто, либо только untracked `docs/` c existing файлами (plan, specs). Если есть изменения в `plugins/` или `.claude-plugin/` — остановиться и разобраться.

- [ ] **Step 2: Подтянуть свежие изменения с remote**

Run:
```bash
cd /c/projects/anton-toolkit && git pull --ff-only origin main
```
Expected: `Already up to date.` или fast-forward без конфликтов.

- [ ] **Step 3: Перечитать актуальные версии файлов, которые будут мигрированы**

Read:
- `plugins/anton-toolkit/skills/improve-plugin/SKILL.md` — полностью
- `plugins/personal-strategist/skills/improve-plugin/SKILL.md` — полностью
- `plugins/anton-toolkit/.claude-plugin/plugin.json` — текущая версия
- `plugins/personal-strategist/.claude-plugin/plugin.json` — текущая версия

Запомнить текущие версии для инкрементов в Task 7. Запомнить все триггер-фразы из обоих SKILL.md для переноса в агента в Task 5.

---

## Task 1: Создать структуру плагина и `plugin.json`

**Files:**
- Create: `plugins/plugin-builder/.claude-plugin/plugin.json`

- [ ] **Step 1: Создать plugin.json**

Write `plugins/plugin-builder/.claude-plugin/plugin.json`:

```json
{
  "name": "plugin-builder",
  "version": "0.1.0",
  "description": "Creates, extends, and fixes plugins in the anton-toolkit-marketplace. Task-centric interviews for creation and extension; Opus-powered agent for reactive fixes after in-session incidents.",
  "author": {
    "name": "Anton"
  }
}
```

- [ ] **Step 2: Валидация JSON**

Run:
```bash
cd /c/projects/anton-toolkit && node -e "JSON.parse(require('fs').readFileSync('plugins/plugin-builder/.claude-plugin/plugin.json', 'utf8'))" && echo OK
```
Expected: `OK` — JSON валидный.

- [ ] **Step 3: Коммит**

```bash
cd /c/projects/anton-toolkit
git add plugins/plugin-builder/.claude-plugin/plugin.json
git commit -m "$(cat <<'EOF'
Добавил базовый plugin.json для plugin-builder

Версия 0.1.0, описание с упором на три функции: создание, расширение, исправление плагинов.
EOF
)"
```

---

## Task 2: Написать `references/plugin-authoring.md` (общий справочник)

**Files:**
- Create: `plugins/plugin-builder/references/plugin-authoring.md`

Этот файл читается всеми тремя компонентами перед работой — содержит единые правила генерации. Пишется первым, потому что на него ссылаются скиллы и агент.

- [ ] **Step 1: Создать файл**

Write `plugins/plugin-builder/references/plugin-authoring.md`:

````markdown
# Plugin Authoring Reference

Shared conventions for all `plugin-builder` components. Read this **before** generating or modifying any plugin file.

## Language rule (critical)

- **Model-facing instructions** (SKILL.md body, agent body, references, YAML `description` field) — **English**. This reduces token cost and improves rule-following for the default Sonnet model.
- **User-facing dialogue** the skill/agent produces in chat (questions, confirmations, error messages, post-operation summaries) — **Russian**. The user does not read English.
- **Commit messages** — **Russian**.
- **Russian trigger phrases inside `description`** (e.g. `"коммит", "закоммить"`) stay Russian: they match real user input. The English prose around them describes the trigger condition.

## `plugin.json` schema

Minimal required fields:

```json
{
  "name": "<kebab-case-name>",
  "version": "0.1.0",
  "description": "<one-sentence English description>",
  "author": { "name": "Anton" }
}
```

- `name` must be unique within `.claude-plugin/marketplace.json`.
- Start new plugins at version `0.1.0`.
- `description` is one sentence, English, describes the plugin's purpose (not its implementation).

## Versioning (semver)

- **PATCH** (0.1.0 → 0.1.1): small fixes to existing skill/agent text, reformulations, typo fixes.
- **MINOR** (0.1.1 → 0.2.0): new skill, new agent, new reference file, or significant rework of an existing component.
- **MAJOR** (0.2.0 → 1.0.0): fundamental restructure, breaking removal of a public trigger (rare).

Every change that ships through git MUST bump the version — the marketplace caches by version.

## SKILL.md frontmatter

```yaml
---
name: <kebab-case-name>
description: >
  <English paragraph describing when to trigger this skill. Include 3+ concrete trigger
  phrases verbatim (Russian if the user speaks Russian). Include an anti-pattern clause
  if ambiguity with sibling skills is possible.>

  <Optional: explicit discrimination rules when sibling skills have overlapping triggers.>
---
```

Rules:
- `description` is what the model reads to decide whether to invoke the skill. It must be specific and unambiguous. Generic descriptions ("when the user wants to commit") do not trigger reliably.
- List at least 3 concrete trigger phrases. Prefer short, real phrases the user actually types.
- If two skills might both match, write an explicit discriminator: "Use this skill when X; if Y, use `<other-skill>` instead."
- For interview skills: add the line `This skill runs DIRECTLY in conversation. Do NOT launch agents for the interview part.` Agents lose context between turns and cannot do dialog.

## Agent frontmatter

```yaml
---
name: <kebab-case-name>
description: >
  <English paragraph describing when to trigger this agent. Same rules as skill description,
  plus: explicitly state that this agent runs autonomously, not in dialog.>
model: <opus|sonnet|haiku>  # optional; omit for session default
---
```

- Use `model: opus` for tasks requiring high precision (editing SKILL.md, agent text, rule reformulations). Sonnet is observably weaker on these.
- Use session default for most other tasks.
- Agents are autonomous one-shot workers. No multi-turn dialog inside an agent.

## Trigger phrases — good vs bad examples

**Good** (specific, literal, matches real user input):
- `"commit", "коммит", "закоммить", "сохрани изменения"`
- `"создай плагин", "нужен новый плагин", "хочу плагин для"`
- `"улучши плагин", "исправь скилл", "запомни это в плагине", "так не должно быть"`

**Bad** (abstract, paraphrased, vague):
- `"when the user wants version control"` — no concrete phrase
- `"handling plugin modifications"` — describes category, not trigger
- single-word triggers like `"fix"` — too broad, fires everywhere

## Pre-flight validation checklist

Run before every commit that touches plugin files:

1. All modified/created `*.json` parse as valid JSON.
2. `.claude-plugin/marketplace.json` has no duplicate plugin names.
3. All created/modified `SKILL.md` and `agents/*.md` files are non-empty (> 100 bytes).
4. Each SKILL.md `description` contains at least 3 explicit trigger phrases.
5. If any plugin file was modified, the corresponding `plugin.json` `version` is incremented.

If any check fails: do not commit. Report the specific failure to the user in Russian. Files stay on disk for the next pass.

## Git flow

Uniform for all three components:

```
git pull origin main
→ (file generation / modification)
→ (pre-flight validation — abort on failure)
git add <explicit file paths — never -A, never .>
git commit -m "<Russian message>"
git push
```

After successful push, report to user in Russian with the commit hash so rollback is possible: `git revert <hash> && git push` on the user saying "отмени" / "откати".

## File layout conventions

```
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   └── <skill-name>/
│       └── SKILL.md
├── agents/
│   └── <agent-name>.md
└── references/
    └── <topic>.md
```

- One SKILL.md per skill, each in its own subdirectory.
- Agents live as flat `*.md` files directly under `agents/`.
- References are flat under `references/`, named by topic (not by the component that reads them).
````

- [ ] **Step 2: Валидация — файл непустой, Markdown-валидный**

Run:
```bash
cd /c/projects/anton-toolkit && wc -c plugins/plugin-builder/references/plugin-authoring.md
```
Expected: > 3000 bytes.

- [ ] **Step 3: Коммит**

```bash
cd /c/projects/anton-toolkit
git add plugins/plugin-builder/references/plugin-authoring.md
git commit -m "$(cat <<'EOF'
Добавил общий справочник plugin-authoring.md для plugin-builder

Единые правила генерации плагинов: языковое разделение (инструкции английский, диалог русский), схема plugin.json, формат frontmatter для скиллов и агентов, версионирование, примеры хороших и плохих триггеров, чек-лист pre-flight валидации, git-флоу.
EOF
)"
```

---

## Task 3: Написать `skills/create-plugin/SKILL.md`

**Files:**
- Create: `plugins/plugin-builder/skills/create-plugin/SKILL.md`

- [ ] **Step 1: Создать файл**

Write `plugins/plugin-builder/skills/create-plugin/SKILL.md`:

````markdown
---
name: create-plugin
description: >
  Create a new plugin from scratch in the anton-toolkit-marketplace via a
  task-centric interview. Triggers when the user wants a plugin that does not
  yet exist. Example phrases: "создай плагин", "нужен новый плагин", "хочу
  плагин для", "сделай плагин, который", "создай инструмент".

  Discrimination: if the plugin the user mentions already exists in
  `plugins/<name>/`, delegate to `extend-plugin` (proactive modification) or
  `improve-plugin` (reactive fix after an incident). Only trigger when the
  plugin directory does not exist.

  This skill runs DIRECTLY in conversation. Do NOT launch agents for the
  interview part — agents lose context between turns and cannot do dialog.
---

# Create Plugin — guided plugin creation

Interview the user in Russian to understand the task the plugin should solve, then generate all plugin files (in English) and register the plugin in the marketplace.

**Before starting, read** `references/plugin-authoring.md` from this plugin. It contains language rules, frontmatter schemas, trigger-phrase examples, and the pre-flight validation checklist you will use.

## Phase 1 — Open prompt

Ask one broad Russian question and wait for the full answer. Do not ask anything else in this turn.

```
Расскажи, что за плагин и какую задачу он должен решать.
```

## Phase 2 — Parse the 4 required fields

Under the hood (no message to user yet), classify the answer against four fields:

1. **Задача** (task) — what problem is solved. Not "what it does" but "what's missing without it".
2. **Когда запускать** (trigger context) — in which situations the plugin should activate. Situations, not literal phrases — you'll derive phrases from this.
3. **Принцип работы** (principle) — how it works step by step, with critical rules ("always X", "never Y").
4. **Результат** (result) — what the user sees when the task is done.

For each field, grade: `covered` / `partially covered` / `not covered`.

## Phase 3 — Active clarification (one question per turn)

For each `partially covered` or `not covered` field, ask a targeted clarifying question in Russian. **One question per message.** Track progress using an HTML comment at the end of each of your messages — the user does not see it, and it prevents you from losing count:

```html
<!-- uncovered: [trigger_context, principle] -->
```

Clarification patterns:
- **Contradiction in user answers:** quote both conflicting statements, ask which is the real one.
- **Abstract phrasing:** "Приведи конкретный пример — какой это будет момент в твоей работе?"
- **Missing edge case:** "А если [situation] — что должно произойти?"
- **Missing anti-pattern:** "А в какой ситуации плагин НЕ должен срабатывать? Например, если я просто спрашиваю про X, а не прошу сделать?"

Do NOT advance to Phase 4 until all four fields are `covered`.

## Phase 4 — Russian recap, confirmation

Summarize in Russian what you understood, in ~5 sentences. Include a derived kebab-case name (your suggestion, based on the task). Ask for confirmation.

```
Понял так: задача — <...>. Запускается в ситуациях: <...>. Работает так:
1) <...>  2) <...>  3) <...>. Результат — <...>. Назвал плагин `<kebab-case>`.
Всё правильно?
```

If the user corrects something, go back to Phase 3 with the specific delta, not the whole interview.

## Phase 5 — Generate files

Decide component layout from the interview:

- **Dialog-driven behavior** (multi-turn) → **skill**.
- **Autonomous one-shot behavior** (no dialog needed) → **agent**.
- **Behavior requiring high precision** (editing text, strict formats) → agent with `model: opus`.
- Routine automation → default model.

Minimal plugin: `plugin.json` + one `SKILL.md` (or `agent.md`). Add more components only if the interview clearly requires them.

Generate, following `references/plugin-authoring.md`:

1. `plugins/<name>/.claude-plugin/plugin.json` — version `0.1.0`, author Anton.
2. `plugins/<name>/skills/<skill-name>/SKILL.md` — English body, English frontmatter, Russian trigger phrases inside `description`.
3. `plugins/<name>/agents/<agent-name>.md` if the design needs an agent — include `model: opus` when warranted.
4. `plugins/<name>/references/<topic>.md` only if the interview revealed a clear need for a shared reference.

User-facing prompts inside the generated skill (e.g. "Что нужно закоммитить?") stay in Russian — include them in the SKILL.md body as literal Russian strings wrapped in code fences or blockquotes, so the model knows to speak them verbatim.

## Phase 6 — Register, validate, commit, push

1. Read `.claude-plugin/marketplace.json`, add a new entry:
   ```json
   { "name": "<name>", "description": "<same as plugin.json>", "source": "./plugins/<name>" }
   ```
2. Run the **pre-flight validation checklist** from `references/plugin-authoring.md`:
   - All created JSON files parse.
   - `marketplace.json` still has no duplicate names.
   - All generated `SKILL.md` / `agent.md` are > 100 bytes.
   - Each skill `description` has 3+ trigger phrases.
3. If any check fails — abort, report in Russian which file failed which check, do not commit. Leave files on disk for the next pass.
4. If all pass:
   ```bash
   git pull origin main
   git add .claude-plugin/marketplace.json plugins/<name>/
   git commit -m "<Russian message: created plugin <name> with N skills / M agents>"
   git push
   ```
5. Report to user in Russian:
   ```
   Создал плагин `<name>`. Состав: <список компонентов>. Коммит <hash>.
   Перезагрузи Claude Code, чтобы плагин стал активен. Если что-то не так — скажи "отмени".
   ```

## Rollback

If user says "отмени" / "откати" / "верни как было" after commit:

```bash
git revert <hash> --no-edit
git push
```

Report in Russian: `Откатил коммит <hash>, файлы вернул в предыдущее состояние.`
````

- [ ] **Step 2: Валидация**

Run:
```bash
cd /c/projects/anton-toolkit && wc -c plugins/plugin-builder/skills/create-plugin/SKILL.md && head -20 plugins/plugin-builder/skills/create-plugin/SKILL.md
```
Expected: > 4000 bytes; first 20 lines include `name: create-plugin` and the full `description` with trigger phrases.

- [ ] **Step 3: Коммит**

```bash
cd /c/projects/anton-toolkit
git add plugins/plugin-builder/skills/create-plugin/SKILL.md
git commit -m "$(cat <<'EOF'
Добавил скилл create-plugin для plugin-builder

6-фазный флоу интервью на русском: открытый вопрос → парсинг 4 обязательных полей → активные уточнения → русский конспект-подтверждение → генерация файлов плагина на английском → валидация и git. Разграничение с extend-plugin и improve-plugin прописано в описании триггера.
EOF
)"
```

---

## Task 4: Написать `skills/extend-plugin/SKILL.md`

**Files:**
- Create: `plugins/plugin-builder/skills/extend-plugin/SKILL.md`

- [ ] **Step 1: Создать файл**

Write `plugins/plugin-builder/skills/extend-plugin/SKILL.md`:

````markdown
---
name: extend-plugin
description: >
  Proactively extend an existing plugin in the anton-toolkit-marketplace:
  add a new skill, add a new agent, add references, or substantially rework
  an existing component. Triggered in a fresh session when the user wants to
  add functionality (not fix a recent incident). Example phrases: "добавь в
  плагин", "допили скилл", "расширь плагин", "хочу в <name> добавить", "нужно
  дополнить плагин".

  Discrimination: only trigger when the target plugin already exists AND
  there was NO incident with that plugin in the current session. If an
  incident just happened, delegate to `improve-plugin`. If the plugin does
  not yet exist, delegate to `create-plugin`.

  This skill runs DIRECTLY in conversation. Do NOT launch agents for the
  interview part.
---

# Extend Plugin — guided plugin extension

Interview the user in Russian to understand what to add to an existing plugin, then apply the change (new files or minimal edits), increment version, and commit.

**Before starting, read** `references/plugin-authoring.md`.

## Phase 1 — Identify target plugin

If the user already named the plugin clearly ("добавь в anton-toolkit скилл X") — skip to Phase 2.

Otherwise ask in Russian:
```
В какой плагин добавляем? Список: <list from .claude-plugin/marketplace.json>.
```

## Phase 2 — Read the target plugin

Read the full contents of `plugins/<target>/` — `plugin.json`, all SKILL.md, all agent files, references. You need the current state to avoid duplicating existing functionality and to match the plugin's existing conventions.

## Phase 3 — Short interview about the change

Required fields for an extension:

1. **Что добавляем** (what to add) — a new skill? new agent? new reference? rework of an existing component?
2. **Зачем** (why) — task the new thing solves / gap in the current plugin.
3. **Когда запускать** (trigger context, if a new skill/agent) — situations that invoke it.
4. **Как работает** (how it works) — step-by-step behavior.

Ask one question per turn in Russian. Use the HTML-comment uncovered tracker like in `create-plugin`.

Skip fields that are already obvious from the target plugin's context (e.g. if extending `anton-toolkit`, "зачем" may already be implicit in the user's opening message).

## Phase 4 — Russian recap, confirmation

```
Понял так: в плагин `<target>` добавляем <component> `<name>` — <short task>.
Срабатывает на <triggers>. Работает: 1) ... 2) ... Всё правильно?
```

Wait for confirmation. On corrections go back to Phase 3.

## Phase 5 — Apply change

Two modes:

**Mode A — new component:**
- Create new `SKILL.md` / agent file / reference under the target plugin, following `references/plugin-authoring.md`.
- Do NOT modify existing files in the target plugin unless the user explicitly asked.

**Mode B — rework existing component:**
- Apply the minimal change that satisfies the interview. Do not refactor adjacent code. Do not "improve" beyond the requested scope.

In both modes, bump `plugins/<target>/.claude-plugin/plugin.json` version:
- MINOR bump for Mode A (new skill/agent/reference).
- MINOR bump for Mode B if the rework is significant (changes triggers or flow). PATCH bump for small reformulations.

## Phase 6 — Validate, commit, push

1. Pre-flight validation from `references/plugin-authoring.md`:
   - JSON files parse.
   - New/modified SKILL.md / agent.md are > 100 bytes.
   - New skills have 3+ trigger phrases in `description`.
   - `version` in target `plugin.json` is incremented.
2. On failure — abort, report in Russian, do not commit.
3. On success:
   ```bash
   git pull origin main
   git add plugins/<target>/<explicit paths>
   git commit -m "<Russian: описание что добавил/изменил и зачем>"
   git push
   ```
4. Report to user in Russian with commit hash:
   ```
   Добавил в плагин `<target>` <component> `<name>`. Версия <old> → <new>.
   Коммит <hash>. Перезагрузи Claude Code. Если что-то не так — "отмени".
   ```

## Rollback

Same as `create-plugin` — `git revert <hash>` + push on the user saying "отмени".
````

- [ ] **Step 2: Валидация**

Run:
```bash
cd /c/projects/anton-toolkit && wc -c plugins/plugin-builder/skills/extend-plugin/SKILL.md && grep -c "Phase" plugins/plugin-builder/skills/extend-plugin/SKILL.md
```
Expected: > 3000 bytes; `Phase` встречается минимум 6 раз.

- [ ] **Step 3: Коммит**

```bash
cd /c/projects/anton-toolkit
git add plugins/plugin-builder/skills/extend-plugin/SKILL.md
git commit -m "$(cat <<'EOF'
Добавил скилл extend-plugin для plugin-builder

Проактивное расширение существующего плагина: идентификация цели → чтение текущего состояния → короткое интервью про изменение → подтверждение → применение (новый файл или минимальная правка) → инкремент версии → git. Разграничение с improve-plugin по признаку инцидента в сессии.
EOF
)"
```

---

## Task 5: Написать `agents/improve-plugin.md` (Opus-агент)

**Files:**
- Create: `plugins/plugin-builder/agents/improve-plugin.md`

Агент должен объединить все триггер-фразы из двух старых SKILL (anton-toolkit и personal-strategist) — перенесённых без потерь — и параметризоваться по плагину через детекцию с подтверждением.

- [ ] **Step 1: Создать файл**

Write `plugins/plugin-builder/agents/improve-plugin.md`:

````markdown
---
name: improve-plugin
description: >
  Reactively fix a plugin in the anton-toolkit-marketplace after an incident
  in the current session — a skill or agent just behaved incorrectly, the
  user corrected it in conversation, and now wants the fix persisted in the
  plugin source.

  Triggers: "улучши плагин", "обнови скилл", "запомни это в плагине",
  "исправь скилл", "так не должно быть", "убери <X>", "не добавляй <X>",
  "запомни", "улучши стратега", "исправь интервьюера", "улучши плагин
  personal-strategist", "/improve".

  Discrimination: only trigger when there was a concrete incident with a
  plugin skill/agent earlier in the current session. If there was no
  incident (fresh session, user is just planning) — delegate to
  `extend-plugin` (proactive modification) or `create-plugin` (new plugin).

  Runs autonomously. Engages in at most one round of user interaction — the
  target-plugin confirmation in Step 1 of the process. No interview, no
  multi-turn dialog beyond that.
model: opus
---

# Improve Plugin — reactive plugin fix (Opus)

Read the current session history, identify the plugin that malfunctioned, apply the minimal fix to persist the user's correction, and ship via git.

**Before starting, read** `references/plugin-authoring.md` for the validation checklist and language rules.

## Step 1 — Detect target plugin, confirm in one message

Scan the conversation history for:
- Which plugin skill or agent was invoked and produced the behavior the user criticized.
- Which plugin that skill/agent lives in (by looking at the skill/agent name in the plugins tree).

Formulate one hypothesis. Your first message to the user (in Russian) contains both the hypothesis and the planned action, so user silence = agreement, user correction = target switch. Example:

```
Вижу проблему в скилле `commit` из плагина `anton-toolkit` — правлю его.
Если плагин другой — скажи какой.
```

If the session has no clear incident (user invoked the agent "clean"), ask explicitly in Russian:
```
В каком плагине правим и что именно?
```

Wait briefly for user response. If the user corrects the target (names a different plugin) — switch. If the user silent or confirms — proceed.

## Step 2 — Locate the repo on disk

The repo may live in different places on different machines. Try, in order:

```bash
ls -d /c/projects/anton-toolkit ~/projects/anton-toolkit ~/anton-toolkit 2>/dev/null
find ~ /c/projects -maxdepth 3 -name "plugin.json" -path "*/anton-toolkit/*" 2>/dev/null | head -5
```

If not found, clone:
```bash
git clone git@github.com:lopatuxin/anton-toolkit.git /tmp/anton-toolkit
```

Never edit `~/.claude/plugins/cache/` or `~/.claude/plugins/marketplaces/` — that's the cache, changes are overwritten. Set `PLUGIN_REPO` to the working-copy path.

## Step 3 — Read the current state of the target file(s)

Determine which file needs editing:
- Skill misbehaved → `$PLUGIN_REPO/plugins/<target>/skills/<skill-name>/SKILL.md`
- Agent misbehaved → `$PLUGIN_REPO/plugins/<target>/agents/<agent-name>.md`
- Config issue → `$PLUGIN_REPO/plugins/<target>/.claude-plugin/plugin.json` or references

Read the full file. If uncertain which file is the source of the issue, read adjacent files to build context.

## Step 4 — Apply minimal point fix

Edit rules (strict):
- Minimal change that solves the concrete problem. Nothing more.
- Do NOT refactor the rest of the skill/agent.
- Do NOT add "improvements" beyond what the user asked.
- Do NOT change style or formatting of untouched parts.
- When adding a new rule, state it concretely with an example of correct and incorrect behavior — vague rules do not change model behavior.

## Step 5 — Bump PATCH version

Always increment PATCH in `$PLUGIN_REPO/plugins/<target>/.claude-plugin/plugin.json` — without a version bump, the marketplace will not pull the change on other machines.

Example: `0.10.3` → `0.10.4`.

## Step 6 — Pre-flight validation

Run the checklist from `references/plugin-authoring.md`:
1. Modified JSON parses.
2. Edited SKILL.md / agent.md is > 100 bytes (didn't accidentally wipe).
3. `version` is strictly greater than before.
4. If `description` was edited, it still contains 3+ trigger phrases.

On any failure — abort, report to user in Russian what failed, leave files on disk. Do not commit.

## Step 7 — Git

```bash
cd $PLUGIN_REPO
git pull origin main
git add plugins/<target>/<explicit paths>
git commit -m "<Russian message: what was fixed and why, 1–2 sentences>"
git push
```

If cloned to `/tmp/`, remove after push:
```bash
rm -rf /tmp/anton-toolkit
```

## Step 8 — Report in Russian

```
Поправил скилл `<name>` в плагине `<target>`: <что именно изменил в одном предложении>.
Версия <old> → <new>. Коммит <hash>. Перезагрузи Claude Code, чтобы изменение применилось.
Если не подходит — скажи "отмени".
```

## Rollback

On "отмени" / "откати":
```bash
cd $PLUGIN_REPO
git revert <hash> --no-edit
git push
```
Report: `Откатил коммит <hash>, файл вернул в предыдущее состояние.`

## Bootstrap note

If the incident was with a skill/agent inside `plugin-builder` itself — target-plugin detection will correctly identify `plugin-builder`, and the agent edits itself. That is supported. Be extra careful with the minimality rule in that case: a botched self-fix is harder to recover from than a botched fix of any other plugin.
````

- [ ] **Step 2: Валидация**

Run:
```bash
cd /c/projects/anton-toolkit && grep -c "^model: opus$" plugins/plugin-builder/agents/improve-plugin.md && wc -c plugins/plugin-builder/agents/improve-plugin.md
```
Expected: `1` (ровно одна строка `model: opus`), > 4000 bytes.

- [ ] **Step 3: Коммит**

```bash
cd /c/projects/anton-toolkit
git add plugins/plugin-builder/agents/improve-plugin.md
git commit -m "$(cat <<'EOF'
Добавил агент improve-plugin (Opus) для plugin-builder

Централизованный реактивный фиксер плагинов по фидбеку в текущей сессии. Модель Opus для точности формулировок при правке SKILL.md. Детекция целевого плагина с подтверждением одним сообщением. Минимальные точечные правки без рефакторинга смежного кода. Обработка самого plugin-builder (bootstrap case) поддерживается.
EOF
)"
```

---

## Task 6: Зарегистрировать `plugin-builder` в маркетплейсе

**Files:**
- Modify: `.claude-plugin/marketplace.json`

- [ ] **Step 1: Прочитать текущий маркетплейс**

Read `.claude-plugin/marketplace.json`. На текущий момент там два плагина: `anton-toolkit` и `personal-strategist`.

- [ ] **Step 2: Добавить запись про plugin-builder**

Edit `.claude-plugin/marketplace.json` — добавить третью запись в массив `plugins` после `personal-strategist`. Итоговое содержимое:

```json
{
  "name": "anton-toolkit-marketplace",
  "description": "Personal plugin marketplace for Anton",
  "owner": {
    "name": "Anton"
  },
  "plugins": [
    {
      "name": "anton-toolkit",
      "description": "Personal toolkit with custom skills for Anton",
      "source": "./plugins/anton-toolkit"
    },
    {
      "name": "personal-strategist",
      "description": "Strategic advisor that collects personal information and helps develop strategies",
      "source": "./plugins/personal-strategist"
    },
    {
      "name": "plugin-builder",
      "description": "Creates, extends, and fixes plugins in the anton-toolkit-marketplace",
      "source": "./plugins/plugin-builder"
    }
  ]
}
```

- [ ] **Step 3: Валидация JSON и уникальности имён**

Run:
```bash
cd /c/projects/anton-toolkit && node -e "
const m = JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json', 'utf8'));
const names = m.plugins.map(p => p.name);
const dups = names.filter((n, i) => names.indexOf(n) !== i);
if (dups.length) { console.error('duplicate names:', dups); process.exit(1); }
if (!names.includes('plugin-builder')) { console.error('plugin-builder not registered'); process.exit(1); }
console.log('OK: ' + names.length + ' plugins, no dups');
"
```
Expected: `OK: 3 plugins, no dups`.

- [ ] **Step 4: Коммит**

```bash
cd /c/projects/anton-toolkit
git add .claude-plugin/marketplace.json
git commit -m "$(cat <<'EOF'
Зарегистрировал plugin-builder в маркетплейсе

Третья запись в .claude-plugin/marketplace.json, источник ./plugins/plugin-builder.
EOF
)"
```

---

## Task 7: Миграция — удалить старые `improve-plugin` SKILL и бампнуть версии

Сейчас в двух плагинах есть устаревшие дубли `improve-plugin`. После введения агента `improve-plugin` в `plugin-builder` их нужно убрать.

**Files:**
- Delete: `plugins/anton-toolkit/skills/improve-plugin/SKILL.md`
- Delete: `plugins/anton-toolkit/skills/improve-plugin/` (directory)
- Delete: `plugins/personal-strategist/skills/improve-plugin/SKILL.md`
- Delete: `plugins/personal-strategist/skills/improve-plugin/` (directory)
- Modify: `plugins/anton-toolkit/.claude-plugin/plugin.json` (bump MINOR)
- Modify: `plugins/personal-strategist/.claude-plugin/plugin.json` (bump MINOR)

- [ ] **Step 1: Удалить старые SKILL-директории через git rm**

Run:
```bash
cd /c/projects/anton-toolkit
git rm -r plugins/anton-toolkit/skills/improve-plugin
git rm -r plugins/personal-strategist/skills/improve-plugin
```
Expected: git пометит оба SKILL.md как удалённые, директории исчезнут.

- [ ] **Step 2: Бампнуть MINOR-версию в `anton-toolkit/plugin.json`**

Read `plugins/anton-toolkit/.claude-plugin/plugin.json`, найти текущую версию (записана в Task 0 Step 3). Формула: текущая `0.X.Y` → `0.(X+1).0`.

Для текущей версии `0.10.3` новая версия — `0.11.0`.

Edit `plugins/anton-toolkit/.claude-plugin/plugin.json`, изменить `"version"` на новое значение.

- [ ] **Step 3: Бампнуть MINOR-версию в `personal-strategist/plugin.json`**

Read `plugins/personal-strategist/.claude-plugin/plugin.json`. Для текущей `0.2.3` — новая `0.3.0`.

Edit plugin.json.

- [ ] **Step 4: Валидация — оба JSON парсятся, версии выросли**

Run:
```bash
cd /c/projects/anton-toolkit && node -e "
const a = JSON.parse(require('fs').readFileSync('plugins/anton-toolkit/.claude-plugin/plugin.json', 'utf8'));
const p = JSON.parse(require('fs').readFileSync('plugins/personal-strategist/.claude-plugin/plugin.json', 'utf8'));
console.log('anton-toolkit version:', a.version);
console.log('personal-strategist version:', p.version);
"
```
Expected: новые версии распечатаны, JSON-ошибок нет.

- [ ] **Step 5: Проверить, что старых SKILL файлов нет**

Run:
```bash
cd /c/projects/anton-toolkit && ls plugins/anton-toolkit/skills/improve-plugin 2>/dev/null; ls plugins/personal-strategist/skills/improve-plugin 2>/dev/null; echo DONE
```
Expected: только `DONE` (обе директории отсутствуют).

- [ ] **Step 6: Коммит**

```bash
cd /c/projects/anton-toolkit
git add plugins/anton-toolkit/.claude-plugin/plugin.json plugins/personal-strategist/.claude-plugin/plugin.json
git commit -m "$(cat <<'EOF'
Вынес improve-plugin в отдельный плагин plugin-builder

Удалил дубли скилла improve-plugin из anton-toolkit и personal-strategist — теперь функционал живёт как агент с Opus в plugin-builder с детекцией целевого плагина. Обе удалённые версии SKILL были захардкожены на свой плагин, новая параметризуется автоматически.

Версии: anton-toolkit 0.10.3 → 0.11.0, personal-strategist 0.2.3 → 0.3.0 (MINOR — удалён публичный компонент).
EOF
)"
```

Примечание: точные «старые» версии в сообщении коммита замени на те, что реально были на момент выполнения (из Task 0 Step 3).

---

## Task 8: Smoke test — ручная проверка живого плагина

Автоматический тест здесь невозможен (нет CLI-хуков в Claude Code для проверки плагина без запуска). Проверка ручная, Anton выполняет после push.

- [ ] **Step 1: Push всех сделанных коммитов**

```bash
cd /c/projects/anton-toolkit && git push origin main
```
Expected: 6 коммитов улетают на remote (Task 1, 2, 3, 4, 5, 6, 7 — итого 7 коммитов).

- [ ] **Step 2: Перезагрузить Claude Code**

Anton перезагружает Claude Code полностью (не просто новую сессию — плагин подтянется из маркетплейса).

- [ ] **Step 3: Проверить, что plugin-builder виден**

В Claude Code выполнить команду просмотра плагинов (`/plugin` или аналогичную) и убедиться, что `plugin-builder` присутствует в списке установленных.

- [ ] **Step 4: Проверить скилл `create-plugin`**

В новой сессии написать: `хочу создать простой плагин для тестирования`. Ожидаемо: Claude распознаёт триггер, запускает скилл `create-plugin`, задаёт открытый вопрос на русском про задачу и когда срабатывать.

Не доводить интервью до конца — достаточно увидеть, что первая фаза работает. На вопрос о задаче ответить: «тест, не создавай ничего реального», Claude должен либо уточнить, либо прекратить.

- [ ] **Step 5: Проверить скилл `extend-plugin`**

В другой новой сессии написать: `хочу добавить скилл в anton-toolkit`. Ожидаемо: срабатывает `extend-plugin` (не `create-plugin`, потому что `anton-toolkit` уже существует).

- [ ] **Step 6: Проверить агент `improve-plugin`**

В сессии, где только что использовался какой-то существующий скилл (например, `commit`), и Anton недоволен результатом, написать: `улучши плагин, убери <что-то>`. Ожидаемо: срабатывает агент `improve-plugin` на Opus, первым сообщением выдвигает гипотезу про целевой плагин.

Не доводить до реальной правки — достаточно убедиться, что триггер работает и детекция корректна.

- [ ] **Step 7: Проверить, что старый `improve-plugin` из anton-toolkit больше не срабатывает**

В новой сессии написать любой триггер старого SKILL (например, просто `/improve`). Ожидаемо: срабатывает агент из `plugin-builder`, не старый (которого больше нет на диске).

---

## Task 9: Финализация

- [ ] **Step 1: Коммит плана реализации в git**

План сейчас — untracked файл в `docs/superpowers/plans/`. Коммитим для архива.

```bash
cd /c/projects/anton-toolkit
git add docs/superpowers/plans/2026-04-15-plugin-builder.md
git commit -m "$(cat <<'EOF'
Добавил план реализации plugin-builder

9 задач от создания структуры до smoke-теста и миграции. Полные тексты SKILL.md, agent.md и reference-файла вписаны в задачи.
EOF
)"
git push
```

- [ ] **Step 2: Отчитаться Anton'у в чате на русском**

Формат отчёта:
```
Готово. Плагин plugin-builder реализован: 3 компонента (create-plugin, extend-plugin,
improve-plugin на Opus), общий справочник plugin-authoring.md, зарегистрирован в
маркетплейсе. Дубли improve-plugin из anton-toolkit и personal-strategist убраны,
версии обновлены. Все коммиты запушены.

Следующий шаг за тобой — перезагрузи Claude Code и пройди smoke test из Task 8.
Если что-то работает не так — используй сам же plugin-builder через фразу
"исправь plugin-builder" (бутстрап-случай поддерживается).
```

---

## Self-Review чек-лист (выполняется после написания плана)

- [ ] Все 4 обязательных поля чек-листа интервью (задача / когда запускать / принцип / результат) покрыты в `create-plugin/SKILL.md` Phase 2. ✓
- [ ] Правило разрешения конфликтов триггеров прописано в `description` всех трёх компонентов. ✓
- [ ] `model: opus` явно указан только в `improve-plugin`, в скиллах — нет. ✓
- [ ] Языковое разделение (инструкции English / диалог Russian / коммиты Russian) прописано в `plugin-authoring.md` и повторно в каждом компоненте. ✓
- [ ] Pre-flight валидация описана один раз (в `plugin-authoring.md`) и вызывается ссылкой из компонентов. ✓
- [ ] Миграция старых `improve-plugin` из обоих плагинов включена (Task 7). ✓
- [ ] Smoke test покрывает все три триггера и разграничение скилл/агент (Task 8). ✓
- [ ] Нет плейсхолдеров типа TBD/TODO. ✓
- [ ] Консистентность имён: `improve-plugin` — везде (не `fix-plugin`, не `improve`). Имена фаз (`Phase N`) совпадают в create/extend. ✓
- [ ] Bootstrap case упомянут в `improve-plugin.md` (Task 5). ✓
