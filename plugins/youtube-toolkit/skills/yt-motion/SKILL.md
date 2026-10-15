---
name: yt-motion
description: >
  Makes the motion clips for one of the owner's YouTube videos on HyperFrames: takes the scenes the
  editing sheet gives to Claude's motion (or a scene described in words), proposes 2–4 looks as still
  sketches of one scene for the owner to pick, then directs parallel Opus scene workers, has a cheaper
  model fix technical faults, and delivers MP4 clips into the episode's assets\motion, re-timed to the
  recorded voice by its words. Not for writing the editing sheet (yt-montage) or assembling the whole video.
when_to_use: "сделай моушен", "моушен для ролика", "перенеси моушен на запись голоса"
model: opus
effort: high
---

# yt-motion — motion clips for a video

You are the director. You plan every motion scene of the video — what each shows, the style, colors, fonts, the character of the motion, the rhythm — and agree every seam in advance: where one motion scene cuts straight to the next, the last frame of the first is the first frame of the second. Scene workers (Opus, medium effort) build one scene each, all in parallel; a checker (Sonnet) after each worker fixes the technical faults and sends you its art notes. You send art notes back to the workers in one batch per round, never one at a time.

The dialog with the owner stays in this conversation; workers and checkers run inside the build workflow. The owner sees pictures and clips, never the plan's internals: ask him only what he decides — which style, what to change — in plain Russian, without scene ids, file names or style tokens.

HyperFrames already has the loop this skill follows: plan → still sketches → parallel workers per scene → checks → render. Read `hyperframes/references/production-loop.md` and `review-loop.md` once per run; the steps below are that loop fitted to the owner's videos. One difference: the owner does not want a sheet of still frames of every scene — the only stills he sees are the style round's; after it the scenes go straight to finished clips.

## Where things live

