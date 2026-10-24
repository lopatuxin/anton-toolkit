# Parts: one asset split into parts, each built by its own script and checked while the rest of
# the asset stands as blockout. The layout is in references/parts.md:
#
#   <asset>/dims.py            SCENE, PARTS and the shared measurements (owned by the director)
#   <asset>/parts/<id>.py      def build(sc, col): fills `col` (one owner per file)
#   <asset>/work/calib.blend   the asset's scene after the blockout: reference views and masks,
#                              ruler, game camera, one blockout collection per part
#
# The same functions build the asset in the live Blender (the master script) and in the
# background runner (run_parts.py), so what an agent measured is what the owner sees.

import bpy, os
import numpy as np
from mathutils import Vector


def load_dims(asset_dir):
    """Exec <asset>/dims.py into the helpers' globals: SCENE, PARTS and the shared constants
    become visible to every part script. dims.py holds upper-case names and M() only: a
    lower-case name there would silently replace a helper of the same name."""
    path = os.path.join(asset_dir, "dims.py")
    exec(compile(open(path, encoding="utf-8").read(), path, "exec"), globals())
    return PARTS


def part_coll(sc, pid):
    return coll(sc, f"part_{pid}")


def blockout_coll(sc, pid):
    """Where the blockout puts the masses of part `pid`."""
    return coll(sc, f"blk_{pid}")


def _existing(sc, tag):
    """Collection `<scene>_<tag>` if it exists - lookups must not add empty collections to the
    owner's file."""
    return bpy.data.collections.get(f"{sc.name}_{tag}")


def _hide(c, hidden):
    c.hide_render = c.hide_viewport = hidden


def part_file(asset_dir, pid):
    return os.path.join(asset_dir, "parts", f"{pid}.py")


def build_part(sc, asset_dir, pid):
    """Build parts/<pid>.py into its own collection and hide that part's blockout. The script
    runs in a copy of the helpers' globals, so the names it defines stay in that copy; shared
    mutable values from dims.py (PARTS, lists) are not copied and must not be changed.
    Object names are file-global and obj_from_bm takes over an existing object of the same
    name: a part object that is also in another collection (the blockout, another part) is a
    name clash and raises."""
    path = part_file(asset_dir, pid)
    col = part_coll(sc, pid)
    clear(col)
    g = dict(globals())
    g.pop("build", None)  # in the live Blender the master script's own build() is in globals
    g["__file__"] = path
    exec(compile(open(path, encoding="utf-8").read(), path, "exec"), g)
    if not callable(g.get("build")):
        raise ValueError(f"{path} defines no build(sc, col)")
    g["build"](sc, col)
    own = {col.name} | {c.name for c in col.children_recursive}
    clash = {o.name: [c.name for c in o.users_collection if c.name not in own] for o in col.all_objects}
    clash = {k: v for k, v in clash.items() if v}
    if clash:
        raise ValueError(f"part {pid}: object names already used elsewhere {clash} - give the part's objects their own names")
    _hide(col, False)
    _hide(blockout_coll(sc, pid), True)
    return [o.name for o in col.all_objects]


def show_blockout(sc, pid):
    """Put a part back to its blockout (the part's own collection is emptied)."""
    clear(part_coll(sc, pid))
    _hide(blockout_coll(sc, pid), False)


def model_names(sc):
    """Mesh objects that make up the asset now: every built part plus the blockout of the
    parts not built yet. Only the part_ and blk_ collections count: whatever belongs to the
    asset (a base, a plinth) is a part."""
    out = []
    for c in sc.collection.children:
        tag = c.name[len(sc.name) + 1:]
        if tag.startswith(("part_", "blk_")) and not c.hide_render:
            out += [o.name for o in c.all_objects if o.type == 'MESH']
    return out


def part_names(sc, pid):
    c = _existing(sc, f"part_{pid}")
    return [o.name for o in c.all_objects if o.type == 'MESH'] if c else []


def ref_empty(sc, view):
    """The reference empty of `view` in the asset's scene (add_ref_view tags it)."""
    e = next((o for o in sc.objects if o.get("bm_view") == view), None)
    if e is None:
        raise ValueError(f"scene {sc.name} has no reference view {view!r}")
    return e.name


