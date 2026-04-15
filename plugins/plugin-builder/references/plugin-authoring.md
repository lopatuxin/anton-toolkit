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
3. All created/modified `SKILL.md` and `agents/*.md` files are non-empty (> 100 bytes).
4. Each SKILL.md `description` contains at least 3 explicit trigger phrases.
5. If any plugin file was modified, the corresponding `plugin.json` `version` is incremented.

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
└── references/
    └── <topic>.md
```

- One SKILL.md per skill, each in its own subdirectory.
- Agents live as flat `*.md` files directly under `agents/`.
- References are flat under `references/`, named by topic (not by the component that reads them).
