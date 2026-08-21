---
name: feature-planner
description: >
  Interview-driven feature planning: turns a vague idea, ticket, or brief into a confirmed,
  actionable spec saved to docs/plans/ before any code is written, then offers handoff to
  a dev agent. Use when the user wants to plan, refine, or clarify a feature before
  implementation; skip it when the spec is already confirmed or the change fits in one
  sentence (delegate straight to java-dev, kotlin-dev, python-dev, go-dev, or frontend-dev,
  or just implement it), use debug for a bug report, and improve-plugin / create-plugin /
  extend-plugin for a plugin skill or agent. Runs in the main conversation; the interview
  is not delegated to agents.
when_to_use: >
  "спланируй фичу", "продумай фичу", "вот тз", "помоги спланировать", "/feature-planner"
---

# Feature Planner — interview-driven feature spec

Turn a vague idea, ticket, or brief into a plan a dev agent can implement without further questions. The dialog stays in the main session — agents cannot hold a multi-turn conversation.

Ask, do not assume: an ambiguity left in the brief becomes a bug at implementation time, and a guess the user did not catch becomes wrong code. The mirror failure is just as real: a change that can be described in one sentence needs no plan — say so and go straight to implementation.

## 1. Triage

Read everything the user provided — a file, a ticket, a link, inline text — in full before asking anything. When the user names an existing class, module, or endpoint, read it too: many "unknowns" are answered by a minute of code reading, and a question the codebase answers wastes the user's time.

Then sort the feature into what is already clear and what is not. Clear from the brief, the docs, or the code — do not interview for it. Open — that is the interview. Tell the user which mode you are in, in one line:

```
Документация найдена в `<путь / тикет>` — прочитал. Уточняю пробелы.
```

or

```
Документации нет — задам вопросы по ключевым аспектам фичи.
```

## 2. Interview — only the gaps

Ask in plain Russian text in the conversation, two or three questions per turn, and wait for the written reply before asking more. Long lists get shallow answers. A binary or multiple-choice question is asked in text as well, with the options spelled out in the sentence («MVP или полная версия?», «новый эндпоинт или расширение существующего?»).

Cover what is still open among these, skipping whatever the brief, the docs, or the code already settle:

- Goal and consumer: what real problem this solves, and for whom (end user, internal service, another team).
- Success criteria: a concrete observable check, not «должно работать».
- Scope boundary: what is explicitly out of this iteration.
- Behavior: inputs and their validation, outputs and their destination, business rules, edge cases (empty input, missing fields, duplicate calls, concurrent requests, oversized payloads), error behavior (retry, fail fast, user-visible message, silent log).
- Technical context: affected modules, integrations, data-model and migration changes, API shape (method, path, auth, request and response), UI pages or flows.
- Non-functional, only where relevant: load and latency, auth and PII, what to log (messages in Russian per project convention), backward compatibility or a feature flag.
- Tests: the flows that must be covered automatically, any manual smoke check after deployment.

When asking about an ambiguity in provided documentation, quote the exact fragment rather than paraphrasing it: «В тз сказано "возвращает список заказов" — какой формат: массив объектов или объект с полем `items`?».

When the feature depends on a library, framework, or SDK API, consult its current documentation through the documentation tools available in the session, narrowed to the specific API in use rather than the library name. If no current docs are found, say so in the plan so the dev agent knows that part rests on training-data memory.

No file edits and no agent launches during the interview. Stop asking as soon as the plan would hold without guesses — the goal is a confident plan, not a maximal question count.

## 3. Recap

Present the plan in Russian in this structure and ask: «Подтверди план или скажи, что поправить.» Iterate until the user confirms.

```markdown
## Фича: <название>

### Цель
<один абзац>

### Scope
- В рамках: <...>
- Вне scope: <...>

### Функциональные требования
1. <точное поведение>

### Edge cases и обработка ошибок
- <сценарий>: <ожидаемое поведение>

### Технические детали
- Затронутые модули: <...>
- Изменения схемы данных: <да/нет, детали>
- API: <метод, путь, запрос, ответ>
- UI: <страницы/компоненты>
- Библиотеки: <library@version — ключевое API-решение, либо «актуальных доков не нашёл»>

### Non-functional
- <только относящееся к делу>

### План реализации
1. <шаг>

### Тесты
- <сценарий>
```

No placeholders like «TODO: уточнить» — an open point goes back to the interview, not into the plan.

## 4. Plan file

Write the confirmed plan to `docs/plans/<feature-slug>.md`, creating the directory if needed. Chat context gets compacted; the file survives and is what the dev agent reads. Slug: a ticket ID lowercased as the prefix when there is one (`tradex-69-<short-name>.md`), otherwise kebab-case of the feature name (`user-export-csv.md`). Prepend a short header:

```markdown
# Plan: <feature name>
Created: <YYYY-MM-DD>
Ticket: <TICKET-ID or "—">
Status: confirmed

<plan body>
```

Then tell the user: «План сохранён в `docs/plans/<feature-slug>.md`.»

## 5. Hand-off

Offer to start implementation — the user may decline:

```
Запустить реализацию через <java-dev | kotlin-dev | python-dev | go-dev | frontend-dev>? Передам путь к плану.
```

Pick the agent by the affected module's language. Pass the plan file path in the agent's prompt, not the plan body. When the work spans several stacks, name the agents that will run one after another.

## Anti-patterns

- Asking everything at once — the user disengages and answers shallowly.
- Inventing a technical decision the user did not state («выбрал REST» — ask which protocol).
- Re-asking what the documentation or the code already states.
- Running the full interview for a one-sentence change — or skipping it for a task that «seems clear» while it still has open points.
- Writing version-specific library API details from memory when the documentation tools in the session can confirm them.
- Keeping the plan only in chat, or inlining its body into the dev agent prompt instead of the path.
