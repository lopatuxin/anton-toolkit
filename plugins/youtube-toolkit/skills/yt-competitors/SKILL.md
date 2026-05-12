---
name: yt-competitors
description: >
  IMPORTANT: Invoke this skill via the Skill tool IMMEDIATELY when the user
  asks to analyse competitor channels, scan a niche, find what works in the
  niche, compare with competitors, or look at niche trends. Do NOT skip —
  this skill contains the analysis framework, single-channel and batch
  templates, and the niche-query construction procedure in references/.

  Trigger phrases (Russian): "проанализируй конкурента", "разбор конкурента",
  "анализ конкурентов", "анализ ниши", "что делают конкуренты", "сравни с
  конкурентами", "тренды в нише", "топ каналы в нише", "разбери канал X",
  "посмотри конкурентов", "посмотри что у других", "что заходит в нише",
  "какие темы заходят".

  Two modes: SINGLE (one competitor — deep dive) and BATCH (niche scan
  across channels above a subscriber threshold). Do NOT analyse the user's
  own channel here — that is yt-my-channel.
---

# yt-competitors — competitor and niche analysis

Analyse one competitor (deep dive) or scan a niche (batch). In batch mode the search query is built from the user's own channel context, not from a fixed keyword list.

## Mode selection

Pick the mode from how the user framed the request:

- **SINGLE** — user named one channel ("разбери канал @X", "проанализируй <ссылка>"). Use `references/single-mode.md`.
- **BATCH** — user said "ниша", "конкуренты" (plural), "тренды", "топ каналы". Use `references/batch-mode.md`.

If unclear, ask once: "Один канал глубоко или сводный анализ ниши?"

## SINGLE — one channel deep dive

1. Resolve the channel handle/URL → channel ID. The bundled MCP does not expose a dedicated channel-search tool. Use the workaround:
   - If the user gave a channel ID (`UCxxxxxx…`), use it directly.
   - Otherwise call `searchVideos` with the handle/name as the query and read the channel ID from the first relevant result. Confirm with the user before proceeding if the match is ambiguous.
2. `getChannelStatistics` — subs, total views, video count, creation date.
3. `getChannelTopVideos` (request 15–25).
4. For the top 10, `getVideoDetails` — title, duration, publish date, tags, description.
5. `getVideoEngagementRatio` on the same set.
6. Inspect last 10 uploads (not just top) to see current direction.
7. Build the report using `references/single-mode.md`.

## BATCH — niche scan

In batch mode, do NOT ask the user for a keyword list. Build the niche query from the user's own channel context (this is the explicit user requirement).

1. **Get user's own channel context.** Either reuse a recent `yt-my-channel` report from the conversation, or pull minimal data on the user's channel:
   - `getChannelStatistics` for the user's channel (ask handle if unknown).
   - `getChannelTopVideos` (top 5).
   - Read each top video's title, tags, and description.
2. **Construct niche queries** using the procedure in `references/niche-query.md`:
   - Extract recurring nouns/phrases from titles (n-grams).
   - Add tags that appear ≥ 2 times across the top set.
   - Mine description for named tools/series ("Cursor", "Claude Code", "Логос", "vibe coding", etc.).
   - Produce 4–8 search queries that together cover the niche.
3. **Find candidate channels.** For each query, `searchVideos` (max ~20 results), collect channel IDs.
4. **Filter by subscriber threshold.** Default minimum **10 000 subscribers**. Use `getChannelStatistics` per candidate. Drop the user's own channel.
5. **Deduplicate and rank.** Dedupe by channel ID. Rank by total channel views in the last year (proxy: top videos publish date × view counts).
6. **Pull data on top 10–15 channels.** For each: stats, top 10 videos, engagement ratios.
7. **Build the niche report** using `references/batch-mode.md`.

## Analysis framework

Apply the framework in `references/analysis-framework.md`:
- Hook formulas (extract reusable patterns from titles)
- Periodicity (uploads per month, gap distribution)
- Length distribution and the format–length link
- Topic clusters in the niche
- Gap analysis ("what nobody is making yet")

## Inputs and outputs

- **Input — SINGLE:** channel handle/URL/ID.
- **Input — BATCH:** the user's own channel handle (used to build the niche query). Optionally, a custom subscriber threshold (default 10 000).
- **Output:** Markdown report. Numbers exact, hypotheses labelled.

## Save to vault

After producing the report in chat, persist it to the Obsidian vault following `${CLAUDE_PLUGIN_ROOT}/references/vault.md`.

- Target folder: `C:\projects\Claude\youtube\10-competitors\`.
- Filename:
  - SINGLE mode → `YYYY-MM-DD-channel-<handle-slug>-deep-dive.md` (slugify the competitor handle, ASCII, kebab-case).
  - BATCH mode → `YYYY-MM-DD-niche-batch-scan.md`.
  - Use the current session date. If the file exists, append `-v2`, `-v3`…
- Frontmatter:

  ```yaml
  ---
  type: competitor-analysis
  mode: single | batch
  date: <YYYY-MM-DD>
  competitor_handle: "<@handle>"        # SINGLE only
  competitor_subs: <number>             # SINGLE only
  niche_queries:                        # BATCH only
    - "<query 1>"
    - "<query 2>"
  channels_scanned: <N>                 # BATCH only
  min_subs_threshold: <N>               # BATCH only
  tags:
    - youtube/competitor-analysis
    - youtube/mode/<single|batch>
  related: []                           # add wiki-links to any yt-my-channel report used as context
  ---
  ```

- Body: the full report — same content as the chat output, not a summary.
- After writing, tell the user in Russian where the file landed.

## Boundaries

- Do not generate ideas here — that is `yt-ideas`. The competitor report is the *input* to ideas.
- Do not analyse the user's own channel as the subject — that is `yt-my-channel`. The user's channel is only used here as *context for the niche query*.
- Stay within publicly available data. No CTR or retention for competitors — those are not exposed.
