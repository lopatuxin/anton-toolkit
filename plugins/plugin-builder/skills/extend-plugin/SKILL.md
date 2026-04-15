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
