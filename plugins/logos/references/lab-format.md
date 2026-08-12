# Logos research branch — storage format (Исследования + Logos-Lab)

This reference defines the on-disk format of the Logos RESEARCH BRANCH: the documentation
folder `Logos/Исследования/` in the Obsidian vault and the lab code repository `Logos-Lab`.
The `logos-lab` skill reads this file and follows it verbatim, so every experiment and
direction note is uniform and searchable.

The research branch is a SEPARATE line of Logos development: moving away from big LLMs toward
a swarm of small specialized self-learning models on cheap hardware. It deliberately does NOT
mix with the production system's development. The experiment diary here is DISTINCT from the
decision journal (`Logos/Журнал/`, format in `references/diary-format.md`): the journal records
project decisions; the diary records research-branch experiments. A cross-cutting decision
(e.g. "the branch exists", "a matured conclusion enters the main design") still goes to the
journal; the day-to-day hypothesis→result loop lives here.

## 1. Locate the vault and the branch folders

Locate the Obsidian vault EXACTLY as `references/diary-format.md` section 1 prescribes (the
three-step content-based search; never a hardcoded path). If the vault is not found, tell the
user in Russian as that reference instructs, then stop.

Derived paths:

```
$LAB_DOCS = $VAULT/Logos/Исследования          # branch documentation (vault, auto-synced)
$LAB_CODE = $(dirname $VAULT)/Logos-Lab        # lab code repo, sibling of the main code repo
```

The lab repo remote is `git@github.com:lopatuxin/Logos-Lab.git`. If `$LAB_CODE` does not
exist, clone it; if the remote is empty, `git init -b main` + add the remote.

## 2. Layout

```
Logos/Исследования/
  Исследования.md            — folder note: entry map + Dataview indexes (auto-updating)
  Концепт-исследований.md    — why the branch exists, hypotheses, constraints, process
  Направления/
    Направления.md           — folder note: index of directions
    <Имя-направления>.md     — one note = one research direction (knowledge accumulator)
  Эксперименты/
    Эксперименты.md          — folder note: diary index + the experiment note template
    <YYYY-MM-DD>-<слаг>.md   — one note = one experiment
```

## 3. First-run setup (idempotent — run these checks EVERY time)

Create only what is missing; NEVER overwrite an existing non-empty file. The vault uses the
`folder-notes` plugin (opening a folder opens its note) and `Dataview` (live queries), so the
folder notes ARE the searchable index — never maintained by hand.

If `Исследования.md` is missing or empty, create it with: an H1, a two-to-three-sentence Russian
intro naming the branch's goal and the lab repo, wiki-links to [[Концепт-исследований]],
[[Направления/Направления|Направления]] and [[Эксперименты/Эксперименты|Эксперименты]], and
Dataview tables over `"Logos/Исследования/Направления"` (columns: file.link, статус, дата) and
`"Logos/Исследования/Эксперименты"` (tables: `статус = "проверяется"`; provals/dead ends via
`статус = "провал" OR тип = "тупик"`; all entries with область/статус/вес/дата). Frontmatter
tags: `logos`, `исследования`. Every `WHERE` clause excludes the folder note itself
(`file.name != this.file.name`).

If `Направления/Направления.md` is missing or empty, create it with: one paragraph of Russian
rules (one note = one direction; statuses `изучается` / `активно` / `отложено` / `закрыто`)
and a Dataview table over the folder sorted by статус, дата.

If `Эксперименты/Эксперименты.md` is missing or empty, create it with: the diary rules in
Russian (one note = one experiment; hypothesis is written BEFORE the code; the result is
appended to the SAME note; failures are recorded as diligently as successes; the code of an
experiment is one root folder in `Logos-Lab` named as the note slug), the experiment note
template from section 4 inside a fenced block, and a Dataview table over the folder.

## 4. Experiment note (one note = one experiment)

File name: `<YYYY-MM-DD>-<краткое-русское-имя>.md`, e.g.
`2026-08-20-trm-на-задаче-маршрутизации.md`. The matching code folder in `$LAB_CODE` carries
the SAME name as the note slug.

