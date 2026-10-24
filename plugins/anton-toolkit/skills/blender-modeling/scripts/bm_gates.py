# Numeric gates. The screenshot locates the next fix; these numbers decide whether a phase
# passes: real dimensions, silhouette overlap with the reference per view, the cross-section
# profile along the length, mesh health, floating parts, coplanar overlaps (z-fighting) and
# anything below the ground. Every function returns a JSON-ready dict.

import bpy, bmesh, math, os
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree


def objs_of(names):
    """Mesh objects from a collection name, an object name, or a list of names/objects."""
    c = bpy.data.collections.get(names) if isinstance(names, str) else None
    if c is not None:
        out = [o for o in c.all_objects if o.type == 'MESH']
    else:
        out = []
        for n in ([names] if isinstance(names, str) else names):
            o = bpy.data.objects[n] if isinstance(n, str) else n
            if o.type == 'MESH':
                out.append(o)
    if not out:
        raise ValueError(f"no mesh objects in {names!r} (curves and text count only after conversion to mesh)")
    return out


def _world_mesh(o, dg):
    """Evaluated mesh (modifiers applied): world vertices (N,3), polygons, edges (E,2)."""
    eo = o.evaluated_get(dg)
    me = eo.to_mesh()
    n = len(me.vertices)
    co = np.empty(n * 3, np.float64)
    me.vertices.foreach_get("co", co)
    co = co.reshape(n, 3)
    M = np.array(o.matrix_world)
    co = co @ M[:3, :3].T + M[:3, 3]
    polys = [tuple(p.vertices) for p in me.polygons]
    ed = np.empty(len(me.edges) * 2, np.int64)
    me.edges.foreach_get("vertices", ed)
    eo.to_mesh_clear()
    return co, polys, ed.reshape(-1, 2)


def _labels(n, edges):
    """Connected-component label per vertex (pointer jumping, no Python loop over edges)."""
    lab = np.arange(n)
    if not len(edges):
        return lab
    a, b = edges[:, 0], edges[:, 1]
    while True:
        m = np.minimum(lab[a], lab[b])
        new = lab.copy()
        np.minimum.at(new, a, m)
        np.minimum.at(new, b, m)
        new = new[new]
        if (new == lab).all():
            return lab
        lab = new


def bounds(names):
    dg = depsgraph_of(objs_of(names))
    pts = np.concatenate([_world_mesh(o, dg)[0] for o in objs_of(names)])
    lo, hi = pts.min(0), pts.max(0)
    return {"min": lo.round(4).tolist(), "max": hi.round(4).tolist(), "size": (hi - lo).round(4).tolist()}


def dim_gate(targets, tol=0.05):
    """targets: {object or collection: (size_x, size_y, size_z)} in metres, None skips an axis.
    Every measured span must be within `tol` of the brief."""
    rows, ok = [], True
    for key, t in targets.items():
        b = bounds(key)
        for i, ax in enumerate("xyz"):
            if not t[i]:
                continue
            d = (b["size"][i] - t[i]) / t[i]
            rows.append({"part": key, "axis": ax, "measured": b["size"][i], "target": t[i],
                         "delta_pct": round(100 * d, 1), "passed": abs(d) <= tol})
            ok = ok and abs(d) <= tol
    return {"passed": ok, "tol_pct": tol * 100, "rows": rows}


_AXIS = {(1, 0, 0): "+X", (-1, 0, 0): "-X", (0, 1, 0): "+Y", (0, -1, 0): "-Y", (0, 0, 1): "+Z"}


