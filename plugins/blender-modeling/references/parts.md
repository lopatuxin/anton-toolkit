# Parts: how one asset is split between agents

One context cannot hold a whole model through every phase: in the first test the session reached
886k tokens of a 1M context, 520k of them on the one model (a post windmill), and stopped at 85%
silhouette overlap. So the
director (the main session) owns what must be decided once for the whole asset — reference,
brief, calibration, blockout, the split, assembly, materials, export — and each part goes to
its own builder agent that takes it through forms, detail and finish while the rest of the asset
stands as blockout. Builders work in parallel, each in its own Blender without a window; the
owner's live Blender shows the assembly.

## Asset folder

```text
<asset>/
  brief.md               the brief (skill, Phase 0), with a PARTS section
  ref/<view>.png         orthographic reference views; masks are written next to them
  <asset>.py             the master script: setup, blockout, assembly, export (director)
  dims.py                SCENE, PARTS and every number more than one part uses (director)
  parts/<id>.py          one part (its builder only)
  work/calib.blend       the asset scene for the background runners (director re-saves it)
  work/r<N>/<id>/        a builder's renders and result.json for round N
  work/r<N>/joints/, work/r<N>/review/
  review/                the director's pictures and the owner's beauty renders
```

## dims.py

Plain Python, exec'd into the helpers' globals before any part script runs (`load_dims`), so
its names are visible in every part. Upper-case names and `M` only: a lower-case name (`box`,
`ring`, `clear`) would silently replace the helper of that name everywhere. The director writes
SCENE, the shared numbers and the PARTS ids before the blockout (the master script and the gates
read them) and adds the boxes and sizes once the blockout passes; a builder never edits it — a
wrong shared number is reported back, not patched locally.

```python
SCENE = "Mill_Post"                       # the asset's scene in Blender
SIZE = {"x": 10.1, "y": 9.6, "z": 12.7}   # overall extents, metres (optional)
CAMERA = {"elev": 55, "az": -35, "px_per_m": 6.75}   # the game camera (optional)
BUDGET_TRIS = 20000

# shared measurements: attachment points, pivots, axes, heights several parts meet at
FLOOR = 4.9
HUB = (0.0, -2.75, 7.13)

def M(role):
    """Material by role ("log", "board", "roof", "iron", ...). Parts ask for roles; the
    director's materials step decides what each role looks like."""
    return mat(f"{SCENE}_{role}", ROLE_COLOURS.get(role, "#808080"), 0.85)
ROLE_COLOURS = {"log": "#8f8474", "board": "#9a8f80", "roof": "#6f6b62", "iron": "#3a3a3a"}

PARTS = {
    "sails": {
        "what": "four sails: stock, whip, lattice both sides of the whip, hub",
        "region": {"front": (-6.6, 6.6, 0.6, 13.8)},   # boxes per view, see below
        "size": {"x": 13.1, "z": 13.1},                # the part's own extents, metres
        "touches": ["body"],                           # parts it is joined to
        "need": 0.90,                                  # part overlap gate (default 0.90)
    },
    ...
}
```

`region` boxes are `(right0, right1, up0, up1)` in metres along the view's image-right and
image-up axes — the axes `silhouette_iou` reports as `image_right` / `image_up` (front view: +X
and +Z; back view: -X, so a box written in world X comes out mirrored there). Draw a box where this part makes the outline. Where parts overlap in a view (sails in
front of the body), gate the part on the views or bands where it stands clear; a box full of a
neighbour measures the neighbour.

## parts/<id>.py

```python
# Sails of the post mill: stock, whip, lattice on both sides of the whip, hub. Built by
# blender-part-builder; numbers it shares with other parts come from dims.py.

def build(sc, col):
    bm = bmesh.new()
    ...
    obj_from_bm("MP_sails", bm, col, materials=[M("board"), M("iron")])
```

