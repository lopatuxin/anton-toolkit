# The portrait — `Личная/Портрет/Профиль.md`

A standing model of who the owner is: values, drivers, strengths, limiting patterns, energy and
slumps, how he thinks and relates, fears, aspirations, contradictions. Claude reads it to
understand him and to make advice fit the real person. Only `itogi` writes it, folding in what each
review learned; nothing else edits it. The older raw interviews in `Личная/Портрет/Интервью/` stay as
source material and are not added to any more.

## Shape

Two to three pages — about 10 KB at most. When a new line would push it past that, merge it into an
existing line or drop the weakest claim; the portrait never grows by appending.

Sections are adaptive — only those the evidence supports, never an empty placeholder:
`## Ценности и принципы`, `## Что движет`, `## Сильные стороны`, `## Паттерны-ограничители`,
`## Энергия и спады`, `## Отношения и социальное`, `## Мышление и решения`, `## Страхи и тревоги`,
`## Устремления`, `## Противоречия`, `## Открытые вопросы`.

- `## Энергия и спады` — when his energy drops, what came before a slump (overload, no days off,
  a stalled project), how long it lasted, what brought him out. Periods of apathy are real for him
  and the diary goes silent in them; a gap in the diary is evidence here, not a failure.
- `## Противоречия` — the most valuable section: tensions the raw material never states outright
  (wants X and keeps doing the opposite).
- `## Открытые вопросы` — what is still unknown. The reviews take their questions from here.

## Rules

1. **Every claim is grounded.** One or two wikilinks to the evidence — diary `[[2026-06-02]]`, review
   `[[2026-W22]]`, `[[2026-06]]`, interview `[[Интервью/2026-06-06]]`, idea `[[<название>]]`. No
   evidence — it goes to «Открытые вопросы», not into the portrait.
2. **Confidence is marked**: «(гипотеза)» for one or two signals, «(подтверждено)» for a pattern
   across periods.
3. **No clinical labels** — no diagnoses or syndromes, plain language about patterns.
4. **Describe, do not prescribe.** Advice lives in the reviews, never in the portrait.
5. **A change is signal.** When new evidence contradicts a claim, revise it and keep the shift
   visible: «Раньше …, с [[2026-W40]] — наоборот …».
6. **Never invent.** A thin honest portrait beats a rich fictional one.

Correct: «Контроль над результатом важнее похвалы: застрявший рефакторинг тревожит потерей
управляемости, а не оценкой других [[2026-06-02]], [[2026-06-04]]. (подтверждено)»
Incorrect: «Ты перфекционист с тревожным расстройством, тебе нужно научиться отпускать.»

## Frontmatter

```yaml
---
type: профиль
updated: <YYYY-MM-DD>
tags:
  - портрет
  - профиль
---
```

Heading `# 🧩 Профиль личности`, then `[[Портрет]]`.
