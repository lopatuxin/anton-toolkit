# check.py for run_parts.py: the reviewer's pictures and numbers of the whole asset.
#
#   blender --background --factory-startup <calib.blend> --python run_parts.py
#           -- <asset_dir> <out_dir> all <scripts>/review_sheets.py
#
# Per reference view: the compare sheet (reference | clay | overlay) and the silhouette diff
# with the mismatch split by part; clay views from six sides; material views from both 3/4
# sides; two close-ups of every joint between touching parts; the game-camera view at real
# size (CAMERA in dims.py: {"elev", "az", "px_per_m"}, defaults 55, -35, 6.75).

result = {"gates": whole_gates(sc, OUT, budget_tris=globals().get("BUDGET_TRIS")), "compare": {}}
for e in [o for o in sc.objects if o.get("bm_view")]:
    result["compare"][e["bm_view"]] = compare(sc, names, e.name, OUT)
result["clay"] = views(sc, names, OUT, "clay")["sheet"]
result["material"] = views(sc, names, OUT, "material", which=("threequarter", "threequarter_back"))["sheet"]
joints = contact_points(sc)
result["joints"] = joints
if joints:
    span = max(bounds(names)["size"])
    result["closeups"] = closeups(sc, names, list(joints.values()), OUT, size=max(0.6, span * 0.12))["sheet"]
cam = globals().get("CAMERA", {})
result["game"] = game_view(sc, names, OUT, elev=cam.get("elev", 55), az=cam.get("az", -35),
                           px_per_m=cam.get("px_per_m", 6.75))["enlarged"]
