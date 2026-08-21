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

**Simplicity requirement (hard rule — the design decides what the code becomes, so bloat starts here).**
The system these documents describe must be simple, functional, easy to extend and easy to debug
(the simplicity rule of the code doctrine, `${CLAUDE_PLUGIN_ROOT}/skills/logos-doctrine/SKILL.md`, is binding on the DOCUMENTS too). A design document names a
mechanism ONLY for a need that exists today — a scenario in the concept, a capability the owner asked for,
a failure already observed — never for a problem that has not happened yet, and never "for robustness".
Every mechanism must be explainable to the owner in ONE plain sentence, and it must be VISIBLE to him where
it acts (a line in the chat feed, a card in the panel); a mechanism that would work silently is not
designed. Failure handling in the design is always the same one sentence — «сбой честно показывается
хозяину, дальше решает он» — never a per-case machinery of retries, fallbacks, guards, thresholds and
degradation paths. Judging what a model answered (language, length, quality) is never a design mechanism:
the owner judges, and swaps the model from «Панель управления». Extra model calls, background channels,
config knobs, registries and telemetry are costs the document must justify by a present need, not features.
When a document grows a section that only enumerates what could go wrong, that section is cut, not built.
- Correct: «Редактор переводит черновик мозга; его ответ уходит хозяину как есть. Если редактор не ответил,
  хозяин видит в ленте честную ошибку и при желании меняет модель в панели.»
- Incorrect: «После редактуры ответ проверяется на долю кириллицы и длину; при провале переспрашивается та
  же модель, затем следующий кандидат реестра, затем модель мозга в роли редактора, затем черновик как
  есть» — five mechanisms for a failure nobody has seen, all silent.

Cross-reference sibling documents with Obsidian wiki-links: `[[Концепт]]`, `[[Архитектура]]`,
`[[Модули/Память]]` — never relative markdown paths. **A wiki-link may point ONLY at a note that exists
inside the vault**: never link your own assistant-memory files (kebab-case English slugs living outside
the vault), skill names, plugin folders, or bare concepts — none of them are notes, the link can never
resolve, and it shows the user a dead link. Write the substance as plain prose instead.

**Documentation hygiene (hard rule — the document states the current + target system, never its history).**
A design document describes how the system works now and the target design it is heading toward — it is
NOT a changelog. All history lives in the decision journal (`${CLAUDE_PLUGIN_ROOT}/references/diary-format.md`),
never in the document:
- **No history narration in the document.** No "we decided / it used to be / resolved on Фаза-NN / this is
  (not) a drift" prose. State the current fact and, where useful, the target design plainly; put the
  decision, the rejected alternatives, and the "why" in the journal.
- **`Открытые вопросы` / `Риски и открытые вопросы` hold ONLY still-open items.** The moment a question is
  resolved, fold the answer into the document's prose as a plain fact and DELETE the question from this
  section. A resolved question left sitting here is exactly the clutter this rule forbids.
- **Never record a code↔documentation drift inside a document** (no "ДРЕЙФ" callouts or `[!note]` boxes that
  argue "current vs target, this is/isn't a drift"). Bring the document to the truth; record the drift and
  its resolution in the journal.
- **Journal-first before deleting.** Before removing a resolved item, make sure its substance already lives
  in the journal; if not, write the journal entry first, then delete. Move knowledge, never lose it.
- Correct: an element that used to run on CPU now runs on GPU → the document simply states it runs on GPU
  (plus the target, if any); the CPU→GPU story is a journal entry.
- Incorrect: leaving a note «раньше на CPU, это разрешённый дрейф, см. Фазу-06» in the document, or keeping
  an already-resolved item under `Открытые вопросы`.

**Document decomposition (hard rule — split by responsibility, never let one document grow unbounded).**
These documents are read by AI agents that must load a document whole to use any part of it, so an
oversized document taxes every later build: the coder implementing ONE contract pays to read the entire
file. The code doctrine (the `logos-doctrine` skill, its module-size rule) already forbids
god-modules for exactly this reason — the same rule binds the documents.
- **Checkpoint at ~600 lines, hard ceiling at 1200.** When the document you are writing or editing crosses
  ~600 lines, ask whether it now holds more than one responsibility; if it does, split it. NEVER leave a
  design document above 1200 lines — split it in the same round in which you grew it past the ceiling.
