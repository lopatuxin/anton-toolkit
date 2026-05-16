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

In batch mode, build the niche query from the user's own channel context (this is the explicit user requirement). Do NOT ask the user for a keyword list — but DO ask them for known-competitor seeds, because the user almost always knows channels the auto-extraction would miss.

1. **Ask the user for known-competitor seeds.** One short message in Russian, before any API call:
   > Подкинь 3–7 каналов, которых ты сам считаешь конкурентами (handle, ссылка или просто название) — включу их в анализ без фильтра и расширю поиск через их похожие видео. Если не назовёшь — соберу нишу только автоматически по твоему каналу, но скорее всего часть очевидных конкурентов пропущу.

   Wait for the answer. Treat the seed list as **included unconditionally** in the final analysis — they bypass the subscriber threshold and ranking cut-off. If the user replies "никого не назову" or similar — proceed without seeds and warn in the report's section 1 that the result may miss obvious competitors.

2. **Get user's own channel context.** Either reuse a recent `yt-my-channel` report from the conversation, or pull minimal data on the user's channel:
   - `getChannelStatistics` for the user's channel (ask handle if unknown).
   - `getChannelTopVideos` (top 5–10).
   - Read each top video's title, tags, and description.

3. **Construct niche queries** using the procedure in `references/niche-query.md`. Produce **8–15 queries** (was 4–8 — widened because the previous range systematically under-covered the niche). Coverage requirements:
   - At least 2 tool-anchored queries (Cursor, Claude Code, Cline, Windsurf, v0, …).
   - At least 2 outcome-anchored queries ("сделал приложение за", "запустил стартап за", "сэкономил время с ai").
   - At least 2 process/workflow queries ("vibe coding", "ai-разработка", "ai-ассистент для кода").
   - At least 1 brand/series query specific to the user's channel.
   - At least 1 "Russian IT YouTube" generic query ("программирование канал", "айти блогер", "разработчик ютуб").
   - Mix Russian and English terms — the IT/AI niche on Russian YouTube uses both.

4. **Find candidate channels.** For each query, `searchVideos` with `maxResults` **at least 25** (was ~20) — collect channel IDs from every result, not just the top few.

5. **Expand from seeds and top candidates via related videos.** For each seed channel and each top-3 candidate from step 4, take 2–3 of their highest-view videos and call `getRelatedVideos` on each. Collect the channel IDs of the related videos. This is the step that surfaces competitors the keyword search misses — adjacent channels YouTube itself associates with the seeds.

6. **Filter by subscriber threshold.** Default minimum **10 000 subscribers**, applied only to non-seed channels. Use `getChannelStatistics` per candidate. Drop the user's own channel. Seed channels from step 1 bypass this filter unconditionally.

7. **Deduplicate, log, and rank.** Dedupe by channel ID. Log the full deduped candidate list (channel + subs) in the report's section 1 — even ones below the threshold — so the user can spot omissions. Rank survivors by total channel views in the last year (proxy: top videos publish date × view counts). Seeds always appear in the final ranked list regardless of view rank.

8. **Pull data on top 15–25 channels** (was 10–15 — widened). For each: stats, top 10 videos, engagement ratios. Always include all seeds in this set.

9. **Sanity check coverage before writing the report.** If the deduped candidate pool from steps 4–5 contains fewer than 25 distinct channels, the scan is too narrow — add 2–4 more queries from neighbouring angles and re-run search before producing the report.

10. **Build the niche report** using `references/batch-mode.md`.

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

- Target folder: `C:\projects\Claude\youtube\конкуренты\`.
- Filename (Russian, Cyrillic, kebab-case — see `${CLAUDE_PLUGIN_ROOT}/references/vault.md` for the rules):
  - SINGLE mode → `YYYY-MM-DD-канал-<handle>.md`. The `<handle>` token is the competitor's `@handle` without the `@` — leave it as-is (Latin handles stay Latin, Cyrillic handles stay Cyrillic); do not transliterate. Example: `2026-05-13-канал-yandexedu.md`, `2026-05-13-канал-логос.md`.
  - BATCH mode → `YYYY-MM-DD-разбор-ниши.md`.
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
