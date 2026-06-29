# Logos decision journal — storage format

This reference defines the on-disk format of the Logos decision journal. Both the
`logos-log` skill (manual record / review / search) and the `logos-design` skill
(automatic recording after a design decision) read this file and follow it verbatim,
so that every entry is uniform and searchable.

The journal is the project's long-term memory: every decision taken, every experiment
run, every dead end hit. It is deliberately the same idea as Logos's own "evolving
memory with importance weights" — so it doubles as a working prototype of that mechanism,
tried out on the project itself before it is built into the system.

The journal is written BY the assistant FOR the assistant — it is the model's own working
memory of what was decided and why, so a later session can pick the context back up. Entries
are recorded as the work happens; they do NOT require the user's review or sign-off. There is
NO review gate: never ask the user to "review", "accept/reject", or weigh journal entries, and
never leave entries waiting on the user. The assistant sets the fields (including `вес`) itself
from what it knows. The user may, of course, ask to search or change an entry — but nothing in
the journal is ever blocked on the user looking at it.

## 1. Locate the vault and the Logos folder

Find the Obsidian vault root (the directory that contains `.obsidian/`). Walk up from the
current directory, with a fallback to the known path:

```bash
VAULT=""
DIR="$(pwd)"
while [ "$DIR" != "/" ] && [ -n "$DIR" ]; do
  if [ -d "$DIR/.obsidian" ]; then VAULT="$DIR"; break; fi
  DIR="$(dirname "$DIR")"
done
[ -z "$VAULT" ] && [ -d "/c/projects/Claude/.obsidian" ] && VAULT="/c/projects/Claude"
echo "VAULT=$VAULT"
```

If `$VAULT` is empty, tell the user in Russian: «Не нашёл хранилище Obsidian (папку `.obsidian`). Запусти скилл из папки хранилища.» — then stop.

The Logos root is `$VAULT/Logos`. The journal lives in `$VAULT/Logos/Журнал`.

## 2. First-run setup (idempotent — run these checks EVERY time)

Create only what is missing; never overwrite an existing file.

```bash
mkdir -p "$VAULT/Logos/Журнал"
```

Ensure the **folder note** `$VAULT/Logos/Журнал/Журнал.md` exists and is non-empty. This
vault uses the `folder-notes` plugin (opening the folder opens this note) and the
`Dataview` plugin (live queries), so the folder note IS the searchable index — it is never
maintained by hand. If the file is missing OR empty, create it with the Write tool with
exactly this content (the ` ```dataview ` blocks must be preserved verbatim):

````markdown
---
tags:
  - logos
  - журнал
---

# 🧠 Журнал решений Logos

Долговременная память проекта. Каждое решение, эксперимент и тупик — отдельная заметка.
Не листай вручную — фильтруй запросами ниже.

## По важности (вес ≥ 7)

```dataview
TABLE WITHOUT ID file.link AS "Запись", область AS "Область", вес AS "Вес", статус AS "Статус"
FROM "Logos/Журнал"
WHERE вес >= 7 AND file.name != this.file.name
SORT вес DESC
```

## Тупики и провалы (чтобы не повторять)

```dataview
TABLE WITHOUT ID file.link AS "Запись", область AS "Область", дата AS "Дата"
FROM "Logos/Журнал"
WHERE (тип = "тупик" OR статус = "провал") AND file.name != this.file.name
SORT дата DESC
```

## Все записи

```dataview
TABLE WITHOUT ID file.link AS "Запись", область AS "Область", тип AS "Тип", вес AS "Вес", статус AS "Статус", дата AS "Дата"
FROM "Logos/Журнал"
WHERE file.name != this.file.name
SORT дата DESC
```
````

Leave an existing non-empty folder note untouched — the Dataview queries keep the index
current automatically, so there is nothing to update per entry.

## 3. One entry = one note

Every decision / experiment / dead end is its OWN note. Never append several decisions to
one file — separate notes are what make Dataview filtering precise.

File name: `<YYYY-MM-DD>-<краткое-русское-имя>.md` (Russian slug, spaces allowed but prefer
hyphens), e.g. `2026-06-07-выбор-центрального-оркестратора.md`. The date prefix keeps the
folder chronologically sorted; the slug makes the file findable by name.

## 4. Entry frontmatter (the searchable fields)

These YAML fields are what Dataview queries against — fill them on EVERY entry. Field names
and values are Russian on purpose (they are vault content the user reads and queries):

```yaml
---
дата: <YYYY-MM-DD>
тип: <решение | эксперимент | тупик | откат | наблюдение>
область: <оркестрация | память | модели | автономность | ресурсы | общее>
вес: <1–10>
статус: <принято | отвергнуто | проверяется | сработало | провал>
теги:
  - logos
  - журнал
---
```

Field semantics:
- **тип** — the kind of record. `решение` (a design decision), `эксперимент` (something tried), `тупик` (a dead end — keep these, they prevent repeating mistakes), `откат` (a previous decision reversed), `наблюдение` (a noted fact without a decision).
- **область** — which part of Logos this touches. Use the agent/council role taxonomy: `оркестрация`, `память`, `модели`, `автономность`, `ресурсы`, or `общее` for cross-cutting.
- **вес** — importance / strength, 1–10. This is the journal's analogue of Logos's "сила информации". The assistant sets it itself (there is no user review): start a fresh decision around 5, raise it when the decision proves itself, lower it when it fails.
- **статус** — lifecycle, set by the assistant from what actually happened (no user sign-off). A decision is recorded straight as `принято` (it was decided in the work). An experiment moves `проверяется` → `сработало` / `провал`. An `откат` entry reverses an earlier decision and is itself recorded `принято`; the entry it reverses is set to `статус: отвергнуто` and the two are linked with a wiki-link. `отвергнуто` means "superseded by a later decision", NOT "the user rejected it".

## 5. Entry body template

```markdown
---
<frontmatter from section 4>
---

# <Заголовок решения одной строкой>

[[Журнал]]

## Контекст
<Why this came up — 1–3 sentences. What problem or fork prompted it.>

## Решение / что сделано
<The decision itself, or what was tried. Concrete and specific.>

## Обоснование
<Why this option over the alternatives. Reference rejected options briefly.>

## Результат
<For experiments: what happened — worked / failed and why. For fresh decisions
awaiting outcome, write «пока не проверено».>
```

Cross-reference related entries and design documents with Obsidian wiki-links —
`[[2026-06-07-выбор-центрального-оркестратора]]`, `[[Архитектура]]`, `[[Модули/Память]]` —
never relative markdown paths.

## 6. Writing rules

- **Capture faithfully.** When recording the user's own thoughts, do not invent, embellish, or moralize — clean up mechanics only, like a diary. When recording a design decision the council made, summarize it accurately without adding new claims.
- **Russian content.** All entry text, headings, and field values are Russian. Technical terms (LLM, VRAM, RAG, OpenRouter, GPU, etc.) keep their original form.
- **Never overwrite a different entry.** Each decision is a new file. Re-recording the same decision updates its existing file (e.g. to flip `статус` or fill `Результат`).
- **The index updates itself.** Never hand-edit `Журнал.md` per entry — the Dataview queries pick up new notes automatically as long as the frontmatter fields above are set.
- **No manual git.** `obsidian-git` auto-syncs the vault, so no `git commit` is needed for journal entries.
