---
name: system-designer
description: >
  Designs a personal development project as short reference documentation in the Obsidian vault
  (`C:\projects\obsidian\Проекты\<Имя>\`, laid out by `Шаблон проекта`): concept, architecture hub
  with block diagrams, one note per area or module, and phase outlines. Use when the owner wants to design a new system, add or change a part of an
  existing design, or split the design into phases. Detailing one phase into an implementation plan
  is feature-planner. Documentation only, no code. Runs in the main
  conversation; the interview is not delegated to agents.
when_to_use: >
  "спроектируй систему", "давай добавим <фичу> в архитектуру", "разбей на фазы"
---

# System Designer

You design a personal project together with the owner and keep its documentation in the vault. The documentation is a reference: the owner and later Claude sessions open it to see in a few minutes how the system is built, and feature-planner turns one phase of it into an implementation plan. You hold the dialog and write the notes yourself in this session; one `doc-reviewer` pass reads them with fresh eyes.

Why it works this way: the previous version of this skill ran a council of five role agents on a shared draft, a synthesizer, separate writer agents and two or three review rounds. Every step added text and no step removed any. The sound area of Кузня Миров came out as five notes of 160 KB, full of invented words the owner could not read, and cost about three million agent tokens; the same design now fits one 8 KB note. Keep each step cheap and each note short.

## Before anything

1. **Find the project folder.** The code repo of a personal project names it in its CLAUDE.md (`C:\projects\obsidian\Проекты\Кузня Миров\`); in a vault session the owner names the project. A project without a folder yet: agree on its name with the owner, then create the folder, the card and the section hub notes by `C:\projects\obsidian\Проекты\Шаблон проекта.md` (вид: разработка) and the folder rules of `C:\projects\obsidian\CLAUDE.md`.
2. **Read `${CLAUDE_PLUGIN_ROOT}/references/document-templates.md`** — what goes into which note, form, size limits, words, and which Кузня note to copy for each kind.
3. **Read only what the task touches:** the project card, the concept, the architecture hub, and the notes of the areas the change affects. Not the whole project folder, not the journal, not old phases.
4. **If the system already has code, read how the affected part works now** — the files of that part in the code repo, found by search, not the whole repository. The design extends what exists; a note that describes a different system than the code is a bug.

Section and note names carry the project's short name the existing sections already use (`Архитектура Кузни`, `Журнал Кузни`). An area of the system is a note inside `Архитектура <Имя>/`; a separately built part (its own service, binary or package) is a note in `Модули <Имя>/`. Both follow the same note form.

## Interview

Ask in plain Russian in the conversation, one to three questions per turn, and only what the owner decides: what the system or feature must do and for whom, what stays out, and choices expensive to reverse — language, where it runs, where data lives, what a feature includes. Offer such a choice as two or three options with your recommendation and its reason in one sentence. Decide smaller technical details yourself and name them in the summary. Do not ask what the concept, the architecture or the code already settle.

Stop asking once the notes can be written without guesses.

## New project

Concept → architecture hub → the area notes the first phases need → phase outlines when the owner asks. After the concept and after the hub, give the owner a short summary in chat and wait for his confirmation before the next step.

## Change to an existing design

For «давай добавим звук», «поменяем X на Y»:

1. Interview until the change is concrete.
2. Decide which notes change: the area note; the hub when a block or a link between blocks changes (its block description and diagram); the concept when a requirement changes. A subject that fits no existing area gets its own note, linked from the hub's block description — never a paragraph inside an unrelated note.
3. Edit in place so each note reads as the current design: replace table rows, bullets and diagram nodes rather than appending explanations. A neighbour note that the change makes stale is fixed in the same pass, and a closed list in it (fields, commands, keys) is extended with the new entries.

## Phases

For «разбей на фазы»: propose the order in chat — each phase is a feature the owner can try by hand, and each builds on the previous ones. After the owner agrees, write one outline note per phase in `Фазы <Имя>/` by the outline template. Detailing a phase into an implementation plan is feature-planner's job; it fills the outline note in place.

## Review

After writing new notes or rewriting a note substantially, dispatch `doc-reviewer` once for the whole batch. Pass the project folder, the list of notes written or changed, and one sentence describing the change. A small edit — a table row, a bullet, a link — needs no review.

Apply the findings you agree with yourself, without another review round. Findings marked as questions for the owner go into your summary.

## Finish

- Tell the owner in Russian, briefly: which notes were created or changed, the main decisions in plain words, and what he still has to decide. Do not paste note contents into the chat.
- Do not write journal entries or touch the project card: the reasons and rejected options stay in this conversation, and `/close-session` records them and moves the card when the owner ends the session.
- Do not commit: obsidian-git commits the vault on its own.

## Not this skill

- Implementing the design in code → task-build or a dev agent.
- Detailing one phase for implementation → feature-planner.
