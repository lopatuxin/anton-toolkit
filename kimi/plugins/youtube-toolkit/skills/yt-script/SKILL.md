---
name: yt-script
description: Develops a Russian video outline or full spoken script from the viewer's question, documented events and approved voice references. Use for script writing, rewriting or structure requests. Saves completed scripts to Obsidian, capped at 20 minutes. Plans evidence before prose; detailed editing sheets belong to yt-montage and final packaging to yt-seo and yt-thumbnail.
---

<!-- Generated from plugins/youtube-toolkit/skills/yt-script/SKILL.md; edit that source, then run npm run build. -->

## Kimi runtime

Read PLUGIN_ROOT/kimi-runtime.md before using this procedure.


# yt-script — write a video script

Develop the viewer promise, evidence-backed outline, then spoken prose. Honor the requested stage: discussion stays in chat without searches or writes unless requested; an outline request stops at the outline, without a full script or automatic file. For a full-script request, complete both stages without an extra approval checkpoint. Reuse an outline already agreed in the conversation. Keep the final script within 20 minutes; estimate duration from actual spoken words and the host tempo, not a fixed word cap.

## Step 0 — Load channel knowledge base (if present)

Follow `PLUGIN_ROOT/references/knowledge-base-context.md`. For `yt-script` specifically, when `kb_available: true` read: `индекс.md` and the top 3 `top`-classified video cards in FULL (including transcript bodies).

Use the transcripts to match the user's actual speaking voice: sentence rhythm, recurring transitions, callback phrases, how they open and close videos, how they signpost sections. The script should sound like the same person who recorded the `top` videos — not a generic IT-channel script. Do NOT copy phrases verbatim; calibrate cadence and vocabulary. If the KB is absent, fall back to neutral conversational Russian.

## Step 0b — Calibrate style from existing written scripts (MANDATORY when any exist)

