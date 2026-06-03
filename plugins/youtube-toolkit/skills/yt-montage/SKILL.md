---
name: yt-montage
description: >
  IMPORTANT: Invoke this skill via the Skill tool IMMEDIATELY when the user
  asks to plan the editing of a video, turn a finished script into an editing
  sheet, describe what to show on screen at each moment, or build a b-roll /
  shot list. Do NOT skip — this skill contains the faceless visual vocabulary,
  the editing-sheet format, and the preparation summaries below.

  Trigger phrases (Russian): "монтажный лист", "распиши монтаж", "распиши
  монтаж видео", "монтажный план", "что показывать в видео", "что показать на
  экране", "раскадровка", "визуал для сценария", "b-roll лист", "план монтажа".

  Output is in Russian. This skill consumes a FINISHED script (from the
  сценарии/ folder or pasted) and produces an editing sheet — it does NOT
  write the spoken text.
---

# yt-montage — turn a script into an editing sheet

Take a finished video script and lay it out as a montage / editing sheet: for every beat of the script, decide WHAT IS ON SCREEN. The spoken text already exists (that is `yt-script`); this skill only maps speech → visuals.

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
2. If the user names a video by title or slug — read `C:\projects\Claude\youtube\сценарии\<slug>.md`.
3. If the user pasted a script — use the pasted text.
4. Otherwise — ask the user (in Russian) which video / paste the script. Do NOT invent a script.

Capture the `video_slug` from the script's frontmatter — the editing sheet reuses it to stay in the same video bundle.

## Procedure

1. **Segment the script.** Split the spoken text into beats of roughly 5–20 seconds each (≈ one to three sentences). A beat boundary is where the visual would naturally change.

2. **Assign a visual to every beat.** For each beat fill: what is on screen (from the vocabulary above), a short shot note, any on-screen text/graphic, and the transition into the next beat. NEVER leave a beat without a visual (see the faceless constraint).

3. **Estimate timecodes.** Use ~130 spoken words/min to convert word count into running time. Produce ranges like `0:00–0:08`. These are estimates to guide editing, not frame-accurate cuts.

4. **Default detail level: medium.** A visual change roughly every 15–25 seconds, with finer beats inside the hook (first 15 sec) where retention is most fragile. If the user asks for "подробно" — go to 5–15 sec beats with explicit zooms/transitions per beat. If "покрупнее"/"средне" — oporny changes only. This is a starting default; adjust on user feedback.

5. **Collect preparation summaries.** While filling the sheet, accumulate three lists for the user to prep BEFORE editing (see output format).

6. **Write the sheet** in the output format below.

## Output format

```markdown
# Монтажный лист — «<название>»

**Видео:** <working title>
**Длительность:** ~<N> мин
**Формат:** faceless (закадровый голос + визуал, ведущего в кадре нет)
**Исходный сценарий:** [[сценарии/<slug>]]

---

## Монтаж по таймкодам

| Таймкод | Реплика (опорная фраза) | Что на экране | Тип кадра | Текст/графика | Переход |
|---------|------------------------|---------------|-----------|---------------|---------|
| 0:00–0:08 | «<первая фраза хука>» | Скринкаст: ошибка в IDE | Скринкаст | Заголовок-хук крупно | Hard cut |
| 0:08–0:20 | «<следующая фраза>» | Перебивка: абстрактный код | B-roll | — | Whip-pan |
| … | … | … | … | … | … |

---

## Подготовить заранее

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

After producing the sheet in chat, persist it to the Obsidian vault following `${CLAUDE_PLUGIN_ROOT}/references/vault.md`.

- Target folder: `C:\projects\Claude\youtube\монтаж\`.
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
    - "[[сценарии/<slug>]]"      # the script this sheet is built from
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
