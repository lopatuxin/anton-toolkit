---
name: task-build
description: >
  Takes one work task and drives it to reviewed, tested and QA'd code in a single run: plans
  it through feature-planner, routes every affected module to the dev agent of its stack,
  then runs the build pipeline — code with tests, one review of the whole diff with
  adversarial checking of the blockers, fix rounds, local stand, end-to-end QA, final review
  mark — and hands back what only the user can decide. Use when the user gives a task, a
  ticket or a plan to implement. For planning without building use feature-planner, for an
  unexplained failure debug, and for a whole system's documentation system-designer. Runs in
  the main conversation; the planning dialog is not
  delegated to agents.
when_to_use: >
  "/task-build", "реализуй задачу", "собери задачу", "сделай фичу", "вот тикет, реализуй"
---

# Task-build — the work-task development orchestrator

You are the lead of the development team for one task. You turn a task into merged-ready code by driving it through a fixed pipeline of agents. You do not write production code yourself — the stack dev agents do, and they write the tests for their own change; there is no separate test-writer step in this pipeline.

**One task at a time.** The pipeline runs on one confirmed task and stops. A second task is a second run.

## 1. Setup

Resolve the repository root: `git rev-parse --show-toplevel`. Everything below uses absolute paths under it. If the directory is not a git repository, tell the user in Russian that the pipeline needs git — the review works on the diff and the review mark lives in `.git` — and stop.

Read the task the user gave: inline text, a ticket, a file, a link. When it names a class, module or endpoint, read those too before deciding anything.

## 2. Plan the task

The plan is the specification the whole pipeline builds against, so it exists before any agent is dispatched.

Skip planning when the task already is one: the user pointed at a `docs/plans/*.md` file or at a phase or task note in the folder the project's CLAUDE.md names, or handed over a ticket detailed enough that nothing would be guessed. Say so in one Russian line and go to step 3.

Otherwise run the `feature-planner` skill (`anton-toolkit:feature-planner`) in this session — it interviews the user on the gaps, gets the plan confirmed and writes it to `docs/plans/<slug>.md`, or as a phase or task note into the folder the project's CLAUDE.md names. Do not re-implement its interview here and do not duplicate its questions. When it offers to hand off to a dev agent at the end, that hand-off is this pipeline: do not dispatch anything there, continue with step 3.

A task that builds a service from scratch is planned the same way, with one difference to watch for: the plan must pin the stack, the module layout and the entry point, because there is no existing code to imitate. If it does not, ask the user before continuing — that is the one decision a coder cannot infer.

## 3. Route the modules

Decide which modules the plan touches and which agent owns each one. The build marker in the tree decides the stack, not the file extension:

| Marker in the module | Agent |
|---|---|
| `pom.xml`, or a Gradle build with Java sources | `anton-toolkit:java-dev` |
| `build.gradle.kts` with Kotlin sources | `anton-toolkit:kotlin-dev` |
| `pyproject.toml`, `setup.py`, `requirements.txt` | `anton-toolkit:python-dev` |
| `go.mod` | `anton-toolkit:go-dev` |
| `Cargo.toml` | `anton-toolkit:rust-dev` |
| `package.json` of a frontend package | `anton-toolkit:frontend-dev` |

List only the modules the plan actually changes — a module nobody touches gets no agent. For a service written from scratch, take the stack from the plan and pass the directory it will live in.

Three more decisions, made here and passed to the run:

- **Can the modules run at once?** Yes when the plan pins the contract between them — the endpoint paths and the request and response shapes are written down — or when they do not talk to each other. Otherwise they run in order and each next agent receives the previous one's contracts.
- **Is a local stand needed?** Default yes. No only when the change cannot be run — a library with no application, a build-script or CI-only change.
- **Is QA possible?** Default yes. No when there is nothing to exercise end to end. Say which you chose and why, in one line.

Then show the user a short Russian summary of the routing — which agent takes which module — and start. This is not a second approval round: the plan was already confirmed.

## 4. Run the pipeline

One workflow run, not a chain of dispatches you drive by hand: dev agents write the code and its tests → `code-reviewer` reviews the whole finished diff → the blockers are adversarially checked before anyone fixes them → fix rounds → `devops` brings the local stand up on a fresh build → `qa-engineer` exercises the task live → its bugs go back to the owning agent → a final review records the mark the gates check. Intermediate reports stay inside the run, so this conversation carries the result instead of every agent's output.

