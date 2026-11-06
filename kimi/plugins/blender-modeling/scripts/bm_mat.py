# Materials: role materials built from library photo textures plus layers - a tone per piece,
# dirt at the ground, shade under an overhang, local occlusion, roughness by role - checked
# against the reference by numbers and baked into one texture set the game can read.
# Blender's node materials do not survive the glTF export (only an image per map does), so
# whatever the nodes make is baked before export. Recipes: references/materials.md.

import bpy, bmesh, math, os, random
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree


# COLOUR

def _srgb_to_linear(c):
    c = np.asarray(c, np.float64)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def to_lab(rgb):
    """sRGB 0..1 (..., 3) to CIE Lab (D65): L* lightness 0..100, a* green-red, b* blue-yellow.
    Two colours 2-3 apart in Lab are a visible difference, more than 10 another colour."""
    xyz = _srgb_to_linear(rgb) @ np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722],
                                           [0.0193, 0.1192, 0.9505]]).T
    xyz = xyz / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def _linear_to_srgb(c):
    c = np.asarray(c, np.float64)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(np.clip(c, 0, None), 1 / 2.4) - 0.055)


def _hex(rgb):
    return "#" + "".join(f"{int(round(max(0.0, min(1.0, v)) * 255)):02x}" for v in rgb)


# TONE PER PIECE

def _islands(bm):
    """Face index -> piece number: faces joined by edges are one piece (one log, one board)."""
    bm.faces.ensure_lookup_table()
    lab, n = [-1] * len(bm.faces), 0
    for f in bm.faces:
        if lab[f.index] >= 0:
            continue
        lab[f.index], stack = n, [f]
        while stack:
            g = stack.pop()
            for e in g.edges:
                for h in e.link_faces:
                    if lab[h.index] < 0:
                        lab[h.index] = n
                        stack.append(h)
        n += 1
    return lab, n


def _bvh_of(names):
    dg = depsgraph_of(objs_of(list(names)))
    verts, polys = [], []
    for o in objs_of(list(names)):
        co, ps, _ = _world_mesh(o, dg)
        base = len(verts)
        verts += [tuple(p) for p in co]
        polys += [tuple(base + i for i in p) for p in ps]
    return BVHTree.FromPolygons(verts, polys) if polys else None


def piece_tone(names, spread=5.0, seed=0, ground=0.0, ground_h=1.2, ground_dark=0.2,
               shade_from=(), shade_dist=1.5, shade_dark=0.15, layer="tone"):
    """Write the colour attribute `layer` (face corners) on every object: a multiplier <= 1 that
    role_material multiplies into the colour.
    - a tone per piece (mesh island: one log, one board), random by `seed`, so neighbours differ:
      `spread` is the standard deviation in L* units (3-6 reads at game size);
    - darker towards the ground by `ground_dark` (0.2 = 20%) at `ground`, fading out over
      `ground_h` metres;
    - darker under an overhang: a ray straight up from a vertex that hits an object of
      `shade_from` (the roof) within `shade_dist` metres darkens it by up to `shade_dark`.
    The multiplier is at most 1, so a role's colour is its lightest piece. Returns the piece
    count per object and the tone spread written, in L*."""
    rnd = random.Random(seed)
    tree = _bvh_of(shade_from) if shade_from and shade_dark else None
    width = math.sqrt(12) * spread  # a uniform draw this wide has this standard deviation
    pieces, tones = {}, []
    for o in objs_of(names):
        me = o.data
        bm = bmesh.new()
        bm.from_mesh(me)
        lab, n = _islands(bm)
        bm.free()
        if not n:
            continue
        piece = np.array([((55 - rnd.random() * width + 16) / 71) ** 3 for _ in range(n)])
        tones += piece.tolist()
        nv, nl, npoly = len(me.vertices), len(me.loops), len(me.polygons)
        co = np.empty(nv * 3)
        me.vertices.foreach_get("co", co)
        mw = o.matrix_world
        co = co.reshape(-1, 3) @ np.array(mw.to_3x3()).T + np.array(mw.translation)
        lv = np.empty(nl, np.int64)
        me.loops.foreach_get("vertex_index", lv)
        tot = np.empty(npoly, np.int64)
        me.polygons.foreach_get("loop_total", tot)
        f = piece[np.array(lab)[np.repeat(np.arange(npoly), tot)]]
        t = np.clip((co[lv, 2] - ground) / ground_h, 0.0, 1.0)
        f = f * (1 - ground_dark * (1 - t * t * (3 - 2 * t)))
        if tree is not None:
            sh = np.ones(nv)
            up = Vector((0.0, 0.0, 1.0))
            for i, p in enumerate(co):
                hit = tree.ray_cast(Vector(p) + up * 0.02, up, shade_dist)
                if hit[0] is not None:
                    sh[i] = 1 - shade_dark * (1 - hit[3] / shade_dist)
            f = f * sh[lv]
        attr = me.color_attributes.get(layer)
        if attr is not None and (attr.domain != 'CORNER' or attr.data_type != 'BYTE_COLOR'):
            me.color_attributes.remove(attr)
            attr = None
        attr = attr or me.color_attributes.new(layer, 'BYTE_COLOR', 'CORNER')
        rgba = np.repeat(f[:, None], 4, 1)
        rgba[:, 3] = 1.0
        attr.data.foreach_set("color", rgba.ravel())
        me.update()
        pieces[o.name] = n
    L = 71 * np.cbrt(np.array(tones)) - 16 if tones else np.zeros(1)
    return {"pieces": pieces, "tone_spread_L": round(float(L.std()), 2)}


