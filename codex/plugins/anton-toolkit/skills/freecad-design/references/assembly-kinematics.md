# Assemblies, joints and motion

Verified against FreeCAD 1.1.3 on this machine. The goal is an assembly the user can grab with
the mouse and move — the mechanism has to work in his hands, not only in a report.

## Three things that silently break an assembly

1. **`assembly.Type = "Assembly"` must be set.** `addObject("Assembly::AssemblyObject", ...)`
   leaves it empty, and the solver ignores an assembly whose `Type` is empty. The GUI command
   sets it; scripted creation does not.
2. **A joint reference holds the moving part, not the assembly.** In 1.1 the format is
   `[part, ["Face6", "Vertex7"]]`. The older `[assembly, ["Part.Face6", ...]]` still resolves
   for placement lookup, so nothing errors — but the solver then sees a joint between the
   assembly and itself, returns 0, and nothing moves.
3. **Exactly one part must be grounded**, or `solve()` returns `-6`.

`solve()` returning 0 while parts stay put means the references are in the wrong format. Codes:
0 success, -1 solver error, -2 redundant, -3 conflicting, -4 over-constrained, -5 malformed,
-6 nothing fixed.

## Building the assembly

```python
import FreeCAD as App, JointObject, UtilsAssembly

doc = App.newDocument("Механизм")
asm = doc.addObject("Assembly::AssemblyObject", "Assembly")
asm.Type = "Assembly"                                   # see gotcha 1
jg = asm.newObject("Assembly::JointGroup", "Joints")

base = asm.newObject("Part::Box", "Base")               # parts live inside the assembly
arm  = asm.newObject("Part::Box", "Arm")
doc.recompute()

g = jg.newObject("App::FeaturePython", "GroundBase")
JointObject.GroundedJoint(g, base)                      # see gotcha 3

hinge = jg.newObject("App::FeaturePython", "Hinge")
hinge.Label = "Шарнир рычага"
JointObject.Joint(hinge, JointObject.JointTypes.index("Revolute"))
hinge.Reference1 = [base, ["Face6", "Vertex7"]]         # see gotcha 2
hinge.Reference2 = [arm,  ["Face6", "Vertex7"]]
hinge.Placement1 = hinge.Proxy.findPlacement(hinge, hinge.Reference1)
hinge.Placement2 = hinge.Proxy.findPlacement(hinge, hinge.Reference2)
doc.recompute()

assert asm.solve() == 0
doc.recompute()
```

The second element of a reference is the vertex nearest the picked feature; it orients the
joint's coordinate system. A face plus its corner vertex gives a predictable frame — pick both
deliberately, since they decide where the axis ends up.

Joint types: `Fixed`, `Revolute`, `Cylindrical`, `Slider`, `Ball`, `Distance`, `Parallel`,
`Perpendicular`, `Angle`, `RackPinion`, `Screw`, `Gears`, `Belt`.

`joint.Angle` and `joint.Distance` do **not** drive a Revolute or Slider joint — those axes stay
free, which is what lets the user drag the mechanism. They apply to the `Angle` and `Distance`
joint types, and to the `AngleMin`/`AngleMax` limits when `EnableAngleMin`/`EnableAngleMax` are
on. Limits are worth adding: they stop the mouse from dragging a lever through its own frame.

## Driven motion

A motor on a joint, driven by a formula in seconds, generating frames the user plays back in the
Assembly workbench.

```python
from CommandCreateSimulation import Simulation, Motion

sim = UtilsAssembly.getSimulationGroup(asm).newObject("App::FeaturePython", "Simulation")
Simulation(sim)
sim.aTimeStart, sim.bTimeEnd = 0, 4          # seconds
sim.cTimeStepOutput, sim.jFramesPerSecond = 0.1, 24

motion = asm.newObject("App::FeaturePython", "Motion")
Motion(motion, "Angular", hinge, "90*time")  # "Angular" | "Linear"
sim.Group = sim.Group + [motion]
doc.recompute()

assert asm.generateSimulation(sim) == 0
n = asm.numberOfFrames()                     # 0 means the formula or the joint was rejected
asm.updateForFrame(n - 1)
```

**The formula variable is `time`, in seconds — not `t`.** A formula in `t` is accepted silently,
`generateSimulation` returns 0, and `numberOfFrames()` comes back 0. Always check the frame
count; a successful return code alone does not mean the simulation ran.

Only `Revolute`, `Slider` and `Cylindrical` joints can be driven. Angular formulas are in
degrees, linear ones in millimetres.

What this is and is not: it is driven kinematics — the mechanism follows the formula and the
geometry follows the joints. There is no dynamics. Nothing computes forces, inertia, momentum or
what happens when the mechanism hits something. It answers "does it reach, does it clear, does
it bind", not "how hard does it hit".

## Interference over the range of motion

Dragging by hand misses small collisions. Stepping through the frames and intersecting the
solids gives a number instead of an impression:

```python
for f in range(asm.numberOfFrames()):
    asm.updateForFrame(f)
    common = base.Shape.common(arm.Shape)
    if common.Volume > 1e-6:
        print("кадр", f, "пересечение", round(common.Volume, 2), "мм3")
```

Report the first frame that collides and the joint value there, not just that a collision exists
— the user needs to know at which angle the part hits.
