---
name: itogi
description: >
  Produce an analytical period review (итог) of the user's Obsidian diary and write it into
  the vault. Three levels — week, month, year — built as a cascade: the weekly итог analyses
  the daily diary entries, the monthly итог analyses the weekly итоги (NOT the daily entries),
  the yearly итог analyses the monthly итоги. Invoked explicitly via the /itogi command only —
  no auto-trigger. Analysis, not a flat summary; for raw capture use `dnevnik`, for strategy
  use `strategist`.
---

# Itogi — analytical period review for the Obsidian diary

The user runs `/itogi <period>` to get an **analysis** of a stretch of their diary — what
happened, what moved, recurring patterns, blockers, insights — written as a clean Obsidian
note. This is the analytic counterpart to `dnevnik` (which only captures raw entries).

**This is analysis, NOT a summary.** Do not concatenate or compress entries into one long
read-back. Read the source material, then produce interpretation: themes, trajectory,
progress, contradictions, blockers, insights, and a focus for the next period.

## The cascade (read this first — it defines what each level reads)

Each level reads the level **below it**, never the raw daily entries beyond the weekly level:

| `/itogi` arg | Reads | Writes |
|--------------|-------|--------|
| `неделя` (week)  | daily entries `Личная/Дневник/<date>.md` of the target week | `Личная/Итоги/Недели/<ISO>.md` |
| `месяц` (month)  | weekly итоги `Личная/Итоги/Недели/*.md` of the target month | `Личная/Итоги/Месяцы/<YYYY-MM>.md` |
| `год` (year)     | monthly итоги `Личная/Итоги/Месяцы/<YYYY>-*.md` of the target year | `Личная/Итоги/Годы/<YYYY>.md` |

The month level MUST NOT read raw daily entries; the year level MUST NOT read weekly итоги or
daily entries. This keeps each higher level a meta-analysis of compact lower-level analyses
instead of one giant wall of raw text.

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
- Diary (source for week level): `$VAULT/Личная/Дневник`
- Итоги root: `$VAULT/Личная/Итоги`, with subfolders `Недели`, `Месяцы`, `Годы`.

## 1. Parse the period argument

The user passes the period as the argument: `неделя`, `месяц`, or `год` (accept English
`week`/`month`/`year` and obvious typos too). If no argument is given, ask in Russian:
«За какой период подвести итог — неделя, месяц или год?» and wait. Do NOT guess.

An optional second argument pins an explicit period instead of the default:
- `/itogi неделя 2026-W21` → that ISO week
- `/itogi месяц 2026-04` → that calendar month
- `/itogi год 2025` → that calendar year

