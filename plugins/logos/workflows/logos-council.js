export const meta = {
  name: 'logos-council',
  description: 'Совет архитекторов Logos: скелет, параллельные вклады ролей, ответы по адресатам, синтез документа',
  phases: [
    { title: 'Скелет', detail: 'ведущий кладёт рамку документа' },
    { title: 'Вклады', detail: 'каждая роль пишет свою часть параллельно' },
    { title: 'Ответы', detail: 'роли отвечают на адресованные им вопросы' },
    { title: 'Синтез', detail: 'синтезатор собирает итоговый документ' },
  ],
}

// args:
//   target      'architecture' | 'module'
//   element     имя элемента (только для target='module'), например 'Память'
//   roles       список ролей раунда вкладов без ведущего, например ['память','модели','ресурсы']
//   constraints ограничения хозяина, дословно
//   paths       { source, scratch, skeleton, final }
//   refs        { roles, templates } — абсолютные пути к справочникам плагина

const a = args || {}
const isModule = a.target === 'module'
const element = a.element || ''
const paths = a.paths || {}
const scratch = paths.scratch
const skeleton = paths.skeleton
const finalPath = paths.final
const source = paths.source
const constraints = a.constraints || '(ограничения не заданы)'
const refs = a.refs || {}
const rolesRef = refs.roles || '${CLAUDE_PLUGIN_ROOT}/references/council-roles.md'
const templatesRef = refs.templates || '${CLAUDE_PLUGIN_ROOT}/references/design-templates.md'

const LEAD = 'оркестрация'
const ALL_ROLES = [LEAD, 'память', 'модели', 'автономность', 'фронтенд', 'ресурсы']
const roles = (a.roles && a.roles.length ? a.roles : ALL_ROLES.slice(1)).filter((r) => r !== LEAD)
const roster = [LEAD].concat(roles)

const MEMBER = 'logos:logos-council-member'
const SYNTH = 'logos:logos-synthesizer'

const targetLine = isModule
  ? `Предмет: модуль «${element}» — детализация одного элемента системы. Структура — шаблон «Модуль» и протокол «Детализация модуля» в ${templatesRef}.`
  : `Предмет: архитектура системы целиком. Структура — шаблон «Архитектура» (одиннадцать разделов) в ${templatesRef}.`

const sourceLine = isModule
  ? `Источник истины (прочитать полностью): ${source} — архитектура, против которой детализируется элемент.`
  : `Источник истины (прочитать полностью): ${source} — концепт, он говорит ЧТО строим.`

function memberFile(role) {
  return isModule
    ? `${scratch}/Вклад-модуля-${element}-${role}.md`
    : `${scratch}/Вклад-${role}.md`
}

function common(role, mode) {
  return [
    `Твоя роль: ${role}. Твой режим: ${mode}.`,
    `Линза роли и владение разделами — раздел «${role}» файла ${rolesRef}. Читай только свой раздел и таблицу ролей.`,
    targetLine,
    sourceLine,
    `Скелет совета: ${skeleton}.`,
    `Состав совета этого раунда: ${roster.join(' · ')} (ведущий — ${LEAD}).`,
    `Ограничения хозяина (жёсткие границы, нарушать нельзя): ${constraints}`,
  ].join('\n')
}

const CONTRIBUTE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['role', 'summary', 'questions'],
  properties: {
    role: { type: 'string' },
    summary: { type: 'string', description: 'что записано в свой файл, 2–4 строки по-русски' },
    questions: {
      type: 'array',
      description: 'вопросы к другим ролям; пустой список — нормальный ответ',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['to', 'section', 'concern'],
        properties: {
          to: { type: 'string', description: 'роль-адресат: оркестрация, память, модели, автономность, фронтенд или ресурсы' },
          section: { type: 'string', description: 'раздел документа, о котором вопрос' },
          concern: { type: 'string', description: 'в чём риск или возражение, 1–3 предложения по-русски' },
        },
      },
    },
  },
}

const RESOLVE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['role', 'resolutions', 'concerns'],
  properties: {
    role: { type: 'string' },
    resolutions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['question', 'verdict', 'note'],
        properties: {
          question: { type: 'string', description: 'идентификатор вопроса из промпта, например В3' },
          verdict: { type: 'string', enum: ['исправил', 'отстоял', 'выкинул', 'в открытые вопросы'] },
          note: { type: 'string', description: 'резолюция одной строкой по-русски' },
        },
      },
    },
    concerns: {
      type: 'array',
      description: 'возражения к чужим вкладам, которые остались нерешёнными и уходят синтезатору',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['about', 'concern'],
        properties: {
          about: { type: 'string', description: 'чья часть и какой раздел' },
          concern: { type: 'string' },
        },
      },
    },
  },
}