def save_scene_copy(sc, path):
    """Save a copy of the open file to `path` for the background runners, which open it and
    take the asset's scene by name. The live file keeps its own path and state. A copy holds
    the other sessions' scenes too: `bpy.data.libraries.write` of one scene would be smaller,
    but in Blender 5.2 it crashes Blender (EXCEPTION_ACCESS_VIOLATION) - never use it."""
    if sc.name not in bpy.data.scenes:
        raise ValueError(f"no scene {sc.name!r} in the open file")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=path, copy=True, check_existing=False)
    return path


def _size_fail(size, targets, tol=0.05):
    """`size` (x, y, z) against {axis: metres}: one fail line per axis off by more than `tol`."""
    out = []
    for ax, target in targets.items():
        got = size["xyz".index(ax)]
        d = (got - target) / target
        if abs(d) > tol:
            out.append(f"size {ax}: {got:.3f} m against {target} m ({100 * d:+.1f}%)")
    return out


def whole_gates(sc, out_dir, need=0.90, budget_tris=None):
    """The whole asset as it stands now: silhouette overlap on every reference view with the
    mismatch split by part (the parts' boxes), the overall size against SIZE from dims.py
    ({axis: metres}, 5%, when given) and the mesh gates over every object. The per-part split
    says which part the next round goes to."""
    names = model_names(sc)
    out = {"views": {}, "fail": [], "size": bounds(names)["size"]}
    for e in [o for o in sc.objects if o.get("bm_view")]:
        view = e["bm_view"]
        boxes = {pid: s["region"][view] for pid, s in PARTS.items() if view in s.get("region", {})}
        r = silhouette_iou(sc, names, e.name, out_dir, need=need, regions=boxes or None)
        if "error" in r:
            out["fail"].append(f"{view}: {r['error']}")
            continue
        out["views"][view] = {k: r.get(k) for k in ("iou", "outside_m", "regions", "diff")}
        if r["iou"] < need:
            out["fail"].append(f"{view}: overlap {r['iou']:.3f} below {need}")
    out["fail"] += _size_fail(out["size"], globals().get("SIZE", {}))
    mesh = check_all(names, budget_tris=budget_tris)
    out["mesh"] = {k: mesh[k] for k in ("tris_total", "floating", "coplanar", "below")}
    out["fail"] += mesh["fail"]
    out["warn"] = mesh["warn"]
    out["passed"] = not out["fail"]
    return out


