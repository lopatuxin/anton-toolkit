---
name: mr-review
description: >
  Reviews all changes on the current branch against the project's own documentation and
  returns ready-to-paste MR comments with file:line locations. Run with /mr-review; for a
  self-contained best-practice review use code-reviewer instead.
disable-model-invocation: true
context: fork
agent: anton-toolkit:mr-spec-reviewer
background: false
---

If you are running in the main conversation rather than inside the mr-spec-reviewer agent, dispatch `anton-toolkit:mr-spec-reviewer` via the Agent tool with the text below as its prompt and return its report unchanged.

Review all changes on the current git branch (this is an MR/PR) against the project's own documentation.

Find the documentation yourself, in the owner's Obsidian vault first: read `C:\projects\obsidian\CLAUDE.md`, find the vault project folder its sibling-repo list maps to this repo, and take its `Требования <project>/` subfolder for a work project (`Работа/...`) or the concept and `Архитектура <project>/` notes for a personal one (`Проекты/...`). Only if the repo is not in that list, fall back to the path in the repo's own `CLAUDE.md`, then to `project/documentation/`, `documentation/`, `docs/`, `Документация/` in the repo. Do not read the whole documentation folder and do not pick documents by file name: learn what the change is about from the diff stat and commit log, then find the relevant documents by content search with the `vault-search` method (hub notes first, then Grep for Russian word stems of the touched domain terms plus the English identifiers from the code), follow their links one hop so the spec of the flow that triggers the changed code is included, and read every found document in full. List in the output the documents you read and the search terms you used. If no documentation exists, say so in Russian and review on bugs, security, and patterns only.

Determine the base branch (usually `main`, otherwise `master`), read the full branch diff (`git diff <base>...HEAD --stat`, then `git diff <base>...HEAD`), read every changed file in full, and use `git log <base>..HEAD --oneline` for intent. Review for compliance with the documented contracts, data model, flows, and error handling, AND for ordinary bugs, security issues, and pattern or design-principle violations; use the documentation and the project's established conventions to reject false positives.

For every finding return the location as `file:line` (a real line number verified against the file) plus a ready-to-paste Russian review comment in the short, plain, jargon-free style defined in your instructions. Group findings by severity and end with the full list of documents you actually read.

Additional focus from the user, if any (an explicit base branch, a documentation path, or a subset of files): $ARGUMENTS

Return the findings as-is — the per-finding locations and the ready-to-paste comments verbatim. Do not summarize away the comment texts; the user pastes them into the MR.
