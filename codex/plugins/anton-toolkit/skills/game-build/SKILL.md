---
name: game-build
description: Takes a new game from the first idea to playable builds, or resumes an existing game from its latest build. Use for whole-game production ("хочу сделать игру", "продолжим игру"). Keeps decisions and player feedback in one conversation and assigns design, levels, art and implementation to focused agents. Use game-design for a design-only discussion and game-level-design for a standalone level design.
---

<!-- Generated from plugins/anton-toolkit/skills/game-build/SKILL.md; edit that source, then run npm run build. -->

## Codex runtime

Read PLUGIN_ROOT/codex-runtime.md before using this procedure. Shared source lives in the anton-toolkit Git repository; installed packages are generated.

# Game Build

Keep the owner's dialogue, approvals, and playtest feedback in this conversation. Assign each
production stage to an agent with a focused brief. Apply the owner's rules for discussion-only
requests before searching, delegating, or writing. Speak to the owner in plain Russian.

## Find the current build

- Locate the named game, repository, and designated design notes using the project instructions.
  For a new game, use the idea the owner gave. Confirm the game's home before creating files
  when its location is open.
- Resume from the latest accepted decisions, pending approval, and next playable goal. Read
  the active plan and the relevant project files. Start at the first missing result.
- Keep one short working plan in the game's approved design notes. Reuse an existing active
  plan where one exists. Record approved decisions, links to current briefs and outputs, the
  latest verified build and what the owner said after playing, and the next goal or decision.
  Update those entries after each material change. Keep project cards and journals under
  close-session's ownership. Hand the next turn the plan link if context is compacted.

## Assign work

Read `SKILL_DIR/references/tools-and-handoffs.md` for the roles needed for the current build.
Resolve the actual skill paths and available tools. Follow the host runtime's launch rules.
Name delegated preparation in the brief when assigning a game-design or level-design stage.
Use a fresh agent context for each independent work item. In Codex use `fork_turns="none"`
and keep the configured models for existing roles. On other hosts use the native agent tool
and its own runtime's role names. Start the fully specified, independent jobs in parallel
within the host's limits. Sequence jobs that share files, a live editor, or unfinished inputs.
A specialist may keep ownership of its work during a focused correction.

Each agent prompt gives its next result, approved decisions, absolute project and skill paths,
the files it needs or may edit, the tool or project entry point, and how its output will be
checked. Ask for a short result with output paths, checks performed, and any remaining blocker
or decision. Keep long work in the project's files. If an agent needs an owner decision, bring
the concrete choice to this conversation. If a required tool or delegation capability is
unavailable, report which work is blocked and continue independent work within scope.

## Build one playable result at a time

1. **Concept.** Assign preparation to a game-design agent. Use its proposal to run the
   `PLUGIN_ROOT/skills/game-design/SKILL.md` dialogue here. Record the approved concept and
   agree on the player action or decision a first build should test. Apply the owner's
   approval and scope before starting implementation.
2. **Prototype.** Give the implementation agent the approved behavior and one observable
   player-facing check. Use the engine's existing scene and build tools. Use basic assets and
   a simple playable space unless a visual detail itself is under test. Assign any necessary
   level decisions to a level-design agent and handle approvals here. Deliver the verified
   build and tell the owner what to try.
3. **Finished playable fragment.** Use the owner's feedback to revise the prototype or approve
   a short fragment that demonstrates the game's target quality. Assign the needed map,
   visuals, interface, models, and animation through the specialist procedures. Delegate
   final scene assembly and make one implementation agent responsible for integrating the
   parts and checking the running build. The fragment establishes a practical method for
   making more of the game.
4. **Production and final build.** Repeat the cycle for the next playable goal, using the
   accepted fragment and the project plan as inputs. At the end, assign a candidate build
   using the project's normal packaging and launch targets. Show the working version and
   the checks still due. The owner approves the game and explicitly authorizes any publication.

The build report gives the owner the launch link or command, what to try, and the relevant
checks or gaps. The owner performs the playtest. For gameplay feedback, assign the next design
proposal through game-design's delegated mode. Turn the feedback into one specific change or
decision. Keep still-valid approvals and ask the owner to approve a change outside the current
brief. Send the agreed change to the responsible stage and resume from the latest working plan.