Read the relevant channel-style note and 1–3 suitable scripts under `C:\projects\obsidian\Проекты\youtube\сценарии\` (including series subfolders). A file being present does not make it approved. Use `script_status: approved` or explicit owner approval in the current conversation as evidence; otherwise treat it as a draft, not a voice standard. Prioritize approved examples from the same channel and topic. If none exist, use actual recorded speech or channel transcripts; do not silently promote the newest draft.

Read selected references in full. Match plain word order, rhythm, transitions, concrete comparisons and the host's form of address, without copying their plot or forcing their structure onto another genre. When available, read the recorded voice transcript for the same series (for example `C:\projects\youtube-video\<episode>\transcript\voice.words.json`; join the actual word field, `word` or `w`). Recorded speech outranks a written draft.

Keep corrections scoped: channel greetings belong to that channel's style note, preferred terminology to its voice, and a correction about one experiment to that experiment. For autonomous AI helpers use the owner's term «агент», explaining it briefly if the audience needs it. Do not replace it with repeated “copies of the neural network.” Do not turn a factual correction about one input photograph into a general rule for other videos.

Word order and fillers — the gotchas that made a script read as machine-written:
- Plain spoken word order, one thought per clause. Correct: «Илья — силач. Он будет биться со щитом и принимать удары на щит». Incorrect: «Он будет биться со щитом, принимать удары на него, а в уровнях проламывать…», «да и в уровнях он лазает по стенам».
- Hedges and asides («скажем так», «кстати», «если уж на то пошло», «как назло») appear only where the reference scripts or the transcript use them at that kind of spot. Do not sprinkle them to sound conversational — scattered fillers are themselves a machine tell.

This style calibration takes precedence over any generic "good script" instinct. When in doubt about phrasing, mirror how the reference scripts do it.

## Procedure

1. **Get inputs.** Required:
   - The idea (working title, hook line, type, series, target audience). Pull from conversation if a `yt-ideas` output is present.
   - Target length in minutes (default: 12 min for tutorial/case, 18 min for flagship episode).
   - Whether this is a flagship series episode (and if yes, which series + previous episode state).

   Infer inputs from the conversation and project material first. Ask only about a consequential choice the owner has not made, such as broad audience versus experienced tool users. Do not ask for a hook the script should develop. Default lengths are estimates, not targets to fill.

   For a flagship series episode, before writing read what the series already promised for this episode: the next-episode hook of the previous script and the `next` field of the channel hub (`C:\projects\obsidian\Проекты\youtube\youtube.md`). When the user names one topic ("собери эпопею с начальным экраном") and the promise lists several (characteristics, hero choice, enemies), the topic is one part of the episode, not the whole video — ask once which it is and what length the part gets. Incorrect: a 15-minute script entirely about the start screen while the hub said episode 4 covers characteristics, hero choice and enemies.

## What goes into the talk track

For a product or game devlog, foreground what changes for its user. For a video explicitly about a tool or production experiment, explain the method where it resolves a concrete viewer question. The following production-detail exclusions apply to devlogs, not a blanket ban on the subject of a tool experiment:

- **Include what changes things for the player or user**: a mechanic, a rule, a number they will feel, a decision about what the game will be.
- **Leave out the production kitchen** unless the user asks for it: how assets were generated, cut out, cleaned, glued, re-encoded; tooling; performance fixes. Incorrect (all cut by the user as "никому не интересны"): the dark rim left by the green-screen cutout, specks from the image model, which video model needed two clips instead of one, GPU load dropping from 23% to 8%.
- **Do not narrate what the screen already shows** — layout, gestures, what each hero does on hover. The montage shows it. Incorrect: «Слева, как в „Ведьмаке 3", название и меню, а всё остальное место занимает выбор героя…».
- **Do not turn a journal entry's "why" and "rejected" fields into speech.** State the decision; give its reason only when a viewer would actually ask. Incorrect: «В Diablo 3 и 4 герои стоят в парадных доспехах, но тогда экран обещал бы то, чего нет», «Это я подсмотрел у Diablo 2», «Сначала я хотел подписать имена под ногами героев».
- **Do not credit ideas to the AI** («название мне подсказала нейросеть») unless the user wants that in the video.
- **Do not describe what is not built yet** beyond a sentence of plan; where the episode will continue with unbuilt work, leave a placeholder section saying it is written once the work exists. Incorrect: detailing what Vasilisa will turn into and what each form does while the transformation mechanic is undesigned.

2. **Set the viewer promise and gather evidence.** State who is watching, what they already know, and the one question the video answers. Respect any agreed title/thumbnail promise; final packaging stays with the sibling skills. Read the applicable research note `C:\projects\obsidian\Проекты\youtube\Как писать сценарии для YouTube.md` when available. Keep its evidence distinctions: educational research, creator experience and craft advice are not universal retention laws.

   Separate source facts, explicit owner corrections, and inferences. Trace numbers and first-person claims to material; do not invent feelings, failures, personal working time or inability to calculate a price. If an owner correction conflicts with a log, preserve that attribution in production notes rather than silently presenting the log as confirmation. Distinguish elapsed machine work, hands-on time, calculated usage cost and actual payment.

3. **Build the outline before prose.** Use `${KIMI_SKILL_DIR}/references/structure.md` as options, not compulsory acts. For each section identify the viewer question, concrete event/example, result, reason to continue, and available evidence. For experiments, connect real problems, attempts and consequences; for explanations or reviews, use questions and arguments. Do not invent obstacles to fill an arc or present the order of explanation as the historical order of experiments.

   Example: references improve the model, but a reference is distorted; measurements help, but a silhouette misses detached parts; review finds defects, but the owner still catches another. Incorrect: explain five plugin rules before the viewer has seen why they matter, or reuse this exact chain for every subject.

   Identify which existing images, recordings or comparisons support key claims, and which are missing. This is evidence planning, not a shot list. Keep the evidence map in separate production notes for `yt-montage`; never insert visual directions into spoken prose or imply a missing recording exists.

4. **Write the talk track.** Explain a method when the problem makes it useful. Use `${KIMI_SKILL_DIR}/references/hook-formulas.md` as optional opening patterns; confirm the promise early without a fixed 15-second quota. A visible result may open the video while the remaining question concerns effort, limits or cost. Use the calibrated voice and approved channel greeting, without transferring another channel's introduction.

   Place only the CTA appropriate to the agreed purpose; `${KIMI_SKILL_DIR}/references/cta.md` supplies options, not authorization to add a sales pitch. Close the main question, then end briefly without a second recap. Do not pad to a default duration.

5. **Editorial pass.** Cut explanations that precede the viewer's need, lists of visible details, repeated conclusions, canned suspense, sentence fragments for drama and invented first-person claims. Check that each promised answer arrives, each retained number has a source, and user corrections survive. Count spoken words only and estimate timing with the host's measured tempo (or a labeled estimate if absent). Do not claim a read-aloud or audience test took place when it did not.

## Outline-only output

Give the central question and proposed sections with their purpose, concrete evidence, transitions and provisional duration. Stop there when the user asked for structure first. Save it only when requested; do not automatically proceed to a script or montage.

## Output format

Use Russian section names suited to the agreed outline; the acts below are illustrative, not a required count or order.

```markdown
# Сценарий — <working title>

