---
description: Review the current branch (MR) against the project documentation and return ready-to-paste review comments.
---

Launch the `mr-spec-reviewer` agent via the Agent tool to review the current branch
against the project's own documentation.

Pass the agent this instruction:

> Review all changes on the current git branch (this is an MR/PR) against the project
> documentation. Find the documentation yourself: look for `project/documentation/`
> relative to the repo root, then fall back to `documentation/`, `docs/`,
> `Документация/`. Read the documents relevant to the changed code. Determine the base
> branch (usually `main`), read the full branch diff (`git diff <base>...HEAD`), and
> read every changed file in full. Review for spec compliance against the
> documentation AND for ordinary bugs, security issues, and pattern violations; use the
> documentation to reject false positives. For every finding return the location as
> `file:line` plus a ready-to-paste Russian review comment in the short, plain,
> jargon-free style defined in the agent. Group findings by severity.

If `$ARGUMENTS` is non-empty, append it to the agent instruction (e.g. an explicit
base branch, a documentation path, or a subset of files to focus on).

When the agent returns, relay its findings to the user as-is — the per-finding
locations and the ready-to-paste comments. Do not summarize away the comment texts;
the user needs them verbatim to paste into the MR.
