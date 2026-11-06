# Review renders, all on Workbench (seconds, light on a small GPU): clay or material views
# from fixed directions, the compare sheet reference | clay | overlay from the reference's own
# frame, close-ups of joints, the game-camera view at real on-screen size, contact sheets.
# Rendering goes through the asset's scene; settings are restored afterwards.

import bpy, math, os
import numpy as np
from mathutils import Vector

_RENDERABLE = {'MESH', 'CURVE', 'SURFACE', 'META', 'FONT', 'CURVES', 'POINTCLOUD', 'VOLUME', 'GREASEPENCIL'}

_DIRS = {  # azimuth, elevation (deg); azimuth 0 = from -Y (the front), 90 = from +X
    "front": (0, 0), "right": (90, 0), "back": (180, 0), "left": (270, 0), "top": (0, 90),
    "threequarter": (-35, 25), "threequarter_back": (145, 25), "threequarter_right": (35, 25),
}


def _dirv(az, el):
    az, el = math.radians(az), math.radians(el)
    return Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))


def _corners(objs):
    dg = depsgraph_of(objs)
    pts = np.concatenate([_world_mesh(o, dg)[0] for o in objs])
    lo, hi = pts.min(0), pts.max(0)
    return [Vector((x, y, z)) for x in (lo[0], hi[0]) for y in (lo[1], hi[1]) for z in (lo[2], hi[2])], Vector((lo + hi) / 2)


def aim(scene, objs, dirv, size, lens=0, margin=1.08, center=None):
    """Camera looking along -dirv that fits the objects' bounds into `size`; lens 0 = ortho."""
    corners, c = _corners(objs)
    c = center or c
    cam = _camera(scene, "BM_REVIEW_CAM")
    q = (-dirv).to_track_quat("-Z", "Y")
    cam.rotation_mode = 'QUATERNION'
    cam.rotation_quaternion = q
    R = q.to_matrix()
    xa, ya = R @ Vector((1, 0, 0)), R @ Vector((0, 1, 0))
    lat = [((p - c).dot(xa), (p - c).dot(ya), (p - c).dot(dirv)) for p in corners]
    mx, my, md = max(abs(v[0]) for v in lat), max(abs(v[1]) for v in lat), max(v[2] for v in lat)
    asp = size[0] / size[1]
    cd = cam.data
    cd.sensor_fit = 'HORIZONTAL'
    cd.sensor_width = 36.0
    if not lens:
        cd.type = 'ORTHO'
        cd.ortho_scale = max(mx * 2, my * 2 * asp) * margin
        d = md + max(mx, my, 1.0) * 4
    else:
        cd.type = 'PERSP'
        cd.lens = lens
        th, tv = math.atan(18.0 / lens), math.atan((18.0 / asp) / lens)
        d = max(max(v[2] + abs(v[0]) * margin / math.tan(th), v[2] + abs(v[1]) * margin / math.tan(tv)) for v in lat)
    cam.location = c + dirv * d
    cd.clip_start = 0.01
    cd.clip_end = max(1000.0, d * 4)
    return cam