def silhouette_iou(scene, names, view_empty, out_dir, need=0.90, bands=12, long_px=1024):
    """Overlap of the model's silhouette with the reference mask of one view, seen by the
    camera that frames the reference image exactly. Returns the IoU, how far the outline
    leaves the reference on each side (metres, + = model outside the reference) and per
    horizontal band (left and right edge), plus a diff image: red = model only,
    blue = reference only, white = both."""
    e = bpy.data.objects[view_empty]
    view = e["bm_view"]
    _, ex, ey, _ = VIEWS[view]
    cam, (w, h) = frame_camera(scene, e, long_px)
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"sil_{view}.png")
    render_objs(scene, objs_of(names), cam, (w, h), path, mode="silhouette")
    mesh = fill_holes(load_rgba(path)[..., 3] > 0.5)
    ref = resize_nearest(load_rgba(e["bm_mask"])[..., 0] < 0.5, w, h)
    inter = int((mesh & ref).sum())
    union = int((mesh | ref).sum())
    iou = inter / union if union else 0.0
    ppm = w / e["bm_w"]
    rb, mb = bbox_px(mesh), bbox_px(ref)
    out = {"view": view, "iou": round(iou, 4), "passed": iou >= need, "need": need,
           "image_right": _AXIS[tuple(ex)], "image_up": _AXIS[tuple(ey)]}
    if mb is None:
        out["error"] = "the reference mask is empty"
        return out
    if rb is None:
        out["error"] = "the model is not in this view's frame"
        return out
    out["outside_m"] = {"left": round((mb[0] - rb[0]) / ppm, 3), "right": round((rb[2] - mb[2]) / ppm, 3),
                        "top": round((mb[1] - rb[1]) / ppm, 3), "bottom": round((rb[3] - mb[3]) / ppm, 3)}
    v0 = Vector((e["bm_cx"], e["bm_cy"], e["bm_cz"])).dot(Vector(ey))
    rows = []
    for i in range(bands):
        y = int(mb[1] + (i + 0.5) * (mb[3] - mb[1]) / bands)
        rx, mx = np.nonzero(ref[y])[0], np.nonzero(mesh[y])[0]
        row = {"up_m": round(v0 + (h / 2 - y) / ppm, 3), "ref_width_m": round((rx.max() - rx.min() + 1) / ppm, 3) if len(rx) else 0.0}
        if len(rx) and len(mx):
            row["left_m"] = round((rx.min() - mx.min()) / ppm, 3)
            row["right_m"] = round((mx.max() - rx.max()) / ppm, 3)
        else:
            row["missing"] = "model" if len(rx) else "reference"
        rows.append(row)
    out["bands"] = rows
    base = resize_nearest(load_rgba(e["bm_image"]), w, h)[..., :3].mean(2, keepdims=True) * 0.35
    img = np.concatenate([np.repeat(base, 3, 2), np.ones((h, w, 1), np.float32)], 2)
    img[mesh & ~ref, :3] = (0.9, 0.15, 0.1)
    img[ref & ~mesh, :3] = (0.15, 0.35, 0.95)
    img[mesh & ref, :3] = img[mesh & ref, :3] * 0.3 + 0.7
    out["diff"] = save_rgba(img, os.path.join(out_dir, f"diff_{view}.png"))
    return out


def extent_profile(names, along="z", measure="x", stations=12):
    """Width of the model along `measure` in cross-sections at stations down `along` (edges
    cut by each station plane, so a loft between two end sections is measured in the middle
    too). All stations equal is the signature of a uniform slab or a straight prism where the
    reference tapers."""
    a, m = "xyz".index(along), "xyz".index(measure)
    dg = depsgraph_of(objs_of(names))
    cos, eds, off = [], [], 0
    for o in objs_of(names):
        co, polys, ed = _world_mesh(o, dg)
        cos.append(co)
        eds.append(ed + off)
        off += len(co)
    co, ed = np.concatenate(cos), np.concatenate(eds)
    lo, hi = co[:, a].min(), co[:, a].max()
    p0, p1 = co[ed[:, 0]], co[ed[:, 1]]
    t0, t1 = p0[:, a], p1[:, a]
    out = []
    for i in range(stations):
        s = lo + (i + 0.5) * (hi - lo) / stations
        cut = (np.minimum(t0, t1) <= s) & (np.maximum(t0, t1) >= s) & (np.abs(t1 - t0) > 1e-12)
        w = (s - t0[cut]) / (t1[cut] - t0[cut])
        vals = p0[cut, m] + (p1[cut, m] - p0[cut, m]) * w
        if len(vals):
            out.append({"at": round(float(s), 3), "extent": round(float(vals.max() - vals.min()), 3)})
    ex = [o["extent"] for o in out]
    return {"along": along, "measure": measure, "min": min(ex), "max": max(ex), "stations": out}


