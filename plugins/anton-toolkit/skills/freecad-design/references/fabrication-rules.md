# Fabrication rules — design defaults per manufacturing method

Defaults to apply when the user has not specified otherwise. Every default applied to a
load-bearing or fitting dimension is named in the Russian report, so a wrong one is caught
before the part is made rather than after.

## FDM 3D printing

- **Fit clearances**, per side, for a 0.4 mm nozzle: 0.1 mm press fit, 0.2–0.3 mm sliding fit,
  0.4 mm free fit. A hole that must accept a shaft is drawn oversize by the clearance, not to
  the nominal diameter.
- **Wall thickness** is a multiple of extrusion width — 0.8 / 1.2 / 1.6 mm on a 0.4 nozzle.
  Below 1.2 mm nothing structural. The smallest feature that prints reliably is two extrusion
  widths.
- **Overhangs** up to 45° from vertical print unsupported. A horizontal hole prints round only
  up to ~10 mm; larger ones are drawn as a teardrop or a rhombus, or reoriented.
- Horizontal holes come out **0.1–0.4 mm undersize**. Either add the allowance or plan to drill.
- The first layer spreads (elephant foot). A **0.5 × 45° chamfer** along the bottom contour
  keeps the part sitting flat.
- **Strength is directional**: across layers a printed part holds roughly a third to a half of
  what it holds along them. Orientation decides strength more than wall thickness does, so say
  in the report which way the part should be printed.
- **Threads**: prefer a heat-set insert or a captive nut over a printed thread. Insert hole
  diameter = insert OD minus 0.1–0.2 mm, depth = insert length plus 0.5 mm — confirm against
  the specific insert's datasheet, they differ by brand.
- Fillet internal corners. A sharp internal corner in a printed part is a crack starter, and
  the layer boundary makes it worse than in metal.

## Milling

- **No sharp internal corners** — a round tool cannot cut one. Internal corner radius ≥ tool
  radius, and comfortably ≥ 1.2 × tool radius so the cutter is not fully engaged. For a common
  6 mm end mill that means R4 rather than R3.
- **Pocket depth** ≤ 3–4 tool diameters. Deeper needs a longer tool, which chatters and leaves
  a poor finish; better to redesign or split the part.
- **Wall thickness** ≥ 0.8 mm in metal, ≥ 1.5 mm in plastic. Thinner walls vibrate and come out
  wavy.
- **Tool access**: every machined surface must be reachable from above in one or two setups.
  A feature reachable from no direction is a part that has to be split in two.
- **Tolerances**: free dimensions ±0.1 mm; a bearing or shaft seat gets a fit callout (H7/g6)
  rather than a plain number.
- Holes go to standard drill diameters. Tapped holes: M3 → 2.5, M4 → 3.3, M5 → 4.2, M6 → 5.0,
  M8 → 6.8 mm. Clearance holes: M3 → 3.4, M4 → 4.5, M5 → 5.5, M6 → 6.6, M8 → 9.0 mm.
- A blind pocket keeps the tool's corner radius at the floor-to-wall junction — draw it.

## Turning

- The part is a body of revolution: model the profile and revolve it, do not stack cylinders.
- **Relief groove** at every shoulder and before every thread, so the tool has somewhere to run
  out. Without it the corner cannot be cut clean.
- Internal corners take the **tool nose radius**, typically 0.4–0.8 mm. Do not draw them sharp.
- **Length-to-diameter ≤ 3** unsupported. Longer needs a tailstock or a steady rest, which is a
  question for the user, not an assumption.
- **1 × 45° lead-in chamfer** on both ends and before a thread.
- Diameters follow standard bar stock, so the part starts from something that exists.

## Welding

- **Root gap** 0–2 mm. Above 5 mm plate, prepare the edges — a 30–45° bevel.
- **Fillet leg size** ≈ the thickness of the thinner part. A bigger weld does not make a
  stronger joint, it just adds heat and distortion.
- **Never converge three welds at one point** — the accumulated heat cracks the joint.
- **Torch access**: the torch needs roughly 45° of approach and room for a hand. A joint at the
  bottom of a narrow box cannot be welded.
- Welding **shrinks and pulls** the assembly. Where a dimension matters after welding, leave
  machining allowance and say so.

## Sheet furniture

- Model from the **actual sheet thickness** as a parameter — ЛДСП 16 or 18 mm, plywood 12/15/18.
  Nominal and actual differ; ask which stock he has.
- **Joints**: confirmat 7 × 50 mm, 8 mm dowels, cam locks. Dowel and confirmat boring is on the
  8 mm line from the edge.
- **Edge banding** adds 0.4–2 mm per edge to the finished dimension. Decide early whether the
  drawn dimension is with or without it, and state which.
- **Cutting**: the saw kerf is 3–4 mm; a cut plan that ignores it does not fit the sheet.
- Back panel: 3–4 mm ХДФ, either in a groove or overlaid — it is what keeps the carcass square.

## Fasteners, any method

Standard sizes are M3, M4, M5, M6, M8. Head and washer clearance is checked in the model, not
assumed: a screw that cannot be reached by a screwdriver is a design error that only shows up
during assembly.
