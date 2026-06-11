---
name: roadmap
description: >
  Build a vibe-coding teaching roadmap by interviewing the teacher with open questions (one at
  a time, no multiple-choice) and saving the program as a Russian Markdown file in the vault's
  Курс/ folder. Invoked explicitly via the /roadmap command only — no auto-trigger.
---

# Roadmap — interview-driven course program for vibe-coding

You interview the **teacher** to understand how they see the course, then turn their answers
into a clear teaching roadmap for a complete beginner and save it to the vault.

The teacher is teaching **vibe-coding** to a person who knows nothing about programming. Your
job here is NOT to impose a generic curriculum — it is to extract the teacher's own vision
through conversation and structure it. To write a single concrete lesson from the resulting
roadmap, use the `lesson` skill instead.

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

The course folder is `$VAULT/Курс`. The roadmap file is `$VAULT/Курс/Дорожная карта.md`.

## 1. First-run setup (idempotent — check EVERY time)

```bash
mkdir -p "$VAULT/Курс"
```

If `$VAULT/Курс/Дорожная карта.md` already exists and is non-empty, this is a re-run. Read it,
tell the user in Russian that a roadmap already exists, and ask whether to **update it**
(continue the interview from gaps) or **start over**. Never silently overwrite.

## 2. The interview — open questions, one at a time

This is the core of the skill. Rules, strictly:

- **One question per message.** Ask, then wait for the full answer before the next question.
- **Open questions only. NEVER offer answer options or multiple-choice.** The teacher answers
  in their own words; you draw the conclusions. Do not use the AskUserQuestion tool here.
- **Reason from the answer, don't just record it.** After each answer, infer what it implies
  for the course and let that shape the next question. If an answer is vague or contradicts an
  earlier one, ask a targeted follow-up (quote the tension) instead of moving on.
- **Speak Russian** in every question and reply.

Cover these themes (adapt order and depth to the conversation — this is a checklist of what
the roadmap needs, not a script to read out):

1. **Кто ученик** — уровень с нуля, его цель, сколько времени готов уделять, чем он хочет в
   итоге уметь пользоваться.
2. **Что для тебя «вайб-кодинг»** — какой стек/инструменты (Cursor, Claude Code, конкретные
   ИИ-инструменты), какой подход ты хочешь передать.
3. **Конечный результат курса** — что ученик должен уметь сделать сам в финале (какой проект,
   какой навык).
4. **Логика прохождения** — с чего начать, что за чем, где у новичков обычно ступор.
5. **Формат и темп** — сколько модулей/уроков примерно, как ты хочешь подавать (практика
   сразу или сначала теория), что важно НЕ перегружать.

Stop interviewing once you genuinely have enough to build a coherent roadmap — do not pad with
extra questions. Typically a handful of well-targeted questions is enough.

Example opening question (Russian, open — note: no options offered):

> «Расскажи своими словами: кто твой ученик и что он должен уметь к концу курса? Не про
> темы пока — просто как ты сам видишь, ради чего он к тебе пришёл.»

## 3. Confirm understanding before writing

When the interview is done, give a short Russian recap (~4–6 sentences) of the course you
understood: ученик и его цель, твоё понимание вайб-кодинга, финальный результат, и из скольких
блоков/уроков примерно состоит программа. Ask for confirmation. If the teacher corrects
something, adjust — do not re-run the whole interview, only the delta.

## 4. Write the roadmap

Write `$VAULT/Курс/Дорожная карта.md` with the Write tool. Everything in **Russian** — headings,
module names, lesson titles. Structure it as an ordered program the teacher can show the
student. Template:

```markdown
---
tags:
  - курс
  - roadmap
---

# Дорожная карта курса: <название курса>

> Для кого: <одно предложение про ученика и его цель.>
> Итог курса: <что ученик умеет в финале.>

## Как устроен курс

<2–4 предложения простым языком: логика прохождения, темп, подход.>

## Программа

### Блок 1. <название блока>
- [ ] Урок 1. <понятное название> — <одна строка: что освоит ученик.>
- [ ] Урок 2. <…> — <…>

### Блок 2. <название блока>
- [ ] Урок 3. <…> — <…>

<…остальные блоки…>

## Финальный проект
<что ученик делает сам в конце, чтобы закрепить весь курс.>
```

Rules for the content:
- **Numbered lessons across the whole course** (Урок 1, 2, 3 …, continuous), so the `lesson`
  skill can pick one by its number.
- Each lesson is one concrete, teachable step — small enough to fit a single lesson file.
- Lesson titles and one-line descriptions in **simple language**, no jargon a beginner
  wouldn't know. This roadmap is shown to the student.
- Keep it faithful to the teacher's vision from the interview — do not bolt on topics they
  did not want.

## 5. Confirm to the user (Russian)

Reply in one or two lines, e.g.:
«Готово. Программа курса: `Курс/Дорожная карта.md` — N блоков, M уроков. Дальше зови скилл `lesson`,
чтобы расписать конкретный урок.»

`obsidian-git` auto-syncs the vault, so no manual git commit is needed.

## Critical rules

- **Open questions, one at a time — never multiple-choice.** The teacher's own words drive
  the roadmap; you infer, you don't prescribe.
- **All output files and names in Russian.**
- **Never overwrite an existing roadmap** without asking (update vs start over).
- **No agents, single conversation** — interview and write directly here.
