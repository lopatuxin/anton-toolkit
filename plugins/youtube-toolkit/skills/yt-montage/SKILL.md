---
name: yt-montage
description: >
  Plans or assembles a faceless YouTube video from a finished script. For an editing-sheet
  request, saves a Russian beat sheet to Obsidian. For "собери ролик" or "смонтируй видео",
  cleans the recorded voice, reuses existing assets, directs motion through yt-motion,
  assembles and checks the final video. Every beat pairs a viewer takeaway with a visible
  action tied to speech. Does not write spoken text (yt-script) or publish to YouTube.
when_to_use: >
  "монтажный лист", "распиши монтаж", "собери ролик", "смонтируй видео"
---

# yt-montage — plan and assemble a faceless video

Use the request to select the deliverable: **sheet mode** plans speech → visuals and saves the editing sheet; **assembly mode** delivers the edited video as well. An editing-sheet request alone does not authorize rendering a whole video. A request to assemble the video does: continue through the assembly procedure in `SKILL_DIR/references/assembly.md` instead of stopping after the sheet. The spoken script already exists (`yt-script`); removing failed takes is editing, not rewriting its claims.

## HARD CONSTRAINT — faceless channel

This channel is shot **faceless**: the host's face/head is NEVER on screen. There is no "talking head" shot. The video is a **voiceover** (the spoken script) over visuals only.

- NEVER propose a shot type "говорящая голова", "talking head", "ведущий в кадре", "крупный план лица", or a webcam/host inset.
- Every line of the script MUST be covered by a non-face visual. There is no fallback to "just show the host" — if a beat has no obvious visual, that is exactly the gap this skill must fill with screencast / b-roll / graphics / text.
- If the user later says they want to appear on camera, that overrides this constraint for that request only — otherwise faceless is the default.

The whole point of the editing sheet is that there is never a moment of dead screen, because there is no host to cut back to.

## Faceless visual vocabulary

Pick the "что на экране" value for each beat from these types (mix them — do not use only one):

- **Скринкаст** — screen recording: IDE, terminal, browser, the actual app/tool being discussed. The workhorse for a dev channel.
- **B-roll (перебивка)** — supporting footage: stock clips, abstract tech footage, a relevant object, slow product shots.
- **Графика / motion** — diagrams, arrows, highlights, animated schemes, lower-thirds, charts.
- **Текст на экране** — a key phrase, term, number, or quote typed large; bullet reveals.
- **Код на экране** — a code snippet shown statically (not a live screencast), with the relevant lines highlighted.
- **Скриншот / зум** — a still image with a slow zoom/pan (Ken Burns) onto the part that matters.
- **Сток / архив** — stock footage or archival clips for an analogy or wider point.

## Step 0 — Get the script

The script is required input. Resolve it in this order:
1. If a `yt-script` output is present in the conversation — use it.
2. If the user names a video by title or slug — read `C:\projects\obsidian\Проекты\youtube\сценарии\<slug>.md`.
3. If the user pasted a script — use the pasted text.
4. Otherwise — ask the user (in Russian) which video / paste the script. Do NOT invent a script.

Capture the `video_slug` from the script's frontmatter — the editing sheet reuses it to stay in the same video bundle. Read its production notes and evidence map before assigning visuals. Preserve the distinction between existing assets and material still to capture or create; do not present an illustration or reconstruction as recorded proof of the experiment. Production notes are not spoken beats.

## Inputs before timing

Inspect the episode's source assets, previous exports and approved animations before commissioning replacements. Record each relevant asset's path, what it demonstrates, and whether to reuse, retime, annotate or create a replacement. Compare the actual old and proposed shots; a new illustration is not automatically an improvement. Preserve approved geometry, camera and motion unless the requested correction needs them changed.

When a voice recording exists, use its cleaned transcript with word timestamps as the timing authority. In assembly mode, clean it first per `SKILL_DIR/references/assembly.md`; in sheet mode, use an existing cleaned recording or mark timings provisional if cleanup is outside the request. Do not schedule recorded speech from word-count estimates. If there is no recording, estimated timing is allowed and must stay labelled as such.

## Procedure

1. **Segment the speech.** Split the cleaned transcript when available, otherwise the script, into beats of roughly 5–20 seconds each (≈ one to three sentences). A beat boundary is where the visual would naturally change.

