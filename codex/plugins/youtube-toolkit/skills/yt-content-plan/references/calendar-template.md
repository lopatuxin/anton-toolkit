# Calendar output template

```markdown
# Content plan — <YYYY-MM-DD> to <YYYY-MM-DD>

## Schedule

| Week | Date | Video | Type | Series | Status | Depends on |
|------|------|-------|------|--------|--------|------------|
| 1 | YYYY-MM-DD | <working title> | <flagship/tutorial/case/lead-gen/review> | <Logos/CRM/standalone> | <idea/script/…> | — |
| 2 | YYYY-MM-DD | … | … | … | … | … |
…

## Mix check

- Flagship-series: <count> / <target 3–4>
- Lead-gen: <count> / <target 2>
- Tutorial: <count> / <target 1–2>
- Tool review / opinion: <count> / <target 0–1>

## Adjacency check

- Back-to-back same-series violations: <none / list>
- Back-to-back lead-gen violations: <none / list>
- Opening week is top-funnel friendly: <yes / no — explain>

## Buffer

- "Ready" or "editing" buffer: <N weeks>
- Status: <healthy ≥ 2 / risky < 2>

## Gaps

- <list of weeks with no idea, with note "запусти yt-ideas">

## Notes per week

### Week 1 — <YYYY-MM-DD>
- Idea source: <which yt-ideas batch / yt-competitors gap>
- Lead-gen angle: <yes / no>
- Series state if applicable: <e.g., "Logos episode 7 — picks up where ep. 6 left off (deploy step)">
- Risk: <e.g., "depends on tool X being released by then">

### Week 2 — <YYYY-MM-DD>
…
```

## Rendering rules

- Date format: `YYYY-MM-DD`. Use the user's local interpretation if known, else assume Monday-start week.
- Working title in Russian (channel language).
- Status defaults to `idea` for new entries; carry forward existing statuses if the user pasted a previous plan.
- Adjacency check is mandatory — do not skip it. If a violation is unavoidable (only valid order), explain why.
