---
name: yt-knowledge-base
description: >
  IMPORTANT: Invoke this skill via the Skill tool IMMEDIATELY when the user
  asks to build, refresh, or update the local YouTube knowledge base for
  their own channel — a persistent on-disk dataset of every video (metadata
  card + transcript + top/fail classification) that downstream skills consume
  as context. Do NOT skip — this skill contains the data-collection
  procedure, segmentation rules, and the file layout other skills rely on
  in references/.

  Trigger phrases (Russian): "собери базу по моему каналу", "собери базу
  знаний канала", "обнови базу видео", "обнови БД канала", "загрузи мои
  видео в БД", "база знаний канала", "yt-knowledge-base", "построй базу
  канала", "пересобери базу видео".

  Two modes: INIT (full build from scratch — every video on the channel)
  and REFRESH (incremental — new videos since last run + refreshed metrics
  for existing ones). The skill auto-detects which mode applies by checking
  whether the vault folder already has content.

  Do NOT use this skill for one-off channel analysis — that is yt-my-channel.
  Do NOT use this skill for competitor data — that is yt-competitors.
---

# yt-knowledge-base — persistent channel knowledge base

Build and maintain the user's own-channel knowledge base on disk. Every video the user has published gets a card (metadata + statistics + transcript) and is classified as `top` / `fail` / `neutral` relative to channel medians. Other skills (`yt-ideas`, `yt-seo`, `yt-thumbnail`, `yt-script`, `yt-my-channel`, `yt-content-plan`) read this dataset as context — it is the channel's living memory.

## Where the data lives

All files go into the Obsidian vault under a dedicated folder:

```
C:\projects\Claude\youtube\база\
├── канал.md            # channel-level snapshot (subs, total views, medians, last_updated)
├── индекс.md           # one-line-per-video index with classification
└── видео\              # one file per video
    └── <video-slug>.md
```

Follow the vault conventions in `${CLAUDE_PLUGIN_ROOT}/references/vault.md` (Cyrillic kebab-case slugs, frontmatter, no overwrites). The `база\` folder is added to the canonical 8-folder layout — see `vault.md`.

The video slug used here is the SAME slug that `сценарии/`, `seo/`, `превью/` use, so a single video forms a cross-folder bundle: `база/видео/<slug>.md` ↔ `сценарии/<slug>.md` ↔ `seo/<slug>.md`.

## Procedure

### Step 1 — Get channel handle and detect mode

Ask once if not already in conversation: "Какой handle или ID вашего канала?" Accept `@handle`, channel URL, or channel ID.

Check whether `C:\projects\Claude\youtube\база\канал.md` exists:
- Exists → **REFRESH** mode.
- Does not exist → **INIT** mode.

Tell the user which mode is running in one sentence in Russian.

### Step 2 — Pull channel-level data

Call `getChannelStatistics` for: subscribers, total views, total video count, channel creation date.

### Step 3 — Enumerate videos

Call `getChannelTopVideos` with the largest `maxResults` the tool accepts (typically 50). If the channel has more videos than one batch returns, paginate until you have every video ID — INIT must cover the full channel.

In REFRESH mode, additionally compare returned IDs against the existing files in `база\видео\`. Split into:
- **NEW** — IDs not yet in the base.
- **EXISTING** — IDs already on disk; their metrics may have changed.

### Step 4 — Pull per-video data

For every video ID (INIT — all of them; REFRESH — NEW + EXISTING):
1. `getVideoDetails` — title, description, publishedAt, duration, tags, viewCount, likeCount, commentCount.
2. `getTranscripts` — transcript text in the channel's primary language.

Batch the calls where the MCP tool accepts arrays. Be efficient — one MCP call per batch, not one per video.

If a transcript is missing (returns empty), write the card anyway with a `transcript_available: false` flag in frontmatter and leave the transcript body section empty. Do NOT fabricate.

### Step 5 — Compute channel medians and classify

After all video stats are loaded, compute on the full set:
- `median_views_per_day` — for each video, `viewCount / max(days_since_publish, 1)`; take the median.
- `median_engagement` — `(likeCount + commentCount) / max(viewCount, 1)`; take the median.

Apply the rules in `references/segmentation.md` to classify each video as `top` / `fail` / `neutral`. Always normalize by video age (use views-per-day, not absolute views) — a 3-year-old video naturally accumulates more views than a 3-month-old one.

### Step 6 — Write the files

For each video, write `C:\projects\Claude\youtube\база\видео\<slug>.md` using the template in `references/video-card-template.md`. Use the SAME slug rules as the rest of the vault (Cyrillic, lowercase, kebab-case, derived from working title — see `${CLAUDE_PLUGIN_ROOT}/references/vault.md`).

In REFRESH mode for EXISTING videos: read the existing file, preserve the transcript body (it doesn't change), update only frontmatter metrics (`view_count`, `like_count`, `comment_count`, `classification`, `classification_reason`, `last_updated`). Do NOT re-fetch the transcript if it was already saved successfully — transcripts don't change.

Write `канал.md` using the template in `references/channel-snapshot-template.md`. Write `индекс.md` as a sortable table — one row per video with title, slug, published_at, views, classification.

### Step 7 — Report in Russian

Single chat message summarizing:
- Mode used (INIT / REFRESH).
- How many videos written / updated.
- Counts by classification (top / fail / neutral).
- Channel medians (views-per-day, engagement).
- Path to the base folder.

Do NOT dump the full per-video data into chat — that is what the files are for. Downstream skills read the files, not the chat.

## Inputs and outputs

- **Input:** channel handle / URL / ID. Nothing else from the user.
- **Output:** files under `C:\projects\Claude\youtube\база\` + one short Russian summary in chat.

## How downstream skills consume this

Other skills do NOT call this one. They read the files directly:
- `yt-ideas` — reads `индекс.md` + sample of `top` cards to learn what worked.
- `yt-seo` — reads `top` titles/tags to learn the channel's working patterns.
- `yt-thumbnail` — reads `top` titles + descriptions for tone.
- `yt-script` — reads transcripts of `top` videos for the user's voice.
- `yt-my-channel` — reads `канал.md` for the snapshot section instead of recomputing.
- `yt-content-plan` — reads `индекс.md` to space out topics and avoid repeats.

The skill itself must keep the file layout stable so consumers don't break.

## Boundaries

- This skill is data collection ONLY. Do NOT produce analysis, recommendations, or ideas — those belong to `yt-my-channel` / `yt-ideas`.
- Do NOT write outside `C:\projects\Claude\youtube\база\`.
- Do NOT touch other vault folders (`канал\`, `идеи\`, `сценарии\`, etc.).
- Do NOT classify based on absolute view counts — always normalize by age (see `references/segmentation.md`).
- Do NOT skip the transcript fetch silently — if it failed, record `transcript_available: false` so the user knows.
- Do NOT delete files for videos that disappeared from the API response (the video may be unlisted/private temporarily). Mark `last_seen` instead in a future iteration; for now, leave stale files alone.