**Тип:** <tutorial/case/flagship/review>
**Серия:** <Logos/CRM/standalone>
**Длительность:** ~<N> мин (<actual spoken word count> слов; tempo stated as measured or estimated)
**Начало:** <chosen approach; optional pattern name>
**CTA placement:** <opening soft / mid-roll / end-roll>

---

## Начало (<estimated range>)

<The actual Russian opening, sized to the promise and host tempo.>

## <Section name> (<estimated range>)

<text>

## <Next section name> (<estimated range>)

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

- Estimated record time: <N min; spoken words and tempo; pauses separate>
- Open questions for the recording: <list anything the script left under-specified about the spoken content, e.g., "confirm the exact tool version mentioned at 4:30">
- Files / repos needed for the talk track: <list>
- Evidence for key sections: <existing assets, source facts, owner corrections, missing material; not spoken>
```

## Save to vault

After producing the script in chat, persist it to the Obsidian vault following `PLUGIN_ROOT/references/vault.md`.

- Target folder: `C:\projects\obsidian\Проекты\youtube\сценарии\`.
- Filename: `<video-slug>.md`. The slug is derived from the working title — keep it in Russian (Cyrillic), do NOT transliterate to Latin. Lowercase, kebab-case, strip punctuation, ≤ 60 chars. Example: `Курсор выкинул проект` → `курсор-выкинул-проект.md`. Reuse this exact slug across `сценарии/`, `seo/`, `превью/` so the three files form a video bundle. If a script with this slug already exists, append `-v2`, `-v3`…
- Frontmatter:

  ```yaml
  ---
  type: script
  script_status: draft          # approved only after explicit owner acceptance of this version
  date: <YYYY-MM-DD>
  video: "<working title in Russian>"
  video_slug: <slug>             # Cyrillic kebab-case, same as filename without .md
  video_type: tutorial | case | flagship | review | lead-gen
  series: logos | crm | standalone
  length_min: <N>
  hook_formula: "<chosen approach or optional pattern name>"
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

- When the owner explicitly accepts a version, mark that script `script_status: approved`; a newly rewritten version starts as `draft` until accepted. Never infer approval from silence or file existence.
- Body: the full script in the format above (Hook, Acts, CTAs, Production notes) — same content as the chat output.
- After writing, tell the user in Russian where the file landed.

## Boundaries

- Do not write the title, description, tags, or thumbnail concept here — those are `yt-seo` and `yt-thumbnail`.
- Do NOT include any editing/visual directions in the script: no B-roll suggestions, no `[B-ROLL: …]` markers, no "show X on screen", no shot/cut/overlay instructions, no descriptions of what the viewer sees. The script is the spoken talk track ONLY (hook, acts, CTAs, outro). Detailed shots and editing belong to `yt-montage`. Keep the earlier evidence map outside the spoken text in production notes so montage can use it. Correct: a script line is something the host says aloud. Incorrect: "[B-ROLL: terminal with error]" or "show the prompt template on screen at 4:30".
- Do not improvise the idea — if the user did not give one and there is no `yt-ideas` output, ask.
- Do not exceed 20 min length cap.
- Russian language for all spoken text. English allowed in code blocks, tool names, and tags.
