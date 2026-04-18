---
name: plan
description: >
  IMPORTANT: Invoke this skill via the Skill tool IMMEDIATELY when the user
  asks to write an implementation plan, design a solution, or plan how to
  build something. Do NOT start planning without loading this skill first.

  Trigger phrases: "напиши план", "план реализации", "спланируй", "как
  реализовать", "составить план", "план на основе доки", "план по фронту", "план по конфе",
  "implementation plan", "/plan", or any request to create a step-by-step
  plan for a development task.

  Sources for planning: PDF docs from Confluence (in docs/ folder),
  existing frontend code, or verbal description from user.
---

# Plan — step-by-step implementation plan for an agent

Create a detailed step-by-step implementation plan that a Claude agent can execute without further clarification.

## Information sources

### 1. Confluence documentation (PDF)

The user places a PDF in the `docs/` folder at the project root.

Process:
- Read the PDF via the Read tool: `docs/<filename>.pdf`
- Extract the key content: functional requirements, business logic, constraints
- If the PDF is large — read page by page (`pages: "1-10"`, then `"11-20"`)
- Ask the user if anything in the doc is unclear

### 2. Existing frontend (code)

The user points to frontend code from which a backend or another part needs to be implemented.

Process:
- Find frontend files: components, pages, API calls
- Extract: which endpoints are called, what data is expected, what forms/actions exist
- Determine the frontend–backend contract (requests, responses, DTOs)

### 3. Verbal description

The user describes the task in words. Ask clarifying questions.

## Plan creation process

### Step 1. Gather context

