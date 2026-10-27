---
name: yt-script
description: >
  Writes the full Russian talk track of a video — hook, acts, CTA placement,
  outro — and saves it to the Obsidian vault, capped at 20 minutes. Picks the
  structure and hook formula by video type, and first calibrates the voice
  against the user's already-written scripts and the transcripts of the
  channel's top videos. Spoken text only: no b-roll or on-screen directions
  (that is `yt-montage`), no title, description, tags or thumbnail (those are
  `yt-seo` and `yt-thumbnail`).
disable-model-invocation: true
---

# yt-script — write a video script

Produce a full Russian-language script: hook (first 15 sec) → acts → CTA → outro. Length capped at 20 min equivalent (~2400 spoken words).

## Step 0 — Load channel knowledge base (if present)

Follow `${CLAUDE_PLUGIN_ROOT}/references/knowledge-base-context.md`. For `yt-script` specifically, when `kb_available: true` read: `индекс.md` and the top 3 `top`-classified video cards in FULL (including transcript bodies).

Use the transcripts to match the user's actual speaking voice: sentence rhythm, recurring transitions, callback phrases, how they open and close videos, how they signpost sections. The script should sound like the same person who recorded the `top` videos — not a generic IT-channel script. Do NOT copy phrases verbatim; calibrate cadence and vocabulary. If the KB is absent, fall back to neutral conversational Russian.

## Step 0b — Calibrate style from existing written scripts (MANDATORY when any exist)

Before writing, read the already-written scripts in the vault folder `C:\projects\obsidian\Проекты\youtube\сценарии\`. These are the user's PREFERRED, hand-approved style — the gold standard for how a script should read. The user has stated that scripts written without this calibration come out stylistically wrong and have to be rewritten almost entirely. Treat this step as required, not optional.

Procedure:
1. List the `.md` files in `сценарии/`. If the folder is empty or absent, skip this step.
2. Select 1–3 reference scripts, prioritising those **closest in meaning/topic** to the script you are about to write (same series, same `video_type`, overlapping subject). A script from the same flagship series is the strongest reference. If nothing is topically close, pick the 2 most recent scripts as a general style anchor.
3. Read the selected reference scripts IN FULL and extract the concrete style fingerprint: sentence length and rhythm, paragraph density, level of directness and informality, how the hook is phrased, how arguments are built ("первое… второе…"), recurring connective phrases, how the host addresses the viewer (ты/вы), how sections open and close, the balance of plain talk vs. jargon.
4. Write the new script so a reader could not tell it apart, by style, from the reference scripts — same voice, same rhythm, same vibe. Match the style; do NOT copy sentences, structure-for-structure, or content verbatim.
5. If a transcript of the user's recorded voice for a previous episode of the same series exists (the montage pipeline keeps it in the episode's production folder, e.g. `C:\projects\youtube-video\<episode>\transcript\voice.words.json` — join the `word` fields), read it too: it is how the user actually speaks, and it outranks the written scripts when the two differ.

Word order and fillers — the gotchas that made a script read as machine-written:
- Plain spoken word order, one thought per clause. Correct: «Илья — силач. Он будет биться со щитом и принимать удары на щит». Incorrect: «Он будет биться со щитом, принимать удары на него, а в уровнях проламывать…», «да и в уровнях он лазает по стенам».
- Hedges and asides («скажем так», «кстати», «если уж на то пошло», «как назло») appear only where the reference scripts or the transcript use them at that kind of spot. Do not sprinkle them to sound conversational — scattered fillers are themselves a machine tell.

This style calibration takes precedence over any generic "good script" instinct. When in doubt about phrasing, mirror how the reference scripts do it.

## Procedure

1. **Get inputs.** Required:
   - The idea (working title, hook line, type, series, target audience). Pull from conversation if a `yt-ideas` output is present.
   - Target length in minutes (default: 12 min for tutorial/case, 18 min for flagship episode).
   - Whether this is a flagship series episode (and if yes, which series + previous episode state).

   If any input is missing, ask once before writing.

   For a flagship series episode, before writing read what the series already promised for this episode: the next-episode hook of the previous script and the `next` field of the channel hub (`C:\projects\obsidian\Проекты\youtube\youtube.md`). When the user names one topic ("собери эпопею с начальным экраном") and the promise lists several (characteristics, hero choice, enemies), the topic is one part of the episode, not the whole video — ask once which it is and what length the part gets. Incorrect: a 15-minute script entirely about the start screen while the hub said episode 4 covers characteristics, hero choice and enemies.

## What goes into the talk track

The viewer watches to see the game (or product) take shape, not how Claude produced it. When the source material is the project's journals, phases and commits:

- **Include what changes things for the player or user**: a mechanic, a rule, a number they will feel, a decision about what the game will be.
- **Leave out the production kitchen** unless the user asks for it: how assets were generated, cut out, cleaned, glued, re-encoded; tooling; performance fixes. Incorrect (all cut by the user as "никому не интересны"): the dark rim left by the green-screen cutout, specks from the image model, which video model needed two clips instead of one, GPU load dropping from 23% to 8%.
- **Do not narrate what the screen already shows** — layout, gestures, what each hero does on hover. The montage shows it. Incorrect: «Слева, как в „Ведьмаке 3", название и меню, а всё остальное место занимает выбор героя…».
- **Do not turn a journal entry's "why" and "rejected" fields into speech.** State the decision; give its reason only when a viewer would actually ask. Incorrect: «В Diablo 3 и 4 герои стоят в парадных доспехах, но тогда экран обещал бы то, чего нет», «Это я подсмотрел у Diablo 2», «Сначала я хотел подписать имена под ногами героев».
- **Do not credit ideas to the AI** («название мне подсказала нейросеть») unless the user wants that in the video.
- **Do not describe what is not built yet** beyond a sentence of plan; where the episode will continue with unbuilt work, leave a placeholder section saying it is written once the work exists. Incorrect: detailing what Vasilisa will turn into and what each form does while the transformation mechanic is undesigned.

2. **Pick the structure** in `${CLAUDE_SKILL_DIR}/references/structure.md` based on type:
   - Tutorial / how-to → 4-act structure
   - Case study / build-along → narrative arc
   - Tool review / opinion → claim → evidence → counter-evidence → verdict
   - Flagship episode → state-recap → goal → struggle → resolution → next-episode hook

3. **Pick the hook formula** from `${CLAUDE_SKILL_DIR}/references/hook-formulas.md`. The hook is the first 15 seconds — the most important 30–60 spoken words. Test the formula against the idea: it must answer "почему мне смотреть дальше" in one beat.

4. **Place the CTA** using `${CLAUDE_SKILL_DIR}/references/cta.md`:
   - Lead-gen anchor video → CTA mid-roll (40–60% mark) and end-roll. Soft mention in opening.
   - Flagship series → end-roll CTA only (audience already invested).
   - Tutorial / tool review → end-roll CTA only.

   Use `{{SITE_URL}}` placeholder until the site is live. Soft fallback: "контакты в закреплённом комментарии".

5. **Apply pacing rules** from `${CLAUDE_SKILL_DIR}/references/structure.md`:
   - One concrete payoff every 2 minutes. No "filler" stretches.
   - Cut a section if it does not pay off.

6. **Write the script** in the style calibrated in Step 0b (reference scripts from `сценарии/`). Use the output format below.

## Output format

```markdown
# Сценарий — <working title>

