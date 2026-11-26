# Checks — is it a game, and does it hold together

Run them yourself on the running game, its data and its design notes. Report each item as
passed, minimal, or missing, with the evidence (a frame, a number, a file). Skipping an item is
the owner's decision ("без сюжета" for an arcade game).

## Game, not a tech demo — 12 items

For the first playable piece and again before release. An honest minimal version is enough for
the first piece.

1. **Title screen and menu** in the game's style, not the engine's default.
2. **HUD** shows only what the player decides on right now; for each element you can say "по нему
   игрок решает X"; the screen centre is free.
3. **A clear goal at any moment**: from three random frames it is clear what to do next.
4. **Visible progression**: after a run the player has something new that changes the next run,
   not just a number.
5. **Story delivery**, if the game has a story: intro, first goal, a beat at the end; scenes can
   be skipped and input works after them.
6. **Sound on everything**, UI included: no silent player action in a minute of play.
7. **Win, loss, restart**: both outcomes are reachable, each has its own screen, a new attempt
   comes at the genre's rhythm.
8. **Pause and settings** at any moment; pause freezes the world; settings survive a restart.
9. **Save and continue**: play, kill the process, launch — "Продолжить" returns to the same place.
10. **Teaching through play**: levels introduce mechanics one at a time, no walls of text.
11. **An end**: the piece ends with a screen or a "продолжение следует", the game has credits.
12. **Response**: the main action answers with motion, flash or particles, and sound within the
    same 2–3 frames.

Result in one line: how many of 12, which are minimal.

## Response checklist — the main action first

Hit-stop of 2–6 frames on a significant hit · screen shake scaled to the event, never constant ·
the target flashes on hit · particles on hit, movement, destruction, pickup · squash and stretch
or a scale punch on the acting object · easing on everything that moves in UI and camera ·
sound in the same 2–3 frames · recoil or vibration at the input · slow motion or zoom at a
climax, rarely · idle motion, nothing on screen stands dead. And restraint: everything present,
all of it quieter than you would expect; shake and flashes get a setting.

## The first 60 seconds

The maker finds everything clear, so use a capture, not an opinion: clear the save and settings,
launch with one command, take a frame every 2 s for the first 60–90 s, and read them as a
stranger — how many presses to gameplay, when the first meaningful action happens, where it is
unclear where to look. Then ask the owner to have someone who has never seen the game play it
silently: "о чём игра?", "что значит выиграть прямо сейчас?", "за чем бы вернулся?".

## Systems hold together — 8 items

After the core mechanics are accepted and on any big design change (a new system, a changed
pillar, 3+ mechanics added or cut, a rebuilt economy). These problems live between systems and
show on no screenshot. Findings are holes to list, not blockers.

a. **Competing loops.** One progression loop leads, the others feed it. Three systems each
   calling itself the main one and paying the same currency is a game about nothing.
b. **Attention budget.** More than 3–4 active systems at once in the core loop overloads.
c. **Dominant strategy.** High reward at low risk, an obviously right choice. Ranged combat with
   80% of melee damage and no risk kills melee until melee gets something ranged lacks.
d. **Sources and sinks.** For every resource: where it comes from and where it goes, both ways.
   The usual failure is "приход сильно больше расхода к третьему дню".
e. **Mismatched curves.** Everything that grows with progression grows compatibly. Enemy health
   ×2 per zone against player damage +10% per level: by zone 5 that is 32× against 1.5×.
f. **Pillar drift.** A mechanic without a pillar is reworked, cut, or a pillar is added.
   Breaking an anti-pillar is a bug, not a compromise.
g. **One fantasy.** All systems speak about the same role; the story does not argue with the
   mechanics. "Безжалостный воин" in combat and "добрый фермер" in the meta are two games.
h. **Learning budget.** Before the first meaningful success, no more than ~3 new concepts; a new
   system only after the previous one has been used.

Then walk 2–3 scenarios where systems fire at once (a boss with empty potions, an upgrade in the
middle of a chase): what fires first, what the player sees, whether anything is credited twice
or loops forever.