def piece_uv(names, layer="grain"):
    """Write a UV map `layer` that runs along each piece (mesh island), in metres: u along the
    piece's long axis, v around it (a round piece - log, post, pole: angle x radius) or across
    it (a flat one - board, plank, beam: along its width). role_material lays the library
    texture on it with the grain along the piece, as on real logs and boards; a box projection
    turns the grain across every piece that is not aligned with its axes."""
    out = {}
    for o in objs_of(names):
        me = o.data
        m3 = np.array(o.matrix_world.to_3x3())
        bm = bmesh.new()
        bm.from_mesh(me)
        lab, n = _islands(bm)
        uvl = bm.loops.layers.uv.get(layer) or bm.loops.layers.uv.new(layer)
        groups = {}
        for f in bm.faces:
            groups.setdefault(lab[f.index], []).append(f)
        for faces in groups.values():
            idx = sorted({v.index for f in faces for v in f.verts})
            bm.verts.ensure_lookup_table()
            P = np.array([tuple(bm.verts[i].co) for i in idx]) @ m3.T
            c0 = P.mean(0)
            _, _, vt = np.linalg.svd(P - c0, full_matrices=False)
            axes = list(vt) + [np.cross(vt[0], vt[1])] if len(vt) < 3 else list(vt)
            a, b, c = axes[0], axes[1], axes[2]
            Q = P - c0
            eb, ec = np.ptp(Q @ b), np.ptp(Q @ c)
            round_ = ec > 0.5 * eb
            r = 0.25 * (eb + ec)
            for f in faces:
                fc = np.array(f.calc_center_median()) @ m3.T - c0
                fa = math.atan2(fc @ c, fc @ b)
                for l in f.loops:
                    d = np.array(tuple(l.vert.co)) @ m3.T - c0
                    if round_:
                        ang = math.atan2(d @ c, d @ b)
                        ang += -2 * math.pi if ang - fa > math.pi else (2 * math.pi if fa - ang > math.pi else 0.0)
                        l[uvl].uv = (float(d @ a), ang * r)
                    else:
                        l[uvl].uv = (float(d @ a), float(d @ b))
        bm.to_mesh(me)
        bm.free()
        me.update()
        out[o.name] = n
    return out


# ROLE MATERIALS

def _image_stats(img):
    """Mean linear luminance of an image (to normalise its pattern) and whether its streaks run
    along the image's v axis (vertical grain), both cached on the image."""
    if "bm_mean_lum" not in img:
        px = np.empty(len(img.pixels), np.float32)
        img.pixels.foreach_get(px)
        rgb = px.reshape(img.size[1], img.size[0], 4)[::4, ::4, :3]  # plenty for a mean and a direction
        del px
        if not img.colorspace_settings.is_data and not img.is_float:  # float pixels are linear already
            rgb = _srgb_to_linear(rgb)
        lum = rgb @ np.array([0.2126, 0.7152, 0.0722])
        img["bm_mean_lum"] = float(lum.mean())
        # streaks along v change little along v and a lot across it (along u)
        img["bm_grain_v"] = bool(np.abs(np.diff(lum, axis=1)).mean() > np.abs(np.diff(lum, axis=0)).mean())
    return max(1e-4, img["bm_mean_lum"]), bool(img["bm_grain_v"])