**Тип:** <tutorial/case/flagship/review>
**Серия:** <Logos/CRM/standalone>
**Длительность:** ~<N> мин (~<N×130> слов)
**Hook formula:** <name from references/hook-formulas.md>
**CTA placement:** <opening soft / mid-roll / end-roll>

---

## Hook (0:00–0:15)

<Russian text, 30–50 spoken words. The actual opening line.>

## Act 1 — <name> (0:15–N:NN)

<text>

## Act 2 — <name> (N:NN–N:NN)

…

## CTA — mid-roll (only for lead-gen videos) (N:NN)

<text — see references/cta.md for the wording>

## Act 3 — <name>

…

## CTA — end-roll (N:NN)

<text>

## Next episode hook (only for flagship series) (N:NN)

<one line — what episode N+1 will tackle>

---

## Production notes

- Estimated record time: <N min>
- Open questions for the recording: <list anything the script left under-specified about the spoken content, e.g., "confirm the exact tool version mentioned at 4:30">
- Files / repos needed for the talk track: <list>
```

## Save to vault

After producing the script in chat, persist it to the Obsidian vault following `${CLAUDE_PLUGIN_ROOT}/references/vault.md`.

- Target folder: `C:\projects\obsidian\Проекты\youtube\сценарии\`.
- Filename: `<video-slug>.md`. The slug is derived from the working title — keep it in Russian (Cyrillic), do NOT transliterate to Latin. Lowercase, kebab-case, strip punctuation, ≤ 60 chars. Example: `Курсор выкинул проект` → `курсор-выкинул-проект.md`. Reuse this exact slug across `сценарии/`, `seo/`, `превью/` so the three files form a video bundle. If a script with this slug already exists, append `-v2`, `-v3`…
- Frontmatter:

  ```yaml
  ---
  type: script
  date: <YYYY-MM-DD>
  video: "<working title in Russian>"
  video_slug: <slug>             # Cyrillic kebab-case, same as filename without .md
  video_type: tutorial | case | flagship | review | lead-gen
  series: logos | crm | standalone
  length_min: <N>
  hook_formula: "<name from references/hook-formulas.md>"
  cta_placement: opening-soft | mid-roll | end-roll
  tags:
    - youtube/script
    - youtube/series/<series>
  related:
    - "[[Проекты/youtube/идеи/<ideas-file>]]"    # the idea this script came from, if any
    - "[[Проекты/youtube/seo/seo-<slug>]]"           # forward link — SEO file for the same video
    - "[[Проекты/youtube/превью/<slug>]]"        # forward link — thumbnail file for the same video
  ---
  ```

  The forward links to `seo/` and `превью/` are intentional even if those files don't exist yet — Obsidian renders them as creatable links.

- Body: the full script in the format above (Hook, Acts, CTAs, Production notes) — same content as the chat output.
- After writing, tell the user in Russian where the file landed.

## Boundaries

- Do not write the title, description, tags, or thumbnail concept here — those are `yt-seo` and `yt-thumbnail`.
- Do NOT include any editing/visual directions in the script: no B-roll suggestions, no `[B-ROLL: …]` markers, no "show X on screen", no shot/cut/overlay instructions, no descriptions of what the viewer sees. The script is the spoken talk track ONLY (hook, acts, CTAs, outro). All on-screen/visual planning belongs to `yt-montage`, which consumes the finished script. Correct: a script line is something the host says aloud. Incorrect: "[B-ROLL: terminal with error]" or "show the prompt template on screen at 4:30".
- Do not improvise the idea — if the user did not give one and there is no `yt-ideas` output, ask.
- Do not exceed 20 min length cap.
- Russian language for all spoken text. English allowed in code blocks, tool names, and tags.
