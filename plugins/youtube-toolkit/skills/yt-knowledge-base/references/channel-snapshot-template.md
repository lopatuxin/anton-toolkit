# Channel snapshot template — канал.md

One file at `C:\projects\Claude\youtube\база\канал.md`. Overwritten on every run (this file is the "latest state" snapshot, not a history). Per-snapshot dated reports live in `канал\` (the `yt-my-channel` folder) — do NOT confuse the two.

## File format

```markdown
---
type: channel-snapshot
channel_handle: "<@handle or channel ID>"
subscribers: <int>
total_views: <int>
video_count: <int>
created_at: <YYYY-MM-DD>
vpd_median: <float, 2 decimals>
engagement_median: <float, 4 decimals>
classification_counts:
  top: <int>
  neutral: <int>
  fail: <int>
last_updated: <YYYY-MM-DD>
tags:
  - youtube/channel-snapshot
---

## Канал

- Handle: <@handle>
- Подписчиков: <subscribers>
- Всего просмотров: <total_views>
- Всего видео: <video_count>
- Канал создан: <created_at>

## Медианы

- Медианный VPD (views per day): <vpd_median>
- Медианный engagement: <engagement_median>
- Когорты: long <count> / short <count>  # if both cohorts present, otherwise omit

## Распределение по классификации

- top: <count>
- neutral: <count>
- fail: <count>

## Когда обновлено

<YYYY-MM-DD>
```

## индекс.md — companion file

Same folder, one entry per video, used as a quick lookup table by downstream skills.

```markdown
---
type: video-index
last_updated: <YYYY-MM-DD>
total_videos: <int>
tags:
  - youtube/video-index
---

# Индекс видео

| slug | title | published | views | vpd | classification |
|------|-------|-----------|-------|-----|----------------|
| <slug> | <title> | <YYYY-MM-DD> | <view_count> | <vpd> | <top\|fail\|neutral> |
| ... | ... | ... | ... | ... | ... |
```

Sort rows by `published` descending (newest first). Truncate title to 70 chars with `…` if longer. The slug column lets downstream skills jump straight to `база/видео/<slug>.md`.

## Rules

- `канал.md` is overwritten in full on every run — no `-v2` suffixes, no merge logic.
- `индекс.md` is also overwritten in full on every run — it's derived from the video cards, so regenerating from scratch is always correct.
- Do NOT add free-form analysis to either file. They are structured data only.
