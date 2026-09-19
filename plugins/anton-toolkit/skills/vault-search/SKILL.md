---
name: vault-search
description: >
  Finds what is written in the owner's Obsidian vault (C:\projects\obsidian, ~1250 Russian notes):
  where a project stands and what is next, a past decision and its reason, a plan, a note on a
  topic. Use from any project whenever the answer depends on something recorded there. How a system
  behaves right now is answered from its code repository, not from the vault.
when_to_use: >
  "найди в хранилище", "что у меня по Кузне", "мы это уже решали", "где заметка про"
---

# Vault search

The vault is `C:\projects\obsidian` on both of the owner's machines. It is plain markdown, so the Grep, Glob and Read tools are the whole search engine: no index, no embeddings. Obsidian resolves links by note name, and note names are unique across the vault.

## 1. Start from the map

Most questions are answered before any full-text search:

- **Project state** — every project has a card: the hub note of its folder with `kind: project` in the frontmatter, under `Проекты/` or `Работа/`. Its `status`, `next` and `updated` say where the project stands and what comes next. `Главная.md` shows all cards plus the current work cycle.
- **A folder's content** — every folder has a hub note named exactly like the folder (`Знания/Собес/Собес.md`); it describes the folder or lists it.
- **Layout** — list the top level and the folder you need with Glob instead of assuming it: folders get renamed and moved.

Inside a project folder the sections carry the project name: `Концепт <Имя>`, `Архитектура <Имя>/`, `Фазы <Имя>/` (plans, one note per feature with `статус`), `Журнал <Имя>/` (one note per decision or dead end, `тип: решение | тупик`, why one option won).

## 2. Search by word stem

Plain text search does not know Russian word forms: `память` misses `памяти`, `памятью`. Search the stem — cut the ending, keep four or more letters: `памят`, `эмбеддинг`. The letter ё is written both ways — `разв[её]рт`. Put synonyms and the English term into one case-insensitive regex: `памят|memory|запомина`. Very short stems (`реш`, `код`) match everything — lengthen them or narrow the folder instead.

## 3. Narrow by place and metadata

- A decision and its reason → `Журнал*/` of the project. A plan → `Фазы*/`. Dated notes are named `ГГГГ-ММ-ДД-….md` or `ГГГГ-ММ-ДД.md`, so a period is a Glob on the file name.
- Frontmatter fields: `tags:` (a YAML list, one `  - тег` per line), journal entries `дата`, `тип`, `статус`; the diary `Личная/Дневник/` uses `date`.
- Links: the note `[[Имя]]` is `**/Имя.md`; the notes that link to it match `\[\[Имя(\||#|\]\])`.
- `Работа/<project>/Требования <project>/` are verbatim copies of the employer's analysts' wiki — the requirements, not the owner's notes.
- Skip `.obsidian/` (app state), `.smart-env/` (embeddings cache) and `.trash/`. Search `Архив/` only when asked about old material or when nothing turned up elsewhere. `.claude-sync/memory/` is Claude's memory, not notes — search it only for Claude's own past records.

## 4. Read little

First find which files match (`files_with_matches`, or `count`), then read only the matching part with context lines or an offset — journals and research notes run to thousands of lines. Many old notes have CRLF line endings: anchor a line end as `\r?$`.

## 5. Answer

Name the note the answer came from, by note name. When nothing was found, say so plainly and list the stems and folders that were searched, so the owner can point elsewhere. The vault is documentation and plans: for how a system behaves now, read its repository (the card's `repo:` field names it) and call out any mismatch with the notes.