Default target period when no explicit id is given:
- **неделя** → the **current** ISO week (the week containing today — the user typically runs this at week's end).
- **месяц** → the **previous** calendar month (the user runs this early in the new month).
- **год** → the **previous** calendar year.

## 2. First-run setup (idempotent — run these checks EVERY time)

Create only what is missing; never overwrite an existing file.

```bash
mkdir -p "$VAULT/Личная/Итоги/Недели" "$VAULT/Личная/Итоги/Месяцы" "$VAULT/Личная/Итоги/Годы"
```

Ensure the **folder note** `$VAULT/Личная/Итоги/Итоги.md` exists and is non-empty (this vault
uses the `folder-notes` plugin, so opening the folder opens this note; it serves as the
итоги index, kept current automatically by a **Dataview** query — never maintained by hand).
If the file is missing OR empty, create it with the Write tool with exactly this content
(the inner ` ```dataview ` block must be preserved verbatim):

````markdown
---
tags:
  - итог
---

# 🧭 Итоги

Аналитические итоги по дневнику. Три уровня: неделя → месяц → год. Каждый уровень строится
из итогов уровня ниже (месяц — из недельных, год — из месячных), а не из всех записей подряд.

## Недели

```dataview
TABLE WITHOUT ID file.link AS "Неделя", period_start AS "С", period_end AS "По"
FROM "Личная/Итоги/Недели"
WHERE type = "итог"
SORT date DESC
```

## Месяцы

```dataview
TABLE WITHOUT ID file.link AS "Месяц", date AS "Конец"
FROM "Личная/Итоги/Месяцы"
WHERE type = "итог"
SORT date DESC
```

## Годы

```dataview
TABLE WITHOUT ID file.link AS "Год", date AS "Конец"
FROM "Личная/Итоги/Годы"
WHERE type = "итог"
SORT date DESC
```
````

Leave an existing non-empty folder note untouched — the Dataview queries keep it current.

## 3. Determine the target period and gather sources

Compute dates with GNU `date` (Git Bash). `date +%u` is the ISO weekday (Mon=1 … Sun=7).

### 3a. Week level (`неделя`)

```bash
# Current ISO week id and its Monday..Sunday range
WEEK_ID=$(date +%G-W%V)                                   # e.g. 2026-W22
MON=$(date -d "-$(( $(date +%u) - 1 )) days" +%Y-%m-%d)   # Monday
SUN=$(date -d "$MON +6 days" +%Y-%m-%d)                   # Sunday
MONTH_OF_WEEK=$(date -d "$MON +3 days" +%Y-%m)            # Thursday's month — the month this week belongs to
echo "$WEEK_ID $MON..$SUN month=$MONTH_OF_WEEK"
```

List which daily entries actually exist in the range, then **Read each existing one** with the
Read tool (enumerate the 7 dates Mon..Sun; skip dates that have no file):

```bash
ls "$VAULT/Личная/Дневник/"*.md 2>/dev/null | sort
```

Keep only files whose date (the `YYYY-MM-DD` filename) falls in `$MON..$SUN`. If **no** daily
entries exist in the range, tell the user in Russian: «За неделю <WEEK_ID> нет записей в дневнике — нечего анализировать.» and stop.

### 3b. Month level (`месяц`)

Target month = the previous calendar month by default (or the explicit `YYYY-MM`).

```bash
PREV_MONTH=$(date -d "$(date +%Y-%m-01) -1 day" +%Y-%m)         # e.g. 2026-05
M_END=$(date -d "$(date +%Y-%m-01) -1 day" +%Y-%m-%d)           # last day of prev month
echo "month=$PREV_MONTH end=$M_END"
```

Sources are the **weekly итоги** whose `month:` frontmatter equals the target month. Find them
with Grep (pattern `^month: <YYYY-MM>` over `Личная/Итоги/Недели`), then Read each match.

If **zero** weekly итоги match, do NOT fall back to raw daily entries (that breaks the
cascade). Tell the user in Russian: «За <месяц> нет недельных итогов. Месячный анализ строится из недельных — сначала сгенерируй их: `/itogi неделя`. Затем повтори `/itogi месяц`.» and stop. If only **some** weeks are present, proceed with what exists and note the gap in the result.

### 3c. Year level (`год`)

Target year = the previous calendar year by default (or the explicit `YYYY`).

```bash
PREV_YEAR=$(( $(date +%Y) - 1 ))   # e.g. 2025
echo "year=$PREV_YEAR"
```

Sources are the **monthly итоги** of that year — files `Личная/Итоги/Месяцы/<YYYY>-*.md`. List
and Read each:

```bash
ls "$VAULT/Личная/Итоги/Месяцы/${PREV_YEAR}-"*.md 2>/dev/null | sort
```

If **zero** monthly итоги exist, do NOT fall back to weekly or daily. Tell the user in Russian:
«За <год> нет месячных итогов. Годовой анализ строится из месячных — сначала сгенерируй их: `/itogi месяц`. Затем повтори `/itogi год`.» and stop. If only some months are present, proceed and note the gap.

## 4. Produce the analysis (the core of the skill)

Read the gathered sources, then write **analysis**, not a retelling. Strict rules:

1. **Interpret, don't transcribe.** The reader already has the raw entries. Surface what they
   do not see at a glance: themes, trajectory, cause-and-effect, contradictions.
2. **Ground every claim in the sources.** Tie observations to concrete entries via wikilinks
   (week level → `[[2026-06-01]]`; month level → `[[2026-W22]]`; year level → `[[2026-05]]`).
   Do NOT invent events, feelings, or progress the sources do not support.
3. **Keep the user's language (Russian)** and their own framing of events. Do not moralize or
   give unsolicited advice — that is `strategist`'s job. A forward-looking "фокус на следующий
   период" is allowed as a neutral observation of what is unresolved, not as coaching.
4. **Scale the lens to the level:**
   - **Week** (from daily entries): main events / what got done, progress on projects and
     goals, recurring themes across the days, mood & energy pattern, problems and blockers,
     insights or decisions, and what is carried into next week.
   - **Month** (from weekly итоги): trends across the weeks, overall trajectory (what advanced
     vs. what stalled), patterns that persisted all month, the few defining wins or setbacks,
     and the open focus for next month. This is a meta-analysis of the weekly итоги.
   - **Year** (from monthly итоги): the arc of the year, major themes and turning points,
     growth and change over the months, what defined the year, and the direction it points to.
5. **Be concise and structured.** Use `## ` / `### ` sections. Prefer tight prose and short
   bullet lists over long paragraphs. The итог should be readable in a minute, not a re-read
   of the whole period.

Correct vs incorrect:
- Correct (week): "Три из шести записей — про застрявший рефакторинг бота ([[2026-06-02]], [[2026-06-04]]); к выходным он сдвинулся. Энергия падала к середине недели."
- Incorrect: pasting the diary entries back verbatim, or "Отличная неделя, так держать!" — that is neither analysis nor something the user wrote.

## 5. Write the итог file

If a file for the target period **already exists**, ask in Russian before touching it:
«Итог за <период> уже есть (`<path>`). Перегенерировать?» — overwrite only on confirmation;
otherwise stop. (Unlike `dnevnik`, an итог is a computed artefact, so regeneration is valid —
but never silently.) If it does not exist, create it with the Write tool.

Use the human-readable Russian heading (weekday/month/year names in Russian).

**Week** — `$VAULT/Личная/Итоги/Недели/<WEEK_ID>.md`:

```markdown
---
type: итог
period: неделя
period_id: <WEEK_ID>          # e.g. 2026-W22
period_start: <MON>           # YYYY-MM-DD, Monday
period_end: <SUN>             # YYYY-MM-DD, Sunday
month: <MONTH_OF_WEEK>        # YYYY-MM — used by the month level to find this week
date: <SUN>                   # YYYY-MM-DD, for Dataview sorting
tags:
  - итог
  - итог/неделя
---

# Неделя <N> · <D месяц> – <D месяц YYYY>

[[Итоги]]

<analysis sections>
```

**Month** — `$VAULT/Личная/Итоги/Месяцы/<YYYY-MM>.md`:

```markdown
---
type: итог
period: месяц
period_id: <YYYY-MM>
year: <YYYY>                  # used by the year level
date: <M_END>                 # last day of the month, for sorting
tags:
  - итог
  - итог/месяц
---

# <Месяц YYYY> (например, Май 2026)

[[Итоги]]

<analysis sections>
```

**Year** — `$VAULT/Личная/Итоги/Годы/<YYYY>.md`:

```markdown
---
type: итог
period: год
period_id: <YYYY>
date: <YYYY>-12-31
tags:
  - итог
  - итог/год
---

# Итоги <YYYY> года

[[Итоги]]

<analysis sections>
```

The index updates itself — the Dataview queries in `Итоги.md` pick up the new note as long as
it lives in the right subfolder and carries the `type: итог` and `date:` frontmatter set above.
Do NOT edit `Итоги.md` per entry.

## 6. Confirm to the user (Russian)

Reply in one or two lines naming the file and what was analysed, e.g.:
«Подвёл итог недели: `Личная/Итоги/Недели/2026-W22.md` (проанализировано записей: 5).»
«Подвёл итог месяца: `Личная/Итоги/Месяцы/2026-05.md` (на основе 4 недельных итогов).»

`obsidian-git` auto-syncs the vault, so no manual git commit is needed here.

## Critical rules

- **Respect the cascade.** Week reads daily entries; month reads weekly итоги; year reads
  monthly итоги. Never read raw daily entries for a month or year итог.
- **Analysis, not a summary.** Interpret and find patterns; do not paste back or merely
  compress the source entries.
- **Never invent content** the sources do not support; ground claims in linked entries.
- **Russian stays Russian** — write the итог in the user's language; never translate.
- **Never overwrite silently** — an existing итог is regenerated only after the user confirms.
- **No advice/coaching** — that is `strategist`. This skill describes the period, it does not
  prescribe what to do about it.
- **Single-shot** — gather and write directly in the conversation; no subagents.
