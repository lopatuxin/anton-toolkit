# Logos design document templates

Canonical structure for the Logos design documents. The council members (shaping the shared
draft), the synthesizer (writing the final), and the `logos-design` orchestrator (writing the
concept inline) all follow these templates. Documents live under `$VAULT/Logos/Дизайн/` with
Russian file names and Russian headings.

All design documents are **Russian** in headings and prose. Technical terms (LLM, VRAM, RAG,
GPU, OpenRouter, gRPC, API, etc.) keep their original form. No runnable code in any document —
prose, pseudo-API shapes, and numbered flows only.

**Plain-language requirement (hard rule, not a preference).** These documents are read by the USER,
so write them in plain, simple Russian a non-specialist can follow. Do NOT use jargon, academic
phrasing, or anglicism-кальки when an ordinary Russian word exists. Keep only two kinds of non-plain
tokens: (a) real technology/product names (PostgreSQL, Qdrant, FastAPI, API, VRAM, GPU, OpenRouter)
and (b) code identifiers in backticks that tie the prose to real code. Everything else is plain
Russian, and every mechanism is explained in human terms — what happens, in what order, and why; add
a short «простыми словами: …» clause where a point is subtle. Replace кальки with plain Russian,
e.g.: эмбеддинг → «числовой отпечаток»; релевантность → «близость по смыслу»; ранжирование →
«упорядочивание по…»; оверсэмпл → «брать с запасом»; латентность → «задержка»; деградация → «как
ведёт себя при сбоях»; инвариант → «нерушимое правило»; контракт → «договорённость»; субстрат →
«хранилище»; консолидация → «ночная переработка». Keep every number, name, and guarantee — change
only HOW it is said, never dumb down the substance.
- Incorrect: «Ранжирование кандидатов по релевантности с оверсэмплом снижает латентность деградации.»
- Correct: «Записи упорядочиваются по близости к запросу; кандидатов берём с запасом. При сбоях
  память не падает, а отвечает пустым срезом.»

Cross-reference sibling documents with Obsidian wiki-links: `[[Концепт]]`, `[[Архитектура]]`,
`[[Модули/Память]]` — never relative markdown paths.

---

## Концепт

Path: `$VAULT/Logos/Дизайн/Концепт.md`. Short — captures WHAT Logos is and WHY, no technical
depth. Written inline by the orchestrator, seeded from the user's idea note.

```markdown
---
tags:
  - logos
  - дизайн
---

# Концепт — Logos

[[Архитектура]]

## Что это
## Зачем (видение и сверхзадача)
## Ключевые принципы
## Ключевые сценарии использования
## Сознательные ограничения (ресурсы, подход)
## Что вне scope на старте
```

---

## Архитектура

Path of the final: `$VAULT/Logos/Дизайн/Архитектура.md`. The council's shared working draft
(`_черновики/Черновик-архитектуры.md`) uses this SAME structure: the lead writes the skeleton over
all sections, then each member deepens the one section matching their role and reviews the rest. The
sections map onto the council's areas of expertise — that is deliberate, so each member owns exactly
one section and addresses questions to whoever owns the section they object to.

Sections, strictly in this order, with exactly these Russian names:

1. **Обзор** — 3–5 sentences linking the concept to the technical approach.
2. **Ключевые архитектурные решения** — bulleted major decisions, one-line justification each.
3. **Иерархия оркестрации** — the central "brain" → block orchestrators (e.g. programming, research) → agent swarms. How control and tasks flow down, how results flow up, how a block orchestrator is structured. Inter-agent protocol (how agents talk).
4. **Подсистема памяти** — how memory is stored and evolves: importance/strength weights, the nightly consolidation pass (generalize, tag, re-weight), how strength rises on success and falls on failure, retrieval. (This is the heart of Logos — detail it.)
5. **Модельный слой** — the swarm of small specialized models vs one large LLM; the path from ready-made models (Chinese via OpenRouter) to local models on owned hardware; routing a task to the right model; fine-tuning approach.
6. **Автономность и самомодификация** — how the system writes its own tools/skills, how new capabilities are registered, and the SAFETY boundaries on self-modification (what it may not touch, rollback, human gate).
7. **Слой взаимодействия и веб-интерфейс** — how the user-facing web frontend integrates into the system as a first-class layer: the client↔brain contract (how user input enters the orchestration hierarchy, how results and live telemetry/diagnostics stream back), the real-time channel, the session/state boundary, and which surfaces exist at the architecture level (e.g. chat, metrics/diagnostics). This section owns the *integration contract* that wires the frontend into orchestration, memory, and models — NOT the detailed page/element/UX spec, which lives in `[[Веб-интерфейс]]` (owned by the `logos-ui` skill). Keep the two consistent: this section says how the frontend plugs into the system; `[[Веб-интерфейс]]` says what each screen contains.
8. **Ресурсный бюджет** — hardware assumptions (e.g. ~72 GB VRAM target), what runs where, what is feasible without datacenter-scale compute, and where cost/compute forces a simpler path.
9. **Потоки данных** — 2–4 of the most important end-to-end flows in prose or numbered lists (e.g. "user asks to fix code → central brain → programming orchestrator → agents → memory updated"). No diagrams-as-code.
10. **Стек и инфраструктура** — concrete technology choices per layer with one-line justifications, fitted to the resource constraints.
11. **Риски и открытые вопросы** — what could not be resolved, and the biggest risks (technical, resource, safety).