def render_objs(scene, objs, cam, size, path, mode="clay"):
    """Render only `objs` from `cam` at `size` into `path` (PNG, transparent background).
    mode: clay (grey, studio light, cavity, outline), material (object colours and textures),
    silhouette (flat white), albedo (the active image texture without light: the colour the
    game gets before lighting), id (each material's viewport colour, flat, no anti-aliasing).
    material, albedo and id render with the Standard view transform, so pixel values are the
    colours themselves, not a film look."""
    r, sh, vs, disp = scene.render, scene.display.shading, scene.view_settings, scene.display
    keep = dict(engine=r.engine, x=r.resolution_x, y=r.resolution_y, pct=r.resolution_percentage,
                film=r.film_transparent, fp=r.filepath, ff=r.image_settings.file_format,
                cm=r.image_settings.color_mode, cam=scene.camera, cavt=sh.cavity_type,
                light=sh.light, ctype=sh.color_type, col=tuple(sh.single_color), cav=sh.show_cavity,
                sha=sh.show_shadows, out=sh.show_object_outline, xray=sh.show_xray,
                vt=vs.view_transform, look=vs.look, ex=vs.exposure, gam=vs.gamma,
                curve=vs.use_curve_mapping, aa=disp.render_aa)
    hide = {o.name: o.hide_render for o in scene.objects}
    names = {o.name for o in objs}
    try:
        r.engine = 'BLENDER_WORKBENCH'
        r.resolution_x, r.resolution_y, r.resolution_percentage = size[0], size[1], 100
        r.film_transparent = True
        r.image_settings.file_format = 'PNG'
        r.image_settings.color_mode = 'RGBA'
        r.filepath = path
        sh.show_xray = False
        if mode in ("material", "albedo", "id"):
            vs.view_transform, vs.look = 'Standard', 'None'
            vs.exposure, vs.gamma, vs.use_curve_mapping = 0.0, 1.0, False
        if mode == "silhouette":
            sh.light, sh.color_type, sh.single_color = 'FLAT', 'SINGLE', (1, 1, 1)
            sh.show_cavity = sh.show_shadows = sh.show_object_outline = False
        elif mode in ("albedo", "id"):
            sh.light, sh.color_type = 'FLAT', ('TEXTURE' if mode == "albedo" else 'MATERIAL')
            sh.show_cavity = sh.show_shadows = sh.show_object_outline = False
            if mode == "id":
                disp.render_aa = 'OFF'
        else:
            sh.light = 'STUDIO'
            sh.color_type = 'TEXTURE' if mode == "material" else 'SINGLE'
            sh.single_color = (0.62, 0.62, 0.6)
            sh.show_cavity, sh.cavity_type = True, 'BOTH'
            sh.show_shadows = mode != "material"
            sh.show_object_outline = True
        for o in scene.objects:
            if o.type in _RENDERABLE:  # curves and text too, not only meshes
                o.hide_render = o.name not in names
        scene.camera = cam
        bpy.ops.render.render(write_still=True, scene=scene.name)
    finally:
        r.engine, r.resolution_x, r.resolution_y = keep["engine"], keep["x"], keep["y"]
        r.resolution_percentage, r.film_transparent, r.filepath = keep["pct"], keep["film"], keep["fp"]
        r.image_settings.file_format, r.image_settings.color_mode = keep["ff"], keep["cm"]
        scene.camera = keep["cam"]
        sh.light, sh.color_type, sh.single_color = keep["light"], keep["ctype"], keep["col"]
        sh.show_cavity, sh.show_shadows, sh.show_object_outline = keep["cav"], keep["sha"], keep["out"]
        sh.cavity_type = keep["cavt"]
        sh.show_xray = keep["xray"]
        vs.view_transform, vs.look, disp.render_aa = keep["vt"], keep["look"], keep["aa"]
        vs.exposure, vs.gamma, vs.use_curve_mapping = keep["ex"], keep["gam"], keep["curve"]
        for n, v in hide.items():
            o = scene.objects.get(n)
            if o:
                o.hide_render = v
    return path


def views(scene, names, out_dir, mode="clay", which=("front", "right", "back", "threequarter", "threequarter_back", "top"),
          px=640, sheet_name=None):
    """Clay (or material) renders from fixed directions plus one contact sheet."""
    objs = objs_of(names)
    os.makedirs(out_dir, exist_ok=True)
    paths = []
    for v in which:
        az, el = _DIRS[v]
        cam = aim(scene, objs, _dirv(az, el), (px, px), lens=0 if el in (0, 90) else 50)
        paths.append(render_objs(scene, objs, cam, (px, px), os.path.join(out_dir, f"{mode}_{v}.png"), mode))
    return {"views": paths, "sheet": sheet(paths, os.path.join(out_dir, sheet_name or f"{mode}_sheet.png"), cols=3)}


