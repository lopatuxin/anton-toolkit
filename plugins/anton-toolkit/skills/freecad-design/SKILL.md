---
name: freecad-design
description: >
  Designs parts and assemblies in FreeCAD through the freecad MCP server: the user says what
  to make, the skill models it parametrically, the user opens FreeCAD and inspects it himself,
  then asks for changes. Covers modelling for 3D printing, milling, turning, welding and sheet
  furniture, assemblies with working joints and driven motion, load analysis, drawings and
  STL/STEP export. Use for any request to model, design, or correct something in FreeCAD or CAD.
  Not for CAM toolpaths or G-code. Runs in the main conversation — the dialog is not delegated
  to an agent.
when_to_use: >
  "спроектируй деталь", "смоделируй во фрикаде", "сделай кронштейн", "поправь модель", "/freecad-design"
---

# FreeCAD Design — parametric modelling loop

The user names a part, this skill models it, the user opens FreeCAD and looks at it himself, then asks for changes. The value is in the second round being cheap: a correction must be one number in the parameter sheet, never a rebuild from scratch.

## Ground rules

- **`include_screenshot: false` on every freecad MCP call.** The user inspects the model in FreeCAD, not in chat; screenshots only burn context. Pass a screenshot back only when he asks for one.
- **Files live in `C:\projects\FreeCAD\<деталь>\`** — `<деталь>.FCStd` with exports and drawings beside it. Folder and file names in Russian, like the rest of his work.
- **The skill and the user share one running FreeCAD.** He sees every change the moment it lands, so there is nothing to hand over — just tell him what to look at.
- **Save after every accepted change** (`doc.save()`; first time `doc.saveAs(path)`). An unsaved document is lost work on the next crash.
- Report in Russian, plain prose. Model-facing code and identifiers stay English.

## The loop

**Understand the part.** Ask only what changes the geometry and cannot be defaulted: overall size, what it mounts to, what load it carries, which fasteners. Everything else takes a documented default. One round of questions, not an interrogation — he corrects the model faster than he answers questions.

**Establish the fabrication method** — printing, milling, turning, welding, sheet furniture. It decides wall thickness, corner radii, clearances and tolerances, so it is the one thing worth asking about when it is not obvious. Then read `${CLAUDE_SKILL_DIR}/references/fabrication-rules.md` for that method before choosing a single dimension.

**Build it parametrically** — recipes in `${CLAUDE_SKILL_DIR}/references/modeling-api.md`. Assemblies, joints and motion in `${CLAUDE_SKILL_DIR}/references/assembly-kinematics.md`.

**Report and hand over.** A few sentences: what was built, the driving dimensions, what to look at first, and every assumption that would cost him a reprint if wrong. Then stop and wait — he is the reviewer.

**Iterate.** A change request means editing the parameter sheet or one feature, never rebuilding the document. If a change does force a rebuild, say so before doing it.

## Before touching an existing model

Call `list_documents`, then `get_objects` with `include_screenshot: false`. He edits models by hand between rounds — the tree is rarely what the previous round left. Never assume; re-read.

## Modelling discipline

Every dimension that could plausibly change goes in the `Params` spreadsheet and is referenced by expression. A literal typed into a sketch is a number that will be re-typed by hand next round. Aliases must be ASCII (`wall`, `hole_d`) — expressions do not reliably take Cyrillic; the human-readable name goes in the neighbouring cell.

A sketch is finished only when `sk.FullyConstrained` is `True`. `sk.solve()` returns 0 for an under-constrained sketch too, so it is not the check. An under-constrained sketch silently moves when a parameter changes.

Internal `Name` is ASCII, `Label` is Russian — the model tree is read by the user. Cyrillic labels and Cyrillic file paths both work.

Prefer a PartDesign body with sketches and pad/pocket features over booleans of primitives. He opens the tree and edits features in the GUI; a boolean stack is not editable that way. Primitives are fine when the part genuinely is two blocks.

Round internal corners of load-bearing parts even when no rule demands it — a sharp internal corner is where the part cracks.

## When FreeCAD stops responding

`execute_code` runs on FreeCAD's GUI thread. An open modal dialog or task panel in FreeCAD blocks every call until it is closed. If a call hangs, call `get_rpc_status` — it answers even then and names the stuck operation — and ask the user to close whatever dialog is open in FreeCAD.

`execute_code_async` must not touch documents, objects, the GUI, selection, recompute or save. It is only for long pure-geometry computation.

## Drawings, exports, load analysis

Offered, not automatic — a drawing costs real work and is not wanted for every part. Offer a drawing when the part is going to a machinist or a welder, and an STL/STEP export when it is going to a printer or a machine. Recipes for all three, and the honest limits of the load analysis, are in `${CLAUDE_SKILL_DIR}/references/modeling-api.md`.

## Anti-patterns

- Sending screenshots he did not ask for.
- Hard-coded numbers in sketches, so the next correction is a rebuild.
- Choosing dimensions before knowing the fabrication method.
- Reporting a part as done while a sketch is under-constrained.
- Silently picking a wall thickness, a clearance, or a material and not naming the assumption in the report.
- Rebuilding a document the user has since edited by hand.