def role_material(name, color, lib=None, scale=1.6, contrast=1.0, rough=(0.78, 0.92), metal=0.0,
                  tone="tone", dirt=None, ao=0.3, ao_dist=0.25, ground=0.0, uv="auto", names=None,
                  bands=None):
    """Rebuild material `name` in place (objects keep their slots) as one role.

    colour = `color` (hex, the role's lightest piece as measured on the reference)
             x the light-dark pattern of the library colour map (its own hue is dropped;
               `contrast` 0.5 flattens it, 1.5 strengthens it), or of a noise without `lib`
             x the `tone` colour attribute (piece_tone), when the mesh has it
             x local occlusion: creases down to (1 - `ao`) within `ao_dist` metres
             mixed toward `dirt` = {"color": hex, "height": m, "amount": 0..1} near the ground,
             broken up by a noise, and toward every colour of `bands`: [{"color": hex,
             "full": z where the colour is full, "none": z where it is gone, "amount": 0..1,
             "noise": bool}] - full above none for wood sheltered under a body (brown) while
             the legs below stay sun-bleached, full below none for a second dirt band.
    roughness: the library roughness (arm G or rough map) remapped into `rough` (lo, hi), or the
    middle of it. Texture at `scale` metres per repeat: along each piece on the "grain" UV map
    (piece_uv) when every mesh with this material has it (uv="auto" or "grain"), its streaks
    turned to run along the piece; otherwise box projection in object space (uv="box"). The
    occlusion and dirt layers show in EEVEE and Cycles and in the bake; nothing of this chain
    reaches the game without bake_asset. Run piece_tone and piece_uv first.

    names: the asset's objects whose meshes must carry "tone" and "grain" (default: MODEL_NAMES,
    which materials_pass sets to the objects it bakes; without either, every mesh in the file
    with this material - hidden blockouts and other scenes included)."""
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.pop("bm_warn", None)
    m["bm_role"] = True
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    L = nt.links.new
    rgb = (*hex_linear(color), 1.0)
    m.diffuse_color = rgb
    pool = names if names is not None else globals().get("MODEL_NAMES")
    meshes = {o.data for o in objs_of(pool)} if pool else set(bpy.data.meshes)
    users = [me for me in meshes if any(x is m for x in me.materials)]
    grain = uv == "grain" or (uv == "auto" and bool(users) and all("grain" in me.uv_layers for me in users))
    warns = []
    if uv == "auto" and users and not grain:
        warns.append("no 'grain' UV map on every mesh with this material: box projection")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / scale,) * 3
    if grain:
        um = nt.nodes.new("ShaderNodeUVMap")
        um.uv_map = "grain"
        L(um.outputs["UV"], mp.inputs["Vector"])
    else:
        L(tc.outputs["Object"], mp.inputs["Vector"])

    def mix(a, b, blend='MULTIPLY', fac=1.0):
        x = nt.nodes.new("ShaderNodeMix")
        x.data_type, x.blend_type = 'RGBA', blend
        if isinstance(fac, float):
            x.inputs[0].default_value = fac
        else:
            L(fac, x.inputs[0])
        for sock, v in ((x.inputs[6], a), (x.inputs[7], b)):
            if isinstance(v, tuple):
                sock.default_value = v
            else:
                L(v, sock)
        return x.outputs[2]

    def image(path, data):
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = bpy.data.images.load(path, check_existing=True)
        t.image.colorspace_settings.is_data = data
        t.projection, t.projection_blend = ('FLAT', 0.0) if grain else ('BOX', 0.25)
        L(mp.outputs["Vector"], t.inputs["Vector"])
        return t

    def math_(op, a, b):
        x = nt.nodes.new("ShaderNodeMath")
        x.operation = op
        for sock, v in ((x.inputs[0], a), (x.inputs[1], b)):
            if isinstance(v, float):
                sock.default_value = v
            else:
                L(v, sock)
        return x.outputs[0]

    def remap(v, a, b, c, d):
        x = nt.nodes.new("ShaderNodeMapRange")
        L(v, x.inputs["Value"])
        x.inputs["From Min"].default_value, x.inputs["From Max"].default_value = a, b
        x.inputs["To Min"].default_value, x.inputs["To Max"].default_value = c, d
        return x.outputs["Result"]

    maps = lib_maps(lib) if lib else {}
    if maps.get("color"):
        ci = image(maps["color"], False)
        nt.nodes.active = ci
        mean, streaks_v = _image_stats(ci.image)
        if grain and streaks_v:  # the piece runs along u: turn vertical streaks to run along it
            mp.inputs["Rotation"].default_value = (0.0, 0.0, math.pi / 2)
        bw = nt.nodes.new("ShaderNodeRGBToBW")
        L(ci.outputs["Color"], bw.inputs["Color"])
        pattern = math_('DIVIDE', bw.outputs["Val"], mean)
    else:
        nz = nt.nodes.new("ShaderNodeTexNoise")
        nz.inputs["Scale"].default_value, nz.inputs["Detail"].default_value = 3.0, 6.0
        L(mp.outputs["Vector"], nz.inputs["Vector"])
        pattern = remap(nz.outputs["Fac"], 0.3, 0.7, 0.85, 1.15)
    col = mix(rgb, math_('POWER', pattern, float(contrast)))
    # a Color Attribute node reads black on a mesh without the layer: use it only when every
    # mesh with this material has it (run piece_tone before role_material)
    if tone and not (users and all(tone in me.color_attributes for me in users)):
        warns.append(f"no '{tone}' colour attribute on every mesh with this material: tone left out")
        tone = None
    if warns:
        m["bm_warn"] = "; ".join(warns)
    if tone:
        ca = nt.nodes.new("ShaderNodeVertexColor")
        ca.layer_name = tone
        col = mix(col, ca.outputs["Color"])
    if ao:
        oc = nt.nodes.new("ShaderNodeAmbientOcclusion")
        oc.only_local, oc.samples = True, 8
        oc.inputs["Distance"].default_value = ao_dist
        col = mix(col, remap(oc.outputs["AO"], 0.0, 1.0, 1.0 - ao, 1.0))
    bands = list(bands or [])
    if dirt:
        bands.insert(0, {"color": dirt.get("color", "#4a4234"), "full": ground, "none": ground + dirt.get("height", 0.8),
                         "amount": dirt.get("amount", 0.6), "noise": True})
    if bands:
        geo = nt.nodes.new("ShaderNodeNewGeometry")
        sep = nt.nodes.new("ShaderNodeSeparateXYZ")
        L(geo.outputs["Position"], sep.inputs["Vector"])
        nz = nt.nodes.new("ShaderNodeTexNoise")
        nz.inputs["Scale"].default_value = 1.5
        L(tc.outputs["Object"], nz.inputs["Vector"])
        broken = remap(nz.outputs["Fac"], 0.35, 0.65, 0.3, 1.0)
    for b in bands:
        h = remap(sep.outputs["Z"], float(b["full"]), float(b["none"]), 1.0, 0.0)
        fac = math_('MULTIPLY', math_('MULTIPLY', h, broken) if b.get("noise", True) else h, float(b.get("amount", 0.6)))
        col = mix(col, (*hex_linear(b["color"]), 1.0), 'MIX', fac)
    L(col, bsdf.inputs["Base Color"])
    rmap = maps.get("arm") or maps.get("rough")
    if rmap:
        ri = image(rmap, True)
        r = ri.outputs["Color"]
        if maps.get("arm") == rmap:
            sc_ = nt.nodes.new("ShaderNodeSeparateColor")
            L(r, sc_.inputs["Color"])
            r = sc_.outputs[1]
        L(remap(r, 0.0, 1.0, rough[0], rough[1]), bsdf.inputs["Roughness"])
    else:
        bsdf.inputs["Roughness"].default_value = (rough[0] + rough[1]) / 2
    bsdf.inputs["Metallic"].default_value = metal
    return m


