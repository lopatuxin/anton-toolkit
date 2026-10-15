export const meta = {
  name: 'yt-motion-build',
  description: 'Моушен-сцены ролика: исполнители Opus рисуют или оживляют каждую свою сцену параллельно, Sonnet проверяет и чинит технические огрехи, стыки соседних сцен сверяются',
  phases: [
    { title: 'Сцены', detail: 'исполнитель Opus на сцену, все параллельно' },
    { title: 'Проверка', detail: 'Sonnet: check и кадры; чинит технику, замечания по виду — режиссёру' },
    { title: 'Стыки', detail: 'конец сцены N против начала сцены N+1' },
  ],
}

// args:
//   mode          'sketch' — a still key frame (the style round); 'animate' — draw the scene and animate it;
//                 'fix' — apply the director's batch of notes to an animated scene
//   plan          absolute path to motion\STORYBOARD.md
//   workerRole    absolute path to references/scene-worker.md
//   checkerRole   absolute path to references/scene-checker.md
//   hfSkills      absolute path to the HyperFrames skills folder
//   scenes        [{ id, dir, frame, block, notes }] — dir: the scene's HyperFrames project; frame: the style
//                 spec to draw in; block: the plan block to build when it differs from id (the style round
//                 draws one block once per candidate); notes: the director's notes for this scene
//   handoffs      [{ from, to }] — ids of adjacent motion scenes whose seam must match (animate / fix)

const a = args || {}
const MODE = a.mode
const scenes = (a.scenes || []).filter((s) => s && s.id && s.dir)
const handoffs = (a.handoffs || []).filter((h) => h && h.from && h.to)

if (!['sketch', 'animate', 'fix'].includes(MODE) || !scenes.length) {
  log('Нет режима или ни одной сцены — делать нечего.')
  return { ok: false, reason: 'mode must be sketch | animate | fix and scenes must be non-empty' }
}

const CHECK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'ok', 'fixed', 'unfixed', 'artNotes'],
  properties: {
    id: { type: 'string' },
    ok: { type: 'boolean', description: 'hyperframes check passes and the scene matches its plan block after your fixes' },
    fixed: { type: 'array', items: { type: 'string' }, description: 'technical faults found and fixed, one line each' },
    unfixed: { type: 'array', items: { type: 'string' }, description: 'technical faults you could not fix, with the reason' },
    artNotes: { type: 'array', items: { type: 'string' }, description: 'taste and storytelling remarks for the director, not acted on' },
  },
}

const SEAM_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['from', 'to', 'ok', 'fixed', 'unfixed'],
  properties: {
    from: { type: 'string' },
    to: { type: 'string' },
    ok: { type: 'boolean', description: 'the last frame of `from` and the first frame of `to` match the planned seam' },
    fixed: { type: 'array', items: { type: 'string' } },
    unfixed: { type: 'array', items: { type: 'string' }, description: 'seam differences you could not fix, with the reason' },
    artNotes: { type: 'array', items: { type: 'string' } },
  },
}

const common = (s) => [
  `Mode: ${MODE}.`,
  `Scene id: ${s.id}. Scene project folder: ${s.dir}.`,
  `Style spec: ${s.frame}.`,
  `Plan: ${a.plan} — your scene is the block headed "Scene ${s.block || s.id}"; read the decisions above the first scene too.`,
  `HyperFrames skills: ${a.hfSkills}.`,
].join('\n')

// The director's notes go to the worker only: the checker never acts on taste.
const workerPrompt = (s) => `Read ${a.workerRole} and follow it — it is your whole role.\n\n${common(s)}` +
  (s.notes ? `\nDirector's notes for this scene, apply every one:\n${s.notes}` : '')

phase('Сцены')
const results = await pipeline(
  scenes,
  (s) => agent(workerPrompt(s), { label: `сцена ${s.id}`, phase: 'Сцены', model: 'opus', effort: 'medium' }),
  // The checker sees what the worker reported; a worker that did not finish is a failure, not something to check.
  (worker, s) => (worker == null
    ? { id: s.id, ok: false, fixed: [], unfixed: ['the scene worker did not finish'], artNotes: [], worker: null }
    : agent(
      `Read ${a.checkerRole} and follow it — it is your whole role.\n\n${common(s)}\n\nThe worker reported:\n${worker}`,
      { label: `проверка ${s.id}`, phase: 'Проверка', model: 'sonnet', effort: 'medium', schema: CHECK_SCHEMA },
    ).then((r) => (r
      ? { ...r, id: s.id, worker }
      : { id: s.id, ok: false, fixed: [], unfixed: ['the checker did not finish'], artNotes: [], worker }))),
)

const checked = results.map((r, i) => r || { id: scenes[i].id, ok: false, fixed: [], unfixed: ['the scene did not finish'], artNotes: [], worker: null })
const unbuilt = new Set(checked.filter((r) => r.worker == null).map((r) => r.id))
const dirOf = new Map(scenes.map((s) => [s.id, s.dir]))
const touched = MODE === 'sketch' ? [] : handoffs.filter((h) => dirOf.has(h.from) || dirOf.has(h.to))
// A seam with a scene whose worker failed in this run is not checked: there is nothing finished to match.
const seams = touched.filter((h) => !unbuilt.has(h.from) && !unbuilt.has(h.to))
const skipped = touched.filter((h) => unbuilt.has(h.from) || unbuilt.has(h.to))
  .map((h) => ({ from: h.from, to: h.to, ok: false, fixed: [], unfixed: ['not checked: a scene of this seam was not built in this run'] }))
const seamResults = []
if (seams.length) {
  phase('Стыки')
  // A seam needs both scenes finished, so this waits for the whole pipeline above. Seams run one after
  // another: A→B and B→C may both edit scene B.
  for (const h of seams) {
    seamResults.push(await agent(
      [
        `Read ${a.checkerRole}, section "Seam check", and follow it.`,
        `Seam: the end of scene ${h.from} must hand over to the start of scene ${h.to}.`,
        `Plan: ${a.plan}. HyperFrames skills: ${a.hfSkills}.`,
        `Scene folders: ${h.from} → ${dirOf.get(h.from) || '(not in this run: find it next to the other scene folder)'}; ` +
          `${h.to} → ${dirOf.get(h.to) || '(not in this run: find it next to the other scene folder)'}.`,
      ].join('\n'),
      { label: `стык ${h.from} → ${h.to}`, phase: 'Стыки', model: 'sonnet', effort: 'medium', schema: SEAM_SCHEMA },
    ))
  }
}

const seamsOut = seamResults.map((r, i) => (r
  ? { ...r, from: seams[i].from, to: seams[i].to }
  : { from: seams[i].from, to: seams[i].to, ok: false, fixed: [], unfixed: ['the seam check did not finish'] }))
  .concat(skipped)
const bad = checked.filter((r) => !r.ok).map((r) => r.id)
const badSeams = seamsOut.filter((r) => !r.ok).map((r) => `${r.from} → ${r.to}`)
log([
  bad.length ? `Не прошли проверку: ${bad.join(', ')}` : `Все ${checked.length} сцен прошли проверку`,
  badSeams.length ? `стыки не сошлись: ${badSeams.join(', ')}` : '',
].filter(Boolean).join('; '))
return { mode: MODE, scenes: checked, seams: seamsOut }