def _surface(sc, pid, sample=4000):
    """Sample vertices and one BVH of a part as it stands now (built part or blockout). Every
    object keeps at least 32 samples, so a small post foot beside a heavy body is not lost."""
    from mathutils.bvhtree import BVHTree
    c = _existing(sc, f"blk_{pid}")
    names = part_names(sc, pid) or ([o.name for o in c.all_objects if o.type == 'MESH'] if c else [])
    if not names:
        return None, None
    dg = depsgraph_of(objs_of(names))
    meshes = [m for m in (_world_mesh(o, dg)[:2] for o in objs_of(names)) if len(m[0]) and m[1]]
    if not meshes:
        return None, None
    total = sum(len(co) for co, _ in meshes)
    pts, verts, polys = [], [], []
    for co, ps in meshes:
        n = min(len(co), max(32, sample * len(co) // total))
        pts.append(co[np.linspace(0, len(co) - 1, n).astype(int)])
        base = len(verts)
        verts += [tuple(p) for p in co]
        polys += [tuple(base + i for i in p) for p in ps]
    return np.concatenate(pts), BVHTree.FromPolygons(verts, polys)


def contact_points(sc, pad=0.05, per_pair=4):
    """Where the parts named in PARTS[...]['touches'] meet, for closeups(): the vertices of
    either part within `pad` of the other's surface, grouped into up to `per_pair` spots (a
    post foot on a log, not the empty middle between two bounding boxes). A pair with no
    contact gets its nearest spot, marked "(open)"."""
    out, seen = {}, set()
    for a, spec in PARTS.items():
        for b in spec.get("touches", ()):
            key = tuple(sorted((a, b)))
            if key in seen or b not in PARTS:
                continue
            seen.add(key)
            (pa, ta), (pb, tb) = _surface(sc, key[0]), _surface(sc, key[1])
            if pa is None or pb is None:
                continue
            near, best = [], (None, 1e9)
            for P, tree in ((pa, tb), (pb, ta)):
                for p in P:
                    hit = tree.find_nearest(Vector(p))
                    if hit[0] is None:
                        continue
                    if hit[3] <= pad:
                        near.append(p)
                    elif hit[3] < best[1]:
                        best = ((p + np.array(hit[0])) / 2, hit[3])
            name = f"{key[0]}-{key[1]}"
            if not near:
                if best[0] is not None:
                    out[f"{name} (open)"] = [round(float(x), 3) for x in best[0]]
                continue
            near = np.array(near)
            cell = max(0.25, float((near.max(0) - near.min(0)).max()) / 6)
            groups = {}
            for p in near:
                groups.setdefault(tuple((p // cell).astype(int)), []).append(p)
            merged = []  # [centre, count]; a spot split by a cell boundary is one spot
            for g in sorted(groups.values(), key=len, reverse=True):
                c = np.mean(g, 0)
                m = next((s for s in merged if np.linalg.norm(s[0] - c) < cell), None)
                if m is None:
                    merged.append([c, len(g)])
                else:
                    m[0] = (m[0] * m[1] + c * len(g)) / (m[1] + len(g))
                    m[1] += len(g)
            for i, (c, _) in enumerate(merged[:per_pair]):
                out[f"{name} #{i + 1}"] = [round(float(x), 3) for x in c]
    return out


def part_gates(sc, pid, out_dir, budget_tris=None):
    """The standard check of one part, with the rest of the asset as built parts or blockout:
    - per view in PARTS[pid]['region']: the silhouette overlap inside the part's box
      (`part_iou`, gated at PARTS[pid].get('need', 0.90)), the model-only and reference-only
      pixels in the box as a percentage of the whole view's union, the bands crossing the box,
      and the compare sheet;
    - the part's extents against PARTS[pid]['size'] ({axis: metres}, 5%);
    - the mesh gates on the part's own objects;
    - floating pieces over the whole model, so a part that does not reach its neighbour shows.
    `fail` blocks the part; `warn` is read and fixed or explained."""
    spec = PARTS[pid]
    need = spec.get("need", 0.90)
    names, mine = model_names(sc), part_names(sc, pid)
    out = {"part": pid, "fail": [], "warn": [], "views": {}}
    if not mine:
        out["fail"].append("the part built no mesh objects")
        out["passed"] = False
        return out
    if not spec.get("region"):
        out["warn"].append("no region boxes in PARTS: the part has no silhouette gate")
    for view, box in spec.get("region", {}).items():
        e = ref_empty(sc, view)
        r = silhouette_iou(sc, names, e, out_dir, need=need, regions={pid: box})
        if "error" in r:
            out["fail"].append(f"{view}: {r['error']}")
            continue
        reg = r["regions"][pid]
        out["views"][view] = {"part_iou": reg["iou"], "model_only_pct": reg["model_only_pct"],
                              "ref_only_pct": reg["ref_only_pct"], "view_iou": r["iou"],
                              "bands": [b for b in r["bands"] if box[2] <= b["up_m"] < box[3]],
                              "diff": r["diff"], "compare": compare(sc, names, e, out_dir)}
        if reg["iou"] < need:
            out["fail"].append(f"{view}: part overlap {reg['iou']:.3f} below {need}")
    if spec.get("size"):
        out["size"] = bounds(mine)["size"]
        out["fail"] += _size_fail(out["size"], spec["size"])
    # inside the part alone a piece resting on a neighbour reads as floating: the whole model decides
    mesh = check_all(mine, budget_tris=budget_tris, ground=True, floating=False)
    out["mesh"] = {k: mesh[k] for k in ("tris_total", "coplanar", "below")}
    out["fail"] += mesh["fail"]
    out["warn"] += mesh["warn"]
    whole = floating_parts(names)
    out["floating"] = whole["floating"]
    if whole["floating_count"]:
        out["fail"].append(f"{whole['floating_count']} pieces of the whole model touch nothing that leads to the ground")
    out["passed"] = not out["fail"]
    return out