`build(sc, col)` fills `col` (the collection `<SCENE>_part_<id>`) and nothing else: it never
clears or edits another collection, the reference or the camera. Object names are file-global
and `obj_from_bm` takes over an existing object of the same name — across every asset in the
open Blender — so part objects start with the asset's prefix (`MP_sails`), are unique across
parts and never reuse a blockout name (blockout objects are `<prefix>_blk_...`, `MP_blk_sails`);
`build_part` raises on a part clash; blockout names are the director's to keep unique. Constants of the part live at the top of its
file. A builder writes this file before its first runner call: the runner needs it.

## calib.blend

The asset's scene as the director last assembled it: reference views with their masks, ruler,
game camera, and per part either its blockout (`<SCENE>_blk_<id>`, before the part's first round)
or its built collection. The director saves it from the live Blender with
`save_scene_copy(sc, ASSET + r"\work\calib.blend")` after the blockout and again after every
assembly, so the next round's builders see the current neighbours — never while a round runs: the
assembly rewrites the masks and calib.blend the agents are reading. The copy holds the other
sessions' scenes too; the runner takes the asset's scene by name. Everything that belongs to the
asset lives in the part and blockout collections: a base or plinth is a part, or no gate sees it.

## The runner

```text
"<blender.exe>" --background --factory-startup "<asset>\work\calib.blend"
    --python "<scripts>\run_parts.py" -- "<asset>" "<out_dir>" <parts> [check.py]
```

- `<parts>` = one id: builds it and runs `part_gates` — `part_iou` per view inside its box,
  size, mesh gates of the part, floating pieces over the whole model.
- `<parts>` = `a,b`: builds both, floating pieces over the whole model and coplanar faces
  among their objects (the joint check; coplanar candidates are read, they do not fail it).
- `all`: every part that has a file (the others stay as blockout); with `review_sheets.py`, the
  reviewer's compare sheets, diffs, clay and material views, joint close-ups and game view, plus
  `whole_gates`.
- `check.py`: any own check, exec'd after the build with `sc`, `PARTS`, `built`, `names` (the
  whole model now) and `OUT`; it assigns `result`.

The result is in `<out_dir>\result.json` and on the line starting `RESULT `; a traceback comes
back as `{"error": ...}` with exit code 1. The old result.json is deleted at the start, so a run
that died leaves no result to misread; pictures in the folder are from the last run that got
that far. Give every run its own out folder when two runs must not overwrite each other. A run
takes about 5 s; nothing is saved to calib.blend.
`blender.exe` on Windows: the newest `C:\Program Files\Blender Foundation\Blender *\blender.exe`,
or the path of the running Blender process. The MCP tool `execute_blender_code_for_cli` hangs on
this machine (times out on any code): call blender.exe directly.

## Master script

```python
# <asset>.py - run in the live Blender after loading the helpers (BM = <plugin>/scripts):
#     exec(open(r"<asset>\<asset>.py", encoding="utf-8").read()); result = build("parts")
ASSET = r"<absolute asset folder>"
load_dims(ASSET)

def setup():                      # Phase 1: scene, reference views, ruler, game camera
    sc = scene_for(SCENE)
    ...
    return sc

def blockout(sc):                 # Phase 2: primary masses, one collection per part
    for pid in PARTS:
        clear(blockout_coll(sc, pid))
    ...

def build(stage="parts"):
    sc = setup()
    blockout(sc)
    out = ASSET + r"\review"
    if stage == "blockout":
        for pid in PARTS:
            show_blockout(sc, pid)
        return whole_gates(sc, out, need=0.85)
    for pid in PARTS:
        if os.path.exists(os.path.join(ASSET, "parts", pid + ".py")):
            build_part(sc, ASSET, pid)
    save_scene_copy(sc, ASSET + r"\work\calib.blend")
    return whole_gates(sc, out, budget_tris=BUDGET_TRIS)
```

## Choosing the parts

3-8 parts, each a construction unit one agent can hold and one method builds: legs and post,
crib, body walls, roof, gallery, ladder, sails. Repeats are one part (four sails, six legs).
Cut where the joints are few and clear, and put the numbers both sides of a joint use in
dims.py. A part that needs another's finished shape to exist (a roof sitting on wall tops) still
builds against the shared numbers, not against the neighbour's file.
