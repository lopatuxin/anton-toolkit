---
name: idea
description: >
  Capture and develop personal ideas as well-structured Obsidian notes. Each idea is its own
  note under Личная/Идеи, written as light documentation — not a verbatim transcript: reword and
  organize for clarity, but never change the essence or invent content the user did not say.
  Two flows, inferred from the command argument: create a NEW idea note, or REFINE/augment an
  existing one with more detail. Invoked explicitly via the /idea command only — no auto-trigger.
  For raw diary capture use `dnevnik`.
---

# Idea — capture and develop ideas in the Obsidian vault

The user dictates a raw idea; you turn it into a clean, well-organized idea document and save it
as its own note. Later the user comes back to **develop** that idea — adding detail, sharpening
it — and you integrate the new material into the same note while keeping it coherent.

Runs DIRECTLY in the conversation, single-shot. No agents.

This is NOT a verbatim transcript skill (that is `dnevnik`). Here you may rework the wording and
structure to read like documentation. The hard line: **rephrase and organize freely, but never
change the meaning of the idea and never add substance the user did not express.**

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

The ideas folder is `$VAULT/Личная/Идеи`.

## 1. First-run setup (idempotent — run these checks EVERY time)

Create only what is missing; never overwrite an existing file.

```bash
mkdir -p "$VAULT/Личная/Идеи"
```

