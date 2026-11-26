export const meta = {
  name: 'blender-parts',
  description: 'Части модели Blender: строитель Opus на каждую часть, все параллельно в Blender без окна, затем стыки соседних частей и ревьюер по образцу',
  phases: [
    { title: 'Части', detail: 'строитель на часть, все параллельно' },
    { title: 'Стыки', detail: 'пары соседних частей, по одной' },
    { title: 'Ревью', detail: 'свежий взгляд: образец против модели' },
  ],
}

// args:
//   asset     absolute path of the asset folder (brief.md, dims.py, parts\, ref\, work\calib.blend)
//   blender   absolute path of blender.exe
//   scripts   absolute path of the plugin's scripts folder (run_parts.py, review_sheets.py)
//   round     round number: outputs go to <asset>\work\r<round>\<part | joints | review>
//   parts     [{ id, notes }] — parts to build this round; notes: the director's and the
//             reviewer's findings for this part, to apply
//   joints    [{ a, b }] — touching pairs to check after the builders (only pairs with a part
//             built this round)
//   review    true — run the reviewer on the whole asset at the end

const a = args || {}
// one builder per part file: a repeated id would start two builders on the same file
const parts = (a.parts || []).filter((p, i, all) => p && p.id && all.findIndex((q) => q && q.id === p.id) === i)
const joints = (a.joints || []).filter((j) => j && j.a && j.b)
const ROUND = a.round || 1

if (!a.asset || !a.blender || !a.scripts || (!parts.length && !a.review)) {
  log('Нет папки модели, пути к Blender, скриптов или ни одной части — делать нечего.')
  return { ok: false, reason: 'asset, blender and scripts are required, and parts must be non-empty unless review is set' }
}

const work = `${a.asset}\\work\\r${ROUND}`
const where = [
  `Asset folder: ${a.asset} (brief.md, dims.py, parts\\, ref\\, work\\calib.blend).`,
  `Blender: ${a.blender}. Scripts: ${a.scripts}.`,
].join('\n')

const BUILD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'passed', 'part_iou', 'fail', 'deviations', 'inferred', 'file', 'out', 'questions'],
  properties: {
    id: { type: 'string' },
    passed: { type: 'boolean', description: 'the last runner result on the part has no fail entries' },
    part_iou: { type: 'object', additionalProperties: { type: 'number' }, description: 'view -> part_iou of the last run' },
    fail: { type: 'array', items: { type: 'string' }, description: 'fail entries of the last run' },
    deviations: { type: 'array', items: { type: 'string' }, description: 'remaining measured deviations, each with its reason' },
    inferred: { type: 'array', items: { type: 'string' }, description: 'what the references do not show and what was assumed' },
    file: { type: 'string' },
    out: { type: 'string', description: 'output folder with result.json and the compare sheets' },
    questions: { type: 'array', items: { type: 'string' }, description: 'only what the director or owner must decide, e.g. a shared number in dims.py that is wrong' },
  },
}

const JOINT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['a', 'b', 'ok', 'fixed', 'unfixed'],
  properties: {
    a: { type: 'string' },
    b: { type: 'string' },
    ok: { type: 'boolean', description: 'the parts meet as real ones do and no changed part dropped below its gate' },
    fixed: { type: 'array', items: { type: 'string' }, description: 'one line per fix, with the file and the size of the change' },
    unfixed: { type: 'array', items: { type: 'string' }, description: 'what you could not fix, with the reason' },
  },
}

const REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['findings', 'overlap', 'sheets'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['part', 'severity', 'confidence', 'where', 'what'],
        properties: {
          part: { type: 'string', description: 'part id from dims.py, or "whole"' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          where: { type: 'string' },
          what: { type: 'string', description: 'the fault as a measurement where it can be measured' },
        },
      },
    },
    overlap: { type: 'object', additionalProperties: { type: 'number' }, description: 'view -> whole-model silhouette IoU' },
    sheets: { type: 'array', items: { type: 'string' }, description: 'paths of the pictures you looked at' },
  },
}

const unbuilt = (id) => ({ id, passed: false, part_iou: {}, fail: ['the builder did not finish'], deviations: [], inferred: [], file: '', out: '', questions: [] })
const built = []
const broken = new Set()
if (parts.length) {
  phase('Части')
  const res = await pipeline(parts, (p) => agent(
    [
      `Build part "${p.id}" of the asset.`,
      where,
      `Your part file: ${a.asset}\\parts\\${p.id}.py. Your output folder: ${work}\\${p.id}.`,
      p.notes ? `Notes for this round, apply every one:\n${p.notes}` : '',
    ].filter(Boolean).join('\n'),
    { label: `часть ${p.id}`, phase: 'Части', agentType: 'blender-modeling:blender-part-builder', schema: BUILD_SCHEMA },
  ))
  res.forEach((r, i) => {
    if (!r) broken.add(parts[i].id)
    built.push(r ? { ...r, id: parts[i].id } : unbuilt(parts[i].id))
  })
}

// A joint with a part whose builder failed this round is not checked: there is nothing finished to fit.
const jointResults = []
const toCheck = joints.filter((j) => !broken.has(j.a) && !broken.has(j.b))
if (toCheck.length) {
  phase('Стыки')
  // One after another: a-b and b-c may both edit part b.
  for (const j of toCheck) {
    const r = await agent(
      [`Check the joint between parts "${j.a}" and "${j.b}".`, where, `Your output folder: ${work}\\joints\\${j.a}-${j.b}.`].join('\n'),
      { label: `стык ${j.a} — ${j.b}`, phase: 'Стыки', agentType: 'blender-modeling:blender-joint-checker', schema: JOINT_SCHEMA },
    )
    jointResults.push(r ? { ...r, a: j.a, b: j.b } : { a: j.a, b: j.b, ok: false, fixed: [], unfixed: ['the joint checker did not finish'] })
  }
}
const skippedJoints = joints.filter((j) => broken.has(j.a) || broken.has(j.b))
  .map((j) => ({ a: j.a, b: j.b, ok: false, fixed: [], unfixed: ['not checked: a part of this joint was not built this round'] }))

let review = null
if (a.review) {
  phase('Ревью')
  review = await agent(
    [
      'Review the whole asset against its reference images.',
      where,
      `Your output folder: ${work}\\review. Parts built this round: ${parts.map((p) => p.id).join(', ') || 'none'}.`,
    ].join('\n'),
    { label: 'ревью', phase: 'Ревью', agentType: 'blender-modeling:blender-reviewer', schema: REVIEW_SCHEMA },
  )
}

const failed = built.filter((r) => !r.passed).map((r) => r.id)
const badJoints = jointResults.concat(skippedJoints).filter((r) => !r.ok).map((r) => `${r.a} — ${r.b}`)
const high = review ? review.findings.filter((f) => f.severity === 'high').length : 0
log([
  parts.length ? (failed.length ? `Не прошли проверку: ${failed.join(', ')}` : `Все ${built.length} частей прошли проверку`) : '',
  badJoints.length ? `стыки не сошлись: ${badJoints.join(', ')}` : '',
  review ? `ревьюер: ${review.findings.length} замечаний, серьёзных ${high}` : (a.review ? 'ревьюер не закончил' : ''),
].filter(Boolean).join('; '))
return { round: ROUND, parts: built, joints: jointResults.concat(skippedJoints), review }
