# Codex adaptation

The shared editable source is https://github.com/lopatuxin/anton-toolkit, under `plugins/`. Codex packages under `codex/plugins/` are generated; do not edit them or installed caches. Find the owner's existing checkout by its Git remote before editing. Personal rules and memory remain in Obsidian. They do not own marketplace plugin source anymore.

## Paths and tools

In generated instructions, `PLUGIN_ROOT` means the installed plugin directory containing this skill, and `SKILL_DIR` means the directory containing the active SKILL.md. Resolve these placeholders to actual absolute paths before reading files or running commands; they are explanatory placeholders, not guaranteed shell variables. For a skill at `<root>/skills/<name>/SKILL.md`, the plugin root is `<root>`. For nested reference files, keep the root established when the skill was loaded.

Read, Glob/Grep, Edit/Write and Bash in shared procedures mean the available native reading, search, editing and shell tools. Use PowerShell on Windows. Skill means read that skill's SKILL.md. Tool names are examples, not permission to invent missing APIs. Use the native image-generation tool for images; do not invoke Codex recursively through codex-rescue.

## Agent dispatch

The role table below is the owner's explicit Codex model allocation. Use it for standalone dispatches, task-build stages, fix rounds and repeated reviews. Explicit user instructions take precedence. Unlisted roles inherit the main session; never pass Claude model names as Codex models.

{{MODEL_TABLE}}

task-build and feature-planner run in the main session on the user's selected model and reasoning effort. The table does not add test-writer or mr-spec-reviewer to task-build: their existing invocation conditions remain unchanged.

For a listed role, call collaboration.spawn_agent with explicit `model`, `reasoning_effort`, and `fork_turns="none"`. Full-history forks cannot override models. Include the absolute role SKILL.md path, task, repository/module and plan paths, constraints, necessary previous-stage results and relevant user instructions, since no conversation history is inherited. Keep the allocation for follow-up work. If the model or override is unavailable, report it before substituting.

Correct: dispatch kotlin-dev with model="gpt-6.1-sol", reasoning_effort="high", fork_turns="none", and a self-contained message. Incorrect: omit the model or combine an override with fork_turns="all".

Read each role's generated launch requirements before dispatch. Its source preloaded skills and tool restrictions are preserved there as instructions. Load the listed convention skills explicitly; Codex does not preload Claude agent frontmatter. Read-only roles remain read-only, except that a completed reviewer may record the review mark.

Agent({...}), subagent_type and Workflow({...}) in shared procedures describe roles and ordering from Claude. Use available collaboration tools when delegation is authorized. Read workflow scripts to preserve dependencies, conditions, fix-round limits and result handling; do not execute them as standalone Node programs or call an absent Workflow tool. If delegation is unavailable, report the missing independent review. Follow current host limits on agent count.

## Review hooks

Keep the owner's review gate. Generated Codex hooks track apply_patch and support .claude/review-gate and .codex/review-gate. Installation does not grant trust: review hooks through the native interface before relying on enforcement. Never programmatically approve hook trust. A reviewer records hooks/review-mark.ps1 only after completing the review without blockers. A generic agent completion is not a review mark.

## Editing and publishing

Edit the shared `plugins/` source for common behavior, `adapters/codex/` for Codex-only behavior, and `scripts/` for packaging. Keep Claude model/effort frontmatter intact unless the user asks to change it. Codex models live in `adapters/codex/models.json`.

Before publishing, run `npm ci`, `npm test`, `npm run build`, and `npm run check` from the repository root. Commit the generated `codex/` and `.agents/plugins/marketplace.json` alongside the source edits. GitHub also rebuilds Codex packages after pushes to main, so source edits made in either application reach both consumers. Never push personal rules, credentials or memory from Obsidian into this marketplace.
