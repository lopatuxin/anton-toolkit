# CLAUDE.md formatting rules

This document is a reference for the skill that edits CLAUDE.md.
The skill follows these rules on every change to the file.

---

## 1. Instruction budget

CLAUDE.md is loaded into every session in full, and every line competes with the actual task for attention. Official guidance: keep each CLAUDE.md file under 200 lines. A bloated file makes Claude ignore the instructions that matter.

**Limits:**
- Target: well under 200 lines per file. A file near the limit is a signal to move material out (see sections 3 and 4), not to compress wording.
- Hard cap: 200 lines.

**Before adding a new instruction** ask: "Will Claude make a mistake WITHOUT this line?" If not — don't add it.

---

## 2. File structure

The file consists of three mandatory sections + one optional:

```markdown
# Project
# Stack & Build
# Code Style        ← OPTIONAL: only for cross-cutting rules that no path-scoped source covers
# Common Mistakes
```

### 2.1. `# Project`
- 1–3 lines: what the project is, key architecture
- DO NOT describe what Claude will see from files (package.json, docker-compose.yml, folder structure)
- Include only what CANNOT be derived from code (e.g. "Each service is a separate git repository")

### 2.2. `# Stack & Build`
- Table or list: service → build, test, run commands
- ONLY commands Claude CANNOT guess from build files
- If a command is standard (`npm install`, `./gradlew build`) and present in the build file — DO NOT duplicate
- Non-standard commands, aliases, docker-compose configurations — these belong here

### 2.3. `# Code Style` (OPTIONAL section)
- Style rules for one area of the code (a language, a module, a layer) do NOT belong in CLAUDE.md. They go into a path-scoped source that loads only when Claude touches matching files: a `.claude/rules/<area>.md` file with `paths:` frontmatter in the project, or a conventions skill of the toolkit with `paths:`. CLAUDE.md keeps at most a one-line pointer.
- Create the section ONLY for cross-cutting rules that apply to every file in the repo and that no path-scoped source already states.
- Include only rules that Claude VIOLATES without explicit instruction.

**If the section is used — rule format:**
```
GOOD (specific, checkable):
- Entities: @Builder @Getter @Setter, not @Data — @Data breaks equals/hashCode in JPA entities
- ID: @GeneratedValue(strategy = GenerationType.UUID) with java.util.UUID

BAD (vague, changes nothing):
- Write clean code
- Follow best practices
```

**Instruction formatting rules (apply to ALL sections):**
- State a rule once, as a plain imperative, with the reason. Current models follow calm explicit instructions; emphasis (caps, IMPORTANT, MUST) makes them over-apply a rule rather than follow it better. Reserve NEVER/ALWAYS for the few genuine hard constraints.
- When prohibiting something — provide the alternative: "No @Data — use @Builder @Getter @Setter"
- If Claude already does the right thing by default — DO NOT write the rule
- If an action must happen (or must never happen) 100% of the time — that is a hook or a permission rule in settings, not a sentence in CLAUDE.md. Prose is advisory; hooks are enforced.

### 2.4. `# Common Mistakes`
- Mistakes Claude has ALREADY made in this project and that every future session must know about
- Format: "Do not do X — do Y instead. Reason: Z"
- Keep it short. Claude Code's auto-memory (the model's own notes per project) is the first home for lessons learned; promote a lesson into CLAUDE.md only when it keeps recurring and every session needs it from the first turn. A lesson that applies to one area of the code goes to the path-scoped rule file for that area instead.
- If the section is empty — leave a placeholder: `[Empty]`
- CLAUDE.md content is written in English (all sections, rules, placeholders). Russian is allowed only inside literal quoted strings the file documents (e.g. user-facing dialogue templates). This rule applies regardless of the language the user speaks in.

---

## 3. What is FORBIDDEN in CLAUDE.md

### 3.1. Information Claude can derive from code
Claude reads project files at session start. DO NOT duplicate:
- Port tables, Docker port mapping
- Lists of entities, controllers, endpoints
- Descriptions of how a specific filter/service works
- Environment variables (Claude will read .env, application.yml, docker-compose.yml)
- Frontend stack description (Claude will read package.json)
- Dependency descriptions (Claude will read build.gradle / pom.xml)

### 3.2. Reference materials
Architecture, API contracts, specifications — these are NOT instructions, they are reference data. They are not needed every session.

**Instead** of describing architecture in CLAUDE.md:
```markdown
BAD:
[50 lines describing JWT flow, Gateway filter, API contract]

GOOD:
Architecture and API contract: see docs/architecture.md
```

### 3.3. `@file` embed references
`@file` in CLAUDE.md embeds the file EVERY session, bloating context.

```markdown
BAD:
@docs/api-spec.md

GOOD:
When working with the API — see docs/api-spec.md
```

