# Kimi adaptation

The shared editable source is https://github.com/lopatuxin/anton-toolkit, under `plugins/`. Kimi packages under `kimi/plugins/` are generated; do not edit them or installed managed copies. Personal rules and memory remain in Obsidian.

## Paths and tools

`PLUGIN_ROOT` means the installed plugin directory containing this document, and `SKILL_DIR` means the directory containing the active SKILL.md. Resolve these placeholders to actual absolute paths before reading files or running commands; they are explanatory placeholders, not environment variables. `${KIMI_SKILL_DIR}` is expanded natively when a skill is loaded.

Read, Glob/Grep, Edit/Write and Bash in shared procedures mean the available native tools. Use the owner's Git Bash on Windows for commands you run; commands given to the owner must be PowerShell. Tool names in source procedures are examples, not permission to invent missing APIs. Use Kimi's native image-generation plugin for images.

## Agents and workflows

Source agent roles are installed as native Kimi agents. When a procedure names `plugin:role` as an Agent `subagent_type`, pass the bare `role` name. Agents inherit the main session model; Claude and Codex model allocations do not apply. Before dispatch, read the role's `agents/<role>.md` and any convention skills it names. The owner must explicitly authorize delegation.

`Agent({...})`, `Workflow({...})` and similar source notation describe roles and ordering. Use native Agent calls only when delegation is authorized. Read workflow scripts to preserve dependencies, conditions, fix-round limits and result handling; do not execute them as standalone Node programs or call an absent Workflow tool. If the required independent review cannot be delegated, report that limitation.

Claude and Codex hook definitions are not activated in Kimi packages. The owner's review-gate discipline still applies through the permanent Kimi instructions.

## Editing and publishing

Edit shared behavior in `plugins/`, Kimi-only behavior in `adapters/kimi/`, and packaging in `scripts/`. Run `npm ci --ignore-scripts`, `npm test`, `npm run build`, and `npm run check` before publishing. Commit generated `kimi/` alongside source edits. Update installed copies with `scripts/sync-marketplace.ps1 -Client Kimi`; open a new chat or run `/plugins reload` afterwards.
