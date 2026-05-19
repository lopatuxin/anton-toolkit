# youtube-toolkit

Skills and agents for running a Russian-language IT / vibe-coding YouTube channel. Each component is narrow and specialised; outputs land in a persistent Obsidian vault that the next component reads.

## Architecture

Three layers — data, generators, strategy:

```
┌────────────────────────────────────────────────────────┐
│ DATA LAYER                                             │
│   yt-knowledge-base   → база\ (cards + transcripts +   │
│                          top/fail classification)      │
│   yt-my-channel       → канал\ (dated reports)         │
│   yt-competitors      → конкуренты\ (single + batch)   │
├────────────────────────────────────────────────────────┤
│ GENERATOR LAYER (read база\ for channel-aware output)  │
│   yt-ideas       → идеи\                               │
│   yt-content-plan → контент-план\                      │
│   yt-script      → сценарии\                           │
│   yt-seo         → seo\                                │
│   yt-thumbnail   → превью\                             │
│   yt-promo       → продвижение\                        │
├────────────────────────────────────────────────────────┤
│ STRATEGY LAYER                                         │
│   yt-strategist (agent) → weekly top-5 shortlist       │
└────────────────────────────────────────────────────────┘
```

All artefacts live in the Obsidian vault at `C:\projects\Claude\youtube\`. See `references/vault.md` for folder layout, filename rules (Cyrillic kebab-case), and frontmatter conventions.

## Skills

| Skill | Purpose |
|---|---|
| `yt-knowledge-base` | Build and maintain the persistent on-disk dataset of every video on the user's channel (metadata card + transcript + `top`/`fail`/`neutral` classification relative to channel medians). Two modes: INIT (full build) and REFRESH (incremental). Other skills read these files as context. |
| `yt-my-channel` | Analyse your own channel — public metrics via YouTube Data API + optional Studio paste for CTR/retention. Reads `база\` first; skips API calls if KB is fresh. |
| `yt-competitors` | Deep analysis of competitor channels — single channel or batch niche scan. Batch query is built from your own channel context, not a fixed keyword list. |
| `yt-ideas` | Generate 10–20 video ideas. Requires analytical input: a `yt-my-channel` report, a `yt-competitors` report, OR a loaded knowledge base. |
| `yt-content-plan` | Build a publication calendar at 1 video / week, no Shorts. Reads `индекс.md` to avoid scheduling topics already published recently. |
| `yt-script` | Write a full video script up to 20 min: hook, structure, CTA placement. Reads top-video transcripts from `база\` to match the user's actual speaking voice. |
| `yt-seo` | Title (A/B variants) + description with timestamps + tags. Mines working title formulas and tag conventions from top-classified cards. |
| `yt-thumbnail` | Thumbnail concept: text (3–5 words), composition, colour, emotion. Reads top-card titles for tone coherence. |
| `yt-promo` | On-channel lead generation: pinned comments, end-screens, in-video and in-description CTAs, funnel into the business-card site. |

## Agents

| Agent | Purpose |
|---|---|
| `yt-strategist` | Weekly strategic top-5 idea shortlist. Read-only consumer of the vault — reads `база\` + the 2 most recent `конкуренты\` reports, scores candidates on evidence / lead-gen potential / execution cost, returns 5 prioritised ideas with file-traceable rationale. Designed for a Monday-morning `/schedule` run. |

## Knowledge base auto-enrichment

Six skills (`yt-ideas`, `yt-seo`, `yt-thumbnail`, `yt-script`, `yt-my-channel`, `yt-content-plan`) auto-read the channel knowledge base at the start of every run. Procedure is centralised in `references/knowledge-base-context.md`. If the base is absent, every skill falls back to its cold-start behaviour without failing.

**Bootstrapping order on a fresh machine:**

1. Run `yt-knowledge-base` once — collects every video on the channel into `база\`.
2. Run `yt-competitors` on 1–3 key competitors — populates `конкуренты\`.
3. Run any generator skill or the `yt-strategist` agent — they now have rich context.

Refresh `yt-knowledge-base` weekly (or when stats matter). Other skills read the latest snapshot.

## MCP server

Bundled MCP server: [`icraft2170/youtube-data-mcp-server`](https://github.com/icraft2170/youtube-data-mcp-server) — installed automatically via `npx -y youtube-data-mcp-server` when the plugin starts.

### Required environment variable

```
YOUTUBE_API_KEY=<your YouTube Data API v3 key>
```

Get a key at <https://console.cloud.google.com/> → enable **YouTube Data API v3** → create credentials → API key. Set the env var globally or in `~/.claude/settings.json` under `env`.

### Available MCP tools

After the plugin is enabled and `YOUTUBE_API_KEY` is set, these MCP tools become available to skills:

- `getVideoDetails` — video metadata + statistics (views, likes, comments)
- `searchVideos` — search videos by query
- `getTranscripts` — captions in `ru` by default
- `getRelatedVideos` — recommendations
- `getChannelStatistics` — subscribers, total views, video count
- `getChannelTopVideos` — most viewed videos of a channel
- `getVideoEngagementRatio` — engagement metrics
- `getTrendingVideos` — popular videos by region/category
- `compareVideos` — cross-video stats comparison

### Limitations

- No OAuth: CTR and audience-retention for your own channel are not available via the API key alone. Paste those values into the chat from YouTube Studio when invoking `yt-my-channel`.
- No comments fetching.

## Vault layout

Skills write Markdown to `C:\projects\Claude\youtube\`. Folders (one per tool, Cyrillic, lowercase):

```
C:\projects\Claude\youtube\
├── канал\           # yt-my-channel reports (dated)
├── конкуренты\      # yt-competitors reports
├── идеи\            # yt-ideas batches + yt-strategist shortlists
├── контент-план\    # yt-content-plan calendars
├── сценарии\        # yt-script — one file per video
├── seo\             # yt-seo — one file per video
├── превью\          # yt-thumbnail — one file per video
├── продвижение\     # yt-promo
└── база\            # yt-knowledge-base (the persistent dataset)
    ├── канал.md          # channel-wide stats + medians (overwritten each refresh)
    ├── индекс.md         # one-row-per-video index (overwritten each refresh)
    └── видео\<slug>.md   # one card per video: metadata + transcript + classification
```

Per-video artefacts (`сценарии/<slug>`, `seo/<slug>`, `превью/<slug>`, `база/видео/<slug>`) share the same Cyrillic kebab-case slug so they form a cross-folder bundle per video.

See `references/vault.md` for full folder, filename, and frontmatter conventions.

## Lead-generation placeholder

The business-card site is not live yet. Skills use the `{{SITE_URL}}` placeholder in CTAs and a soft fallback ("контакты для заказа разработки в закреплённом комментарии"). When the site goes live, replace `{{SITE_URL}}` in these reference files:

- `skills/yt-script/references/cta.md`
- `skills/yt-seo/references/description-template.md`
- `skills/yt-promo/references/on-channel.md`
- `skills/yt-promo/references/funnel.md`
- `skills/yt-ideas/references/niche-context.md`

## Channel context

Skills auto-detect channel context from the conversation. Once the knowledge base is built, the channel handle and stats come from `база\канал.md` automatically. On a fresh session before the KB exists, paste a short context block:

```
Channel: @my-handle
Niche: vibe coding, AI-assisted development
Flagship series: Логос (Jarvis-like AI assistant), CRM for auto-services
Lead-gen target: orders for app development, site = not yet live
```
