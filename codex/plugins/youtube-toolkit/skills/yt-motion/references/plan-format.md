# The motion plan — `motion\STORYBOARD.md`

The director's plan for every motion scene of one video. It follows HyperFrames' storyboard file shape (`hyperframes/references/storyboard-format.md`: frontmatter, sections above the first scene, one heading per scene with `- key: value` bullets, narrative below), so its parser and Studio read it; the keys below are this skill's own. Workers read it and never write it.

## Frontmatter

```yaml
---
format: 1920x1080
fps: 30
video: "Выбираю стиль игры и собираю движок"
video_slug: выбираю-стиль-игры-и-собираю-движок
sheet: C:\projects\obsidian\Проекты\youtube\монтаж\<slug>.md
script: C:\projects\obsidian\Проекты\youtube\сценарии\<slug>.md
style: <library style name, or "pending" until the owner picks>
---
```

## Above the first scene

- **Направление** — what the editing sheet and the journal ask of this video's look, quoted ("сказочный и круче Билибина"), and what was rejected for it.
- **Сквозной приём** — the one device that threads the scenes (a scroll that keeps returning, one candle-lit desk, one paper texture under every diagram), named now, not discovered while building.
- **Ритм** — how motion breathes in this video: the tempo of reveals, where holds are, how characters idle.
- **Стыки** — every seam as `NN → MM: <the shared frame>`, the exact elements, places and colors both scenes agree on.
- **Сцена для пробы стилей** — the sample scene's id and why it is the hardest for a style (written with the scene list, before the style round).
- **Нельзя** — the per-video bans: two motion failures to avoid (the slideshow — every beat a fresh card; the screensaver — motion that says nothing), plus what the owner rejected.

## One block per scene

A scene is one clip. Consecutive sheet rows that form one continuous motion moment are one scene (the chronicler unrolls the scroll, the word turns gold, the scroll rolls up — one scene of three rows). A row that annotates a picture or a screen recording is a scene too: the picture is a layer inside it, copied into its `assets\`, and the clip carries both.

```markdown
## Scene 02-chronicler — Летописец со свитком

- rows: «В этот раз я решил внять заветам предков…» | «…а они говорят, что игру начинают с прототипа…» | «…на которой проверяют, интересно ли вообще играть в твой будущий шедевр»
- phrase: В этот раз я решил внять заветам предков, а они говорят, что игру начинают с {gold}прототипа, то есть с самой простой версии, на которой проверяют, интересно ли вообще играть в твой будущий {roll}шедевр
- key_at: gold
- start: <what is on screen at t=0>
- end: <what is on screen at the last frame>
- seam_in: none
- seam_out: none
- assets: none
- motion: <named moves by rule / blueprint id from hyperframes-animation, easing, character beats>
- text: «Игру начинают с прототипа»
- sound: <what is heard on which cue: a candle crackles under all; {unroll} paper rustle, a knock as the roll lands; {write} the quill scratches on the letters>
- no: <one explicit ban for this scene>

<narrative: what happens beat by beat, each beat on its cue>
```

- `rows` — the sheet's phrases this scene covers, verbatim; they are how the sheet gets marked after delivery.
- `phrase` — the spoken text from the script, verbatim and whole (the sheet abbreviates with «…»), with `{name}` in front of every word a beat lands on. Cue names are Latin identifiers (`gold`, `rollUp`) — the worker writes them as `CUES.<name>`, and `retime.mjs` refuses any other. Copied into the scene's `scene.json`; `retime.mjs` turns it into seconds.
- `key_at` — the cue (or second) of the scene's key moment: the fullest, most telling frame. The worker draws it first and builds the motion around it; the style round sketches it; the director's contact image shows it.
- `start` / `end` — concrete: which elements, where, in which state. For a seam they repeat the **Стыки** line word for word.
- `assets` — files from the episode's `assets\` the scene shows, or `none`.
- `motion` — ids from `hyperframes-animation/rules-index.md` and `blueprints-index.md`, never invented names; the worker reads their bodies.
- `text` — every on-screen word, verbatim, in Russian.
- `sound` — the scene's own effects, each tied to the beat that makes it, plus an ambient bed if the place has one; no voice, no music. The worker builds it per `sound.md`. A scene with nothing physical happening (a pure diagram) still gets a sound for each of its reveals.

## `scene.json` in each scene folder

```json
{ "title": "Летописец со свитком", "phrase": "<the block's phrase>", "lead": 0.3, "tail": 0.5 }
```

`lead` — seconds of picture before the first word, `tail` — after the last. A silent scene: `"phrase": ""` and `"duration": <seconds>`. `retime.mjs` adds `timing`; `sheet.mjs` reads `title`, `phrase` and an optional `note`.
