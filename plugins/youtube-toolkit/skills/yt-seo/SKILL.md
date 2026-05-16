---
name: yt-seo
description: >
  IMPORTANT: Invoke this skill via the Skill tool IMMEDIATELY when the user
  asks for video title (with A/B variants), description (with timestamps),
  or tags. Do NOT skip — this skill contains title formulas, description
  template, and tag strategy in references/.

  Trigger phrases (Russian): "SEO для видео", "название и описание", "тайтл
  и теги", "подбери название", "варианты заголовка", "опиши видео",
  "описание для видео", "теги для видео", "оптимизация ролика", "metadata
  для видео", "название ролика", "сделай описание".

  This skill does NOT cover thumbnails — that is yt-thumbnail.
---

# yt-seo — title, description, tags

Produce: 5 title variants (A/B-style), one full description with timestamps and CTAs, and 15–30 tags. Russian-language channel.

## Procedure

1. **Get inputs.** Required:
   - The video — at minimum a working title and 2–3 sentences of what's in it; ideally the full script or its main payoff.
   - Video type (tutorial / case / flagship / review / lead-gen).
   - Series, if applicable (Logos / CRM / standalone).
   - Estimated length.

   If a `yt-script` output is in the conversation, pull from it. If only an idea exists, work from that but flag less precision in timestamps.

2. **Generate 5 titles** using `references/title-formulas.md`:
   - Pick 3 different formulas (e.g., outcome-reveal, problem-mirror, sharp-opinion).
   - For each chosen formula, produce 1–2 variants.
   - Annotate each variant with: formula name, character count, hook type, predicted CTR lever.

3. **Build the description** using `references/description-template.md`:
   - Hook line (1–2 sentences in plain prose, repeats the value prop).
   - Series breadcrumb if flagship.
   - Timestamps (6–10 entries for 12 min video, scaled by length). If timestamps are placeholders (script not finalised), mark them clearly.
   - Lead-gen CTA: site placeholder `{{SITE_URL}}` or soft fallback "контакты в закреплённом комментарии".
   - Useful links section (tools mentioned, repos, related videos).
   - Hashtag block at the end — 3–5 hashtags max in description.

4. **Generate tags** using `references/tags.md`:
   - 15–30 tags total.
   - Mix: brand (channel name + series), niche head terms, long-tail variations, tool names, Russian and selective English terms.
   - Order: most specific/searched first.

5. **Output everything** in one Markdown block, ready to paste into YouTube Studio.

## Output format

```markdown
# SEO — <working title>

## Title variants (5)

### Variant 1 — <formula name>
**<title text>**
- Length: <N chars> (target ≤ 60 visible)
- Hook type: <curiosity / outcome / opinion / number / problem>
- CTR lever: <one sentence — why this variant could pull clicks>

### Variant 2 — <formula name>
…

(Variants 3, 4, 5)

## Recommended pick

Variant <N> — <one-sentence rationale>.

## Description

<Russian description ready to paste; full text including timestamps, links, hashtags>

## Tags (NN total)

<comma-separated list>

## Notes

- Timestamps mode: <real | placeholder — needs script finalisation>
- Lead-gen CTA mode: <{{SITE_URL}} placeholder | soft fallback>
- Series breadcrumb included: <yes/no>
```

## Save to vault

After producing the SEO block in chat, persist it to the Obsidian vault following `${CLAUDE_PLUGIN_ROOT}/references/vault.md`.

- Target folder: `C:\projects\Claude\youtube\seo\`.
- Filename: `<video-slug>.md`. The slug is Russian (Cyrillic) kebab-case, no transliteration. Reuse the same slug as the script for this video (lives in `сценарии/<slug>.md`). If a SEO file with this slug exists, append `-v2`, `-v3`…
- Frontmatter:

  ```yaml
  ---
  type: seo
  date: <YYYY-MM-DD>
  video: "<working title in Russian>"
  video_slug: <slug>             # Cyrillic kebab-case
  video_type: tutorial | case | flagship | review | lead-gen
  series: logos | crm | standalone
  recommended_title_variant: <1..5>
  timestamps_mode: real | placeholder
  cta_mode: site-url | soft-fallback
  tag_count: <N>
  tags:
    - youtube/seo
    - youtube/series/<series>
  related:
    - "[[сценарии/<slug>]]"
    - "[[превью/<slug>]]"
  ---
  ```

- Body: the full SEO output (5 title variants, recommended pick, description, tags, notes) — same content as the chat output.
- After writing, tell the user in Russian where the file landed.

## Boundaries

- Do NOT generate a thumbnail concept — that is `yt-thumbnail`.
- Do NOT write the script — that is `yt-script`.
- Title variants — exactly 5. Not 3, not 10. Five forces variety without dilution.
- Tags 15–30. Below 15 leaves discovery on the table; above 30 dilutes relevance signal.
- Russian for titles and descriptions. Tool names and code identifiers stay in their original form.