- HyperFrames skills: `C:\projects\youtube-video\.claude\skills\` (`hyperframes`, `hyperframes-core`, `-creative`, `-animation`, `-keyframes`, `-cli`, `media-use`). They are project skills of `C:\projects\youtube-video` and are not loaded in other sessions — read them by path, and pass the path to workers.
- The episode: `C:\projects\youtube-video\epNN\` — the sheet's «Как монтируется» line names it.
  - `assets\motion\<id>.mp4` — the delivered clips, 1920×1080, 30 fps, no sound.
  - `motion\` — your working folder: `STORYBOARD.md` (the plan), `frame.md` and `assets\fonts\` (the chosen style), `_template\`, `scenes\<id>\` (one HyperFrames project per scene), `styles\<slug>\` (the style round), and the review pages.
- The vault: the editing sheet `C:\projects\obsidian\Проекты\youtube\монтаж\<slug>.md`, the script `…\сценарии\<slug>.md`, the channel journal `…\Журнал YouTube\`. Vault conventions: `${CLAUDE_PLUGIN_ROOT}/references/vault.md` — no media files there.
- The style library: `C:\projects\youtube-video\styles\<slug>\`, listed in `C:\projects\obsidian\Проекты\youtube\Монтаж через Claude.md`, section «Библиотека стилей».
- This skill: `${CLAUDE_SKILL_DIR}/references/` (plan format, style round, worker and checker roles), `${CLAUDE_SKILL_DIR}/scripts/retime.mjs` (timing by words), `${CLAUDE_SKILL_DIR}/scripts/sheet.mjs` (review pages), `${CLAUDE_SKILL_DIR}/scripts/cyrillic.mjs` (does a font draw Russian), the workflow `${CLAUDE_PLUGIN_ROOT}/workflows/yt-motion-build.js`.

Scene ids are `NN-latin-kebab` in the order they play (`02-chronicler`); clips take the same name.

Every HyperFrames command — yours, the workers', the checkers' — runs as `npx --yes hyperframes@<version> …` with the version `init` pinned in `_template\package.json`: a bare `npx hyperframes` takes whatever version npm resolves that day, and the scenes of one video must render alike. Raise the pin only between videos.

## 1. Take the task

From the editing sheet: every row whose «Откуда» says Claude makes the picture — «Claude, моушен», «Claude, кодом», «Claude», or a file plus «Claude» (a picture or recording Claude annotates) — and the list under «Подготовить заранее» → «Моушен». Leave out rows that are only a file, a picture the owner generates, a screen recording on its own, and anything the sheet sends elsewhere by name. A sheet without an «Откуда» column (the plain `yt-montage` layout) gives its rows of type «Графика / motion» and its «Графика / тайтлы нарисовать» list instead. Read the script itself too: the sheet shortens phrases with «…», the plan needs them whole.

From words: the owner's description is the scene; ask only which video it belongs to when that is not clear, and take everything else from defaults.

Read the sheet's «Оформление» and «Заметки» and skim the journal's visual decisions: they carry the video's direction and what the owner already rejected.

## 2. Scene list

Write `motion\STORYBOARD.md` per `${CLAUDE_SKILL_DIR}/references/plan-format.md`, first as a scene list: frontmatter, the direction, and for every scene its heading, `rows` and `phrase`. Then the full block of one scene — the sample for the style round (the hardest one for a style, see the style round). The other blocks wait for the style: how a diagram or a seam is drawn depends on it.

Scaffold the scenes:

1. Once per episode: `HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@latest init motion/_template --non-interactive`, then delete `_template`'s `CLAUDE.md`, `AGENTS.md` and `index.html` — the generated guides steer an agent into HyperFrames' own routing, and workers write their own `index.html`.
2. Per scene: copy `_template` to `scenes\<id>\`, write its `scene.json`, copy the media its block lists into its `assets\`.
3. `node ${CLAUDE_SKILL_DIR}/scripts/retime.mjs motion/scenes` — estimated timing from the phrase at 130 words a minute, written into each `scene.json`.

The owner already approved what is on screen when he approved the sheet; the plan is not shown to him. His first look is the style round.

## 3. Style round

Follow `${CLAUDE_SKILL_DIR}/references/style-round.md`: 2–4 candidates as `frame.md` specs, each sketched on the same sample scene by a worker, a page for the owner, his pick saved to the library. A library style the owner names replaces the round.

Then copy the chosen fonts into every scene's `assets\fonts\`; every scene now draws to `motion\frame.md`. When the round ran, copy the winning candidate's `index.html` and `keyframe.png` into the sample scene's folder (never a library style's sample — it belongs to another video) — the owner chose that drawing, so its animate pass starts from it — and run `retime.mjs motion/scenes` again, which puts the scene's own timing into the copied file.

## 4. The full plan

Before writing, read `hyperframes-creative/references/house-style.md`, `video-composition.md` and `beat-direction.md` — they are what keeps a scene from reading as a slide — and the indexes `hyperframes-animation/rules-index.md` and `blueprints-index.md`, so every move in the plan is cited by id. Complete `STORYBOARD.md` in the chosen style: the through-device, the rhythm, the seams, the bans, and every scene's block.

## 5. Animate

Run the workflow in `animate` mode for all scenes, with every seam from the plan in `handoffs`: each worker draws its scene in the chosen style and animates it. From the result:

- A scene whose worker did not finish (`worker` is null): run it again in `animate` — there may be nothing to fix yet — with its seams in `handoffs`.
- `unfixed` and failed seams: re-dispatch those scenes in `fix` mode with the fault as the note, and the failed seams again in `handoffs` so they are checked once more. Each scene's result also carries the worker's own report (`worker`) — what it could not do.
- Your own look at the whole film: `node ${CLAUDE_SKILL_DIR}/scripts/sheet.mjs motion/scenes motion/scenes.html` and open only `scenes.png` — every scene's key moment on one image (the checker saves each as `keyframe.png`). It shows what one scene at a time cannot: a scene that drifted from the style, two scenes that look alike, a seam that will not meet. This image is for you; the owner sees clips.
- `artNotes` and what you saw: decide each. The ones you accept go out as one `fix` batch, each note under its scene. Before the batch, write into the scene's plan block whatever an accepted note changes on screen — a word, a `start` or `end` state, a seam (both blocks and the **Стыки** line): the checker and the seam check compare against the plan and would undo a change the plan does not know. The same goes for the owner's notes in step 6. Open a scene's snapshots (`scenes\<id>\snapshots\`) only when its note needs it — every image you open re-reads the whole conversation.

Two rounds of your own at most; then the owner sees clips.

## 6. Render and show

Render one scene at a time — each render runs its own browser — in the background, in one shell loop over the scene folders:

```bash
npx --yes hyperframes@<version> render --quality delivery --fps 30 --output "<episode>/assets/motion/<id>.mp4"
```

run from each scene's folder. After rendering, confirm with `ffprobe` that every clip exists and lasts its `timing.duration`.

Build `node ${CLAUDE_SKILL_DIR}/scripts/sheet.mjs motion/scenes motion/clips.html --clips <episode>/assets/motion`, give the owner the path, and ask what to change. Sort his notes per scene, run one `fix` batch, re-render the changed scenes, show again.

## 7. Mark the sheet

When the owner accepts the clips: in the editing sheet, append ` → assets\motion\<id>.mp4` to the «Откуда» cell of every row the scene's `rows` lists, and add one line to the «Моушен» list: how many clips are in `epNN\assets\motion\` and whether their timing is the estimate or the recorded voice. Edit the cells in place; keep the table's alignment and every other word of the sheet.

## 8. After the voice is recorded

The owner records the voice last. When the recording exists, its transcript is a whisper.cpp JSON with word times — the edit makes one; if there is none yet, make it from `C:\projects\youtube-video`:

```bash
ffmpeg -i <voice.wav> -ar 16000 -ac 1 <voice16.wav>
tools/whisper/Release/whisper-cli.exe -m tools/models/ggml-large-v3-turbo.bin -l ru -ojf -of <out> <voice16.wav>
```

Then `node ${CLAUDE_SKILL_DIR}/scripts/retime.mjs motion/scenes --voice <out>.json`. For every scene it finds the phrase in the recording, moves each cue onto its spoken word, sets the duration to the real speech, and writes `timing.voiceStart` — the second of the recording where the clip starts, which is where the edit places it. It reports:

- a phrase not found — the owner said it differently: find the words in the transcript, correct `phrase` in `scene.json` and the plan, run again;
- only N of M words matched — the phrase was found but loosely: find its first and last words in the transcript and check `voiceStart` and the duration against them; if they are off, correct `phrase` and run again;
- matched words dropped as strays — a misheard word was paired with the same word in the next phrase, or the owner inserted a few words of his own inside the phrase: check the scene's start and end the same way;
- cue words interpolated — said differently or misheard: snapshot those beats after rendering and check they still land;
- a negative `voiceStart` — the phrase starts the recording: lower that scene's `lead` to the time before its first word.

Re-render every scene whose timing changed and update the «Моушен» line in the sheet. Never stretch a clip in the edit to fit the voice — it is re-timed and re-rendered instead, because a stretched clip slows every move with it.

## Running the workflow

```
Workflow({
  scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/yt-motion-build.js",
  args: {
    mode: "sketch" | "animate" | "fix",
    plan: "<episode>\\motion\\STORYBOARD.md",
    workerRole: "${CLAUDE_SKILL_DIR}/references/scene-worker.md",
    checkerRole: "${CLAUDE_SKILL_DIR}/references/scene-checker.md",
    hfSkills: "C:\\projects\\youtube-video\\.claude\\skills",
    scenes: [{ id, dir, frame, block, notes }],
    handoffs: [{ from, to }]
  }
})
```

`sketch` serves the style round only; the video's scenes go through `animate` and `fix`. `dir` and `frame` are absolute paths; `block` is the plan block when it differs from `id` (in the style round every candidate draws the sample scene's block); `notes` is the batch for that scene. The Workflow tool loads a `scriptPath` only from a folder the session may read; when it refuses the plugin path, Read the script and pass its text as `script` with the same `args`. The run is backgrounded: wait for its completion notification, do not poll, and never message its agents — a message to a running workflow agent stalls it. Without the Workflow tool, dispatch the same prompts with the Agent tool in one message, workers on `opus`; then a checker on `sonnet` per finished scene, with the worker's reply in its prompt and without the director's notes; then the seam checks one after another.

## Gotchas

- Every font must cover Cyrillic, checked on the file with `${CLAUDE_SKILL_DIR}/scripts/cyrillic.mjs`: a Latin-only face renders Russian words in a fallback that the check may not flag.
- `check`, `snapshot` and `render` each start a headless browser: checks of several scenes in parallel are fine, renders go one at a time.
- An image you open re-prices the whole context: look at one contact image per phase, not frame by frame.
- Clips carry no sound and no exit animation unless planned: the edit owns voice, music and the cuts.
- A scene's timing lives in its CUES line and root `data-duration`; anything placed at a literal second will not follow the voice. The checker flags it — do not wave it through.
- Workers draw with code; a raster picture appears in a clip only when the sheet names it as the scene's material.
