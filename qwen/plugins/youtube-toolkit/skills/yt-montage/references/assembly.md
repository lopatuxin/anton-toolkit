# Assembly from recorded speech

Read this only for assembling or revising a complete video. Keep the source recording, project and previous export intact; write a new version. Use the existing episode project and toolchain. HyperFrames handles compositions, FFmpeg cuts/mixes/encodes, yt-motion directs motion scenes, and image generation or Blender supplies planned assets. Read the relevant installed skills before using their tools; do not invent unavailable commands or replace the project just to suit a new renderer.

## Voice first

Apply the recording-specific treatment constraints before the cleanup steps below. If the user accepted the recording as-is, use it as the master and skip cleanup/normalization; transcribe a separate analysis copy. Keeping the source file does not satisfy a prohibition on re-encoding the delivered voice track. If a requested insertion or mix cannot meet an explicit preservation constraint with the available workflow, explain the concrete conflict and obtain approval for the exception before producing that version. Record any permitted conversion accurately; equal samples in an intermediate master do not prove an unchanged lossy delivery track.

1. Locate the actual recording and approved script from the task and episode; a user-named Music folder is an input location, not background music by default. Transcribe with word timestamps using available local tools. Compare repeated passages with the script and surrounding meaning before choosing the retained take. If the recording cannot be found, request its location and continue asset planning; do not invent a voice track or call a silent draft the finished narrated video.
2. Remove abandoned starts, duplicate takes, verbal debris and excessive accidental pauses. Preserve meaningful hesitation, breaths, intended emphasis and complete words. Silence detection proposes candidates; a fixed silence threshold alone must not decide cuts. Log source in/out ranges and reasons in an edit decision list so cuts can be revised.
3. Repair joins with short fades where appropriate, reduce distracting clicks/noise conservatively, and level the voice. Do not gate away consonants or normalize each sentence independently. Check the joins in context for clipped words, duplicated endings and changed meaning; listen when playback is available. Waveforms, ASR and loudness measurements do not establish that a join sounds natural: explicitly report any listening that remains unperformed.
4. Produce a clean voice master and regenerate word timestamps from that master, or derive them through the validated cut map. Raw-recording timestamps are no longer valid after cuts. Store the master path, duration and timing basis in the editing sheet. If cleanup changes later, invalidate dependent scene timings and recheck synchronization.

## Plan and reuse

Build the editing sheet from the cleaned speech using yt-montage's beat fields. Inspect source clips in motion, including earlier approved versions, before deciding to replace them. Keep an asset ledger with path/source URL, evidence versus illustration, license and required attribution. Keep credit text out of explanatory shots when the source permits attribution elsewhere; prepare the description credits as a deliverable, never silently drop required attribution.

For a reused animation, map its source phases onto spoken cues: assembled hold → parts separate → separated hold → parts assemble → final hold. Preserve the active moves' readable pace, adjusting holds and individual phases. Record source ranges and destination ranges; keep the camera, geometry and part identities. An old seven-part 3D assembly is not replaced with three sliding flat cutouts merely because those are easier to animate. If the source lacks a needed phase, document that gap and make only the missing material.

Every beat has a visible explanatory action. For an editor inspection, use the actual editor view and move a magnified region with the cursor; magnify the corresponding pixels under it. For silhouette matching, show approach/alignment, then highlight discrepancies rather than display only a final overlay. For split comparisons, use spacing, contrast and labels that identify each side at mobile viewing size. Image generation can supply attractive illustrations, but generated models or simulated UI are not evidence of what happened in Blender.

## Intro and speech placement

When an intro is part of the established format, resolve its approved asset and audio treatment before timing the full edit. Default a standalone branded intro to its own beat after the hook and before the greeting or main explanation, with narration paused for its actual duration. An explicit voice-over-intro brief or approved overlapping treatment overrides this default. Use its own sound only when that fits the approved audio treatment; do not add one over a silence/no-music request.

A pause is a timeline insertion, not a logo overlay or a voice fade. Cut at a phrase boundary, preserve complete words, and shift the subsequent speech, pictures, captions and effects together. Carry a source-to-final time map into the montage sheet and chapter times. For example, a four-second standalone bumper adds four seconds before the greeting; it does not occupy four seconds of that greeting. Inspect the exported entry, exit and first resumed phrase, including the sound of the bumper.

## Assemble and mix

- Use yt-motion for the rows requiring composed motion; pass the clean master timing and reuse decisions. Reuse the approved style in a revision. Do not reopen settled style choices or ask permission for every reversible correction.
- Place clips and overlays against the phrase anchors. Review action onset, intermediate state and result, not just scene boundaries. A continuous still is acceptable while the viewer reads or inspects it; remove dead holds caused by old durations or accidental voice gaps.
- Carry the voice master once. Follow the approved audio treatment: where effects or music are wanted, add them with a restrained bed and duck music under speech; do not add tracks that contradict a silence/as-is constraint. Check levels, peaks and abrupt transitions in the mixed export, not just the isolated voice. Preserve pauses that support meaning; do not hide a long accidental silence with music.
- Render a versioned final file in the agreed format (otherwise 1920×1080, 30 fps). Preserve the project, sources, edit decision list, asset ledger and credits alongside it. Rendering or saving does not authorize uploading or publishing.

## Delivery checks

Check three layers and record what was actually inspected:

1. **Technical:** the final file decodes, has the expected dimensions/fps/duration and audio streams, and contains no missing assets, blank frames, clipped text or unintended gaps. Compare duration with the assembled timeline, not a rounded target length.
2. **Meaning and timing:** compare the spoken claim, planned action and exported frames at action start, an intermediate point and its result. A promised separation must separate actual parts; a magnifier must follow the area being examined; discrepancy markers must point at discrepancies. Include scene transitions, first/last frames and all user-marked problem sections. Inspect a short exported sequence where motion matters; a keyframe or a contact sheet alone cannot prove the action happens. An unsupported analogy, absent action, misleading comparison or action on the wrong phrase blocks calling the video finished. Apply the Visual explanation principles in `PLUGIN_ROOT/skills/yt-montage/SKILL.md`: the viewer must be able to identify the referent, follow the cause through its action to the result, and associate numbers with the correct objects. An unrecognizable placeholder, clutter that hides the interaction, an occluded working part, or an unchanged loop under different claims is an explanatory failure even when the render and its mathematics pass.
3. **Audio:** check cut joins, longest remaining speech gaps and mixed levels across the export. Listen to the edited joins and final mix where playback is available. If only transcripts and measurements were checked, say that plainly and label the audio review incomplete; do not claim the video was watched/listened to end to end. Do not mark an unverified defect as fixed.

Fix failed checks and rerender affected material. Deliver the actual video with a concise account of changes and any remaining review limits, not only the montage sheet or a statement that the render command succeeded.
