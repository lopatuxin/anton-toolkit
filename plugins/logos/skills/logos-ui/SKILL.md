---
name: logos-ui
description: >
  Writes the build-ready structural spec of the Logos web interface to the folder Logos/Дизайн/Веб-интерфейс/ (hub note plus one page per screen)
  for the logos-frontend-coder agent — screens, the blocks and elements of each, navigation, behaviour
  and states — with no visual design: colours, typography and theme come from the established Logos
  style; built through an interview (open questions, one at a time), then synchronized with
  Архитектура.md, recording significant changes in the journal; documentation only. Runs in the main
  conversation; the interview is not delegated to agents. For the system architecture use
  logos-design, for delivery phases logos-phases, for the journal logos-log, for a non-Logos system
  system-designer.
disable-model-invocation: true
---

# Logos-ui — web interface specification for the Logos frontend coder

You design the **web interface of Logos** as a structural specification precise enough that the
**logos-frontend-coder** agent can build the UI from it without guessing the layout, the screens, the
elements, or their behaviour. You work out WHERE the buttons, pages, and blocks go and HOW everything
is arranged and behaves — you do NOT pick a new visual style: the frontend coder renders your spec in
the already-established Logos look (reusing the existing tokens, components, and layout shell).

**Critical rules:**
- **Documentation only.** No runnable code, no frontend files. The output is a Markdown spec.
- **No new visual design.** Never specify colours, exact typography, hex values, shadows, pixel
  spacing, or a visual theme — the frontend coder inherits all of that from the already-established
  Logos style (existing tokens/components/shell) and must not invent a new look. You define structure,
  hierarchy, content, grouping, order, behaviour, and states. (Relative emphasis like "primary action"
  / "secondary action" / "destructive action" is allowed — it is structural intent, not a colour.)
- **Command-only.** Act only when the user runs `/logos-ui`.
- **Russian output.** The spec, headings, and all chat dialogue are Russian. Technical terms (UI,
  modal, dropdown, breakpoint, API, etc.) keep their original form.
- **Synchronization is mandatory.** After writing or changing the spec you reconcile it with the rest
  of the Logos design (see Step 5). A web-interface decision that silently contradicts the
  architecture is a bug.