def mesh_report(names, budget_tris=None):
    """Per object, on the evaluated mesh: triangles, ngons, zero-area faces, loose vertices,
    wire edges, open (boundary) edges, edges shared by more than two faces, islands, faces
    flipped against a consistent recalculation (closed meshes), lowest point, modifiers."""
    dg = depsgraph_of(objs_of(names))
    rows, total = [], 0
    for o in objs_of(names):
        bm = bmesh.new()
        bm.from_object(o, dg)
        bm.verts.ensure_lookup_table()
        bm.faces.ensure_lookup_table()
        tris = sum(len(f.verts) - 2 for f in bm.faces)
        total += tris
        boundary = sum(1 for e in bm.edges if len(e.link_faces) == 1)
        r = {"object": o.name, "tris": tris, "verts": len(bm.verts),
             "ngons": sum(1 for f in bm.faces if len(f.verts) > 4),
             "zero_area": sum(1 for f in bm.faces if f.calc_area() < 1e-9),
             "loose_verts": sum(1 for v in bm.verts if not v.link_edges),
             "wire_edges": sum(1 for e in bm.edges if not e.link_faces),
             "boundary_edges": boundary,
             "nonmanifold_edges": sum(1 for e in bm.edges if len(e.link_faces) > 2),
             "modifiers": [m.type for m in o.modifiers]}
        ed = np.array([(e.verts[0].index, e.verts[1].index) for e in bm.edges], np.int64).reshape(-1, 2)
        r["islands"] = int(len(np.unique(_labels(len(bm.verts), ed)))) if len(bm.verts) else 0
        if boundary == 0 and len(bm.faces):
            bm2 = bm.copy()
            bmesh.ops.recalc_face_normals(bm2, faces=bm2.faces)
            bm2.faces.ensure_lookup_table()
            r["flipped"] = sum(1 for i, f in enumerate(bm.faces) if f.normal.dot(bm2.faces[i].normal) < 0)
            bm2.free()
        mw = o.matrix_world
        r["min_z"] = round(min((mw @ v.co).z for v in bm.verts), 4) if bm.verts else None
        bm.free()
        rows.append(r)
    out = {"objects": rows, "tris_total": total}
    if budget_tris:
        out["budget_tris"] = budget_tris
        out["within_budget"] = total <= budget_tris
    return out


