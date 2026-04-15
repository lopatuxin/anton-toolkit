# Document Templates

Canonical section structure for each document type in `docs/`. All agents and the orchestrator skill follow these templates so documents stay consistent across projects and iterations.

All documents are English Markdown. No runnable code. Pseudo-API shapes and pseudo-types are welcome.

## concept.md

```markdown
# Concept — <Product Name>

## What it is
One paragraph. Plain language. A non-technical reader should understand the product after this section.

## Who it's for
The user types. For each: one sentence on who they are and what they need.

## Why it exists (problem & value)
The pain being solved. What's missing today. Why this specific solution is the right shape for it.

## Key scenarios
Numbered list of the 2–5 most common flows the product supports. One paragraph each, user's perspective.

## Constraints
Hard limits: platforms, regulatory, scale, budget, timeline. Bullet list.

## Out of scope
Explicit non-goals. What the product deliberately does NOT do. Bullet list.
```

## architecture.md

```markdown
# Architecture — <Product Name>

## Overview
3–5 sentence technical summary.

## Key architectural decisions
Bulleted list. Each entry: decision + one-line rationale.

## Components
For each component: **Name** — responsibility (1 sentence), owned data, exposed interfaces, dependencies.

## Data flow
2–4 most important end-to-end flows, traced in prose.

## Data model (high level)
Main entities and relationships. Shape only, not full schemas.

## Stack
Technology choices per layer, each with one-line rationale.

## Cross-cutting concerns
Auth, logging, error handling, configuration, observability. One short section each.

## Deployment topology
Where each component runs. How they're packaged and connected in production.

## Open questions
Unresolved decisions the user should weigh in on.
```

## modules/<name>.md

```markdown
# Module — <Name>

## Purpose
2–3 sentences. Why this module exists.

## Responsibilities
Bulleted list of what this module owns.

### Non-responsibilities
Bulleted list of what it explicitly does NOT do.

## Public interface
API exposed to the rest of the system. One line per entry.

## Data model
Tables / collections / types owned by this module. Fields with types, key relationships.

## Key flows
2–4 scenarios traced step by step in prose.

## Dependencies
Other modules / external services this one calls. What it needs from each.

## Error handling
What can go wrong, how the module reacts.

## Stack & libraries
Concrete choices for this module, one-line rationale each.

## Configuration
Environment variables, secrets, tunables. Name, purpose, default.

## Open questions
Unresolved decisions.
```

## Consistency rules across documents

- **Concept** speaks user language. **Architecture** speaks system language. **Modules** speak implementation language (without code).
- A capability mentioned in concept.md must be traceable into architecture.md (some component owns it) and into at least one module.
- Architecture.md's component list is the source of truth for which modules exist. `docs/modules/` must match it — no orphan module docs, no missing ones.
- When a change affects multiple levels, edit top-down: concept → architecture → modules. This keeps the narrative consistent.