- **Split into a subfolder of pages, one responsibility per page, keeping the original file as the hub
  note beside the folder:** `Дизайн/Модули/Планировщик.md` (hub) plus `Дизайн/Модули/Планировщик/Цена-и-потолки.md`,
  `.../Задачи-и-крючки.md`, … . This layout already exists in the vault (`Дизайн/Архитектура.md` +
  `Дизайн/Архитектура/`, `Модули/Планировщик/`, `Модули/Процедурная-память/`, `Модули/Память/`) — follow
  it, never invent a second one.
- **Inside the subfolder lives a small folder note named exactly like the folder** (`Планировщик/Планировщик.md`,
  `Архитектура/Архитектура.md`) — the vault's folder-notes plugin opens it when the folder is clicked. It is
  NOT the document: it says so, points back at the hub one level up, and lists the pages with a Dataview
  `LIST` query. The hub beside the folder keeps only what a page cannot: the element's purpose and
  boundaries, the map of its pages with a ONE-LINE description of each, and the cross-links to sibling
  documents. All deep detail moves down into the pages.
- **Split along responsibilities, never along a line count.** Each page must be one coherent thing an agent
  can read alone and act on (the lifecycle, the data model, the edge cases, the resource footprint,
  the contract with its callers). Cutting a document mid-topic at line 600 is worse than leaving it long.
- Correct: `Модули/Процедурная-память.md` as a hub (purpose, boundaries, page map) plus one page per
  responsibility under `Модули/Процедурная-память/`.
- Incorrect: `Модули/Память.md` at 2800 lines holding purpose, internals, interfaces, data model,
  algorithms, dependencies and edge cases at once — no agent can load it to change one contract.

**Freshness stamp (`проверено`) — machine-maintained, never written by hand.** A design document may carry
two frontmatter fields recording when it was last confirmed to agree with the code:

```yaml
проверено: 2026-07-29     # date of the last clean sync audit of THIS document
проверено-код: a1b2c3d    # the code-repo commit it was checked against
```

- **Only `logos-build` writes them**, in its record step, and only for the documents `logos-sync` audited
  and reported clean in that run. No other tool sets them, and `logos-sync` itself changes nothing.
- **As a document writer you never add or update them.** A document you have just written or edited is
  unverified by definition: if the fields are present and you changed the document's substance, DELETE
  them rather than carrying a stale stamp forward.
- **Absence means "never verified"** — a normal state for a new document, not an error to fix.

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

Path of the final: `$VAULT/Logos/Дизайн/Архитектура.md`. In the vault today this is a **hub plus a
folder of pages**, the decomposition layout described above: `Дизайн/Архитектура.md` is the hub and
holds the cross-cutting sections (`Обзор`, `Ключевые архитектурные решения`, a page map «Карта
архитектуры», `Потоки данных`, `Стек и инфраструктура`, `Риски и открытые вопросы`); each domain-owned
section is its own page in `Дизайн/Архитектура/` (`Иерархия-оркестрации.md`, `Подсистема-памяти.md`,
`Модельный-слой.md`, `Автономность.md`, `Ресурсный-бюджет.md`), and `Архитектура/Архитектура.md` is only
the folder note pointing back at the hub. The interaction layer has no page of its own there: its
architecture-level rules (thin client, the control panel) sit in the hub's key decisions and the
screen↔system contracts in `Веб-интерфейс/Контракты-с-системой.md`. A fresh architecture is still
written as ONE document with all the sections below and is split into this shape only when it outgrows
the size rule (Phase 5 of `logos-design`); an edit to an existing section goes to the page that holds it.
Two notes share the name `Архитектура`; the vault links the hub with the bare `[[Архитектура]]` almost
everywhere, and `[[Дизайн/Архитектура]]` is the unambiguous form when a link must not be mistaken for the
folder note.

