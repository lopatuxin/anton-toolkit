# Plugin Authoring Reference

Shared conventions for all `plugin-builder` components. Read this **before** generating or modifying any plugin file.

## Language rule (critical)

- **Model-facing instructions** (SKILL.md body, agent body, references, YAML `description` field) — **English**. Only the model reads this text; English keeps it compact and unambiguous.
- **User-facing dialogue** the skill/agent produces in chat (questions, confirmations, error messages, post-operation summaries) — **Russian**. The user does not read English.
- **Commit messages** — **Russian**.
- **Russian trigger phrases inside `description` / `when_to_use`** (e.g. `"коммит", "закоммить"`) stay Russian: they match real user input. The English prose around them describes the trigger condition.

## Write for current models (Claude 5)

The marketplace targets the Claude 5 family (Fable 5, Opus 5, Sonnet 5). These models follow instructions closely and over-trigger on emphasis, so the habits that helped earlier models now hurt:

- **Say it once, plainly, with the reason.** `Use this skill when the user asks to commit.` beats `IMPORTANT: You MUST invoke this skill IMMEDIATELY when...`. Reserve NEVER/ALWAYS for the few real hard constraints. A constraint that must hold 100% of the time is a hook or a permission rule, not a sentence.
- **A brief general instruction beats an enumerated script.** Goal, boundaries, output format, and the gotchas learned from real failures outperform a numbered list of every behavior. The gotchas are the highest-signal content in any skill — keep them, cut everything else first.
- **No `<example>` blocks in descriptions, no WRONG/CORRECT reasoning theatre.** Examples in system-level text no longer improve triggering on these models and cost context in every session. One correct/incorrect pair inside a body is fine when it disambiguates a rule.
- **No verification scaffolding.** Do not write "double-check your work", "verify before returning", "use a subagent to verify". Opus 5 and Fable 5 verify on their own; such lines cause over-verification. A separate fresh-context reviewer agent is still right when the workflow genuinely needs an independent pass.
- **State scope explicitly.** Sonnet 5 reads literally: if a rule applies to every section, say "every section, not only the first".
- **Reviewer agents ask for coverage, not restraint.** "Only report real problems" / "be conservative" makes these models under-report. Ask for every finding with a confidence and severity, and filter downstream.
- **Never ask the model to echo or transcribe its reasoning** in the response — Fable 5 refuses such instructions.
- **Size.** SKILL.md under 500 lines; agent bodies a few hundred lines at most; everything longer goes to `references/` and is read on demand.

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
- **MINOR** (0.1.1 → 0.2.0): new skill, new agent, new reference file, new hook or workflow, or significant rework of an existing component.
- **MAJOR** (0.2.0 → 1.0.0): fundamental restructure, breaking removal of a public trigger (rare).

Every change that ships through git MUST bump the version — the marketplace caches by version.

## SKILL.md frontmatter

```yaml
---
name: <kebab-case-name>
description: >
  <One or two English sentences: what the skill does and when to use it — key use case FIRST.
  Then the discriminator: when NOT to use it and which sibling skill to use instead.>
when_to_use: >                    # optional — a few concrete trigger phrases, Russian ones verbatim
  "закоммить", "сохрани изменения"
disable-model-invocation: true    # optional — only the user runs it, with /<name>
user-invocable: false             # optional — background knowledge Claude loads itself
paths:                            # optional — auto-load only when working with matching files
  - "**/*.kt"
context: fork                     # optional — run the body as the prompt of a subagent…
agent: <agent-name>               # …of this agent type (only with context: fork)
model: <sonnet|opus|haiku|fable|inherit>   # optional
effort: <low|medium|high|xhigh|max>        # optional
allowed-tools: Read, Grep         # optional — pre-approved tools for the invoking turn
hooks: ...                        # optional — hooks registered when the skill runs
argument-hint: "[issue-number]"   # optional
shell: powershell                 # optional — shell for !`command` blocks in the body
---
```