# BAKE

def _uv_stats(me, layer):
    bm = bmesh.new()
    bm.from_mesh(me)
    uv = bm.loops.layers.uv[layer]
    world, area = 0.0, 0.0
    for f in bm.faces:
        world += f.calc_area()
        p = [l[uv].uv for l in f.loops]
        area += abs(sum(p[i].x * p[(i + 1) % len(p)].y - p[(i + 1) % len(p)].x * p[i].y for i in range(len(p)))) / 2
    bm.free()
    return area, world


def _bake_pass(sc, obj, img, socket, samples):
    """Bake what feeds the Principled `socket` of every material of `obj` into `img`, through a
    temporary Emission shader; every material is put back afterwards."""
    undo = []
    try:
        for m in obj.data.materials:
            if m is None or not m.use_nodes:
                continue
            nt = m.node_tree
            bsdf = next((n for n in nt.nodes if n.bl_idname == "ShaderNodeBsdfPrincipled"), None)
            out = next((n for n in nt.nodes if n.bl_idname == "ShaderNodeOutputMaterial" and n.is_active_output), None)
            if bsdf is None or out is None:
                continue
            was_active = nt.nodes.active  # Workbench shows the active image node: put it back after
            em = nt.nodes.new("ShaderNodeEmission")
            src = bsdf.inputs[socket]
            if src.links:
                nt.links.new(src.links[0].from_socket, em.inputs["Color"])
            else:
                v = src.default_value
                em.inputs["Color"].default_value = (v, v, v, 1.0) if isinstance(v, float) else tuple(v)
            old = out.inputs["Surface"].links[0].from_socket if out.inputs["Surface"].links else None
            nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
            ti = nt.nodes.new("ShaderNodeTexImage")
            ti.image = img
            nt.nodes.active = ti
            undo.append((nt, em, ti, out, old, was_active))
        sc.cycles.samples = samples
        bpy.ops.object.bake(type='EMIT', use_clear=True, margin=max(2, img.size[0] // 64),
                            margin_type='ADJACENT_FACES', target='IMAGE_TEXTURES')
    finally:
        for nt, em, ti, out, old, was_active in undo:
            nt.nodes.remove(em)
            nt.nodes.remove(ti)
            if old is not None:
                nt.links.new(old, out.inputs["Surface"])
            if was_active is not None:
                nt.nodes.active = was_active


def bake_asset(sc, names, out_dir, name, size=1024, samples=16, metal=None):
    """Bake the asset into the copy that ships: one mesh (modifiers applied, world space), its
    own UV map ("bake": smart project, islands at one scale, packed) as the only UV map, one
    material reading a colour texture and an ORM texture (R 1, G roughness, B metal) the way the
    glTF exporter understands. metal=None bakes the metal pass when any material has a
    non-zero or linked Metallic (forged iron), otherwise B is 0. Everything the role materials make - library pattern, tone,
    dirt, occlusion - is in the colour texture. Writes <name>_color.png, <name>_orm.png and
    <name>_baked.blend (the copy for the live Blender: show_baked) to `out_dir`. Runs only in a
    Blender without a window (run_parts.py): the UV and bake operators work on the file's
    current scene and its selection, which in the live Blender are the owner's window.
    Returns paths, texels per metre, how much of the texture the islands fill, triangles."""
    if not bpy.app.background:
        raise RuntimeError("bake_asset runs in a Blender without a window (run_parts.py), never in the live one")
    os.makedirs(out_dir, exist_ok=True)
    col = coll(sc, "BAKE")
    clear(col)
    obj = export_copy(objs_of(names), f"{name}_baked", col)
    me = obj.data
    if metal is None:
        def _metallic(m):
            b = next((n for n in m.node_tree.nodes if n.bl_idname == "ShaderNodeBsdfPrincipled"), None) if m and m.use_nodes else None
            return b is not None and (b.inputs["Metallic"].links or b.inputs["Metallic"].default_value > 0)
        metal = any(_metallic(m) for m in me.materials)
    # the bake writes to the active UV map; the materials keep reading theirs ("grain", or the
    # render-active map a material without a UV Map node samples) until the bake is done
    uv = me.uv_layers.get("bake") or me.uv_layers.new(name="bake")
    me.uv_layers.active = uv
    # the operators act on the file's current scene and view layer: the copy joins them for the bake
    cs, vl = bpy.context.scene, bpy.context.view_layer
    linked = obj.name not in cs.collection.objects
    if linked:
        cs.collection.objects.link(obj)
    for x in vl.objects:
        x.select_set(False)
    obj.select_set(True)
    vl.objects.active = obj
    r = cs.render
    keep = dict(engine=r.engine, device=cs.cycles.device, samples=cs.cycles.samples)
    imgs = {}
    try:
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.0, area_weight=0.0,
                                 correct_aspect=True, scale_to_bounds=False)
        bpy.ops.uv.average_islands_scale()
        bpy.ops.uv.pack_islands(rotate=True, margin_method='FRACTION', margin=0.003, shape_method='CONCAVE')
        bpy.ops.object.mode_set(mode='OBJECT')
        r.engine = 'CYCLES'
        cs.cycles.device = 'CPU'
        passes = [("color", "Base Color", False), ("rough", "Roughness", True)] + ([("metal", "Metallic", True)] if metal else [])
        for key, socket, data in passes:
            img = bpy.data.images.new(f"{name}_{key}", size, size, alpha=False)
            img.colorspace_settings.is_data = data
            _bake_pass(cs, obj, img, socket, samples if key == "color" else 1)
            imgs[key] = img
    finally:
        if obj.mode != 'OBJECT':
            bpy.ops.object.mode_set(mode='OBJECT')
        r.engine, cs.cycles.device, cs.cycles.samples = keep["engine"], keep["device"], keep["samples"]
        if linked:
            cs.collection.objects.unlink(obj)
    paths = {"color": os.path.join(out_dir, f"{name}_color.png"), "orm": os.path.join(out_dir, f"{name}_orm.png")}
    c = imgs["color"]
    c.filepath_raw, c.file_format = paths["color"], 'PNG'
    c.save()
    px = np.empty(size * size * 4, np.float32)
    imgs["rough"].pixels.foreach_get(px)
    orm = px.reshape(-1, 4).copy()
    orm[:, 1] = orm[:, 0]
    orm[:, 0] = 1.0
    if metal:
        mp = np.empty(size * size * 4, np.float32)
        imgs["metal"].pixels.foreach_get(mp)
        orm[:, 2] = mp.reshape(-1, 4)[:, 0]
    else:
        orm[:, 2] = 0.0
    orm[:, 3] = 1.0
    o_img = bpy.data.images.new(f"{name}_orm_packed", size, size, alpha=False)
    o_img.colorspace_settings.is_data = True
    o_img.pixels.foreach_set(orm.ravel())
    o_img.filepath_raw, o_img.file_format = paths["orm"], 'PNG'
    o_img.save()
    for k in [k for k in imgs if k != "color"]:
        bpy.data.images.remove(imgs[k])
    bm_ = bpy.data.materials.new(f"{name}_baked")
    bm_.use_nodes = True
    nt = bm_.node_tree
    bsdf = node_of(bm_, "ShaderNodeBsdfPrincipled")
    tc = nt.nodes.new("ShaderNodeTexImage")
    tc.image = c
    nt.links.new(tc.outputs["Color"], bsdf.inputs["Base Color"])
    nt.nodes.active = tc
    to = nt.nodes.new("ShaderNodeTexImage")
    to.image = o_img
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(to.outputs["Color"], sep.inputs["Color"])
    nt.links.new(sep.outputs[1], bsdf.inputs["Roughness"])
    nt.links.new(sep.outputs[2], bsdf.inputs["Metallic"])
    me.materials.clear()
    me.materials.append(bm_)
    me.polygons.foreach_set("material_index", np.zeros(len(me.polygons), np.int32))
    for a in list(me.color_attributes):
        me.color_attributes.remove(a)
    for u in [u for u in me.uv_layers if u.name != "bake"]:  # the game reads one UV map
        me.uv_layers.remove(u)
    me.uv_layers["bake"].active_render = True
    me.update()
    area, world = _uv_stats(me, "bake")
    paths["blend"] = os.path.join(out_dir, f"{name}_baked.blend")
    bpy.ops.wm.save_as_mainfile(filepath=paths["blend"], copy=True, check_existing=False)
    me.calc_loop_triangles()
    return {"object": obj.name, "paths": paths, "size": size, "uv_fill": round(area, 3),
            "px_per_m": round(size * math.sqrt(area / world), 1) if world else 0.0,
            "tris": len(me.loop_triangles)}


