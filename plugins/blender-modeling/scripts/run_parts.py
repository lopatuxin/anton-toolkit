# Background runner: builds parts of an asset into its calibrated scene and checks them, in a
# Blender without a window, so several agents can work at once without touching the live one.
#
#   blender --background --factory-startup <asset>/work/calib.blend
#           --python <scripts>/run_parts.py -- <asset_dir> <out_dir> <parts> [check.py]
#
# <parts>: comma-separated part ids, or "all". Each listed part replaces its blockout with what
# parts/<id>.py builds; the other parts stay as they are in calib.blend. "all" skips parts that
# have no file yet (they stay as blockout); a listed id without a file is an error. With one
# part and no check.py it runs part_gates; with several, floating pieces over the whole model
# and coplanar faces among their objects. check.py, when given, is exec'd with sc, PARTS,
# built, names (the whole model now) and OUT and assigns `result`.
# The result goes to <out_dir>/result.json and to stdout after "RESULT "; nothing is saved
# into the .blend. The previous result.json is deleted first, so a run that dies leaves none.
# Exit code 1 when anything raised (the traceback is in result).

import bpy, json, os, sys, traceback

result, _code, OUT = {}, 0, None
try:
    _args = sys.argv[sys.argv.index("--") + 1:]
    ASSET, OUT, _which = _args[0], _args[1], _args[2]
    _check = _args[3] if len(_args) > 3 else None
    os.makedirs(OUT, exist_ok=True)
    if os.path.exists(os.path.join(OUT, "result.json")):
        os.remove(os.path.join(OUT, "result.json"))
    BM = os.path.dirname(os.path.abspath(__file__))
    exec(open(os.path.join(BM, "bm.py"), encoding="utf-8").read())
    load_dims(ASSET)
    sc = bpy.data.scenes.get(SCENE)
    if sc is None:
        raise ValueError(f"calib.blend has no scene {SCENE!r}: save it with save_scene_copy after the blockout")
    if _which == "all":
        _ids = [p for p in PARTS if os.path.exists(part_file(ASSET, p))]
    else:
        _ids = [p for p in _which.split(",") if p]
    built = {pid: build_part(sc, ASSET, pid) for pid in _ids}
    names = model_names(sc)
    if _check:
        exec(compile(open(_check, encoding="utf-8").read(), _check, "exec"), globals())
    elif len(_ids) == 1:
        result = part_gates(sc, _ids[0], OUT)
    else:
        mine = [n for pid in _ids for n in part_names(sc, pid)]
        fp = floating_parts(names)
        result = {"parts": _ids, "floating": fp["floating"],
                  "coplanar": coplanar_overlaps(mine) if mine else {"candidates": [], "count": 0, "truncated": False},
                  "passed": fp["passed"]}
except Exception:
    result, _code = {"error": traceback.format_exc()}, 1

if OUT:
    with open(os.path.join(OUT, "result.json"), "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=1, default=str)
# ASCII on stdout: Blender's console on Windows writes a pipe in the locale code page
print("RESULT " + json.dumps(result, default=str))
sys.stdout.flush()
os._exit(_code)
