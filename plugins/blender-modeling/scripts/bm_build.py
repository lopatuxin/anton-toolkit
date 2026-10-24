# Construction helpers: the asset's own scene and collections, materials, meshes from bmesh,
# lofts through cross-sections, revolves, prisms from 2D outlines, beams, boards with real
# thickness and gaps, limited bevels with weighted normals, real-size box UVs, library PBR
# materials, an evaluated export copy and a GLB export.
# Units are metres, Z up, the asset faces -Y unless the project says otherwise.

import bpy, bmesh, math, os, glob
from mathutils import Vector, Matrix


# SCENE AND COLLECTIONS

def scene_for(name):
    """The asset's own scene. Build here and never clear other scenes: other sessions may be
    working in the same Blender."""
    sc = bpy.data.scenes.get(name) or bpy.data.scenes.new(name)
    sc.unit_settings.system = 'METRIC'
    sc.unit_settings.scale_length = 1.0
    for role in ("REF", "MODEL"):
        coll(sc, role)
    return sc


def coll(scene, role):
    """Collection `<scene>_<role>` linked under the scene (collections are file-global)."""
    name = f"{scene.name}_{role}"
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in scene.collection.children:
        scene.collection.children.link(c)
    return c


def clear(collection):
    """Remove every object of a collection and the meshes left without users. A build script
    clears only the collection it owns, then rebuilds it, so it is safe to rerun."""
    for o in list(collection.objects):
        data = o.data
        bpy.data.objects.remove(o, do_unlink=True)
        if data is not None and data.users == 0 and isinstance(data, bpy.types.Mesh):
            bpy.data.meshes.remove(data)


def show(scene):
    """Switch the window to the asset's scene, only when the owner should look at it."""
    bpy.context.window.scene = scene


# MATERIALS

def hex_linear(h):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb)


def node_of(material, idname):
    """Node by type: with a translated interface node names are translated, types are not."""
    n = next((n for n in material.node_tree.nodes if n.bl_idname == idname), None)
    if n is None:
        raise ValueError(f"material {material.name} has no {idname} node")
    return n


