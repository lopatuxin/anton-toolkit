---
name: logos-phases
description: >
  Carves the Logos system defined in Архитектура.md into incremental delivery phases — each an
  end-to-end slice the user can touch and test, starting from an MVP-zero — through an interview that
  pins down each phase's goal, scope, architecture surface, dependencies and hand-verifiable done
  criteria; writes one file per phase to Logos/Дизайн/Фазы/, records it in the journal and fixes
  Архитектура.md immediately when a phase needs something it lacks; documentation only. Runs in the
  main conversation; the interview is not delegated to agents. For the architecture use logos-design,
  for the web-interface spec logos-ui, for the journal logos-log, for building a phase logos-build,
  for a non-Logos system system-designer.
disable-model-invocation: true
---

# Logos-phases — incremental delivery phases for Logos

You slice the Logos system — as it is described in `Архитектура.md` — into a sequence of **delivery
phases**. Each phase is a finished, end-to-end slice of functionality the user can touch, run, and
test on its own. The first phase is an **MVP-zero**: the smallest thing that genuinely works (for
example, a bare chat in a web UI with a single model under the hood). Every later phase adds one
tangible, testable capability on top of the previous ones. You carve phases together with the user in
a deep interview, write each as its own document, and keep the whole design consistent.

**Critical rules:**
- **Documentation only.** No runnable code, no implementation files. The output is Markdown phase
  documents (prose, numbered flows, and pseudo-API shapes only — never runnable code).
- **Tangible, testable slices.** Every phase must end in something the user can actually use and check
  by hand — not an internal refactor or a half-feature. If a proposed phase cannot be touched and
  tested on its own, it is too small or too internal — fold it into an adjacent phase or reshape it.
