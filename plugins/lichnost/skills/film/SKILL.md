---
name: film
description: >
  Personal film curator living in the Obsidian vault. Maintains three notes — a taste profile
  (the user's "viewing personality"), a watched-films log with detailed reviews, and a short
  curated recommendation shortlist (≤10 films, each with a one-line "what it is / why it fits"
  blurb). Invoked explicitly via the /film command only — no auto-trigger. Three flows, inferred
  from the command argument: recommend what to watch next, log a freshly watched film with a
  detailed review, or (on first run) migrate the legacy `films.md` note into the structured vault
  folder. For diary capture use `dnevnik`.
---

# Film — personal film curator for the Obsidian vault

A standing, evolving film system for one user. It keeps a **taste profile** (their "viewing
personality"), a **watched log** with reviews, and a **short recommendation shortlist** — and it
gets smarter every time the user logs a film, because each review feeds the taste profile, which
in turn drives the next recommendations.

Runs DIRECTLY in the conversation, single-shot. No agents.

## The three notes (this is the whole data model)

All live under `<vault>/Личная/Фильмы/`:

| Note | Role |
|------|------|
| `Вкус.md` | Taste profile — likes, dislikes, patterns. The source of truth recommendations read. |
| `Просмотрено.md` | Watched log — detailed reviews going forward, plus the imported rating backlog. |
| `Рекомендации.md` | Curated shortlist, **≤10 films**, each with a short clear description. |

A folder note `Фильмы.md` is a simple hub linking the three (the vault uses the `folder-notes`
plugin, so opening the folder opens this note).

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

Paths used by this skill:
- Film folder: `$VAULT/Личная/Фильмы`
- Notes: `Вкус.md`, `Просмотрено.md`, `Рекомендации.md`, folder note `Фильмы.md`
- Legacy source note (read once, on first run): `$VAULT/films.md`

## 1. Idempotent setup (run these checks EVERY time)

Create only what is missing; never overwrite an existing non-empty file.

```bash
mkdir -p "$VAULT/Личная/Фильмы"
```

Ensure the **folder note** `$VAULT/Личная/Фильмы/Фильмы.md` exists and is non-empty. If it is
missing OR empty, create it with the Write tool with exactly this content:

```markdown
---
tags:
  - фильмы
---

# 🎬 Фильмы

Личная киносистема. Три заметки:

- [[Вкус]] — профиль вкуса: что люблю, что нет, закономерности.
- [[Просмотрено]] — что посмотрел, с обзорами.
- [[Рекомендации]] — короткий список того, что стоит глянуть (не больше 10).

Управляется командой `/film`.
```

Leave an existing non-empty folder note untouched.

## 2. Decide: first run (bootstrap) or normal run

Check whether all three data notes exist and are non-empty (`Вкус.md`, `Просмотрено.md`,
`Рекомендации.md`):

```bash
F="$VAULT/Личная/Фильмы"
for n in Вкус Просмотрено Рекомендации; do
  if [ -s "$F/$n.md" ]; then echo "$n: ok"; else echo "$n: MISSING"; fi
done
```

- If any of the three is missing or empty → **FIRST RUN** → go to §3 (bootstrap), then stop
  after reporting (unless the command argument carries an explicit intent — then continue to §4).
- Otherwise → **NORMAL RUN** → go to §4.

## 3. First run — migrate `films.md` into the structured folder

Goal: take the user's existing free-form `films.md` and rework it into the three clean notes.
This is a one-time transformation; be faithful to the data, do not invent ratings or films.

1. **Read** `$VAULT/films.md`. If it does NOT exist, do not block: create the three notes from
   the empty templates below (taste = placeholder, watched = empty, recommendations = empty),
   tell the user in Russian that there was nothing to import and to dictate their taste / paste a
   list, then stop.

2. **Build `Вкус.md`** — the taste profile / "viewing personality". Synthesize, don't just copy:
   start from any explicit likes/dislikes in `films.md`, then enrich with **patterns inferred
   from the watched ratings** (recurring directors, actors, franchises, tones the user rates high
   🔥/❤️ versus low 😐/👎). Structure it as:

   ```markdown
   ---
   tags:
     - фильмы
     - вкус
   ---

   # 🎯 Профиль вкуса

   [[Фильмы]]

   ## Люблю
   <bullet list: genres, styles, directors, actors, tones — concrete>

   ## Не люблю
   <bullet list: concrete dislikes>

   ## Закономерности
   <a few sharp observations the raw lists don't state outright, e.g. "герой-одиночка с
   харизмой заходит почти всегда", "чистая комедия — да, но тупой юмор внутри экшна — нет",
   "старое кино почти всегда мимо">
   ```

3. **Build `Просмотрено.md`** — the watched log. The migrated backlog goes into an import table
   (compact: title + verdict, exactly as it was). Detailed reviews accumulate above it going
   forward. Use this layout:

   ```markdown
   ---
   tags:
     - фильмы
     - просмотрено
   ---

   # 👁️ Просмотрено

   [[Фильмы]]

   ## Обзоры
   _Подробные обзоры новых просмотров — самые свежие сверху. Добавляются командой `/film`._

   ## Оценки (импорт)
   <the full watched table migrated verbatim from films.md: | Фильм | Оценка |>
   ```

4. **Build `Рекомендации.md`** — curate the legacy recommendations down to a tight shortlist per
   §7. **≤10 films**, each with a short clear description, and **never a film already in the
   watched table**. Use the layout in §7.

5. **Do NOT delete `films.md`.** Leave it in place. In the confirmation, tell the user it has been
   migrated and they may delete it themselves now that the data lives in `Личная/Фильмы/`.

Then report (§8). On a pure first run with no other intent in the argument, stop here.

## 4. Normal run — pick the flow from the command argument

Read the command argument and choose:

- **LOG a watched film** — the argument names a film together with an opinion/review
  (e.g. «посмотрел Переводчик — огонь, Стэйтем как в Гневе человеческом», «досмотрел Silo,
  затянуто», «<название> — <мнение>»). → §6.
- **RECOMMEND** — the argument is empty, or asks for something to watch
  (e.g. «что посмотреть», «посоветуй», «подбери военное», «что-то типа Джона Уика»). → §5.
- **Ambiguous** — if you cannot tell, ask once in Russian: «Что сделать — порекомендовать фильм
  или записать просмотренный?» and wait. Do NOT guess between the two.

## 5. Recommend flow

1. Read `Вкус.md`, the watched titles from `Просмотрено.md` (both the `## Обзоры` headings and
   the import table — these are the exclusion set), and the current `Рекомендации.md`.
2. If the argument narrows the request (a lane like «военное», «комедию», «sci-fi», or «типа X»),
   bias the selection to that lane while still honoring the taste profile.
3. Refresh the shortlist per §7: drop anything now watched, top up toward ≤10, keep variety.
   Write the refreshed `Рекомендации.md`.
4. Present the shortlist to the user in chat (Russian) — the titles with their one-line blurbs —
   so they can pick without opening the file.

## 6. Log-watched flow

1. **Parse** the title (and year if given) and the user's opinion/review from the argument.
2. **Detail.** The user wants richer reviews than the old one-emoji ratings. If the argument is
   only a bare verdict with no substance (e.g. just «огонь» / «фигня» with nothing else), ask ONE
   short Russian follow-up to get a couple of sentences: «Пару слов почему — что зашло или нет?»
   If the user gives nothing more, store what there is. Do not interrogate beyond one question.
3. **Format the review** faithfully (same discipline as `dnevnik`: fix mechanics, keep the user's
   voice and meaning, do not embellish or invent). Pick a verdict emoji consistent with the
   existing scale (🔥 огонь · ❤️ понравился · 😐 нормально · 👎 не зашёл).
4. **Prepend** a review entry at the TOP of the `## Обзоры` section in `Просмотрено.md` (newest
   first). Do NOT touch the import table. Entry shape:

   ```markdown
   ### <emoji> <Название> (<Год>) — <короткий вердикт>
   <formatted review prose>
   ```

5. **Remove from recommendations.** If the film is in `Рекомендации.md`, delete that entry.
6. **Feed the taste profile.** If the review reveals a new like, dislike, or pattern, append a
   concise line to the matching section of `Вкус.md`. Merge, do NOT rewrite the whole profile.
   Skip if the review adds nothing new.
7. **Top up** `Рекомендации.md` toward ≤10 per §7 (the freed slot + the sharpened taste may
   surface a better fit).
8. Report (§8).

## 7. Recommendation curation rules (used by §3 and §5)

The recommendation note is deliberately SHORT — a wall of films is useless to the user.

- **Hard cap: 10 films. Never more.** If a top-up would exceed 10, drop the weakest fit.
- **Never recommend a watched film.** Cross-check every candidate against `Просмотрено.md`
  (the import table AND the `## Обзоры` headings).
- **Every entry has a short, concrete description** — one or two sentences: what the film is
  (director/actor/hook) AND why it fits this user's taste, specific enough to recognize at a
  glance. No bare titles.
- **Spread across the user's liked lanes** (do not stack 10 of one kind). Pull from the lanes the
  taste profile marks as liked.
- **Prefer modern over old** — this user dislikes old films.
- File layout:

  ```markdown
  ---
  tags:
    - фильмы
    - рекомендации
  ---

  # 🍿 Рекомендации

  [[Фильмы]]

  > Не больше 10 фильмов. Каждый — с коротким описанием: что это и почему зайдёт.
  > Посмотренное убирается отсюда автоматически.

  ### <Название> (<Год>) — <режиссёр / актёр / жанр-якорь>
  <one–two sentence description: what it is + why it fits>

  ### ...
  ```

## 8. Confirm to the user (Russian)

Reply in one or two lines naming what changed, e.g.:
- First run: «Перенёс `films.md` в `Личная/Фильмы/`: профиль вкуса, просмотренное и 10 рекомендаций. Старый `films.md` можешь удалить.»
- Recommend: «Обновил рекомендации (`Личная/Фильмы/Рекомендации.md`) — сейчас 9 фильмов.»
- Log: «Записал обзор: `Никто 2` (❤️) в `Личная/Фильмы/Просмотрено.md`; убрал из рекомендаций, добавил 1 новый.»

`obsidian-git` auto-syncs the vault, so no manual git commit is needed here.

## Critical rules

- **Command-only.** This skill runs only on the explicit `/film` invocation — no auto-trigger on
  casual mentions of movies.
- **The recommendation file never exceeds 10 films**, and each film always carries a short
  description. A long, undescribed list is a failure of this skill.
- **Never recommend a film that is already in `Просмотрено.md`.**
- **Reviews feed the taste profile** — the learning loop. A logged film with new signal updates
  `Вкус.md`; without it, leave the profile alone.
- **Faithful capture** — format and keep the user's words and verdict; never invent films,
  ratings, or opinions they did not give.
- **Russian stays Russian** — all note content and chat replies are in Russian; never translate.
- **Merge, don't clobber** — append reviews and taste lines; never overwrite the watched log or
  the taste profile wholesale.
- **Do not delete `films.md`** — migration leaves it on disk for the user to remove.
- **Single-shot, no agents** — read and write directly in the conversation.