def show_baked(sc, blend, name, hide_parts=True):
    """Append the baked copy from the materials pass's .blend into the asset's scene
    (collection <SCENE>_BAKED) so the owner sees what the game gets. hide_parts hides the part
    and blockout collections meanwhile; show_parts puts them back."""
    col = coll(sc, "BAKED")
    clear(col)
    with bpy.data.libraries.load(blend, link=False) as (src, dst):
        if name not in src.objects:
            raise ValueError(f"{blend} has no object {name!r}")
        dst.objects = [name]
    col.objects.link(dst.objects[0])
    if hide_parts:
        for c in sc.collection.children:
            if c.name[len(sc.name) + 1:].startswith(("part_", "blk_", "MODEL")):
                c.hide_viewport = c.hide_render = True
    return dst.objects[0].name


def show_parts(sc):
    """Back from show_baked: parts visible (a built part hides its blockout), the baked copy
    hidden."""
    for c in sc.collection.children:
        tag = c.name[len(sc.name) + 1:]
        if tag.startswith("part_") or tag == "MODEL":
            c.hide_viewport = c.hide_render = False
        elif tag.startswith("blk_"):
            built = _existing(sc, "part_" + tag[4:])
            c.hide_viewport = c.hide_render = bool(built and built.objects)
        elif tag == "BAKED":
            c.hide_viewport = c.hide_render = True


