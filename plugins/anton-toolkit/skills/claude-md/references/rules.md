# CLAUDE.md formatting rules

This document is a reference for the skill that edits CLAUDE.md.
The skill MUST follow these rules on every change to the file.

---

## 1. Instruction budget

The Claude Code system prompt occupies ~50 instructions out of ~150–200 that the model can reliably follow. CLAUDE.md has ~100–150 instructions at most.

**Limits:**
- Target size: 80–120 lines, ≤2500 tokens
- Hard cap: 150 lines / 3000 tokens
- When exceeded — compliance drops UNIFORMLY for ALL rules

**Before adding a new instruction** ask: "Will Claude make a mistake WITHOUT this line?" If not — don't add it.

---

## 2. File structure

The file consists of three mandatory sections + one optional:

```markdown
# Project
# Stack & Build
# Code Style        ← OPTIONAL: only if code is written without agents
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
- Non-standard commands, aliases, docker-compose configurations — MANDATORY

### 2.3. `# Code Style` (OPTIONAL section)
- Include ONLY if code is sometimes written WITHOUT agents (directly in the main session)
- If ALL code is written via agents (java-dev, frontend-dev, etc.) — do NOT create the section. Style rules live in agents.
- If the section is needed — only rules that Claude VIOLATES without explicit instruction

**If the section is used — rule format:**
```
GOOD (specific, ~89% compliance):
- Entities: @Builder @Getter @Setter — NEVER @Data
- ID: @GeneratedValue(strategy = GenerationType.UUID) with java.util.UUID

BAD (vague, ~35% compliance):
- Write clean code
- Follow best practices
```

**Instruction formatting rules (apply to ALL sections):**
- Use NEVER / ALWAYS / ONLY for hard constraints
- When prohibiting something — ALWAYS provide an alternative: "NEVER @Data — use @Builder @Getter @Setter"
- If Claude already does the right thing by default — DO NOT write the rule

### 2.4. `# Common Mistakes`
- Mistakes Claude has ALREADY made in this project
- Format: "DO NOT do X — do Y instead. Reason: Z"
- This section grows organically through the feedback loop
- If the section is empty — leave a placeholder: `[Пока пусто]`

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

### 3.4. Duplication with agents, skills, hooks
- If a rule already exists in an agent (e.g. java-dev knows about Records) — DO NOT duplicate in CLAUDE.md
- CLAUDE.md — only CROSS-agent rules
- If an action must execute 100% of the time (formatting, tests) — that's a hook, not CLAUDE.md

### 3.5. Commands implemented via skills
If an action has a skill (e.g. commit) — DO NOT describe its logic in CLAUDE.md.

---

## 4. File hierarchy

| File | What goes there | In git? |
|---|---|---|
| `~/.claude/CLAUDE.md` | Global rules for ALL projects (language, commit format) | No |
| `./CLAUDE.md` | Project rules (stack, build, style) — main file | Yes |
| `./.claude/CLAUDE.md` | Personal project settings (not for the team) | .gitignore |
| `./subdir/CLAUDE.md` | Rules for a subfolder (on-demand, Claude reads when working in that folder) | Yes |

Rules INHERIT top-down. DO NOT repeat in the project file what is already in the global one.

---

## 5. Documentation warnings

If the project's docs/ contain outdated or incorrect examples — MANDATORY warn about it:

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
1. Check current file size (lines + approximate token count)
2. If file ≥120 lines — first find something to DELETE or SHORTEN
3. Check: is this rule already in agents or skills?
4. Check: can Claude derive this information from code?
5. Formulate concretely: condition + action + alternative
6. Add to the correct section (Style / Mistakes / Build)
7. Validate: file stays ≤150 lines

### When adding a Common Mistake:
1. Formulate: "DO NOT do X — do Y instead. Reason: Z"
2. Check: is there already a similar rule in Code Style? If so — strengthen it instead of creating a duplicate
3. If a mistake recurs 3+ times — promote from Common Mistakes to Code Style

### When auditing (periodic cleanup):
1. For each rule ask: "Will Claude make a mistake without this?"
2. Remove rules Claude follows by default
3. Remove duplication with agents and skills
4. Merge similar rules
5. Check that the final size is ≤120 lines

---

## 7. Rule writing cheatsheet

```markdown
# Strong signals (for hard constraints):
NEVER, ALWAYS, ONLY, FORBIDDEN, MANDATORY

# Medium signals (for preferences):
Prefer X over Y
Use X, not Y

# With reason (increases compliance):
NEVER @Data — breaks equals/hashCode in JPA entities
Use Records for DTOs — immutable, less boilerplate

# With alternative (MANDATORY when prohibiting):
BAD: "Never use --foo-bar"
GOOD: "Never --foo-bar — use --baz instead"
```
