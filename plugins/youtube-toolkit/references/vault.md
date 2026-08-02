# YouTube Obsidian Vault

All skills in this plugin persist their output as Markdown files to a fixed Obsidian vault on disk. The chat answer is the same as before, but the same content is ALSO written to a file the user reviews in Obsidian. Treat the vault as the channel's working database.

## Vault root

```
C:\projects\obsidian\youtube
```

Fixed path. Do NOT ask the user where to save. Do NOT use any other path. If the root or a required subfolder does not exist, create it (use the Write tool — it creates parent directories automatically; on Bash use `mkdir -p`).

**This folder is NOT a standalone vault — it is one folder inside the user's personal Obsidian vault whose root is `C:\projects\obsidian`.** Two consequences bind every skill in this plugin:

1. The vault's own conventions apply here (hub notes per folder, Russian file names, wiki-links). See the hub-note rule below.
2. Wiki-link paths are resolved from `C:\projects\obsidian`, NOT from the `youtube\` folder. Every wiki-link this plugin writes therefore carries the `youtube/` prefix — see the wiki-links section.

The `C:\projects\obsidian` vault is auto-committed by the obsidian-git plugin every 10 minutes. Never write binary or large media files here (see Boundaries).

## Folder layout (one folder per tool)

```
C:\projects\obsidian\youtube\
├── канал\           # yt-my-channel reports (dated channel snapshots)
├── конкуренты\      # yt-competitors reports (SINGLE and BATCH)
├── идеи\            # yt-ideas batches
├── контент-план\    # yt-content-plan calendars
├── сценарии\        # yt-script — one file per video
├── монтаж\          # yt-montage — editing sheet, one file per video
├── seo\             # yt-seo — one file per video
├── превью\          # yt-thumbnail — one file per video
├── продвижение\     # yt-promo — audits, funnel, pinned, end-screens
└── база\            # yt-knowledge-base — persistent dataset
    ├── канал.md            # latest channel-level stats (overwritten each run)
    ├── индекс.md           # one-row-per-video index (overwritten each run)
    └── видео\              # one file per video: metadata + transcript + classification
        └── <video-slug>.md
```

Note: `канал\` (dated reports from `yt-my-channel`) and `база\канал.md` (latest snapshot from `yt-knowledge-base`) are different artefacts — do NOT conflate them. The former is a series of analytical reports over time; the latter is the current state of channel-wide stats, always overwritten.

Folder-name rules (strict):
- Folder names are Russian (Cyrillic), lowercase. No numeric prefixes like `10-`, `20-`, no English aliases (`competitors`, `ideas`). The only exception is `seo` because it is a universally recognised acronym.
- Use exactly the ten names above. Do NOT invent variants (`конкуренти`, `канал-обзор`, `idea`, `10-конкуренты`, `knowledge-base`).
- Correct: `C:\projects\obsidian\youtube\конкуренты\2026-05-13-разбор-ниши.md`
- Incorrect: `C:\projects\obsidian\youtube\10-competitors\2026-05-13-niche-batch-scan.md`

Each skill writes to exactly one folder. The per-skill SKILL.md names which folder.

## Hub note per folder (mandatory)

The host vault uses the folder-notes plugin: every folder MUST contain a hub note named exactly like the folder (`идеи\идеи.md`, `база\база.md`). Clicking the folder in Obsidian opens that note. A folder without one is dead weight in the UI, and its contents are effectively invisible to the user.

Therefore: **whenever a skill creates a folder that does not exist yet, it creates the folder's hub note in the same step.** Never create a bare folder.

The hub note lists its children with a `dataview` query over the frontmatter this plugin already writes, so new files appear automatically:

````markdown
---
type: hub
tags:
  - youtube/hub
---

# <Folder name in Russian>

<one-line description of what lives in this folder>

```dataview
TABLE date AS "Дата", video AS "Видео"
FROM "youtube/<folder>"
WHERE type != "hub"
SORT date DESC
```
````

- `FROM` takes the path from the Obsidian vault root, so it always starts with `youtube/`.
- Pick the displayed columns from the frontmatter that folder's artefacts actually carry (`date`, `video`, `series`, `length_min`).
- If the hub note already exists, leave it alone — do NOT overwrite the user's own text.

## Filename convention

Use Russian (Cyrillic), lowercase, kebab-case, no spaces, `.md` extension. Two patterns by content type:

- **Dated reports** (channel snapshots, competitor scans, idea batches, content plans, audits):
  `YYYY-MM-DD-<russian-slug>.md`
  Example: `2026-05-12-обзор-канала.md`, `2026-05-13-разбор-ниши.md`, `2026-05-12-идеи.md`, `2026-05-12-контент-план-8нед.md`

- **Per-video artefacts** (scripts, editing sheets, SEO, thumbnails, pinned comments, end-screens):
  `<video-slug>.md`
  Example: `курсор-выкинул-проект.md`

The video slug is derived from the video's working title: keep it in Russian (Cyrillic), do NOT transliterate to Latin. Lowercase, kebab-case (spaces → `-`), strip punctuation, ≤ 60 chars. Example: `Курсор выкинул проект` → `курсор-выкинул-проект`. The SAME slug is reused across skills so that `сценарии/<slug>.md`, `seo/<slug>.md`, `превью/<slug>.md` form a video bundle the user can find by slug in Obsidian.

Filename rules (strict):
- Russian (Cyrillic), lowercase, kebab-case. Do NOT transliterate to Latin (`kursor-vykinul-proekt.md` is WRONG).
- Do NOT use English words for content type (`niche-batch-scan`, `channel-snapshot`, `ideas-batch`). Use Russian equivalents (`разбор-ниши`, `обзор-канала`, `идеи`).
- The only ASCII tokens allowed inside a slug are: the ISO date prefix `YYYY-MM-DD`, the `seo` acronym, and proper-noun tool names where the brand itself is Latin (`Cursor`, `Claude`, `Jarvis`) — but Russian wording around them stays Cyrillic.
- Correct: `2026-05-13-разбор-ниши.md`, `курсор-выкинул-проект.md`, `seo/курсор-выкинул-проект.md`
- Incorrect: `2026-05-13-niche-batch-scan.md`, `kursor-vykinul-proekt.md`, `10-competitors/scan.md`

If a file with the chosen name already exists, append a `-v2`, `-v3`… suffix. Do not overwrite without asking.

## Frontmatter (YAML)

Every file starts with YAML frontmatter. Obsidian indexes these fields for tags, Dataview queries, and the graph view. Required keys depend on type — see per-skill SKILL.md for the exact template. Common shape:

```yaml
---
type: script | montage | seo | thumbnail | idea-batch | content-plan | channel-analysis | competitor-analysis | promo-audit | pinned-comment | end-screen | funnel
date: 2026-05-12
video: "Курсор выкинул проект"        # if applicable
video_slug: курсор-выкинул-проект     # if applicable, Cyrillic kebab-case
series: logos | crm | standalone      # if applicable
length_min: 12                        # for scripts
tags:
  - youtube/<type>
  - youtube/series/<series>           # if applicable
