---
name: close-session
description: >
  Closes a work session with records, in any project, personal or work: a short project-journal
  entry for every decision and dead end of this session (why one option won — what git and the
  code cannot show), the project card's `next` and `updated`, a proposed line for the owner's
  profile `Кто-я.md`, and cleanup of the memory notes this session wrote. Use when the owner ends
  a session. It is the only writer of project journal entries and project cards; the owner's life
  portrait belongs to the lichnost reviews (/itogi).
when_to_use: >
  "закрой сессию", "закрываем сессию", "/close-session"
---

# Close Session

Git keeps what changed and the code shows how it works. Why one option was chosen and another rejected lives only in this conversation and is gone when the session closes. This skill writes that down in the project journal, moves the project card forward, and keeps the owner's profile and Claude's memory from repeating it. No other skill, agent or instruction writes journal entries or project cards.

Write only what the conversation actually contains. After a compaction a reason may be missing — then the entry says what was chosen and leaves the reason out; never reconstruct a reason.

## 1. Find the project

A project card is a vault note with `kind: project` in its frontmatter, under `C:\projects\obsidian\Проекты\` or `C:\projects\obsidian\Работа\`. Match its `repo:` field against the repository the session worked in; in a vault session take the card of the project whose notes changed. A session that touched several projects gets steps 2–3 for each. No matching card (the plugins repo, setup of Claude or the vault): skip steps 2–3, and its decisions go to memory in step 5. When the project is unclear, ask one short question.

## 2. Journal

**What goes in.** A decision: a choice between real options made in this session, whose reason git and the code do not show — a format, a storage place, a protocol, a boundary between parts, an approach rejected. A dead end: an approach tried that did not work, with the cause — reverted code leaves no trace, and without the entry it gets tried again. Decisions of the owner and of Claude count alike.

**What stays out.** What was done, fixed, refactored or committed (git). How a part works (code, architecture notes). Progress and status (card, phases). The story of how the session got there. Tool gotchas and ways of working with the owner (memory, profile). A routine session usually has no decisions — then write nothing.

**Where.** The folder whose name starts with `Журнал` inside the card's folder: `Журнал Кузни/`, `Журнал VPN/`, `Журнал Logos/`. A project without one gets `Журнал <Имя>/` next to its card, with the hub note `Журнал <Имя>.md` copied from `C:\projects\obsidian\Проекты\Кузня Миров\Журнал Кузни\Журнал Кузни.md` (change the `FROM` paths, tags, title and link line). Folder and note names follow the vault's CLAUDE.md: Russian, unique across the whole vault; `Работа/otc_desk` keeps the employer's names.

**Before writing**, list the journal's entries of the last few days and read any on the same subject: a decision recorded earlier in this session is not written again. A decision that reverses an existing entry gets a new entry; the old one gets `статус: отменено` and a line `Отменено: [[<новая запись>]]`.

**Entry.** One decision per file, `ГГГГ-ММ-ДД-<короткое-имя-строчными-через-дефис>.md`. Copy the frontmatter fields from a sibling entry of the same journal: `тип` is `решение` or `тупик`, `статус: принято`, `вес` 1–10 by how much of the system rests on it, `область` — the part of the system, `tags` — the project tag plus `журнал`. The heading states the decision itself, not its topic. The link line holds the journal hub and the note of the area the decision concerns, when one exists. Body under 15 lines, no `##` sections:

```markdown
---
дата: 2026-09-16
тип: решение
область: формат
вес: 6
статус: принято
tags:
  - кузня-миров
  - журнал
---

# Объекты в формате игры без наследования

[[Журнал Кузни]] · [[Формат игры]]

Каждый объект записан в файле целиком, заготовок с наследованием нет.

Почему: иначе, чтобы понять объект, пришлось бы проходить цепочку родителей.

Отвергли: заготовки с наследованием — экономят место, но сорок одинаковых кирпичей и так порождает редактор.
```

A dead end uses `Пробовали:` and `Не вышло, потому что:` instead.

Real cases of what not to write: a VPN entry bundled twelve decisions with a paragraph of reasoning each, retelling the architecture notes — 20 KB that cannot be read in a minute or cancelled one decision at a time. A Logos entry had `Контекст`, `Решение / что сделано`, `Обоснование`, `Результат` sections telling the session's story around one sentence of decision.

Plain short Russian sentences, wiki-links by note name, no code, no numbers that live in the code.

## 3. Project card

- `next` — one or two sentences: only what remains to be done, the next concrete steps. No finished or merged tasks, no summary of what the session did. Replace the old value whole. Correct: «Доделать TRADEX-542 — один коммит ещё не отправлен на сервер». Incorrect: «TRADEX-518, 543 и 562 влиты. Открыта TRADEX-542…» — the merged tasks need no action and do not belong here. Real case: the otc_desk card's `next` grew to 1,500 characters of ticket-by-ticket history.
- Before writing `next`, check which tasks are already merged — a merged task is left out of `next` entirely. In the card's `repo:` run `git fetch --prune`, then `git branch -r` and `git branch -vv`. A task is merged when its branch (the branch name carries the task ID, e.g. `feature/TRADEX-543/backoffice_roles`) is gone from the remote: the MR deletes the branch on merge, and `git branch -vv` marks the local copy `[origin/...: gone]`. Pushed is not merged: a branch still on the remote is in review or in work. A local branch that was never pushed (no upstream) is in work, not merged. Real case: the otc_desk card said «В работе TRADEX-518, 543, 562» while all three branches were already gone from the remote.
- `updated` — today's date.
- No other field changes. A session that moved nothing in the project (only a discussion) leaves the card alone.

## 4. Owner profile

`C:\projects\obsidian\Claude\Кто-я.md` is loaded into every session of every project, so each of its lines costs context everywhere.

- A candidate is something learned in this session that changes how Claude works with the owner in any project: a working preference, a lasting fact about his environment or his knowledge. Project-specific rules belong to that project's CLAUDE.md or memory. Life, goals and character belong to `Личная/Портрет/Профиль.md`, which the lichnost reviews (`/itogi`) build from the diary — never write there.
- Already covered — nothing to do. Contradicts an existing line — replace that line instead of adding.
- The file stays within 60 lines: to go past that, merge lines or drop the weakest one.
- Show the owner the exact line, and the line it replaces or removes, and write only after his yes. This is the only step that waits for approval.

## 5. Memory

The project's memory folder is `C:\projects\obsidian\.claude-sync\memory\<project>\`.

- Take the memory files this session created or changed. Remove from them what now lives in the journal or the card, and any session history — what was renamed, commit hashes, step-by-step progress. A file left empty is deleted together with its line in `MEMORY.md`.
- Memory keeps only what has no other home: tool and environment traps, how to work in this project, and the decisions of a session with no project card, as a short note with **Why:**.
- Memory files older than this session are not touched.

## 6. Report

Tell the owner in Russian, briefly: the journal entries written (their headings), what `next` says now, what changed in memory, and the proposed profile line if there is one. Nothing to record — say so in one sentence. Do not paste entry contents. Do not commit: obsidian-git commits the vault on its own.
