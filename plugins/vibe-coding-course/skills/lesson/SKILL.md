---
name: lesson
description: >
  Write ONE concrete vibe-coding lesson from the course roadmap, in simple beginner-friendly
  Russian, guided by the teacher's own input for that lesson, and save it as a separate file in
  the vault's Курс/ folder. Invoked explicitly via the /lesson command only — no auto-trigger.
---

# Lesson — write one beginner-friendly lesson from the roadmap

You take a single lesson from the course roadmap and write it out as a finished lesson for a
person who knows **nothing** about programming. You always do **one lesson at a time** — the
teacher needs to review and edit each one before moving on. The course program itself is built
by the `roadmap` skill.

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

The course folder is `$VAULT/Курс`. The roadmap is `$VAULT/Курс/Roadmap.md`.

## 1. Read the roadmap

Read `$VAULT/Курс/Roadmap.md`. If it does not exist or is empty, tell the user in Russian:
«Сначала нужна программа курса — запусти скилл `roadmap`.» — then stop.

## 2. Pick the lesson

Figure out which lesson the teacher wants:
- If they named a lesson number or title in the command — use it.
- If not — look at which lessons in the roadmap are already done (a finished lesson file
  exists in `Курс/`, or the checkbox is ticked) and suggest the next unwritten lesson, then
  ask in Russian to confirm. Example: «Следующий нерасписанный — Урок 3 «<название>». Его берём?»

Never guess silently — confirm which lesson before writing.

## 3. Ask the teacher for their input on this lesson

The lesson is written **on the teacher's terms**, not as a mechanical expansion of the roadmap
line. Before writing, ask in Russian for their input — open, no options:

> «По уроку «<название>» — расскажи своими словами: на чём сделать акцент, какой пример или
> аналогию взять, что объяснить особенно просто, чего избегать? Если ничего особого — скажи
> «на твоё усмотрение», и я распишу по программе.»

Wait for the answer. If the teacher says «на твоё усмотрение» (or similar), proceed from the
roadmap alone. Otherwise let their input drive the emphasis, examples, and depth.

## 4. Write the lesson

Write the lesson as a new file in `$VAULT/Курс/`. File name in **Russian**, prefixed with the
zero-padded lesson number so files sort in order, e.g. `Урок 03 — Первый проект в Cursor.md`.
If a file for this lesson already exists, tell the user and ask whether to overwrite — never
silently replace a lesson the teacher may have already edited.

Everything in **Russian, simple language for a complete beginner**. Template:

```markdown
---
tags:
  - курс
  - урок
урок: <номер>
---

# Урок <N>. <название>

> Что ты умеешь после этого урока: <1–2 предложения, простым языком.>

## Зачем это нужно
<Мотивация на бытовом языке — почему этот шаг важен. Без жаргона.>

## Разбираемся по шагам
<Объяснение темы маленькими шагами. Каждый новый термин — сразу простыми словами
или через аналогию. Короткие абзацы. Если есть команды/код — давай их целиком и объясняй,
что каждая строка делает.>

## Сделай сам
<Практическое задание: что ученик должен повторить руками прямо сейчас, по шагам.>

## Если что-то пошло не так
<2–4 типичные ошибки новичка на этом шаге и как их исправить.>

## Коротко
<Резюме урока в 2–3 пунктах — что запомнить.>
```

Writing rules (this is the core of the skill):
- **Assume zero prior knowledge.** Never use a term without explaining it in plain words the
  first time. No unexplained jargon, no «как всем известно».
- **Short sentences, short paragraphs, concrete examples.** Prefer everyday analogies.
- **One lesson only.** Do not write ahead into other lessons even if asked — explain that each
  lesson is written and reviewed one at a time.
- **Honor the teacher's input** from step 3 — their emphasis and examples take priority over the
  roadmap's one-liner.
- **Stay faithful** — don't invent tools or steps the course doesn't use.

## 5. Confirm to the user (Russian)

Reply in one or two lines, e.g.:
«Готов Урок 3: `Курс/Урок 03 — Первый проект в Cursor.md`. Глянь и поправь — потом зови меня
снова для следующего урока.»

`obsidian-git` auto-syncs the vault, so no manual git commit is needed.

## Critical rules

- **One lesson per run** — so the teacher can review and edit before the next.
- **Beginner-first language** — every term explained, no assumed knowledge.
- **Ask the teacher's input first** — the lesson reflects how they want it taught.
- **All output files and names in Russian.**
- **Never overwrite an existing lesson** without asking.
- **No agents, single conversation** — ask and write directly here.
