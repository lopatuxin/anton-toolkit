---
name: itogi
description: >
  Writes the owner's weekly, monthly or yearly review in the Obsidian vault: what the period really
  was, a check of the previous review's advice, at most three pieces of advice tied to his goals,
  and a few questions; it then folds what it learned into his portrait and, monthly, into his goals
  and finances. Runs on request and automatically every Monday from a scheduled task. For a raw
  diary entry use `dnevnik`; for an idea or a new goal use `idea`.
when_to_use: >
  "подведи итоги недели", "итог месяца", "итоги года", "/itogi", a scheduled run with «авто»
---

# Itogi — period reviews that know the owner and give advice that holds up

A review is interpretation, not a retelling: what the period actually was, where time and energy
went against what he wants, what repeats, what to change. Every review ends with at most three
pieces of advice and a few questions, and the next review starts by checking that advice. This loop
— advise, check, drop or rework what did not take — is what keeps the advice to the point.

Read before starting: `${CLAUDE_PLUGIN_ROOT}/references/vault.md` (vault search, conventions),
`${CLAUDE_PLUGIN_ROOT}/references/portrait.md` and `${CLAUDE_PLUGIN_ROOT}/references/goals.md`; for
a monthly review also `${CLAUDE_PLUGIN_ROOT}/references/finance.md`.

## 1. Period and mode

The argument names the level: `неделя`, `месяц`, `год` (also `week`/`month`/`year`), optionally with
an explicit id — `2026-W38`, `2026-09`, `2026`. With no level, ask once which one.

Default ids, computed with GNU `date` in Git Bash (`date +%u` is the ISO weekday, Monday = 1):
- **week** — the ISO week containing yesterday: run on a Monday it is the week just ended, run on
  a Sunday evening it is the current one. `MON` = that week's Monday, `SUN` = `MON + 6 days`,
  `WEEK_ID=$(date -d "$MON" +%G-W%V)`, `MONTH_OF_WEEK=$(date -d "$MON +3 days" +%Y-%m)` (the week
  belongs to the month of its Thursday).
- **month** — the previous calendar month. **year** — the previous calendar year.

**Automatic run** — the argument contains `авто` (the scheduled task passes it). It always starts
with the week level and then cascades:
1. Write the weekly review for the default week. If it already exists, skip to step 2.
2. If the next week's Thursday (`$SUN + 4 days`) falls in another month than `MONTH_OF_WEEK`, this
   was the month's last week — write the monthly review for `MONTH_OF_WEEK` (skip if it exists).
3. If that month is December, write the yearly review for its year (skip if it exists).

In an automatic run nobody is at the keyboard: never wait for an answer mid-run and never overwrite
an existing review. The questions go at the end of the final message (§8).

Interactive run on an existing review: ask «Итог за <период> уже есть. Перегенерировать?» and
overwrite only on «да».

## 2. Sources

Each level reads the level below, never raw material two levels down — that keeps the higher
reviews an analysis of analyses instead of a wall of raw text.

**Week** (`MON..SUN`):
- the diary entries `Личная/Дневник/<date>.md` of those seven days;
- project journal entries dated in the week — files `YYYY-MM-DD-*.md` inside every
  `Проекты/*/Журнал */` and `Работа/**/Журнал */` folder (one decision or dead end each; they show
  what he actually worked on when the diary is silent);
- how much he committed where: for each git repo in `C:/projects/*/` except the vault,
  `git -C <repo> log --since="$MON 00:00" --until="$SUN 23:59" --oneline | wc -l` — a count per
  repo, not the messages;
- the previous weekly review's «Советы» section (to check it), `Цели.md`, `Профиль.md`.

**Month**: the weekly reviews whose `month:` equals the month (Grep `^month: <YYYY-MM>` in
`Личная/Итоги/Недели`), the finances (finance.md), `Цели.md`, the alive ideas in `Личная/Идеи/`
(`status` черновик, в проработке or отложена) with their `updated`, the previous monthly review's «Советы», `Профиль.md`.

**Year**: the monthly reviews `Личная/Итоги/Месяцы/<YYYY>-*.md`, `Цели.md`, `Профиль.md`.

A missing lower level never stops the review: a week with no diary entries is written from the
journals and commits, and says the diary was silent; a month or year with missing weeks or months
works from what exists and names the gap. Silence in the diary is information — he has periods of
apathy when tired, and the review treats a gap as a possible slump to understand, never as a failure
to scold.

## 3. The review

Interpret; do not retell. The reader has the raw entries.

- **Проверка прошлых советов** comes first (skip only when there is no previous review): each
  previous piece of advice — done, not done, partly — and why, from the sources. Advice not done
  twice in a row is not repeated: either it is dropped, or the review asks why it did not fit.
- **What the period was**: where time and energy went, what moved and what stalled, the thread that
  ran through it. Compare deeds with goals: where the time went against what `Цели.md` says matters.
- **Energy**: rhythm, sleep, sport, slumps — only as the sources show it.
- **Week**: main events, progress by project, recurring themes, what carries over.
- **Month**: trends across the weeks, trajectory, the few defining wins and setbacks; the
  `## Финансы` section per finance.md; each active goal's progress this month; alive ideas that
  ripened into a goal or project, and ideas lying untouched for months (ask: park, drop or keep?).
  An idea whose project started this month is proposed to be marked `стала проектом`.
