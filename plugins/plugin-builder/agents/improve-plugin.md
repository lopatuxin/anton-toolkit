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
