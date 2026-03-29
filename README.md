# anton-toolkit

Personal Claude plugin with custom skills.

## Skills

### /commit
Analyzes code changes and creates git commits with Russian-language messages.
Automatically stages files, generates descriptive messages, and commits.

## Installation

### From .plugin file
Install the `.plugin` file through Claude interface.

### From Git (recommended for portability)
```bash
git clone <your-repo-url> /path/to/anton-toolkit
```
Then install the plugin from the cloned directory.

## Adding new skills

Create a new directory under `skills/` with a `SKILL.md` file:

```
skills/
├── commit/
│   └── SKILL.md
└── your-new-skill/
    ├── SKILL.md
    └── references/    # optional detailed docs
```
