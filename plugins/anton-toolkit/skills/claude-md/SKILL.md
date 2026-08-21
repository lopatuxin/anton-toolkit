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

Create or clean up a CLAUDE.md file following the strict rules from `${CLAUDE_SKILL_DIR}/references/rules.md`.

## Process

### Creating a new CLAUDE.md

1. **Study the project:**
   - Read build files (`build.gradle.kts`, `pom.xml`, `package.json`)
   - Read existing configs (`application.yml`, `docker-compose.yml`, `.env`)
   - Look at the folder structure
   - Find agents and skills in plugins — do not duplicate their rules
   - **Check installed plugins, conventions skills, and `.claude/rules/`.** Style rules for one area of the code (a language, a module) belong in a path-scoped source — a `.claude/rules/<area>.md` file with `paths:` or a conventions skill — not in CLAUDE.md. Do NOT create a `# Code Style` section for rules such a source already covers.
   - **Check skills** (commit, devops, etc.). If an action is already implemented by a skill — do NOT describe its logic in CLAUDE.md.

2. **Determine what is NOT obvious from the code** — only that goes into CLAUDE.md:
   - Non-standard build/run commands
   - Architectural decisions that cannot be derived from files
   - Mistakes Claude has already made

3. **Write the file using the structure** from `${CLAUDE_SKILL_DIR}/references/rules.md`:
   - `# Project` — 1–3 lines
   - `# Stack & Build` — only non-standard commands
   - `# Code Style` — ONLY for cross-cutting rules that apply to every file and that no agent, conventions skill, or `.claude/rules/` file already states. Area-specific conventions go to `.claude/rules/<area>.md` with `paths:`. Cross-agent contracts (API format) go into docs/ with a reference link.
   - `# Common Mistakes` — placeholder `[Empty]` if no mistakes have occurred yet

4. **Check limits:** under 200 lines per file (official guidance); a file near the limit means something should move to a path-scoped rule file, not be compressed.

### Auditing an existing CLAUDE.md

1. **Read the current file**
2. **For each rule ask:** "Will Claude make a mistake WITHOUT this line?"
3. **Remove:**
   - Information Claude can derive from code (ports, entities, endpoints)
   - Duplication with plugin agents and skills
   - Vague rules ("write clean code")
   - `@file` embed references — replace with "see docs/..."
4. **Strengthen:** vague formulations → concrete condition + action + alternative + reason; replace emphasis (caps, IMPORTANT, MUST) with plain statements
5. **Check limits** after edits

### Refreshing CLAUDE.md after major project changes

Use this mode when the user says the project has changed significantly and CLAUDE.md is out of sync — new agents/skills added, build commands changed, services renamed, old features removed. Differs from `Auditing`: audit only enforces the `${CLAUDE_SKILL_DIR}/references/rules.md` style guide; refresh re-checks the file against the CURRENT project state and can both remove stale info and add what is now missing. Differs from creating from scratch: refresh PRESERVES user-added rules and existing `# Common Mistakes` entries that are still valid.

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
5. **Check limits** after edits — under 200 lines

### Adding a rule

1. Check current file size — if ≥150 lines, first find something to DELETE, SHORTEN, or MOVE to `.claude/rules/<area>.md`
2. Check whether the rule already exists in agents/skills
3. Check whether Claude can derive the information from the code
4. Formulate: condition + action + alternative
5. Add to the correct section

## Rules

- ALWAYS read `${CLAUDE_SKILL_DIR}/references/rules.md` before any CLAUDE.md change
- ALWAYS show the final file to the user before saving
- ALWAYS write CLAUDE.md content in English — section bodies, rules, comments, placeholders. CLAUDE.md is model-facing, not user-facing. Russian is allowed ONLY for: (a) direct quotes of user-provided strings that must remain verbatim (project name, brand copy), (b) literal commit-message templates or other user-facing dialogue snippets the file documents. Section headers (`# Project`, `# Stack & Build`, `# Common Mistakes`) are already English — keep them so. Correct: `Backend is only planned in docs/architecture.md — do NOT treat the spec as current code.` Incorrect: `Бэкенд только спроектирован в docs/architecture.md — не считать спецификацию текущей реализацией.`
- DO NOT duplicate information from code, agents, or skills
- DO NOT exceed 200 lines
- When prohibiting something — ALWAYS provide an alternative
