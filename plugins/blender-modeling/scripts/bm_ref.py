# References in the scene at true scale: silhouette masks from reference images, image planes
# per orthographic view, a metre ruler, and the camera that sees a view exactly as its image.
# Everything runs inside Blender's own Python (numpy is bundled; there is no Pillow).

import bpy, bmesh, math, os
import numpy as np
from mathutils import Vector, Matrix, Euler

# view: Euler XYZ (deg), image right, image up, normal toward the viewer. Named like Blender's
# numpad views, by where the viewer stands: "front" looks from -Y, "right" from +X with the
# asset's front (-Y) at the image's left - for an asset facing -Y that is its own LEFT side.
VIEWS = {
    "front": ((90, 0, 0), (1, 0, 0), (0, 0, 1), (0, -1, 0)),
    "back": ((90, 0, 180), (-1, 0, 0), (0, 0, 1), (0, 1, 0)),
    "right": ((90, 0, 90), (0, 1, 0), (0, 0, 1), (1, 0, 0)),
    "left": ((90, 0, -90), (0, -1, 0), (0, 0, 1), (-1, 0, 0)),
    "top": ((0, 0, 0), (1, 0, 0), (0, 1, 0), (0, 0, 1)),
}


# IMAGES AS ARRAYS (top-down rows, RGBA floats)

def load_rgba(path):
    img = bpy.data.images.load(path, check_existing=False)
    w, h = img.size
    a = np.empty(w * h * 4, np.float32)
    img.pixels.foreach_get(a)
    a = a.reshape(h, w, 4)[::-1].copy()
    bpy.data.images.remove(img)
    return a


def save_rgba(arr, path):
    h, w = arr.shape[:2]
    if arr.shape[2] == 3:
        arr = np.concatenate([arr, np.ones((h, w, 1), np.float32)], 2)
    img = bpy.data.images.new("_bm_save", width=w, height=h, alpha=True)
    img.pixels.foreach_set(np.ascontiguousarray(arr[::-1], dtype=np.float32).ravel())
    img.filepath_raw = path
    img.file_format = 'PNG'
    img.save()
    bpy.data.images.remove(img)
    return path


def resize_nearest(arr, w, h):
    ys = (np.arange(h) * arr.shape[0] / h).astype(int)
    xs = (np.arange(w) * arr.shape[1] / w).astype(int)
    return arr[ys][:, xs]


def _shift(m, dy, dx):
    out = np.zeros_like(m)
    h, w = m.shape
    out[max(dy, 0):h + min(dy, 0), max(dx, 0):w + min(dx, 0)] = m[max(-dy, 0):h + min(-dy, 0), max(-dx, 0):w + min(-dx, 0)]
    return out


def fill_holes(mask):
    """Fill every region of `mask == False` that does not reach the image border: the outer
    silhouette. Applied to both the reference and the render, so see-through gaps (lattice,
    windows) count the same on both sides."""
    free = ~mask
    reach = np.zeros_like(mask)
    reach[0, :], reach[-1, :], reach[:, 0], reach[:, -1] = free[0, :], free[-1, :], free[:, 0], free[:, -1]
    while True:
        grown = reach | _shift(reach, 1, 0) | _shift(reach, -1, 0) | _shift(reach, 0, 1) | _shift(reach, 0, -1)
        grown &= free
        if (grown == reach).all():
            break
        reach = grown
    return ~reach


def make_mask(path, tol=0.12, holes=False):
    """Silhouette of the subject in a reference image: alpha when the image has it, otherwise
    everything that differs from the border colour by more than `tol`. Returns a bool array
    (top-down). A busy or shaded background breaks this: crop and clean the image first."""
    a = load_rgba(path)
    if a[..., 3].min() < 0.98:
        m = a[..., 3] > 0.5
    else:
        b = np.concatenate([a[:4].reshape(-1, 4), a[-4:].reshape(-1, 4), a[:, :4].reshape(-1, 4), a[:, -4:].reshape(-1, 4)])
        bg = np.median(b[:, :3], 0)
        m = np.abs(a[..., :3] - bg).max(2) > tol
    return m if holes else fill_holes(m)


def bbox_px(mask):
    ys, xs = np.nonzero(mask)
    if not len(xs):
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def save_mask(mask, path):
    v = np.where(mask, 0.0, 1.0).astype(np.float32)
    return save_rgba(np.stack([v, v, v, np.ones_like(v)], 2), path)


# REFERENCE PLANES

