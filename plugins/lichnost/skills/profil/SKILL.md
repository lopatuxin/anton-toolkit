---
name: profil
description: >
  Build and evolve a deep psychological self-profile of the user from their personal data in the
  Obsidian vault (diary, итоги, ideas) plus adaptive interviews the skill conducts. One skill, two
  modes inferred from the command argument: ИНТЕРВЬЮ (a live, one-theme-at-a-time conversational
  interview that digs into gaps and develops what is already known) and ОБНОВИ/АНАЛИЗ (read all the
  evidence and (re)build the living profile note). With no argument it shows the current profile.
  Invoked explicitly via the /профиль (/profil) command only — no auto-trigger.

  Trigger phrases (Russian, real user input): "/профиль", "/profil", "построй мой профиль",
  "психологический профиль", "проведи со мной интервью", "узнай меня лучше", "обнови мой профиль",
  "кто я как личность", "разбери меня как личность", "проанализируй меня", "что я за человек".

  This skill runs DIRECTLY in conversation. Do NOT launch agents for the interview — agents lose
  context between turns and cannot hold a dialog. The interviewer and the analyst are two MODES of
  this one skill, both running in the conversation.

  Discrimination vs sibling skills: `dnevnik` is raw diary capture (no analysis); `idea` captures
  ideas; `itogi` is a period review of the diary (what happened this week/month/year). THIS skill is
  about the PERSON across all their data — values, motivation, patterns, tensions — not about a
  period or an artefact. For raw capture use `dnevnik`; for a period review use `itogi`.
---

# Profil — evolving psychological self-portrait for the Obsidian vault

A standing, evolving model of **who the user is** — values, drivers, strengths, limiting patterns,
emotional patterns, how they think and relate, fears, aspirations, and internal contradictions. It
grows from two feeds: the user's own personal data already in the vault (diary, итоги, ideas), and
**adaptive interviews this skill conducts**. The interview targets the profile's gaps; the analysis
folds new material in; the sharpened profile drives the next interview. A closed learning loop, the
same shape `film` uses around its taste profile.

Runs DIRECTLY in the conversation. The interview is real dialog — never delegate it to an agent.

## The data model (this is the whole thing)

All under `<vault>/Личная/Портрет/`:

| Note | Role |
|------|------|
| `Профиль.md` | THE living psychological profile — the main artefact. Dimensions of the person, every claim grounded in linked evidence and marked with confidence, plus an «Открытые вопросы» section that the interview reads to know where to dig. |
| `Интервью/<date>.md` | Raw interview sessions, one note per date (like `dnevnik` keeps raw entries). The analysis mode interprets these; the interview mode only captures them. |
| `Портрет.md` | Folder-note hub with a Dataview index of interview sessions (the vault uses `folder-notes`, so opening the folder opens this note). |

The **only** evidence sources are inside `Личная/`: `Дневник/`, `Итоги/`, `Идеи/`, and the
interview sessions. Do NOT pull from other vault folders (work notes, interview prep, etc.) — the
profile is built from the user's personal material, as the user requested.

## 0. Locate the Obsidian vault

Find the vault root (the directory that contains `.obsidian/`). Walk up from the current directory,
with a fallback to the known path:

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
- Profile folder: `$VAULT/Личная/Портрет`
- Notes: `Профиль.md`, interview sessions `Интервью/<date>.md`, folder note `Портрет.md`
- Evidence sources: `$VAULT/Личная/Дневник`, `$VAULT/Личная/Итоги`, `$VAULT/Личная/Идеи`

## 1. Idempotent setup (run these checks EVERY time)

Create only what is missing; never overwrite an existing non-empty file.

```bash
mkdir -p "$VAULT/Личная/Портрет/Интервью"
```

