---
name: yt-content-plan
description: >
  IMPORTANT: Invoke this skill via the Skill tool IMMEDIATELY when the user
  asks to build a content plan, publication calendar, schedule, or month-of
  content. Do NOT skip — this skill contains the cadence rules and calendar
  template in references/.

  Trigger phrases (Russian): "контент-план", "контент план", "расписание
  видео", "план публикаций", "календарь канала", "контент на месяц",
  "контент на неделю", "распиши план", "график выхода видео", "план роликов".

  This channel ships 1 video/week, ≤ 20 min, NO Shorts. Plans must respect
  this cap.
---

# yt-content-plan — publication calendar

Build a calendar that schedules concrete videos against weeks. Balance flagship-series episodes, tutorials/case studies, and lead-gen anchors. Honour the 1-video/week cap.

## Procedure

1. **Get the period.** Default — next **8 weeks**. Accept "месяц" → 4 weeks, "квартал" → 12 weeks. Confirm if ambiguous.

2. **Get the idea pool.** Look in conversation for a `yt-ideas` output. If absent, ask: "Передай список идей от yt-ideas или скажи 'возьми любые из конкурентского анализа'." Do not invent ideas here — that is `yt-ideas`'s job.

3. **Read the start date.** Default — next Monday from today. Confirm if the user has a specific cadence weekday.

4. **Apply the balance** from `references/cadence.md`:
   - Mix: roughly 1 flagship-series episode every 2 weeks, 1 lead-gen every 3–4 weeks, the rest tutorial / case / tool review.
   - Never two flagship episodes back-to-back (lock-in risk).
   - Never two lead-gen back-to-back (audience tunes out the pitch).
   - Open with a strong (top-funnel friendly) idea, not a niche deep-dive.

5. **Render the calendar** using `references/calendar-template.md`.

6. **Add reservations.** Mark gaps if there are not enough ideas for the period — show the user where they need to source more from `yt-ideas`.

## Inputs and outputs

- **Input:** period (weeks), idea pool, start date.
- **Output:** calendar table + week-by-week notes (production status, dependencies).

## Boundaries

- Do not generate ideas — request them from the user / direct to `yt-ideas`.
- Do not write scripts or SEO — those are downstream skills.
- Do not include Shorts. The channel does not produce them. If the idea pool contains a Shorts idea, drop it and note the drop.
- The calendar is a working artefact — propose it, then ask the user if they want adjustments.