const SYNTH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['decisions', 'debates'],
  properties: {
    decisions: { type: 'array', items: { type: 'string' }, description: 'ключевые решения, по строке' },
    debates: { type: 'array', items: { type: 'string' }, description: 'ключевые споры и как разрешены, по строке' },
    open: { type: 'array', items: { type: 'string' }, description: 'что осталось для хозяина' },
  },
}

function normalizeRole(raw) {
  const s = String(raw || '').toLowerCase()
  for (const r of ALL_ROLES) {
    if (s.indexOf(r) !== -1) return r
  }
  return null
}

phase('Скелет')

const skeletonPrompt = [
  common(LEAD, 'skeleton'),
  `Создай скелет по шаблону в файле ${skeleton}: заполни ВСЕ разделы шаблона на верхнем уровне, свой раздел сделай глубоким, глубокие решения остальных ролей оставь пунктами в разделе открытых вопросов — их закроют специалисты.`,
  'Первой строкой файла поставь метку черновика из справочника шаблонов. Вопросов в этом режиме не поднимаешь.',
].join('\n')

const skeletonReport = await agent(skeletonPrompt, {
  agentType: MEMBER,
  label: `скелет · ${LEAD}`,
  phase: 'Скелет',
})

if (!skeletonReport) {
  log('Скелет не написан — совет остановлен.')
  return { ok: false, reason: 'скелет не написан' }
}

phase('Вклады')
log(`Раунд вкладов: ${roles.length} ролей параллельно.`)

function contributePrompt(role) {
  return [
    common(role, 'contribute'),
    `Твой файл (создай и пиши только его): ${memberFile(role)}.`,
    'Чужие файлы этого раунда пишутся прямо сейчас параллельно — ты их не видишь и не трогаешь.',
    '1) Напиши свою часть: конкретные решения своей линзы, а не пересказ рамки ведущего. Правки в сквозные разделы — отдельным блоком в конце своего файла.',
    '2) Прочитай скелет критически и подними вопросы к ролям-владельцам слабых мест. Мелочи не поднимай; если возражений нет — верни пустой список.',
  ].join('\n')
}

const contributions = (
  await parallel(
    roles.map((role) => () =>
      agent(contributePrompt(role), {
        agentType: MEMBER,
        label: `вклад · ${role}`,
        phase: 'Вклады',
        schema: CONTRIBUTE_SCHEMA,
      })
    )
  )
).filter(Boolean)

if (contributions.length < roles.length) {
  log(`Вклады написали ${contributions.length} из ${roles.length} ролей — недостающие роли выпали, синтез пойдёт без них.`)
}

// Барьер здесь настоящий: маршрутизация вопросов требует их все сразу.
const questionsFor = {}
const unrouted = []
let counter = 0
for (const c of contributions) {
  const from = normalizeRole(c.role) || c.role
  for (const q of c.questions || []) {
    const to = normalizeRole(q.to)
    if (!to || roster.indexOf(to) === -1) {
      log(`Вопрос от «${from}» адресован роли «${q.to}», которой нет в составе — уйдёт синтезатору как замечание.`)
      unrouted.push(`«${from}» о «${q.section}»: ${q.concern}`)
      continue
    }
    counter += 1
    const item = { id: `В${counter}`, from: from, to: to, section: q.section, concern: q.concern }
    questionsFor[to] = (questionsFor[to] || []).concat([item])
  }
}
const allQuestions = roster.reduce((acc, r) => acc.concat(questionsFor[r] || []), [])
log(`Совет поднял вопросов: ${allQuestions.length}.`)

phase('Ответы')

// Отвечают адресаты; ведущий и ресурсный реалист идут всегда — они сверяют собранное
// целое: ведущий на связность управления, ресурсы на бюджет против амбиций всех остальных.
const always = roster.filter((r) => r === LEAD || r === 'ресурсы')
const resolveRoles = roster.filter((r) => (questionsFor[r] && questionsFor[r].length) || always.indexOf(r) !== -1)

