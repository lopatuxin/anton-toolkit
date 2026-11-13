---
name: yt-motion
description: >
  Makes the motion clips for one of the owner's YouTube videos on HyperFrames: takes the scenes the
  editing sheet gives to Claude's motion (or a scene described in words), proposes 2–4 looks as still
  sketches of one scene for the owner to pick, then directs parallel Opus scene workers, has a cheaper
  model fix technical faults, and delivers MP4 clips into the episode's assets\motion, re-timed to the
  recorded voice by its words. For a whole-video assembly or editing sheet use yt-montage; this skill supplies its motion clips.
when_to_use: >
  "сделай моушен", "моушен для ролика", "перенеси моушен на запись голоса"
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
  - `assets\motion\<id>.mp4` — the delivered clips, 1920×1080, 30 fps, with the scene's own sound effects and no voice or music.
  - `motion\` — your working folder: `STORYBOARD.md` (the plan), `frame.md` and `assets\fonts\` (the chosen style), `_template\`, `scenes\<id>\` (one HyperFrames project per scene), `styles\<slug>\` (the style round), and the review pages.
- The vault: the editing sheet `C:\projects\obsidian\Проекты\youtube\монтаж\<slug>.md`, the script `…\сценарии\<slug>.md`, the channel journal `…\Журнал YouTube\`. Vault conventions: `${CLAUDE_PLUGIN_ROOT}/references/vault.md` — no media files there.
- The style library: `C:\projects\youtube-video\styles\<slug>\`, listed in `C:\projects\obsidian\Проекты\youtube\Монтаж через Claude.md`, section «Библиотека стилей».
- This skill: `${CLAUDE_SKILL_DIR}/references/` (plan format, style round, worker and checker roles, `sound.md` — the scene's effects), `${CLAUDE_SKILL_DIR}/scripts/retime.mjs` (timing by words), `${CLAUDE_SKILL_DIR}/scripts/sfx.mjs` (the template that lays a scene's effects on its cues) and `envelope.mjs` (loudness and brightness of a sound file), `${CLAUDE_SKILL_DIR}/scripts/sheet.mjs` (review pages), `${CLAUDE_SKILL_DIR}/scripts/cyrillic.mjs` (does a font draw Russian), the workflow `${CLAUDE_PLUGIN_ROOT}/workflows/yt-motion-build.js`.

Scene ids are `NN-latin-kebab` in the order they play (`02-chronicler`); clips take the same name.

Every HyperFrames command — yours, the workers', the checkers' — runs as `npx --yes hyperframes@<version> …` with the version `init` pinned in `_template\package.json`: a bare `npx hyperframes` takes whatever version npm resolves that day, and the scenes of one video must render alike. Raise the pin only between videos.

## 1. Take the task

From the editing sheet: every row whose «Откуда» says Claude makes the picture — «Claude, моушен», «Claude, кодом», «Claude», or a file plus «Claude» (a picture or recording Claude annotates) — and the list under «Подготовить заранее» → «Моушен». Leave out rows that are only a file, a picture the owner generates, a screen recording on its own, and anything the sheet sends elsewhere by name. A sheet without an «Откуда» column (the plain `yt-montage` layout) gives its rows of type «Графика / motion» and its «Графика / тайтлы нарисовать» list instead. Read the script for context; take full spoken phrases from the cleaned transcript when it exists, otherwise from the script. The sheet shortens them with «…», but cue matching needs the actual words.

From words: the owner's description is the scene; ask only which video it belongs to when that is not clear, and take everything else from defaults.

Read the sheet's «Оформление» and «Заметки» and skim the journal's visual decisions: they carry the video's direction and what the owner already rejected.

Before planning replacements, inspect the episode's existing assets and approved earlier clips. Carry the sheet's takeaway, visual action and reuse decision into each scene. Reuse or annotate a good clip; retime its phases when only synchronization is wrong. Keep its geometry, camera and actual component motion. An image-generation asset is an illustration unless its provenance establishes otherwise, never substitute proof of the experiment.

If a voice master exists, including a recording explicitly accepted as-is, use its transcript now and follow step 8 before animating. If only an unreviewed raw recording exists during a whole-video task, return to yt-montage's recording-treatment decision first. Keep provisional estimates only for scenes without recorded timing.

## 2. Scene list

Write `motion\STORYBOARD.md` per `${CLAUDE_SKILL_DIR}/references/plan-format.md`, first as a scene list: frontmatter, the direction, and for every scene its heading, `rows` and `phrase`. Then the full block of one scene — the sample for the style round (the hardest one for a style, see the style round). The other blocks wait for the style: how a diagram or a seam is drawn depends on it.

Scaffold only missing scenes; preserve existing projects and their approved animation on revisions:

1. Once per episode: `HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@latest init motion/_template --non-interactive`, then delete `_template`'s `CLAUDE.md`, `AGENTS.md` and `index.html` — the generated guides steer an agent into HyperFrames' own routing, and workers write their own `index.html`.
2. Per scene: copy `_template` to `scenes\<id>\`, write its `scene.json`, copy the media its block lists into its `assets\`.
3. Run `node ${CLAUDE_SKILL_DIR}/scripts/retime.mjs motion/scenes --voice <clean-transcript>.json` when cleaned word timings exist (step 8). Only otherwise omit `--voice` for a labelled estimate at 130 words a minute.

An approved sheet settles the intended content, not the readability of a newly drawn scene. Keep the internal plan out of the owner's review; show the relevant visual or motion sample instead.

## 3. Style round

Follow `${CLAUDE_SKILL_DIR}/references/style-round.md`: 2–4 candidates as `frame.md` specs, each sketched on the same sample scene by a worker, a page for the owner, his pick saved to the library. A library style the owner names, or the already approved style of this video, replaces the round. Revisions preserve that style unless the owner asks to change it.

Then copy the chosen fonts into every scene's `assets\fonts\`; every scene now draws to `motion\frame.md`. When the round ran, copy the winning candidate's `index.html` and `keyframe.png` into the sample scene's folder (never a library style's sample — it belongs to another video) — the owner chose that drawing, so its animate pass starts from it — and run `retime.mjs motion/scenes` again with the same `--voice` input when available, which puts the scene's own timing into the copied file without reverting to estimated timing.

## Comprehension sample

For a new explanation approach without a comparable approved animated example, or after the user rejects its clarity, build one short representative excerpt before expanding the affected scenes into the full film. Use the actual voice when available. Without a recording, use explicitly provisional script-cue timing without inventing a voice track; acceptance then covers the visual approach only, and speech synchronization remains to be checked once the recording exists. Choose the hardest interaction to understand, not just the easiest attractive shot. Follow the Visual explanation principles in `PLUGIN_ROOT/skills/yt-montage/SKILL.md`: the sample must show recognizable parts, a focused action and its consequence; a still can judge the look but not this sequence.

Show the timed excerpt for the owner's assessment. Acceptance covers the demonstrated approach, not unseen scenes or the full export. A comparable approved motion sample can be reused; routine corrections within that accepted approach do not reopen approval. If the sample is rejected, correct the explanatory approach rather than merely increasing surface detail. Keep the pending whole-video assembly active and continue it after the choice.

## 4. The full plan

Before writing, read `hyperframes-creative/references/house-style.md`, `video-composition.md` and `beat-direction.md` — they are what keeps a scene from reading as a slide — and the indexes `hyperframes-animation/rules-index.md` and `blueprints-index.md`, so every move in the plan is cited by id. Complete `STORYBOARD.md` in the chosen style: the through-device, the rhythm, the seams, the bans, and every scene's block with its `sound` line — what the scene's own effects are and on which cue each one sounds (`${CLAUDE_SKILL_DIR}/references/sound.md`).

## 5. Animate

Run the workflow in `animate` mode for all scenes, with every seam from the plan in `handoffs`: each worker draws its scene in the chosen style and animates it. From the result:

- A scene whose worker did not finish (`worker` is null): run it again in `animate` — there may be nothing to fix yet — with its seams in `handoffs`.
- `unfixed` and failed seams: correct a misleading plan first if the finding is explanatory, then re-dispatch those scenes in `fix` mode with the fault as the note, and the failed seams again in `handoffs` so they are checked once more. Each scene's result also carries the worker's own report (`worker`) — what it could not do.
- Your own look at the whole film: `node ${CLAUDE_SKILL_DIR}/scripts/sheet.mjs motion/scenes motion/scenes.html` and open only `scenes.png` — every scene's key moment on one image (the checker saves each as `keyframe.png`). It shows what one scene at a time cannot: a scene that drifted from the style, two scenes that look alike, a seam that will not meet. This image is for you; the owner sees clips.
- `artNotes` and what you saw: decide each. The ones you accept go out as one `fix` batch, each note under its scene. Before the batch, write into the scene's plan block whatever an accepted note changes on screen — a word, a `start` or `end` state, a seam (both blocks and the **Стыки** line): the checker and the seam check compare against the plan and would undo a change the plan does not know. The same goes for the owner's notes in step 6. Open scene snapshots when a finding or the planned action-phase check needs them; the contact image is only the overview.

After at most two director rounds, show the owner either passing clips or explicitly labelled previews with the unresolved faults. `ok: false`, `unfixed` findings and failed seams block finished delivery; the round limit never waives them. Semantic failures go to the director for a plan correction, not into optional taste notes.

## 6. Render and show

Render one scene at a time — each render runs its own browser — in the background, in one shell loop over the scene folders:

```bash
npx --yes hyperframes@<version> render --quality delivery --fps 30 --browser-timeout 60 --output "<episode>/assets/motion/<id>.mp4"
```

run from each scene's folder (`--browser-timeout 60`: the page's first load fetches GSAP from the CDN, which sometimes takes longer than the default). After rendering, confirm with `ffprobe` that every clip exists and lasts its `timing.duration`; require an audio stream for planned effects, and no unintended audio when the plan specifies `sound: none`.

Inspect the rendered clips at each planned action's start, midpoint and result, plus their transitions, against `acceptance` and the spoken phrase. The final MP4 may differ from browser snapshots; check a short exported sequence for movement, not just the keyframe.

Send the clips themselves to the chat with the file tool, with each clip's path in the text. Build `node ${CLAUDE_SKILL_DIR}/scripts/sheet.mjs motion/scenes motion/clips.html --clips <episode>/assets/motion`, give the owner the path to open in his own browser — the app's browser pane shows a local page only as a still snapshot under about 1 MB, without the files next to it, so it plays no clips — and ask what to change. Sort his notes per scene, run one `fix` batch, re-render the changed scenes, show again.

When yt-montage called this skill for an authorized whole-video assembly, return passing clips and check results to that assembly and continue it. Individual clip approval is needed only when the owner requested it or a new creative choice requires a decision. Do not stop the assembly just to ask acceptance of each routine revision.

## 7. Mark the sheet

When the owner accepts standalone clips, or the assembly receives passing clips (record these as checked, not owner-approved): in the editing sheet, append ` → assets\motion\<id>.mp4` to the «Откуда» cell of every row the scene's `rows` lists, and add one line to the «Моушен» list: how many clips are in `epNN\assets\motion\` and whether their timing is the estimate or the recorded voice. Edit the cells in place; keep the table's alignment and every other word of the sheet.

## 8. Timing from the cleaned voice

The voice may exist before any motion work. Use the chosen master, whether cleaned or explicitly accepted as-is, never pre-edit timestamps after cuts. For an unreviewed raw recording, follow `PLUGIN_ROOT/skills/yt-montage/references/assembly.md` to decide its treatment first. Its transcript is a whisper.cpp JSON with word times; if there is none yet, make it from that master using a separate analysis copy from `C:\projects\youtube-video`:

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

In scene folders whose timing changed and whose plan includes effects, run `node sfx.mjs`: the old effects track follows the old cues. Skip that command for `sound: none`. Re-render every scene with changed timing, including effect-free scenes, and update the montage sheet. For editable compositions, retime the cues and re-render. For an existing rendered animation, map source phases to the same speech cues: keep active moves readable and adjust holds or individual phases. Record that mapping and inspect the result. Do not globally stretch the whole clip, which also slows every move. A later voice edit invalidates the old cue timing.

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
- Use a contact image to compare overall style; it does not replace action-phase and final-export checks where motion carries the explanation.
- Clips carry the effects assigned by the approved plan, with `sound: none` as an explicit exception. Do not omit requested effects or add unrequested ones. The edit owns narration, music and cuts; no exit animation unless planned.
- The render reads media timing from the HTML before the page script runs: an `<audio>` whose `data-start` the script sets plays at 0. Effects are laid on their cues by the scene's `sfx.mjs` into one track that plays from 0 for the whole scene.
- Use `envelope.mjs` for level and spectral measurements, and listen when playback is available. Those measurements cannot prove the sound matches its source or that a join sounds natural; report any unperformed listening.
- `check` and `snapshot` fail with "Navigation timeout" when GSAP loads slowly from the CDN: `check --timeout 30000`, and re-run a snapshot.
- A scene's timing lives in its CUES line and root `data-duration`; anything placed at a literal second will not follow the voice. The checker flags it — do not wave it through.
- Plan the right source before dispatch: code for diagrams/overlays, image generation for illustrations, Blender or a suitable deterministic 3D runtime for geometry, screencasts for editor actions. List the asset and its role in the plan; workers compose supplied material instead of replacing it with easier but less faithful drawings.
