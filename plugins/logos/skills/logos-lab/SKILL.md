---
name: logos-lab
description: >
  The experiment diary of the Logos RESEARCH BRANCH (small specialized self-learning models on
  cheap hardware). Record a new experiment (the hypothesis is written BEFORE the code, status
  «проверяется»), append its outcome (сработало / провал, adjust the importance weight), search
  experiments by area / status / weight / date, show past failures and dead ends, and maintain the
  research direction notes (изучается / активно / отложено / закрыто). Works over the vault folder
  Logos/Исследования/ (Направления/ + Эксперименты/ with Dataview indexes) and knows the rules of
  the lab code repo Logos-Lab (one root folder = one experiment, no production discipline). Runs
  DIRECTLY in conversation, single-shot, no agents.

  Invocation: COMMAND ONLY — "/logos-lab". This skill does NOT auto-trigger on free-text phrases.
  Phrases the user might say ("заведи эксперимент", "запиши эксперимент в лабораторию",
  "эксперимент в лаборатории сработал", "покажи эксперименты исследовательской ветки",
  "покажи провалы лаборатории") are context for the user, not auto-triggers — act only when the
  user runs /logos-lab.

  Discrimination: this is the diary of the RESEARCH BRANCH. For recording PROJECT decisions,
  experiments and dead ends of the production Logos system use logos-log (folder Logos/Журнал/);
  for talking about the project use logos-chat; this skill never designs and never writes
  production code.
---

# Logos-lab — the research branch experiment diary

