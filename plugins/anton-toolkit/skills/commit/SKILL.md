---
name: commit
description: >
  Creates a git commit with a Russian past-tense message from the current changes — stages
  files explicitly by name, one commit by default, never pushes. Use when the user asks to
  commit or save changes.
when_to_use: >
  "коммит", "закоммить", "сохрани изменения", "/commit"
---

# Commit — Russian-language commits

Create a commit with a Russian-language message describing all code changes.

## Process

1. **Check repository state.** Run `git status` and `git diff --staged`. If there are no staged changes, run `git diff` to analyze unstaged ones.

2. **Analyze the changes.** Read the full diff. Determine:
   - Which files were changed, added, deleted
   - The nature of each change (new feature, bug fix, refactoring, etc.)

3. **Run the code review when the repository asks for it.** If the repository has a `.claude/review-gate` file and the changes include code (source, build, config or Docker files — not only docs), run the `anton-toolkit:code-reviewer` agent on the current changes before committing, unless a review of exactly this state already happened in this conversation. Fix the blockers it reports, or report them to the user and stop. Any code edit after the review needs a new run — the gate checks the final state. The reviewer records the review mark itself; nothing else needs to be run.

4. **Stage the files.** If files are not staged — add ALL changed files by name via `git add`. Do NOT use `git add -A` or `git add .` — list files explicitly to avoid including secrets (.env, credentials). By default commit everything. Do NOT split changes into multiple commits unless the user explicitly asks.

5. **Compose the commit message** in Russian:
   - First line — short description (up to 72 characters), starts with a past-tense verb
   - Blank line
   - Detailed description of all changes if there are many
   - Do NOT add Co-Authored-By or any other signatures

6. **Check commit history** (`git log --oneline -10`) to adapt the message style to the existing history.

7. **Execute the commit** via `git commit`, passing the message through a HEREDOC:
   ```
   git commit -m "$(cat <<'EOF'
   Сообщение коммита
   EOF
   )"
   ```

8. **Confirm the result.** Run `git status` after the commit and show the user the result.

## Message examples

- `Добавил авторизацию через JWT токены`
- `Исправил ошибку парсинга дат в модуле отчётов`
- `Обновил зависимости и исправил конфликты типов`
- `Удалил неиспользуемые компоненты из UI`
- `Реализовал пагинацию для списка пользователей`

## Rules

- NEVER push automatically — commit only
- Do not use `--no-verify` or `--no-gpg-sign` without explicit user request
- Do not commit files with secrets (.env, API keys, passwords). Warn the user if any are found.
- If a pre-commit hook fails — fix the issue and create a NEW commit (not --amend)
- If `git commit` is blocked by the review gate hook — do what its message says: run `anton-toolkit:code-reviewer` on the listed files, fix the blockers, then commit again. Do not bypass the gate with `ANTON_SKIP_REVIEW=1` unless the user explicitly asks for it.
- If there are no changes to commit — say so, do not create an empty commit