The eleven sections map onto the council's areas of expertise: six are **owned** by one member each
(`Иерархия оркестрации`→orchestration, `Подсистема памяти`→memory, `Модельный слой`→models,
`Автономность и самомодификация`→autonomy, `Слой взаимодействия и веб-интерфейс`→frontend,
`Ресурсный бюджет`→resources). The cross-cutting sections (`Обзор`, `Ключевые архитектурные решения`,
`Потоки данных`, `Стек и инфраструктура`, `Риски и открытые вопросы`) are shaped by everyone.

### Scratch-draft-only header

The council's shared working draft (not the final) carries one line at the very top, before
**Обзор**, written by the lead in skeleton mode, to mark it as scratch:

`> Черновик совета — общий рабочий документ`

The FINAL `Архитектура.md` does NOT carry this line and never mentions "draft", "council", or
"discussion log" — that machinery is invisible to the document's reader.

---

## Модуль (optional, later)

Once the architecture is stable, a single subsystem can be detailed into its own module
document at `$VAULT/Logos/Дизайн/Модули/<Русское-имя>.md` (e.g. `Память.md`, `Оркестрация.md`).

```markdown
---
tags:
  - logos
  - дизайн
  - модуль
---

# Модуль — <имя>

[[Архитектура]]

## Назначение и границы
## Внутреннее устройство
## Интерфейсы (вход/выход)
## Модель данных
## Ключевые алгоритмы (прозой)
## Зависимости от других модулей
## Обработка ошибок и крайние случаи
## Открытые вопросы
```

---

## Детализация модуля (module-detailing protocol)

The architecture document is the SYSTEM-wide picture: deliberately broad, with gaps left in each
element. A module document closes those gaps for ONE element — it is the deep, build-ready
specification of that single element. The `logos-design` skill produces it the SAME deliberative way
it produces the architecture: through the council, on a shared draft, with a discussion log — never as
one agent's monologue. This protocol defines that module-detailing round; the council agents and the
synthesizer follow it when the orchestrator dispatches them with **mode `module-detailing`**.

**Target element.** The orchestrator names ONE system element to detail (e.g. `Память`, `Оркестрация`,
`Модельный слой`, `Веб-интерфейс`) and resolves all paths:
- module draft: `$VAULT/Logos/Дизайн/_черновики/Черновик-модуля-<имя>.md`
- module discussion log: `$VAULT/Logos/Дизайн/_черновики/Журнал-обсуждения-модуля-<имя>.md`
- final module document: `$VAULT/Logos/Дизайн/Модули/<имя>.md` (the `Модуль` template above).

**The draft uses the `Модуль` template, NOT the eleven-section architecture structure.** In a module
round there is no per-member "owned section"; instead every member contributes the parts of THIS
element that fall under their lens, wherever those land in the `Модуль` template:
- orchestration → how the element is commanded/called, its place in the control hierarchy, its contracts.
- memory → what the element reads from / writes to memory, weights, consolidation touchpoints.
- models → which models the element uses, routing, on-device vs OpenRouter for this element.
- autonomy → how the element may be self-modified/extended, registration, safety boundaries for it.
- frontend → how the element surfaces to or is driven by the web frontend, the client↔element contract.
- resources → the element's footprint (VRAM, storage, latency) against the budget; where it must be cut.

A member whose lens does NOT touch the element contributes nothing to the draft and raises no
questions — silence is correct. The orchestrator only dispatches the members whose lens is relevant
to the named element.

**Round shape (same machinery as the architecture phase, scoped to one element):**
1. **Skeleton** — the orchestration architect creates the module draft from the `Модуль` template,
   filling each section at a high level from the architecture, and parking the deep per-lens
   decisions in `Открытые вопросы` for the specialists.
2. **Contribute** — each relevant member, SEQUENTIALLY, deepens the parts of the `Модуль` document
   under its lens and opens cross-lens questions in the module discussion log (same numbered-entry
   format as the architecture log).
3. **Resolve** — each member with open questions addressed to it answers them (fix or defend), one
   bounded round.
4. **Synthesize** — the synthesizer consolidates the converged module draft into the final
   `Модули/<имя>.md`, references the architecture as `[[Архитектура]]`, and folds anything still open
   into `Открытые вопросы`.

All language, no-code, and decisiveness rules from the architecture phase carry over unchanged.