def compare(scene, names, view_empty, out_dir, long_px=900):
    """reference | clay render | overlay, all in the reference image's own frame: the one
    picture to read after every phase."""
    e = bpy.data.objects[view_empty]
    objs = objs_of(names)
    cam, (w, h) = frame_camera(scene, e, long_px)
    os.makedirs(out_dir, exist_ok=True)
    clay = load_rgba(render_objs(scene, objs, cam, (w, h), os.path.join(out_dir, f"clay_{e['bm_view']}.png"), "clay"))
    ref = resize_nearest(load_rgba(e["bm_image"]), w, h)
    grey = np.array([0.43, 0.43, 0.43], np.float32)
    clay_rgb = clay[..., :3] * clay[..., 3:] + grey * (1 - clay[..., 3:])
    over = ref[..., :3] * 0.5 + clay_rgb * 0.5
    over[clay[..., 3] > 0.5] = over[clay[..., 3] > 0.5] * 0.6 + np.array([0.9, 0.3, 0.1]) * 0.4
    gut = np.full((h, 8, 3), 0.15, np.float32)
    img = np.concatenate([ref[..., :3], gut, clay_rgb, gut, over], 1)
    return save_rgba(img.astype(np.float32), os.path.join(out_dir, f"compare_{e['bm_view']}.png"))


def closeups(scene, names, targets, out_dir, size=1.0, px=420):
    """Two close renders (3/4 from either side) of every target: an object name or a world
    point. Joints, seams, where a part meets another: where floating and intersecting parts
    show, invisible at full frame."""
    objs = objs_of(names)
    os.makedirs(out_dir, exist_ok=True)
    paths = []
    for k, t in enumerate(targets):
        if isinstance(t, str):
            o = bpy.data.objects[t]
            c, label = sum((o.matrix_world @ Vector(b) for b in o.bound_box), Vector()) / 8, t
        else:
            c, label = Vector(t), f"p{k}"
        for side, az in (("a", -40), ("b", 140)):
            d = _dirv(az, 30)
            cam = _camera(scene, "BM_REVIEW_CAM")
            cam.rotation_mode = 'QUATERNION'
            cam.rotation_quaternion = (-d).to_track_quat("-Z", "Y")
            cam.data.type, cam.data.lens = 'PERSP', 50
            cam.data.sensor_fit, cam.data.sensor_width = 'HORIZONTAL', 36.0
            dist = size * 50 / 36 * 1.2
            cam.location = c + d * dist
            # clip to a slab around the target so the parts in front of a joint do not hide it
            cam.data.clip_start, cam.data.clip_end = max(0.01, dist - size), dist + size
            paths.append(render_objs(scene, objs, cam, (px, px), os.path.join(out_dir, f"close_{label}_{side}.png"), "clay"))
    return {"closeups": paths, "sheet": sheet(paths, os.path.join(out_dir, "closeups.png"), cols=4)}


def game_view(scene, names, out_dir, elev=55, az=-35, px_per_m=6.75, upscale=4, mode="material"):
    """The model as the game shows it: from the game camera's angle at the real number of
    pixels per metre, then enlarged with hard pixels so it can be read. What does not read
    here does not exist for the player."""
    objs = objs_of(names)
    corners, c = _corners(objs)
    d = _dirv(az, elev)
    span = max((p - c).length for p in corners) * 2.1
    n = max(16, int(round(span * px_per_m)))
    cam = aim(scene, objs, d, (n, n), lens=0)
    cam.data.ortho_scale = n / px_per_m
    os.makedirs(out_dir, exist_ok=True)
    small = render_objs(scene, objs, cam, (n, n), os.path.join(out_dir, "game_actual.png"), mode)
    a = load_rgba(small)
    big = np.repeat(np.repeat(a, upscale, 0), upscale, 1)
    grey = np.array([0.43, 0.43, 0.43], np.float32)
    big[..., :3] = big[..., :3] * big[..., 3:] + grey * (1 - big[..., 3:])
    big[..., 3] = 1
    return {"actual": small, "enlarged": save_rgba(big, os.path.join(out_dir, "game_enlarged.png")), "px": n}


def _tint(h):
    """A light colour scaled to luminance 1, so a tint changes the hue, not the strength."""
    c = np.array(hex_linear(h))
    return c / max(1e-6, float(c @ np.array([0.2126, 0.7152, 0.0722])))


