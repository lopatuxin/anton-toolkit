# Qwen adaptation

The shared editable source is https://github.com/lopatuxin/anton-toolkit, under `plugins/`. Qwen packages under `qwen/plugins/` are generated; do not edit them or the linked extension copies. Personal rules and memory remain in Obsidian.

## Paths and tools

`PLUGIN_ROOT` means the installed extension directory containing this document, and `SKILL_DIR` means the directory containing the active SKILL.md. Resolve these placeholders to actual absolute paths before reading files or running commands; they are explanatory placeholders, not environment variables. The extension root is two directories above `skills/<name>/SKILL.md`; a skill invocation also states its base directory.

Read, Glob/Grep, Edit/Write and Bash in shared procedures mean the native Qwen tools: `read_file`, `glob`, `grep_search`, `edit`, `write_file` and `run_shell_command`. On the owner's Windows machine `run_shell_command` executes under cmd.exe; commands given to the owner must be PowerShell. Tool names in source procedures are examples, not permission to invent missing APIs.

## Agents and workflows

Source agent roles are installed as native Qwen subagents, registered as `<extension>:<role>` (for example `anton-toolkit:code-reviewer`). Pass the registered name shown in the agent catalog as `subagent_type`. Agents inherit the main session model; Claude model and effort frontmatter does not apply. Before dispatch, read the role's `agents/<role>.md` and any convention skills it names. The owner must explicitly authorize delegation.

`Agent({...})`, `Workflow({...})` and similar source notation describe roles and ordering. Use native agent calls only when delegation is authorized. Read workflow scripts to preserve dependencies, conditions, fix-round limits and result handling; do not execute them as standalone Node programs. If the required independent review cannot be delegated, report that limitation.

## Hooks

The anton-toolkit package ships the owner's review-gate hooks with Qwen tool matchers: the edit/write_file touched-files ledger, the `run_shell_command` commit gate, the Stop gate and the reviewer SubagentStop mark. They are active once the extension's hooks are approved at link time; every script fails open on an incompatible payload. Never bypass a gate unless the owner asks.

## Editing and publishing

Edit shared behavior in `plugins/`, Qwen-only behavior in `adapters/qwen/`, and packaging in `scripts/`. Run `npm ci --ignore-scripts`, `npm test`, `npm run build`, and `npm run check` before publishing. Commit generated `qwen/` alongside source edits. Update linked extensions with `scripts/sync-marketplace.ps1 -Client Qwen`; restart Qwen Code afterwards.
