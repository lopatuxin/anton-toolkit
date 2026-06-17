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

## Component types — what a plugin can contain

A plugin is a bundle of one or more of these. Pick per the task — most plugins need only one or two. Do NOT default to "skill" reflexively.

| Component | Use when | Location | Invocation |
|---|---|---|---|
| **skill** | Multi-step or dialog-driven behavior the model performs in conversation (interview, guided workflow). | `skills/<name>/SKILL.md` | Auto-triggered by `description`, or `/<name>`. |
| **agent** | Autonomous one-shot work with no dialog (review, generate, analyze) that runs in its own context. | `agents/<name>.md` | Dispatched via the Agent tool. |
| **command** | A fixed, explicit action the user triggers by name with optional args (`/deploy`, `/commit`). No reasoning/dialog needed. | `commands/<name>.md` | `/<name> [args]` only — never auto-triggers. |
| **hook** | Automatic behavior on a harness event (PreToolUse, PostToolUse, Stop, SessionStart, …). The harness runs it, not the model. | `hooks/hooks.json` + scripts | Fires on the event, no user action. |
| **MCP server** | The plugin must expose external tools/data (an API, a DB, a service). | `.mcp.json` | Tools appear as `mcp__<server>__*`. |

Decision shortcuts:
- "The user describes it and I converse to refine it" → **skill**.
- "Run it and come back with a result, no back-and-forth" → **agent**.
- "User types a slash command to do exactly X" → **command** (a **skill** instead if X needs reasoning or dialog).
- "Whenever event Y happens, automatically do Z" → **hook** (the model cannot self-trigger on events — only a hook can).
- "Needs to talk to an external system" → **MCP server**.

For the exact file format and frontmatter of commands, hooks, and MCP config, consult the official `plugin-dev` skills when installed: `plugin-dev:command-development`, `plugin-dev:hook-development`, `plugin-dev:mcp-integration`, `plugin-dev:plugin-structure`. Apply this marketplace's language rule regardless of what those skills show.

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
3. All created/modified `SKILL.md`, `agents/*.md`, and `commands/*.md` files are non-empty (> 100 bytes).
4. Each SKILL.md `description` contains at least 3 explicit trigger phrases.
5. If any plugin file was modified, the corresponding `plugin.json` `version` is incremented.
6. If a `hooks/hooks.json` or `.mcp.json` was created, it parses as valid JSON (covered by check 1).
7. The root `README.md` reflects the change per the **README sync** section (counts, table version cell, and any added/removed/reworked tool), and `README.md` is staged in the same commit.

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

## README sync (root marketplace README)

The repo-root `README.md` is the navigation map of the whole marketplace. It WILL drift out of sync unless every tool change updates it in the SAME commit. After modifying any plugin and before committing, update `README.md` to match the new state, then `git add README.md` alongside the plugin files. This is mandatory for all three skills (`create-plugin`, `extend-plugin`, `improve-plugin`).

What the root README tracks and where to touch it:

- **Header badges** — `plugins-N`, `skills-N`, `agents-N`. Recount across all `plugins/*/` and update the numbers.
- **Intro sentence** — the "N плагинов, ~M инструментов" line.
- **Map diagram** — add or remove a plugin box.
- **Plugins table** — the row for the changed plugin. This table is the SINGLE place a version is shown — update the version cell here and nowhere else. Update the skill/agent counts. Add or remove a whole row for a new or deleted plugin.
- **Per-plugin section** — the `<details>` block for a new/removed/reworked skill, or the agents-table row for an agent. Update the description/triggers shown there only if they changed.
- **Cheatsheet ("по задаче")** — add or remove the row for the tool.
- **Typical workflows** — only if the tool slots into an existing flow.

Version is shown ONLY in the plugins table. Section headings (`## 🛠 anton-toolkit`) and TOC anchors carry NO version, so a PATCH bump touches exactly one README cell and never breaks a TOC link. Do NOT reintroduce versions into headings or anchors.

Scope rule — edit only what the change actually affects (same minimality discipline as for plugin files; never reflow untouched sections):
- New / removed / renamed tool, or changed triggers/description → update the relevant sections above. This is the common case for `create-plugin` and `extend-plugin`.
- Pure internal behavior fix that does NOT change the tool's name, triggers, count, or one-line description (the common `improve-plugin` case) → update only the version cell in the plugins table; the prose sections need no change.

## Activation — registering is not enough

Adding a plugin to `.claude-plugin/marketplace.json` makes it *discoverable*, not *active*. A plugin runs only when it is enabled in the user's `~/.claude/settings.json` under `enabledPlugins` (e.g. `"<name>@anton-toolkit-marketplace": true`). Skipping this is the single most common reason a freshly created plugin "does nothing" after a restart.

- **New plugin (`create-plugin`):** after the files are committed, the plugin is registered but NOT yet active. Tell the user to enable it: run `/plugin`, find `<name>` under the `anton-toolkit-marketplace`, and enable it — this installs it into the local cache and flips `enabledPlugins`. A plain restart is NOT enough for a brand-new plugin.
- **Existing enabled plugin (`extend-plugin`, `improve-plugin`):** the plugin is already in `enabledPlugins`, so a version bump is enough. With `autoUpdate` on for this marketplace, a restart pulls the new version; otherwise the user runs `/plugin` to update.

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
├── commands/
│   └── <command-name>.md
├── hooks/
│   └── hooks.json
├── .mcp.json
└── references/
    └── <topic>.md
```

- Create only the directories the plugin actually uses — a skill-only plugin has just `skills/`.
- One SKILL.md per skill, each in its own subdirectory.
- Agents and commands live as flat `*.md` files directly under `agents/` and `commands/`.
- References are flat under `references/`, named by topic (not by the component that reads them).
