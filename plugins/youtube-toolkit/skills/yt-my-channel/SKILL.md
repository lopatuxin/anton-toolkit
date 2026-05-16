---
name: yt-my-channel
description: >
  IMPORTANT: Invoke this skill via the Skill tool IMMEDIATELY when the user
  asks to analyse THEIR OWN YouTube channel — top videos, what works, what
  does not, current performance. Do NOT skip — this skill contains the report
  template, metric-interpretation rules, and the procedure for parsing pasted
  YouTube Studio data in references/.

  Trigger phrases (Russian): "проанализируй мой канал", "аналитика моего
  канала", "анализ моего канала", "разбор моего канала", "что работает на
  моём канале", "топ видео на моём канале", "какие у меня лучшие видео",
  "статистика канала", "метрики моего канала", "посмотри мой канал",
  "оцени мой канал".

  Do NOT use this skill for competitor analysis — that is yt-competitors.
---

# yt-my-channel — own-channel analytics

Produce a structured analytical report on the user's own YouTube channel using public metrics from the bundled MCP server, plus optional pasted YouTube Studio data for CTR and audience retention.

## Procedure

1. **Get the channel handle.** If not already in the conversation, ask once: "Какой handle или ID вашего канала?" Accept `@handle`, channel URL, or channel ID.

2. **Pull public metrics via MCP.** Call in this order:
   - `getChannelStatistics` — subscribers, total views, video count, creation date.
   - `getChannelTopVideos` — top videos by views (request 10–20).
   - For each top video, `getVideoDetails` — duration, publish date, tags, description.
   - `getVideoEngagementRatio` on the same set — likes/views and comments/views ratios.

3. **Ask for Studio paste (optional, once).** Ask: "Если хочешь чтобы я учёл CTR и удержание — скопируй из YouTube Studio таблицу 'Контент' за последние 28/90 дней (вьюхи + CTR + средний просмотр) и вставь сюда. Если не сейчас — пропустим, разберём по публичным метрикам."

   If the user pastes Studio data, parse it using `references/studio-paste.md`.

4. **Build the report.** Use the template in `references/report-template.md`. Sections:
   - Snapshot (current state)
   - Top performers (and why they performed)
   - Underperformers (and likely cause)
   - Patterns (length, posting cadence, topic clusters, hook formulas reused)
   - Hypotheses ("what works / what does not")
   - Recommendations (3–5 concrete next moves)

5. **Save the report inline in chat** so downstream skills (`yt-ideas`, `yt-content-plan`) can consume it from conversation context.

6. **Persist the report to the Obsidian vault.** Follow `${CLAUDE_PLUGIN_ROOT}/references/vault.md`. Target folder: `C:\projects\Claude\youtube\канал\`. Filename: `YYYY-MM-DD-обзор-канала.md` (Russian, Cyrillic, kebab-case — see `${CLAUDE_PLUGIN_ROOT}/references/vault.md` for the filename rules) (use the current session date; if a snapshot for today already exists, append `-v2`, `-v3`…). Frontmatter:

   ```yaml
   ---
   type: channel-analysis
   date: <YYYY-MM-DD>
   channel_handle: "<@handle or channel ID>"
   subscribers: <number>
   total_views: <number>
   video_count: <number>
   studio_data_included: <true|false>
   tags:
     - youtube/channel-analysis
   related: []
   ---
   ```

   Body: the full report (Snapshot, Top performers, Underperformers, Patterns, Hypotheses, Recommendations) — same content as the chat output, not a summary.

   After writing, tell the user in Russian where the file landed.

## Interpretation rules

Apply the rules in `references/metrics.md`:
- Engagement ratio targets for IT/dev niche
- How to read views skew across videos of different ages
- When a video is "topical" vs "evergreen"
- Red flags (sharp retention drops, like-to-view collapse)

## Inputs and outputs

- **Input:** channel handle/URL/ID; optional pasted YouTube Studio CSV/text.
- **Output:** Markdown report with the sections above. Keep numbers exact, hypotheses labelled as such.

## Boundaries

- Do not generate video ideas here — that is `yt-ideas`.
- Do not analyse competitors here — that is `yt-competitors`.
- Do not invent metrics that the API key cannot return (CTR, audience retention) — only report them if the user pasted Studio data.
