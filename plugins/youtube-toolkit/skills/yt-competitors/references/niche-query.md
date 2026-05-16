# Niche-query construction — BATCH mode

Build search queries from the user's own channel context. No fixed keyword list, no guessing.

## Inputs available

For the user's channel:
- Channel name / description (via `getChannelStatistics`)
- Top 5 videos: titles, tags, descriptions (via `getChannelTopVideos` + `getVideoDetails`)

If no `yt-my-channel` report is in the conversation, pull this minimal data first.

## Extraction procedure

1. **Title n-grams.** From the 5 titles, extract 2- and 3-word sequences. Drop stop-words ("как", "что", "и", "the", numbers, separators). Keep n-grams that appear ≥ 2 times across titles, plus all named tools/series (Cursor, Claude Code, Logos / Логос, CRM, Jarvis, etc.) even if they appear once.

2. **Tag intersection.** Collect all tags from the 5 videos. Keep tags that appear ≥ 2 times.

3. **Description nouns.** Read each description. Extract named entities: tool names, framework names, named series, recurring themes.

4. **Channel name + niche descriptor.** Use the channel name itself as one query (people searching for the brand land on similar channels via "Related").

## Query construction

Produce **8–15 queries** (the previous 4–8 range systematically under-covered the niche and missed obvious competitors). Required coverage:

- ≥ 2 tool-anchored (e.g., "vibe coding cursor", "claude code разработка", "cline ai", "windsurf ide", "v0 vercel")
- ≥ 2 outcome-anchored (e.g., "сделал приложение за день с ai", "ai разработка стартап", "запустил mvp за неделю")
- ≥ 2 process-anchored (e.g., "как кодить с ии", "vibe coding workflow", "ai-ассистент для кода")
- ≥ 1 series/brand-anchored — specific to the user's channel (e.g., "логос ассистент", "ai ассистент jarvis на python")
- ≥ 1 generic Russian IT-YouTube ("программирование канал", "айти блогер", "разработчик ютуб")

Mix Russian and English terms — the IT/AI niche on Russian YouTube uses both.

## Quality rules

- 8–15 queries. Fewer than 8 is a configuration error — re-derive until at least 8.
- At least one query must be brand/series-specific to the user's channel.
- Each query should plausibly return ≥ 5 videos from channels not run by the user.
- If two queries differ by only a stop-word, merge them — but count the merge against the 8-minimum and add a replacement query.
- After running the queries (in BATCH-mode step 4), if the deduped candidate pool is smaller than 25 distinct channels, the query set is too narrow — add 2–4 adjacent-angle queries and re-run before reporting.

## Logging

In the final report (section 1 "Niche query"), list every query used and the count of channel candidates it produced. This makes the analysis reproducible.