### 3.4. Duplication with agents, skills, rules, hooks
- If a rule already exists in an agent, a conventions skill, or a `.claude/rules/` file — DO NOT duplicate it in CLAUDE.md
- CLAUDE.md — only rules that every session needs regardless of which files are touched
- If an action must execute 100% of the time (formatting, tests, a forbidden command) — that's a hook or a permission rule, not CLAUDE.md

### 3.5. Commands implemented via skills
If an action has a skill (e.g. commit) — DO NOT describe its logic in CLAUDE.md.

### 3.6. Procedures
A multi-step procedure ("when releasing, do 1…7") is a skill, not a CLAUDE.md section. CLAUDE.md holds facts and constraints Claude must carry all the time; procedures load on demand.

---

## 4. File hierarchy

| File | What goes there | Loaded | In git? |
|---|---|---|---|
| `~/.claude/CLAUDE.md` | Global rules for ALL projects (language, commit format) | Every session | No |
| `~/.claude/rules/*.md` | User-level rules for all projects; with `paths:` frontmatter — only when matching files are touched | At start, or on path match | No |
| `./CLAUDE.md` | Project rules (stack, build, cross-cutting constraints) — main file | Every session | Yes |
| `./.claude/rules/<area>.md` | Rules for one area of the code; `paths: ["src/**/*.kt"]` frontmatter makes them load only when Claude works with matching files; without `paths:` they load at start like CLAUDE.md | On path match | Yes |
| `./.claude/CLAUDE.md`, `./CLAUDE.local.md` | Personal project settings (not for the team) | Every session | .gitignore |
| `./subdir/CLAUDE.md` | Rules for a subfolder (Claude reads when working in that folder) | On demand | Yes |
| Auto-memory (`~/.claude/projects/<project>/memory/`) | Claude's own notes: lessons, preferences, gotchas. Written by Claude, not edited by hand | Index at start | No |

Rules INHERIT top-down. DO NOT repeat in the project file what is already in the global one. When a CLAUDE.md section applies to one area only, move it to `.claude/rules/<area>.md` with `paths:` — that is the main lever for staying under the size limit.

---

## 5. Documentation warnings

If the project's docs/ contain outdated or incorrect examples — warn about it in CLAUDE.md:

```markdown
GOOD:
- auth/docs/ — Auth specs. WARNING: describe PLANNED features (Redis, Kafka) — NOT current code
- budget/docs/api/ — WARNING: examples use @Data — this VIOLATES conventions

BAD:
- auth/docs/ — Auth service specs
```

---

## 6. Skill algorithm

### When adding a new rule:
1. Check current file size (lines)
2. If file ≥150 lines — first find something to DELETE, SHORTEN, or MOVE to a path-scoped rule file
3. Check: is this rule already in agents, skills, or `.claude/rules/`?
4. Check: can Claude derive this information from code?
5. Check: does it apply to one area only? Then it goes to `.claude/rules/<area>.md` with `paths:`, not CLAUDE.md
6. Formulate concretely: condition + action + alternative + reason
7. Add to the correct section (Style / Mistakes / Build)
8. Validate: file stays under 200 lines

### When adding a Common Mistake:
1. Formulate: "Do not do X — do Y instead. Reason: Z"
2. Check: is there already a similar rule in Code Style or a rules file? If so — strengthen it instead of creating a duplicate
3. If a mistake recurs 3+ times — promote from Common Mistakes to Code Style or to the area's rule file
4. A lesson that only matters occasionally stays in auto-memory, not in CLAUDE.md

### When auditing (periodic cleanup):
1. For each rule ask: "Will Claude make a mistake without this?"
2. Remove rules Claude follows by default
3. Remove duplication with agents, skills, and rule files
4. Move area-specific sections to `.claude/rules/<area>.md` with `paths:`
5. Replace emphasis (caps, IMPORTANT, MUST) with plain statements that carry the reason
6. Merge similar rules
7. Check that the final size is under 200 lines, ideally well under

---

## 7. Rule writing cheatsheet

```markdown
# One rule, once, with the reason (the form that works on current models):
No @Data on entities — it breaks equals/hashCode in JPA. Use @Builder @Getter @Setter.
Use Records for DTOs — immutable, less boilerplate.

# Preferences:
Prefer X over Y
Use X, not Y

# Hard constraints (rare — and if it must hold 100% of the time, make it a hook):
Never run `docker compose down -v` against the prod project — it deletes the owner's data.

# With alternative (required when prohibiting):
BAD: "Never use --foo-bar"
GOOD: "Never --foo-bar — use --baz instead"

# Emphasis does not raise compliance on current models:
BAD: "IMPORTANT: You MUST ALWAYS run tests!!!"
GOOD: "Run the test suite before reporting a change as done — the Windows build is not covered by the Docker run."
```
