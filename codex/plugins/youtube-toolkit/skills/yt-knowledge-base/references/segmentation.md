# Segmentation rules — top / fail / neutral

Classify each video relative to the channel's own performance, not to absolute thresholds. A video with 5k views is a top performer on a 1k-sub channel and a fail on a 1M-sub channel — only the channel-relative comparison is meaningful.

## Primary metric — views-per-day (VPD)

Absolute view counts are unfair to recent videos. Always normalize:

```
vpd = view_count / max(days_since_publish, 1)
```

Compute `vpd` for every video. Then compute the channel-wide median `vpd_median` over all videos.

### Thresholds

- `top`     — `vpd >= 1.5 * vpd_median`
- `fail`    — `vpd <= 0.5 * vpd_median`
- `neutral` — everything in between

Record the actual ratio in `classification_reason`, e.g. `"vpd 2.3x medianVPD"` or `"vpd 0.4x medianVPD"`. The next pass should be able to recompute and verify.

## Secondary signal — engagement

Compute `engagement = (like_count + comment_count) / max(view_count, 1)`. Take the channel median `engagement_median`.

Apply ONLY as a tie-breaker / annotation:
- If a video is `neutral` by VPD but `engagement >= 2 * engagement_median`, annotate `classification_reason` with `"low VPD but engagement 2.1x median — possibly slow-burn"`. Do NOT flip the classification.
- If a video is `top` by VPD but `engagement <= 0.3 * engagement_median`, annotate `"top VPD but engagement weak — possibly clickbait that under-delivered"`. Still record as `top`.

The point of engagement is to give the human reader an extra hint, not to make the classification noisy.

## Age cutoff for fresh videos

Videos younger than 14 days don't have enough data — their VPD swings wildly. Set their `classification: neutral` and `classification_reason: "too fresh — published <14 days ago"`. Do NOT call a 3-day-old video a fail.

## Edge cases

- **Channel has fewer than 5 videos** — skip classification entirely. Set every video to `neutral` with reason `"channel too small for relative scoring (n<5)"`. The base still gets built; downstream skills will adapt.
- **All videos have similar VPD** (e.g. tight cluster, std/median < 0.2) — still apply thresholds, but the user will see most videos land in `neutral`. That is correct, not a bug.
- **Shorts vs long-form mixed** — if a single channel has both, the VPD distribution will be bimodal and the median misleading. Detect via duration: split videos into `duration_sec < 90` (Shorts) and `duration_sec >= 90` (long-form), compute medians PER cohort, classify within cohort. Record `cohort: short | long` in frontmatter.

## What goes into `classification_reason`

Required: the actual ratio that drove the decision. Format: `"vpd <X.X>x medianVPD"` for the primary metric, plus any secondary annotations from above.

Examples:
- `"vpd 2.3x medianVPD"`
- `"vpd 0.4x medianVPD; engagement 1.1x median"`
- `"vpd 1.1x medianVPD; engagement 2.4x median — possibly slow-burn"`
- `"too fresh — published 5 days ago"`
- `"channel too small for relative scoring (n<5)"`

Keep the reason machine-parseable (English, fixed format) so downstream skills can filter on it without NLP.
