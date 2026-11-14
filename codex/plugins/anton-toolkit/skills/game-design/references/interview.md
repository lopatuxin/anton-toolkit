# Concept interview

How a phrase ("хочу деревню, где жители живут своей жизнью") becomes an approved concept in
two short rounds. Questions are plain Russian chat text.

## 1. Slots

Pitch (one sentence: who the player is, what they do, why it is cool) · genre and subgenre ·
reference games and what is taken from each · player fantasy (who the player feels like) ·
30-second loop · 5–15-minute loop · session loop · camera · controls · modes (solo, co-op,
versus) · story (logline or "no story") · setting and tone · progression · failure · session
length · scale · platform.

Mark each slot as `said` (in the owner's words), `follows` (from the genre or the named
reference), `owner` (answered), or `decided` (you closed it). Only `decided` slots go to the
«Решил сам» line.

## 2. Rounds

Only independent questions share a round: the camera cannot be asked before the reference
game, because each reference has a different right answer.

| round | topics | when |
|---|---|---|
| 1 | reference game (subgenre) · scale · platform and session length | always, skipping what is said or follows |
| 2 | fantasy · twist (the game's own spin on the reference loop) · camera · story and tone | open slots only |
| card | the pitch card | always |

Scale options are concrete: "маленькая игра: одна карта, 6–8 заданий, час-два" vs "демо на
10 минут" vs "большая игра на месяцы". Never ask in this interview about visual style, the
engine, implementation, or monetization.

**Vague wish.** Instead of round 1, three pitches of five lines each — «Ты:», «30 секунд:»,
«Уровень/день:», «Камера и образец:», «Чем особенная:» — as different from each other as
possible. Recommend one.

**"Like X, but…".** Almost everything follows from X. Round 1 asks only what should differ
from X (setting and hero, story, core mechanic, progression — the owner names any) plus scale.
Round 2 asks only about what was named.

**Answers.** An answer is a decision — no "точно?". Free text from the owner overrides your
options; if it changes a root slot (genre, reference), reset the slots that followed from it
and say so in one phrase in the next question.

## 3. Genre question banks

Recommendation first. Use only open slots; reword to the owner's phrase. A genre not listed —
take the closest one.

- **Action / RPG.** Reference: fast isometric like Hades · heavy soulslike · adventure like
  Zelda (puzzles + combat) · turn-based party. Hero: a set hero with a backstory · own
  character and classes · a party. Combat: fast dodges and combos · heavy parries and stamina ·
  tactical pause.
- **Platformer.** Reference: precise 2D like Celeste · metroidvania · runner. Main verb: dash ·
  grappling hook · gravity or world switch. Difficulty: hard but fair with frequent checkpoints ·
  gentle · easy path plus hard secrets.
- **Strategy / tower defense.** Reference: tower defense like Kingdom Rush · RTS-lite · turn-based
  tactics like Into the Breach · autobattler. Twist: a hero on the field · the player builds the
  maze · cards instead of a shop. Structure: campaign of maps · endless waves · roguelite run.
- **Survival / crafting.** Threat: environment and night · hordes · other survivors · a disaster
  on a timer. World: handcrafted zone · procedural · expeditions from a base. Death: lose the
  bag, the world stays · start over · respawn at the bed.
- **Simulation / management / village.** Reference: own business with characters (Stardew, a
  café) · city or colony with crises · logistics and production chains · idle. Rhythm: days with
  an end-of-day summary · real time with pause. Pressure: soft goals and orders · crises and
  events · sandbox. Progression: new zones and buildings · prestige · story chapters.
- **Transport / logistics.** Reference: route building like Mini Metro · company tycoon like
  Transport Tycoon · direct driving. Pressure: growing demand · deadlines · breakdowns and
  events.
- **Roguelike.** Reference: action like Hades · deckbuilder like Slay the Spire · auto-combat like
  Vampire Survivors. Run: 20–30 min · 5–10 min · an hour. Meta: unlocks change the next run ·
  knowledge only · stat upgrades.
- **Puzzle.** Reference: grid logic like Baba Is You · physics · merge. Mistakes: no failure,
  undo · stars for optimal solutions · move limit.
- **Racing.** Reference: arcade · kart with power-ups · derby · sim-cade. Twist: drift feeds
  nitro and money · a chase every race · destructible shortcuts.
- **Shooter.** Reference: fast FPS · tactical with cover · top-down twin-stick. Structure:
  campaign · arenas and waves · hub and missions.

## 4. Genre blueprints — defaults for slots you decide

Start from the blueprint; every deviation must serve a pillar.

- **Platformer.** 30 s: running and jumping cleanly linked · level with a secret · a world or an
  ability unlocked. Difficulty through levels, not stats; death costs little time.
- **Survival.** 30 s: gathering under threat · a day or a sortie · the base grows, a recipe or
  zone opens. The economy is the design: list sources and sinks first.
- **Roguelike.** 30 s: combat with dodge and aim decisions · a run where power accumulates ·
  a meta unlock that changes the next run's options. A run is never dead from the deal.
- **Tower defense.** 30 s: building before a wave · a map to victory · new towers and maps.
  Counters must be structural, or one tower dominates.
- **Management / idle.** 30 s: a purchase that visibly raises the rate · a decision (automate,
  reallocate) · a new order of magnitude. Plot cost against production before building.
- **Action / RPG.** 30 s: a weighty strike and a dodge against telegraphed enemies · clearing a
  location · a skill, gear or story quest. Danger: stat inflation without breakthroughs.
- **Puzzle.** 30 s: one action changes the board predictably · a level with one "aha" · a new rule
  every 3–6 levels. A level teaches one idea: introduce, develop, twist, combine.

## 5. The pitch card

About twelve lines in a code block, lines up to ~60 characters:

```
ДЕРЕВНЯ НА ПЕРЕПРАВЕ — управление деревней (рабочее имя)
Суть:        переправа кормит деревню; река решает, кто придёт
Ты:          староста, которого слушают, пока он прав
30 секунд:   назначить жителя → увидеть, как он идёт и делает
10 минут:    день: заказ с переправы → цепочка → награда
Сессия:      3–4 дня за вечер, новый дом или ремесло
Камера:      сверху под углом · мышь
Сюжет:       лёгкий: у каждого жителя своя просьба
Размер:      маленькая игра — одна карта, 8 ремёсел
Принципы:    жители живые · река — главный враг и друг · …
Не будет:    боёв, бесконечного строительства, гринда
Решил сам:   прогрессия, провал = убыток дня, 8 ремёсел
```

«Решил сам» is mandatory and lists every `decided` slot.

## 6. After approval — the concept note

One line per slot, with the source mark in parentheses: `- Камера: сверху под углом (хозяин)`.

1. **Pitch and slots.**
2. **Pillars**, 3–5, each falsifiable and constraining: a build can refute it and it forces
   turning down plausible ideas. "Весёлый бой" is not a pillar; "бой награждает терпение, а не
   натиск" is. Give each a decision test: "спорим X или Y — принцип выбирает __". Aim for at
   least one pillar about mastery, one about choice, one about self-expression.
3. **Anti-pillars**, 1–3: tempting things the game deliberately does not do ("нет гринда ради
   чисел"), derived from the answers, not asked separately.
4. **Loop check** — three questions; a "no" is a concept hole, not polish: does the player grow
   and see it was them, not the upgrades? does every cycle hold a real choice with
   consequences? is there something in the game that is theirs (a build, a base, a style)?
5. **Story skeleton** if there is a story: logline, the world in 1–2 lines, 2–4 characters,
   5–7 beats. Otherwise one line "Без сюжета: <почему>".
6. **Mechanics table**, 6–10 rows from the blueprint and the twist. The first is the 30-second
   mechanic, built and played first. Each row is tied to a pillar; a row without a pillar is cut
   or a pillar is added. Columns: id, mechanic, first version or later, pillar, status (идея,
   пробуется, принята, вырезана), note.
7. **Ideas table** (empty for now): every idea ever shown, with its status and, if rejected, the
   reason in one phrase — so a rejected idea is never proposed again.
8. **«Решил сам»** — the same list as on the card.

## 7. Anti-patterns

- Round after round with no visible end — keep the budget, number the questions.
- A question about a fact — look it up.
- Re-asking what was said or answered.
- Confirming without the card — the owner then reconstructs the concept from memory.
- Ten attribute questions about a vague wish — give three ready games.
- A multi-page concept — one line per slot.
