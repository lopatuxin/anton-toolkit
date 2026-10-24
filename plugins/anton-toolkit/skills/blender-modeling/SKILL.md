---
name: blender-modeling
description: >
  Builds and corrects 3D models in Blender through the blender MCP server — buildings, vehicles,
  props, furniture, machines, plants, game assets — from a reference image, in phases that pass
  on measured gates (real dimensions, silhouette overlap with the reference, mesh checks,
  floating parts) instead of on a glance at a render. The model is a re-runnable script in the
  project; the live Blender is where it is run and inspected. Use for any request to model,
  rebuild or fix something in Blender. Not for FreeCAD parts (freecad-design) or for rigging
  and animation only. Runs in the main conversation.
when_to_use: >
  "сделай модель", "смоделируй в блендере", "собери в blender", "поправь модель", "/blender-modeling"
---

# Blender modeling — reference, phases, measured gates

A model built by code fails in known ways: a stack of boxes that only reads as the object from
one angle, a straight prism where the real thing tapers, parts floating a few centimetres off
each other, faces fighting in one plane, toy-sized bevels, a silhouette that drifted from the
reference. The builder does not see these on a full-frame render and is biased toward calling
the work done. So every phase ends on numbers and close-ups, the screenshot only locates the
next fix, and a fresh critic reviews before the owner does.

The helpers live in `${CLAUDE_SKILL_DIR}/scripts/` and run inside Blender (numpy is bundled;
there is no system Python). Every `execute_blender_code` call is a fresh exec, so a call that
needs them starts with

```python
BM = r"${CLAUDE_SKILL_DIR}/scripts"
exec(open(BM + "/bm.py", encoding="utf-8").read())
```

and returns data by assigning a dict to `result`. What each helper does is in its docstring;
the construction recipes are in `${CLAUDE_SKILL_DIR}/references/techniques.md`, the live-Blender
traps in `${CLAUDE_SKILL_DIR}/references/live-blender.md` — read that one before the first call.

## Where things live

- **The model is a script in the project** (`<asset>.py`), never hand edits in the scene. It builds
  into the asset's own scene (`scene_for("<Asset>")`), clears only its own collections and is safe
  to rerun. Phase work goes into that script; a correction is a change to a constant in it.
- **The project's rules come first.** Before the first model in a project, read its model
  conventions: the README or helper module next to its existing model scripts, its CLAUDE.md and
  rules, its memory notes about models. Axes, origin, units, export format and exporter,
  vertex-colour or baked shading, material libraries, the game camera and on-screen scale — the
  project decides all of these. Use its own exporter and helpers where they exist; the ones here
  fill the gaps.
- **Working files** (references, masks, review renders, the brief) go in an `<asset>/` folder next to
  the script, or the project's art folder for it. Review renders are for you and the critic; the
  owner gets the few pictures named in "Showing the owner".

## Phase 0 — reference and brief

No reference, no model. Use what the owner gave; otherwise draw one through the image route in
the global instructions (Codex): an orthographic model sheet — front, side and back of the same
object at one scale on a plain light background, no labels or shadows on the ground — plus one
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
brief; the silhouette gate is then read on the bands that matter, not on the contradicting part.
Measure real proportions on the clearest view: a wrong wall height read off a view cluttered by
sails cost a whole rebuild in the first test.

## Phase 2 — blockout

Primary masses only, each a separate object at the measured position, pivots where parts turn.
Gate: `dim_gate` within 5% on every mass, `silhouette_iou(..., need=0.85)` on every view with a
mask (its default, 0.90, is the Phase 3 gate).
Read `compare` (reference | clay | overlay) for each view. No detail before this passes — detail on
wrong proportions is the most expensive mistake in the whole pipeline.

## Phase 3 — forms

No new primitives for the main forms from here: the blockout becomes the real construction —
loft between measured sections, revolve the profile, extrude the traced outline, boards over the
frame. Envelope first (the second view), then the cross-section (the end view). Gate:
`silhouette_iou` ≥ 0.90 on every masked view, proportions within 2-3%, `extent_profile` shows the
taper the reference has, and the primary view's IoU did not drop.

## Phase 4 — detail

Openings cut whole with booleans and cleaned (limited dissolve), inner elements as their own
objects; real thickness on every plate and board; gaps where real things have gaps. Only detail
that survives the game camera: check `game_view` — what is a smear of three pixels there is
texture work, not geometry.

