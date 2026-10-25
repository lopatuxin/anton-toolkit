---
name: blender-materials
description: >
  Makes or fixes the materials of a Blender model for a game: layered materials from library
  photo textures with a tone per piece, dirt, shade under overhangs and occlusion, measured
  against the reference image and baked into one texture set the game can read, by the
  material-artist agent in a Blender without a window; the owner sees the baked result in the
  live Blender. Use when a model's form is done and its materials are to be made, or when the
  owner finds the materials poor. Not for modelling (blender-modeling) or texturing for a
  renderer other than the game. Runs in the main conversation.
when_to_use: >
  "сделай материалы", "материалы ужасные", "поправь материалы", "текстуры для модели", "/blender-materials"
---

# Blender materials

Blender's node materials are what makes realistic surfaces, and the game cannot read them: glTF
carries one image per map, so whatever the nodes make is baked. And the game camera sees each
part's colour and the tone of neighbouring pieces long before grain and cracks. The method and
its reasons are in `${CLAUDE_PLUGIN_ROOT}/references/materials.md`; read it, and
`${CLAUDE_PLUGIN_ROOT}/references/parts.md` for the asset folder and the runner.

## Before the agent

- **The asset folder** has `dims.py` with SCENE, CAMERA (the game camera) and LIGHT (the game's
  own light, read off the project's engine: parts.md has the Transport company values) and an
  up-to-date `work/calib.blend` with the assembled model and the reference views; a view that is
  not truly orthographic is added with `detail_only=True`, so the checks skip it. An asset built
  by blender-modeling has both after its last assembly. An older asset built by one script into
  `<SCENE>_MODEL`: write a dims.py with SCENE, `PARTS = {}` and CAMERA, build the model with its
  script in the live Blender (or in a Blender without a window) and `save_scene_copy` it; the
  materials pass takes the `<SCENE>_MODEL` objects when there are no parts.
- **The library**: the project's texture folder (the brief's MATERIALS, the project's model
  README). A texture it lacks is downloaded only with the owner's yes — name, source, licence
  and size first.
- **The brief's MATERIALS** line names each role's look; where it does not, the reference decides.

## The agent

Dispatch it (Agent tool, `subagent_type: "blender-modeling:blender-material-artist"`) with the
asset folder, blender.exe (the newest `C:\Program Files\Blender Foundation\Blender *\blender.exe`),
the scripts folder `${CLAUDE_PLUGIN_ROOT}/scripts`, the library folder, an output folder
`<asset>\work\mat\r<N>` and, from round 2, the notes to apply. Tell the owner in one line that the
materials are being made. Read its report; check the numbers it quotes in the result.json of its
folder.

A further round goes only to roles that fail their gates, with those numbers as notes; stop when
the gates pass, or after three rounds. The reviewer (`subagent_type:
"blender-modeling:blender-reviewer"`) looks once, at the finished asset, told to judge the
materials from the material pass's pictures in that output folder (`beauty_*`, `matcompare_*`,
`game_enlarged`) against the reference; its high and medium material findings are the notes of
one fix round. Inside blender-modeling that single look is its review of the finished model,
not an extra one.

## Showing the owner

In the live Blender: `show_baked(sc, r"<out>\<SCENE>_baked.blend", "<SCENE>_baked")` puts the
baked copy into the asset's scene and hides the parts; `show_parts(sc)` brings them back — call
it before any `save_scene_copy`, or calib.blend keeps the parts hidden and the runners see an
empty model. Switch
the window to the asset's scene only when no other session is working in Blender. Send him
`beauty_3q.png`, `beauty_back.png`, `beauty_game.png`, `game_enlarged.png` and the main view's
`matcompare`, with the remaining deviations as numbers in plain Russian, and how much video memory
the texture takes in the game. When an earlier version exists, show before and after side by side.

## Export

The project's exporter, or `export_glb(obj, path, scene, vertex_color="NONE")`, on the baked copy;
then `glb_report`: one material with baseColorTexture and metallicRoughnessTexture, TEXCOORD_0, no
COLOR_0 or COLOR_1. The exporter's default vertex-colour setting writes a white COLOR_0 and hides
the real colours in COLOR_1 — never export with it.
