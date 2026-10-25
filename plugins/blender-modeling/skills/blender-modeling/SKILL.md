---
name: blender-modeling
description: >
  Builds and corrects 3D models in Blender — buildings, vehicles, props, furniture, machines,
  plants, game assets — from reference images: the main session sets the reference, brief and
  blockout in the live Blender, then splits the model into parts that builder agents work out in
  parallel to measured gates (real size, silhouette overlap, mesh checks, joints), with a
  fresh-eyes reviewer against the reference before the owner sees it. Use for any request to
  model, rebuild or fix something in Blender. Not for FreeCAD parts (freecad-design) or for
  rigging and animation only. Runs in the main conversation.
when_to_use: >
  "сделай модель", "смоделируй в блендере", "собери в blender", "поправь модель", "/blender-modeling"
---

# Blender modeling — the director

A model built by code fails in known ways: a stack of boxes that only reads from one angle, a
straight prism where the real thing tapers, parts floating off each other, faces fighting in one
plane, toy bevels, a silhouette drifted from the reference. The builder does not see these on a
full-frame render and is biased toward calling the work done. So every phase ends on numbers and
close-ups, a picture only locates the next fix, and a reviewer with fresh eyes looks before the
owner does.

One context cannot carry a whole model: the first test (a post windmill) filled 886k of a 1M
context and stopped at 85% overlap. You are the director. You keep what must be decided once —
reference, brief, calibration, blockout, the split into parts, assembly, materials, export — and
each part goes to its own builder agent through the parts workflow. Keep your own context for
numbers and decisions: read the agents' results and look at the few pictures you need, not at
every render they made.

The helpers live in `${CLAUDE_PLUGIN_ROOT}/scripts/` and run inside Blender (numpy is bundled;
there is no system Python). Every `execute_blender_code` call is a fresh exec, so a call that
needs them starts with

```python
BM = r"${CLAUDE_PLUGIN_ROOT}/scripts"
exec(open(BM + "/bm.py", encoding="utf-8").read())
```

and returns data by assigning a dict to `result`. Read before the first call:
`${CLAUDE_PLUGIN_ROOT}/references/parts.md` (asset folder, dims.py, part files, the background
runner), `${CLAUDE_PLUGIN_ROOT}/references/live-blender.md` (live-Blender traps);
`${CLAUDE_PLUGIN_ROOT}/references/techniques.md` has the construction recipes.

## Where things live

- **The model is scripts in the project**, never hand edits in the scene: the master script
  `<asset>.py` (setup, blockout, assembly, export), `dims.py` (shared numbers and the parts) and
  one `parts/<id>.py` per part. Layout and contracts are in parts.md. Asset scripts never name the
  plugin folder: the caller loads the helpers first.
- **The project's rules come first.** Before the first model in a project, read its model
  conventions: the README or helper module next to its existing model scripts, its CLAUDE.md and
  rules, its memory notes about models. Axes, origin, units, export format and exporter,
  vertex-colour or baked shading, material libraries, the game camera and on-screen scale — the
  project decides all of these. Use its own exporter and helpers where they exist.
- **The live Blender is where the owner looks**: setup, blockout and every assembly run there
  through MCP, in the asset's own scene. Builder agents never touch it — they work in Blender
  without a window on `work/calib.blend`. On this machine the owner asked (2026-10-22) for model
  work through the MCP, not background Blender; the agents' background runs are the exception he
  approved on 2026-10-24 for parallel parts.

## Phase 0 — reference and brief

No reference, no model. Use what the owner gave; otherwise draw one through the image route in
the global instructions (Codex): an orthographic model sheet — front, side and back of the same
object at one scale on a plain light background, no labels or shadows on the ground, the camera
level with the object's middle so no top surface shows (say so in the prompt) — plus one
3/4 concept in the target style. One picture per request; look at it before using it. A generated
sheet goes to the owner before modelling: an approved picture is the spec. Crop each orthographic
view into its own file (`ref/front.png`, `ref/right.png`, ...), sharing one ground line. Views are
named like Blender's numpad views, by where the viewer stands: `right` is seen from +X with the
asset's front (-Y) at the image's left — for an asset facing -Y that is its own left side. Check
on each drawing which end is the front before naming the file; a mirrored side view builds a
mirrored model.

