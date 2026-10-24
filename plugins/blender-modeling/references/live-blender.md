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
