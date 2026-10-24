# check.py for run_parts.py: the materials pass of the whole asset.
#
#   blender --background --factory-startup <calib.blend> --python run_parts.py
#           -- <asset_dir> <out_dir> all <scripts>/materials_pass.py
#
# Execs <asset>/materials.py, which defines apply(sc, names) (piece_uv, piece_tone, then
# role_material per role) and may set BAKE = {"size": 1024, "samples": 16, "metal": None}. Then
# bakes the asset (bake_asset), checks the baked colours against the reference per role
# (material_gates), renders the beauty views and the game view of the baked copy and exports a
# test GLB with glb_report. An asset not split into parts uses the objects of <SCENE>_MODEL.

_mat_path = os.path.join(ASSET, "materials.py")
exec(compile(open(_mat_path, encoding="utf-8").read(), _mat_path, "exec"), globals())
_names = names  # model_names: the parts, or <SCENE>_MODEL for an asset built by one script
if not _names:
    raise ValueError(f"scene {SCENE} has no model objects (part_/blk_ collections or {SCENE}_MODEL)")
MODEL_NAMES = _names  # role_material checks "tone" and "grain" on these meshes only
result = {"tone": apply(sc, _names)}
_used = {m for o in objs_of(_names) for m in o.data.materials if m is not None}
result["warn"] = ([f"{m.name}: {m['bm_warn']}" for m in _used if "bm_warn" in m] +
                  [f"{m.name}: not rebuilt by a role_material call, bakes as it was" for m in _used if "bm_role" not in m])
_bake = dict(globals().get("BAKE", {}))
_baked = bake_asset(sc, _names, OUT, SCENE, size=_bake.get("size", 1024), samples=_bake.get("samples", 16),
                    metal=_bake.get("metal"))
result["bake"] = _baked
_cam = globals().get("CAMERA", {})
_light = globals().get("LIGHT")  # the game's own light: the pictures show what the engine shows
_az, _el, _ppm = _cam.get("az", -35), _cam.get("elev", 55), _cam.get("px_per_m", 6.75)
_b = [_baked["object"]]
result["gates"] = material_gates(sc, _names, _baked["object"], OUT, game_px_per_m=_ppm, game_elev=_el)
result["beauty"] = [beauty(sc, _b, os.path.join(OUT, "beauty_3q.png"), light=_light),
                    beauty(sc, _b, os.path.join(OUT, "beauty_back.png"), az=145, light=_light),
                    beauty(sc, _b, os.path.join(OUT, "beauty_game.png"), az=_az, el=_el, light=_light)]
if _light:
    _small = load_rgba(beauty(sc, _b, os.path.join(OUT, "game_actual.png"), az=_az, el=_el, light=_light, px_per_m=_ppm))
    _big = np.repeat(np.repeat(_small, 4, 0), 4, 1)
    _big[..., 3] = 1
    result["game"] = save_rgba(_big, os.path.join(OUT, "game_enlarged.png"))
else:
    result["game"] = game_view(sc, _b, OUT, elev=_el, az=_az, px_per_m=_ppm)["enlarged"]
_glb = os.path.join(OUT, f"{SCENE}.glb")
export_glb(bpy.data.objects[_baked["object"]], _glb, sc, vertex_color="NONE")
result["glb"] = glb_report(_glb)
