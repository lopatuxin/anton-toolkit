# Materials: layered role materials, baked for the game

Research of 2026-10-24 (vault note «Материалы в Blender силами Opus — 2026-10-24») and the post
mill it was measured on. Three facts decide the method:

- **The game cannot read Blender's node materials.** glTF carries one image per map (base colour,
  metallic-roughness, normal, occlusion) and a few factors; every noise, mask, colour ramp and
  occlusion node is dropped on export. So the material is built with Blender's full node power and
  then **baked** into one colour texture and one ORM texture on a UV map of its own.
- **The game camera sees structure, not detail.** At 6.75 px/m a 10 m building is ~70 px; one log
  is under a pixel. What reads is each part's own colour and lightness, the tone of neighbouring
  pieces, darker bottoms, shade under overhangs, dark log ends. Grain, cracks and nail heads turn
  into the mean colour. The mill looked like "first-graders made it" because every piece had the
  same tone: on the reference neighbouring log rows differ by 13-15 L*, on the model by 1, and a
  grey tint killed the warm wood (b* 1-4 against 8-10).
- **Opus writing shaders from scratch makes them too clean.** What works: photographed library
  textures as the base, proven layer recipes on top, numbers against the reference and a critic
  comparing pictures in pairs. Adapt a recipe; do not invent a node graph.

## Order

```text
piece_uv(names)                        UV map "grain": texture along each log and board
piece_tone(names, ...)                 colour attribute "tone": tone per piece, ground, overhang
role_material(name, colour, lib, ...)  per role, rebuilt in place (objects keep their slots)
bake_asset(...)                        the shipping copy: one mesh, UV "bake", colour + ORM
material_gates(...)                    per role and view, against the reference
beauty / game_view                     the pictures to judge by eye
```

`materials_pass.py` runs all of it from `<asset>/materials.py` (`apply(sc, names)` plus an
optional `BAKE = {"size", "samples", "metal"}`; metal is baked by itself when a role has a
Metallic above 0) in a Blender without a window; ~20 s for a small asset. The live Blender only shows the result (`show_baked`): the UV and bake operators need the
file's current scene and edit mode, which in the live Blender are the owner's window, and
`bake_asset` refuses to run there.

## materials.py

```python
# Materials of the post mill: role recipes (blender-material-artist). Colours measured on
# ref/post/back.png; roles are the material names the parts use.
LIB = r"C:\projects\kuznya-mirov\art\transport\textures"
BAKE = {"size": 2048, "samples": 16}

def apply(sc, names):
    piece_uv(names)
    tone = piece_tone(names, spread=5, seed=7, ground_dark=0.25, ground_h=1.4,
                      shade_from=["MP_roof"], shade_dark=0.18)
    role_material("mp_log", "#a8968a", lib=LIB + r"\Wood033", contrast=1.2,
                  dirt={"color": "#4a4234", "height": 1.0, "amount": 0.6})
    role_material("mp_end", "#7d6f62", lib=LIB + r"\Wood033", contrast=0.7)
    ...
    return tone
```

The roles are the material names the asset's objects use: `<SCENE>_<role>` from `M(role)` for an
asset built in parts, the script's own names (`mp_log`) for an older one. Every one of them must
be rebuilt by a role_material call, or it bakes as it was (the pass warns). `piece_uv` and
`piece_tone` before `role_material`: a Color Attribute node reads black on a mesh without the
layer, so role_material leaves the tone out (and warns) unless every mesh of the role among the
baked objects has it, and falls back to box projection without "grain".

## Colours from the reference

`material_gates` reports per role and view `ref_hex` (the reference's mean colour where that role
shows) and `model_hex` (the baked colour without light). The role colour is the colour without
light of the role's lightest piece: piece_tone only darkens, so the role's mean falls by about
1.73 x spread x (L*+16) / 71 below it — about 8.6 L* at spread 5, 17 at spread 11 — and the
occlusion and dirt layers take a little more. Set hue and saturation from `ref_ab`, lightness
from `rel_l`; the first run with a guess gives the numbers to correct.

Judge the pictures under the game's own light: with LIGHT in dims.py the beauty renders and the
game view use it. Without it, `beauty` uses a harsh studio sun and `game_view` Workbench studio
light, which turns an upward roof nearly black and makes pale wood look pink — not the game.

## Recipes

