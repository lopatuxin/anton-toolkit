---
name: game-design
description: "Game design of a whole game in dialog with the owner: turns a game idea into an approved concept (pitch card, falsifiable pillars, anti-pillars, mechanics list) through a short interview, invents signature hooks and mechanic twists, reads a playtest verdict, and checks that a build is a game rather than a tech demo and that its systems do not fight each other. Use when the owner starts a new game, wants ideas for a game, reports how a play session felt, or asks whether the game holds together. A single level or map is game-level-design; engine architecture is system-designer; building the game is a dev workflow."
---

<!-- Generated from plugins/anton-toolkit/skills/game-design/SKILL.md; edit that source, then run npm run build. -->

## Codex runtime

Read PLUGIN_ROOT/codex-runtime.md before using this procedure. Shared source lives in the anton-toolkit Git repository; installed packages are generated.

# Game Design

The owner decides taste, scale and direction; you find facts, propose, and write the result
down. Keep the dialog in the main conversation. Ask in plain Russian text in the chat, never
through a question widget: every question names its options in the text, the recommended one
first with a one-line reason, and a plain "реши сам" always works.

The concept is the big picture: what the player does, why it is fun, what grows. Durations,
cooldowns, damage numbers and other tuning are found in play, not in the interview; do not
pull the conversation down to them.

Before anything, read what already exists: the game's project notes (concept, decisions,
journal), the code or data of the game if it runs, and earlier rejected ideas. What the owner
has already said or recorded is decided — never ask it again, and start at the first entry
point below that is not yet done.

## Entry points

| owner's situation | what to do | reference |
|---|---|---|
| a new game, from a phrase or a vague wish | concept interview → pitch card → concept note | `SKILL_DIR/references/interview.md` |
| "придумай фишки", a mechanic about to be specified, a slice that feels flat | one idea pass → 3–4 idea cards | `SKILL_DIR/references/ideas.md` |
| the owner played something and describes it | read the verdict, decide numbers vs rules vs cut | `SKILL_DIR/references/playtest.md` |
| "это уже игра?", a slice or release candidate, a big design change | game-ness and system-coherence checks | `SKILL_DIR/references/checks.md` |

Read only the reference of the current entry point.

## Concept interview — the core rules

1. **Parse the phrase before asking.** Split it into the concept slots and mark each: said,
   follows from the genre or the named reference game, or open.
2. **Ask only what is open, expensive to change later, and a matter of taste:** the reference
   game, the scale, the camera, the story. Decide everything else yourself.
3. **Never ask facts.** What a reference game contains, what a genre usually has, what the
   engine can do — look it up yourself (the owner's knowledge base, the code, a web search).
   An unfamiliar reference gets a short search before the first question.
4. **A visible budget.** Two rounds of 2–4 questions, then the pitch card. Say "вопрос 1 из 2"
   so the end is visible. "Хватит", "реши сам", "поехали" end the questions at once.
5. **A vague wish gets three ready games, not attribute questions.** Three radically different
   five-line pitches; the owner picks one and five slots close at once.
6. **The pitch card shows everything you decided.** Its last line, «Решил сам:», lists every
   slot you closed without the owner. A silent assumption is a defect; a visible one is fine.
7. **Answers to the card:** «утверждаю», «смелее» (the same game with its twist pushed to the
   edge, shown as a full card), or «поменять одно» (one question with 3–4 alternatives from the
   «Решил сам» line; the edit itself is the approval).

After approval, write the concept note (format in `interview.md`) and offer one idea pass for
signature hooks (`ideas.md`).

## Where it is written

- The concept goes to the game's own design notes: the project's CLAUDE.md or `.claude/rules/`
  says where. In the owner's vault a game that is its own project follows
  `Проекты/Шаблон проекта.md` and gets `Концепт <Игра>.md`. When the game has no home yet,
  ask the owner once where it lives before creating anything.
- In the vault: copy a sibling note's frontmatter, check the note name is unique, link by
  wikilink. Never write journal entries or project cards — `close-session` does that.
- Keep it short: one line per slot, one line per pillar, one row per mechanic or idea. Rewrite
  a line when a decision changes; do not append essays.

## What this skill does not do

No visual style choice, no engine choice, no level layouts (`game-level-design`), no scene or
code changes, no tuning numbers. Ideas and mechanics enter the game only after the owner's
explicit «да»; never "quickly try" an unapproved idea.

## Source

Adapted from the studioigor skill (github.com/studioigor/studioigor-skill, MIT): its idea
interview, game-designer layer, playtest doctrine and game-ness checks, reworked for chat-text
questions, the owner's vault and engine.