# CHECKS

_ID_COLOURS = [(1, 0, 0), (0, 1, 0), (0, 0, 1), (1, 1, 0), (1, 0, 1), (0, 1, 1), (1, 0.5, 0),
               (0.5, 0, 1), (0, 0.5, 0), (0.5, 0.5, 1), (1, 0.5, 0.5), (0.5, 1, 0.5)]


def _role_masks(sc, names, cam, size, path):
    """One flat render with every material in its own colour: role (material name) -> mask,
    with the parts in front hiding the parts behind, as in the reference. The colours are set
    linear and read back from an sRGB PNG, so they are compared encoded. Materials past the
    twelfth are left out (returned in the second value)."""
    mats = []
    for o in objs_of(names):
        for m in o.data.materials:
            if m is not None and m not in mats:
                mats.append(m)
    left_out = [m.name for m in mats[len(_ID_COLOURS):]]
    mats = mats[:len(_ID_COLOURS)]
    keep = {m.name: tuple(m.diffuse_color) for m in mats}
    try:
        for m, c in zip(mats, _ID_COLOURS):
            m.diffuse_color = (*c, 1.0)
        img = load_rgba(render_objs(sc, objs_of(names), cam, size, path, "id"))
    finally:
        for m in mats:
            m.diffuse_color = keep[m.name]
    out = {}
    for m, c in zip(mats, _ID_COLOURS):
        out[m.name] = (np.abs(img[..., :3] - _linear_to_srgb(c)).max(-1) < 0.1) & (img[..., 3] > 0.5)
    return out, left_out


