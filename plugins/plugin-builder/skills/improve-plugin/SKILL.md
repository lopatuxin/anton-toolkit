---
name: improve-plugin
description: >
  Fix a plugin in the anton-toolkit-marketplace when the user explicitly
  asks to update a skill or agent. Updates the plugin source so the
  correction persists across sessions.

  Invoke ONLY on explicit user request. Do NOT invoke proactively.
  Do NOT suggest running this skill in response to complaints, reprimands,
  or evaluative remarks about a skill/agent's output ("это косяк",
  "глючит", "не сработало", etc.) — wait for the user to call the skill
  themselves.

  Triggers (explicit only): "/improve", "/improve-plugin", "улучши плагин",
  "обнови плагин", "обнови скилл", "обнови агента", "исправь скилл",
  "исправь агента", "поправь плагин", "запомни это в плагине",
  "улучши <имя плагина / скилла / агента>".

  Discrimination: this skill is for explicit requests to modify the plugin
  source. For fresh-session planning of new plugin behavior — use
  `extend-plugin` or `create-plugin` instead. For one-off file overrides
  in the current project with no plugin-level rule change — skip.

  This skill runs DIRECTLY in conversation. Engages in at most one round
  of user interaction — the target-plugin confirmation in Step 1.
---

# Improve Plugin — explicit plugin fix

The user explicitly asked to update a plugin component. Read the recent session history to understand which skill/agent and what change is wanted, apply the minimal fix, and ship via git.

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

If the session has no clear incident (user invoked the skill "clean"), ask explicitly in Russian:
```
В каком плагине правим и что именно?
```

Wait briefly for user response. If the user corrects the target (names a different plugin) — switch. If the user silent or confirms — proceed.

## Step 2 — Locate the repo on disk

The repo may live in different places on different machines. Try, in order:

```bash
ls -d /c/projects/anton-toolkit ~/projects/anton-toolkit ~/anton-toolkit 2>/dev/null
ls -d "$HOME/.claude/plugins/marketplaces/anton-toolkit-marketplace" 2>/dev/null
find ~ /c/projects -maxdepth 3 -name "plugin.json" -path "*/anton-toolkit/*" 2>/dev/null | head -5
```

If the only working copy is the marketplace path under `~/.claude/plugins/marketplaces/anton-toolkit-marketplace` AND it is a real git remote of `lopatuxin/anton-toolkit` (verify with `git remote -v`), it is safe to edit there directly — that is the user's primary working copy on this machine.

Otherwise, never edit `~/.claude/plugins/cache/` — that is a read-only cache, changes are overwritten. If no working copy is found, clone:
```bash
git clone git@github.com:lopatuxin/anton-toolkit.git /tmp/anton-toolkit
```

Set `PLUGIN_REPO` to the working-copy path.

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

Language rule (strict — applies to every edit this skill makes):
- **Scope: EVERY skill or agent file you edit while running this skill** — this includes personal `~/.claude/skills/` and project-level `.claude/skills/` files, not only plugin-repo source. If the incident traces to a non-plugin skill/agent file, the language rule still applies to whatever you write into it.
- **All model-facing text MUST be written in English**: SKILL.md body, agent body, references, YAML `description` fields, inline rules, examples explaining correct/incorrect behavior. Even when the user phrases the correction in Russian, the rule you persist into the file is English prose. This holds even if the surrounding file is currently written in Russian.
- **Russian is allowed only in two specific places**: (a) trigger phrases inside `description` that match real Russian user input (e.g. `"улучши плагин"`, `"это косяк"`), and (b) literal user-facing dialogue templates the component will speak back to the user (questions, confirmations, error messages, post-operation summaries).
- If the user says in Russian "добавь правило, что X не должно быть" — translate the rule itself to English when writing it into the file. Do NOT paste Russian prose into the SKILL.md/agent body. Trigger phrases and user-facing dialogue stay Russian; everything else is English.
- Correct: `Do NOT include emojis in commit messages unless the user explicitly requests them.`
- Incorrect: `Не добавляй эмодзи в коммит-сообщения, если пользователь явно не попросил.` (this is a rule, not user-facing dialogue — must be English)

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

## Step 7 — Sync the root README

Update the repo-root `README.md` per the **README sync** section in `references/plugin-authoring.md`, in the same commit. For a pure internal behavior fix that does not change the tool's name, triggers, count, or one-line description, this is just the version cell in the plugins table. If the fix changed a trigger, name, or the documented behavior shown in the README, update that tool's section too.

## Step 8 — Git

```bash
cd $PLUGIN_REPO
git pull origin main
git add README.md plugins/<target>/<explicit paths>
git commit -m "<Russian message: what was fixed and why, 1–2 sentences>"
git push
```

If cloned to `/tmp/`, remove after push:
```bash
rm -rf /tmp/anton-toolkit
```

## Step 9 — Report in Russian

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

If the incident was with this skill itself (`improve-plugin` inside `plugin-builder`) — target-plugin detection will correctly identify `plugin-builder`, and the skill edits itself. That is supported. Be extra careful with the minimality rule in that case: a botched self-fix is harder to recover from than a botched fix of any other plugin/component.