A real or historical thing (a village windmill of the 1930s, a GAZ-AA, a merchant's house) is drawn
from photographs of the real thing, never from a text description alone: a sheet invented from
words comes out as a generic object of the wrong type, and the owner rejects it. Find photos of
surviving examples of the right region and period (open-air museums, Wikimedia Commons,
public-domain archives such as Prokudin-Gorsky), name each file with its source, licence and size
and download only with the owner's yes, then give them to Codex as the references to copy the
construction from, with the project's concept art only for style.

Codex writes only inside its working directory and its task runner wants a git repository there:
run it with `--cwd` set to the asset's folder (`git init` it once). Otherwise it saves into the
session's folder — inside a vault, Obsidian then creates notes for the new folder and the vault's
auto-commit picks the picture up.

Write `<asset>/brief.md`:

```text
ASSET       name, category, what it is in the game
VIEWS       per image: which view, orthographic or perspective; perspective is for detail only
SIZE        real size per axis with the evidence (door 2 m, storey 3 m, wheel, human 1.75 m)
PROPORTIONS 6-12 ratios read off the orthographic views that the blockout must hit
PARTS       every part in build order: method (see techniques), attaches to, moves about
SILHOUETTE  the 3-5 features that make it read from the game camera
MATERIALS   per part: role (weathered boards, tarred roof, iron straps), library or colour
TARGET      engine and format, game camera angle and pixels per metre, triangle budget
INFERRED    everything the references do not show, and what was assumed
```

Ask the owner only what the pictures and the project cannot answer. Choose the construction
method per part from the references (`techniques.md`, "Choosing the method"): revolve, mirror,
array, loft through sections, profile extrusion, boards — not boxes by default.

## Phase 1 — calibration

In the asset's scene: `add_ref_view` for every orthographic view at the real size from the brief
(it also writes the view's silhouette mask), `add_ruler`, and the project's game camera. When the
silhouette includes parts of unknown size (sails, poles, a ladder to the ground), scale by a
feature of known size instead — `ppm` from a door, a log, a wheel measured in pixels — and anchor
on the footprint (`anchor="base"`). Check that the views agree: the same landmark (eaves, ridge,
axle, door top) at the same world height in every view.

Sheets drawn by a model rarely agree exactly: one view a few percent larger, a "side" view that
is really a 3/4, details mirrored or at other angles. Pick the most informative orthographic view
as primary, scale the others to it on a landmark, and demote a view that is not orthographic to
detail-only. Where the sheet contradicts how the real thing is built (lattices mirrored left and
right, a part with nothing holding it), build it the real way and record the deviation in the
brief; the gate is then read on the bands that matter, not on the contradicting part. Measure
real proportions on the clearest view: a wrong wall height read off a view cluttered by sails
cost a whole rebuild in the first test.

Before measuring any height, check that each view is seen level, not from slightly above — an
image model draws "orthographic" sheets as renders from a few degrees up. The signs: a lighter
band above the front face of every horizontal surface (seat, roof, table top), with cracks or
grain running along it; far legs or feet ending higher than the near ones; far parts shifted
inward. That band is the top face, not thickness: measure heights at the near top edge, take the
thickness from the band below it, record the view angle in the brief, and draw the parts'
`region` boxes below the band. The whole-view overlap then stays under 0.90 by the band's area —
report that number, do not chase it. On the first bench the seat's top-face band was read as a
9 cm plank instead of 5 cm, and a builder carved "wear" into it: one wasted round.

## Phase 2 — the split and the blockout

Decide the parts first (parts.md, "Choosing the parts") and write `dims.py`: SCENE, SIZE, CAMERA,
BUDGET_TRIS, every number more than one part uses (attachment heights, pivots, axes), `M(role)`
with placeholder colours, and `PARTS` with each part's description and `touches`. The master
script and the gates read it, so it exists before the first blockout run.

Blockout: primary masses only, each part's masses in its own `blockout_coll(sc, id)`, named
`<asset prefix>_blk_...` (object names are shared by every asset in the open Blender), at the
measured positions, pivots where parts turn. Gate: the overall size
within 5%, `whole_gates(sc, out, need=0.85)` on every view (its default, 0.90, is the gate of the
finished parts). Read `compare` (reference | clay | overlay) for each view. No detail before this
passes — detail on wrong proportions is the most expensive mistake in the whole pipeline.

Then finish PARTS: each part's `region` boxes per view, measured on the reference where the part
makes the outline, its `size` and gate. Then `save_scene_copy(sc, ASSET + r"\work\calib.blend")`.

## Phase 3 — parts, in rounds

Run the workflow, one builder per part, all at once:

```text
Workflow({scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/blender-parts.js", args: {
  asset, blender, scripts: "${CLAUDE_PLUGIN_ROOT}/scripts", round: 1,
  parts: [{id, notes}], joints: [{a, b}], review: false }})
```

`blender` is the newest `C:\Program Files\Blender Foundation\Blender *\blender.exe` (or the
running Blender's path); `joints` are the touching pairs from PARTS. Tell the owner in one line
that the parts are being built and how many agents work. The run is backgrounded: wait for its
notification.

After each round — never while one runs: assembly rewrites the masks and calib.blend that the
running agents read:

1. Assemble in the live Blender: `build("parts")` of the master script builds every part file,
   re-saves calib.blend and returns `whole_gates` — overlap per view with the mismatch split by
   part, size, mesh gates over the whole.
2. Read the builders' results and the joints. Answer the builders' questions (a shared number
   in dims.py that is wrong is yours to fix, then every part that uses it is rebuilt).
3. The next round goes only to the parts with a failed gate or an open joint, with those notes
   as measurements. Stop after the round in which every part passes and every joint holds, or
   after three rounds. The reviewer is not part of these rounds: it looks once, at the finished
   model (below).

Before explaining why a gate misses, measure it: `silhouette_iou(..., regions={...})` splits the
missing overlap by part. In the first test the explanation came first — "the sheet mirrors the
sails" — and was wrong: the sails had been measured by their tip corners instead of their axis
(49° instead of 43°) with the lattice on one side instead of centred. The breakdown found it, and
the front match went from 67% to 85%. An owner's decision that departs from the sheet (four legs
where six are drawn) has a measured cost: report it as a number. No verdict words ("looks good",
"close", "matches") in your own critique: they are how a slab gets shipped.

## Phase 4 — finish and materials

Geometry finish (bevels, shading) is the builders'. First the mesh gate on the whole:
`whole_gates` with the budget — fail on floating pieces, anything below the ground, edges shared
by three faces, flipped faces, over budget; read every warning.

Materials are made for the whole asset at once, so the parts share one palette, by the
`blender-materials` skill: layered role materials from library photo textures, a tone per piece,
measured against the reference and baked into the texture set the game reads. The parts' `M(role)`
names are its roles. A uniform tint of one texture over every part is the known failure — the
owner rejected it on the mill.

## Phase 5 — export and what shipped

Export the baked copy through the project's exporter (or `export_glb` with `vertex_color="NONE"`),
then `glb_report` on the file: size matches the brief, the lowest point is on the ground,
triangles within budget, one baked material and vertex attributes as the project expects. A
number that differs from the master is an export bug, not a rounding issue.

## Reviewer on the finished model

The reviewer runs once, when the model is ready — parts through their gates, materials baked —
and before the owner sees it: Agent tool, `subagent_type: "blender-modeling:blender-reviewer"`,
with the asset folder, blender.exe, the scripts folder, the materials pass folder and an output
folder `work\final\review`. Not after every round of parts or materials: on the bench test a
review per round took 37% of all tokens and about 50 of 90 minutes, re-checking parts that had
not changed.

Its high and medium findings are the work queue of one fix round. Check each claim against the
numbers, then send the geometry findings as notes to the parts workflow for the parts they name
(`review: false`) and the material findings as notes to one more materials round (the
blender-materials skill says how); assemble, re-bake and re-export. Low findings are not sent to
any agent: they go to the owner as a list with their numbers, beside what is left after the fix
round. On the second bench three low notes in the materials fix round (a dark line on one leg
seen only in a close-up, a variation ratio) took about half of its 28 minutes.

## Showing the owner

He judges by eye. Show `beauty` renders (EEVEE, sun and sky, light settings for a small GPU) from
the front 3/4 and the back 3/4 and one from the game camera's angle, the `compare` sheet of the
main view, with the remaining measured deviations and everything inferred, in plain Russian.
Workbench pictures are for checks, not for him. Switch the window to the asset's scene
(`show(scene)`) only for that, and only when no other session is working in Blender; then set the
viewport to the textured view he looks at (live-blender.md, "The owner's view of a finished
model") — left in Solid shading the model shows grey. Do not
describe the model as matching the reference where a number says otherwise.

## Gotchas

- Build each asset in its own scene and clear only its own collections: other sessions use the same
  Blender, and their scene is not yours to reset.
- `bpy.context` belongs to the window's scene; the helpers evaluate the scene that holds the objects.
  In your own code use `depsgraph_of(objs)`, never `bpy.context.evaluated_depsgraph_get()`.
- `bpy.data.libraries.write` of a scene crashes Blender 5.2 outright — in the live Blender that
  takes the owner's window and every session's work with it. `save_scene_copy` saves a copy of
  the whole file instead.
- The MCP tool `execute_blender_code_for_cli` hangs on this machine (times out on any code); the
  agents call blender.exe directly through `run_parts.py`.
- A reference drawn by a model is not orthographic by accident: views often disagree in proportions.
  Calibrate each view on its own and note the disagreement in the brief.
- `fill_holes` makes both silhouettes outer outlines: see-through lattices and windows are checked
  by close-ups and by `views`, not by IoU.
- Workbench renders are for form. Material looks are checked with `beauty` and in the project's
  engine — transparency, glossy highlights and sky colour read differently there.
- Materials must survive the export: any node chain the exporter cannot read is silently
  dropped and the game gets another colour, so materials are baked (blender-materials) and read
  in `glb_report` after every export.
- The mesh gates find what eyes miss, and every finding in the first test was real: boards with
  gaps need studs behind them, each course of a stacked frame must overlap the course below, a
  shaft must lie on a bearing, log ends of neighbouring courses in one plane flicker. Fix the
  model, not the threshold.