Ensure the **folder note** `$VAULT/Личная/Портрет/Портрет.md` exists and is non-empty. If it is
missing OR empty, create it with the Write tool with exactly this content (the inner
` ```dataview ` block must be preserved verbatim):

````markdown
---
tags:
  - портрет
---

# 🧠 Портрет

Психологический портрет — живая модель того, какой я человек: ценности, мотивация, сильные стороны,
паттерны, страхи, противоречия. Растёт из моих личных данных (дневник, итоги, идеи) и из интервью.

- [[Профиль]] — собранный профиль личности.
- Интервью — сырые сессии вопросов и ответов (ниже).

Управляется командой `/профиль`: `интервью` — провести интервью, `обнови` — пересобрать профиль.

## Интервью

```dataview
TABLE WITHOUT ID file.link AS "Сессия", theme AS "Тема", date AS "Дата"
FROM "Личная/Портрет/Интервью"
WHERE type = "интервью"
SORT date DESC
```
````

Leave an existing non-empty folder note untouched — the Dataview query keeps the index current.

## 2. Pick the mode from the command argument

- **ИНТЕРВЬЮ** — argument is `интервью`, `интервьюируй`, `поговори со мной`, `задай вопросы`,
  `узнай меня` (or English `interview`). → §3.
- **ОБНОВИ / АНАЛИЗ** — argument is `обнови`, `анализ`, `пересобери`, `построй профиль`,
  `проанализируй` (or English `update`/`analyze`). → §4.
- **ПОКАЗАТЬ** — argument is empty, or `покажи`, `что ты обо мне знаешь`, `кто я`. → §5.
- **Ambiguous** — if you cannot tell, ask once in Russian: «Что сделать — провести интервью, обновить профиль или показать текущий?» and wait. Do NOT guess.

## 3. ИНТЕРВЬЮ mode — live, one theme per session

This is a real conversation, not a questionnaire. Goal: deepen the profile where it is thin and
develop threads that are already half-known. **One theme per session.**

1. **Read context first.** Read `Профиль.md` if it exists — especially its «Открытые вопросы»
   section and any dimension marked «(гипотеза)» or visibly thin. Skim the few most recent diary
   entries and the latest итог for fresh threads. The interview must build on what is already
   known — never ask what the user has already answered.

2. **Choose ONE theme** for this session — the biggest gap, or a thread worth developing from
   recent material (e.g. a recurring tension in the diary). State it to the user in Russian in one
   line before starting, e.g. «Сегодня копнём в то, что тебя по-настоящему драйвит. Поехали?»
   If the user names a theme themselves, use theirs.

3. **Ask ONE question at a time.** Wait for the answer, then ask a natural follow-up that develops
   *that* answer — go deeper where it gets interesting, like a good interviewer, not a fixed script.
   Anchor questions in known data when you can: «Ты в дневнике несколько раз возвращался к застрявшему
   рефакторингу — что в этом застревании цепляет сильнее всего: сам результат или ощущение контроля?»
   Follow the user's energy. A session is a handful of questions on one theme, not an interrogation.

4. **Let the user stop anytime.** On «хватит», «стоп», «давай завершим» — wrap up immediately and
   save what you have. Never push for more.

5. **Capture the session raw.** Write/append the Q&A to `Личная/Портрет/Интервью/<date>.md` with
   the **same faithful discipline as `dnevnik`**: keep the user's voice and meaning, fix only
   mechanics, do NOT analyse, embellish, or invent answers here. Analysis is §4's job, not the
   interview's. Compute date/time with `date +%Y-%m-%d` and `date +%H:%M`.

   **If the file does not exist** — create it with the Write tool:

   ```markdown
   ---
   type: интервью
   date: <YYYY-MM-DD>
   theme: <короткая тема сессии>
   tags:
     - портрет
     - интервью
   ---

   # Интервью · <Тема> · <D месяц YYYY>

   [[Портрет]]

   ## <HH:MM>

   **В:** <вопрос>
   **О:** <ответ пользователя, бережно отформатированный>

   **В:** <следующий вопрос>
   **О:** <ответ>
   ```

   **If the file already exists** (a second session the same day) — append a new `## <HH:MM>` block
   with the new Q&A. Do NOT touch existing content or the frontmatter/H1.

6. **Offer to fold it in.** After saving, tell the user in Russian what was captured and offer:
   «Записал сессию. Свернуть это в профиль сейчас (`/профиль обнови`) или позже?» If the user says
   yes, continue into §4 (REFRESH). Otherwise stop — the raw session waits for the next update.

## 4. ОБНОВИ / АНАЛИЗ mode — (re)build the living profile

This is the "weekly analyst": read the evidence and produce the profile. Two sub-modes, auto-detected.

```bash
P="$VAULT/Личная/Портрет/Профиль.md"
if [ -s "$P" ]; then echo "REFRESH"; else echo "INIT"; fi
```

### 4a. INIT — full first build

`Профиль.md` is missing or empty. Read **all** available evidence in `Личная/` and build the profile
from scratch:
- Every diary entry: `Личная/Дневник/*.md` (skip the folder note `Дневник.md`).
- Every итог: `Личная/Итоги/**/*.md` (skip the folder note).
- Every idea: `Личная/Идеи/*.md` (skip the folder note).
- Every interview session: `Личная/Портрет/Интервью/*.md`.

List what exists, then Read each. If there is essentially nothing to work with (no diary, no
итоги, no interviews), tell the user in Russian: «Пока мало данных для профиля. Поведи дневник (`/dnevnik`) или давай проведём интервью (`/профиль интервью`).» and stop.

Then write the profile per §6.

### 4b. REFRESH — incremental update

`Профиль.md` already exists. Read its frontmatter `охвачено_по:` (the date through which evidence
was last folded in) and read the existing profile in full. Gather only NEW material:
- Diary entries dated **after** `охвачено_по`.
- Interview sessions dated **after** `охвачено_по` (or any not yet reflected).
- Any итог or idea created/changed since (when in doubt, re-read the latest итог and any idea not
  yet referenced in the profile).

**MERGE into the existing profile — never wipe it.** This is the core discipline:
- Strengthen an existing claim when new evidence supports it (add the new wikilink, and you MAY
  raise its confidence from «(гипотеза)» to «(подтверждено)»).
- Add genuinely new observations as new grounded lines.
- If new evidence **contradicts** an existing claim, do not silently delete the old one — revise it
  and note the shift (e.g. «Раньше избегал публичности, в последних записях — наоборот тянется к ней
  [[2026-06-05]]»). A changing person is signal, not noise.
- Re-tighten the «Открытые вопросы» section: drop questions the new material answered, add new ones
  the new material opened.

Then write the updated profile per §6, bumping `updated:` and `охвачено_по:` to today.

## 5. ПОКАЗАТЬ mode — read back the current profile

Read `Профиль.md`. If it is missing/empty, tell the user in Russian: «Профиля ещё нет. Собрать его из твоих данных — `/профиль обнови`, или начнём с интервью — `/профиль интервью`.» and stop.

Otherwise give a tight Russian digest in chat: the 4–6 strongest observations about the person, then
the open questions — so the user sees the current picture without opening the file. Do NOT paste the
whole note back. End by naming the file path.

## 6. Profile structure & quality discipline (used by §4)

The profile is **analysis grounded in evidence**, not armchair psychology. Write it in Russian.

Structure — **adaptive**: use only the dimensions the evidence actually supports; never emit an
empty placeholder section. Common dimensions:
- `## Ценности и принципы` — what the user holds important, what they will not compromise.
- `## Что движет` — motivation, drivers, what energizes vs drains.
- `## Сильные стороны` — capabilities and traits the evidence repeatedly shows.
- `## Паттерны-ограничители` — recurring self-limiting patterns (procrastination shape, avoidance,
  perfectionism — whatever the data shows). Describe, do not scold.
- `## Эмоциональные паттерны` — how the user reacts to stress, success, uncertainty.
- `## Отношения и социальное` — how they relate to people (only if the data speaks to it).
- `## Мышление и решения` — how they think and decide.
- `## Страхи и тревоги` — recurring worries, only as the data supports.
- `## Устремления` — where they are trying to go.
- `## Противоречия` — internal tensions (e.g. wants visibility AND avoids it). **This is the most
  valuable section** — surface the contradictions the raw data does not state outright.
- `## Открытые вопросы` — what is still unknown or uncertain. The interview reads THIS to pick its
  next theme. Always keep this section alive.

Hard rules (a profile that breaks these is harmful, not helpful):

1. **Ground every claim in evidence.** Each observation links to the diary entry / итог / interview /
   idea that supports it, via wikilinks: diary `[[2026-06-02]]`, итог `[[2026-W22]]`, interview
   `[[Интервью/2026-06-06]]` (or by its title), idea `[[<название идеи>]]`. No free-floating trait
   has a place here. If you cannot point to evidence, it does not go in the profile — it goes in
   «Открытые вопросы» as something to explore.
2. **Mark confidence.** Tag tentative observations «(гипотеза)» and well-supported ones
   «(подтверждено)». Do not overclaim — a single diary line is a hypothesis, a pattern across many
   entries is supported. Honesty about uncertainty is the point.
3. **No clinical diagnosis.** Never attach disorder labels, syndromes, or clinical terms. Describe
   patterns, values, drivers, and tensions in plain language — not «у тебя СДВГ / тревожное
   расстройство». This is a portrait, not a diagnosis.
4. **The user's framing, no coaching.** Russian, their own words for themselves. Describe the person;
   do NOT prescribe what to do about it, do NOT moralize, do NOT cheerlead. (Same discipline as
   `itogi`.) The «Открытые вопросы» are neutral observations of what is unresolved, not advice.
5. **Never invent.** Do not manufacture traits, events, or feelings the evidence does not support.
   An honest thin profile beats a rich fictional one.

Correct vs incorrect:
- Correct: «Контроль над результатом важнее похвалы: застрявший рефакторинг тревожит не из-за оценки
  окружающих, а из-за потери управляемости [[2026-06-02]], [[2026-06-04]]. (подтверждено)»
- Incorrect: «Ты перфекционист с тревожным расстройством, тебе нужно научиться отпускать.» — that is
  a clinical label plus unsolicited advice plus an ungrounded claim. Never do this.

File layout — `$VAULT/Личная/Портрет/Профиль.md`:

```markdown
---
type: профиль
updated: <YYYY-MM-DD>
охвачено_по: <YYYY-MM-DD>     # latest evidence date folded in; REFRESH resumes after this
tags:
  - портрет
  - профиль
---

# 🧩 Профиль личности

[[Портрет]]

<adaptive dimension sections per the list above, each claim grounded + confidence-marked>

## Открытые вопросы
<what is still unknown — the interview's backlog>
```

## 7. Confirm to the user (Russian)

Reply in one or two lines naming what changed, e.g.:
- Interview: «Провёл интервью по теме «что драйвит» — записал в `Личная/Портрет/Интервью/2026-06-06.md`.»
- INIT: «Собрал профиль из твоих данных (дневник: 7, итоги: 2, интервью: 1): `Личная/Портрет/Профиль.md`. Открытых вопросов — 5.»
- REFRESH: «Обновил профиль `Личная/Портрет/Профиль.md` — добавил 3 наблюдения, одну гипотезу подтвердил, открытых вопросов теперь 4.»
- Show: a tight digest + the path.

`obsidian-git` auto-syncs the vault, so no manual git commit is needed here. The Dataview index in
`Портрет.md` picks up new interview sessions automatically.

## Critical rules

- **Command-only.** Runs only on the explicit `/профиль` invocation — no auto-trigger.
- **Interview is dialog, in conversation.** One theme per session, one question at a time, build on
  known data, let the user stop anytime. NEVER delegate the interview to an agent.
- **Capture (interview) vs analysis (обнови) stay separate.** The interview saves raw Q&A faithfully;
  only ОБНОВИ interprets. Do not analyse inside the interview note.
- **Ground everything, mark confidence, never invent.** Every profile claim links to evidence and
  carries «(гипотеза)»/«(подтверждено)». No evidence → «Открытые вопросы», not a stated trait.
- **No clinical diagnosis, no coaching.** Describe the person; do not label or prescribe.
- **REFRESH merges, never clobbers.** Strengthen, add, or revise-with-note; never wipe prior
  substance. A changing person is recorded as change.
- **Source is only `Личная/`.** Diary, итоги, ideas, interviews. Nothing else.
- **Russian stays Russian** — all note content and chat replies in Russian; never translate.
- **Single-shot, no agents** — read, converse, and write directly in the conversation.