## Phase 5 — finish

`add_bevel` (small, 2-3 segments, angle-limited) then `finish_shading` on hard parts; materials
by role in real size (`uv_box` + the project's library materials, or `library_material`); then the
mesh gate: `check_all` with the budget — fail on floating pieces, anything below the ground,
edges shared by three faces, flipped faces, over budget; read every warning. Then `closeups` of
every joint and every place one part meets another: hinge, axle, where a beam sits on a post,
where the roof meets the wall.

## Phase 6 — export and what shipped

Export through the project's exporter, then `glb_report` on the file: size matches the brief, the
lowest point is on the ground, triangles within budget, materials and vertex attributes as the
project expects. A number that differs from the master is an export bug, not a rounding issue.

## The critique loop (inside every phase)

1. One focused change to the script; rerun it.
2. Run the phase's gates; keep the raw numbers.
3. Look at `compare` / `views` to locate where the outline leaves the reference — never to declare
   it acceptable.
4. Write the deviations as measurements, not adjectives: "tower 0.4 m too narrow at 6 m",
   "left sail tip 0.3 m too low", "roof overhang missing on the right view".
5. Fix the single largest deviation. Repeat until the gate passes.

No verdict words ("looks good", "close", "matches") in your own critique: they are how a slab
gets shipped. A gate that cannot pass because the views contradict each other is recorded as a
deviation with the reason, not chased forever.

Before explaining why a gate misses, measure it: `silhouette_iou(..., regions={...})` splits the
missing overlap by part (legs, base, body, roof, sails). In the first test the explanation came
first — "the sheet mirrors the sails" — and was wrong: the sails had been measured by their tip
corners instead of their axis (49° instead of 43°) with the lattice on one side instead of
centred. The breakdown found it, and the front match went from 67% to 85%. Measure the direction
of long parts (sails, arms, beams, legs) by the principal axis of their pixels, and look at
which side of the axis the detail lies, before building. An owner's decision that departs from
the sheet (four legs where six are drawn) has a measured cost: report it as a number.

## Fresh-eyes critic

Before showing the owner, dispatch a separate critic (Agent tool, general-purpose,
`model: "opus"` — judging form and look is Opus work) with no stake in calling it done. Give it
the reference images, the `compare` sheets, the `views` sheet, the `closeups` sheet, the
`game_view` picture and the gate numbers, and ask for every fault it can find with a location and
size (missing parts, wrong proportions, floating or intersecting parts, toy bevels, flat
uniform surfaces, unreadable silhouette at game size). Treat its list as the next work queue;
check each claim against the numbers before acting.

## Showing the owner

He judges by eye. Show `beauty` renders (EEVEE, sun and sky, light settings for a small GPU) from
the front 3/4 and the back 3/4 and one from the game camera's angle, the `compare` sheet of the
main view, with the remaining measured deviations and everything inferred, in plain Russian.
Workbench pictures are for your own checks, not for him. Switch the window to the asset's scene (`show(scene)`) only for that, and only when no
other session is working in Blender. Do not describe the model as matching the reference where a
number says otherwise.

## Gotchas

- Build each asset in its own scene and clear only its own collections: other sessions use the same
  Blender, and their scene is not yours to reset.
- `bpy.context` belongs to the window's scene; the helpers evaluate the scene that holds the objects.
  In your own code use `depsgraph_of(objs)`, never `bpy.context.evaluated_depsgraph_get()`.
- A reference drawn by a model is not orthographic by accident: views often disagree in proportions.
  Calibrate each view on its own and note the disagreement in the brief.
- `fill_holes` makes both silhouettes outer outlines: see-through lattices and windows are checked
  by close-ups and by `views`, not by IoU.
- Workbench renders are for form. Material looks are checked with `beauty` and in the project's
  engine — transparency, glossy highlights and sky colour read differently there.
- Materials must survive the export: `library_material` ships the tint as the glTF base colour
  factor and the occlusion map in the glTF occlusion slot. Occlusion multiplied into the colour,
  or any node chain the exporter cannot read, is silently dropped and the game gets another
  colour — read the materials in `glb_report` after every export.
- The mesh gates find what eyes miss, and every finding in the first test was real: boards with
  gaps need studs behind them, each course of a stacked frame must overlap the course below, a
  shaft must lie on a bearing, log ends of neighbouring courses in one plane flicker. Fix the
  model, not the threshold.