def add_ref_view(scene, name, image_path, view, real=None, measure="height", anchor="base",
                 ppm=None, anchor_px=None, depth=None, opacity=0.6, tol=0.12, mask_dir=None):
    """Put one orthographic reference image into the scene at true scale.

    Scale, one of:
      real   real size of the subject in metres along `measure` ('height' or 'width' of the
             subject's silhouette in this image), from the brief;
      ppm    image pixels per metre measured on a feature of known size (a door, a log, a
             wheel) - use it when the silhouette includes parts of unknown size (sails, a pole).
    Origin, one of:
      anchor 'base'   centre of the silhouette's lowest 4% (the footprint: right for buildings
                      and vehicles even when sails or poles stick out sideways),
             'bottom' bottom centre of the bounding box, 'center' its centre (top view);
      anchor_px (x, y) image pixel of the point that is the world origin.
    The empty stands `depth` metres behind the model so it never hides it. Its custom
    properties hold the frame (bm_w, bm_h, bm_cx/cy/cz) and the mask path, which the
    silhouette gate and the compare sheet use to see this view exactly as the image."""
    rot, ex, ey, n = VIEWS[view]
    ex, ey, n = Vector(ex), Vector(ey), Vector(n)
    mask = make_mask(image_path, tol)
    H, W = mask.shape
    bb = bbox_px(mask)
    if bb is None:
        raise ValueError(f"{image_path}: empty silhouette - the subject was not separated from the background (tol={tol})")
    x0, y0, x1, y1 = bb
    if ppm is None:
        ppm = (y1 - y0) / real if measure == "height" else (x1 - x0) / real
    if anchor_px is not None:
        ax, ay = anchor_px
    elif anchor == "base":
        band = mask[max(y0, y1 - max(2, int(0.04 * (y1 - y0)))):y1]
        xs = np.nonzero(band.any(0))[0]
        ax, ay = (xs.min() + xs.max() + 1) / 2, y1
    else:
        ax = (x0 + x1) / 2
        ay = y1 if anchor == "bottom" else (y0 + y1) / 2
    du = (W / 2 - ax) / ppm
    dv = (ay - H / 2) / ppm
    frame_c = ex * du + ey * dv
    Ww, Wh = W / ppm, H / ppm
    if depth is None:
        depth = max(Ww, Wh) * 0.75
    mask_dir = mask_dir or os.path.dirname(image_path)
    mask_path = os.path.join(mask_dir, f"mask_{view}.png")
    save_mask(mask, mask_path)

    e = bpy.data.objects.get(name) or bpy.data.objects.new(name, None)
    e.empty_display_type = 'IMAGE'
    e.data = bpy.data.images.load(image_path, check_existing=True)
    e.empty_display_size = max(Ww, Wh)
    e.empty_image_offset = (-0.5, -0.5)
    e.use_empty_image_alpha = True
    e.color[3] = opacity
    e.rotation_euler = Euler(tuple(math.radians(r) for r in rot), 'XYZ')
    e.location = frame_c - n * depth
    e.hide_select = True
    e["bm_view"], e["bm_ppm"], e["bm_w"], e["bm_h"] = view, ppm, Ww, Wh
    e["bm_cx"], e["bm_cy"], e["bm_cz"] = frame_c
    e["bm_image"], e["bm_mask"] = image_path, mask_path
    e["bm_anchor"] = anchor
    from_coll = [c for c in e.users_collection]
    ref = coll(scene, "REF")
    if ref not in from_coll:
        ref.objects.link(e)
    return {"empty": e.name, "view": view, "ppm": round(ppm, 2), "image_m": [round(Ww, 3), round(Wh, 3)],
            "subject_px": [x0, y0, x1, y1], "mask": mask_path}


def add_ruler(scene, height, x=None, step=1.0, width=0.04):
    """Vertical bar `height` metres tall with a tick every `step` metres, beside the model."""
    bm = bmesh.new()
    x = (height * 0.4) if x is None else x
    box(bm, (x, 0, height / 2), (width, width, height))
    k = 1
    while k * step <= height + 1e-6:
        box(bm, (x + width * 2, 0, k * step), (width * 3, width, width / 2))
        k += 1
    return obj_from_bm(f"{scene.name}_ruler", bm, coll(scene, "REF"), [mat("bm_ruler", "#e0402a", 0.5)])


# THE CAMERA THAT SEES A VIEW EXACTLY AS ITS IMAGE

def frame_camera(scene, empty, long_px=1024):
    """Orthographic camera whose frame equals the reference image's frame. Returns the camera
    object (linked to `scene`; the scene's own camera is left as it was - render_objs sets and
    restores it) and the render size (w, h)."""
    e = bpy.data.objects[empty] if isinstance(empty, str) else empty
    rot, ex, ey, n = VIEWS[e["bm_view"]]
    ex, ey, n = Vector(ex), Vector(ey), Vector(n)
    Ww, Wh = e["bm_w"], e["bm_h"]
    c = Vector((e["bm_cx"], e["bm_cy"], e["bm_cz"]))
    s = long_px / max(Ww, Wh)
    w, h = max(8, round(Ww * s)), max(8, round(Wh * s))
    cam = _camera(scene, "BM_FRAME_CAM")
    cam.data.type = 'ORTHO'
    cam.data.sensor_fit = 'HORIZONTAL'
    cam.data.ortho_scale = Ww
    dist = max(Ww, Wh) * 4 + 10
    cam.data.clip_start = 0.01
    cam.data.clip_end = dist * 3
    cam.matrix_world = Matrix.Translation(c + n * dist) @ Matrix((ex, ey, n)).transposed().to_4x4()
    return cam, (w, h)


def _camera(scene, name):
    cam = bpy.data.objects.get(name)
    if cam is None:
        cam = bpy.data.objects.new(name, bpy.data.cameras.new(name))
    if cam.name not in scene.collection.objects:
        scene.collection.objects.link(cam)
    cam.rotation_mode = 'XYZ'
    return cam
