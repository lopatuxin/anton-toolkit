---
name: yt-promo
description: >
  IMPORTANT: Invoke this skill via the Skill tool IMMEDIATELY when the user
  asks about promotion strategy, channel growth, lead generation, attracting
  orders, conversion, pinned comments, end-screens, or how to monetise the
  channel commercially. Do NOT skip — this skill contains the on-channel
  lead-gen patterns and funnel design in references/.

  Trigger phrases (Russian): "продвижение канала", "как раскрутить канал",
  "лидген на канале", "лиды с ютуба", "стратегия роста канала", "привлечь
  заказы", "как продавать через канал", "конверсия в заказы", "закреп под
  видео", "что писать в pinned комментарий", "end screen для видео",
  "конечная заставка", "воронка с ютуба".

  This skill covers ON-CHANNEL lead generation only: pinned comments,
  end-screens, in-video and in-description CTAs, funnel into the
  business-card site. It does NOT cover cross-promo posts on other
  platforms (Telegram, Habr, etc.) — those are out of scope.
---

# yt-promo — on-channel lead generation

Design and refine the on-channel lead-gen system: pinned comments, end-screens, video and description CTAs, and the funnel from view → contact → order. The site is currently a `{{SITE_URL}}` placeholder; designs must work both before and after the site is live.

## Procedure

1. **Get the goal type.** What does the user want?
   - **Audit** — review current pinned/end-screen/CTA setup, find weak links.
   - **Pinned comment** — write the pinned comment for one specific video.
   - **End-screen plan** — design the last 20 seconds of one specific video.
   - **Funnel design** — plan the path from video → contact → first message → qualification.

   Match the request type to the relevant section below.

2. **Apply on-channel patterns** from `references/on-channel.md`:
   - Pinned comment patterns
   - End-screen elements (subscribe, related video, playlist)
   - In-video mid-roll CTA timing
   - In-description CTA placement

3. **Apply funnel rules** from `references/funnel.md`:
   - The single-destination rule (one CTA per video, one place to click)
   - Soft → medium → explicit ladder (let viewers self-select)
   - Pre-site mode (placeholder) vs post-site mode (real URL) handling
   - Qualification — what the first message from a lead should contain

4. **Output** in the format below, scoped to the request.

## Output formats

### Pinned comment

```markdown
# Pinned comment — <video title>

**Video type:** <flagship / tutorial / case / lead-gen>
**CTA mode:** <pre-site / post-site>

---

<Russian text of the pinned comment, 60–200 chars>

---

**Why this works:** <one sentence>
**Variation for next videos:** <how to adapt the template, not duplicate>
```

### End-screen plan

```markdown
# End-screen — <video title>

**Last 20 seconds — voice-over text:**
<spoken text, 30–50 words>

**End-screen elements (last 20 sec, YouTube end-screen UI):**
- Subscribe button — bottom-left
- Related video — center: <which video and why>
- Playlist (if flagship series) — bottom-right: <which playlist>

**Voice-over hook to next video:** <one sentence>
**No engagement-bait stacking:** confirmed
```

### Funnel design

```markdown
# Funnel — view → contact → order

## Stage 1 — Awareness (view)
<patterns: how the video itself plants the lead-gen seed>

## Stage 2 — Interest (CTA delivery)
<where and how the CTA appears: video, description, pinned>

## Stage 3 — Contact (first reach-out)
<where they go: pre-site = pinned comment + Telegram/email; post-site = {{SITE_URL}}>

## Stage 4 — Qualification (first message back from user)
<what to ask the lead in the first reply, what to filter for>

## Stage 5 — Booking
<how to convert qualified interest into a paid project intake>

## Drop-off risks
<list 2–3 likely points where leads disappear, with mitigations>
```

### Audit

```markdown
# On-channel lead-gen audit

## Current state
<inventory: pinned comments, end-screens, description CTAs, video CTAs across last N videos>

## Strengths
<what is working>

## Weaknesses (ranked by impact)
1. <issue> — <fix>
2. <issue> — <fix>
…

## Quick wins (this week)
<3–5 changes that take < 1 hour each>

## Strategic moves (this month)
<2–3 changes that take more time>
```

## Save to vault

After producing the artefact in chat, persist it to the Obsidian vault following `${CLAUDE_PLUGIN_ROOT}/references/vault.md`.

- Target folder: `C:\projects\Claude\youtube\70-promo\`.
- Filename depends on the request type:
  - Audit → `YYYY-MM-DD-audit.md`
  - Pinned comment → `pinned-<video-slug>.md` (reuse the same slug as the video's script in `40-scripts/`)
  - End-screen plan → `endscreen-<video-slug>.md`
  - Funnel design → `YYYY-MM-DD-funnel.md`
  - If a file with the chosen name exists, append `-v2`, `-v3`…
- Frontmatter (set `type` based on request type — one of: `promo-audit`, `pinned-comment`, `end-screen`, `funnel`):

  ```yaml
  ---
  type: <promo-audit | pinned-comment | end-screen | funnel>
  date: <YYYY-MM-DD>
  video: "<working title>"           # only for pinned-comment / end-screen
  video_slug: <slug>                 # only for pinned-comment / end-screen
  cta_mode: pre-site | post-site
  tags:
    - youtube/promo
    - youtube/promo/<audit|pinned|endscreen|funnel>
  related:
    - "[[40-scripts/<slug>]]"        # only for per-video artefacts
  ---
  ```

- Body: the full artefact in the format above — same content as the chat output, not a summary.
- After writing, tell the user in Russian where the file landed.

## Boundaries

- Do NOT design cross-promo posts for Telegram, Habr, dev.to, X, LinkedIn, etc. The user excluded that. If the user explicitly asks for cross-promo, say: "Кросс-промо постов на других платформах в плагине нет — могу разобрать только on-channel часть."
- Do NOT promise growth numbers. The skill produces structure, not forecasts.
- Honour the single-destination rule. Resist the urge to list site + Telegram + email simultaneously — splitting attention drops conversion.
- Pre-site mode uses the soft fallback ("контакты в закреплённом комментарии"). When the site goes live, the user replaces `{{SITE_URL}}` and switches mode.