```markdown
---
дата: <YYYY-MM-DD>
тип: <эксперимент | тупик>
область: <модели | память | железо | алгоритмы | общее>
вес: <1–10>
статус: <проверяется | сработало | провал>
направление: "[[Направления/<имя>]]"
код: "Logos-Lab/<папка>"
теги:
  - logos
  - исследования
---

# <Название эксперимента одной строкой>

[[Эксперименты]]

## Гипотеза
<Что проверяем и какой результат ожидаем. Записывается ДО кода.>

## Установка
<Как проверяем: данные, модель, железо, критерий успеха.>

## Результат
<Что вышло по факту, с числами. Пока не готово — «пока не проверено».>

## Вывод
<Что это значит для Logos. Что делаем дальше или почему бросаем.>
```

Field semantics:
- **тип** — `эксперимент` (a hypothesis being tested), `тупик` (an approach proven unworkable —
  keep these, they prevent repeating mistakes).
- **область** — `модели` (model architectures), `память` (memory/learning), `железо`
  (hardware), `алгоритмы` (training/inference algorithms), `общее` (cross-cutting).
- **вес** — importance 1–10, set by the assistant (no user review): start at 5, raise when the
  result proves important, lower when it turns out marginal.
- **статус** — `проверяется` → `сработало` / `провал`. A `тупик` note is recorded with
  `статус: провал` directly.
- **направление** — wiki-link to the direction note this experiment serves. A wiki-link may
  point ONLY at a note that exists in the vault (same rule as diary-format.md section 5).
- **код** — repo-relative path to the experiment's folder in `Logos-Lab`.

## 5. Direction note (one note = one research direction)

File name: `<Имя-направления>.md` (Russian, hyphenated), e.g. `Троичные-сети.md`.

```markdown
---
дата: <YYYY-MM-DD последнего обновления>
статус: <изучается | активно | отложено | закрыто>
теги:
  - logos
  - исследования
---

# <Название направления>

[[Направления]]

## Что это
## Почему нам важно
## Ключевые работы
## Текущий вывод
```

A direction is a knowledge ACCUMULATOR: it is updated in place (refresh `дата` on every
substantial update), unlike experiment notes which are append-once-then-close. `статус`
moves: `изучается` (reading, collecting) → `активно` (experiments running against it) →
`отложено` (not now) / `закрыто` (conclusion drawn, work stopped).

## 6. Lab code repository rules

- **One root folder = one experiment**, named as the diary note slug. The folder's README
  points back at the diary note; the note's `код` field points at the folder.
- **An experiment without a diary note does not exist.** The hypothesis is recorded in the
  diary BEFORE the code is written.
- **Throwing code away is normal.** The production repo's discipline does NOT apply here: no
  product version, no phases, no mandatory full test suite. Code is still written so an agent
  can read and continue it (explicit names, explicit dependencies), but without production
  overhead — a 100-line script beats a 1000-line framework.
- **Shared utilities** go to `common/` only after TWO experiments need them, not before.
- **Never in git:** secrets (`.env`), datasets and model weights (`data/`, `models/` inside an
  experiment folder — gitignored; commit the download script, not the files).
- **Russian commit messages. Never force-push.** The lab repo is committed manually (the vault
  is NOT — obsidian-git auto-syncs it).

## 7. Writing rules

- **Russian content** everywhere in the vault; technical terms keep their form (TRM, BitNet,
  continual learning, …).
- **One experiment = one note; never overwrite a different note.** Re-recording the same
  experiment updates ITS file (status, result); a new experiment is a new file.
- **Failures are first-class.** A `провал` or `тупик` is recorded with the same care as a
  success — negative results are the accounting the diary exists for.
- **The index is automatic.** Never hand-edit the folder notes per entry — Dataview keeps them
  current as long as the frontmatter fields are set.
- **Matured conclusions leave the branch through the front door:** an insight ready for the
  production system goes into the main design via the decision journal (`logos-log`), never by
  silently editing `Архитектура.md` from here.
