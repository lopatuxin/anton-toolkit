---
name: yt-ideas
description: >
  IMPORTANT: Invoke this skill via the Skill tool IMMEDIATELY when the user
  asks for video ideas, topics, what to film next, or content brainstorm.
  Do NOT skip — this skill contains the generation rules and niche context
  in references/.

  HARD REQUIREMENT: this skill REFUSES to generate ideas without analytical
  input. It needs either a yt-my-channel report OR a yt-competitors report
  in the conversation (or pasted by the user). If neither is present, the
  skill MUST tell the user to run yt-my-channel or yt-competitors first.

  Trigger phrases (Russian): "идеи для роликов", "идеи для видео", "придумай
  идеи", "о чём снять", "темы для видео", "что снять следующим", "какое
  видео снять", "предложи темы", "идеи контента".
---

# yt-ideas — generate ideas grounded in analytics

Produce 10–20 video ideas tailored to the user's IT/vibe-coding channel. Every idea must trace back to a specific finding from a yt-my-channel or yt-competitors report. No analytics → no ideas.

## Hard precondition

Before generating anything, scan the conversation for:

- A `yt-my-channel` report (sections: Snapshot, Top performers, Patterns, Hypotheses, Recommendations).
- A `yt-competitors` report (sections: top videos / clusters / gaps / hypotheses).

If **neither** is present, respond:

> "Чтобы идеи были на основе данных, нужен отчёт от yt-my-channel или yt-competitors. Запусти один из них и вернись — я подключусь к их выводам."

Stop. Do not generate ideas. Do not improvise.

If at least one is present, proceed.

## Procedure

1. **Read the analytical input.** Pull out:
   - From `yt-my-channel`: top-performer hypotheses, underperformer causes, recommended next moves, hypotheses about what works.
   - From `yt-competitors`: niche gaps, top-performing hooks/formats, hypotheses for our channel (section 10).

2. **Apply generation rules** from `references/generation-rules.md`:
   - Gap-fill (take niche gaps directly)
   - Series continuation (extend the user's flagship series — Logos, CRM, etc.)
   - Format-shift (take a user's top topic, repackage in a niche-favoured length/format)
   - Trend-ride (take a niche-rising tool/topic, apply user's angle)
   - Lead-gen anchor (case study showing the user can deliver — orders for app development is the channel goal)

3. **Apply niche context** from `references/niche-context.md`:
   - Vibe-coding / AI-assisted dev focus
   - Flagship series Logos and CRM are first-class
   - Russian-speaking IT audience
   - Lead-gen target: clients ordering app development

4. **Produce 10–20 ideas.** Use the schema below for each idea.

## Idea schema

```markdown
### Idea N — <short working title in Russian>

- **Hook (first 15 sec):** <one line, the actual opening line of the video>
- **Type:** <flagship-series episode | tutorial | case study | tool review | lead-gen demo>
- **Series:** <Logos / CRM / standalone>
- **Target audience:** <one sentence — who watches this>
- **Why this idea (evidence):** <reference the exact section of the analytical input — e.g., "yt-competitors §8 gap: 'AI agent for invoicing — 0 dedicated videos in niche'" or "yt-my-channel §3: tutorial format underperforms when > 12 min, this idea is 8 min">
- **Lead-gen angle:** <how the video naturally leads to "хочу такое же — закажу" — or "no lead-gen, pure top-funnel">
- **Format:** <talking head / build-along / screen-cast / mixed>
- **Estimated length:** <minutes, ≤ 20>
```

## Output structure

```markdown
# Video ideas — based on <yt-my-channel @date | yt-competitors @date | both>

## Inputs used
- <list which reports/sections fed each idea cluster>

## Ideas
<10–20 ideas in the schema above>

## Priority shortlist
3 ideas to film first, with one-sentence rationale per idea.
```

## Save to vault

After producing the ideas in chat, persist them to the Obsidian vault following `${CLAUDE_PLUGIN_ROOT}/references/vault.md`.

- Target folder: `C:\projects\Claude\youtube\20-ideas\`.
- Filename: `YYYY-MM-DD-ideas-batch.md` (current session date). If a batch for today already exists, append `-v2`, `-v3`…
- Frontmatter:

  ```yaml
  ---
  type: idea-batch
  date: <YYYY-MM-DD>
  idea_count: <N>
  sources:
    - yt-my-channel | yt-competitors | both
  tags:
    - youtube/idea-batch
  related:
    - "[[00-channel/<channel-file>]]"     # if a yt-my-channel report was used
    - "[[10-competitors/<competitor-file>]]" # if a yt-competitors report was used
  ---
  ```

  Populate `related` only with files that actually exist in the vault. If the inputs were pasted inline in the conversation rather than read from vault files, leave `related: []` and note the inline source in the body's "Inputs used" section.

- Body: the full ideas batch (Inputs used, Ideas in schema, Priority shortlist) — same content as the chat output.
- After writing, tell the user in Russian where the file landed.

## Boundaries

- Do not make up data. If an idea has no evidence from the inputs, drop it.
- Do not produce more than 20 ideas — quantity dilutes quality.
- Do not write the script here — that is `yt-script`.
- Do not plan the calendar here — that is `yt-content-plan`.
- Mix idea types: at minimum 2 flagship-series, 2 lead-gen, the rest split across tutorial/case/tool-review.
