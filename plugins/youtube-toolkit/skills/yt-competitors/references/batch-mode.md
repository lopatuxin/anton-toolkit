# BATCH-mode report template — yt-competitors

```markdown
# Niche report — built from @user-handle context

## 1. Niche query
- Source channel: @user-handle
- User-supplied competitor seeds (included unconditionally): <list of handles | "none supplied">
- Queries used (8–15): <list>
- Subscriber threshold: <N> (default 10 000, does NOT apply to seeds)
- Channels found: <N candidates → N after threshold → N analysed>
- Full deduped candidate pool (including below-threshold, for the user to spot omissions): <list of `@handle (subs)`, one per line>

## 2. Top channels in the niche (by recent total views)
| # | Channel | Subs | Total views | Posts/week | Avg engagement | Source |
|---|---------|------|-------------|------------|----------------|--------|
| 1 | @… | … | … | … | …% | seed / search / related |
…

(Show top 15–25. The `Source` column marks whether the channel came from the user-supplied seed list, keyword search, or the related-videos expansion.)

## 3. Top videos across the niche (last 12 months)
| # | Title | Channel | Views | Length | Published |
|---|-------|---------|-------|--------|-----------|
| 1 | … | @… | … | m:ss | YYYY-MM-DD |
…

(Show top 15 across all analysed channels combined.)

## 4. Topic clusters
For each cluster, the share of total niche views and a representative title.

| Cluster | View share | Example title |
|---------|------------|---------------|
| Tool review (Cursor, Claude Code, …) | X% | … |
| Build-a-thing case study | X% | … |
| Vibe-coding tips/workflow | X% | … |
| AI-assistant assembly (Jarvis-like) | X% | … |
| Beginner onboarding | X% | … |
| Other | X% | … |

## 5. Hook formulas at the niche level
3–5 hook templates with usage counts across the niche.

## 6. Length distribution
- Niche median duration: <m:ss>
- Top-10-by-views median duration: <m:ss>
- Implication for a 1-video/week, ≤20 min channel: <one sentence>

## 7. Posting cadence
- Niche median: <X videos/week>
- Channels posting 1/week and growing: <count, examples>
- Implication for our cadence: <one sentence>

## 8. Gap analysis — opportunities
Topics, formats or angles with low supply but visible demand (look for: high-engagement ratios on outlier videos, comments asking for more, recurring themes nobody owns yet).

List 5–8 concrete gaps, each with:
- The gap (one sentence)
- Evidence from the data
- Why our channel is positioned to take it (one sentence)

## 9. Saturated areas — avoid
2–3 topic angles where the niche is crowded and engagement is dropping.

## 10. Hypotheses for our channel
3–5 testable hypotheses connecting niche findings back to our concrete next videos. These are the input to yt-ideas.
```

## Writing rules

- Numbers exact.
- Cluster taxonomy can adapt — propose clusters based on the data, do not force the table above.
- "Gap" must include evidence; otherwise it is speculation, not a gap.
- Length cap: ~1000 words. Niche reports are denser than single-channel ones.
- Always end with section 10 — that is what `yt-ideas` will read.