Rules:
- The listing Claude sees is `description` + `when_to_use`, truncated at 1,536 characters, and the whole listing shares one context budget. Keep the pair under ~1,000 characters and put the key use case in the first sentence — anything past the cap is invisible, which is exactly where discriminators used to be placed.
- The description decides triggering. Describe the situation, not a keyword list. Two or three verbatim Russian phrases in `when_to_use` are enough; do not pad.
- A skill that must never auto-trigger gets `disable-model-invocation: true` — do not write "COMMAND ONLY — does not auto-trigger" prose instead. Note: this flag also blocks preloading the skill into agents via `skills:`, so knowledge skills meant for preloading use `user-invocable: false` only.
- Interview skills run directly in conversation: never give them `context: fork`, and say in the body that the dialog stays in the main session (agents cannot hold a multi-turn dialog).
- Legacy `commands/*.md` files are not created any more: a "command" is a skill with `disable-model-invocation: true`.

## Agent frontmatter

```yaml
---
name: <kebab-case-name>
description: >
  <One or two English sentences: what the agent does and when the orchestrator should dispatch it,
  then when NOT to. State that it runs autonomously, one-shot, no dialog.>
model: <sonnet|opus|haiku|fable|inherit>   # see Model guidance
effort: <low|medium|high|xhigh|max>
tools: Read, Glob, Grep, Bash     # allowlist; read-only roles (reviewers, auditors) get no Write/Edit/Agent
disallowedTools: Agent            # alternative: denylist
skills:                           # knowledge skills preloaded at start (doctrines, conventions)
  - kotlin-conventions
memory: project                   # persistent notes across runs: user | project | local
background: true                  # keep running while the orchestrator continues
isolation: worktree               # own git worktree — only for parallel agents that would collide on files
maxTurns: 50
hooks: ...
color: blue
---
```

- Description: no `<example>` blocks, no POST-COMPLETION RULE paragraphs, no "ANY change MUST go through this agent". Agents are for sizeable, self-contained work (implement a plan, review a branch, audit drift); small edits are made by the main session itself, with the conventions it has loaded.
- `tools:` must match what the role may do: an agent described as "does not change code" must not hold Write/Edit. Never grant MCP tool names (`mcp__…`) that are not guaranteed to exist on every machine — grant the capability in prose ("use the available browser tools") or omit `tools:`.
- `memory:` for agents that learn about a codebase over time (reviewers, sync auditors).
- `skills:` replaces "read `references/<x>.md` first" for shared doctrines: the content arrives preloaded, no path resolution, no search.
- Reference files never live under `agents/` — every `*.md` under `agents/` is registered as an agent.

### Model guidance

Write `model` and `effort` explicitly; the session default is not a plan.

- `sonnet` (Sonnet 5) at `high` — implementation from a spec, tests, mechanical transformations, devops, QA; `medium` for cheap one-shots.
- `opus` (Opus 5) — review, architecture, judgement calls: `medium` for a fast review pass, `high` for design work, `xhigh` for a thorough MR review or hard debugging.
- `fable` (Fable 5) — long multi-step autonomous runs (whole phases, large refactors). The user selects it for the main session; agents rarely need it.
- `haiku` — trivial classification or formatting steps inside workflows.

Lower effort on Claude 5 still performs well. When an agent under-thinks, raise `effort` before adding prompt text.

## Component types — what a plugin can contain

A plugin is a bundle of one or more of these. Pick per the task — most plugins need only one or two. Do NOT default to "skill" reflexively.

| Component | Use when | Location | Invocation |
|---|---|---|---|
| **skill** | Multi-step or dialog-driven behavior in conversation; also background knowledge (`user-invocable: false`, optionally `paths:`). | `skills/<name>/SKILL.md` | Auto by `description`, `/<name>`, or preloaded into agents via `skills:`. |
| **agent** | Autonomous one-shot work with no dialog (review, generate, analyze) in its own context. | `agents/<name>.md` | Dispatched via the Agent tool. |
| **hook** | Must-happen or must-never-happen behavior on a harness event. The harness runs it, not the model. | `hooks/hooks.json` + `hooks/*.ps1` | Fires on the event, no user action. |
| **workflow** | Deterministic orchestration of several agents: pipelines, fan-out, judge panels, adversarial verification. | `workflows/<name>.js` | Run by a skill or by name. |
| **MCP server** | The plugin must expose external tools/data (an API, a DB, a service). | `.mcp.json` | Tools appear as `mcp__<server>__*`. |

