---
name: commit
description: >
  Use when the user wants to commit changes to git with a Russian-language
  commit message. Triggers on: "commit", "коммит", "закоммить", "сохрани изменения",
  "/commit", or any request to create a git commit.
---

# Commit — Russian-language commits

Create a commit with a Russian-language message describing all code changes.

## Process

1. **Check repository state.** Run `git status` and `git diff --staged`. If there are no staged changes, run `git diff` to analyze unstaged ones.

2. **Analyze the changes.** Read the full diff. Determine:
   - Which files were changed, added, deleted
   - The nature of each change (new feature, bug fix, refactoring, etc.)

3. **Stage the files.** If files are not staged — add ALL changed files by name via `git add`. Do NOT use `git add -A` or `git add .` — list files explicitly to avoid including secrets (.env, credentials). By default commit everything. Do NOT split changes into multiple commits unless the user explicitly asks.

4. **Compose the commit message** in Russian:
   - First line — short description (up to 72 characters), starts with a past-tense verb
   - Blank line
   - Detailed description of all changes if there are many
   - Do NOT add Co-Authored-By or any other signatures

5. **Check commit history** (`git log --oneline -10`) to adapt the message style to the existing history.

6. **Execute the commit** via `git commit`, passing the message through a HEREDOC:
   ```
   git commit -m "$(cat <<'EOF'
   Сообщение коммита
   EOF
   )"
   ```

7. **Confirm the result.** Run `git status` after the commit and show the user the result.

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
- If there are no changes to commit — say so, do not create an empty commit
