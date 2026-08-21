---
name: logos-log
description: >
  The Logos project decision journal in Logos/Журнал/: records a design decision, an experiment or a
  dead end as its own note with Dataview-indexed frontmatter, searches the journal by area / type /
  weight / status / date, and marks an experiment's outcome (worked / failed) adjusting its weight;
  written for the model, no user sign-off; single-shot, no agents. For a personal diary use dnevnik,
  for designing the architecture logos-design, for experiments of the research branch
  (Logos/Исследования/, repo Logos-Lab) logos-lab — this skill only records, searches and updates
  entries.
when_to_use: >
  "/logos-log", "запиши решение logos", "найди в журнале logos", "покажи тупики logos"
---

# Logos-log — the Logos decision journal

The journal is the project's decision log: every decision, experiment, and dead end as a
separate, searchable note — the durable project record, written for the model. Lessons about how to
work, tooling gotchas and the owner's preferences belong to Claude Code auto-memory, not to the
journal. The storage format, file locations, frontmatter fields, and the
self-updating Dataview index are defined in `${CLAUDE_PLUGIN_ROOT}/references/diary-format.md` — **read
it and follow it verbatim**. This skill is the user-facing interface over that format: record, search,
outcome.

**Project context:** the journal records both DESIGN decisions and BUILD decisions. Where the Logos
code lives, where the docs live, and how they stay in sync is described in
`${CLAUDE_PLUGIN_ROOT}/references/logos-project.md` — read it so build-related entries use the right `область` and link to
the right artifacts. An experiment of the RESEARCH BRANCH (`Logos/Исследования/`, repo `Logos-Lab` —
see that reference's §10) is NOT a journal entry — route it to the `logos-lab` skill; the journal
keeps only cross-cutting project decisions about the branch (e.g. a matured conclusion entering the
main design).

## 0. Setup (every run)

Locate the vault and ensure the journal folder + folder note exist exactly as described in
`${CLAUDE_PLUGIN_ROOT}/references/diary-format.md` sections 1–2 (idempotent — create only what is
missing, never overwrite).
If the vault is not found, tell the user in Russian as that reference instructs, then stop.

## 1. Determine the mode

Infer the mode from the user's argument / request:
- **RECORD** — the user states a decision / experiment / dead end to capture (default when they
  dictate content): "запиши решение…", "залогируй…", or just describes what was decided/tried.
- **SEARCH** — "найди…", "что решали по <тема>", "покажи тупики", "покажи решения с весом ≥ N".
- **OUTCOME** — "отметь результат…", "эксперимент сработал/провалился", updating an existing entry's
  result and weight.

If ambiguous, ask the user in Russian which they want, in one short question.

## 2. RECORD mode

1. Get the content from the user. If nothing was dictated, ask in Russian: «Диктуй решение — запишу в журнал.» and wait. Never create an empty entry.
2. Classify with the user's words (ask briefly only if you cannot infer): `тип` (решение / эксперимент / тупик / откат / наблюдение) and `область` (оркестрация / память / модели / автономность / ресурсы / общее).
3. Set initial frontmatter per `${CLAUDE_PLUGIN_ROOT}/references/diary-format.md` section 4: today's `дата`, the `тип` and
   `область`, `вес: 5` (default), `статус` (`принято` for a decision, `проверяется` for an
   experiment, `тупик`/`откат` for those).
4. Write the entry as a NEW note at `$VAULT/Logos/Журнал/<YYYY-MM-DD>-<краткое-русское-имя>.md`
   using the body template in the reference. Capture faithfully — clean mechanics only, do not invent
   or embellish (it is the user's record).
5. Confirm in Russian, one line: «Записал в журнал: `Logos/Журнал/<имя>.md` (тип: <тип>, область: <область>, вес: 5).»

## 3. SEARCH mode

The journal is built to be queried, not scrolled. Two complementary ways:
1. **In-conversation search:** grep the frontmatter of files in `$VAULT/Logos/Журнал/` by the field
   the user asked about — `область`, `тип`, `статус`, `вес` (numeric threshold), or `дата` (range) —
   and return the matching entries as a short Russian list (file link + one-line summary), sorted
   sensibly (by `вес` for importance queries, by `дата` otherwise).
2. **Point to the live index:** remind the user that `Logos/Журнал/Журнал.md` has live Dataview
   tables (По важности / Тупики и провалы / Все записи) they can open in Obsidian for an
   always-current view. Do NOT hand-maintain that file — Dataview updates it automatically.

Example: «что решали по памяти» → grep `область: память`, list the entries by date with status and
weight. «покажи тупики» → grep `тип: тупик` plus `статус: провал`.

## 4. OUTCOME mode

For updating an experiment or revisiting a decision after it proved itself or failed:
1. Locate the target entry (by name or via SEARCH).
2. Update its `статус` (`сработало` / `провал` for experiments; `принято` / `отвергнуто` / via an
   `откат` for decisions) and adjust `вес` — this is the journal's analogue of Logos's strength
   feedback: raise the weight when an approach succeeded, lower it when it failed. Note the change in
   the `## Результат` section.
3. If a decision is reversed, prefer creating a NEW entry with `тип: откат` that wiki-links the
   reversed one, rather than erasing history.
4. Confirm in Russian what changed (статус + new вес).

## Critical rules

- **One decision = one note.** Never append multiple decisions to a single file — separate notes are
  what make search precise.
- **Faithful capture.** When recording the user's words, do not invent, embellish, or moralize — fix
  mechanics only.
- **Russian content.** All entry text and field values are Russian; technical terms keep their form.
- **Never overwrite a different entry.** Re-recording the same decision updates ITS file (status,
  result); a new decision is a new file.
- **The index is automatic.** Never hand-edit `Журнал.md` per entry — Dataview keeps it current.
- **No manual git.** `obsidian-git` auto-syncs the vault.