| Role | Library | colour | scale, contrast | rough | tone spread | layers |
|---|---|---|---|---|---|---|
| weathered log wall | bark-less log or plank wood (Wood033) | from the reference, warm grey-brown | 3 m, 2-4 (the mill: Wood033 at 3.2 m, 4.0 — at 1.6 m and 1.0 grain and cracks fall under one texel and logs bake smooth) | 0.80-0.95 | 6-11 L* (reference rows differ 13-15) | dirt 0.8-1.2 m, amount 0.5-0.7, #4a4234 |
| log end grain | same wood, or an end-grain texture | 15-30% darker than the log | 0.5-0.8 | 0.85-0.95 | same | — |
| boards, planks (тёс) | plank wood (Wood086) | lighter, drier than logs | 0.9-1.6 (Wood086 above 1.6 gets stone-like spots) | 0.80-0.92 | 3-7 L* | dirt where they reach the ground |
| roof boards | weathered plank wood | silver-grey, as the reference | 1.1-1.6 | 0.85-0.95 | 3-5 L* (11 striped the whole game view) | — |
| sails, lattices, thin poles | plank wood | close to the boards | 0.8-1.0 | 0.85 | 3-6 L* (12 made a white-speckled ladder) | — |
| wood under a body, sheltered | same as its role | browner, darker | as its role | as its role | as its role | a band full above, gone 1 m lower: `bands=[{"color": brown, "full": 3.0, "none": 2.0}]` |
| forged iron | none (noise) or Metal049A | #3a3632-#4a443d | 0.6 | 0.45-0.65, metal 0.7 | 0 | — |
| stone, plinth | bricks / rock | from the reference | 1.0 | 0.85-0.95 | 2-4 L* | dirt 0.4 m |

Several `piece_tone` calls on groups of objects give each group its own spread and its own
overhang (the body shades the crib and the underframe; the roof shades the walls); the tone
layer of a later call replaces an earlier one on the same object. Local occlusion (`ao`) adds
under 1 L* at 0.25 m on round logs and is invisible at game size: darkness that reads comes from
the tone, the ground and the overhang; keep `ao` for close-ups.

What reads at game size, from the research:
- tone between neighbouring pieces 3-6 L*;
- bottom 15-30% darker (ground_dark 0.15-0.3 over 1-1.5 m), under an overhang 10-20% darker;
- log ends 15-30% darker than the wall, never lighter (bright ends glow as white dots);
- neighbouring parts differ by at least 6 L* or 10° of hue after blurring, or they merge.

## Library textures

Choose by measurement and real size: roughness mean of at least 0.65 (grass and wood that
measure 0.25 shine like wet plastic), a light neutral base (the pattern is what is used, its own
hue is dropped). The bake has no normal pass, so a baked atlas loses the photographs' relief —
one more reason to prefer the project's tiled maps where it has them. A map that measures wrong is replaced, never
fixed by a program. A missing texture is downloaded only with the owner's yes: name, source,
licence and size first (Poly Haven and ambientCG are CC0). Textures generated by an image model
need the owner's decision: they come with a fine colour noise and painted light, and the owner's
rule forbids fixing neural pictures by program.

## The bake

- One copy of the whole asset, one material, colour texture + ORM (R 1, G roughness, B metal),
  UV map "bake" as the only UV map: the engine reads TEXCOORD_0 only and one material is one draw.
- Size by sharpness up close: at least about 500 texels per metre of surface, whatever the game
  camera's `px_per_m` is (a 1024 atlas is 5.6 MB of video memory with mipmaps, 2048 is 22 MB);
  report the memory it costs. Islands should fill at least 0.4 of the texture (`uv_fill`).
- Export with `export_glb(obj, path, scene, vertex_color="NONE")` or the project's exporter with
  the same settings; `glb_report` must show the baked material with baseColorTexture and
  metallicRoughnessTexture, TEXCOORD_0 and no COLOR_0/COLOR_1.

## Checks

`material_gates`, per role and reference view, on pixels where both show that role (role masks
come from one flat render with every material in its own colour, so occlusion matches):
- `d_ab` <= 6: hue and saturation of the colour without light against the reference;
- `rel_l` within ±8: role lightness relative to the whole asset (on a Workbench studio-lit
  render, not under LIGHT, against the drawing) compared with the same on the reference;
- `spread_ratio` 0.6-1.5, a warning rather than a gate: variation over blocks of one game
  pixel, model over reference (the mill went from 0.30 to 0.55-0.58 on the wall logs).

Views added with `detail_only` (a "side" drawn as a 3/4) are skipped: on the mill the 3/4
"right" view and the back view asked for log ends 16 L* apart. A game pixel is a block of
1/px_per_m across and 1/(px_per_m x cos(elev)) high, as the camera sees a wall. A drawing paints
light and dark on every piece, so `spread_ratio` of roles made of few large pieces (roof,
boards, sails) stays under 0.6 when they are right; raising it means speckle the game view
shows as stripes — read it on the wall logs. The thresholds are first guesses from one model:
read the numbers, and calibrate on models the owner accepted. The pictures decide what the numbers cannot: `matcompare_<view>` (reference |
lit | colour without light), `beauty_3q`, `beauty_back`, `beauty_game`, `game_enlarged`.

## Traps

- Workbench shows only the active image node of a material: node materials are judged in
  `beauty` (EEVEE), baked ones in `albedo` and `material` renders. Material renders use the
  Standard view transform; the default film look shifts every colour.
- A uniform tint multiplied over one texture on every part is the known failure; so is reading a
  colour off one bright pixel. Measure means over the role's pixels.
- The engine's light is soft (lit against shaded 1.8-2.5x): parts must differ in colour itself,
  not only in lighting. EEVEE draws highlights and sky differently from the engine; a material
  that matters is checked in the game too.
