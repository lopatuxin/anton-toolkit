---
name: yt-seo
description: >
  Produces the YouTube Studio packaging for one video and saves it to the
  Obsidian vault: one recommended title with one or two spares, a short
  description in the author's own voice with chapters timed from the final
  cut, 25-36 tags, a one-question pinned comment and the Studio settings to
  set. Written the way large channels package their videos, not as an SEO
  template. Thumbnails are `yt-thumbnail`, the script itself is `yt-script`.
disable-model-invocation: true
---

# yt-seo — title, description, tags

Produce the text the owner pastes into YouTube Studio — title, description, tags, pinned comment — plus the settings he must not miss. Russian-language channels.

The owner rejected the earlier output of this skill as AI slop: a selling first paragraph, emoji section headers, a hashtag block, «с нуля» in the title, five annotated title variants. Large channels package videos very differently. The references below are distilled from 19 channels with 0.3-20M subscribers (analysed 2026-10-13); follow them, not generic SEO advice.

## Step 0 — Load context

1. Channel knowledge base: follow `${CLAUDE_PLUGIN_ROOT}/references/knowledge-base-context.md`. When `kb_available: true`, read `индекс.md` and the top 10 `top`-classified cards (frontmatter + description, skip the transcript) and prefer the title and description habits the channel's own hits validated.
2. The newest packaging analysis in `C:\projects\obsidian\Проекты\youtube\конкуренты\` (frontmatter `mode: packaging`) — real titles, descriptions and pinned comments of large channels. When it disagrees with the references, it wins: it is newer.
3. The video's script (`сценарии/<slug>.md`), editing sheet (`монтаж/<slug>.md`) and the channel's voice note if there is one (e.g. `Подача канала …` in `Проекты/youtube/`). The description must sound like the video.

## Procedure

1. **Inputs.** The final cut if the video is edited, otherwise the script. Which channel, which series, the length.
2. **Chapter times from the final cut.** Take them from the transcript of the final voice track plus the film second where the voice starts — the editing sheet names the episode folder. Script timings drift after cuts and retakes: in the first episode the script said 1:50 for a chapter that starts at 1:57. Without a final cut, mark the chapters as a draft.
3. **Title** per `${CLAUDE_SKILL_DIR}/references/title-formulas.md`.
4. **Description** per `${CLAUDE_SKILL_DIR}/references/description-template.md`.
5. **Tags** per `${CLAUDE_SKILL_DIR}/references/tags.md`; count them the way YouTube does and state the number.
6. **Pinned comment** — one question to viewers on the video's own topic, no links, no request to like or subscribe: «Кем быть герою: Иван-дурак, кто-то из богатырей, Василиса Премудрая или кто-то другой?». БУЛДЖАТь pins exactly this kind of question and gets 50-120 replies under it. A lead-gen pinned comment with links is `yt-promo`.
7. **Studio settings** — list only the ones that apply:
   - Значок: the thumbnail file with its size (limit 2 MB, 1280×720).
   - Плейлист for the series.
   - Аудитория: «Нет, это видео не для детей» whenever the video asks for comments — YouTube turns comments off on made-for-kids videos, and a fairy-tale or cartoon look invites the wrong choice.
   - Изменённый или синтетический контент: «Да» only for realistic AI footage (real-looking people, places, events); clearly fantastical or cartoon AI footage is «Нет».
   - Язык видео: set it explicitly — Studio leaves it at «Нет», and then YouTube makes no automatic subtitles.
   - Категория.
   - Конечная заставка: element times from the final cut (the end-screen stretch, at most 20 s); no "next video" element until a next video exists.
   - The pinned comment can be posted only after the video is public.

## Output format

````markdown
# SEO — <title>

## Название

**<title>** — <the large-channel title it follows, with views>.

Запасное: **<title>** — <when to switch to it>.

## Описание

```
<ready to paste>
```

## Теги (<N>)

```
<comma-separated>
```

<N> знаков из 500 по счёту YouTube.

## Закреплённый комментарий

```
<one question>
```

## Настройки в Творческой студии

- <only the settings that apply>
````

## Save to vault

Persist the output following `${CLAUDE_PLUGIN_ROOT}/references/vault.md`.

- Target folder: `C:\projects\obsidian\Проекты\youtube\seo\`.
- Filename: `seo-<video-slug>.md`. The `seo-` prefix keeps the note name unique in the vault: the script and the editing sheet already use the bare slug, and Obsidian compares note names across folders. Reuse the slug of the script. If the file exists, append `-v2`, `-v3`…
- Frontmatter:

  ```yaml
  ---
  type: seo
  date: <YYYY-MM-DD>
  video: "<working title in Russian>"
  video_slug: <slug>             # Cyrillic kebab-case
  series: <series slug> | standalone
  timestamps_mode: real | draft
  tag_count: <N>
  tags:
    - youtube/seo
    - youtube/series/<series>
  related:
    - "[[Проекты/youtube/сценарии/<slug>]]"
    - "[[Проекты/youtube/монтаж/<slug>]]"
  ---
  ```

- Body: the same content as the chat output.
- After writing, tell the user in Russian where the file landed.

## Boundaries

- No thumbnail concept — `yt-thumbnail`. No script — `yt-script`. No lead-gen funnel — `yt-promo`.
- Everything the viewer reads is Russian; tool names keep their original spelling.
