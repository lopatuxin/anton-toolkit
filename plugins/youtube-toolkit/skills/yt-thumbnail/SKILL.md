---
name: yt-thumbnail
description: >
  IMPORTANT: Invoke this skill via the Skill tool IMMEDIATELY when the user
  asks for thumbnail concept, preview image idea, превью для видео, or
  thumbnail text. Do NOT skip — this skill contains thumbnail patterns and
  composition rules in references/.

  Trigger phrases (Russian): "превью для видео", "превью для ролика", "сделай
  превью", "идея превью", "обложка для видео", "thumbnail для видео",
  "thumbnail концепт", "что нарисовать на превью", "текст на превью",
  "композиция превью", "превью на ролик".

  This skill produces a CONCEPT (text + composition + colour + emotion), not
  the actual image. The user designs the image themselves or in a tool.
---

# yt-thumbnail — thumbnail concept

Produce a thumbnail concept: 3–5 word text overlay, composition layout, colour scheme, dominant emotion. Output is a brief the user takes to Figma / Photoshop / Canva.

## Procedure

1. **Get inputs.**
   - Working title and chosen formula (from `yt-seo`, if available).
   - Video type and series.
   - The "moment" the video is about — what visual could anchor the thumbnail (working code, IDE, face, screen, output).

   If unclear, ask once: "Какой момент в видео самый визуально яркий — экран IDE с кодом, ты с реакцией, готовый интерфейс приложения, что-то ещё?"

2. **Pick a pattern** from `references/patterns.md`. Patterns are channel-coherent layouts that work for IT content. Pick one that matches the title formula and content type.

3. **Generate the concept** following `references/composition.md`:
   - Text overlay: 3–5 words. Russian. High-contrast.
   - Composition: foreground / mid / background layers, with what goes where.
   - Colour scheme: 2–3 colours max, one dominant.
   - Dominant emotion: curiosity / triumph / frustration / surprise. Pick one.

4. **Produce 2–3 concept variants** so the user can A/B at the design stage. Each variant uses a different pattern or text angle.

5. **Output** the concept brief in the format below.

## Output format

```markdown
# Thumbnail concept — <working title>

## Variant 1 — <pattern name>

**Text overlay (3–5 words):** «<TEXT IN RUSSIAN>»
**Emotion:** <one word>
**Composition:**
- Foreground: <element + position — e.g., "лицо автора, левая треть, реакция удивления">
- Mid: <element>
- Background: <element + position — e.g., "размытый IDE с кодом">
**Colour scheme:** dominant <hex or name>, accent <hex or name>, contrast <hex or name>
**CTR lever:** <one sentence — why this thumbnail might out-click on a feed>

## Variant 2 — <pattern name>
…

## Variant 3 — <pattern name>
…

## Recommended pick

Variant <N> — <one-sentence rationale matching the title and series>.

## Production notes

- Aspect ratio: 1280×720 (16:9), max 2 MB JPEG/PNG.
- Text legibility test: cover the bottom 60% of the canvas — the top must still convey the hook.
- Mobile test: at 240×135 pixels (mobile feed), the text must still read.
- Face zone: faces should occupy 30–50% of vertical height when used.
```

## Save to vault

After producing the concept brief in chat, persist it to the Obsidian vault following `${CLAUDE_PLUGIN_ROOT}/references/vault.md`.

- Target folder: `C:\projects\Claude\youtube\60-thumbnails\`.
- Filename: `<video-slug>.md`. Reuse the same slug as the script for this video (lives in `40-scripts/<slug>.md`). If a thumbnail file with this slug exists, append `-v2`, `-v3`…
- Frontmatter:

  ```yaml
  ---
  type: thumbnail
  date: <YYYY-MM-DD>
  video: "<working title in Russian>"
  video_slug: <slug>
  variants: <N>                          # number of concept variants in the body
  recommended_variant: <1..N>
  emotion: curiosity | triumph | frustration | surprise | <other>
  tags:
    - youtube/thumbnail
  related:
    - "[[40-scripts/<slug>]]"
    - "[[50-seo/<slug>]]"
  ---
  ```

- Body: the full thumbnail concept brief (2–3 variants, recommended pick, production notes) — same content as the chat output.
- After writing, tell the user in Russian where the file landed.

## Boundaries

- Do not generate the actual image. The output is a brief.
- Do not include more than 5 words on the thumbnail. 3 is often best.
- Avoid stock-photo aesthetics, drop-shadow halos, and red arrows pointing at things — saturated patterns that signal cheapness in the IT niche.
- Do not duplicate what the title says — thumbnail and title should compose, not repeat. (Title says "Cursor выкинул проект". Thumbnail text could be: "Так нельзя." — different angle, same hook.)
- Russian-language text on the thumbnail. Tool names allowed in original form (Cursor, Claude Code, AI).