related:
  - "[[youtube/идеи/2026-05-12-идеи]]"
  - "[[youtube/сценарии/курсор-выкинул-проект]]"
---
```

Rules:
- `type` is required, machine-readable, single token from the list above.
- `date` is the date the file was written (YYYY-MM-DD). Use the current session date.
- `tags` always include `youtube/<type>`. Add `youtube/series/<series>` if the artefact belongs to a flagship series.
- `related` lists Obsidian wiki-links to other vault files this artefact references. Use the path relative to the vault root, without the `.md` extension (Obsidian's convention).

## Wiki-links between files

Cross-reference using Obsidian's `[[wiki-link]]` syntax in both frontmatter `related:` and inline body text. Examples:

- A script body links to the idea it came from: `> Based on idea: [[youtube/идеи/2026-05-12-идеи#Idea-3]]`
- An SEO file links to the script: `Script: [[youtube/сценарии/курсор-выкинул-проект]]`
- A thumbnail file links to script and SEO: `Pair with [[youtube/сценарии/курсор-выкинул-проект]] and [[youtube/seo/курсор-выкинул-проект]]`

Path rules (strict):
- Paths are relative to the Obsidian vault root `C:\projects\obsidian`, so they ALWAYS start with `youtube/`. A link that omits the prefix is a bug introduced when this folder was a standalone vault.
- Never use a bare note name. Per-video artefacts deliberately reuse the SAME slug across folders (`сценарии/<slug>`, `монтаж/<slug>`, `seo/<slug>`, `превью/<slug>`), so `[[<slug>]]` is ambiguous and Obsidian cannot resolve which one is meant.
- Never use a Markdown path link — `[Сценарий](youtube/сценарии/slug.md)` is wrong; wiki-links only.
- Correct: `[[youtube/сценарии/курсор-выкинул-проект]]`
- Incorrect: `[[сценарии/курсор-выкинул-проект]]`, `[[курсор-выкинул-проект]]`, `[Сценарий](youtube/сценарии/курсор-выкинул-проект.md)`

## Body content

After the frontmatter, write the SAME content the skill would have produced in chat — its standard output format (calendar table, script, SEO block, thumbnail concept brief, etc.). The vault file IS the deliverable, not a summary of it. Do not strip sections, do not paraphrase.

## Write procedure for the skill

1. Build the report content as normal (no change to the skill's analytical logic).
2. Compute filename from the rules above.
3. Compose frontmatter from the rules above. Fill `related:` with any vault files referenced earlier in the conversation that this artefact depends on (e.g., a script depends on an idea batch).
4. If the target folder does not exist yet, create it together with its hub note (see Hub note per folder). Never leave a folder without a hub.
5. Write the file using the Write tool to the absolute path `C:\projects\obsidian\youtube\<folder>\<filename>.md`.
6. After writing, tell the user in Russian where the file landed, e.g.:
   `Сохранено в обсидиан-vault: \`C:\projects\obsidian\youtube\сценарии\курсор-выкинул-проект.md\`.`
7. Still show the content in chat (so downstream skills in the same session can read it from context).

## Boundaries

- Do not write anywhere outside `C:\projects\obsidian\youtube\`.
- Do not create new top-level folders beyond the 10 listed above. If a new content type emerges, ask the user before adding a folder.
- Do not write binary files (PNG/JPG/PDF) or media (WAV/MP4). Only Markdown. The host vault is auto-committed to git every 10 minutes — media files would be committed with it.
- Never run `git commit` or `git push` in the host vault. The obsidian-git plugin handles that; the skill only leaves files on disk.
- Do not silently overwrite existing files — use the `-vN` suffix or ask.