Decision shortcuts:
- "The user describes it and I converse to refine it" → **skill**.
- "Run it and come back with a result, no back-and-forth" → **agent**.
- "The user types a slash command to do exactly X" → **skill** with `disable-model-invocation: true`.
- "Whenever event Y happens, automatically do Z" or "Z must never happen" → **hook** (the model cannot self-trigger on events, and prose cannot guarantee a prohibition).
- "A skill tells the main session to dispatch agents one after another and copy reports between them" → **workflow**; the skill shrinks to preparing inputs and running it.
- "Needs to talk to an external system" → **MCP server**.

Exact file formats: https://code.claude.com/docs/en/plugins-reference, plus `/docs/en/hooks`, `/docs/en/workflows`, `/docs/en/skills`, `/docs/en/sub-agents`. Apply this marketplace's language rule regardless of what the docs show.

## Hooks

- Scripts live in `hooks/` and are called as `powershell -NoProfile -ExecutionPolicy Bypass -File "${CLAUDE_PLUGIN_ROOT}/hooks/<script>.ps1"`. This works whether the harness launches the command from Git Bash or PowerShell and does not depend on a working `bash` in PATH.
- Typical events: `PreToolUse` (block a command — exit 2 with the reason), `PostToolUse` (format or lint the edited file, check an invariant), `SubagentStop` (record that a reviewer ran), `Stop` (refuse to finish while a required step is missing).
- Keep hooks cheap with `matcher` (tool name) and `if` (permission-rule syntax such as `Edit(**/*.go)`). A hook that runs a full build on every edit is too slow — put such checks on the commit gate instead.
- The reason text a hook returns is what the model reads to fix the problem — write it for the model, concretely.

## Workflows

- `workflows/<name>.js` starts with `export const meta = { name, description, phases }` and uses `agent()`, `pipeline()`, `parallel()`. Intermediate results stay in the script, not in the session context.
- Use `pipeline()` by default; a barrier (`parallel()` followed by another stage) only when a stage needs all prior results (dedup, judge panel, synthesis).
- The entry skill gathers inputs, runs the workflow, and does the post-steps (commit, status, journal). A workflow started by a skill the user invoked counts as the user's opt-in to multi-agent orchestration.

## Descriptions — good vs bad

**Good** (situation first, discriminator second, short):
- `Creates a git commit with a Russian past-tense message from the current changes. Use when the user asks to commit or save changes; never pushes.` with `when_to_use: "закоммить", "сохрани изменения"`.
- `Reviews the current branch against the project documentation and returns paste-ready MR comments. Runs autonomously, one-shot. For a self-contained best-practice review use code-reviewer instead.`

**Bad**:
- `IMPORTANT: Invoke this skill via the Skill tool IMMEDIATELY when…` — emphasis makes Claude 5 over-trigger.
- A dozen trigger phrases plus `or any request to …` — fires on ordinary conversation.
- `<example>` blocks with WRONG/CORRECT reasoning — cost context in every session, no longer improve triggering.
- Discriminators placed after the first ~1,000 characters — cut off, never read.

## Pre-flight validation checklist

Run before every commit that touches plugin files:

1. All modified/created `*.json` parse as valid JSON; modified `workflows/*.js` pass `node --check`.
2. `.claude-plugin/marketplace.json` has no duplicate plugin names.
3. All created/modified `SKILL.md` and `agents/*.md` files are non-empty (> 100 bytes).
4. Every created/modified `description` (together with `when_to_use`) is ≤ 1,000 characters, opens with the key use case, and contains no `<example>` block and no IMPORTANT/IMMEDIATELY/MUST emphasis.
5. If any plugin file was modified, the corresponding `plugin.json` `version` is incremented.
6. Every citation of a shared reference uses `${CLAUDE_PLUGIN_ROOT}/references/<file>.md` (skill-private files: `${CLAUDE_SKILL_DIR}/…`); nothing but agents lives under `agents/`; no `commands/` directory is created.
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
- **Plugin anatomy diagram** — only when a layout convention changes.

