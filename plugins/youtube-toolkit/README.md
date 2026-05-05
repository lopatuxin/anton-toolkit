# youtube-toolkit

Skills for running a Russian-language IT / vibe-coding YouTube channel. Each skill is narrow and specialised.

## Skills

| Skill | Purpose |
|---|---|
| `yt-my-channel` | Analyse your own channel (public metrics via YouTube Data API + optional Studio paste for CTR/retention) |
| `yt-competitors` | Deep analysis of competitor channels — single channel or batch niche scan. Batch query is built from your own channel context, not a fixed keyword list |
| `yt-ideas` | Generate video ideas. Strictly requires output from `yt-my-channel` or `yt-competitors` as input |
| `yt-content-plan` | Build a publication calendar at 1 video / week, no Shorts, balancing flagship / tutorial / lead-gen videos |
| `yt-script` | Write a full video script up to 20 min: hook, structure, CTA placement |
| `yt-seo` | Title (A/B variants) + description with timestamps + tags. Thumbnail handled separately |
| `yt-thumbnail` | Thumbnail concept: text (3-5 words), composition, colour, emotion |
| `yt-promo` | On-channel lead generation: pinned comments, end-screens, in-video and in-description CTAs, funnel into the business-card site |

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

## Lead-generation placeholder

The business-card site is not live yet. Skills use the `{{SITE_URL}}` placeholder in CTAs and a soft fallback ("контакты для заказа разработки в закреплённом комментарии"). When the site goes live, replace `{{SITE_URL}}` in these reference files (SKILL.md files only mention the placeholder as documentation and follow once references update):

- `skills/yt-script/references/cta.md`
- `skills/yt-seo/references/description-template.md`
- `skills/yt-promo/references/on-channel.md`
- `skills/yt-promo/references/funnel.md`
- `skills/yt-ideas/references/niche-context.md`

## Channel context

Skills auto-detect channel context from the conversation. The first time a skill needs your channel handle, name, or flagship-series list, it will ask. To avoid repetitive questions, paste a short context block at the start of a session, e.g.:

```
Channel: @my-handle
Niche: vibe coding, AI-assisted development
Flagship series: Логос (Jarvis-like AI assistant), CRM for auto-services
Lead-gen target: orders for app development, site = not yet live
```
