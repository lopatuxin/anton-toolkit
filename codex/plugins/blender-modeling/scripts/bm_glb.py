# What actually shipped: read an exported .glb directly (no importer, which can fail in a
# translated interface) and report size, lowest point, triangles, materials, textures and
# vertex attributes. glTF is Y-up; sizes are also given in Blender axes (x, y=-z, z=y).

import json, struct
from mathutils import Matrix, Quaternion, Vector


def _node_matrix(nd):
    if "matrix" in nd:
        m = nd["matrix"]
        return Matrix([m[0:4], m[4:8], m[8:12], m[12:16]]).transposed()
    t = Matrix.Translation(nd.get("translation", [0, 0, 0]))
    x, y, z, w = nd.get("rotation", [0, 0, 0, 1])
    r = Quaternion((w, x, y, z)).to_matrix().to_4x4()
    s = nd.get("scale", [1, 1, 1])
    return t @ r @ Matrix.Diagonal((s[0], s[1], s[2], 1.0))


def glb_report(path):
    data = open(path, "rb").read()
    magic, _, _ = struct.unpack_from("<III", data, 0)
    if magic != 0x46546C67:
        return {"error": "not a GLB file"}
    off, js = 12, None
    while off < len(data):
        clen, ctype = struct.unpack_from("<II", data, off)
        if ctype == 0x4E4F534A:
            js = json.loads(data[off + 8:off + 8 + clen])
        off += 8 + clen
    if js is None:
        return {"error": "no JSON chunk in the GLB"}
    acc = js.get("accessors", [])
    lo = Vector((1e18,) * 3)
    hi = Vector((-1e18,) * 3)
    tris, prims, attrs, colour = 0, 0, set(), []

    def walk(i, parent):
        nonlocal tris, prims
        nd = js["nodes"][i]
        M = parent @ _node_matrix(nd)
        if "mesh" in nd:
            for p in js["meshes"][nd["mesh"]]["primitives"]:
                prims += 1
                pa = acc[p["attributes"]["POSITION"]]
                for x in (pa["min"][0], pa["max"][0]):
                    for y in (pa["min"][1], pa["max"][1]):
                        for z in (pa["min"][2], pa["max"][2]):
                            w = M @ Vector((x, y, z))
                            for k in range(3):
                                lo[k], hi[k] = min(lo[k], w[k]), max(hi[k], w[k])
                if p.get("mode", 4) == 4:
                    tris += (acc[p["indices"]]["count"] if "indices" in p else pa["count"]) // 3
                attrs.update(p["attributes"].keys())
                if "COLOR_0" in p["attributes"]:
                    colour.append(acc[p["attributes"]["COLOR_0"]]["type"])
        for c in nd.get("children", []):
            walk(c, M)
    scene = js.get("scenes", [{}])[js.get("scene", 0)]
    for i in scene.get("nodes", []):
        walk(i, Matrix.Identity(4))
    if not prims:
        return {"error": "the file has no mesh in its scene", "file": path}
    size = hi - lo
    return {"file": path, "tris": tris, "primitives": prims,
            "size_gltf": [round(v, 4) for v in size], "size_blender": [round(size[0], 4), round(size[2], 4), round(size[1], 4)],
            "lowest_gltf_y": round(lo[1], 4),
            "materials": [{"name": m.get("name", ""),
                           "base_color_factor": [round(c, 3) for c in m.get("pbrMetallicRoughness", {}).get("baseColorFactor", [1, 1, 1, 1])],
                           "maps": sorted([k for k in ("baseColorTexture", "metallicRoughnessTexture") if k in m.get("pbrMetallicRoughness", {})]
                                          + [k for k in ("normalTexture", "occlusionTexture", "emissiveTexture") if k in m])}
                          for m in js.get("materials", [])],
            "images": len(js.get("images", [])), "attributes": sorted(attrs), "color_0_types": sorted(set(colour)),
            "extensions": js.get("extensionsUsed", [])}
