# Analysis framework — yt-competitors

Applies to both SINGLE and BATCH modes.

## Hook formulas

A hook formula is a reusable title template. Extract them by:

1. Looking at the top 10 videos (single) or top 15–20 across niche (batch).
2. Replace specifics with placeholders: tool names → `<tool>`, durations → `<time>`, outcomes → `<thing>`.
3. Keep formulas that match ≥ 3 titles. Single-occurrence patterns are not a formula.

Common formulas in IT/vibe-coding niche to look for (do not pre-fill — extract from data):

- "Я сделал <X> за <Y> с помощью <tool>"
- "<Tool> vs <Tool>: <verdict>"
- "Почему я больше не использую <tool>"
- "Как <task> с <tool> за <time>"
- "<Number> вещей которые <tool> не умеет"

## Periodicity

For each channel:

- Posts/week over the last 12 weeks.
- Largest gap (in days) between uploads.
- Trend (accelerating, stable, slowing) — compare last 4 weeks vs prior 8.

In BATCH report, plot the distribution of "posts/week" across analysed channels. This grounds the user's 1-video/week cadence in the niche reality.

## Length and format link

For each channel, classify each top video roughly:

- **Tutorial / how-to** (often 6–15 min)
- **Build-along / project** (10–25 min)
- **Tool review / comparison** (8–15 min)
- **Opinion / essay** (5–12 min)
- **Live coding / vlog** (15+ min)
- **Shorts** (< 60 sec) — note presence but do not analyse, since the user does not produce Shorts

Look for the format-length link: e.g., niche tutorials concentrate at 8–12 min while the same channels' projects push 18–25 min.

## Topic clusters

In BATCH mode, propose clusters bottom-up from the data. Do not force pre-defined buckets unless the data fits. Typical clusters in IT/vibe-coding 2024–2026:

- Tool reviews and comparisons
- "I built X with AI" case studies
- Workflow / prompt engineering for code
- Building AI assistants (Jarvis-like) and agents
- Building business apps (CRMs, dashboards) with AI
- Beginner onboarding to AI-coding tools
- Critique / "AI coding does not work because..."

For each cluster, compute view share and engagement.

## Gap analysis

A gap is a topic with **low supply** but **demand evidence**. Do not call something a gap because it is missing — that may just mean nobody wants it.

Demand evidence sources:

- An outlier video on a "cluster of one" — single video did 10× the cluster median.
- High comment-to-view ratio asking follow-up questions on a topic.
- Recurring side-mentions in popular videos that no creator made into its own video.
- Tool launched < 6 months ago with rising trending mentions but few full videos yet.

Without evidence, mark as "not a gap, just empty space — could mean low demand".

## Output discipline

- Always quote titles verbatim. Translation is lossy.
- Always cite at least one specific video as evidence for each hypothesis.
- Numbers exact.
- If MCP returned partial data (e.g., quota hit), say so in the report rather than fabricating.
