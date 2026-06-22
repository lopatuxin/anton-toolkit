# Logos phase document template

Canonical structure for a single Logos delivery phase. The `logos-phases` skill writes one file per
phase following this template. Phases live under `$VAULT/Logos/Дизайн/Фазы/` with Russian file names
and Russian headings. There is deliberately NO roadmap/overview document — the development journal
(`Logos/Журнал/`) is the overview.

All phase documents are **Russian** in headings and prose. Technical terms (LLM, MVP, API, VRAM, RAG,
GPU, OpenRouter, gRPC, etc.) keep their original form. No runnable code in any document — prose,
numbered flows, and pseudo-API shapes only.

Cross-reference sibling documents with Obsidian wiki-links: `[[Концепт]]`, `[[Архитектура]]`,
`[[Фаза-00-чат-в-вебе]]` — never relative markdown paths.

## File name

`$VAULT/Logos/Дизайн/Фазы/Фаза-NN-<краткое-русское-имя>.md`

- `NN` — two-digit zero-padded number. The MVP-zero is `Фаза-00`; later phases increment
  (`Фаза-01`, `Фаза-02`, …). Zero-padding keeps the folder chronologically sorted.
- `<краткое-русское-имя>` — a short Russian slug, hyphenated, e.g. `Фаза-00-чат-в-вебе.md`,
  `Фаза-01-история-диалогов.md`.

One phase = one file. Never put two phases in one document.

## Frontmatter (the searchable fields)

```yaml
---
tags:
  - logos
  - дизайн
  - фаза
фаза: <NN>
статус: <планируется | в работе | готово>
---
```

- **фаза** — the phase number (same `NN` as in the file name), so Dataview can sort phases.
- **статус** — lifecycle of the phase as a deliverable: `планируется` when first carved,
  `в работе` while it is being built, `готово` once the user has verified its done criteria. Start a
  freshly carved phase at `планируется`.

## Body template

```markdown
---
<frontmatter from above>
---

# Фаза NN — <имя>

[[Концепт]] · [[Архитектура]]

## Цель фазы (что щупаем)
<One paragraph: the finished, touchable slice this phase delivers, and why it is the right next step
on top of the previous phases. For Фаза 00, this is the MVP-zero — the smallest thing that genuinely
works end-to-end.>

## Что входит (функционал)
<Bulleted concrete capabilities included in this phase — named, not vague.>

## Что НЕ входит (границы)
<Bulleted: what is deliberately pushed to later phases, so this phase stays minimal. This boundary is
as important as the included scope.>

## Затрагиваемые части архитектуры
<Which parts/subsystems of [[Архитектура]] this phase exercises (and therefore must already exist or
be stubbed). Reference the relevant architecture sections.>

## Зависимости
<Which prior phases must be done first, wiki-linked — e.g. [[Фаза-00-чат-в-вебе]]. Фаза 00 has none:
write «нет — это стартовая фаза».>

## Критерии готовности (как протестировать)
<Concrete acceptance scenarios the user can run by hand to confirm the phase works end-to-end. Each
is a checkable step, e.g.:
1. Открываю веб-чат → вижу поле ввода.
2. Пишу сообщение, отправляю → получаю ответ модели.
3. ...>

## Риски и открытые вопросы
<Risks and unresolved questions specific to this phase. Anything needing a real architectural decision
is also surfaced to the user and folded into [[Архитектура]] → «Риски и открытые вопросы».>
```

## Writing rules

- **Tangible and testable.** Every phase must end in something the user can use and verify by hand. If
  a phase cannot be touched and tested on its own, it is too small or too internal — reshape it.
- **Minimal scope.** Each phase adds one tangible capability. Push everything else to later phases via
  «Что НЕ входит».
- **Russian content.** All text, headings, and field values are Russian. Technical terms keep their
  original form.
- **Never overwrite a different phase.** Each phase is its own file. Reshaping a phase updates ITS file.
- **Keep in sync.** A phase that needs something not in `Архитектура.md` triggers an immediate fix to
  the architecture (see the `logos-phases` skill, Step 5) — the documents must always agree.
- **No manual git.** `obsidian-git` auto-syncs the vault, so no `git commit` is needed for phase files.
