# Logos web interface — specification template

Canonical structure for the Logos web-interface spec written by the `logos-ui` skill. The document
lives at `$VAULT/Logos/Дизайн/Веб-интерфейс.md` with a Russian file name and Russian headings.

This spec is the **build-ready input for the `logos-frontend-coder` agent**. It must be complete
enough that the interface can be assembled from it without guessing the screens, the elements, or
their behaviour. The frontend coder renders it in the already-established Logos style (reusing existing
tokens/components/shell), so this document defines structure and behaviour — not a new look.

**Two hard rules:**
1. **No new visual design.** Never specify colours, hex values, typography, font sizes, shadows, exact
   pixel spacing, or a visual theme — the frontend coder inherits all of that from the
   already-established Logos style and must not invent a new look. This document defines structure,
   hierarchy, grouping, order, content, behaviour, and states. Relative emphasis (primary / secondary
   / destructive action, prominent / muted) is allowed — it is structural intent, not styling.
2. **Exhaustive at the element level.** Every screen, every block, and every interactive element
   (button, field, list, table, card, modal, menu) is named, with its purpose, behaviour, the data
   it shows, and its states. "All the small details accounted for" is the bar.

All prose and headings are **Russian**. Technical terms (UI, modal, dropdown, breakpoint, API, tab,
toast, etc.) keep their original form. No runnable code — prose, numbered flows, and tables only.

**Plain-language requirement (hard rule).** Write in plain, simple Russian the user can read. No
jargon or anglicism-кальки when an ordinary Russian word exists (рендерить → «отрисовывать»,
латентность → «задержка», стейт → «состояние», инвариант → «нерушимое правило»). Keep only genuine
interface/technology terms and code identifiers; explain every screen and behavior in human terms,
keeping all the concrete detail.
Cross-reference sibling design docs with Obsidian wiki-links: `[[Концепт]]`, `[[Архитектура]]`.

---

## Document structure

```markdown
---
tags:
  - logos
  - дизайн
  - интерфейс
---

# Веб-интерфейс — Logos

[[Концепт]] · [[Архитектура]]

## 1. Обзор интерфейса
## 2. Карта экранов
## 3. Навигация и переходы
## 4. Глобальный каркас (layout shell)
## 5. Экраны (детально)
## 6. Переиспользуемые компоненты
## 7. Пользовательские флоу
## 8. Состояния и обратная связь
## 9. Адаптивность (структурная)
## 10. Доступность и взаимодействие
## 11. Связь экранов с системой
## 12. Открытые вопросы и расхождения с архитектурой
```

---

## What each section holds

### 1. Обзор интерфейса
3–6 sentences: what the web interface is for, the primary user, the device/platform target
(desktop-first / mobile too), and the overall shell pattern (e.g. persistent sidebar + main area,
top nav, command-bar-driven). Link the interface purpose to what Logos does per `[[Архитектура]]`.

### 2. Карта экранов
A flat or hierarchical list/table of EVERY screen/page: name, route/path (logical, e.g.
`/панель`, `/память`, `/журнал`), one-line purpose, and parent (for nesting). This is the sitemap —
it must be complete; every screen detailed in section 5 appears here.

### 3. Навигация и переходы
How the user moves through the interface: the global navigation structure (what is always reachable),
entry points (first screen after login), and a transition map — for each screen, which screens it
leads to and via what action. Cover back/breadcrumbs, deep links, and modal-vs-page decisions.

### 4. Глобальный каркас (layout shell)
The persistent regions present across screens and what each contains: e.g. header (logo slot, global
search, user menu, notifications), sidebar/nav (sections, order, collapse behaviour), main content
area, optional right panel, footer. Define the regions and their content/order — not their look.

### 5. Экраны (детально)
The core of the spec. **One subsection per screen.** For each:

```markdown
### 5.X <Название экрана>  (route: `/...`)

**Назначение:** <what it is for, who uses it, when.>

**Каркас экрана:** <which layout regions it uses; the content layout — areas/columns/sections and
their order and grouping (structure, not pixels).>

**Блоки и элементы:**
- <Блок 1> — <purpose>. Элементы:
  - <Элемент: кнопка/поле/список/таблица/карточка/модалка/меню> — <что делает, поведение при
    взаимодействии, какие данные показывает, относительный приоритет (primary/secondary/destructive)>.
  - ... (every element named — do not summarize "и т.д.")
- <Блок 2> — ...

**Данные на экране:** <which entities/fields are displayed and where they come from (tie to
section 11 / `[[Архитектура]]`).>

**Состояния:** пусто | загрузка | ошибка | успех | частично загружено | нет прав — <what the screen
shows in each.>

**Валидации и обратная связь:** <what is validated, what messages/confirmations/toasts appear.>

**Крайние случаи:** <empty collections, long lists, very long text, concurrent edits, offline, etc.>
```

Repeat for every screen in the sitemap. Be exhaustive — this is what `logos-frontend-coder` builds from.

### 6. Переиспользуемые компоненты
Shared UI components used across screens (buttons, cards, modals, tables, forms, dropdowns,
notifications/toasts, confirmation dialogs, empty-states). For each: its purpose, variants
(structural, e.g. "table with selectable rows" / "compact list"), and behaviour. Defining them once
keeps the per-screen sections short and consistent.

### 7. Пользовательские флоу
The key end-to-end flows as numbered steps mapped to screens and elements — e.g. «Пользователь даёт
Logos задачу → экран Панель → кнопка "Новая задача" → модалка ввода → переход на экран Выполнение →
…». Cover the 3–6 most important flows. This shows the screens connect into real work.

### 8. Состояния и обратная связь
Global patterns (so screens don't redefine them): how loading is shown, how errors are surfaced, the
empty-state pattern, success feedback, confirmations for destructive actions, the notification/toast
system. Structural behaviour only.

### 9. Адаптивность (структурная)
What restructures at narrow widths: which regions collapse (e.g. sidebar → drawer), what reflows,
what is hidden behind a menu, table → card behaviour. Describe the structural change at logical
breakpoints — not exact pixel widths or visual styling.

### 10. Доступность и взаимодействие
Structural a11y/interaction expectations: keyboard navigation and focus order, dialog/modal focus
trapping and dismissal, semantic grouping/labels, tab order, primary-action-on-Enter conventions.
No colour-contrast (that is inherited from the established Logos style, not specified here).

### 11. Связь экранов с системой
For each screen (or grouped), which Logos capability, data source, or API surface it consumes —
mapping the interface onto `[[Архитектура]]`. THIS section is the primary place the spec touches the
architecture, so the `logos-ui` sync step reads it to find what the architecture must support.

### 12. Открытые вопросы и расхождения с архитектурой
Anything the interface needs that the architecture does not yet cover or contradicts, plus genuine
open UX questions for the user. The `logos-ui` sync step works from this section: resolved items move
into `Архитектура.md`; unresolved ones are surfaced to the user.