2. **Explain every beat visually.** Fill the viewer takeaway, visible action, asset decision, on-screen text and transition. Name what changes or is inspected, at which spoken phrase. For proportions, align silhouettes and mark the actual discrepancies; for division of work, separate components from the whole; for hidden defects, move from overview to close-up and point at the defect. A car still under a heading about checks does not demonstrate a check. A purposeful hold is valid; arbitrary motion is not a substitute for meaning.

   Use HyperFrames for diagrams, labels and timed overlays; image generation for planned illustrations; Blender for real geometry and part separation; a screencast for actual editor actions. Load the relevant skill when using a tool. Keep documentary assets separate from illustrative ones. An analogy must match the claimed feature: an angular car needs an angular example, not merely any cartoon car. Comparisons need distinct panels, readable labels and comparable views/scales; do not erase a real proportion difference by stretching the images. Store source/license/attribution requirements in an asset ledger; put credits in the description or end credits where permitted, not automatically over the explanatory shot. If a source requires in-frame attribution, meet it or choose another source.

3. **Set timecodes.** Use the cleaned recording and its word timestamps when available. Only without recorded timing, estimate at ~130 spoken words/min and label ranges such as `0:00–0:08` provisional. Each action gets a phrase anchor, not just a scene start.

4. **Default detail level: medium.** A visual change roughly every 15–25 seconds, with finer beats inside the hook (first 15 sec) where retention is most fragile. If the user asks for "подробно" — go to 5–15 sec beats with explicit zooms/transitions per beat. If "покрупнее"/"средне" — oporny changes only. This is a starting default; adjust on user feedback.

5. **Collect preparation summaries.** List existing reusable assets separately from missing b-roll, screencasts and graphics. In assembly mode, prepare what the available tools can produce; ask only for genuinely missing source material or owner decisions.

6. **Write the sheet** in the output format below.

## Output format

```markdown
# Монтажный лист — «<название>»

**Видео:** <working title>
**Длительность:** ~<N> мин
**Формат:** faceless (закадровый голос + визуал, ведущего в кадре нет)
**Исходный сценарий:** [[Проекты/youtube/сценарии/<slug>]]

---

## Монтаж по таймкодам

| Таймкод | Реплика (опорная фраза) | Что зритель поймёт | Что на экране и что меняется | Тип кадра | Текст/графика | Откуда | Переход |
|---------|------------------------|-------------------|-----------------------------|-----------|---------------|------------------|---------|
| 0:00–0:08 | «<фраза об ошибке>» | Где ломается запуск | Скринкаст: запускаем команду, на слове «ошибка» выделяем строку сбоя | Скринкаст | Короткая подпись к сбою | <файл>; аннотировать | Hard cut |
| 0:08–0:20 | «<фраза о пропорциях>» | Чем форма отличается от образца | Совмещаем силуэты, показываем расхождения крыши и багажника на соответствующих словах | Графика / motion | Крыша · Багажник | Claude, моушен; <исходники>; аннотировать | Переход к детали |
| … | … | … | … | … | … | … | … |

---

## Подготовить заранее

### Уже есть — использовать или подогнать
- <путь, что доказывает материал, решение: использовать / подогнать / аннотировать>

### 🎬 B-roll / перебивки доснять или найти
- <короткий список перебивок: что именно нужно снять/скачать>

### 🖥 Скринкасты записать
- <что записать с экрана: какой код / UI / терминал / прогон>

### 🎨 Графика / тайтлы нарисовать
- <нижние трети, схемы, стрелки, текстовые карточки, анимации>

---

## Заметки
- <ритм, где музыка/акцент/пауза, длинные стретчи без визуала — флаг переснять>
```

## Save to vault

After producing the sheet in chat, persist it to the Obsidian vault following `PLUGIN_ROOT/references/vault.md`.

- Target folder: `C:\projects\obsidian\Проекты\youtube\монтаж\`.
- Filename: `<video-slug>.md` — the SAME Cyrillic kebab-case slug as the script, so `сценарии/<slug>.md` and `монтаж/<slug>.md` form one bundle. If a sheet with this slug exists, append `-v2`, `-v3`…
- Frontmatter:

  ```yaml
  ---
  type: montage
  date: <YYYY-MM-DD>
  video: "<working title in Russian>"
  video_slug: <slug>             # Cyrillic kebab-case, same as the script
  length_min: <N>
  tags:
    - youtube/montage
  related:
    - "[[Проекты/youtube/сценарии/<slug>]]"      # the script this sheet is built from
  ---
  ```

- Body: the full editing sheet in the format above.
- After writing, tell the user in Russian where the file landed.

## Boundaries

- Do NOT write or rewrite the spoken script text — that is `yt-script`. If the script has a weak line, note it under "Заметки" but do not rewrite it here.
- Do NOT propose any host-on-camera / talking-head shot (see the faceless constraint).
- Do NOT invent a script — if none is available, ask for it.
- Russian for all on-screen text and user-facing output. English allowed in code blocks, tool names, and tags.
- This is a starting version intentionally kept simple. When the user gives feedback on what is or isn't useful for actual editing, refine via the `improve-plugin` skill.