def floating_parts(names, tol=0.003, sample=600):
    """Islands (connected pieces of mesh) that touch nothing that leads to the ground: the
    commonest defect of code-built models (a fence board in the air, a tail off the body, a
    handle beside the can). Two islands are joined when their triangles intersect or a sample
    point of one - vertices, points along every edge, face centres - lies within `tol` of the
    other's surface: a shaft lying on a bearing touches it mid-span, where it has no vertex.
    The ground is the component of the lowest island."""
    dg = depsgraph_of(objs_of(names))
    isl = []
    for o in objs_of(names):
        co, polys, ed = _world_mesh(o, dg)
        if not len(co):
            continue
        lab = _labels(len(co), ed)
        by_label = {}
        for p in polys:  # one pass, not islands x polygons
            by_label.setdefault(int(lab[p[0]]), []).append(p)
        for L in np.unique(lab):
            vid = np.nonzero(lab == L)[0]
            local = {int(v): i for i, v in enumerate(vid)}
            ps = [tuple(local[v] for v in p) for p in by_label.get(int(L), [])]
            pts = co[vid]
            smp = [pts]
            if ps:
                e = np.array([(p[i], p[(i + 1) % len(p)]) for p in ps for i in range(len(p))])
                smp += [pts[e[:, 0]] * (1 - t) + pts[e[:, 1]] * t for t in (0.2, 0.4, 0.6, 0.8)]
                smp.append(np.array([pts[list(p)].mean(0) for p in ps]))
            smp = np.concatenate(smp)
            if len(smp) > sample:
                smp = smp[np.linspace(0, len(smp) - 1, sample).astype(int)]
            fat = None
            if ps:  # the island grown by tol along vertex normals: faces lying flat on another touch it
                vn = np.zeros_like(pts)
                for p in ps:
                    P = pts[list(p)]
                    vn[list(p)] += np.cross(P[1] - P[0], P[2] - P[0])
                ln = np.linalg.norm(vn, axis=1, keepdims=True)
                vn = np.divide(vn, ln, out=np.zeros_like(vn), where=ln > 1e-12)
                fat = BVHTree.FromPolygons([tuple(p) for p in pts + vn * tol * 2], ps)
            isl.append({"object": o.name, "pts": pts, "smp": smp, "lo": pts.min(0), "hi": pts.max(0),
                        "bvh": BVHTree.FromPolygons([tuple(p) for p in pts], ps) if ps else None, "fat": fat})
    n = len(isl)
    if not n:
        return {"islands": 0, "floating": [], "passed": True}
    lo = np.array([i["lo"] for i in isl])
    hi = np.array([i["hi"] for i in isl])
    parent = list(range(n))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def near(a, b):
        if a["bvh"] is None or b["bvh"] is None:
            return False
        if a["bvh"].overlap(b["bvh"]) or a["fat"].overlap(b["bvh"]) or b["fat"].overlap(a["bvh"]):
            return True
        for x, y in ((a, b), (b, a)):
            for p in x["smp"]:
                if y["bvh"].find_nearest(Vector(p), tol)[0] is not None:
                    return True
        return False
    cand = np.all((lo[:, None, :] <= hi[None, :, :] + tol) & (lo[None, :, :] <= hi[:, None, :] + tol), 2)
    for i, j in zip(*np.nonzero(np.triu(cand, 1))):
        if find(i) != find(j) and near(isl[i], isl[j]):
            parent[find(i)] = find(j)
    zmin = lo[:, 2].min()
    grounded = {find(i) for i in range(n) if lo[i, 2] <= zmin + tol}
    floating = [{"object": isl[i]["object"], "center": ((lo[i] + hi[i]) / 2).round(3).tolist(),
                 "size": (hi[i] - lo[i]).round(3).tolist(), "verts": int(len(isl[i]["pts"]))}
                for i in range(n) if find(i) not in grounded]
    return {"islands": n, "components": len({find(i) for i in range(n)}), "floating": floating[:40],
            "floating_count": len(floating), "passed": not floating}


def _inside(pt, poly):
    """Point strictly inside a 2D polygon (ray casting)."""
    x, y = pt
    c = False
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