Version is shown ONLY in the plugins table. Section headings (`## 🛠 anton-toolkit`) and TOC anchors carry NO version, so a PATCH bump touches exactly one README cell and never breaks a TOC link. Do NOT reintroduce versions into headings or anchors.

Scope rule — edit only what the change actually affects (same minimality discipline as for plugin files; never reflow untouched sections):
- New / removed / renamed tool, or changed triggers/description → update the relevant sections above. This is the common case for `create-plugin` and `extend-plugin`.
- Pure internal behavior fix that does NOT change the tool's name, triggers, count, or one-line description (the common `improve-plugin` case) → update only the version cell in the plugins table; the prose sections need no change.

## Activation — registering is not enough

Adding a plugin to `.claude-plugin/marketplace.json` makes it *discoverable*, not *active*. A plugin runs only when it is enabled under `enabledPlugins` — in the user's `~/.claude/settings.json` for every project, or in a project's `.claude/settings.json` for that project only (e.g. `"<name>@anton-toolkit-marketplace": true`). Prefer project scope for plugins that serve one project: every enabled plugin's descriptions are loaded into every session of that scope. Skipping activation is the single most common reason a freshly created plugin "does nothing" after a restart.

- **New plugin (`create-plugin`):** after the files are committed, the plugin is registered but NOT yet active. Tell the user to enable it: run `/plugin`, find `<name>` under the `anton-toolkit-marketplace`, and enable it in the right scope — this installs it into the local cache and flips `enabledPlugins`. A plain restart is NOT enough for a brand-new plugin.
- **Existing enabled plugin (`extend-plugin`, `improve-plugin`):** the plugin is already in `enabledPlugins`, so a version bump is enough. With `autoUpdate` on for this marketplace, a restart pulls the new version; otherwise the user runs `/plugin` to update.

## File layout conventions

```
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   └── <skill-name>/
│       ├── SKILL.md
│       └── references/          # files private to this one skill (optional)
├── agents/
│   └── <agent-name>.md          # ONLY agents here — any other *.md becomes a phantom agent
├── references/                  # shared references, flat, named by topic
├── hooks/
│   ├── hooks.json
│   └── <script>.ps1
├── workflows/
│   └── <name>.js
└── .mcp.json
```

- Create only the directories the plugin actually uses — a skill-only plugin has just `skills/`.
- One SKILL.md per skill, each in its own subdirectory.
- Agents live as flat `*.md` files directly under `agents/`; nothing else goes there.
- Shared references are flat under `references/`, named by topic (not by the component that reads them).

### Citing a reference from a skill or agent

Claude Code substitutes `${CLAUDE_PLUGIN_ROOT}` (the plugin's install directory) anywhere in skill and agent bodies, and `${CLAUDE_SKILL_DIR}` (the skill's own folder) in skill bodies. Cite files with these variables — never with a bare relative path, never with one machine's absolute path, never with a search procedure.

- Correct: ``Read `${CLAUDE_PLUGIN_ROOT}/references/plugin-authoring.md` before starting.``
- Correct (skill-private file): ``The template is `${CLAUDE_SKILL_DIR}/references/compose.md`.``
- Incorrect: ``Read `references/plugin-authoring.md`.`` — resolves against the wrong directory.
- Incorrect: a paragraph explaining how to locate the file with Glob under `~/.claude/plugins` — obsolete; delete such blocks on sight.

When a skill passes a reference to an agent prompt, the variable has already been substituted in the skill body, so the agent receives an absolute path. Shared doctrine that every agent of a plugin needs is better shipped as a knowledge skill (`user-invocable: false`) and preloaded with `skills:`.