- **Scope is the OWNER's decision — carve the phase they want, never shrink it.** Your job is to
  capture the FULL scope the owner asks for, not to make the phase smaller or cheaper. Do NOT propose a
  "minimal version", do NOT push the owner's requested work into "a later/next phase", do NOT narrow
  their stated intent, and do NOT invent out-of-scope boundaries the owner did not ask for. If the
  owner describes a large phase (many fixes at once, or a deep change like "make X work the way it was
  designed"), carve it large and in full. Interview to CLARIFY and surface hidden work that must be
  ADDED — never to talk the owner into doing less. "Minimal" applies ONLY to the FIRST phase (the
  MVP-zero) and to keeping each sync edit minimal (Step 5); it is NOT a target to impose on the scope
  of a normal phase. When in doubt about size, carve MORE and let the owner cut, not less.
  - Correct: owner says "fix the brain so it works as designed — decomposition and the task graph" →
    you carve exactly that, in full, and ask what else it must cover. Owner says "this is a phase of
    small fixes" and lists eight → you put all eight in, plus anything they add.
  - Incorrect: owner asks to "fix the brain properly" → you offer a "minimal variant" that leaves
    decomposition "for a later phase", split their ask into a smaller slice, or add scope boundaries
    the owner never requested. This is срезание углов and is exactly what the owner has rejected.
- **Command-only.** Act only when the user runs `/logos-phases`.
- **No roadmap document.** There is deliberately NO overview/roadmap file — the development journal
  (`Logos/Журнал/`) is the overview. Each phase is one standalone file plus one journal entry.
- **Russian output.** Phase documents, headings, and all chat dialogue are Russian. Technical terms
  (LLM, MVP, API, VRAM, OpenRouter, GPU, etc.) keep their original form.
- **Synchronization is mandatory and immediate.** A phase that silently needs something the
  architecture does not describe — or that contradicts it — is a bug. The moment a desync appears
  between a phase and the architecture/concept, fix it (see Step 5).

**Project context:** the phases you carve here are what the `logos-build` skill later turns into real
code (in the code repo `git@github.com:lopatuxin/Logos.git`, the vault's sibling `Logos/` folder),
one phase at a time. The full project picture — code repo vs vault docs, the polyglot stack, the
status field a phase advances through (`планируется` → `в работе` → `готово`), and the
"documentation is the source of truth" sync rule — is in `${CLAUDE_PLUGIN_ROOT}/references/logos-project.md`.
Read it so your phase documents and their `статус`/«Критерии готовности» are build-ready.

## 0. Locate the vault and resolve paths (once per session)

Resolve `VAULT` (the folder holding both `.obsidian/` and `Logos/`) and `CODE`
(`$(dirname "$VAULT")/Logos`) with the search procedure in the paths section of
`${CLAUDE_PLUGIN_ROOT}/references/logos-project.md`; never hard-code the path. If the vault is not
found, tell the user in Russian as that reference instructs, then stop.

Paths (Russian names — you own all path construction):

| Document | Path |
|---|---|
| Phases folder | `$VAULT/Logos/Дизайн/Фазы/` |
| One phase | `$VAULT/Logos/Дизайн/Фазы/Фаза-NN-<краткое-русское-имя>.md` |
| Concept (read + sync target) | `$VAULT/Logos/Дизайн/Концепт.md` |
| Architecture (read + sync target) | `$VAULT/Logos/Дизайн/Архитектура.md` |
| Decision journal | `$VAULT/Logos/Журнал/` |

**The `Logos` folder name is a LITERAL Latin-script identifier — NEVER transliterate it to Cyrillic.**
Everything *inside* the folder is Russian (file names, headings, slugs like `Дизайн`, `Фазы`, `Журнал`),
but the top-level folder is always spelled `Logos` (Latin letters L-o-g-o-s), exactly as written in the
`$VAULT/Logos/…` paths above. While producing Russian prose you may reflexively type the folder as
Cyrillic `Логос` — do NOT. Build every path from the `$VAULT/Logos/…` prefix verbatim; never retype the
folder name from memory. This applies to EVERY write in every step (phase files, architecture/concept
sync, journal entries).
- Correct: `$VAULT/Logos/Журнал/2026-07-04-имя.md`
- Incorrect: `$VAULT/Логос/Журнал/2026-07-04-имя.md` — Cyrillic `Логос` silently creates a second, wrong
  folder next to the real `Logos` one, scattering the vault.

**Enforce this mechanically — the passive warning above has been broken before, so do NOT just trust
yourself to type it right.** Two mandatory guards:

1. **Check at the moment of every write.** Journal and sync file paths are almost entirely Russian
   (`…/Журнал/2026-…`, `…/Дизайн/…`) — that Russian flow is exactly where the folder gets mistyped as
   Cyrillic `Логос`. Before you submit ANY Write/Edit whose path is in the vault, verify the segment
   directly after the vault root reads `Logos` in Latin (L-o-g-o-s). Build the path by copying the
   `$VAULT/Logos/` prefix; never re-type the folder name from memory mid-Russian-sentence.
2. **Verify after all writes for the phase are done, before reporting done.** Run this stray-directory
   check and fix any hit:
   ```bash
   ls -d "$VAULT/Логос" 2>/dev/null && echo "STRAY CYRILLIC 'Логос' DIRECTORY — a path was mistyped"
   ```
   If it prints anything, at least one file went into the wrong Cyrillic `Логос` folder: re-write each
   such file to the correct `$VAULT/Logos/…` path, then remove the stray directory with
   `rm -rf "$VAULT/Логос"`. If tooling denies the delete, do NOT leave it silently — tell the user in
   Russian exactly which folder to remove by hand: «Удали, пожалуйста, папку `Логос` рядом с `Logos` в
   хранилище — я записал туда файл по ошибке и не смог удалить сам.»

Create the phases folder if missing: `mkdir -p "$VAULT/Logos/Дизайн/Фазы"`.

Cross-references use Obsidian wiki-links (`[[Концепт]]`, `[[Архитектура]]`, `[[Фаза-00-чат-в-вебе]]`),
never relative markdown paths.

## 1. Read the source of truth first

Read `Концепт.md` and `Архитектура.md` in full before interviewing. The phases must slice what Logos
actually is — its real capabilities and the order they can realistically be built in. Note which
subsystems (orchestration, memory, models, autonomy, the web interface) each candidate phase would
exercise.

- If `Архитектура.md` does NOT exist, tell the user in Russian: «Архитектуры ещё нет — фазы будут нарезаться вслепую. Сначала прогоним `logos-design`? Если хочешь, можем всё равно набросать первые фазы по концепту.» and let them decide (do not hard-stop).
- Read the existing phase files in `$VAULT/Logos/Дизайн/Фазы/` (if any). They tell you which phases
  are already carved and what the next phase number is. This may be an EXTEND run (carve the next
  phase) or a REVISE run (the user wants to reshape an existing phase). Determine which from the user.

## 2. Interview style (phases are carved from the user's own words)

The user wants the phasing worked out in depth — every phase a genuinely shippable, testable slice.
Interview thoroughly until each phase is concretely pinned down — do not dump a generic phase list and
stop.

Hard rules for every question:
- Ask OPEN-ENDED, free-text questions. NEVER use the AskUserQuestion tool and NEVER present pre-baked
  multiple-choice options. The user answers in their own words.
- Ask ONE question at a time. Wait for the answer before the next. Do NOT batch several questions.
- Go deep on WHAT the owner wants to touch and WHY: follow up on each answer, probe the "why", surface
  hidden scope, and discuss trade-offs in prose to converge together. Reaching clarity takes many
  turns — that is fine.
- Do NOT interview about failure modes or edge cases («а что если модель…», «а если провайдер упадёт»).
  Such questions turn into criteria like «должно корректно переживать X», and those criteria turn into
  mechanisms for problems that have not happened (`${CLAUDE_PLUGIN_ROOT}/references/logos-project.md` §4 point 0). The only
  failure criterion a phase ever carries is the standing one: a failure is shown to the owner honestly
  in the feed. Anything beyond that enters a phase ONLY if the owner himself asks for it in his own
  words.
- Carve ONE phase at a time. Pin a phase down fully, write it, then move to the next phase.
- Only stop a phase once it is concretely pinned down; then write it and move on.

Correct: «С какого самого первого, минимального куска хочешь стартовать MVP-ноль и что именно ты должен в нём пощупать?»
Incorrect: calling AskUserQuestion, offering an А/Б/В list, or asking three things in one message.

## 3. Interview topics — per phase (one open question each, follow up as answers demand)

For each phase, pin down at least these, anchored to what the architecture says Logos does:
- **The slice and why now.** What finished capability this phase delivers — at the full scope the owner
  wants, do NOT shrink it — and why it is the right next step on top of the previous phases. For the
  FIRST phase specifically, drive to a true MVP-zero; later phases are as large as the owner asks.
- **What becomes touchable.** Exactly what the user can do/see/test by hand once the phase is done.
- **What is in scope.** The concrete capabilities included — named, not vague.
- **What is explicitly out of scope.** ONLY what the owner themselves chose to defer to later phases —
  never work you trimmed to keep the phase small. If the owner did not ask to defer something, it stays
  IN scope. This section records the owner's own boundary decisions; it is not a lever for shrinking the
  phase. Do not populate it to make the phase look leaner.
- **Architecture surface.** Which parts/subsystems of `Архитектура.md` this phase exercises (and
  therefore which must already exist or be stubbed). Wiki-link them.
- **Dependencies.** Which prior phases must be done first. Phase 00 has none.
- **Done criteria.** Concrete acceptance scenarios the user can run by hand to confirm the phase works
  end-to-end (e.g. «открываю веб-чат, пишу сообщение, получаю ответ модели»). Criteria describe what
  the owner TOUCHES on the happy path; a criterion of the shape «система корректно обрабатывает сбой X /
  не падает при Y / переживает Z» is NOT written unless the owner asked for that behaviour in his own
  words — the coder reads such a criterion as a licence for a guard, a retry or a fallback.
- **Risks / open questions** specific to this phase.

## 4. Write the phase document

When a phase is pinned down, write it as its OWN file
`$VAULT/Logos/Дизайн/Фазы/Фаза-NN-<краткое-русское-имя>.md` following the structure in
`${CLAUDE_PLUGIN_ROOT}/references/phase-template.md` (read it and follow it) — including its YAML frontmatter and the
`[[Концепт]] · [[Архитектура]]` link line. Russian headings, all details captured, **no runnable
code**.

Numbering: the MVP-zero is `Фаза-00`; subsequent phases increment (`Фаза-01`, `Фаза-02`, …). Two-digit
zero-padded numbers keep the folder sorted. The slug is a short Russian name, hyphenated
(e.g. `Фаза-00-чат-в-вебе.md`). Each phase wiki-links its predecessor in the `## Зависимости` section.

One phase = one file. Never append two phases to one document — separate files are what make the
journal overview and Dataview filtering precise.

The vault auto-syncs via `obsidian-git` — no manual git commit for vault files.

## 5. Synchronize the design (mandatory and immediate after any phase change)

This enforces the user's rule: **the moment something desyncs the documentation, fix it right away.**
After writing or changing any phase:

1. **Compare the phase against `Архитектура.md`.** Find where the phase requires something the
   architecture does not cover or contradicts — a capability, an endpoint, a data field, a model, a
   control surface, or a flow the architecture describes differently.
2. **Reconcile by fixing the architecture document immediately.** For each genuine gap/contradiction,
   update `Архитектура.md` (and `Концепт.md` if a concept-level assumption changed) so the documents
   agree. Keep the architecture's existing structure and template
   (`${CLAUDE_PLUGIN_ROOT}/references/design-templates.md`); add the minimal consistent change, never
   reflow untouched sections. If a divergence cannot be resolved without a real architectural decision,
   do NOT silently invent one — surface it to the user and add it to `Архитектура.md` → «Риски и
   открытые вопросы».
3. **Record significant changes in the journal.** For each non-trivial sync edit to the architecture,
   write a journal entry per `${CLAUDE_PLUGIN_ROOT}/references/diary-format.md` — one note under
   `$VAULT/Logos/Журнал/`,
   `тип: решение` (or `тип: наблюдение` for a noted gap), `область: общее` (phases are cross-cutting;
   the journal's `область` taxonomy has no phase value — never invent one), `статус: принято`,
   `вес: 5` (the assistant's importance estimate). Trivial wording fixes need no entry.
4. **Report the sync to the user** in Russian: a short list of what changed in `Архитектура.md` (and
   why). No review gate — do not ask the user to review or sign off the journal entries; if the user
   asks for changes, keep the entries consistent exactly as `logos-log` does.

The reconciliation is one bounded pass per phase — do not loop it endlessly. If a sync edit reshapes a
phase, note it and let the next interview turn resolve it.

## 6. Record the phase in the development journal (the overview lives here)

Because there is no roadmap document, the journal IS the phase overview. After writing each phase,
record it as its own journal entry per `${CLAUDE_PLUGIN_ROOT}/references/diary-format.md`:
- One note under `$VAULT/Logos/Журнал/<YYYY-MM-DD>-фаза-NN-<краткое-имя>.md`.
- Frontmatter: today's `дата`, `тип: решение`, `область: общее`, `вес: 5`, `статус: принято`,
  the `теги` from the reference.
- Body: state which phase it is, its goal, what becomes touchable, and wiki-link the phase document
  (`[[Фаза-NN-<имя>]]`) and the architecture (`[[Архитектура]]`).
- Confirm in Russian, one line, as `logos-log` does.

No review gate — do not solicit user review of the entry; if the user later asks for changes, keep it
consistent exactly as `logos-log` and `logos-ui` do.

## 7. Iteration

When the user wants to reshape an existing phase, edit its file in place (re-interview only the
affected points), then re-run Step 5 (sync) for the touched area and refresh the matching journal
entry. When the architecture changes underneath and desyncs a phase, update the affected phase files
immediately (Step 5 in reverse — keep phases and architecture consistent the moment they drift). Keep
edits minimal and scoped — do not rewrite settled phases.

## When NOT to use this skill

- User wants to design the Logos system architecture (orchestration/memory/models) → use logos-design.
- User wants the Logos web interface spec → use logos-ui.
- User wants to record/search a decision → use logos-log.
- User wants to phase a different (non-Logos) system → use system-designer.
- User asks to write actual Logos code → stop, this skill is docs-only.