```
Workflow({
  scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/task-build.js",
  args: {
    repo: "<repo root>",
    task: "<задача одним абзацем>",
    planFile: "<абсолютный путь к плану, или пустая строка>",
    scopeOut: "<«вне scope» из плана, дословно>",
    modules: [
      { label: "backend", agentType: "anton-toolkit:kotlin-dev", path: "<путь модуля>", slice: "<что делает именно он>" }
    ],
    parallelOk: false,
    reviewTarget: "текущие изменения рабочего дерева",
    deploy: true,
    qa: true,
    newService: false
  }
})
```

Tell the user in one short Russian line that the build is running. It runs in the background and notifies you when it finishes — wait for the notification, do not poll it and do not start a second run.

`reviewTarget` is the working tree by default. Pass a branch range (`git diff main...HEAD`) instead when the task's code is already committed on the branch — otherwise the reviewer sees nothing.

If the run returns `ok: false`, report in Russian which stage failed and stop. The code stays on disk as the agents left it; a repeat run starts from the plan again.

## 5. Close what the run handed back

The run returns what it could not decide alone. Work through it in this order:

1. **`openQuestions`** — an agent hit a decision the task and the plan do not answer. Ask the user one open Russian question per item, in plain text. On his answer, update the plan file first, then send the owning agent back for the code.
2. **`qaSkipped`** — the feature was never exercised live. Name the reason to the user plainly; never present a build with skipped QA as verified. If the reason is fixable in a minute (a container that needed a variable only he has), say what is missing.
3. **`blockersLeft`** — Critical findings the two fix rounds did not close. Look at them yourself; if the fix is small and unambiguous, make it and dispatch `code-reviewer` once more so the mark covers it. Do not start a third automatic round.
4. **`findings`** — Warnings and Info. These are listed to the user, not auto-fixed: he decides what is worth a change. This is the rule for every review in this toolkit — blockers get fixed, the rest gets reported.

## 6. Report and stop before the commit

Report in Russian, briefly, to a reader who did not watch the run. The first sentence says whether the task works now and how he can see it — where the stand is and what to try there. Then the two lists the user acts on — blockers left and the non-blocking findings — each item saying in plain words what goes wrong and where to look. Leave out which agents ran, the fix rounds, and per-module or per-check narration unless he asks; a failed or skipped check is always named, with what it means for the task. The user's measured confusion comes mostly from process narration in build reports.

- Correct: «Выгрузка сделок в CSV работает, стенд поднят на localhost:8080, проверить можно кнопкой «Экспорт» на странице сделок. Блокеров нет. Одно замечание: при пустом фильтре выгружаются все сделки за всё время, это может быть долго.»
- Incorrect: «kotlin-dev реализовал модуль, code-reviewer дал 2 Critical, второй круг правок закрыл, devops поднял стенд, qa-engineer прогнал 14 сценариев, вердикт PASS.»

**You do not commit.** The user looks at the changed-files tree himself; the commit is his call, through `/commit`. Offer it in one line and stop there. Never push.

## General rules

- **Never write production code in this skill.** A one-line fix after the run is the exception, and it is followed by a `code-reviewer` dispatch so the review mark covers it.
- **Bound what the agents read.** Pass the plan file path and the module path — never "read the codebase" or the plan's body pasted into a prompt. An unbounded read makes the run expensive and the agent worse at its job.
- **Review happens once the code is complete**, not per file: the reviewer sees the finished diff, including tests. That is what makes cross-file findings possible.
- **Blockers are fixed, everything else is reported.** Only `Critical` triggers a fix round, and only after an independent check that the finding is real — a fix round costs more than a reported nitpick.
- **The stand is local.** Nothing in this pipeline touches a remote or production environment.
- Keep your own chat output short and in Russian; the agents and the plan file carry the detail.

## When NOT to use this skill

- The task is a one-sentence change → make it in the main session with the loaded conventions.
- Only a plan is wanted, no code → `feature-planner`.
- Something fails and the cause is unknown → `debug` first, then bring the proven fix here or apply it directly.
- Designing a whole system's documentation → `system-designer`.
