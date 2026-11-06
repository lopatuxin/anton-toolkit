---
name: animate-from-reference
description: Finds real video motion references, presents a specific segment for owner approval, then measures and transfers the approved movement to a rigged 3D character using the project's animation stand. Use for requests such as «сделай анимацию зомби», «перенеси движение с видео» or «найди референс походки». Works in the main conversation. For creating a model or rig, use the project's modeling workflow; for rendered video titles and motion graphics, use the video workflow.
---

<!-- Generated from plugins/character-animation/skills/animate-from-reference/SKILL.md; edit that source, then run npm run build. -->

## Kimi runtime

Read PLUGIN_ROOT/kimi-runtime.md before using this procedure.


# Animate from Reference

Turn an observed performance into a saved, inspectable character animation in the owner's engine.
The owner describes the movement and approves the reference; you do the search, measurements,
transfer and fitting. Explicit user instructions override this workflow.

## Establish the target

Resolve the game, model and requested action from the conversation and project files. Ask only
when a choice cannot be inferred and would change the result. Read the applicable project rules
and animation contract, inspect the actual rig and existing motions, and check the running stand.
For Kuznya Mirov, read `PLUGIN_ROOT/references/kuznya-stand.md` at this point.
Use existing tools and project formats; this skill does not itself supply a motion-capture service.

Keep animation work on the engine stand and its motion files. Model or rig repair is a separate
task. Do not change engine code, build a new capture application, purchase a service or set up a
large inference stack as an unannounced side effect. A missing capability gets a concrete report
of what is needed and what can already be completed.

## Find and approve the reference

Search for actual visible movement yourself, even if the owner names only a mood or character.
Translate the request into observable traits: for a limping zombie, stance duration on each leg,
uneven step timing, drag of the foot, torso inclination and delayed arm swing. Use available
video-search tools, web search and supported video playback. Search result titles, descriptions
and thumbnails are discovery leads, not evidence that a clip contains a usable performance.

Inspect candidate footage. Prefer a continuous shot with the relevant limbs and contacts visible,
enough movement for the action or a full gait cycle, limited motion blur and a manageable camera.
Prioritize the requested kind of performance; a human pose tracker is not evidence of support
for a nonhuman creature. Reject a candidate that hides the motion needed for this task.

Present one recommended reference at a time: a playable link or supported short preview, the
exact start/end timestamps, which performer to follow, and a short Russian explanation of why
the movement fits and which important parts are obscured. A film name alone is not a reference.
Do not invent a film attribution or claim to have watched inaccessible footage.

Wait for the owner's approval of that source, segment and subject before measurement or editing
animation files. A rejection means search for another candidate. Approval of the skill, a model
or an earlier source does not approve a new reference. An explicitly approved reference already
provided in the conversation can be reused without another permission question.

Keep a small reference record with the source URL/title, segment timestamps, selected subject,
requested movement, approval status and approved scope. Store it with the task's art/animation
assets, following the project's existing layout. A material change of source, segment, subject
or action needs renewed reference approval. Ordinary trimming of unused lead-in within the
approved segment does not need another question.

## Measure the performance

After approval, read `PLUGIN_ROOT/references/motion-measurement.md`.
Obtain the approved footage through supported means, preserving its source timing. If the
source cannot be inspected or the approved segment obtained, report that obstacle and search
for an accessible candidate for approval; do not substitute an unapproved clip.

Choose the measurement method from the actual footage and available tools. Record source
timestamps, visible joints, event timing and uncertainty in reproducible data. Separate measured
image observations from estimated depth, occluded joints and camera motion. A few selected
poses can establish the action, but do not describe them as a measured continuous trajectory.
Preserve the distinctive rhythm, asymmetry and holds instead of smoothing them away.

## Transfer and fit on the stand

Map anatomical roles to the target rig, resolve local axes from the rest transforms and parent
chain, and account for different proportions. Fit timing and the major body motion, then limb
motion and support contacts. Compare matching action events as well as matching timestamps.
Use the motion representation the engine actually supports; local additive corrections are not
absolute captured joint rotations. Preserve unrelated motions and changes made by other sessions.

For a repeated gait, establish one complete cycle and align its events to animation phase.
For a one-shot action, retain its start, anticipation, action and recovery without forcing a loop.
If the representation cannot express a required feature, such as an independent root trajectory,
complete the supported work and label the missing feature. Do not call that result a full transfer.

Use the rendered character and the engine's evaluated skeleton for fitting. Quantify differences
where data support them: contact timing, stance/swing durations, torso lean, joint trajectories
and support errors. For image-space comparison, match the reference camera as closely as possible
and compare projections; other stand views check 3D plausibility, not unseen ground truth.

Inspect the full motion at normal speed and more slowly, including interpolation between keys,
foot planting, penetrations and abrupt joint changes. Check loop closure only for intended loops,
and compare before/after against the approved reference. Fix supported discrepancies yourself;
do not replace these observations with a generic statement that the animation looks natural.

## Deliver

Save the named motion in the project's format, plus its approved-source record and measurement
data. Open or leave the result available on the stand and give the owner its address, game,
model and motion name. State the main remaining mismatch and anything that was not measured
or tested. A draft or blocked transfer is labeled as such.

Do not bind the motion to gameplay unless the user requested that integration. Do not write
project journal entries or owner memory as part of animation work. Creation of this skill does
not authorize running a first animation job without a requested model and action.
