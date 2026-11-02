# Marketplace source

The owner requested one Git-backed marketplace for Claude and Codex. This repository is the source of truth for all marketplace plugins; personal rules and memory still live in the owner's Obsidian vault.

Edit shared behavior in `plugins/`, preserving Claude model and effort frontmatter. Codex-only adapters live in `adapters/codex/`; the explicit role model allocation is `adapters/codex/models.json`. `codex/plugins/` and `.agents/plugins/marketplace.json` are generated, never edited directly. Run `npm ci --ignore-scripts`, `npm test`, `npm run build`, and `npm run check`, and include generated changes in the same commit. GitHub regenerates packages after source-only pushes to main as well.

Use the existing checkout. Preserve others' uncommitted changes. Keep plugin names, user enable/disable choices, model allocations and personal data intact. Only the user's explicit request authorizes changing those choices. Reconnect clients using `scripts/sync-marketplace.ps1`; do not copy personal configuration or credentials into the repository.

Do not add Co-authored-by signatures. Plugin text follows `plugins/plugin-builder/references/plugin-authoring.md`; model-facing instructions are English and user-facing dialogue is Russian.
