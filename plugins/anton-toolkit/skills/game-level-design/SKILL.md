---
name: game-level-design
description: >
  Designs or revises game levels through an approved text placement proposal,
  visual reference, spatial scheme, and detailed implementation brief. Use for
  a level, map, encounter space, route, or playable environment in any genre,
  including requests such as "сделай левел-дизайн" or "улучши карту".
  This skill designs and hands off; scene construction belongs to a separate workflow.
when_to_use: >
  "сделай левел-дизайн", "спроектируй уровень", "переделай карту", "улучши локацию"
---

# Game Level Design

Design a playable place for the game's actual camera, rules, and player actions. Keep the dialog in the main conversation. This skill finishes with an agreed design, not a built scene. If the user asks only for research or critique, answer at that scope.

## Ground the proposal

- Read the relevant project decisions, current scene and assets; observe the running game when one exists. Distinguish approved choices from temporary work and working mechanics from planned ones. Preserve the owner's accepted changes.
- Identify the player loop, scale, camera, controls, objectives, routes, obstacles, enemy behavior, and level's place in progression. Research a few relevant games or studio breakdowns when a new direction needs comparison; extract useful principles rather than copying their maps.
- Begin at the first stage that lacks approval. Reuse an already approved text brief, reference, or scheme instead of repeating it.

## Approval order

1. **Text placement first.** Describe in plain Russian where the player starts; where the routes, landmarks, objectives, threats, cover, interactable objects, and quiet areas are; what the player does in each area; and why the arrangement supports the intended experience. Show a few meaningful alternatives when direction is open, recommend one, and wait for the owner's corrections or approval. Do not make a visual reference or spatial scheme yet.
2. **Visual reference second.** From the approved text and existing approved style cues, create or select one target frame at the game's camera and player scale. It shows the intended visual hierarchy and atmosphere; it is not a placement diagram or final ground asset. Inspect it against the text before showing it. Wait for the owner to approve this specific reference. If rejected, revise that reference before proceeding; generate images one at a time.
3. **Spatial scheme third.** After reference approval, draw an editable, legible plan with positions, dimensions, routes, boundaries, interaction zones, obstacles, sightlines, spawns, and relevant height differences. Reconcile it with both the approved text and visual reference. Show it to the owner and revise until approved.
4. **Agree on implementation details.** Resolve only the details needed to build this level: object roles and sizes, collision and navigation, encounters and timing, materials and asset needs, camera and lighting, and acceptance checks. Where mechanics do not exist yet, mark the design hypotheses that cannot be tested. Save the agreed brief in the project's designated plan location when the project calls for one. Get approval of the complete design before handing it to construction.

For example, on a camp redesign first describe where the tower, gate, and routes go; generating a map image or editing scene files before that text is approved skips the first decision gate.

Do not edit game scene files, make final game assets, assemble a blockout in the engine, or start a build while using this skill. After the complete design is approved, hand it to the appropriate implementation workflow. If the user's current request already authorizes construction, continue there after approval; otherwise stop with the approved brief.

## Use AI with control

- Use a language model for placement alternatives, player-beat analysis, critique, and conversion of approved choices into explicit spatial constraints. Keep all accepted decisions persistent across iterations.
- Use image generation for the visual reference with the approved text, camera, scale, and style as controls. A beautiful image does not establish collision, reachability, or encounter flow; the later scheme must make those relationships explicit.
- Use read-only calculations or simulations to challenge a proposed scheme where possible. For puzzles and gated objectives, reason through full state transitions, deadlocks, unintended bypasses, and the introductory learning step. Record what remains unverified until the level is built and played.
- Plan visual reading order for the genre and current action: player, threats, routes, and objectives should remain clear against the atmosphere. Reserve fine detail and contrast for chosen focal areas rather than scattering them uniformly.

## Handoff

Deliver the approved text, visual reference, spatial scheme, and build brief together. State which gameplay assumptions remain untested and which checks the implementation workflow must perform in the running game. Do not call the design playable merely because its plan is reachable or its reference looks convincing.

## Research behind this workflow

- [Epic Games: level blockout](https://dev.epicgames.com/documentation/en-us/unreal-engine/designer-01-project-setup-and-level-blockout-in-unreal-engine) ties space to player actions, scale, sightlines, and iterative playtesting before art.
- [Blizzard: Diablo IV environment art](https://news.blizzard.com/en-us/article/23788294/diablo-iv-quarterly-updatemarch-2022) describes adding or removing detail for the fixed game camera, navigation, combat, and narrative intent.
- [Valve: illustrative rendering in Team Fortress 2](https://cdn.steamstatic.com/apps/valve/2007/NPAR07_IllustrativeRenderingInTeamFortress2.pdf) explains why restrained high-frequency texture and geometry help visual composition and gameplay reading.
- [Valve: Left 4 Dead AI systems](https://steamcdn-a.akamaihd.net/apps/valve/2009/GDC2009_ReplayableCooperativeGameDesign_Left4Dead.pdf) shows deliberate peaks and rests in threat pacing and structured variation.
- [Xu and Verbrugge, FDG 2025](https://pcgworkshop.com/archive/xu2025constraint.pdf) demonstrates language-to-constraints-to-optimization-to-simulation for 3D layouts; automated validity does not replace human playtesting.
- [Microsoft Research and Ninja Theory, 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC11839478/) identifies diversity, consistency, and persistence of user edits as important to AI-supported game ideation.