def _game_blocks(L, mask, kh, kw):
    """Mean L* of kh x kw blocks (one game pixel) where the mask covers at least half the block."""
    h, w = (L.shape[0] // kh) * kh, (L.shape[1] // kw) * kw
    Lm = (L * mask)[:h, :w].reshape(h // kh, kh, w // kw, kw).sum((1, 3))
    cnt = mask[:h, :w].reshape(h // kh, kh, w // kw, kw).sum((1, 3))
    ok = cnt >= kh * kw / 2
    return Lm[ok] / cnt[ok]


def material_gates(sc, names, baked, out_dir, game_px_per_m=6.75, game_elev=55, max_ab=6.0, max_rel_l=8.0,
                   spread=(0.6, 1.5), min_px=300):
    """The baked asset against the reference, per reference view and per role (material of the
    source objects `names`), on pixels where both show that role:
    - hue and saturation: the distance of the mean a*, b* (`d_ab`, on the colour without light)
      at most `max_ab` - light changes lightness far more than hue, so this holds against a lit
      drawing;
    - lightness relative to the whole asset (`rel_l`, studio-lit render against the drawing):
      role L* minus asset L*, compared with the same on the reference, within `max_rel_l`;
    - variation at game size (`spread_ratio`, a warning, not a gate): standard deviation of L*
      over blocks of one game pixel, model over reference, expected inside `spread` - a flat
      wall reads 0.3. A game pixel covers
      1/`game_px_per_m` metres across and, on a wall seen from the game camera's `game_elev`,
      1/cos(elev) times that in height.
    Views added with detail_only are skipped. Thresholds are first guesses from one model;
    read the numbers, not only pass/fail. A drawn reference has light and dark painted on every
    piece, so roles made of few large pieces (roof, boards, sails) read under 0.6 even when
    right; only the logs of a wall reach it. Writes matcompare_<view>.png: reference | lit |
    colour without light."""
    os.makedirs(out_dir, exist_ok=True)
    out = {"views": {}, "fail": [], "warn": []}
    for e in [o for o in sc.objects if o.get("bm_view") and not o.get("bm_detail_only")]:
        view = e["bm_view"]
        cam, (w, h) = frame_camera(sc, e, 1024)
        masks, left_out = _role_masks(sc, names, cam, (w, h), os.path.join(out_dir, f"roles_{view}.png"))
        if left_out:
            out["warn"].append(f"{view}: more than {len(_ID_COLOURS)} materials, not checked: {', '.join(left_out)}")
        for role, mk in masks.items():
            if not mk.any():
                out["warn"].append(f"{view} {role}: does not show in this view")
        alb = load_rgba(render_objs(sc, objs_of([baked]), cam, (w, h), os.path.join(out_dir, f"albedo_{view}.png"), "albedo"))
        lit = load_rgba(render_objs(sc, objs_of([baked]), cam, (w, h), os.path.join(out_dir, f"lit_{view}.png"), "material"))
        ref = resize_nearest(load_rgba(e["bm_image"]), w, h)
        refmask = resize_nearest(load_rgba(e["bm_mask"])[..., 0] < 0.5, w, h)
        k = max(1, int(round((w / e["bm_w"]) / game_px_per_m)))
        kv = max(1, int(round(k / math.cos(math.radians(game_elev)))))
        lab_ref, lab_alb, lab_lit = to_lab(ref[..., :3]), to_lab(alb[..., :3]), to_lab(lit[..., :3])
        whole = refmask & (alb[..., 3] > 0.5)
        if whole.sum() < min_px:
            out["warn"].append(f"{view}: model and reference barely overlap")
            continue
        base_ref, base_lit = lab_ref[..., 0][whole].mean(), lab_lit[..., 0][whole].mean()
        roles = {}
        for role, mk in masks.items():
            mk = mk & whole
            if mk.sum() < min_px:
                continue
            r_ab, a_ab = lab_ref[mk][:, 1:].mean(0), lab_alb[mk][:, 1:].mean(0)
            rel = (lab_lit[..., 0][mk].mean() - base_lit) - (lab_ref[..., 0][mk].mean() - base_ref)
            sr = _game_blocks(lab_ref[..., 0], mk, kv, k)
            sm = _game_blocks(lab_lit[..., 0], mk, kv, k)
            ratio = float(sm.std() / sr.std()) if len(sr) > 3 and sr.std() > 0.5 else None
            row = {"px": int(mk.sum()), "ref_hex": _hex(ref[..., :3][mk].mean(0)),
                   "model_hex": _hex(alb[..., :3][mk].mean(0)),
                   "d_ab": round(float(np.hypot(*(a_ab - r_ab))), 2), "rel_l": round(float(rel), 2),
                   "ref_ab": [round(float(x), 1) for x in r_ab], "model_ab": [round(float(x), 1) for x in a_ab],
                   "spread_ratio": round(ratio, 2) if ratio is not None else None,
                   "ref_spread_l": round(float(sr.std()), 2) if len(sr) else None,
                   "model_spread_l": round(float(sm.std()), 2) if len(sm) else None}
            roles[role] = row
            if row["d_ab"] > max_ab:
                out["fail"].append(f"{view} {role}: hue/saturation off by {row['d_ab']} (a*b* {row['model_ab']} against {row['ref_ab']})")
            if abs(row["rel_l"]) > max_rel_l:
                out["fail"].append(f"{view} {role}: {'lighter' if rel > 0 else 'darker'} than on the reference by {abs(row['rel_l']):.1f} L* against the rest")
            if ratio is not None and not (spread[0] <= ratio <= spread[1]):  # read, not a gate: see the docstring
                out["warn"].append(f"{view} {role}: variation at game size {ratio:.2f} of the reference's")
        grey = np.array([0.43, 0.43, 0.43], np.float32)

        def flat(img):
            return img[..., :3] * img[..., 3:] + grey * (1 - img[..., 3:])
        gut = np.full((h, 8, 3), 0.15, np.float32)
        sheet_ = np.concatenate([ref[..., :3], gut, flat(lit), gut, flat(alb)], 1)
        out["views"][view] = {"roles": roles, "game_px_block": [kv, k],
                              "compare": save_rgba(sheet_.astype(np.float32), os.path.join(out_dir, f"matcompare_{view}.png"))}
    if not any(v["roles"] for v in out["views"].values()):
        # nothing measured is not a pass: no orthographic view, or a blank render (a hidden collection)
        out["fail"].append("no role was measured in any view: check the reference views and that the model renders")
    out["passed"] = not out["fail"]
    return out
