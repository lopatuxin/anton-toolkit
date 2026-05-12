# YouTube Obsidian Vault

All skills in this plugin persist their output as Markdown files to a fixed Obsidian vault on disk. The chat answer is the same as before, but the same content is ALSO written to a file the user reviews in Obsidian. Treat the vault as the channel's working database.

## Vault root

```
C:\projects\Claude\youtube
```

Fixed path. Do NOT ask the user where to save. Do NOT use any other path. If the root or a required subfolder does not exist, create it (use the Write tool — it creates parent directories automatically; on Bash use `mkdir -p`).

## Folder layout (one folder per tool)

```
C:\projects\Claude\youtube\
├── 00-channel\        # yt-my-channel reports
├── 10-competitors\    # yt-competitors reports (SINGLE and BATCH)
├── 20-ideas\          # yt-ideas batches
├── 30-plans\          # yt-content-plan calendars
├── 40-scripts\        # yt-script — one file per video
├── 50-seo\            # yt-seo — one file per video
├── 60-thumbnails\     # yt-thumbnail — one file per video
└── 70-promo\          # yt-promo — audits, funnel, pinned, end-screens
```

Each skill writes to exactly one folder. The per-skill SKILL.md names which folder.

## Filename convention

Use kebab-case, ASCII only, no spaces, `.md` extension. Two patterns by content type:

- **Dated reports** (channel snapshots, competitor scans, idea batches, content plans, audits):
  `YYYY-MM-DD-<slug>.md`
  Example: `2026-05-12-channel-snapshot.md`, `2026-05-12-niche-batch-scan.md`

- **Per-video artefacts** (scripts, SEO, thumbnails, pinned comments, end-screens):
  `<video-slug>.md`
  Example: `cursor-vykinul-proekt.md`

The video slug is derived from the video's working title: transliterate Russian to Latin (e.g., `Курсор выкинул проект` → `kursor-vykinul-proekt`), lowercase, kebab-case, ≤ 60 chars. The SAME slug is reused across skills so that `40-scripts/<slug>.md`, `50-seo/<slug>.md`, `60-thumbnails/<slug>.md` form a video bundle the user can find by slug in Obsidian.

If a file with the chosen name already exists, append a `-v2`, `-v3`… suffix. Do not overwrite without asking.

## Frontmatter (YAML)

Every file starts with YAML frontmatter. Obsidian indexes these fields for tags, Dataview queries, and the graph view. Required keys depend on type — see per-skill SKILL.md for the exact template. Common shape:

```yaml
---
type: script | seo | thumbnail | idea-batch | content-plan | channel-analysis | competitor-analysis | promo-audit | pinned-comment | end-screen | funnel
date: 2026-05-12
video: "Курсор выкинул проект"        # if applicable
video_slug: kursor-vykinul-proekt     # if applicable
series: logos | crm | standalone      # if applicable
length_min: 12                        # for scripts
tags:
  - youtube/<type>
  - youtube/series/<series>           # if applicable
related:
  - "[[20-ideas/2026-05-12-ideas-batch]]"
  - "[[40-scripts/kursor-vykinul-proekt]]"
---
```

Rules:
- `type` is required, machine-readable, single token from the list above.
- `date` is the date the file was written (YYYY-MM-DD). Use the current session date.
- `tags` always include `youtube/<type>`. Add `youtube/series/<series>` if the artefact belongs to a flagship series.
- `related` lists Obsidian wiki-links to other vault files this artefact references. Use the path relative to the vault root, without the `.md` extension (Obsidian's convention).

## Wiki-links between files

Cross-reference using Obsidian's `[[wiki-link]]` syntax in both frontmatter `related:` and inline body text. Examples:

- A script body links to the idea it came from: `> Based on idea: [[20-ideas/2026-05-12-ideas-batch#Idea-3]]`
- An SEO file links to the script: `Script: [[40-scripts/kursor-vykinul-proekt]]`
- A thumbnail file links to script and SEO: `Pair with [[40-scripts/kursor-vykinul-proekt]] and [[50-seo/kursor-vykinul-proekt]]`

Keep wiki-link paths vault-root-relative (e.g., `20-ideas/2026-05-12-ideas-batch`, not absolute).

## Body content

After the frontmatter, write the SAME content the skill would have produced in chat — its standard output format (calendar table, script, SEO block, thumbnail concept brief, etc.). The vault file IS the deliverable, not a summary of it. Do not strip sections, do not paraphrase.

## Write procedure for the skill

1. Build the report content as normal (no change to the skill's analytical logic).
2. Compute filename from the rules above.
3. Compose frontmatter from the rules above. Fill `related:` with any vault files referenced earlier in the conversation that this artefact depends on (e.g., a script depends on an idea batch).
4. Write the file using the Write tool to the absolute path `C:\projects\Claude\youtube\<folder>\<filename>.md`.
5. After writing, tell the user in Russian where the file landed, e.g.:
   `Сохранено в обсидиан-vault: \`C:\projects\Claude\youtube\40-scripts\kursor-vykinul-proekt.md\`.`
6. Still show the content in chat (so downstream skills in the same session can read it from context).

## Boundaries

- Do not write anywhere outside `C:\projects\Claude\youtube\`.
- Do not create new top-level folders beyond the 8 listed above. If a new content type emerges, ask the user before adding a folder.
- Do not write binary files (PNG/JPG/PDF). Only Markdown.
- Do not silently overwrite existing files — use the `-vN` suffix or ask.
