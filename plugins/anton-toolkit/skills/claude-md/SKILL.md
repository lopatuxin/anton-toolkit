---
name: claude-md
description: >
  IMPORTANT: Invoke this skill via the Skill tool IMMEDIATELY when the user
  asks to create, edit, audit, or clean up a CLAUDE.md file. Do NOT modify
  CLAUDE.md without loading this skill first — it contains strict formatting
  rules and size limits in references/.

  Trigger phrases: "claude.md", "CLAUDE.md", "создай claude.md",
  "обнови claude.md", "почисти claude.md", "аудит claude.md",
  "приведи в порядок claude.md", "оформи claude.md",
  "синхронизируй claude.md", "проект изменился обнови claude.md",
  "освежи claude.md под проект", "/claude-md",
  or any request to create, refresh, or modify a CLAUDE.md file.
---

# CLAUDE.md — creation and maintenance

Create or clean up a CLAUDE.md file following the strict rules from `references/rules.md`.

## Process

### Creating a new CLAUDE.md

1. **Study the project:**
   - Read build files (`build.gradle.kts`, `pom.xml`, `package.json`)
   - Read existing configs (`application.yml`, `docker-compose.yml`, `.env`)
   - Look at the folder structure
   - Find agents and skills in plugins — do not duplicate their rules
   - **Check installed plugins** (skills and agents). If java-dev, frontend-dev, or other code-writing agents are present — do NOT create a `# Code Style` section. Style rules live in agents.
   - **Check skills** (commit, devops, etc.). If an action is already implemented by a skill — do NOT describe its logic in CLAUDE.md.

2. **Determine what is NOT obvious from the code** — only that goes into CLAUDE.md:
   - Non-standard build/run commands
   - Architectural decisions that cannot be derived from files
   - Mistakes Claude has already made

3. **Write the file using the structure** from `references/rules.md`:
   - `# Project` — 1–3 lines
   - `# Stack & Build` — only non-standard commands
   - `# Code Style` — ONLY if the project has NO code-writing agents (java-dev, frontend-dev). If agents are present — do NOT create the section, even if the project has conventions. Cross-agent contracts (API format) go into docs/ with a reference link.
   - `# Common Mistakes` — placeholder `[Пока пусто]` if no mistakes have occurred yet

4. **Check limits:** 80–120 lines, ≤2500 tokens. Hard cap — 150 lines.

### Auditing an existing CLAUDE.md

1. **Read the current file**
2. **For each rule ask:** "Will Claude make a mistake WITHOUT this line?"
3. **Remove:**
   - Information Claude can derive from code (ports, entities, endpoints)
   - Duplication with plugin agents and skills
   - Vague rules ("write clean code")
   - `@file` embed references — replace with "see docs/..."
4. **Strengthen:** weak formulations → NEVER/ALWAYS + alternative
5. **Check limits** after edits

### Refreshing CLAUDE.md after major project changes

Use this mode when the user says the project has changed significantly and CLAUDE.md is out of sync — new agents/skills added, build commands changed, services renamed, old features removed. Differs from `Auditing`: audit only enforces the `references/rules.md` style guide; refresh re-checks the file against the CURRENT project state and can both remove stale info and add what is now missing. Differs from creating from scratch: refresh PRESERVES user-added rules and existing `# Common Mistakes` entries that are still valid.

1. **Read the current CLAUDE.md** — note every project line, rule, and `# Common Mistakes` entry that is already there
2. **Re-scan the project as if creating from scratch:**
   - Build files, configs, folder structure
   - Installed plugins/agents/skills (java-dev, frontend-dev, commit, devops, etc.)
   - `docs/` for reference materials and warnings
3. **Diff current file vs reality and decide per item:**
   - Stale rules (refer to removed code, dropped stack, gone services) → REMOVE
   - New non-obvious commands or architectural decisions found in code → ADD
   - New agents/skills now installed → REMOVE anything CLAUDE.md duplicates from them
   - User-added rules and existing `# Common Mistakes` entries that are still relevant → KEEP VERBATIM
4. **Show the user a clear diff** (what is removed, what is added, what is kept) BEFORE writing the file
5. **Check limits** after edits — target 80–120 lines, hard cap 150

### Adding a rule

1. Check current file size — if ≥120 lines, first find something to DELETE or SHORTEN
2. Check whether the rule already exists in agents/skills
3. Check whether Claude can derive the information from the code
4. Formulate: condition + action + alternative
5. Add to the correct section

## Rules

- ALWAYS read `references/rules.md` before any CLAUDE.md change
- ALWAYS show the final file to the user before saving
- DO NOT duplicate information from code, agents, or skills
- DO NOT exceed 150 lines / 3000 tokens
- When prohibiting something — ALWAYS provide an alternative
