# Construction techniques

How to turn a blockout into real form with the helpers in `scripts/bm_build.py`. Read
"Choosing the method" in Phase 0, the rest when the part needs it.

## Choosing the method

Decide per part from the references, in this order, and write it into the brief:

1. **Round cross-sections** (barrel, column, bottle, wheel, turned leg, dome) → `revolve(profile)`
   over a half-profile `[(r, z), ...]` read off the side view.
2. **A unit repeated** around an axis (sails, spokes, bolts, battlements) or in a row (fence
   pickets, rafters, slats) → build one unit, repeat it in the script (or an Array modifier).
3. **Mirror-symmetric** silhouette → build one half and mirror; check that the symmetry is real on
   the reference before relying on it, then add the asymmetric details separately.
4. **Section changes along the length** (boat hull, car cabin, tapered tower, roof with a flare,
   tree trunk) → `loft(sections)` through measured sections. The number and spacing of sections
   decides the transition: close pairs read as a crease, spaced ones as a smooth taper.
5. **A flat profile with depth** (gable, bracket, door frame, cut board, sign) → `prism(outline,
   depth)` from the outline traced off the orthographic view.
6. **Cladding** (log or plank walls, roof boards, floors, doors, shutters, sail slats) →
   `boards(quad, count, gap, thickness)` over the frame's faces, each board its own closed piece.
7. **Timber and steel frames** (posts, beams, braces, lattice, rails, ladders) → `beam(p0, p1, w, h)`.
8. **Organic forms** (creatures, sacks, cushions, rock, cloth) → fuse the blockout, voxel-remesh it
   (Remesh modifier, voxel size about 1/200 of the height) and shape it, or a shape generator if
   the project has one. Code-built organics stay the weakest part: say so in the report.

Boxes are right only where the real object is a box (a crate, a brick, a plinth).

## Construction logic

- Every part is held by something: a post stands on a footing, a beam rests on posts, a board is
  nailed to a frame, a sail is lashed to a stock. Model the contact, then `floating_parts` proves it.
- Real thickness: boards 25-40 mm, logs 200-260 mm, planks on a roof 20-30 mm, sheet iron 1-2 mm,
  window glass set into the frame, not on its face. Nothing is infinitely thin except a card.
- Real gaps: 5-15 mm between boards, a shadow line around doors and hatches, eaves overhang
  0.3-0.6 m. Gaps and overhangs are what make a surface read as built, not printed.
- Variation: boards are not identical — small offsets in height, width and depth (`boards(...,
  jitter=)`), not random noise on every vertex.
- Overlap order: what covers what (roof over wall, trim over boards) is modelled in that order, the
  covering part slightly proud.

## Log buildings

Izbas, barns, mills, bathhouses, cribs:
- Logs as `cylinder` (10-12 segments) with `cap_index` for light end grain at the corners only; a log
  cut at a door or window gets a dark or plain end there, or the opening reads as a pale square.
- Adjacent walls are half a course apart (front and back walls on whole courses, side walls on
  half courses); the first course lies on the sill or floor; course height about 0.85 of the log
  diameter, so neighbouring logs overlap like notched logs do.
- Ends stick out 0.2-0.3 m past the corners and differ by a few centimetres course to course:
  equal ends put the overlapping end discs in one plane and they flicker.
- Small radius variation course to course (±5%) breaks the machine look.
- Gables of logs continue the end walls above the side walls, each log cut short to the roof
  line; purlins and a ridge log run along the building on the gables and carry the roof deck.
  The roof underside clears the top log ends; overhangs 0.4-0.6 m with barge boards.
- Openings: split the logs centred in them, a frame (jambs, lintel, sill) slightly proud of the
  wall so its faces are not flush with the log ends, a dark plate inside behind small windows.

## Stacked frames and cribs

Every course must rest on the one below: beams of a course are long enough to cross the beams of
the course under them. Stepped corbels (each course wider) read heavy when the beams are close
(0.4 m) and their ends show. A part that turns (a post-mill body) leaves a few centimetres of
clearance above the fixed part and is connected through its real pivot.

## Scale of detail

Detail is built for the closest view the owner looks from, not for the game camera: what the real
object has as shape is geometry, and round pieces stay round up close. `game_view` shows how the
model reads in the game — whether the silhouette features hold — and is never a reason to leave
detail out.

## Booleans

Cut the whole opening with one cutter aligned on the reference first. Apply it without operators:
take the evaluated mesh (`bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph_of([obj])))`,
as `export_copy` does), put it on the object and drop the Boolean modifier, then clean it in
bmesh: `bmesh.ops.dissolve_limit` on the cut faces, remove doubles; `mesh_report` must show no new
edges shared by three faces. For log and board walls, splitting the pieces at the opening (as the
log-building recipe does) is simpler than any boolean. An element inside the opening (window frame, door) is its own object
in the hole, never a cutter shaped around it. Booleans before bevels, always.

## Bevels and shading

- Width by material: worn wood 10-25 mm, sawn wood 4-8 mm, cast or forged iron 2-4 mm, machined
  metal 0.5-2 mm, stone 10-30 mm. Big reads as a toy, none reads as CG.
- `add_bevel(obj, width, 2, 'ANGLE', 30)` keeps it a modifier, limited to sharp edges; bevel weights
  with `limit='WEIGHT'` where different edges need different radii.
- `finish_shading(obj)` after the bevel: smooth shading, sharp by angle, Weighted Normal last.
  Melted-looking flats mean the weighted normals are missing; mechanical sameness means the bevel
  was not limited.
- A curved surface is form (loft, revolve), not a bevel.

## Materials

- By role from the brief, not by colour alone: weathered boards, tarred roof, whitewash, rusted
  iron straps, river stone. A plain colour on a large surface reads as plastic.
- Library maps in real size: `uv_box(obj, tile=<the texture's real size in metres>)`, then the
  project's library material or `library_material(name, folder)`. Check the maps the way the
  project's notes say before using them (normal maps saved in the wrong convention, glossy grass).
- Edge wear and dirt follow construction and contact (bottom of walls, around handles), not a white
  outline around every edge.
- Check tones in greyscale: the roof, walls and trim must separate without colour.

## Export copy

The master keeps modifiers live. `export_copy(objs, name, collection)` makes the shipped mesh with
everything applied in world space; export that, through the project's exporter if it has one,
then `glb_report` the file.