**Reference files — resolve the path BEFORE reading (this plugin's most frequent failure).** Every
`references/<file>.md` cited anywhere in this document means `<plugin-root>/references/<file>.md`: the
reference files live at the PLUGIN ROOT, never inside a skill's own folder. The base directory given to
this skill at load time is `<plugin-root>/skills/<this-skill>/`, so a bare relative path resolves to
`<plugin-root>/skills/<this-skill>/references/<file>.md` — that file does not exist and the read fails.
Resolve it as `<this skill's base directory>/../../references/<file>.md`. If no base directory was given,
locate the file with Glob (pattern `**/references/<file>.md`, path `<user home>/.claude/plugins`) and take
the match under `.../logos/` — either the installed cache
`.claude/plugins/cache/anton-toolkit-marketplace/logos/<version>/references/` or the marketplace working
copy `.claude/plugins/marketplaces/anton-toolkit-marketplace/plugins/logos/references/`.

- Correct: `C:\Users\<user>\.claude\plugins\cache\anton-toolkit-marketplace\logos\<version>\references\lab-format.md`
- Incorrect: `references/lab-format.md` — resolves under the skill folder, which has no `references/`.

Never report a reference file as missing, and never proceed on remembered content, without running that
Glob first.

The research branch is a SEPARATE line of Logos development: away from big LLMs toward a swarm
of small specialized self-learning models on cheap hardware. Its documentation lives in
`Logos/Исследования/` in the vault; its code lives in the separate repo `Logos-Lab`. The
storage format — folder layout, frontmatter fields, note templates, Dataview folder notes, and
the lab repo rules — is defined in `references/lab-format.md`: **read it and follow it
verbatim**. The project-wide picture (where the branch sits relative to the production system)
is in `references/logos-project.md`.

This skill is the user-facing interface over that format: record an experiment, append its
outcome, search the diary, maintain direction notes. It writes ONLY inside
`Logos/Исследования/` (and reads `Logos-Lab`); it never touches the production code repo, the
design docs, or the journal — a cross-cutting project decision still goes through `logos-log`.

## 0. Setup (every run)

Locate the vault and ensure the branch folders + folder notes exist exactly as
`references/lab-format.md` sections 1–3 prescribe (idempotent — create only what is missing,
NEVER overwrite an existing non-empty file). If the vault is not found, tell the user in
Russian as the reference instructs, then stop.

## 1. Determine the mode

Infer the mode from the user's argument / request:
- **RECORD** — a new experiment to start: "заведи эксперимент…", "новый эксперимент…", the
  user dictates a hypothesis. Also `тип: тупик` when an approach is recorded as unworkable.
- **OUTCOME** — an existing experiment finished or moved: "эксперимент сработал / провалился",
  "запиши результат…".
- **SEARCH** — "покажи эксперименты…", "что мы пробовали по…", "покажи провалы/тупики".
- **DIRECTION** — create or update a direction note in `Направления/`: "заведи направление…",
  "обнови направление…", "переведи направление в активно/отложено/закрыто".

If ambiguous, ask the user in Russian which they want, in one short question.

## 2. RECORD mode

1. Get the hypothesis from the user. If nothing was dictated, ask in Russian: «Диктуй
   гипотезу — заведу эксперимент.» and wait. Never create an empty note. **The hypothesis is
   recorded BEFORE any code exists** — that is the point of the diary.
2. Classify (ask briefly only if you cannot infer): `область` (модели / память / железо /
   алгоритмы / общее) and the target direction note (must exist in `Направления/` — offer to
   create it via DIRECTION mode if it does not).
3. Write a NEW note at `$VAULT/Logos/Исследования/Эксперименты/<YYYY-MM-DD>-<слаг>.md` using
   the template in `references/lab-format.md` section 4: today's `дата`, `тип: эксперимент`,
   `вес: 5`, `статус: проверяется`, the `направление` wiki-link, and `код:
   "Logos-Lab/<слаг>"` (the folder may not exist yet — the field states where the code will
   live). Fill «Гипотеза» and «Установка» from the user's words; «Результат» = «пока не
   проверено». Capture faithfully — clean mechanics only, do not invent or embellish.
4. If the experiment's code folder is about to be created, remind the user (one Russian line)
   that the folder in `Logos-Lab` carries the SAME name as the note slug.
5. Confirm in Russian, one line: «Завёл эксперимент: `Исследования/Эксперименты/<имя>.md`
   (область: <область>, статус: проверяется). Код — папка `Logos-Lab/<слаг>`.»

## 3. OUTCOME mode

1. Locate the target note (by name or via SEARCH). Never guess between two candidates — ask.
2. Update ITS file: `статус` → `сработало` / `провал`, adjust `вес` (raise for an important
   result — positive OR negative; lower for a marginal one), write the actual outcome with
   numbers into «Результат» and the takeaway into «Вывод».
3. If the takeaway matters beyond the branch (changes a direction's status, or is ready for
   the production design), say so in Russian and offer the owning move: update the direction
   note (DIRECTION mode), or record a project decision via `logos-log`. Do not silently edit
   the main design from here.
4. Confirm in Russian what changed (статус + new вес).

## 4. SEARCH mode

The diary is built to be queried, not scrolled:
1. **In-conversation search:** grep the frontmatter of files in
   `$VAULT/Logos/Исследования/Эксперименты/` by the field asked about — `область`, `статус`,
   `тип`, `вес` (threshold), `дата` (range), `направление` — and return matches as a short
   Russian list (file link + one-line summary), sorted by `дата` (or `вес` for importance
   queries). «покажи провалы» → `статус: провал` plus `тип: тупик`.
2. **Point to the live index:** the folder note `Исследования/Исследования.md` holds live
   Dataview tables (активные направления / эксперименты в работе / провалы / все) the user
   can open in Obsidian. Do NOT hand-maintain it.

## 5. DIRECTION mode

1. Creating: write `Направления/<Имя-направления>.md` per `references/lab-format.md` section 5
   — frontmatter (`дата`, `статус: изучается`) and the four sections (Что это / Почему нам
   важно / Ключевые работы / Текущий вывод) from what the user dictated or what the
   conversation established. Do not pad sections you have nothing for.
2. Updating: edit the SAME note in place — refresh `дата`, move `статус`
   (изучается / активно / отложено / закрыто), append works, rewrite «Текущий вывод».
   A direction is a knowledge accumulator, not an append-only log.
3. Confirm in Russian, one line.

## Critical rules

- **One experiment = one note; hypothesis before code.** An experiment without a diary note
  does not exist.
- **Failures are first-class.** Record «провал» and «тупик» with the same care as successes.
- **Never overwrite a different note.** Re-recording updates ITS file; new experiment — new file.
- **Russian content**; technical terms keep their form.
- **The index is automatic** — Dataview; never hand-edit folder notes per entry.
- **No manual git for the vault** (obsidian-git auto-syncs). The `Logos-Lab` repo IS committed
  manually — Russian messages, never force-push, no data/weights/secrets in git
  (`references/lab-format.md` section 6).
- **Stay in the branch.** This skill writes only under `Logos/Исследования/`; production
  decisions go to `logos-log`, production code to `logos-build`.