**Project context:** this spec is what the `logos-build` skill implements — specifically its
`logos-frontend-coder` agent — as the actual Logos web frontend (in the code repo
`git@github.com:lopatuxin/Logos.git`, the vault's sibling `Logos/` folder). That agent reuses the
established Logos frontend style, so write the spec FOR it: exhaustive structure and behaviour, and,
where useful, point it at the existing reusable components/shell rather than describing a look. The
full project picture — code repo vs vault docs, the polyglot stack, and the "documentation is the
source of truth" sync rule — is in `${CLAUDE_PLUGIN_ROOT}/references/logos-project.md`. Read it so the
interface spec stays build-ready and consistent with the code.

## 0. Locate the vault and resolve paths (once per session)

Resolve `VAULT` (the folder holding both `.obsidian/` and `Logos/`) and `CODE`
(`$(dirname "$VAULT")/Logos`) with the search procedure in the paths section of
`${CLAUDE_PLUGIN_ROOT}/references/logos-project.md`; never hard-code the path. If the vault is not
found, tell the user in Russian as that reference instructs, then stop.

Paths (Russian names — you own all path construction):

| Document | Path |
|---|---|
| Web interface spec | folder `$VAULT/Logos/Дизайн/Веб-интерфейс/` — hub `Веб-интерфейс.md` inside it, one page per screen, `Контракты-с-системой.md` (see `${CLAUDE_PLUGIN_ROOT}/references/web-ui-spec-template.md`) |
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
- If the folder `Веб-интерфейс/` with its hub already exists → this is an EXTEND/REVISE run: read it, ask the user what to add or change, and update it in place. Otherwise it is a fresh spec.

## 2. Interview style (the spec is built from the user's own words)

The interview rules live in `${CLAUDE_PLUGIN_ROOT}/references/interview-style.md` — open questions, one
at a time, no questions about failure modes. Read them before asking anything.

Specific to the interface: go deep on what the owner wants to SEE and DO, and surface the screens and
states his answers leave implicit. Every screen handles failure the same one way — an honest error he
sees — and that is written once in the spec, never asked per screen.

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

When a topic is pinned down, write/extend the pages of `$VAULT/Logos/Дизайн/Веб-интерфейс/` (hub + screen pages) following the
structure in `${CLAUDE_PLUGIN_ROOT}/references/web-ui-spec-template.md` (read it and follow it) — including its YAML
frontmatter (`tags: [logos, дизайн, интерфейс]`) and the `[[Концепт]] · [[Архитектура]]` link line.
Russian headings, all details captured, **no colours or visual styling**. Be exhaustive at the
element level — every button and field named, its purpose, behaviour, and states.

The vault auto-syncs via `obsidian-git` — no manual git commit for vault files.

After writing, summarize to the user in Russian and ask what to refine:
«Спеку интерфейса записал в `Logos/Дизайн/Веб-интерфейс/` (хаб и страницы экранов). Посмотри — что добавить или поправить?»

## 5. Synchronize the design (mandatory after any spec change)

This enforces the user's rule: **every Logos tool keeps the documentation consistent — any change is
propagated across the whole design.** After writing or changing the spec:

1. **Compare the spec against `Архитектура.md`.** Find where the interface requires something the
   architecture does not cover or contradicts — e.g. a screen needs an endpoint, a capability, a data
   field, or a control surface that the architecture never mentions, or the spec assumes a flow the
   architecture describes differently.
2. **Reconcile by fixing the architecture document.** For each genuine gap/contradiction, update
   `Архитектура.md` (and `Концепт.md` if a concept-level assumption changed) so the documents agree.
   Keep the architecture's existing structure and template
   (`${CLAUDE_PLUGIN_ROOT}/references/design-templates.md`); add the minimal consistent change, never
   reflow untouched sections. If a divergence cannot be resolved without a real architectural decision,
   do NOT silently invent one — surface it to the user and add it to `Архитектура.md` → «Риски и
   открытые вопросы».
3. **Record significant changes in the journal.** For each non-trivial sync edit to the architecture,
   write a journal entry per `${CLAUDE_PLUGIN_ROOT}/references/diary-format.md` — one note under
   `$VAULT/Logos/Журнал/`,
   `тип: решение` (or `тип: наблюдение` for a noted gap), `область: общее` (the interface is
   cross-cutting and the journal's `область` taxonomy has no UI value — never write `область: интерфейс`),
   `статус: принято`, `вес: 5` (the assistant's importance estimate). Trivial wording
   fixes need no entry.
4. **Report the sync to the user** in Russian: a short list of what changed in `Архитектура.md` (and
   why). No review gate — do not ask the user to review or sign off the journal entries; if the user
   asks for changes, keep the entries consistent exactly as `logos-log` does.

The reconciliation is one bounded pass — do not loop it endlessly. If syncing the architecture would
itself reshape the interface, note it and let the next interview turn resolve it.

## 6. Iteration

When the user requests changes to the interface, edit the hub and the affected screen pages in `Веб-интерфейс/` in place (re-interview only
the affected topic), then re-run Step 5 (sync) for the touched area. Keep edits minimal and scoped —
do not rewrite settled sections.

## When NOT to use this skill

- User wants to design the Logos system architecture (orchestration/memory/models) → use logos-design.
- User wants to record/search a decision → use logos-log.
- User wants to design a different (non-Logos) system → use system-designer.
- User asks to write actual frontend code → stop, this skill is docs-only.
- User wants a new visual look (colours, theme, typography) → not this spec: the frontend coder reuses
  the established Logos style; this spec is structural only.
