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

Produce 4–8 queries. Aim for variety across:

- Tool-anchored (e.g., "vibe coding cursor", "claude code разработка")
- Outcome-anchored (e.g., "сделал приложение за день с ai", "ai разработка стартап")
- Series-anchored (e.g., "ai ассистент jarvis на python", "логос ассистент")
- Process-anchored (e.g., "как кодить с ии", "vibe coding workflow")

Mix Russian and the occasional English term — the IT/AI niche on Russian YouTube uses both.

## Quality rules

- 4–8 queries, no fewer (too narrow) and no more (quota waste).
- At least one query must be brand/series-specific to the user's channel.
- Each query should plausibly return ≥ 5 videos from channels not run by the user.
- If two queries differ by only a stop-word, merge them.

## Logging

In the final report (section 1 "Niche query"), list every query used and the count of channel candidates it produced. This makes the analysis reproducible.
