# Video card template

One file per video at `C:\projects\Claude\youtube\база\видео\<slug>.md`.

The slug follows the vault rule (`${CLAUDE_PLUGIN_ROOT}/references/vault.md`): Cyrillic, lowercase, kebab-case, derived from the video's working title (Russian, NOT transliterated to Latin), ≤ 60 chars. The SAME slug is reused across `сценарии/`, `seo/`, `превью/` for the same video.

## File format

```markdown
---
type: video-knowledge
video_id: <YouTube video ID, 11 chars>
video_slug: <slug>
title: "<exact published title>"
published_at: <YYYY-MM-DD>
duration_sec: <int>
cohort: short | long
view_count: <int>
like_count: <int>
comment_count: <int>
vpd: <float, 2 decimals>
engagement: <float, 4 decimals>
classification: top | fail | neutral
classification_reason: "<machine-parseable English string from segmentation.md>"
transcript_available: <true | false>
tags:
  - youtube/video-knowledge
  - youtube/classification/<top|fail|neutral>
last_updated: <YYYY-MM-DD>
related: []
---

## Описание

<full description from getVideoDetails, verbatim — keep links, timestamps,
formatting as-is>

## Теги YouTube

<comma-separated list of tags from getVideoDetails, or "—" if none>

## Метрики

- Views: <view_count> (VPD <vpd>, <ratio>x medianVPD)
- Likes: <like_count> (<like/view ratio %>)
- Comments: <comment_count> (<comment/view ratio %>)
- Engagement: <engagement> (<ratio>x median engagement)
- Возраст: <days> дней (опубликовано <published_at>)

## Транскрипция

<full transcript text as returned by getTranscripts — preserve paragraph
breaks if the API returns them; otherwise concatenate with spaces. If
transcript_available is false, leave this section empty with a single line
"_Транскрипция недоступна._">
```

## Rules

- **Verbatim sections**: description and transcript MUST be copied as-is, no paraphrasing, no truncation. The whole point is that downstream skills can grep them.
- **Numeric precision**: `vpd` 2 decimals, `engagement` 4 decimals — enough for ranking, doesn't bloat the file.
- **Tags in frontmatter**: always include `youtube/video-knowledge` and `youtube/classification/<value>`. Optionally add `youtube/cohort/<short|long>`.
- **No commentary in the body**. Do NOT write "this video did well because…" — analysis belongs to `yt-my-channel` and `yt-ideas`, not here. This file is raw data.
- **No emoji**, no decorative markdown. Plain headings only.
- **REFRESH preserves transcript**: when updating an existing card, do NOT re-fetch the transcript if `transcript_available: true` — transcripts don't change. Only refresh metrics + classification.
