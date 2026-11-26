# FreeCAD scripting recipes

Verified against FreeCAD 1.1.3 on this machine. All of it runs through
`mcp__freecad__execute_code` with `include_screenshot: false`.

## Document and parameter sheet

Every dimension that could change lives here; features reference it by expression.

```python
import FreeCAD as App
doc = App.newDocument("Кронштейн")
sheet = doc.addObject("Spreadsheet::Sheet", "Params")
for i, (name, value, note) in enumerate([
    ("width",  "60 mm", "ширина плиты"),
    ("height", "12 mm", "толщина"),
], start=1):
    sheet.set("A%d" % i, name)          # ASCII alias goes in the sheet
    sheet.set("B%d" % i, value)         # value WITH units, or expressions get a unit error
    sheet.setAlias("B%d" % i, name)
    sheet.set("C%d" % i, note)          # Russian description for the user
doc.recompute()
doc.saveAs(r"C:\projects\FreeCAD\Кронштейн\Кронштейн.FCStd")
```

Aliases must be ASCII. Values carry units (`"60 mm"`); a bare number binds badly to a length
property. Referenced elsewhere as `Params.width` — that is the sheet's internal `Name`.

## Parametric body

```python
import Part, Sketcher
from FreeCAD import Vector as V

body = doc.addObject("PartDesign::Body", "Body")
body.Label = "Плита"                                   # Cyrillic labels are fine
sk = body.newObject("Sketcher::SketchObject", "Sketch")
sk.AttachmentSupport = [(next(p for p in body.Origin.OriginFeatures if "XY_Plane" in p.Name), "")]
sk.MapMode = "FlatFace"

sk.addGeometry(Part.LineSegment(V(0, 0, 0), V(60, 0, 0)), False)
sk.addGeometry(Part.LineSegment(V(60, 0, 0), V(60, 40, 0)), False)
sk.addGeometry(Part.LineSegment(V(60, 40, 0), V(0, 40, 0)), False)
sk.addGeometry(Part.LineSegment(V(0, 40, 0), V(0, 0, 0)), False)
for a, b in ((0, 1), (1, 2), (2, 3), (3, 0)):
    sk.addConstraint(Sketcher.Constraint("Coincident", a, 2, b, 1))
sk.addConstraint(Sketcher.Constraint("Horizontal", 0))
sk.addConstraint(Sketcher.Constraint("Vertical", 1))
sk.addConstraint(Sketcher.Constraint("Horizontal", 2))
sk.addConstraint(Sketcher.Constraint("Vertical", 3))
sk.addConstraint(Sketcher.Constraint("Coincident", 0, 1, -1, 1))    # pin to the origin

i = sk.addConstraint(Sketcher.Constraint("DistanceX", 0, 1, 0, 2, 60))
sk.renameConstraint(i, "width")                        # name it, then bind it
sk.setExpression("Constraints.width", "Params.width")

pad = body.newObject("PartDesign::Pad", "Pad")
pad.Profile = sk
pad.setExpression("Length", "Params.height")
doc.recompute()

assert sk.FullyConstrained, "эскиз не определён полностью"
```

`sk.FullyConstrained` is the check. `sk.solve()` returns 0 for an under-constrained sketch as
well, so it proves nothing. Geometry indices are 0-based; `-1` is the sketch origin, point
index 1 is a line's start and 2 its end.

Changing `sheet.set("B1", "100 mm")` and recomputing rebuilds the solid — that is the whole
point of the loop, and it is what lets the user change dimensions in the GUI without asking.

Turned parts use `PartDesign::Revolution` over a half-profile instead of a pad; pockets, holes,
fillets and chamfers are `PartDesign::Pocket`, `PartDesign::Hole`, `PartDesign::Fillet`,
`PartDesign::Chamfer`, all created with `body.newObject(...)`.

## Failure leaves debris

When `execute_code` raises partway, the objects created before the exception stay in the
document while some property assignments roll back. Re-running the same script then produces
`Page001`, `Template001` and similar duplicates. After any failed call, list the document's
objects, delete the half-built ones, and only then retry.

## Drawing

```python
import os
tpl = os.path.join(App.getResourceDir(), "Mod", "TechDraw", "Templates",
                   "Default_Template_A4_Landscape.svg")
page = doc.addObject("TechDraw::DrawPage", "Page")
tmpl = doc.addObject("TechDraw::DrawSVGTemplate", "Template")
tmpl.Template = tpl
page.Template = tmpl

view = doc.addObject("TechDraw::DrawViewPart", "ViewTop")
page.addView(view)
view.Source = [body]
view.Direction = (0, 0, 1)
view.X, view.Y, view.Scale = 100, 150, 1.0

dim = doc.addObject("TechDraw::DrawViewDimension", "DimWidth")
page.addView(dim)
dim.Type = "DistanceX"
dim.References3D = [(body, "Edge1")]      # 3D refs survive a rebuild; 2D edge names do not
doc.recompute()
print(dim.getRawValue())                  # 0.0 means the wrong edge was referenced
```

FreeCAD 1.1 ships exactly two templates — `Default_Template_A4_Landscape.svg` and
`HowToExample.svg`. There is no A3 or portrait template and no ГОСТ frame; a different format
means supplying a custom SVG. Setting a template path that does not exist raises
`Could not read the new template file`.

`dim.getRawValue()` is the value accessor in 1.1 (`getDimValue()` does not exist). Check it
after adding each dimension — a value of 0 means the referenced edge is perpendicular to the
dimension type, not that the part is wrong.

## Export

```python
import Mesh, Part, TechDrawGui
Mesh.export([body], r"C:\projects\FreeCAD\Кронштейн\Кронштейн.stl")   # printing
Part.export([body], r"C:\projects\FreeCAD\Кронштейн\Кронштейн.step")  # machining, other CAD
TechDrawGui.exportPageAsPdf(page, r"C:\projects\FreeCAD\Кронштейн\Чертёж.pdf")
```

## Load analysis

`mcp__freecad__run_fem_analysis` runs CalculiX and returns max von Mises stress in MPa, max and
min displacement in mm, and the node count. Both solvers, `ccx.exe` and `gmsh.exe`, ship inside
the FreeCAD 1.1 installation — nothing to install.

The document needs, before the tool is called: a solid, a `Fem::AnalysisPython` container, a
`Fem::MaterialCommon` assigned to the solid, a `Fem::FemMeshGmsh` referencing it, and at least
one `Fem::ConstraintFixed` plus one `Fem::ConstraintForce` or `Fem::ConstraintPressure` bound to
specific faces — all added to the analysis. Create them with `mcp__freecad__create_object` and
its `analysis_name` argument. The solver blocks every other call while it runs.

What the number means, and what to tell the user: it is a linear static analysis. It assumes
small deflections, elastic material and a solid homogeneous body. Compare the stress against the
material's yield strength and report the safety factor. Two honest caveats belong in the report:
a printed part is layered and fails across layers well before a solid one would, so the result is
optimistic and wants a factor of at least 2–3; and the answer depends on where the constraints
were placed, so name which faces were fixed and where the load was applied.
