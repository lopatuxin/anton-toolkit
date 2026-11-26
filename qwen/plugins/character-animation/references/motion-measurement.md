# Measuring and transferring a reference performance

Read this after a particular video segment and subject have been approved. Keep observations,
reconstructed motion and target-rig parameters distinct: they describe different coordinate systems.

## Select a method

Reuse the project's existing capture or tracking tools where they suit the footage.

- **Pose landmarks** can supply image-space and estimated 3D joints for a visible humanoid.
  [MediaPipe Pose Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker)
  is one option. Its hip-centered world landmarks do not by themselves establish the actor's
  ground trajectory or separate all camera movement. Confirm outputs and current setup from
  official documentation before using a version you have not inspected.
- **Temporal 3D reconstruction** can estimate body orientation and world motion across a video.
  [GVHMR](https://github.com/zju3dv/GVHMR) is an example, not a bundled dependency or a promise of
  exact film mocap. Inspect installation, model access and licenses before choosing it; reuse
  an available installation rather than silently adding a large GPU environment.
- **Frame-based annotation and fitting** can handle a short, readable action without an installed
  tracker. Extract frames with source timestamps using available media tools, locate observable
  landmarks and events, and fit the rig against those observations. Record landmark selection
  as annotation, with its uncertainty. Visual estimates are not automatic tracking results.

Human body models do not cover every zombie, animal or stylized rig. Choose a fitting method
appropriate to its anatomy. If the important motion is invisible or cannot be measured with
available tools, identify the missing evidence rather than inventing a dense motion track.

## Preserve the evidence

Keep the original segment, where locally obtainable, and a compact measurement file beside the
reference record. Use the existing art directory layout; absent a convention, a directory such as
`art/<game>/animations/<motion>/` is sufficient. Retain only the data needed to reproduce fitting.

Record:

- source time base, actual frame timestamps and extraction method; distinguish source time,
  segment-relative seconds and target animation phase;
- tracked subject and coordinate convention; image dimensions, any crop or mirroring, and the
  mapping back to the original image;
- per-frame observed landmark coordinates and confidence or annotation uncertainty; mark
  missing/occluded observations explicitly rather than inserting a measured-looking zero;
- contact/lift-off events, stance and swing duration, cycle endpoints or one-shot boundaries;
- which coordinates, depth, scale, joints or camera motion were reconstructed rather than
  directly observed, plus the tool/model version when a model was used.

Use coarse sampling to find events, then sample more densely around contacts, reversals and
fast movement. Preserve original timestamps, including variable frame rate; a frame index divided
by a nominal rate is not always the actual time. Inspect temporal tracker failures such as identity
switches, left/right swaps, confidence gaps and limbs flipping across the body.

Normalize image measurements by a stable body dimension when absolute scale is unavailable.
Label them as fractions of body height or image dimensions, not centimeters. A camera-facing
limb can be foreshortened: its projected length is not its true bone length. Keep a consistent
body scale rather than fitting a new body height to each frame.

## Fit the target skeleton

Build a role mapping for pelvis, torso/head and the relevant limb chains. Read the rig's rest
rotations, local bone directions, hierarchy and model transform. Match the source and target
coordinate conventions, handedness and facing; do not assume that the same axis name or bone
name means the same anatomical rotation on two rigs.

Fit orientations and contact goals to the target's bone lengths. For image observations, compare
the projection of the evaluated target joints with observed joints using a fitted camera; record
important projection ambiguity. Without reliable depth or scale, describe the result as a fitted
3D interpretation, not an exact recovery of the original 3D performance.

When the engine applies a correction on the right of a base local rotation, solve
`q_delta = inverse(q_base) * q_target` in the same local frame. Convert that correction using
the engine's actual Euler convention. Copying world angles or absolute captured local rotations
directly into an additive correction field produces a different pose. Evaluate the final engine
pose, including other modifiers, while fitting.

Unwrap angular sequences before interpolation and inspect what the engine's interpolation does
between measured samples. Filtering should remove tracking noise while retaining intentional
limping, dragging, recoil and stillness. Joint smoothing alone does not enforce foot contact.

## Compare what can be measured

Measure timing errors in seconds, or fractions of a cycle when tempo was deliberately changed.
Measure image-space joint errors in pixels or normalized height with the same camera/crop.
Only report world distances when reconstruction or calibration supports them. Exclude or mark
unreliable landmarks in aggregates so a low overall error does not hide invisible feet.

Check support through the engine's final pose. A walk performed in place has a planted foot moving
backward relative to the model at the intended forward speed; zero foot velocity is the correct
constraint only in the world frame of a planted foot. Account for intended game speed and root
motion before diagnosing sliding. Check sole/ground clearance as well as the foot-joint position.

Inspect the motion densely enough to expose interpolation overshoot and joint discontinuities.
Use the actual timestep and target body scale when interpreting a position jump; do not reuse a
single absolute threshold for every rig, frame rate and action. For a loop, inspect its seam and
velocity as well as its endpoint pose. For a one-shot, inspect the hold or return expected by the
request rather than inventing a loop requirement.

Keep a short before/after comparison and any material residual error with the motion data. Name
the remaining mismatch in the delivery; avoid unsupported percentages of overall similarity.
