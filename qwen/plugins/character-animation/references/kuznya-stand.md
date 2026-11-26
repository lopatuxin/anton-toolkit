# Kuznya Mirov animation stand

This is a source map and verified contract from 2026-11-05, not a replacement for the current
checkout. Re-read the relevant owning functions before editing motion data; another session
may have changed them. Work in the existing checkout and preserve its uncommitted changes.

## Where the behavior lives

- `game.json` -> `files.models` declares target models; `files.motions` points to the game's motion file.
- `games/<game>/motions.json` stores named motions. The Horde hero currently uses this file.
- `engine/src/data/load/motions.rs` parses, binds and validates these definitions; inspect
  `parse_decl`, `base_clip`, `retouch_of` and `rebuild_skeleton`.
- `engine/src/core/skeleton.rs` evaluates glTF tracks and corrections; inspect `Turns::at`,
  `apply_retouched`, `PoseScratch::globals` and the public pose-evaluation methods.
- `engine/src/data/stand.rs` builds the stand, its projections, foot-slip analysis and loop-gap analysis.
- `engine/src/wasm/stand.rs` exposes the stand's actual browser API.
- `web/src/editor/motionsFile.ts`, `useAnimationStand.ts`, `StandSidePanel.tsx` and
  `StandTimeline.tsx` govern motion editing, settings and playback.
- `engine/tests/phase55_motions.rs`, `editor_skeleton.rs` and `motion_support/` show existing
  data/stand probes. Reuse their loading and posing pattern when a numerical probe is needed.

The standard local address is `http://127.0.0.1:8090`; check the project's actual running address.
`/health` establishes service availability, not that this rig and motion were loaded successfully.
Open the game's editor and its full-screen **Анимация** screen. Do not treat the game canvas,
a still render or a Blender preview as a verified animation on this stand.

## Motion representation

At this snapshot, every motion requires an existing playable glTF animation clip in the target
model. `clip` refers to that model-file clip, not another motion from `motions.json` and not a
video. There is no independent duration, arbitrary translation track or new raw capture track
in this JSON format. A model with a rig but no playable clips cannot get a new motion from this
file alone.

Supported fields are `model`, `clip`, `speed`, `loop`, `upper`, `bounce`, `lean`, `arms_out`,
`bones` and `reference`. Recheck the parser for changes. `speed` is positive and the resulting
duration is `base_clip.length / speed`. `upper` selects the supported upper-body motion layer.
`bounce` scales the base clip's pelvis rise; it is not a user-specified root trajectory.
`lean` and `arms_out` are global anatomical modifiers, not replacements for per-frame joint data.

`bones` maps exact node names to constant corrections `[x, y, z]` in degrees or an increasing
list of `{ "at": phase, "turn": [x, y, z] }`. Phase lies in `[0, 1]`. The engine right-multiplies
the base local rotation by the correction quaternion; it does not replace the base pose.
`Turns::at` uses Catmull-Rom interpolation for keyed corrections, with cyclic sampling for loops
and held endpoints for nonloops. Inspect its in-between motion as well as the keys.

Example of the supported shape, using names that must exist on the actual model:

```json
{
  "zombie_limp": {
    "model": "zombie",
    "clip": "Walk",
    "speed": 0.8,
    "loop": true,
    "bones": {
      "LeftUpLeg": [
        { "at": 0, "turn": [0, 0, 8] },
        { "at": 0.5, "turn": [0, 0, -8] }
      ]
    }
  }
}
```

This example is syntax, not a measured limping animation or a universal axis recommendation.
Calculate every rig's axes from its transforms. In particular, the Horde Mixamo hero's local
leg Z axis drives sagittal bending; treating X as the forward/backward axis spreads its legs.
Reconfirm from the current model rather than extending this fact to every Mixamo rig.

The parser accepts `reference`, and the editor preserves it, but the inspected stand does not
provide video synchronization or motion extraction from that field. Keep the reference record
and measurements as task assets; do not invent a built-in video importer or comparison panel.

Choose a base clip only if its available pelvis/root motion and timing can support the requested
action after corrections. If the approved performance needs translations or a new track the
format cannot express, report the exact missing capability and the supported result. Do not
silently approximate an unrelated stock clip and call it a full transfer, or switch to Blender
to bypass the owner's stand. Adding/exporting a new animation track or extending the engine
requires its own agreed implementation scope.

## Inspect and save

Use the stand UI or available native browser tools. The methods below are methods on the loaded
WASM engine, not guaranteed window globals, CLI commands or MCP tools:

- `show_motion(motions_json, name, view)` validates and builds the preview. It returns `ok`,
  `bones`, `length` and `frames`, or an error. A rejected edit leaves the previous valid preview
  visible; a visible character alone does not prove the new motion was accepted.
- `motion_pose(phase)` returns projected joints and analysis, including slip intervals and
  endpoint gap. Inspect the current return shape before consuming it.
- views are `side`, `front` and `game`. Reference-matched comparison may need a more closely
  aligned camera; these three names do not guarantee a match to a film camera.

When browser methods are not directly reachable, use supported UI controls or a small temporary
native engine probe following the existing stand tests. Measure from the same skeleton/pose path
that the renderer uses. Report what ran; remove task-only probes after retaining their needed
measurement output. Do not create an engine API merely to avoid reading the existing one.

Read the latest motion file immediately before changing it. Merge only the requested named
motion and preserve other entries and unknown metadata. If this is the game's first motion,
follow the editor's motion-creation behavior, including `files.motions` registration.
Reload the saved files and select the saved motion again to check persistence and validation.
Motion-data edits are served from the mounted `games/` directory and do not inherently require
a full Docker rebuild. A changed editor/engine build does require the project's normal rebuild.

Leave the motion on the stand for the owner. Bind it to the intended game only when requested;
the Horde hero's work belongs in Horde, not in an unrelated demonstration game.
