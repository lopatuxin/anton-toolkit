# Reading the channel knowledge base

Several skills enrich their output by reading the persistent knowledge base produced by `yt-knowledge-base`. This reference describes WHEN to read it, WHAT to read, and HOW to degrade gracefully when it is absent.

## When to read

Always check at the start of the skill, BEFORE asking the user any clarifying questions. If the base is present, it eliminates most of the questions a cold-start skill would otherwise need to ask.

## Where the base lives

```
C:\projects\Claude\youtube\база\
├── канал.md            # channel-level stats + medians + classification counts
├── индекс.md           # one-row-per-video index (slug, title, published, views, vpd, classification)
└── видео\<slug>.md     # full card: metadata + description + tags + metrics + transcript
```

## Read procedure

1. **Check existence**. Test whether `C:\projects\Claude\youtube\база\канал.md` exists.
   - Does not exist → set `kb_available: false`, continue with the skill's normal cold-start flow. Optionally tell the user once in Russian: "Базы знаний канала нет — работаю без неё. Хочешь собрать её? Запусти `yt-knowledge-base`."
   - Exists → set `kb_available: true`, proceed.

2. **Read `канал.md`** (always, if available). It gives subscriber count, total views, VPD median, engagement median, classification counts. Use this as the channel snapshot — do NOT re-call `getChannelStatistics` if `last_updated` is within 14 days.

3. **Read `индекс.md`** (always, if available). It is the lookup table over the whole channel. Filter rows by `classification` column to find `top` / `fail` videos.

4. **Read selected `видео\<slug>.md` files** based on the skill's need (see per-skill section below). Read full cards — they contain description and transcript, both of which are the actual signal for generation.

5. **Freshness check.** If `канал.md` `last_updated` is older than 30 days, emit one Russian warning: "Базе знаний канала больше 30 дней. Запусти `yt-knowledge-base` для обновления, если важна свежесть." Continue using it anyway — stale is better than nothing.

## What each consuming skill reads

| Skill | Reads | Why |
|---|---|---|
| `yt-ideas` | `индекс.md` + top 5 `top` cards (full, with transcript) + top 3 `fail` cards (frontmatter only — title, classification_reason) | Learn what topics and hook patterns worked; avoid the patterns that flopped |
| `yt-seo` | top 10 `top` cards (frontmatter + description) | Mine the channel's working title formulas, tag conventions, description structure |
| `yt-thumbnail` | top 10 `top` cards (frontmatter only — title) | Mine the title style that pairs with thumbnails the channel already validated |
| `yt-script` | top 3 `top` cards (full, with transcript) | Match the user's actual speaking voice, sentence rhythm, callback phrases |
| `yt-my-channel` | `канал.md` + full `индекс.md` | Skip re-fetching channel stats; use base classifications instead of recomputing |
| `yt-content-plan` | full `индекс.md` (titles + published dates) | Space topics so the calendar doesn't repeat what was published recently |

"top N cards" = sort `индекс.md` rows where `classification == top` by `vpd` descending, take first N.

## Output rules for the consuming skill

- If `kb_available: true`, mention it ONCE in chat (Russian, one short sentence) so the user knows the answer is informed by the base. Example: "Учёл базу знаний: 23 видео, 5 в топе." Do NOT dump the data into chat.
- If `kb_available: false`, do NOT mention the base except in the optional offer above. The skill must still work end-to-end without it.
- Never claim the base says something it doesn't. Only cite facts you actually read from the files.

## Boundaries

- This reference is READ-ONLY guidance. Do NOT modify, append to, or delete files under `база\` from a consuming skill. Only `yt-knowledge-base` writes there.
- Do NOT call YouTube MCP tools to "fill gaps" in the base — that defeats the point of caching. If data is missing, ask the user to refresh the base.