The council's shared working draft (`_черновики/Черновик-архитектуры.md`) uses this SAME section list:
the lead writes the skeleton over all sections, then each member deepens the one section matching their
role and reviews the rest. The sections map onto the council's areas of expertise — that is deliberate,
so each member owns exactly one section and addresses questions to whoever owns the section they object
to.

Sections — the required content whatever the file layout — strictly in this order, with exactly these
Russian names:

1. **Обзор** — 3–5 sentences linking the concept to the technical approach.
2. **Ключевые архитектурные решения** — bulleted major decisions, one-line justification each.
3. **Иерархия оркестрации** — the central "brain" → block orchestrators (e.g. programming, research) → agent swarms. How control and tasks flow down, how results flow up, how a block orchestrator is structured. Inter-agent protocol (how agents talk).
4. **Подсистема памяти** — how memory is stored and evolves: importance/strength weights, the nightly consolidation pass (generalize, tag, re-weight), how strength rises on success and falls on failure, retrieval. (This is the heart of Logos — detail it.)
5. **Модельный слой** — the swarm of small specialized models vs one large LLM; the path from ready-made models (Chinese via OpenRouter) to local models on owned hardware; routing a task to the right model; fine-tuning approach.
6. **Автономность и самомодификация** — how the system writes its own tools/skills, how new capabilities are registered, and the SAFETY boundaries on self-modification (what it may not touch, rollback, human gate).
7. **Слой взаимодействия и веб-интерфейс** — how the user-facing web frontend integrates into the system as a first-class layer: the client↔brain contract (how user input enters the orchestration hierarchy, how results and live telemetry/diagnostics stream back), the real-time channel, the session/state boundary, and which surfaces exist at the architecture level (e.g. chat, metrics/diagnostics). This section owns the *integration contract* that wires the frontend into orchestration, memory, and models — NOT the detailed page/element/UX spec, which lives in `[[Веб-интерфейс]]` (owned by the `logos-ui` skill; a folder `Дизайн/Веб-интерфейс/` with a hub note of the same name and one page per screen, see `${CLAUDE_PLUGIN_ROOT}/references/web-ui-spec-template.md`). Keep the two consistent: this section says how the frontend plugs into the system; `[[Веб-интерфейс]]` says what each screen contains.
8. **Ресурсный бюджет** — hardware assumptions (e.g. ~72 GB VRAM target), what runs where, what is feasible without datacenter-scale compute, and where cost/compute forces a simpler path.
9. **Потоки данных** — 2–4 of the most important end-to-end flows in prose or numbered lists (e.g. "user asks to fix code → central brain → programming orchestrator → agents → memory updated"). No diagrams-as-code.
10. **Стек и инфраструктура** — concrete technology choices per layer with one-line justifications, fitted to the resource constraints.
11. **Риски и открытые вопросы** — only what is STILL genuinely unresolved, plus the biggest risks (technical, resource, safety). Remove each item the moment it is resolved (fold the answer into prose, record the reasoning in the journal — see Documentation hygiene above); this section is not an archive of settled decisions.

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
## Как ведёт себя при сбое
## Открытые вопросы
```

«Как ведёт себя при сбое» is ONE short paragraph, not a catalogue: what the owner sees when this element
fails (the honest error line, where), and nothing more, unless the concept itself demands a specific
behaviour on a specific failure — then name that ONE behaviour and the present need behind it. Do NOT
enumerate hypothetical edge cases and give each its own mechanism; do NOT design retries, fallbacks,
guards or "safe defaults" here. A former «Обработка ошибок и крайние случаи» section met in an existing
document is read under the same rule: only what a present need demands survives, the rest is cut.

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
3. **Resolve** — each member with open questions addressed to it answers them (fix, defend, or drop the
   mechanism — dropping is the default answer to a worry about an unseen failure), one bounded round.
4. **Synthesize** — the synthesizer consolidates the converged module draft into the final
   `Модули/<имя>.md`, references the architecture as `[[Архитектура]]`, and folds anything STILL genuinely
   open into `Открытые вопросы` (resolved items and drift flags are dropped from the document, not
   archived — see Documentation hygiene).

All language, no-code, and decisiveness rules from the architecture phase carry over unchanged.
