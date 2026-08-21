---
name: feature-planner
description: >
  Interview-driven feature planning: turns a vague idea, ticket, or brief into a confirmed,
  actionable spec saved to docs/plans/ before any code is written, then offers handoff to
  a dev agent. Use when the user wants to plan, refine, or clarify a feature before
  implementation; skip it when the spec is already confirmed (delegate straight to
  java-dev, kotlin-dev, python-dev, go-dev, or frontend-dev), use debug for a bug report, and
  improve-plugin / create-plugin / extend-plugin for a plugin skill or agent. Runs in the
  main conversation; the interview is not delegated to agents.
when_to_use: >
  "спланируй фичу", "продумай фичу", "вот тз", "помоги спланировать", "/feature-planner"
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

### Step 6 — Check current library docs (when the feature depends on a library API)

If the feature depends on the API of a library, framework, SDK, or cloud service (from Step 3 — Technical context), consult its current documentation through the documentation tools available in the session — a docs connector with resolve-library-id / query-docs when present, otherwise WebFetch of the official docs. Narrow the query to the specific API / feature in use (e.g. "Spring Boot 3 WebFlux router function", "Kotlin coroutines flow buffer operator", "PostgreSQL JSONB indexing") — not just the library name.

Tell the user briefly what you are checking:

```
Сверяюсь с актуальной документацией: <библиотека 1>, <библиотека 2>, ...
```

Use the fetched docs to:
- Validate the technical approach against current best practices (not training-data assumptions).
- Catch deprecated methods, renamed APIs, signature changes, new required arguments.
- Cite specific version-correct syntax / configuration in the plan.

Skip this step when the feature is pure business logic with no external library calls, or when the library is internal to the user's monorepo — say so explicitly.

If no current docs could be found for a given library — say so in the plan ("актуальных доков для X не нашёл, использована память из обучения") so the dev agent knows the source is uncertain.

### Step 7 — Present and confirm the plan

Once requirements are gathered (and library docs checked where Step 6 applied), present a structured plan in this exact format (in Russian — user-facing output):

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

### Актуальные библиотеки
- <library@version>: <key API decision / current syntax used in plan>
- <library@version>: <...>
- <library>: актуальных доков не нашёл — использована память из обучения (uncertain)

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
Запустить реализацию через <java-dev | kotlin-dev | python-dev | go-dev | frontend-dev>? Передам путь к плану.
```

Pick the agent based on the affected module type. Pass the plan file path in the agent's prompt — do NOT inline the plan body. If work spans multiple stacks, list the agents that will run sequentially.

## Interview rules

- **Limit per turn**: 2-4 questions per turn, never a wall of 20. The user will give shallow answers to long lists.
- **Prefer `AskUserQuestion`** for binary / multi-choice. Use chat for open-ended.
- **Skip irrelevant sections**: applies to steps 2-6 (step 6 has its own skip rule inside). Steps 7-8 (plan + persist) are always executed.
- **Quote the doc**: when asking about an ambiguity in provided documentation, quote the exact fragment — do not paraphrase. Example: "В тз сказано «возвращает список заказов» — какой формат: массив объектов или объект с полем `items`?"
- **Read code first**: if the user references existing modules / classes / endpoints, read them before asking. Do not ask questions the codebase answers.
- **Check library docs when the feature depends on a library API**: do not write version-specific API details from training-data memory when the documentation tools in the session can confirm them.
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
- Writing version-specific library API details from memory because you "know" the library — training data lags behind real versions; check the docs when the feature depends on them.
- Keeping the plan only in chat — always write `docs/plans/<feature-slug>.md`, no exceptions.
- Inlining the entire plan body into a dev agent prompt — pass the file path instead.
