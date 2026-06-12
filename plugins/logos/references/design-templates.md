# Logos design document templates

Canonical structure for the Logos design documents. The council members (shaping the shared
draft), the synthesizer (writing the final), and the `logos-design` orchestrator (writing the
concept inline) all follow these templates. Documents live under `$VAULT/Logos/Дизайн/` with
Russian file names and Russian headings.

All design documents are **Russian** in headings and prose. Technical terms (LLM, VRAM, RAG,
GPU, OpenRouter, gRPC, API, etc.) keep their original form. No runnable code in any document —
prose, pseudo-API shapes, and numbered flows only.

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
7. **Ресурсный бюджет** — hardware assumptions (e.g. ~72 GB VRAM target), what runs where, what is feasible without datacenter-scale compute, and where cost/compute forces a simpler path.
8. **Потоки данных** — 2–4 of the most important end-to-end flows in prose or numbered lists (e.g. "user asks to fix code → central brain → programming orchestrator → agents → memory updated"). No diagrams-as-code.
9. **Стек и инфраструктура** — concrete technology choices per layer with one-line justifications, fitted to the resource constraints.
10. **Риски и открытые вопросы** — what could not be resolved, and the biggest risks (technical, resource, safety).

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