def beauty(scene, names, out, az=-35, el=22, px=(1280, 960), lens=50, sun_az=-35, sun_el=48,
           sky="#c9d3dc", ground="#8f8a80", samples=16, light=None, px_per_m=None):
    """The picture for the owner: EEVEE with real materials, a sun and sky light, a ground
    plane for contact shadows. Light settings for a small GPU (few samples, no ray tracing,
    half-size shadows); all settings and the temporary lights are removed afterwards.

    light: the game's own light (LIGHT in dims.py), so the picture shows what the engine shows:
    {"sun_az", "sun_el" (Blender directions, as _dirv), "sun": the sun's share of white light on
    a surface facing it, "sky": the sky's share on a surface facing up, "sun_color", "sky_color",
    "ground"} - a sky hemisphere above, black below, Standard view transform. Without it a
    studio-like sun of 4 and sky of 0.9, which is far harsher than a soft game light.
    px_per_m: an orthographic camera at the game's on-screen scale (a game-size picture)."""
    objs = objs_of(names)
    r, ee, vs = scene.render, scene.eevee, scene.view_settings
    keep = dict(engine=r.engine, x=r.resolution_x, y=r.resolution_y, pct=r.resolution_percentage,
                film=r.film_transparent, fp=r.filepath, ff=r.image_settings.file_format, cam=scene.camera,
                world=scene.world, vt=vs.view_transform, look=vs.look, ex=vs.exposure, gam=vs.gamma,
                curve=vs.use_curve_mapping)
    keep_ee = {k: getattr(ee, k) for k in ("taa_render_samples", "use_raytracing", "shadow_resolution_scale") if hasattr(ee, k)}
    hide = {o.name: o.hide_render for o in scene.objects}
    names_set = {o.name for o in objs}
    made, w = [], None
    try:
        if px_per_m:
            corners, c = _corners(objs)
            n = max(16, int(round(max((p - c).length for p in corners) * 2.1 * px_per_m)))
            px = (n, n)
            cam = aim(scene, objs, _dirv(az, el), px, lens=0)
            cam.data.ortho_scale = n / px_per_m
        else:
            cam = aim(scene, objs, _dirv(az, el), px, lens=lens, margin=1.12)
        sun = bpy.data.objects.new("BM_SUN", bpy.data.lights.new("BM_SUN", 'SUN'))
        sun.data.energy = 4.0
        sun.data.angle = math.radians(2)
        if light:
            sun_az, sun_el = light.get("sun_az", sun_az), light.get("sun_el", sun_el)
            t = _tint(light.get("sun_color", "#ffffff"))
            sun.data.color = tuple(t / t.max())
            sun.data.energy = light.get("sun", 0.6) * math.pi * float(t.max())  # radiance = share x albedo
            ground = light.get("ground", ground)
        sun.rotation_mode = 'QUATERNION'
        sun.rotation_quaternion = (-_dirv(sun_az, sun_el)).to_track_quat("-Z", "Y")  # shines from (sun_az, sun_el)
        scene.collection.objects.link(sun)
        made.append(sun)
        corners, c = _corners(objs)
        span = max((p - c).length for p in corners) * 6
        gbm = bmesh.new()
        box(gbm, (c.x, c.y, -0.005), (span, span, 0.01))
        gmat = mat("bm_ground", ground, 0.95)
        g = obj_from_bm("BM_GROUND", gbm, scene.collection, [gmat])
        made.append(g)
        w = bpy.data.worlds.new("BM_SKY")
        w.use_nodes = True
        bg = node_of(w, "ShaderNodeBackground")
        if light:  # a sky hemisphere: the engine's sky term lights upward faces, not downward ones
            nt = w.node_tree
            tc = nt.nodes.new("ShaderNodeTexCoord")
            sep = nt.nodes.new("ShaderNodeSeparateXYZ")
            nt.links.new(tc.outputs["Generated"], sep.inputs["Vector"])
            up = nt.nodes.new("ShaderNodeMapRange")
            nt.links.new(sep.outputs["Z"], up.inputs["Value"])
            up.inputs["From Min"].default_value, up.inputs["From Max"].default_value = -0.02, 0.02
            mx = nt.nodes.new("ShaderNodeMix")
            mx.data_type = 'RGBA'
            nt.links.new(up.outputs["Result"], mx.inputs[0])
            mx.inputs[6].default_value = (0.0, 0.0, 0.0, 1.0)
            mx.inputs[7].default_value = (*(_tint(light.get("sky_color", "#ffffff")) * light.get("sky", 0.5)), 1.0)
            # the camera looks down past the ground's edge into the black lower half: it sees the
            # sky colour instead, while the light stays the engine's hemisphere
            lp = nt.nodes.new("ShaderNodeLightPath")
            seen = nt.nodes.new("ShaderNodeMix")
            seen.data_type = 'RGBA'
            nt.links.new(lp.outputs["Is Camera Ray"], seen.inputs[0])
            nt.links.new(mx.outputs[2], seen.inputs[6])
            seen.inputs[7].default_value = (*hex_linear(sky), 1.0)
            nt.links.new(seen.outputs[2], bg.inputs["Color"])
            bg.inputs["Strength"].default_value = 1.0
            vs.view_transform, vs.look, vs.exposure, vs.gamma = 'Standard', 'None', 0.0, 1.0
            vs.use_curve_mapping = False
        else:
            bg.inputs["Color"].default_value = (*hex_linear(sky), 1.0)
            bg.inputs["Strength"].default_value = 0.9
        scene.world = w
        for o in scene.objects:
            if o.type in _RENDERABLE:
                o.hide_render = o.name not in names_set and o is not g
        r.engine = 'BLENDER_EEVEE'
        if "taa_render_samples" in keep_ee:
            ee.taa_render_samples = samples
        if "use_raytracing" in keep_ee:
            ee.use_raytracing = False
        if "shadow_resolution_scale" in keep_ee:
            ee.shadow_resolution_scale = 0.5
        r.resolution_x, r.resolution_y, r.resolution_percentage = px[0], px[1], 100
        r.film_transparent = False
        r.image_settings.file_format = 'PNG'
        r.filepath = out
        scene.camera = cam
        bpy.ops.render.render(write_still=True, scene=scene.name)
    finally:
        r.engine, r.resolution_x, r.resolution_y = keep["engine"], keep["x"], keep["y"]
        r.resolution_percentage, r.film_transparent, r.filepath = keep["pct"], keep["film"], keep["fp"]
        r.image_settings.file_format, scene.camera, scene.world = keep["ff"], keep["cam"], keep["world"]
        vs.view_transform, vs.look, vs.exposure, vs.gamma = keep["vt"], keep["look"], keep["ex"], keep["gam"]
        vs.use_curve_mapping = keep["curve"]
        for k, v in keep_ee.items():
            setattr(ee, k, v)
        for n, v in hide.items():
            o = scene.objects.get(n)
            if o:
                o.hide_render = v
        for o in made:
            data = o.data
            bpy.data.objects.remove(o, do_unlink=True)
            if isinstance(data, bpy.types.Light):
                bpy.data.lights.remove(data)
            elif isinstance(data, bpy.types.Mesh) and data.users == 0:
                bpy.data.meshes.remove(data)
        if w is not None and w.users == 0:
            bpy.data.worlds.remove(w)
    return out


def sheet(paths, out, cols=3, gutter=8):
    """Tile images (top-left first) on a dark background, transparent pixels on grey."""
    ims = [load_rgba(p) for p in paths]
    h = max(i.shape[0] for i in ims)
    w = max(i.shape[1] for i in ims)
    rows = math.ceil(len(ims) / cols)
    S = np.full((rows * h + (rows + 1) * gutter, cols * w + (cols + 1) * gutter, 4), 0.12, np.float32)
    S[..., 3] = 1
    grey = np.array([0.43, 0.43, 0.43], np.float32)
    for k, im in enumerate(ims):
        r, c = divmod(k, cols)
        y, x = gutter + r * (h + gutter), gutter + c * (w + gutter)
        rgb = im[..., :3] * im[..., 3:] + grey * (1 - im[..., 3:])
        S[y:y + im.shape[0], x:x + im.shape[1], :3] = rgb
    return save_rgba(S, out)
