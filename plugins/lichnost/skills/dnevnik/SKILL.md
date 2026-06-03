---
name: dnevnik
description: >
  Record a personal diary / journal entry by dictation into the Obsidian vault, formatting
  raw thoughts into a clean Markdown note named by today's date. Invoked explicitly via the
  /dnevnik command only — no auto-trigger. Capture and format only.
---

# Dnevnik — diary capture for Obsidian

The user dictates raw thoughts; you clean them into a readable Obsidian note and save
it under today's date. Faithful, well-formatted capture only — no analysis, no advice.

## 0. Locate the Obsidian vault

Find the vault root (the directory that contains `.obsidian/`). Walk up from the current
directory, with a fallback to the known path:

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

The diary folder is `$VAULT/Личная/Дневник`.

## 1. First-run setup (idempotent — run these checks EVERY time)

Create only what is missing; never overwrite an existing file.

```bash
mkdir -p "$VAULT/Личная/Дневник"
```

Ensure the **folder note** `$VAULT/Личная/Дневник/Дневник.md` exists and is non-empty
(this vault uses the `folder-notes` plugin — opening the folder opens this note, so it
serves as the diary index). The vault has the **Dataview** plugin, so the index is an
auto-updating query — you never maintain it by hand. If the file is missing OR empty,
create it with the Write tool with exactly this content (note the inner ` ```dataview `
block must be preserved verbatim):

````markdown
---
tags:
  - дневник
---

# 📔 Дневник

Личный дневник. Каждая запись — отдельная заметка с именем по дате (`ГГГГ-ММ-ДД`).

## Записи

```dataview
TABLE WITHOUT ID file.link AS "Запись", date AS "Дата"
FROM "Личная/Дневник"
WHERE file.name != this.file.name
SORT date DESC
```
````

Leave an existing non-empty folder note untouched — the Dataview query keeps the index
current automatically, so there is nothing to update there per entry.

## 2. Get the dictated text and the date

The dictated text is whatever the user just said / passed as arguments. If there is no
text to record, ask in Russian: «Диктуй — записываю в дневник.» and wait. Do NOT create
an empty file.

Compute today's date and the current time:

```bash
date +%Y-%m-%d   # file name, e.g. 2026-05-31
date +%H:%M      # section time, e.g. 20:55
```

## 3. Format the dictation

Turn the raw dictation into clean, readable Obsidian Markdown. This is the core of the
skill — follow these rules strictly:

1. **Preserve meaning and voice.** It is the user's diary. Do NOT add, invent, embellish,
   moralize, summarize, or shorten. Formatting is not editing-down — keep everything said.
2. **Fix mechanics only:** punctuation, capitalization, sentence and paragraph breaks, and
   obvious speech-to-text misrecognitions only when the intended word is unambiguous. When
   unsure about a word, keep the original.
3. **Break the wall of text into paragraphs** at topic shifts so it reads cleanly.
4. **Light structure, only when earned.** If the entry clearly spans several distinct
   topics, add `### ` subheadings (e.g. `### Работа`, `### Сон`, `### Мысли`). For a short,
   single-topic entry, keep flowing prose with NO subheadings — do not over-structure.
5. **Keep the language as dictated** (Russian). Do NOT translate.
6. **Light Obsidian linking.** You MAY wrap an obviously recurring named entity (a person or
   a project the user names) in `[[wikilinks]]` only when it is clearly a vault entity. When
   in doubt, leave it as plain text. Never link common words — avoid link spam.

Correct vs incorrect:
- Correct: dictation "сегодня допилил бота вроде норм осталось чуть чуть" →
  "Сегодня допилил бота. Вроде норм — осталось чуть-чуть."
- Incorrect: adding "Это хороший прогресс, продолжай в том же духе!" — that is advice/
  embellishment the user did not say. Never do this.

## 4. Write the entry

File path: `$VAULT/Личная/Дневник/<date>.md`.

**If the file does NOT exist** — create it with the Write tool. Template (replace the
human-readable heading with the real weekday + date, e.g. `# Суббота, 31 мая 2026`):

```markdown
---
date: <YYYY-MM-DD>
tags:
  - дневник
---

# <Weekday, D month YYYY in Russian>

[[Дневник]]

## <HH:MM>

<formatted prose>
```

**If the file ALREADY exists** (the user dictates again the same day) — append a new
`## <HH:MM>` section with the new formatted prose. Do NOT touch existing content, do NOT
duplicate the frontmatter or the H1 heading.

**Index updates itself.** The folder note `Дневник.md` lists entries via a Dataview query,
so do NOT edit it per entry. The new note appears in the index automatically as long as it
lives in `Личная/Дневник` and carries the `date:` frontmatter field set above.

## 5. Confirm to the user (Russian)

Reply in one or two lines, e.g.:
«Записал в дневник: `Личная/Дневник/2026-05-31.md` (запись в 20:55).»

`obsidian-git` auto-syncs the vault, so no manual git commit is needed here.

## Critical rules

- **Capture only — never analyse or advise.** No interpretation, no recommendations.
- **Never overwrite an existing entry** — append a new timestamped section instead.
- **Never invent content** the user did not say.
- **Russian stays Russian** — never translate the diary text.
- **No agents, single-shot** — format and write directly in the conversation.
