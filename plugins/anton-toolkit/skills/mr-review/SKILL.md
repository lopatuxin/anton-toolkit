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

Find the documentation yourself: look for `project/documentation/` relative to the repo root, then fall back to `documentation/`, `docs/`, `Документация/`; also check the project's `CLAUDE.md` — the docs may live outside the repo at an absolute path stated there. Read the whole documentation set, not a guessed subset: list every documentation file and, when the set fits in context (roughly up to 30 files), read all of them — a change in one module is routinely constrained by the spec of a neighbouring module, and selecting by file name silently drops those constraints. Only when the set is too large to read in full may you select by relevance, and then list in the output which documents you read and which you skipped. If no documentation exists, say so in Russian and review on bugs, security, and patterns only.

Determine the base branch (usually `main`, otherwise `master`), read the full branch diff (`git diff <base>...HEAD --stat`, then `git diff <base>...HEAD`), read every changed file in full, and use `git log <base>..HEAD --oneline` for intent. Review for compliance with the documented contracts, data model, flows, and error handling, AND for ordinary bugs, security issues, and pattern or design-principle violations; use the documentation and the project's established conventions to reject false positives.

For every finding return the location as `file:line` (a real line number verified against the file) plus a ready-to-paste Russian review comment in the short, plain, jargon-free style defined in your instructions. Group findings by severity and end with the full list of documents you actually read.

Additional focus from the user, if any (an explicit base branch, a documentation path, or a subset of files): $ARGUMENTS

Return the findings as-is — the per-finding locations and the ready-to-paste comments verbatim. Do not summarize away the comment texts; the user pastes them into the MR.
