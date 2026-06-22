---
name: logos-ui
description: >
  Design the web interface of the Logos system as a complete, build-ready structural specification
  for Claude Design — WHICH pages/screens exist, WHAT blocks and elements (buttons, fields, lists,
  tables, modals) each one holds, HOW the user navigates between them, and how every element behaves
  (states, validations, data shown, edge cases). It does NOT design visuals: no colours, typography,
  spacing, or styling — Claude Design owns all of that. The skill runs a deep DIALOG-interview with
  the user (open-ended, one question at a time) to pin down exactly what they want from the interface,
  writes the spec to Logos/Дизайн/Веб-интерфейс.md, and then SYNCHRONIZES it with the rest of the
  Logos design: if the interface requires something not in (or contradicting) Архитектура.md, it
  goes and fixes the architecture document so the whole design stays consistent, recording the
  significant change in the decision journal. Documentation only — no runnable code.

  Invocation: COMMAND ONLY — "/logos-ui". This skill does NOT auto-trigger on free-text phrases.
  Other phrases ("спроектируй интерфейс logos", "распиши веб-интерфейс logos", "какие страницы у
  logos") are context for the user, not auto-triggers — act only when the user runs /logos-ui.

  Discrimination: this skill designs the Logos web INTERFACE structure (UX/IA spec under Claude
  Design). For designing the Logos SYSTEM architecture (orchestration, memory, models) use
  logos-design; for recording/searching decisions use logos-log; for an arbitrary non-Logos system
  use system-designer. This skill is documentation-only — if the user asks to write actual frontend
  code, stop.

  This skill runs DIRECTLY in conversation. Do NOT launch agents for the interview part — agents lose
  context between turns and cannot hold a dialog.
---

# Logos-ui — web interface specification for Claude Design

You design the **web interface of Logos** as a structural specification precise enough that Claude
Design can build the UI from it without guessing the layout, the screens, the elements, or their
behaviour. You work out WHERE the buttons, pages, and blocks go and HOW everything is arranged and
behaves — you do NOT pick the visual style.

**Critical rules:**
- **Documentation only.** No runnable code, no frontend files. The output is a Markdown spec.
- **No visual design.** Never specify colours, exact typography, hex values, shadows, pixel spacing,
  or a visual theme — Claude Design chooses all of that. You define structure, hierarchy, content,
  grouping, order, behaviour, and states. (Relative emphasis like "primary action" / "secondary
  action" / "destructive action" is allowed — it is structural intent, not a colour.)
- **Command-only.** Act only when the user runs `/logos-ui`.
- **Russian output.** The spec, headings, and all chat dialogue are Russian. Technical terms (UI,
  modal, dropdown, breakpoint, API, etc.) keep their original form.
- **Synchronization is mandatory.** After writing or changing the spec you reconcile it with the rest
  of the Logos design (see Step 5). A web-interface decision that silently contradicts the
  architecture is a bug.

## 0. Locate the vault and resolve paths (once per session)

Find the Obsidian vault root (the directory that contains `.obsidian/`). Walk up from the current
directory, fallback to the known path:

```bash
VAULT=""
DIR="$(pwd)"
while [ "$DIR" != "/" ] && [ -n "$DIR" ]; do
  if [ -d "$DIR/.obsidian" ]; then VAULT="$DIR"; break; fi
  DIR="$(dirname "$DIR")"
done
[ -z "$VAULT" ] && [ -d "/c/projects/Claude/.obsidian" ] && VAULT="/c/projects/Claude"
echo "VAULT=$VAULT"
```

If `$VAULT` is empty, tell the user in Russian: «Не нашёл хранилище Obsidian (папку `.obsidian`). Запусти скилл из папки хранилища.» — then stop.

Paths (Russian names — you own all path construction):

| Document | Path |
|---|---|
| Web interface spec | `$VAULT/Logos/Дизайн/Веб-интерфейс.md` |
| Concept (read) | `$VAULT/Logos/Дизайн/Концепт.md` |
| Architecture (read + sync target) | `$VAULT/Logos/Дизайн/Архитектура.md` |
| Decision journal | `$VAULT/Logos/Журнал/` |

Cross-references use Obsidian wiki-links (`[[Концепт]]`, `[[Архитектура]]`), never relative paths.

## 1. Read the source of truth first

Read `Концепт.md` and `Архитектура.md` in full before interviewing. The interface must reflect what
Logos actually does — its real capabilities, the orchestration/memory/model surfaces the user needs
to see and control. Note which Logos features imply a screen or control (e.g. a control panel for the
orchestrators, a memory browser, a journal of decisions).

- If `Архитектура.md` does NOT exist, tell the user in Russian: «Архитектуры ещё нет — интерфейс будет проектироваться вслепую. Сначала прогоним `logos-design`? Если хочешь, можем всё равно набросать спеку по концепту.» and let them decide (do not hard-stop).
- If `Веб-интерфейс.md` already exists → this is an EXTEND/REVISE run: read it, ask the user what to add or change, and update it in place. Otherwise it is a fresh spec.

## 2. Interview style (the spec is built from the user's own words)

The user wants the interface worked out in depth, every detail accounted for. Interview thoroughly
until the target picture is genuinely clear — do not fill a couple of gaps and stop.

Hard rules for every question:
- Ask OPEN-ENDED, free-text questions. NEVER use the AskUserQuestion tool and NEVER present pre-baked
  multiple-choice options. The user answers in their own words.
- Ask ONE question at a time. Wait for the answer before the next. Do NOT batch several questions.
- Go deep: follow up on each answer, probe the "why", surface hidden screens/states/edge cases, and
  discuss trade-offs in prose to converge together. Reaching clarity takes many turns — that is fine.
- Only stop a topic once it is concretely pinned down; then write it into the spec and move on.

Correct: «С какого экрана пользователь начинает работу с Logos и что он там видит в первую очередь?»
Incorrect: calling AskUserQuestion, offering an A/Б/В list, or asking three things in one message.

## 3. Interview topics (one open question each, follow up as answers demand)

Cover at least these, anchored to what Logos does (from the architecture). Skip nothing structural:
- The primary user and the device/platform (desktop-first web app? mobile too?) and the overall
  shell pattern (sidebar + main? top nav? command-bar-driven?).
- The first/most important screen and what the user sees and does there.
- The full set of screens/pages the interface needs, and what each is for.
- For each screen: the blocks it contains, every interactive element (buttons, fields, lists, tables,
  cards, modals, menus), what each element does, and what data it shows.
- Navigation: how the user moves between screens, entry points, deep links, breadcrumbs/back.
- States for each screen/element: empty, loading, error, success, partial, no-permission.
- Validations and feedback: what is checked, what messages/confirmations appear.
- Reused components shared across screens.
- Responsive/structural behaviour: what collapses or reflows on narrow widths (structure, not style).
- Accessibility/interaction expectations (keyboard, focus order, dialog behaviour) at a structural level.
- Which Logos capability/data each screen consumes (ties every screen back to the architecture).

## 4. Write the spec

When a topic is pinned down, write/extend `$VAULT/Logos/Дизайн/Веб-интерфейс.md` following the
structure in `references/web-ui-spec-template.md` (read it and follow it) — including its YAML
frontmatter (`tags: [logos, дизайн, интерфейс]`) and the `[[Концепт]] · [[Архитектура]]` link line.
Russian headings, all details captured, **no colours or visual styling**. Be exhaustive at the
element level — every button and field named, its purpose, behaviour, and states.

The vault auto-syncs via `obsidian-git` — no manual git commit for vault files.

After writing, summarize to the user in Russian and ask what to refine:
«Спеку интерфейса записал в `Logos/Дизайн/Веб-интерфейс.md`. Посмотри — что добавить или поправить?»

## 5. Synchronize the design (mandatory after any spec change)

This enforces the user's rule: **every Logos tool keeps the documentation consistent — any change is
propagated across the whole design.** After writing or changing the spec:

1. **Compare the spec against `Архитектура.md`.** Find where the interface requires something the
   architecture does not cover or contradicts — e.g. a screen needs an endpoint, a capability, a data
   field, or a control surface that the architecture never mentions, or the spec assumes a flow the
   architecture describes differently.
2. **Reconcile by fixing the architecture document.** For each genuine gap/contradiction, update
   `Архитектура.md` (and `Концепт.md` if a concept-level assumption changed) so the documents agree.
   Keep the architecture's existing structure and template (`references/design-templates.md`); add the
   minimal consistent change, never reflow untouched sections. If a divergence cannot be resolved
   without a real architectural decision, do NOT silently invent one — surface it to the user and add
   it to `Архитектура.md` → «Риски и открытые вопросы».
3. **Record significant changes in the journal.** For each non-trivial sync edit to the architecture,
   write a journal entry per `references/diary-format.md` — one note under `$VAULT/Logos/Журнал/`,
   `тип: решение` (or `тип: наблюдение` for a noted gap), `область: общее` (the interface is
   cross-cutting and the journal's `область` taxonomy has no UI value — never write `область: интерфейс`),
   `статус: предложено`, `ревью: false`, `вес: 5` (default until the user weighs in). Trivial wording
   fixes need no entry.
4. **Report the sync to the user** in Russian: a short list of what changed in `Архитектура.md` (and
   why) so they can review it. When the user reviews, fold their verdict into the journal entries
   (`статус`, `ревью: true`, `вес`, verbatim feedback in `## Ревью`) exactly as `logos-log` does.

The reconciliation is one bounded pass — do not loop it endlessly. If syncing the architecture would
itself reshape the interface, note it and let the next interview turn resolve it.

## 6. Iteration

When the user requests changes to the interface, edit `Веб-интерфейс.md` in place (re-interview only
the affected topic), then re-run Step 5 (sync) for the touched area. Keep edits minimal and scoped —
do not rewrite settled sections.

## When NOT to use this skill

- User wants to design the Logos system architecture (orchestration/memory/models) → use logos-design.
- User wants to record/search a decision → use logos-log.
- User wants to design a different (non-Logos) system → use system-designer.
- User asks to write actual frontend code → stop, this skill is docs-only.
- User wants the visual look (colours, theme, typography) → that is Claude Design's job, not this spec.
