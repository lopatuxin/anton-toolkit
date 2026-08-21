# The vault — shared context for every lichnost skill

Everything this plugin writes lives in the personal area of the user's Obsidian vault. This file is
the ONE copy of the vault search and of the conventions all five skills share; a skill points here
instead of repeating them.

## Finding the vault

Find it BY CONTENT on every run — never from a hardcoded path, because the vault has moved before and
a stale path fails silently. The vault root is the directory holding both `.obsidian/` and `Личная/`:

```bash
VAULT=""
DIR="$(pwd)"
while [ "$DIR" != "/" ] && [ -n "$DIR" ]; do          # 1. walk up — the usual case
  if [ -d "$DIR/.obsidian" ] && [ -d "$DIR/Личная" ]; then VAULT="$DIR"; break; fi
  DIR="$(dirname "$DIR")"
done
if [ -z "$VAULT" ]; then                              # 2. the usual project roots, matched the same way
  for CANDIDATE in /c/projects/*/ "$HOME"/*/; do
    if [ -d "$CANDIDATE/.obsidian" ] && [ -d "$CANDIDATE/Личная" ]; then VAULT="${CANDIDATE%/}"; break; fi
  done
fi
echo "VAULT=$VAULT"
```

If `$VAULT` is empty, tell the user in Russian: «Не нашёл хранилище Obsidian (папку `.obsidian`).
Запусти из папки хранилища.» — then stop.

## Where each skill writes

| Folder | Skill | What is in it |
|---|---|---|
| `$VAULT/Личная/Дневник/` | `dnevnik` | one note per day, named `ГГГГ-ММ-ДД.md` |
| `$VAULT/Личная/Итоги/` | `itogi` | period reviews, one subfolder per period type |
| `$VAULT/Личная/Идеи/` | `idea` | one note per idea, named by the idea |
| `$VAULT/Личная/Портрет/` | `profil` | the psychological profile, its interviews and the source registry |
| `$VAULT/Личная/Фильмы/` | `film` | watched films, the taste profile and recommendations |

## Conventions that hold for all of them

- **Every folder needs a hub note named exactly like the folder** (`Дневник/Дневник.md`) — the vault's
  `folder-notes` plugin opens it when the folder is clicked, and its `dataview` query is what makes the
  notes inside visible. Create the hub when creating the folder; leave an existing non-empty hub alone.
- **A note without the frontmatter its hub filters on is invisible in the vault.** Copy the fields a
  sibling note carries (`type`, `tags`, `date` for dated series) before inventing new ones.
- **Russian content, Russian file names.** Chat replies too. Technical terms keep their original form.
- **Never `git commit` or `git push` the vault** — `obsidian-git` auto-commits it every ten minutes.
- **Dates come from the shell** (`date +%Y-%m-%d`, `date +%H:%M`), never from memory.
