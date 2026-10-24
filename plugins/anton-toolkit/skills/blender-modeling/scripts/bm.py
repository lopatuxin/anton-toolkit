# Loader for the blender-modeling helpers. Every execute_blender_code call is a fresh exec,
# so each call that needs a helper starts with:
#
#     BM = r"<skill dir>/scripts"
#     exec(open(BM + "/bm.py", encoding="utf-8").read())
#
# and returns its data through the `result` dict.
#
# Parts of bm_gates.py, bm_build.py and bm_review.py are adapted from
# colinurbs/claude-modeling-skills and majidmanzarpour/blender-game-skills (both MIT);
# see LICENSES.md next to this file.

for _f in ("bm_build.py", "bm_ref.py", "bm_gates.py", "bm_review.py", "bm_glb.py"):
    exec(open(BM + "/" + _f, encoding="utf-8").read(), globals())
del _f