function resolvePrompt(role) {
  const mine = questionsFor[role] || []
  const quoted = mine.length
    ? mine
        .map((q) => `${q.id} (от «${q.from}», раздел «${q.section}»): ${q.concern}`)
        .join('\n')
    : '(вопросов к тебе нет)'
  const files = roster
    .filter((r) => r !== LEAD)
    .map((r) => `${r}: ${memberFile(r)}`)
    .join('\n')
  return [
    common(role, 'resolve'),
    `Твой файл (правишь только его): ${role === LEAD ? skeleton : memberFile(role)}.`,
    `Файлы остальных ролей — прочитай все, они уже написаны:\n${files}`,
    `Вопросы к тебе:\n${quoted}`,
    'На каждый вопрос дай ответ: исправил, отстоял, выкинул или в открытые вопросы. В поле question верни идентификатор вопроса (В1, В2, …).',
    'Затем сверь свою часть с чужими. Своё чини сам; если неправа чужая часть — не трогай её, а верни возражение в concerns, его закроет синтезатор.',
    role === 'ресурсы'
      ? 'Ты видишь амбиции всех ролей разом — назови конкретно, что не влезает в бюджет и чем это заменить.'
      : 'Следующего раунда не будет: позицию излагай ясно и один раз.',
  ].join('\n')
}

const resolutions = resolveRoles.length
  ? (
      await parallel(
        resolveRoles.map((role) => () =>
          agent(resolvePrompt(role), {
            agentType: MEMBER,
            label: `ответы · ${role}`,
            phase: 'Ответы',
            schema: RESOLVE_SCHEMA,
          })
        )
      )
    ).filter(Boolean)
  : []

phase('Синтез')

const answers = {}
for (const r of resolutions) {
  const who = normalizeRole(r.role) || r.role
  for (const res of r.resolutions || []) {
    answers[String(res.question).trim()] = `${who}, ${res.verdict}: ${res.note}`
  }
}

const debateText = allQuestions.length
  ? allQuestions
      .map((q) => {
        const ans = answers[q.id] || 'ответа не поступило — реши сам или вынеси в открытые вопросы'
        return `${q.id}. «${q.from}» → «${q.to}», раздел «${q.section}»: ${q.concern}\n   Ответ: ${ans}`
      })
      .join('\n')
  : '(вопросов совет не поднял)'

const concernList = resolutions
  .reduce((acc, r) => acc.concat((r.concerns || []).map((c) => `«${normalizeRole(r.role) || r.role}» о ${c.about}: ${c.concern}`)), [])
  .concat(unrouted)

const concernsText = concernList.join('\n')

const memberFiles = roles.map((r) => `${r}: ${memberFile(r)}`).join('\n')

const synthPrompt = [
  isModule
    ? `Закрой раунд детализации модуля «${element}».`
    : 'Закрой работу совета над архитектурой.',
  sourceLine,
  `Скелет (в нём же часть ведущего): ${skeleton}.`,
  `Файлы ролей — прочитай все:\n${memberFiles}`,
  `Итоговый документ: ${finalPath}. Структура — ${isModule ? 'шаблон «Модуль» и протокол «Детализация модуля»' : 'шаблон «Архитектура», все одиннадцать разделов'} в ${templatesRef}.`,
  `Ограничения хозяина (жёсткие границы): ${constraints}`,
  `Спор совета:\n${debateText}`,
  concernsText ? `Нерешённые возражения — закрой их сам или вынеси в открытые вопросы:\n${concernsText}` : 'Нерешённых возражений раунд ответов не оставил.',
  'Собирай, а не переигрывай: решения уже приняты, твоя работа — сшить части в один документ и вычистить лишние механизмы.',
].join('\n')

const synthesis = await agent(synthPrompt, {
  agentType: SYNTH,
  label: isModule ? `синтез · модуль ${element}` : 'синтез · архитектура',
  phase: 'Синтез',
  schema: SYNTH_SCHEMA,
})

if (!synthesis) {
  log('Синтезатор не вернул отчёт — итоговый документ мог остаться ненаписанным, проверь файл.')
  return { ok: false, reason: 'синтез не выполнен', final: finalPath, scratch: scratch }
}

return {
  ok: true,
  final: finalPath,
  scratch: scratch,
  contributors: contributions.map((c) => c.role),
  questions: allQuestions.length,
  decisions: synthesis.decisions || [],
  debates: synthesis.debates || [],
  open: synthesis.open || [],
}
