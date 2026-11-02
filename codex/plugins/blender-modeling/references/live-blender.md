# Working in the live Blender through MCP

- **Blender closed** (`Cannot connect to Blender at localhost:9876`): start it and wait until the
  port listens (Windows: `cmd //c start "" "<path>\blender.exe"`, then poll `netstat` for
  `:9876 ... LISTENING`). The MCP add-on starts its server on launch only if its autostart and
  Blender's Online Access are on; if the port never opens, tell the owner which of the two to turn on.
- **Return values**: assign a JSON-serialisable dict to `result`; printed text comes back as
  `stdout`. Globals do not survive between calls: reload the helpers in every call.
- **Timeouts**: a call is cut at about five minutes while Blender keeps running the code. After a
  timeout do not run it again; on the next call check the scene and the output files' times. Keep
  calls short: build in steps, render small, long Cycles renders in a background Blender instead.
- **Shared Blender**: other sessions may be connected to the same Blender. Work in the asset's own
  scene, never reset the file or clear another scene, and leave the window on the scene it showed
  (`bpy.context.window.scene`) unless you are showing the owner your model.
- **Never** `bpy.ops.wm.read_factory_settings` or `read_homefile`: it unloads the MCP add-on and
  wipes everyone's work. Clear your own collections with `clear()`.
- **Translated interface**: node *names* are translated, so `nodes["Principled BSDF"]` fails; find
  nodes by `bl_idname` (`node_of`). Socket names (`inputs["Base Color"]`) work.
- **Context**: `bpy.context.scene` is the window's scene, not necessarily yours. Evaluate geometry
  with `depsgraph_of(objs)`; render a scene without switching to it with
  `bpy.ops.render.render(write_still=True, scene=scene.name)` (that is what `render_objs` does).
  The glTF exporter switches the window to another scene; `export_glb` puts it back, own operator
  calls should do the same.
- **Importers** can fail under a translated interface (glTF: `KeyError: 'Iridescence Factor'`).
  Check exports with `glb_report`, which reads the file itself.
- **Small GPU**: Workbench renders cost seconds. A heavy scene in Material Preview or EEVEE can hang
  the video driver and take Blender down; keep the viewport at `taa_samples` 8 and renders at
  `taa_render_samples` 16 (what `beauty` uses), no ray tracing, `shadow_resolution_scale` 0.5.
- **bmesh, not edit-mode operators**: `bpy.ops.mesh.*` need an edit-mode context that MCP calls do
  not have; build and edit through `bmesh` and write back with `obj_from_bm`.
- **Never `bpy.data.libraries.write` a scene**: in Blender 5.2 it crashes Blender
  (EXCEPTION_ACCESS_VIOLATION) — in the live one, with every session's work. `save_scene_copy`
  saves a copy of the whole file for the background runners.
- **Background runners beside the live Blender**: the part agents start `blender.exe --background
  --factory-startup` on `work/calib.blend` (about 5 s a run, Workbench only); several at once and
  the live window share the 4 GB GPU fine. The MCP tool `execute_blender_code_for_cli` hangs on
  this machine — call blender.exe directly.

## The owner's view of a finished model

Switching the window to the asset's scene (`show(sc)`) leaves the viewport in Solid shading: the
owner sees a grey model and the reference planes in front of it, and he has had to ask for the
textures twice. After `show_baked` and `show(sc)`, set the view he looks at — reference planes
and ruler hidden, nothing selected, Material Preview at 8 samples (safe on the 4 GB GPU for one
asset), a front 3/4 perspective on the model — and check it with a screenshot of the window. In
the same call as the helpers (`bounds`), with the window already on `sc`:

```python
import math
from mathutils import Euler, Vector

def find_lc(lc, name):
    if lc.name == name:
        return lc
    for c in lc.children:
        r = find_lc(c, name)
        if r:
            return r

vl = bpy.context.window.view_layer
find_lc(vl.layer_collection, f"{sc.name}_REF").hide_viewport = True
for o in sc.objects:
    o.select_set(False)
sc.eevee.taa_samples = 8
b = bounds([o.name for o in sc.objects if o.type == 'MESH' and o.visible_get()])
centre = Vector([(lo + hi) / 2 for lo, hi in zip(b["min"], b["max"])])
for area in bpy.context.window.screen.areas:
    if area.type == 'VIEW_3D':
        sp = area.spaces.active
        sp.shading.type = 'MATERIAL'
        r3 = sp.region_3d
        r3.view_perspective = 'PERSP'
        r3.view_rotation = Euler((math.radians(68), 0, math.radians(-35)), 'XYZ').to_quaternion()
        r3.view_location = centre
        r3.view_distance = 1.8 * max(b["size"])
```