- Read the source (PDF, code, description)
- Study the current project structure (modules, packages, existing patterns)
- Find similar implementations in the project — the plan must follow the same patterns
- **Mandatory layer boundary check**: scan the frontend code affected by the task for business calculations (aggregations, percentages, norms, rate/ratio metrics, clamps, formulas like `(a - b) / a * 100`). If found — see [Where calculations should live](#where-calculations-should-live); the plan MUST include moving that logic to the backend.

### Step 2. Propose approaches

If there are multiple implementation options — briefly describe each:
- Approach A: description + pros + cons
- Approach B: description + pros + cons

Ask the user which approach to take. If the approach is obvious — propose one and ask for confirmation.

### Step 3. Write the plan

Before writing the steps, re-check the [Where calculations should live](#where-calculations-should-live) section — if the task touches frontend code that already contains aggregations/formulas/percentages, the plan MUST include steps to move that logic to the backend and a step to remove the local calculation from the frontend.

The plan must be **executable by an agent**. Each step contains:

```
## Шаг N: <short name>

**Что делать**: specific action (create a file, add a method, change a config)
**Где**: exact file path or package
**Детали**:
- Which classes/interfaces to create
- Which methods with which signatures
- Which dependencies to add
- Which patterns to use (reference to a project analogue)

**Проверка**: how to confirm the step is done — ONLY automated: compilation passes, unit/integration test is green, linter/typecheck is clean. Do NOT include manual actions here (curl, docker exec, psql, open a browser, check logs).
```

### Step 4. Save the plan

Save the plan to `docs/PLAN-<short-name>.md` in the **project root** (workspace root, not inside an individual service). If the user specified another location — use it.
This allows the agent to read the plan and execute it step by step.

### Step 5. Announce the executors

After saving the plan, explicitly tell the user which agents should execute each step:

- **Java/Spring Boot steps** → `java-dev` agent (`anton-toolkit:java-dev`)
- **React/TypeScript steps** → `frontend-dev` agent (`anton-toolkit:frontend-dev`)
- After `java-dev` finishes → automatically launch `test-writer` and `code-reviewer`
- After `frontend-dev` finishes → automatically launch `code-reviewer`

Example final phrase after saving:
> Шаги 1–5 (Java) → `java-dev` агент  
> Шаг 6 (React/TypeScript) → `frontend-dev` агент

## Where calculations should live

If the project has a backend service responsible for the task's data — **all business calculations (sums, averages, aggregates, percentages, norms, rate/ratio metrics, clamps, formulas) live in the backend**. The frontend only displays ready-made fields from the API.

The rule works both ways:

**(a) Do not add new calculations to the frontend.** If a plan introduces a derived metric calculation — its place is in the Service/DTO, not a React component.

**(b) If existing frontend already contains such a calculation — the plan MUST include moving it to the backend.** This is a common mistake: the frontend is opened, a ready formula is found, and the plan silently leaves it there. That is not acceptable. The plan must contain:
1. Add the field to the relevant response DTO.
2. Implement the calculation in the Service (following existing methods as a pattern).
3. Cover with a test.
4. In the frontend — remove the local calculation and use the field from the API.

### Example: `savingsRate = (income - expenses) / income * 100`

**Bad** — plan leaves the calculation in `Index.tsx`:
> Backend is not touched — `savingsRate` is already computed on the frontend from `summary`.

**Good** — plan contains:
- Step 1: add field `savingsRate: BigDecimal` to `OverviewSummaryResponseDto`.
- Step 2: in `OverviewSummaryService` calculate `savingsRate` (handle `income = 0`) and put it in the DTO.
- Step 3: test for the calculation (including the divide-by-zero edge case).
- Step 4: in `Index.tsx` remove the local calculation, use `summary.savingsRate` from the API.

Apply the same pattern to any rate/percent/ratio metrics, aggregations, and formulas currently living on the frontend.

## Plan requirements

### Specificity
- DO NOT write "implement business logic" — write "create method `calculateDiscount(Order): BigDecimal` in `OrderService`"
- DO NOT write "add an endpoint" — write "create `POST /api/v1/orders` in `OrderController`, accepts `CreateOrderRequest`, returns `OrderResponse`"
- Every step must be executable without additional questions

### Sequence
- Steps go in implementation order (first models, then repositories, then services, then controllers)
- Each step may only depend on previous ones
- If steps are independent — mark that they can be executed in parallel

### Following project patterns
- Find similar code in the project and cite it as a reference
- For example: "following the pattern of `UserService` (src/main/java/.../UserService.java)"
- Use the same approaches: naming, package structure, error handling

### Verifiability
- Each step has a completion criterion (compilation passes, test is green)
- At the end of the plan — a final check using ONLY automated tools: project build (`gradle build` / `npm run build`) and test run (`gradle test` / `npm test`). If there are no tests for this area in the project — build only. No manual runtime actions.

## Plan output format

```markdown
# План реализации: <task name>

## Контекст
<where the requirements come from, key decisions>

## Подход
<chosen approach and why>

## Шаги

### Шаг 1: ...
### Шаг 2: ...
...

## Итоговая проверка
<how to verify everything works>
```

## What NOT to include in the plan (negative rule)

The following types of checks are manual/QA steps, not plan content. They are performed by the developer manually or by the `qa-engineer` agent AFTER the plan is executed. They must NOT appear in the plan document (neither in a step's "Проверка" nor in "Итоговая проверка"):

- `docker`, `docker-compose`, `docker exec`, `docker stats`, `docker logs` commands to check service state
- `jcmd`, thread dump, heap dump, JVM profiling
- `curl`, `httpie`, `wget`, manual HTTP requests to a locally running server to verify the response
- `psql`, `redis-cli`, `mongo`, manual DB/cache queries to check data or schema
- Checks via Chrome DevTools (Network / Console / Performance / Memory)
- Visual and manual UI checks ("open the page and look")
- Load runs, idle CPU measurements, watching logs in real time

Criterion: if a check requires a running application/container/browser — it does NOT belong in the plan. The plan is verified by the compiler, tests, and linter — and nothing else.

## Rules

- ALWAYS study the project before writing the plan — do not write a plan in a vacuum
- Ask the user if anything is unclear — better to clarify than to guess
- Do not include code in the plan — only descriptions of what to do and where
- Plan is written in Russian
- If the task is too large — break it into subtasks and suggest priorities
- Calculations, aggregations, and formulas — see the separate [Where calculations should live](#where-calculations-should-live) section above.
