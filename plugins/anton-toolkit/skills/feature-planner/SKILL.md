---
name: feature-planner
description: >
  IMPORTANT: Invoke this skill via the Skill tool IMMEDIATELY when the user
  wants to plan a new feature, gather requirements, refine a task brief into
  an actionable spec, or design something before implementation. Do NOT skip
  the interview — feature implementation without confirmed scope produces
  wrong results.

  Trigger phrases: "спланируй фичу", "распланируй фичу", "разработай план реализации",
  "продумай фичу", "спроектируй фичу", "хочу реализовать фичу", "нужно реализовать фичу",
  "вот задача — спланируй", "вот документация — спланируй", "вот тз", "уточни детали",
  "уточни нюансы", "помоги спланировать", "interview по фиче", "/feature-planner",
  "/plan-feature", or any request to plan or design a feature before writing code.

  Discrimination: this skill runs the REQUIREMENTS interview BEFORE implementation.
  If the user already has a confirmed spec and only wants implementation — skip this
  skill and delegate directly to the appropriate dev agent (java-dev, kotlin-dev,
  python-dev, frontend-dev). If the user reports a bug — use `debug` instead. If the
  feature is a new skill or agent for a plugin in the `anton-toolkit-marketplace` (not
  product code) — use `improve-plugin` / `create-plugin` / `extend-plugin` instead.

  This skill runs DIRECTLY in conversation. Do NOT launch subagents for the
  interview part — subagents lose context between turns and cannot do iterative
  dialog with the user.
---

# Feature Planner — interview-driven feature spec

Convert a vague feature idea or a partial brief into a precise, actionable implementation spec by interviewing the user. The output is a structured plan a dev agent can implement without further clarification.

## Core principle

**Ask, do not assume.** Every ambiguity becomes a bug at implementation time. If you guess and the user does not catch the guess, you will write the wrong code.

## Process

### Step 0 — Triage the input

Look at what the user actually provided:

- **Documentation, spec, ticket description, or pasted brief is present** (file path, link, ID, or inline text): read it FULLY before asking anything. Then identify gaps, ambiguities, and contradictions. Ask ONLY about those. Do not re-ask what the doc already states clearly.
- **Only a short feature description, no doc**: start from a blank template and walk through the relevant sections below.
- **Mixed** (short brief + linked ticket / file): read the artifact first, then ask about what is still unclear.

State the mode in one line so the user knows what is happening:

```
Документация найдена в `<путь / тикет>` — прочитал. Уточняю пробелы.
```

or

```
Документации нет — задам вопросы по ключевым аспектам фичи.
```

### Step 1 — Initial overview (always confirm these)

Even when docs exist, confirm the basics first. Ask 2-3 questions per turn — never dump the whole list of 10+ at once:

1. **Goal**: what real problem does this feature solve? Who is the consumer (end user, internal service, another team)?
2. **Success criteria**: how do we verify it works? A concrete observable check, not "должно работать".
3. **Scope boundary**: what is explicitly OUT of scope for this iteration?

Use `AskUserQuestion` for binary or multi-choice questions ("MVP или полная версия?", "новый эндпоинт или расширение существующего?"). Use open chat when the answer is free-form.

### Step 2 — Functional requirements

Drill into specifics based on the goal. Skip sections that clearly do not apply (e.g. there are no inputs for a scheduled job):

- **Inputs**: what data comes in? Source? Format? Required vs optional fields? Validation rules?
- **Outputs**: what is produced? Format? Destination (UI, DB, queue, file, external API)?
- **Business rules**: conditional logic, calculations, limits, ordering rules.
- **Edge cases**: empty input, missing fields, duplicate calls, concurrent requests, oversized payloads — for each, what is the expected behavior?
- **Error scenarios**: how should the system respond when X fails? Retry? Fail fast? User-visible message? Logged silently?

### Step 3 — Technical context

- **Where**: which module / service / component is affected? New code or modification of existing?
- **Integrations**: external APIs, internal services, DB tables, message queues — which are touched?
- **Data model**: schema changes? Migration required? Backward compatible?
- **API surface**: if adding or changing an endpoint — method, path, auth requirements, request and response shape.
- **UI** (if applicable): is there a design? Pages or components affected? User flow?

When the user references an existing class / module — READ IT before asking. Many "unknowns" are answered by 30 seconds of code reading and asking a question whose answer is in the code wastes the user's time.

### Step 4 — Non-functional requirements

Ask only what is relevant — do not enumerate the whole checklist when half is obviously N/A:

- **Performance**: expected load, latency target, sync or async, batch size limits.
- **Security / auth**: who can call this, permission checks, PII handling, audit logging.
- **Observability**: what events to log, metrics to expose. Log messages in Russian per project convention.
- **Backward compatibility**: must old clients keep working? Feature flag needed? Migration window?

### Step 5 — Testing strategy

- **Critical test scenarios**: which flows MUST be covered by automated tests?
- **Test data**: any specific fixtures or edge values the user wants verified?
- **Manual verification**: is there a manual smoke check after deployment?

### Step 6 — Verify current library docs via context7 (mandatory)

Before drafting the plan, list every library / framework / SDK / cloud service that this feature will touch (derived from Step 3 — Technical context). For EACH one, query the `context7` MCP to fetch current documentation:

1. Resolve the library ID — use the context7 tool whose name ends in `resolve-library-id` (typically exposed as `mcp__plugin_context7_context7__resolve-library-id`).
2. Pull the relevant section — use the context7 tool that returns documentation by library ID. Depending on the wrapper version it is exposed as `mcp__plugin_context7_context7__get-library-docs` or `mcp__plugin_context7_context7__query-docs`. Pick whichever is available in the current environment.
3. Narrow the query to the specific API / feature in use (e.g. "Spring Boot 3 WebFlux router function", "Kotlin coroutines flow buffer operator", "PostgreSQL JSONB indexing") — not just the library name.

Tell the user briefly what you are checking:

```
Сверяюсь с актуальной документацией через context7: <библиотека 1>, <библиотека 2>, ...
```

Use the freshly fetched docs to:
- Validate the technical approach against current best practices (not training-data assumptions).
- Catch deprecated methods, renamed APIs, signature changes, new required arguments.
- Cite specific version-correct syntax / configuration in the plan.

Skip context7 ONLY when:
- The feature is pure business logic with no external library calls.
- The library is internal to the user's monorepo (context7 will not have it) — say so explicitly.

In all other cases — ALWAYS run context7. Training data lags behind real library versions, and outdated assumptions silently corrupt the plan.

If context7 returns nothing useful for a given library — say so in the plan ("context7: no current docs for X, used training-data assumption") so the dev agent knows the source is uncertain.

### Step 7 — Present and confirm the plan

Once requirements are gathered AND context7 verification is done, present a structured plan in this exact format (in Russian — user-facing output):

```markdown
## Фича: <название>

### Цель
<one-paragraph summary>

### Scope
- В рамках: <list>
- Вне scope: <list>

### Функциональные требования
1. <numbered list with exact behavior>

### Edge cases и обработка ошибок
- <scenario>: <expected behavior>

### Технические детали
- Затронутые модули: <list>
- Изменения схемы данных: <yes/no, details>
- API: <method, path, request, response>
- UI: <pages/components affected>

### Актуальные библиотеки (context7)
- <library@version>: <key API decision / current syntax used in plan>
- <library@version>: <...>
- <library>: context7 не вернул актуальных доков — использована память из обучения (uncertain)

### Non-functional
- <only relevant items>

### План реализации
1. <step>
2. <step>
...

### Тесты
- <scenario>
```

Then ask:

```
Подтверди план или скажи, что поправить.
```

Iterate on feedback until the user confirms.

### Step 8 — Persist the plan to `docs/plans/` (mandatory)

ALWAYS write the confirmed plan to `docs/plans/<feature-slug>.md`. This is not optional — chat context gets compressed by the harness, but a file on disk does not, and dev agents read the file directly.

Slug rules:
- If a ticket ID is mentioned (e.g. `TRADEX-69`) — prefix the slug with it lowercase: `tradex-69-<short-name>.md`.
- Otherwise — kebab-case of the feature name: `user-export-csv.md`.

File content is the markdown plan from Step 7, with a short header prepended:

```markdown
# Plan: <feature name>
Created: <YYYY-MM-DD>
Ticket: <TICKET-ID or "—">
Status: confirmed

<plan body from Step 7>
```

Create the `docs/plans/` directory if it does not exist. After writing, tell the user:

```
План сохранён в `docs/plans/<feature-slug>.md`.
```

### Step 9 — Offer handoff to a dev agent

After the plan is saved, offer to launch implementation (the user may decline — that is fine):

```
Запустить реализацию через <java-dev | kotlin-dev | python-dev | frontend-dev>? Передам путь к плану.
```

Pick the agent based on the affected module type. Pass the plan file path in the agent's prompt — do NOT inline the plan body. If work spans multiple stacks, list the agents that will run sequentially.

## Interview rules

- **Limit per turn**: 2-4 questions per turn, never a wall of 20. The user will give shallow answers to long lists.
- **Prefer `AskUserQuestion`** for binary / multi-choice. Use chat for open-ended.
- **Skip irrelevant sections**: applies to steps 2-5 only. Step 6 (context7) follows its own skip rules described inside that step. Steps 7-8 (plan + persist) are always executed.
- **Quote the doc**: when asking about an ambiguity in provided documentation, quote the exact fragment — do not paraphrase. Example: "В тз сказано «возвращает список заказов» — какой формат: массив объектов или объект с полем `items`?"
- **Read code first**: if the user references existing modules / classes / endpoints, read them before asking. Do not ask questions the codebase answers.
- **Always verify libraries via context7**: do not write a technical plan from training-data memory. Query context7 for every external library touched, even ones you "know".
- **Always persist the plan to a file**: never keep the confirmed plan only in chat — context compaction will lose it.
- **Do not start implementation during the interview**. No file edits, no agent launches, until the user confirms the plan at step 7 AND the plan is saved at step 8.
- **Stop when clear**: the goal is a confident plan, not maximum question count.

## Anti-patterns to avoid

- Asking everything at once → user disengages and gives shallow answers.
- Inventing technical decisions the user did not state ("выбрал REST" — wrong, ask which protocol).
- Producing a plan with placeholders like "TODO: уточнить" — clarify BEFORE writing the plan.
- Skipping the interview because the task "seems clear" — it almost never is.
- Re-asking what the documentation already states clearly.
- Starting to write code mid-interview because an answer felt sufficient.
- Skipping context7 because you "know" the library — training data lags behind real versions; verify.
- Keeping the plan only in chat — always write `docs/plans/<feature-slug>.md`, no exceptions.
- Inlining the entire plan body into a dev agent prompt — pass the file path instead.