def mat(name, color="#808080", rough=0.8, metal=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = node_of(m, "ShaderNodeBsdfPrincipled")
    rgb = hex_linear(color) if isinstance(color, str) else tuple(color[:3])
    b.inputs["Base Color"].default_value = (*rgb, 1.0)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    m.diffuse_color = (*rgb, 1.0)
    return m


def _gltf_output():
    """The node group the glTF exporter reads extra maps from (Occlusion), created if missing."""
    g = bpy.data.node_groups.get("glTF Material Output")
    if g is None:
        g = bpy.data.node_groups.new("glTF Material Output", "ShaderNodeTree")
        g.interface.new_socket("Occlusion", in_out="INPUT", socket_type="NodeSocketFloat")
        g.interface.new_socket("Thickness", in_out="INPUT", socket_type="NodeSocketFloat")
    return g


def lib_maps(folder):
    """The map files of a downloaded PBR texture folder (Poly Haven, ambientCG): colour, arm
    (packed R occlusion, G roughness, B metal), ao, rough, metal, normal (OpenGL); None where
    the folder has no such map."""
    files = [f for f in glob.glob(os.path.join(folder, "*")) if f.lower().endswith((".png", ".jpg", ".jpeg", ".exr"))]

    def find(*keys, avoid=()):  # keys in order of preference, then files
        for k in keys:
            for f in files:
                n = os.path.basename(f).lower()
                if k in n and not any(a in n for a in avoid):
                    return f
        return None
    return {"color": find("color", "diff", "albedo", "basecolor", avoid=("normal",)),
            "arm": find("arm.", "_arm"),
            "ao": find("_ao", "ambientocclusion", "-ao", "occlusion"),
            "rough": find("rough"),
            "metal": find("metal"),
            "normal": find("normalgl", "nor_gl", "normal_gl", "_nor", "normal", avoid=("normaldx", "nor_dx", "_dx", "directx"))}


def library_material(name, folder, tint=None):
    """Principled material from a folder of downloaded PBR maps (Poly Haven, ambientCG): colour,
    roughness, metal, normal (OpenGL), occlusion - separate files or a packed arm map (R occlusion,
    G roughness, B metal). Wired the way the glTF exporter understands, so the game gets the same
    material: `tint` (hex) multiplies the colour texture and ships as the base colour factor;
    occlusion goes to the glTF occlusion slot, not into the colour. UVs in real size: uv_box."""
    maps = lib_maps(folder)
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = node_of(m, "ShaderNodeBsdfPrincipled")
    for n in [n for n in nt.nodes if n.bl_idname not in ("ShaderNodeBsdfPrincipled", "ShaderNodeOutputMaterial")]:
        nt.nodes.remove(n)  # a rebuild starts from a clean tree

    def tex(path, non_color):
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = bpy.data.images.load(path, check_existing=True)
        if non_color:
            t.image.colorspace_settings.is_data = True
        return t
    col, arm, ao, rough, metal, nor = (maps[k] for k in ("color", "arm", "ao", "rough", "metal", "normal"))
    if col:
        tc = tex(col, False)
        nt.nodes.active = tc  # Workbench texture mode and the viewport show the active image node
        out = tc.outputs["Color"]
        if tint:
            tm = nt.nodes.new("ShaderNodeMix")
            tm.data_type, tm.blend_type = 'RGBA', 'MULTIPLY'
            tm.inputs[0].default_value = 1.0
            nt.links.new(out, tm.inputs[6])
            tm.inputs[7].default_value = (*hex_linear(tint), 1.0)
            out = tm.outputs[2]
        nt.links.new(out, b.inputs["Base Color"])
    occ = None
    if arm:
        sep = nt.nodes.new("ShaderNodeSeparateColor")
        nt.links.new(tex(arm, True).outputs["Color"], sep.inputs["Color"])
        occ = sep.outputs[0]
        nt.links.new(sep.outputs[1], b.inputs["Roughness"])
        nt.links.new(sep.outputs[2], b.inputs["Metallic"])
    else:
        if rough:
            nt.links.new(tex(rough, True).outputs["Color"], b.inputs["Roughness"])
        if metal:
            nt.links.new(tex(metal, True).outputs["Color"], b.inputs["Metallic"])
        if ao:
            occ = tex(ao, True).outputs["Color"]
    if occ is not None:
        g = nt.nodes.new("ShaderNodeGroup")
        g.node_tree = _gltf_output()
        nt.links.new(occ, g.inputs["Occlusion"])
    if nor:
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nt.links.new(tex(nor, True).outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    return m


# MESH OBJECTS

def depsgraph_of(objs):
    """Evaluated depsgraph of the scene that holds the objects, which need not be the scene
    shown in the window."""
    o = objs[0] if objs else None
    sc = o.users_scene[0] if o is not None and o.users_scene else bpy.context.scene
    vl = sc.view_layers[0]
    vl.update()
    return vl.depsgraph


def obj_from_bm(name, bm, collection, materials=()):
    """Write a bmesh into object `name` (created or replaced) in `collection`; frees the bmesh."""
    bm.normal_update()
    o = bpy.data.objects.get(name)
    me = bpy.data.meshes.new(name + "_build")
    bm.to_mesh(me)
    bm.free()
    if o is None:
        o = bpy.data.objects.new(name, me)
    else:
        old = o.data
        o.data = me
        if old is not None and old.users == 0:
            bpy.data.meshes.remove(old)
    me.name = name  # stable names from build to build (glTF mesh names follow them)
    for m in materials:
        me.materials.append(m)
    if o.name not in collection.objects:
        collection.objects.link(o)
    return o


def ring(n, rx, ry=None, z=0.0, phase=0.0, cx=0.0, cy=0.0):
    """n points of an ellipse (or regular polygon: n=8 for an octagon) at height z."""
    ry = rx if ry is None else ry
    return [(cx + rx * math.cos(phase + 2 * math.pi * i / n), cy + ry * math.sin(phase + 2 * math.pi * i / n), z)
            for i in range(n)]


def loft(sections, closed=True, cap_start=True, cap_end=True, bm=None, mat_index=0):
    """Surface through cross-sections with equal point counts, quads between neighbours.
    The clean way to build anything whose section changes along its length: hulls, cabins,
    tapered towers, bottles, boats. Returns the bmesh."""
    bm = bm or bmesh.new()
    loops = [[bm.verts.new(p) for p in s] for s in sections]
    n = len(sections[0])
    for a, b in zip(loops, loops[1:]):
        for i in range(n if closed else n - 1):
            j = (i + 1) % n
            f = bm.faces.new((a[i], a[j], b[j], b[i]))
            f.material_index = mat_index
    if closed and cap_start:
        bm.faces.new(list(reversed(loops[0]))).material_index = mat_index
    if closed and cap_end:
        bm.faces.new(loops[-1]).material_index = mat_index
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def revolve(profile, segments=24, bm=None, mat_index=0):
    """Lathe: profile [(r, z), ...] from bottom to top around the Z axis. r = 0 at an end closes
    it to one pole vertex (a dome apex, a pointed tip) instead of coincident vertices."""
    bm = bm or bmesh.new()
    pole0, pole1 = profile[0][0] <= 1e-9, profile[-1][0] <= 1e-9
    body = profile[1 if pole0 else 0:len(profile) - 1 if pole1 else len(profile)]
    loops = [[bm.verts.new(p) for p in ring(segments, r, z=z)] for r, z in body]
    faces = []
    for a, b in zip(loops, loops[1:]):
        for i in range(segments):
            j = (i + 1) % segments
            faces.append(bm.faces.new((a[i], a[j], b[j], b[i])))
    for pole, loop, bottom in ((profile[0] if pole0 else None, loops[0], True), (profile[-1] if pole1 else None, loops[-1], False)):
        if pole is None:
            faces.append(bm.faces.new(list(reversed(loop)) if bottom else loop))
            continue
        v = bm.verts.new((0.0, 0.0, pole[1]))
        for i in range(segments):
            j = (i + 1) % segments
            faces.append(bm.faces.new((loop[j], loop[i], v) if bottom else (loop[i], loop[j], v)))
    for f in faces:
        f.material_index = mat_index
    bmesh.ops.recalc_face_normals(bm, faces=faces)
    return bm


_PLANES = {"XZ": (0, 2, 1), "YZ": (1, 2, 0), "XY": (0, 1, 2)}


def prism(outline, depth, plane="XZ", offset=0.0, bm=None, mat_index=0):
    """2D outline [(u, v), ...] extruded `depth` along the plane normal, centred on `offset`.
    For profiles read off a side view: frames, brackets, gables, cut boards."""
    bm = bm or bmesh.new()
    iu, iv, iw = _PLANES[plane]

    def P(u, v, w):
        p = [0.0, 0.0, 0.0]
        p[iu], p[iv], p[iw] = u, v, w
        return p
    lo = [bm.verts.new(P(u, v, offset - depth / 2)) for u, v in outline]
    hi = [bm.verts.new(P(u, v, offset + depth / 2)) for u, v in outline]
    n = len(outline)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((lo[i], lo[j], hi[j], hi[i])).material_index = mat_index
    bm.faces.new(list(reversed(lo))).material_index = mat_index
    bm.faces.new(hi).material_index = mat_index
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def cylinder(bm, p0, p1, r0, r1=None, segments=10, caps=True, mat_index=0, phase=0.0, cap_index=None):
    """Round piece from p0 to p1, radius r0 tapering to r1: logs, posts, poles, shafts, spars.
    Logs in a wall: 10-12 segments; thin rods: 6. `cap_index` gives the ends their own
    material (light end grain on logs); a pair (start, end) gives each end its own, so a log cut
    at a window keeps end grain only at the corner."""
    r1 = r0 if r1 is None else r1
    p0, p1 = Vector(p0), Vector(p1)
    ax = (p1 - p0).normalized()
    side = ax.cross(Vector((0, 0, 1)))
    if side.length < 1e-6:
        side = ax.cross(Vector((1, 0, 0)))
    side.normalize()
    up = side.cross(ax).normalized()

    def loop(c, r):
        return [bm.verts.new(c + (side * math.cos(phase + 2 * math.pi * i / segments)
                                  + up * math.sin(phase + 2 * math.pi * i / segments)) * r)
                for i in range(segments)]
    a, b = loop(p0, r0), loop(p1, r1)
    fs = []
    for i in range(segments):
        j = (i + 1) % segments
        fs.append(bm.faces.new((a[i], a[j], b[j], b[i])))
    for f in fs:
        f.material_index = mat_index
    if caps:
        ci = (mat_index, mat_index) if cap_index is None else \
            (tuple(cap_index) if isinstance(cap_index, (tuple, list)) else (cap_index, cap_index))
        for f, mi in ((bm.faces.new(list(reversed(a))), ci[0]), (bm.faces.new(b), ci[1])):
            f.material_index = mi
            fs.append(f)
    bmesh.ops.recalc_face_normals(bm, faces=fs)
    return fs


def box(bm, center, size, mat_index=0):
    cx, cy, cz = center
    sx, sy, sz = (s / 2 for s in size)
    return beam(bm, (cx, cy, cz - sz), (cx, cy, cz + sz), 2 * sx, 2 * sy, side=(1, 0, 0), mat_index=mat_index)


def beam(bm, p0, p1, w, h, side=None, mat_index=0):
    """Box of section w x h from p0 to p1: timbers, rails, spars, posts, lattice bars.
    `w` lies along `side` (default: horizontal, perpendicular to the beam)."""
    p0, p1 = Vector(p0), Vector(p1)
    ax = (p1 - p0).normalized()
    if side is None:
        side = ax.cross(Vector((0, 0, 1)))
        if side.length < 1e-6:
            side = Vector((1, 0, 0))
    s = (Vector(side) - ax * Vector(side).dot(ax)).normalized() * (w / 2)
    u = ax.cross(s).normalized() * (h / 2)
    c = [p0 - s - u, p0 + s - u, p0 + s + u, p0 - s + u]
    vs = [bm.verts.new(v) for v in c] + [bm.verts.new(v + (p1 - p0)) for v in c]
    faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    out = []
    for f in faces:
        face = bm.faces.new([vs[i] for i in f])
        face.material_index = mat_index
        out.append(face)
    bmesh.ops.recalc_face_normals(bm, faces=out)
    return out


def boards(bm, quad, count, gap, thickness, along="v", inset=0.0, mat_index=0, jitter=0.0, seed=0):
    """Separate boards with real thickness and gaps over a (possibly tapered) quad
    (p00, p10, p11, p01): wall cladding, roof planks, floors, doors, sail slats. Boards run
    along `along` ('u' = p00->p10, 'v' = p00->p01) and are pushed out along the quad normal.
    `jitter` thickens each board by up to that many metres so planks do not read as one flat
    sheet; the back of every board stays on the quad, so boards keep resting on what is behind."""
    import random
    rnd = random.Random(seed)
    p00, p10, p11, p01 = (Vector(p) for p in quad)

    def at(s, t):  # bilinear: s along u, t along v
        return (p00 * (1 - s) + p10 * s) * (1 - t) + (p01 * (1 - s) + p11 * s) * t
    n = (p10 - p00).cross(p01 - p00).normalized()
    width_dir = (p10 - p00) if along == "v" else (p01 - p00)
    total = width_dir.length
    g = gap / total if total else 0.0
    w = (1.0 - g * (count - 1) - 2 * inset / total) / count
    out = []
    for k in range(count):
        a = inset / total + k * (w + g)
        b = a + w
        corners = [(a, 0), (b, 0), (b, 1), (a, 1)] if along == "v" else [(0, a), (1, a), (1, b), (0, b)]
        base = [at(s, t) for s, t in corners]
        t = thickness + (rnd.uniform(0, jitter) if jitter else 0.0)
        lo = [bm.verts.new(p) for p in base]
        hi = [bm.verts.new(p + n * t) for p in base]
        fs = [bm.faces.new(list(reversed(lo))), bm.faces.new(hi)]
        for i in range(4):
            j = (i + 1) % 4
            fs.append(bm.faces.new((lo[i], lo[j], hi[j], hi[i])))
        for f in fs:
            f.material_index = mat_index
        bmesh.ops.recalc_face_normals(bm, faces=fs)
        out.extend(fs)
    return out


# FINISHING: limited bevel + weighted normals

def add_bevel(obj, width=0.01, segments=2, limit='ANGLE', angle_deg=30):
    """Non-destructive rounding of sharp edges only. Small width (it is the radius; big reads
    toy-like), 2-3 segments, limited by angle or by bevel weight, never on everything. Keep it a
    modifier until the export copy; booleans come before it."""
    o = bpy.data.objects[obj] if isinstance(obj, str) else obj
    m = o.modifiers.get("Bevel") or o.modifiers.new("Bevel", 'BEVEL')
    m.width = width
    m.segments = segments
    m.limit_method = limit
    if limit == 'ANGLE':
        m.angle_limit = math.radians(angle_deg)
    m.harden_normals = True
    m.use_clamp_overlap = True
    return m.name


def finish_shading(obj, angle_deg=30):
    """Shade smooth, mark sharp edges by angle on the mesh (Blender 4.1+ has no auto-smooth),
    then a Weighted Normal modifier after the bevel so flats stay crisp and only bevels round."""
    o = bpy.data.objects[obj] if isinstance(obj, str) else obj
    for p in o.data.polygons:
        p.use_smooth = True
    thr = math.radians(angle_deg)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    for e in bm.edges:
        e.smooth = not (len(e.link_faces) == 2 and e.calc_face_angle(0.0) > thr)
    bm.to_mesh(o.data)
    o.data.update()
    bm.free()
    if "WeightedNormal" not in o.modifiers:
        wn = o.modifiers.new("WeightedNormal", 'WEIGHTED_NORMAL')
        wn.keep_sharp = True
    return "WeightedNormal"


def uv_box(obj, tile=1.0):
    """Box-projected UVs in world metres: one texture repeat per `tile` metres on every face,
    so library materials keep their real size on every part."""
    o = bpy.data.objects[obj] if isinstance(obj, str) else obj
    mw = o.matrix_world
    nmat = mw.to_3x3().inverted().transposed()
    bm = bmesh.new()
    bm.from_mesh(o.data)
    uv = bm.loops.layers.uv.get("UVMap") or bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        n = (nmat @ f.normal).normalized()
        ax = max(range(3), key=lambda i: abs(n[i]))
        a, b = [(1, 2), (0, 2), (0, 1)][ax]
        for l in f.loops:
            w = mw @ l.vert.co
            l[uv].uv = (w[a] / tile, w[b] / tile)
    bm.to_mesh(o.data)
    o.data.update()
    bm.free()


# EXPORT

def export_copy(objs, name, collection):
    """One mesh with every modifier applied, in world space, materials merged: the copy that
    ships. The master objects stay non-destructive."""
    dg = depsgraph_of(objs)
    bm = bmesh.new()
    mats = []
    for o in objs:
        eo = o.evaluated_get(dg)
        me = bpy.data.meshes.new_from_object(eo, depsgraph=dg)
        me.transform(o.matrix_world)
        if o.matrix_world.determinant() < 0:
            me.flip_normals()  # transform() turns a mirrored object inside out
        remap = []
        for m in me.materials:
            if m not in mats:
                mats.append(m)
            remap.append(mats.index(m))
        if not remap:  # a part without materials keeps an empty slot, not a neighbour's material
            if None not in mats:
                mats.append(None)
            remap = [mats.index(None)]
        tmp = bmesh.new()
        tmp.from_mesh(me)
        for f in tmp.faces:
            f.material_index = remap[min(f.material_index, len(remap) - 1)]
        tmp_me = bpy.data.meshes.new("_tmp")
        tmp.to_mesh(tmp_me)
        tmp.free()
        bm.from_mesh(tmp_me)
        bpy.data.meshes.remove(tmp_me)
        bpy.data.meshes.remove(me)
    return obj_from_bm(name, bm, collection, mats)


def export_glb(obj, path, scene, vertex_color="ACTIVE"):
    """GLB of one object through a temporary scene, so selection and other scenes stay
    untouched. Use the project's own exporter when it has one.

    vertex_color: 'ACTIVE' (the active colour attribute ships as COLOR_0, nothing when the mesh
    has none) or 'NONE' (a baked asset: its colour is in the texture). Never the exporter's
    default 'MATERIAL': unless the
    material multiplies a Color Attribute node into its colour, it writes a white COLOR_0 and
    moves the real colours to COLOR_1, which engines that read only COLOR_0 never see."""
    win = bpy.context.window
    shown = win.scene if win else None
    tmp = bpy.data.scenes.new("_bm_export")
    try:
        tmp.collection.objects.link(obj)
        with bpy.context.temp_override(scene=tmp, view_layer=tmp.view_layers[0]):
            bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_active_scene=True,
                                      export_apply=True, export_yup=True,
                                      export_vertex_color=vertex_color, export_all_vertex_colors=False)
    finally:
        bpy.data.scenes.remove(tmp)
        if shown is not None:
            win.scene = shown  # the exporter leaves the window on another scene
    return path