Ensure the **folder note** `$VAULT/Личная/Идеи/Идеи.md` exists and is non-empty (this vault uses
the `folder-notes` plugin — opening the folder opens this note, so it serves as the idea index).
The vault has the **Dataview** plugin, so the index is an auto-updating query — you never maintain
it by hand. If the file is missing OR empty, create it with the Write tool with exactly this
content (the inner ` ```dataview ` block must be preserved verbatim):

````markdown
---
tags:
  - идеи
---

# 💡 Идеи

Личная копилка идей. Каждая идея — отдельная заметка, оформленная как короткая документация.
Идеи можно дорабатывать: вызвать `/idea` и дополнить существующую.

## Список

```dataview
TABLE WITHOUT ID file.link AS "Идея", status AS "Статус", updated AS "Обновлено"
FROM "Личная/Идеи"
WHERE file.name != this.file.name
SORT updated DESC
```
````

Leave an existing non-empty folder note untouched — the Dataview query keeps the index current
automatically, so there is nothing to update there per idea.

## 2. Get the dictation and decide the flow

The dictated text is whatever the user just said / passed as arguments. If there is no text,
ask in Russian: «Диктуй идею — запишу. Или скажи, какую идею доработать.» and wait. Do NOT
create an empty file.

List the existing ideas (everything in the folder except the folder note itself) so you can both
detect a refine request and avoid creating a near-duplicate:

```bash
ls -1 "$VAULT/Личная/Идеи"/*.md 2>/dev/null | grep -v '/Идеи\.md$' || echo "(no ideas yet)"
```

Choose the flow from the argument:

- **REFINE an existing idea** — the argument points at an idea already in the folder, e.g.
  «доработай идею про <X>», «дополни <X>», «к идее <X> добавь …», «по идее <X>: …». Match the
  named idea against the existing note titles (case-insensitive, fuzzy on the key words). → §4.
- **NEW idea** — the argument is a fresh idea with no reference to an existing note. → §3.
- **Ambiguous** — if the argument could be a new idea OR a development of an existing one (the
  topic clearly overlaps an existing note), ask ONCE in Russian, listing the candidate:
  «Это новая идея или дополнение к `<название>`?» and wait. Do NOT guess between new and refine —
  a wrong guess either fragments one idea into two notes or overwrites the wrong note.

If a refine request names an idea that does not exist, say so in Russian and offer to create it
as a new idea instead; do not silently create a mismatched note.

## 3. NEW idea flow

1. **Derive a title.** From the idea, craft a concise, descriptive Russian title (≈3–7 words)
   that captures what the idea IS — this becomes both the H1 and the file name. Sanitize the file
   name: no `\ / : * ? " < > |` characters; keep it readable (e.g. `Бот-напоминалка для задач.md`).
   If a note with that title already exists, you are probably in a refine situation — re-check §2.

2. **Format the idea as light documentation** per §5.

3. **Write the note** with the Write tool at `$VAULT/Личная/Идеи/<title>.md`:

   ```markdown
   ---
   created: <YYYY-MM-DD>
   updated: <YYYY-MM-DD>
   status: черновик
   tags:
     - идея
   ---

   # <Title>

   [[Идеи]]

   <formatted idea body — adaptive sections per §5>
   ```

4. Report (§6).

Compute the date with `date +%Y-%m-%d`.

## 4. REFINE / develop flow

1. **Read** the matched idea note in full.
2. **Integrate** the new dictation into the existing document. This is a MERGE, not an append of
   a raw blob: weave the new detail into the relevant section, add a new section if the new
   material opens a new dimension, and re-tighten the prose so the whole note still reads as one
   coherent document. Apply the formatting discipline in §5.
3. **Never drop prior substance.** You may reorganize and rephrase existing content, but every
   point already in the note must survive — unless the user explicitly retracts or replaces it.
4. **Update the frontmatter:** set `updated:` to today (`date +%Y-%m-%d`). If the idea was
   `status: черновик` and now has real substance, you MAY bump it to `status: в проработке`. Do
   not invent a status the user did not imply.
5. Report (§6).

## 5. Formatting discipline (used by §3 and §4)

Turn the raw dictation into clean, well-organized Obsidian Markdown that reads like short internal
documentation. Rules, in order of importance:

1. **Never change the essence.** The idea, its purpose, and every concrete decision stay exactly
   as the user meant them. Do NOT add features, motivations, conclusions, or "improvements" the
   user did not state. Do NOT moralize or evaluate the idea. Reworking is about *form*, not
   *content*.
2. **You MAY rework the form.** Unlike `dnevnik`, here you may rephrase clumsy dictation into
   clear sentences, reorder points into a logical flow, remove pure speech filler, and merge
   repetition. The goal is a crisp, readable document — not a transcript.
3. **Adaptive structure — headings only when earned.** A small idea stays a couple of clean
   sentences with NO headings. A richer idea gets `## ` sections drawn from what the content
   actually contains — common ones: `## Суть`, `## Проблема` / `## Зачем`, `## Как это работает`
   / `## Решение`, `## Детали`, `## Открытые вопросы`, `## Следующие шаги`. Use ONLY the sections
   the material supports; never emit an empty placeholder section.
4. **Open questions stay questions.** If the user voiced uncertainty ("не знаю, как лучше — X или
   Y"), record it faithfully under `## Открытые вопросы` — do NOT resolve it for them.
5. **Keep the language as dictated** (Russian). Do NOT translate.
6. **Light Obsidian linking.** You MAY wrap an obviously recurring vault entity (a named project
   or person) in `[[wikilinks]]` when it is clearly a vault entity. When in doubt, leave plain
   text. Never link common words.

Correct vs incorrect:
- Correct: dictation "ну короче бот который сам напоминает про задачи в телеге чтоб я не забывал"
  → `## Суть` + "Телеграм-бот, который сам напоминает о задачах, чтобы ничего не терялось."
  (cleaned wording, same meaning).
- Incorrect: adding "Можно ещё прикрутить ИИ-приоритизацию и монетизировать через подписку." —
  that is new substance the user never said. Never do this.

## 6. Confirm to the user (Russian)

Reply in one or two lines naming what changed, e.g.:
- New: «Записал идею: `Личная/Идеи/Бот-напоминалка для задач.md`.»
- Refine: «Дополнил идею `Личная/Идеи/Бот-напоминалка для задач.md` — добавил раздел «Детали», статус → в проработке.»

`obsidian-git` auto-syncs the vault, so no manual git commit is needed here.

## Critical rules

- **Command-only.** Runs only on the explicit `/idea` invocation — no auto-trigger on casual
  mentions of ideas.
- **One idea = one note**, named by its title and living in `Личная/Идеи`.
- **Rework form, never substance.** Rephrase and restructure freely; never change the meaning,
  never invent content the user did not express, never resolve their open questions for them.
- **Refine = merge, never lose.** Developing an idea integrates new detail and may reorganize, but
  every prior point survives unless the user retracts it. Never overwrite a note with only the new
  fragment.
- **New vs refine is decided, not guessed.** When ambiguous, ask once before writing.
- **Russian stays Russian** — all note content and chat replies are in Russian; never translate.
- **Index updates itself** — the folder note `Идеи.md` lists ideas via Dataview; do not edit it
  per idea. A new note appears automatically as long as it lives in `Личная/Идеи` and carries the
  `updated:` and `status:` frontmatter fields.
- **Single-shot, no agents** — format and write directly in the conversation.
