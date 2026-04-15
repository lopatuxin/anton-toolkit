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
