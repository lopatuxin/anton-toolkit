---
name: game-level-design
description: Designs, improves, and builds playable game levels with AI-assisted exploration, spatial constraints, blockouts, visual hierarchy, and in-game evaluation. Use for a level, map, encounter space, route, or playable environment in any genre. Use for requests such as "сделай левел-дизайн" or "улучши карту". An isolated texture, model, animation, or game mechanic belongs to its own workflow.
---

<!-- Generated from plugins/anton-toolkit/skills/game-level-design/SKILL.md; edit that source, then run npm run build. -->

## Codex runtime

Read PLUGIN_ROOT/codex-runtime.md before using this procedure. Shared source lives in the anton-toolkit Git repository; installed packages are generated.

# Game Level Design

Make places that serve the player's actions and the game's intended experience. Work in the game's existing engine, editor, data formats, and art direction. Adapt the method to the genre, camera, mechanics, stage of production, and the user's requested scope.

## Scope and evidence

- For a request to research, critique, or propose options, inspect the current level when one exists and return findings and alternatives. Do not turn a discussion into a scene edit. For a build request, implement and evaluate the selected design against working game rules. If a required mechanic does not exist, establish its minimum contract and whether building it is in scope; otherwise deliver the level design and state the playtest gap. Do not call a render or placeholder playable.
- Read the project's relevant decisions, current scene and assets, then observe the level in the running game when possible. Record gaps between documentation and behavior. Preserve approved constraints and existing work unless a demonstrated problem calls for revisiting them.
- Identify the player loop, camera, controls, movement and combat scale, objectives, obstacles, enemy behavior, resources, and the level's place in progression. Distinguish working mechanics from planned ones.
- Study a small set of relevant games, studio breakdowns, or research before proposing a new direction. Extract the transferable mechanism and its cost; do not copy a map or visual composition. Verify changeable tool capabilities before recommending them.

## Design the experience

1. State the level's purpose in terms of what the player will do, notice, decide, and feel. Sketch the sequence of meaningful beats and a simple route graph before detailed art. Include alternative routes only when they create a real choice for this game.
2. Compare a few materially different layouts or revisions when the direction is open. Compare movement, encounter options, navigation, visual clarity, production cost, and fit with the game's rules. Recommend one. Ask the owner only for a consequential creative choice that the existing brief does not settle.
3. Build a playable blockout at actual player scale and camera using editable native objects. Place landmarks, routes, boundaries, obstacles, cover, objectives, spawns, and retreat paths according to the chosen beats. Iterate on the layout through play before detailed set dressing.
4. Establish a visual reading order suited to the genre and current action: player, threats, routes, and objectives get attention before atmosphere and surface detail. Concentrate contrast and fine detail around intentional focal points; give traversal and combat areas enough quiet space. Use props, material changes, light, sound, and traces of past events to make each place distinct and legible.
5. Populate with reusable assets or procedural rules only inside explicit zones. Exclude paths, sightlines, interaction areas, and spawn safety space as needed. Match every generated or placed asset to collision, scale, perspective, and the actual camera.

## Use AI where it adds control

- Use a language model for divergent layout ideas, beat maps, critique, and translation of a selected brief into structured placements and constraints. Keep goals, dimensions, forbidden regions, routes, and object roles explicit and editable.
- Prefer the sequence **intent → structured spatial constraints → editable scene → automated checks → playtest** for AI-assisted construction. A convincing image alone does not establish reachability, combat flow, or playability.
- Use image generation for concepts, surface art, and individual assets after the spatial intent is clear. Supply the approved camera, blockout, style reference, and fixed geometry. Inspect output at gameplay scale; repair mismatched art through the appropriate asset workflow rather than silently changing level geometry to fit an image.
- Use procedural placement for repetitive dressing and local variation. Rules should preserve the authored layout and allow selective manual changes. Do not use uniform scatter where it erases focal areas or makes the ground visually noisy.
- Use AI to suggest risks from screenshots, play traces, or logs, and to explore counterexamples. Geometry, collision, and reachability need checks against the game's real rules. Human play remains the test of interest, tension, and clarity.
- Keep accepted human edits persistent between iterations. Offer variation within the remaining design space instead of regenerating the whole level after each correction.

## Evaluate in the game

Check the level from its ordinary gameplay camera and through the actions it is built for. Test reachability, scale, navigation, collision, sightlines, enemy routes, cover, objective visibility, pacing, and readable threats where those mechanics exist. Inspect actions, not only a still overview. For puzzles and gated objectives, check solvability through actual state transitions, deadlocks, unintended bypasses, and whether an introductory level teaches its intended action. Use automated probes for measurable constraints and live play for experience; describe what each actually established. Revise the level or art when evidence contradicts the intended experience.

When reporting, give the resulting level or proposals, the reason for the chosen layout, the relevant test observations, and the remaining decisions or untested mechanics. Do not claim that an automated solver or a good-looking render proves the level is fun.

## Research behind this workflow

- [Epic Games: level blockout](https://dev.epicgames.com/documentation/en-us/unreal-engine/designer-01-project-setup-and-level-blockout-in-unreal-engine) ties space to player actions, scale, sightlines, and iterative playtesting before art.
- [Blizzard: Diablo IV environment art](https://news.blizzard.com/en-us/article/23788294/diablo-iv-quarterly-updatemarch-2022) describes adding or removing detail for the fixed game camera, navigation, combat, and narrative intent.
- [Valve: illustrative rendering in Team Fortress 2](https://cdn.steamstatic.com/apps/valve/2007/NPAR07_IllustrativeRenderingInTeamFortress2.pdf) explains why restrained high-frequency texture and geometry help visual composition and gameplay reading.
- [Valve: Left 4 Dead AI systems](https://steamcdn-a.akamaihd.net/apps/valve/2009/GDC2009_ReplayableCooperativeGameDesign_Left4Dead.pdf) shows deliberate peaks and rests in threat pacing and structured variation.
- [Xu and Verbrugge, FDG 2025](https://pcgworkshop.com/archive/xu2025constraint.pdf) demonstrates language-to-constraints-to-optimization-to-simulation for 3D layouts; its automated validity result is not a substitute for human playtesting.
- [Microsoft Research and Ninja Theory, 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC11839478/) identifies diversity, consistency, and persistence of user edits as important to AI-supported game ideation.
