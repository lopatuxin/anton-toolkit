---
name: yt-script
description: >
  IMPORTANT: Invoke this skill via the Skill tool IMMEDIATELY when the user
  asks to write a video script, structure a video, draft a hook, or outline
  acts of a video. Do NOT skip — this skill contains hook formulas,
  structures, CTA placement and pacing rules in references/.

  Trigger phrases (Russian): "сценарий для видео", "напиши сценарий", "сделай
  сценарий", "структура ролика", "hook для видео", "хук для видео", "скрипт
  ролика", "распиши ролик", "набросай сценарий", "план ролика".

  Output is in Russian. Maximum length cap: 20 min.
---

# yt-script — write a video script

Produce a full Russian-language script: hook (first 15 sec) → acts → CTA → outro. Length capped at 20 min equivalent (~2400 spoken words).

## Procedure

1. **Get inputs.** Required:
   - The idea (working title, hook line, type, series, target audience). Pull from conversation if a `yt-ideas` output is present.
   - Target length in minutes (default: 12 min for tutorial/case, 18 min for flagship episode).
   - Whether this is a flagship series episode (and if yes, which series + previous episode state).

   If any input is missing, ask once before writing.

2. **Pick the structure** in `references/structure.md` based on type:
   - Tutorial / how-to → 4-act structure
   - Case study / build-along → narrative arc
   - Tool review / opinion → claim → evidence → counter-evidence → verdict
   - Flagship episode → state-recap → goal → struggle → resolution → next-episode hook

3. **Pick the hook formula** from `references/hook-formulas.md`. The hook is the first 15 seconds — the most important 30–60 spoken words. Test the formula against the idea: it must answer "почему мне смотреть дальше" in one beat.

4. **Place the CTA** using `references/cta.md`:
   - Lead-gen anchor video → CTA mid-roll (40–60% mark) and end-roll. Soft mention in opening.
   - Flagship series → end-roll CTA only (audience already invested).
   - Tutorial / tool review → end-roll CTA only.

   Use `{{SITE_URL}}` placeholder until the site is live. Soft fallback: "контакты в закреплённом комментарии".

5. **Apply pacing rules** from `references/structure.md`:
   - One concrete payoff every 2 minutes. No "filler" stretches.
   - B-roll suggestion every 30–60 seconds in `[B-ROLL: …]` brackets.
   - Cut a section if it does not pay off.

6. **Write the script.** Use the output format below.

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

[B-ROLL: <suggestion>]

## Act 1 — <name> (0:15–N:NN)

<text>

[B-ROLL: <suggestion>]

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
- Open questions for the recording: <list anything the script left under-specified, e.g., "show the prompt template on screen at 4:30">
- Files / repos / screenshots needed: <list>
```

## Save to vault

After producing the script in chat, persist it to the Obsidian vault following `${CLAUDE_PLUGIN_ROOT}/references/vault.md`.

- Target folder: `C:\projects\Claude\youtube\40-scripts\`.
- Filename: `<video-slug>.md`. The slug is derived from the working title — transliterate Russian to Latin, lowercase, kebab-case, ≤ 60 chars. Reuse this exact slug across `40-scripts/`, `50-seo/`, `60-thumbnails/` so the three files form a video bundle. If a script with this slug already exists, append `-v2`, `-v3`…
- Frontmatter:

  ```yaml
  ---
  type: script
  date: <YYYY-MM-DD>
  video: "<working title in Russian>"
  video_slug: <slug>
  video_type: tutorial | case | flagship | review | lead-gen
  series: logos | crm | standalone
  length_min: <N>
  hook_formula: "<name from references/hook-formulas.md>"
  cta_placement: opening-soft | mid-roll | end-roll
  tags:
    - youtube/script
    - youtube/series/<series>
  related:
    - "[[20-ideas/<ideas-file>]]"   # the idea this script came from, if any
    - "[[50-seo/<slug>]]"           # forward link — SEO file for the same video
    - "[[60-thumbnails/<slug>]]"    # forward link — thumbnail file for the same video
  ---
  ```

  The forward links to `50-seo/` and `60-thumbnails/` are intentional even if those files don't exist yet — Obsidian renders them as creatable links.

- Body: the full script in the format above (Hook, Acts, CTAs, Production notes) — same content as the chat output.
- After writing, tell the user in Russian where the file landed.

## Boundaries

- Do not write the title, description, tags, or thumbnail concept here — those are `yt-seo` and `yt-thumbnail`.
- Do not improvise the idea — if the user did not give one and there is no `yt-ideas` output, ask.
- Do not exceed 20 min length cap.
- Russian language for all spoken text. English allowed in code blocks, tool names, and tags.