def _cross_seg(p, q, r, s):
    d = lambda a, b, c: (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    return d(p, q, r) * d(p, q, s) < 0 and d(r, s, p) * d(r, s, q) < 0


def _poly_overlap(A, B):
    """Two 2D polygons share interior area (touching along an edge does not count)."""
    ca, cb = A.mean(0), B.mean(0)
    A, B = ca + (A - ca) * 0.97, cb + (B - cb) * 0.97
    if any(_inside(p, B) for p in A) or any(_inside(p, A) for p in B) or _inside(ca, B) or _inside(cb, A):
        return True
    return any(_cross_seg(A[i], A[(i + 1) % len(A)], B[j], B[(j + 1) % len(B)])
               for i in range(len(A)) for j in range(len(B)))


def coplanar_overlaps(names, dist=0.002, report=30, max_pairs=3_000_000):
    """Z-fighting: faces of different pieces lying in the same plane, facing the same way,
    overlapping - flush ends and faces of parts that meet. Faces lying on the ground facing
    down are skipped. Check the reported spots in a close-up; hidden ones can stay."""
    dg = depsgraph_of(objs_of(names))
    faces = []
    zmin = None
    for o in objs_of(names):
        co, polys, ed = _world_mesh(o, dg)
        if not len(co):
            continue
        zmin = co[:, 2].min() if zmin is None else min(zmin, co[:, 2].min())
        lab = _labels(len(co), ed)
        for p in polys:
            P = co[list(p)]
            nrm = np.cross(P[1] - P[0], P[2] - P[0])
            ln = np.linalg.norm(nrm)
            if ln < 1e-12:
                continue
            nrm = nrm / ln
            faces.append((o.name, int(lab[p[0]]), nrm, float(nrm @ P[0]), P))
    faces = [f for f in faces if not (f[2][2] < -0.99 and abs(f[4][:, 2].max() - zmin) < dist)]
    groups = {}
    for k, f in enumerate(faces):  # by direction; planes are matched by a sweep over the offset
        groups.setdefault(tuple(np.round(f[2] / 0.02).astype(int)), []).append(k)
    hits, budget, truncated = [], max_pairs, False
    for ks in groups.values():
        if len(ks) < 2:
            continue
        ks.sort(key=lambda k: faces[k][3])
        nrm = faces[ks[0]][2]
        u = np.cross(nrm, [0, 0, 1] if abs(nrm[2]) < 0.9 else [1, 0, 0])
        u /= np.linalg.norm(u)
        v = np.cross(nrm, u)
        uv = {k: np.stack([faces[k][4] @ u, faces[k][4] @ v], 1) for k in ks}
        box = {k: (uv[k].min(0), uv[k].max(0)) for k in ks}
        for i, ka in enumerate(ks):
            a = faces[ka]
            for kb in ks[i + 1:]:
                b = faces[kb]
                if b[3] - a[3] > dist:
                    break
                budget -= 1
                if budget < 0:
                    truncated = True
                    break
                if (a[0], a[1]) == (b[0], b[1]):
                    continue
                ext = np.minimum(box[ka][1], box[kb][1]) - np.maximum(box[ka][0], box[kb][0])
                if (ext <= 0).any() or ext.prod() <= 1e-4:
                    continue
                if _poly_overlap(uv[ka], uv[kb]):
                    hits.append({"objects": [a[0], b[0]], "at": a[4].mean(0).round(3).tolist(), "overlap_m2": round(float(ext.prod()), 4)})
            if truncated:
                break
        if truncated:
            break
    return {"candidates": hits[:report], "count": len(hits), "truncated": truncated}


def below_ground(names, tol=1e-4):
    dg = depsgraph_of(objs_of(names))
    rows = []
    for o in objs_of(names):
        co = _world_mesh(o, dg)[0]
        if len(co) and co[:, 2].min() < -tol:
            rows.append({"object": o.name, "min_z": round(float(co[:, 2].min()), 4)})
    return {"below": rows, "passed": not rows}


def check_all(names, budget_tris=None, ground=True, tol=0.003):
    """Every mesh gate at once. `fail` blocks the phase; `warn` is read and either fixed or
    explained in the report."""
    mr = mesh_report(names, budget_tris)
    fp = floating_parts(names, tol)
    cp = coplanar_overlaps(names)
    bg = below_ground(names) if ground else {"below": [], "passed": True}
    fail, warn = [], []
    if budget_tris and not mr["within_budget"]:
        fail.append(f"{mr['tris_total']} tris over the budget of {budget_tris}")
    if fp["floating_count"]:
        fail.append(f"{fp['floating_count']} floating pieces")
    if bg["below"]:
        fail.append(f"{len(bg['below'])} objects below the ground")
    for r in mr["objects"]:
        if r["nonmanifold_edges"]:
            fail.append(f"{r['object']}: {r['nonmanifold_edges']} edges shared by more than two faces")
        if r.get("flipped"):
            fail.append(f"{r['object']}: {r['flipped']} flipped faces")
        if r["ngons"]:
            warn.append(f"{r['object']}: {r['ngons']} ngons")
        if r["loose_verts"] or r["wire_edges"]:
            warn.append(f"{r['object']}: {r['loose_verts']} loose verts, {r['wire_edges']} wire edges")
        if r["boundary_edges"]:
            warn.append(f"{r['object']}: {r['boundary_edges']} open edges (fine only for cards and sheets)")
        if r["zero_area"]:
            warn.append(f"{r['object']}: {r['zero_area']} zero-area faces")
    if cp["count"]:
        warn.append(f"{cp['count']} coplanar overlap candidates (z-fighting)")
    if cp["truncated"]:
        warn.append("coplanar check stopped early on a very large flat group: not every plane was checked")
    return {"passed": not fail, "fail": fail, "warn": warn, "tris_total": mr["tris_total"],
            "floating": fp["floating"][:10], "coplanar": cp["candidates"][:10], "below": bg["below"],
            "objects": mr["objects"]}