- **Year**: starts with two honest lists — what went well and what did not, six to eight points
  each if the year supports it; then the arc of the year and its turning points; then each goal —
  reached, alive, or to drop; and a proposed direction for the next year.

Every claim is grounded with wikilinks — diary `[[2026-06-01]]`, week `[[2026-W22]]`, month
`[[2026-05]]`, journal entries by name. No invented events, feelings or progress. Readable in a
couple of minutes: `##` sections, tight prose, short lists.

## 4. Advice — at most three, or none

Put it in a `## Советы` section, numbered, each in this shape:

`1. **<what to do, concretely, in the next period>** — <what was noticed, with links> · цель: <the goal from Цели.md it serves, or the portrait pattern it addresses> · проверка: <what the next review will look at to see it worked>`

What makes advice worth giving:
- It rests on something in the sources and serves one of his goals, or addresses a pattern that
  costs him something the sources name. «Given X and Y, do Z», not a general tip.
- It fits his real time: two jobs, several live projects, no days off. One small concrete step
  beats a plan.
- **Month and year advice is about direction**: which project to push, which to drop or park, what
  to learn, where words and deeds diverge.
- In a slump, advice lowers the load or protects rest; it never pushes harder.

Never give: general wellness advice («больше спи», «найди баланс») unless the sources show what it
costs him; a new system, ritual, app or tracker; cheerleading or «так держать»; the same advice again
after it failed twice. Nothing worth advising — write «Советов нет: <why in one line>». No advice is
better than filler.

Correct: «**Один вечер в неделю без Логоса и Кузни** — три недели без выходного, а в июле после
такой же полосы дневник замолчал на два месяца [[2026-W37]], [[Профиль#Энергия и спады]] · цель: Кузня
до 31.10 · проверка: был ли вечер отдыха и как в дневнике с силами.»
Incorrect: «Старайся больше отдыхать и следи за балансом работы и жизни.»

## 5. Questions — two or three

After the advice, a `## Вопросы` section with two or three questions, one line each. Draw them from
what the period left unclear (a gap in the diary, an unexplained drop, a decision without a reason),
from the portrait's «Открытые вопросы», from a goal whose deadline or measure is «не назван», and
from a candidate new goal («Третью неделю возвращаешься к <X> — сделать это целью?»). No questions
he already answered.

Interactive run: ask them in chat one at a time and wait. Automatic run: list them at the end of the
final message. Either way, when he answers:
- append a `## Ответы` section to the review with his answers, cleaned like a diary entry — his
  words and meaning, mechanics fixed only;
- fold what they tell about him into the portrait (§7);
- a goal he agreed to is written to `Цели.md` per goals.md; a goal he rejected is not proposed again.
He may never answer — that is fine, the questions stay in the review.

## 6. Files

Create missing folders and the hub `Личная/Итоги/Итоги.md` only if missing (a Dataview hub listing
the three subfolders, like the other hubs in `Личная/`). Frontmatter, heading `# …` and `[[Итоги]]`
under it:

- Week — `Личная/Итоги/Недели/<WEEK_ID>.md`, heading `# Неделя <N> · <D месяц> – <D месяц YYYY>`:
  `type: итог`, `period: неделя`, `period_id: <WEEK_ID>`, `period_start: <MON>`, `period_end: <SUN>`,
  `month: <MONTH_OF_WEEK>`, `date: <SUN>`, tags `итог`, `итог/неделя`.
- Month — `Личная/Итоги/Месяцы/<YYYY-MM>.md`, heading `# <Месяц YYYY>`: `type: итог`,
  `period: месяц`, `period_id`, `year: <YYYY>`, `date: <last day of the month>`, tags `итог`,
  `итог/месяц`.
- Year — `Личная/Итоги/Годы/<YYYY>.md`, heading `# Итоги <YYYY> года`: `type: итог`, `period: год`,
  `period_id`, `date: <YYYY>-12-31`, tags `итог`, `итог/год`.

The section order is: Проверка прошлых советов, the analysis, Советы, Вопросы (and later Ответы).

## 7. After writing

1. **Portrait.** Fold into `Личная/Портрет/Профиль.md` what this review learned about the person —
   a confirmed or new pattern, a contradiction, an energy or slump signal, an answered open
   question — per portrait.md, staying within its size. Nothing new — leave it untouched.
2. **Goals** (month only). One `Ход` line per active goal in `Цели.md` with a link to the month.
   Changing, reaching or dropping a goal is only proposed, in the questions.
3. **Owner profile** (month and year only). If the period changed something lasting about his life
   or goals that Claude should know in every session, propose one line for `Claude/Кто-я.md` in the
   final message; write it only after his «да», keeping the file under 60 lines.

## 8. Final message (Russian)

Short, plain: which reviews were written, the three things that matter most in them, the advice in
one line each, then the questions. In an automatic run also send a push notification if the
`PushNotification` tool is available (load it with ToolSearch): «Итог недели готов — вопросы ждут
ответа». Never `git commit` the vault — obsidian-git does it.
