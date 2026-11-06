# The style round — 2–4 looks on one scene, the owner picks

The channel has no house style: every video gets its own, chosen by the owner from still sketches before anything moves. The round costs one parallel sketch pass and one look from the owner; picking a style after animation would mean redrawing every scene.

## When it is skipped

The owner names a style from the library ("как во втором ролике", a series name, a style's name) — copy its `frame.md` and fonts into `motion\` and go to the full plan; there is no candidate drawing then, and every scene, the sample included, is drawn in the animate pass. A video in a series offers the series' style as one of the candidates rather than skipping, unless the owner said to reuse it.

## Inputs

- The video's direction: the editing sheet's «Оформление» and «Моушен» sections and the owner's words in the conversation ("сказочный и круче Билибина").
- What was rejected: the channel journal (`C:\projects\obsidian\Проекты\youtube\Журнал YouTube\`, titles first, open only the visual ones) and the sheet's «Заметки». A rejected look is never a candidate.
- The library: `C:\projects\youtube-video\styles\` and its list in `C:\projects\obsidian\Проекты\youtube\Монтаж через Claude.md`.

## Diverge before you converge

Before writing any style, answer for yourself, concretely for this video: what does its subject look like in its own world (a chronicle by candlelight: birch bark, cinnabar, gold leaf, quill strokes); what does the feeling of the scene look like as a frame; what does every other video on this subject look like — that is the anti-pattern, and at least one candidate must sit far from it. Sample the candidates from different paths — the subject's own craft (lacquer miniature, carved wood, embroidery, woodcut lubok, illuminated manuscript), the emotion, a medium (paper cut-out, ink on wet paper, shadow theatre), the anti-pattern inverted. Two candidates with the same silhouette — the same kind of line, fill and layout — are one candidate; replace one. Every candidate still satisfies the direction: "сказочный" excludes a corporate flat explainer however fresh it is.

Three candidates by default, four when the direction is wide open, two when the owner already narrowed it.

## Each candidate

- `motion\styles\<slug>\frame.md` — a HyperFrames design spec (`hyperframes-creative/references/design-spec.md`): frontmatter tokens (colors by role with hex, typography — display, text, label — with weights and sizes, spacing, components) and prose sections: Overview (the look in two sentences), Drawing (line weight and character, fill, texture, how a character and a prop are built from parts), Graphics (how the video's diagrams, lists, labels, cards and red marks over a picture look in this style — most scenes of a video are these, not characters), Type (how words sit on the frame), Motion (easing, tempo, smooth or stepped — e.g. drawn-on-twos at 12 fps — camera, how characters idle), Do / Don't. The motion section matters as much as the palette: the owner chose motion "круче", and the stills cannot show it, so it is written down here and shown in the animate pass.
- Fonts in `motion\styles\<slug>\assets\fonts\` as files. Every font must cover Cyrillic — check the file, not the name, with this skill's `scripts/cyrillic.mjs <files>` (a Latin-only display face renders Russian in a fallback). Google Fonts families are fetched from `https://github.com/google/fonts` (`ofl/<family>/`; rename a variable font's `Name[wght].ttf` to `Name-VF.ttf`, brackets break the URL in `@font-face`); Kurale, Ruslan Display, Yeseva One, Lora, PT Serif, Alegreya, Comfortaa, Philosopher are among the Cyrillic ones.
- A scene folder `motion\styles\<slug>\` built like any scene: the `_template` files, `assets\` with the fonts and the media the sample block lists, and `scene.json` with the sample scene's `phrase`, `lead` and `tail` plus `title` = the style's Russian name and `note` = one plain sentence about it. Run this skill's `scripts/retime.mjs motion/styles` so every candidate has its duration and cues, then sketch them all by the workflow in `sketch` mode — `frame` = that style's `frame.md`, `block` = the sample scene's id.

## The sample scene

One scene from the plan, the one hardest for a style: a drawn character with an on-screen word beats a diagram, because a style that can draw the character can also draw the boxes, and not the other way round. Name it in the plan above the first scene.

## Showing the owner

Build the page with `sheet.mjs` (`motion\styles` → `motion\styles.html`) and look at `styles.png` yourself first, with the checkers' art notes beside it: a candidate that came out broken, lopsided, or indistinguishable from another is re-sketched with your notes as one batch before the owner sees it. Then open the page for the owner in the app's browser pane (`sheet.mjs` embeds the pictures small, because the pane shows a local page only as a snapshot under about 1 MB without the files next to it), give him the path too, and ask one thing — which style, or which mix ("цвета второго, линии третьего"). Describe each in one plain sentence; no font names or hex.

A mix is written as a new `frame.md` and sketched once more on the same scene before the round closes.

## Saving the choice

- `motion\frame.md` and `motion\assets\fonts\` ← the chosen candidate.
- The library: `C:\projects\youtube-video\styles\<slug>\` ← `frame.md`, `assets\fonts\`, `index.html` and `keyframe.png` of the sample. The slug is Latin kebab-case and names the look, not the video (`lacquer-miniature`, not `ep02`).
- One line in the «Библиотека стилей» section of `C:\projects\obsidian\Проекты\youtube\Монтаж через Claude.md`: Russian name — one sentence — first video — the library path. The candidates not chosen stay in the episode folder only.
