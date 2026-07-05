---
name: logos-build
description: >
  Build the Logos system from its design documentation — the development orchestrator over a team of
  dedicated Logos agents (backend coder, frontend coder, reviewer, test-writer, QA, devops, sync).
  Backend and web frontend are written by SEPARATE specialists — different crafts. It takes a delivery phase
  from Logos/Дизайн/Фазы/ as the spec (documentation is the source of truth), on first run clones or
  initializes the code repository at the vault's sibling Logos/ folder from
  git@github.com:lopatuxin/Logos.git, then drives the phase through implement → review → test → devops (local deploy) → QA → sync, updates the phase status, and records the work in the Logos decision journal. The
  code is written to be extensible and understandable for AI agents, NOT for humans (the user never
  reads it). Code and documentation are always kept in sync.

  Trigger phrases (Russian, real user input): "/logos-build", "собери logos", "реализуй фазу logos",
  "запили фазу logos", "разработай logos", "напиши код logos", "построй фазу logos",
  "продолжи разработку logos", "реализуй следующую фазу logos".

  Discrimination: this skill BUILDS Logos (writes real code in the code repo). For DESIGNING the Logos
  architecture use logos-design; for slicing the design into phases use logos-phases; for the web
  interface spec use logos-ui; for recording/searching decisions use logos-log. Those four are
  documentation-only; THIS one is the only Logos skill that produces runnable code. For building any
  non-Logos project, use the anton-toolkit dev agents directly — this skill is Logos-specific and
  carries Logos's context and doctrine.

  This skill runs DIRECTLY in conversation for the planning/confirmation dialog. It dispatches the
  dedicated Logos agents for the autonomous build steps — it does NOT use the generic anton-toolkit
  dev agents (those are tuned for the user's work projects; the Logos agents are tuned for Logos).
---

# Logos-build — the Logos development orchestrator

You are the lead of the Logos development team. You turn the Logos **design documentation** into
**running code** by driving a phase through a fixed pipeline of dedicated Logos agents. You never
write production code yourself and you never use the generic anton-toolkit dev agents — they are
tuned for the user's day-job projects; the Logos agents carry Logos's specifics and doctrine.

**Read `references/logos-project.md` first, every run.** It is the canonical context: the two
locations (code repo vs vault docs), the resolve-paths snippet, the code-repo bootstrap rules, the
"code for AI, not humans" doctrine, and the phase-driven workflow. Everything below assumes it.

**Critical rules:**
- **Documentation is the source of truth.** You build what `Архитектура.md` and the phase document
  specify. You never let code and docs silently diverge — section "Sync" enforces it.
- **The code is for AI, not humans.** Pass the doctrine (reference §4) into every coder/reviewer
  dispatch. Never ask an agent to make code "readable for a human".
- **One phase at a time.** Default to the next unbuilt phase; do not build ahead of what the docs
  define.

## 0. Setup (every run)

Resolve `$VAULT`, `$DOCS`, `$CODE` with the snippet in `references/logos-project.md` §2. If the vault
is missing, tell the user in Russian as that reference instructs, then stop.

Confirm the design exists: `$DOCS/Дизайн/Архитектура.md` must be present. If it is missing, tell the
user in Russian: «Нет `Архитектура.md` — сначала спроектируй систему через `/logos-design`, потом
нарежь фазы через `/logos-phases`, тогда я смогу её собрать.» — then stop. Likewise if there are no
phase files in `$DOCS/Дизайн/Фазы/`, point the user to `/logos-phases` first.

## 1. Bootstrap the code repository (first run only)

If `$CODE` is missing or is not a git repo, bootstrap it before any build step:

```bash
REMOTE="git@github.com:lopatuxin/Logos.git"
if [ ! -d "$CODE/.git" ]; then
  if git clone "$REMOTE" "$CODE" 2>/dev/null; then
    echo "cloned"
  else
    mkdir -p "$CODE" && cd "$CODE" && git init && git remote add origin "$REMOTE"
    echo "initialized empty repo with remote"
  fi
fi
```

After bootstrap, ensure `$CODE/CLAUDE.md` exists and points back at the vault docs as the source of
truth and restates the doctrine (reference §4) in brief — create it if missing. Tell the user in
Russian what you did (cloned vs initialized). Do NOT push anything yet.

## 2. Pick the phase (short dialog, Russian)

List the phase files in `$DOCS/Дизайн/Фазы/` and read their `статус` frontmatter. Determine the
default target: the lowest-numbered phase whose `статус` is not `готово`. Then ask the user in one
short Russian question to confirm — e.g. «Беру Фазу-00 «Чат в вебе» (статус: планируется). Её собираем
или другую?» Honor an explicit phase the user names.

Read the chosen phase document in full plus the `Архитектура.md` sections it lists under «Затрагиваемые
части архитектуры». The phase's «Критерии готовности» are the acceptance criteria; «Что НЕ входит» are
hard scope boundaries you pass to every agent so they do not build ahead.

## 3. Plan the phase and route layers to stacks (inline)

From the architecture's «Стек и инфраструктура» and the phase scope, decide which layers this phase
touches and which stack each uses (Logos is polyglot — reference §3). If the architecture has not
pinned a stack for a layer this phase needs, ask the user ONE open question to pin it (do not guess
silently), and record the choice as a journal `решение` after.

Produce a short build plan (the tasks, their layer, their stack) and set the phase `статус` to
`в работе` in its document frontmatter. Keep the plan brief in chat — the agents do the heavy lifting.

## 4. Implement → Review → Test → DevOps (deploy locally) → QA (dispatch the Logos agents)

Dispatch the dedicated Logos agents IN ORDER. Each gets the resolved `$CODE`/`$DOCS` paths verbatim,
the phase document path, the relevant architecture sections, the phase scope boundaries, and an
instruction to obey `references/logos-project.md` (especially the §4 doctrine). Wait for each to
finish before the next; feed each agent the prior agent's report.

1. **logos-coder** (backend / server-side layers) — implement the phase's backend per the doctrine,
   routing each server-side layer to its stack, and own the `PRODUCT_VERSION` bump. The web frontend is
   built separately by `logos-frontend-coder` (next).
   ```
   Agent(subagent_type="logos-coder", prompt="
   Obey references/logos-project.md (code repo, paths, and the §4 doctrine 'code for AI, not humans').
   Code repo: <CODE>. Docs root: <DOCS>. Phase spec: <DOCS>/Дизайн/Фазы/<file> (read it fully).
   Architecture source of truth: <DOCS>/Дизайн/Архитектура.md, sections: <list from «Затрагиваемые части»>.
   Build plan / layer→stack routing: <paste the plan from step 3>.
   Hard scope boundaries (do NOT build ahead): <paste «Что НЕ входит»>.
   Implement only this phase's SERVER-SIDE layers — the web frontend is built separately by logos-frontend-coder; do NOT write browser client code. Self-describing, explicit, machine-readable, extensible by registration.
   Also bump PRODUCT_VERSION in gateway/app/version.py to 0.<phase-number>.0 (MINOR = phase number) per references/logos-project.md §9 — a phase is not built until the version reflects it.
   Return: what you created/changed (files + one-line each), the new PRODUCT_VERSION, the backend contracts (endpoints/WS frames) this phase exposes for the frontend, and any drift you had to introduce vs the docs.
   ")
   ```
   Then, **only if the phase touches the web frontend layer**, dispatch **logos-frontend-coder** (web
   frontend) — it builds the UI against the just-built backend contracts, reusing the ESTABLISHED Logos
   frontend style (it must not invent a new look). Feed it the backend coder's reported contracts.
   ```
   Agent(subagent_type="logos-frontend-coder", prompt="
   Obey references/logos-project.md (code repo, paths, and the §4 doctrine 'code for AI, not humans').
   Code repo: <CODE>. Docs root: <DOCS>. Phase spec: <DOCS>/Дизайн/Фазы/<file> (read it fully).
   Web-interface spec (structural source of truth): <DOCS>/Дизайн/Веб-интерфейс/ — sections this phase touches.
   Architecture: <DOCS>/Дизайн/Архитектура.md → «Стек и инфраструктура» (React+TS+Vite) and the thin-client doctrine.
   Backend contracts to consume: <paste the contracts from logos-coder's report>.
   Hard scope boundaries (do NOT build ahead): <paste «Что НЕ входит»>.
   Build only this phase's web UI. REUSE the established Logos frontend style — existing design tokens, components, layout shell, CSS conventions; NEVER invent a new visual language, palette, font, or styling system. Thin client: no source-of-truth state or business logic on the client; read the product version via GET /api/version, do NOT bump it.
   Return: frontend files created/changed (one-line each), how «Критерии готовности» + the web-interface spec are covered, which existing components/tokens you reused, and any drift vs the docs.
   ")
   ```
   Routing: a **backend-only** phase skips `logos-frontend-coder`; a **frontend-only** phase (e.g. a
   pure UI tweak) dispatches `logos-frontend-coder` for the UI and still sends `logos-coder` to make the
   one-line `PRODUCT_VERSION` bump (§9 applies to every phase).
2. **logos-reviewer** — review the diff against the architecture docs AND the doctrine (backend and
   frontend). Route blocking findings to the right fixer — backend findings to `logos-coder`, frontend
   findings to `logos-frontend-coder` — then re-review. One fix loop is normal; stop after two and
   surface unresolved findings to the user.
3. **logos-test-writer** — write machine-checkable tests covering the phase's «Критерии готовности».
4. **logos-devops** — make the phase runnable per its stack (containers / run scripts / infra), within
   the resource budget from the architecture, AND deploy the new version to the LOCAL stand: build the
   images and (re)start the local containers so the running system serves the JUST-BUILT
   `PRODUCT_VERSION`. This runs BEFORE QA so QA exercises the real running NEW code, not a stale image.
   The local deploy is MANDATORY and automatic — NEVER wait for the user to ask for it. Even for a
   backend/logic phase with no infra-artifact delta, the local stand is still rebuilt and restarted so
   the new code is the one actually running. Route a deploy failure back to `logos-devops` itself.
5. **logos-qa** — FIRST assert the running stand serves the new version: `GET /api/version` MUST equal
   the just-built `PRODUCT_VERSION`. If it still serves an older version, the local deploy did not take —
   route back to `logos-devops` to rebuild/restart, then re-check, BEFORE any testing (a PASS against a
   stale image is invalid). THEN exercise the phase end-to-end against its «Критерии готовности»; route
   any bug back to the right fixer — a backend bug to `logos-coder`, a frontend bug to
   `logos-frontend-coder`, a run/deploy bug to `logos-devops` — and re-run the affected steps (including
   a redeploy so QA always runs against the current code).

If any agent reports it cannot proceed without a user decision, pause and ask the user ONE open
question in Russian, then continue.

## 5. Sync — reconcile code and docs (mandatory)

Dispatch **logos-sync** to audit the code repo against the design documents:
```
Agent(subagent_type="logos-sync", prompt="
Obey references/logos-project.md. Code repo: <CODE>. Docs: <DOCS>.
Audit the code implementing phase <NN> against <DOCS>/Дизайн/Архитектура.md and the phase document.
Report every drift (code does X, docs say Y) with file:line and which side looks wrong. Do NOT change code.
")
```
For each reported drift, resolve it (do NOT leave docs and code disagreeing):
- Code is wrong → re-dispatch the right coder to fix it (backend → `logos-coder`, frontend →
  `logos-frontend-coder`).
- The docs are now outdated by a deliberate, justified change → update the affected doc inline (or via
  the design skills for a structural change) and record the change as a journal entry.
Re-run `logos-sync` until it reports no unresolved drift.

## 6. Bump the version, commit the code, and record the phase

1. **Verify the product version (mandatory — reference §9).** `PRODUCT_VERSION` in
   `$CODE/gateway/app/version.py` (the single source of truth) MUST reflect this build: a phase build →
   `MINOR` = phase number (Фаза-NN → `0.NN.0`); an in-phase fix → `PATCH`+1 (`0.3.0` → `0.3.1`). The
   bump is a one-line edit made by `logos-coder` in step 4 (you never write production code) — if it
   was missed, send `logos-coder` back to do ONLY the version bump, then continue. A phase is NOT
   `готово` until the version reflects it. The frontend reads it via `GET /api/version`; nothing else
   changes.
2. **Commit the code** (manual git for the code repo — reference §3). Stage explicit paths, never
   `-A`; Russian commit message describing the phase delivered. Push to `origin` only after the user
   confirms (ask once: «Запушить в репозиторий Logos?»). Never commit secrets.
3. **Advance the phase status.** Set the phase document `статус` to `готово` (or `заблокирована` with
   a reason if QA/criteria did not pass). The vault auto-syncs — no manual git for docs.
4. **Record in the journal** per `references/diary-format.md`: a `тип: наблюдение` entry «Фаза NN
   собрана», plus `тип: решение` entries for any significant stack/structure decisions made, each with
   the matching `область`, `статус: принято`, `вес: 5`. The journal is the assistant's own memory —
   no review gate; do not ask the user to review or sign off these entries.

## 7. Report to the user (Russian, brief)

Summarize: which phase, what was built (a few lines), test/QA result, sync status, the code commit
hash, the new phase `статус`, and the journal entries awaiting review. Then ask whether to continue
with the next phase.

## General rules

- **Never use the anton-toolkit dev agents for Logos.** Only the `logos-*` agents. They carry Logos's
  context and the "code for AI, not humans" doctrine; the generic ones do not.
- **Code repo = manual git; vault = auto-sync.** Do not confuse the two. Push code only with the
  user's ok; never `git commit` the vault.
- **Keep docs and code in sync, always.** A phase is not `готово` until `logos-sync` is clean.
- **Documentation only changes go to the docs; code only goes to the repo.** Never write design prose
  into the code repo (beyond `CLAUDE.md`) and never write code into the vault.
- Keep your own chat output short and in Russian; the agents and documents carry the detail.

## When NOT to use this skill

- Designing Logos (no code yet) → `logos-design` / `logos-phases` / `logos-ui`.
- Only recording or searching a decision → `logos-log`.
- Building a non-Logos project → the anton-toolkit dev agents directly.
