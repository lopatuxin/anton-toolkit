# Scene sound — the effects a motion clip carries

A drawn scene sounds like what happens in it: the quill scratches while letters appear, paper rustles while a scroll unrolls, wooden rolls knock, a candle crackles under everything. The owner rejected a silent chronicler clip (2026-10-16: "где звук? … а не просто тишина"). The clip carries only these effects; the voice and the music stay the edit's.

The plan block's `sound` line says what is heard on which cue. The scene worker builds it after the picture, in the same folder. Nobody on this pipeline can hear: every choice below is made and checked by measurement.

`<scripts>` below is this skill's `scripts` folder — the sibling of the `references` folder that holds this file.

## Sources

Real recordings, not synthesis — a synthesized rustle cannot be judged without ears, a recording sounds right by itself.

- Freesound, license CC0 only (monetization, no attribution). Search: `https://freesound.org/search/?q=<words>&f=license:%22Creative+Commons+0%22`; `curl` the result page and take the `/people/<user>/sounds/<id>/` links. The sound page holds a preview `https://cdn.freesound.org/previews/…-hq.mp3` that downloads without signing in; its page also shows the license — keep only `Creative Commons 0`.
- Download into a new empty folder of your own, never into the scene's `assets\`; cut the pieces you use into `assets\sfx\src\` as 48 kHz stereo WAV, and write each source's Freesound id, title and author at the top of `sfx.mjs`.
- The HyperFrames bundled library (`media-use/audio/assets/sfx`) is UI sounds — clicks, whooshes, chimes; it has no quill, paper or wood. Its online library needs a HeyGen sign-in the owner does not have.

## Choosing a take by measurement

`node <scripts>/envelope.mjs <file> [windowMs] [from] [to]` prints a loudness row and a brightness row (zero crossings per ms). Read them before using a take:

- A scratch (quill, paper) is bright: Z 5–9, with stroke-like bursts in L. A take titled "quill writing" whose Z stays 0–2 is a thump or handling noise — pass it over.
- A hit (wood, knock) is one sharp rise in L then a decay over 0.1–0.3 s; find its onset at a 10 ms window.
- An ambient bed (candle, room) is a steady L with no gaps over the scene's length.

## Cutting

- Cut mp3 with the `atrim` filter, then confirm the onset with `envelope.mjs` at 10 ms: `-ss` before `-i` lands tens of milliseconds off on mp3, and a hit cut at its own onset can end up at the end of the piece.
- A stereo hit is often almost all in one channel: sum the channels (`pan=stereo|c0=0.5*c0+0.5*c1|c1=0.5*c0+0.5*c1`) rather than taking one.

## Laying it out — `sfx.mjs`

Copy `<scripts>/sfx.mjs` into the scene folder; keep its loader, `place` and writer, rewrite the sources and the events. It reads the cues from `scene.json` and writes `assets/sfx/track.wav` for the whole scene:

- Each event stands on the same step as its picture: the same `stepOf` and the same formula the scene's render uses (a letter's moment, a roll's landing step), never a literal second — `retime.mjs` moves the cues and the sound must follow.
- Continuous actions are continuous slices with short fades (a word's letters as one scratch, quiet on spaces and line breaks); impacts are one hit on their step.
- Levels: each source is normalized so its loudest 50 ms sit at −20 dBFS, events are placed in dB relative to that. Aim the result at about −27 dBFS RMS for actions, about −44 for an ambient bed, peak no higher than −3 dBFS — under the voice the edit adds later.

In `index.html` the track is one element, a direct child of the root:

```html
<audio id="sfx" src="assets/sfx/track.wav" data-start="0" data-duration="<root data-duration>" data-track-index="10"></audio>
```

Its `data-duration` equals the root's, so `retime.mjs` rewrites it with the rest. Never time separate `<audio>` elements from the page script: the render reads media timing from the HTML before the script runs and plays such a sound at 0 (checked 2026-10-16).

## After the voice is recorded

`retime.mjs` → `node sfx.mjs` in every scene folder that has one → render. A track built for the old cues plays every sound in the old place.
