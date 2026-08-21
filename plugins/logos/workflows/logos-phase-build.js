export const meta = {
  name: 'logos-phase-build',
  description: 'Сборка одной фазы Logos: кодеры, сторож доктрины, ревью с проверкой находок, тесты и стенд, QA, сверка с документацией',
  phases: [
    { title: 'Реализация', detail: 'бэкенд и веб-клиент' },
    { title: 'Сторож доктрины', detail: 'объём прозы в диффе и история в инфра-файлах' },
    { title: 'Ревью', detail: 'ревью, состязательная проверка находок, круг правок' },
    { title: 'Тесты и стенд', detail: 'тесты по критериям готовности и локальный деплой' },
    { title: 'Проверка', detail: 'QA против критериев готовности' },
    { title: 'Сверка', detail: 'расхождения кода и документации' },
    { title: 'Финальное ревью', detail: 'дельта после тестов и правок, отметка ревью' },
  ],
}

// args:
//   code, docs        абсолютные пути: репозиторий кода, корень документации
//   phaseFile         путь к документу фазы
//   phaseNumber       номер фазы, строкой
//   sections          разделы архитектуры, затрагиваемые фазой
//   scopeOut          «Что НЕ входит», дословно
//   plan              план сборки: слой → стек
//   touchesFrontend   строит ли фаза веб-клиент
//   contractsPinned   зафиксированы ли контракты бэкенда в документе фазы
//   refs              { project } — абсолютный путь к logos-project.md

const a = args || {}
const CODE = a.code
const DOCS = a.docs
const phaseFile = a.phaseFile
const phaseNumber = String(a.phaseNumber || '')
const sections = a.sections || '(разделы не названы)'
const scopeOut = a.scopeOut || '(границы не заданы)'
const plan = a.plan || '(план не передан)'
const touchesFrontend = a.touchesFrontend !== false
const contractsPinned = a.contractsPinned === true
const projectRef = (a.refs && a.refs.project) || '${CLAUDE_PLUGIN_ROOT}/references/logos-project.md'

const CODER = 'logos:logos-coder'
const FRONT = 'logos:logos-frontend-coder'
const REVIEWER = 'logos:logos-reviewer'
const TESTER = 'logos:logos-test-writer'
const DEVOPS = 'logos:logos-devops'
const QA = 'logos:logos-qa'
const SYNC = 'logos:logos-sync'

const VERIFY_CAP = 4

const base = [
  `Репозиторий кода: ${CODE}. Документация: ${DOCS}.`,
  `Документ фазы (прочитать целиком): ${phaseFile}.`,
  `Источник истины — архитектура ${DOCS}/Дизайн/Архитектура.md, разделы: ${sections}.`,
  `Жёсткие границы фазы (вперёд не строить): ${scopeOut}`,
].join('\n')

const ROUTING = `Правило маршрутизации находок (§5 в ${projectRef}): в код уходит только баг в том, что просила спецификация. Плохое поведение модели, сбой провайдера и «упало с исключением» механизмами не лечатся — первое уходит хозяину как наблюдение, второе живёт штатным ретраем провайдера и честной ошибкой, третье показывается хозяину, а не проглатывается. Если правка требует механизма, которого нет в документах, ничего не выдумывай: верни это в ownerQuestions.`

const CODER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['files', 'summary', 'commentAudit'],
  properties: {
    files: { type: 'array', items: { type: 'string' }, description: 'файл — что сделано, по строке' },
    summary: { type: 'string' },
    version: { type: 'string', description: 'новый PRODUCT_VERSION, если менялся' },
    contracts: { type: 'string', description: 'контракты для веб-клиента: эндпоинты и кадры WS' },
    drift: { type: 'string', description: 'расхождения с документами, которые пришлось внести' },
    commentAudit: { type: 'string', description: 'самопроверка комментариев: сколько удалено, сколько оставлено' },
    ownerQuestions: { type: 'array', items: { type: 'string' } },
  },
}

const GUARD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['proseShare', 'infraHits', 'foreignFacts'],
  properties: {
    proseShare: { type: 'number', description: 'доля прозы среди добавленных строк, в процентах' },
    infraHits: { type: 'array', items: { type: 'string' }, description: 'file:line с фазовой историей в инфра-файлах' },
    foreignFacts: { type: 'array', items: { type: 'string' }, description: 'file:line комментариев, утверждающих факт из чужого файла' },
    note: { type: 'string' },
  },
}

const REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['findings', 'deletable'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['area', 'where', 'summary', 'blocking'],
        properties: {
          area: { type: 'string', description: 'backend, frontend или infra' },
          where: { type: 'string', description: 'файл:строка' },
          summary: { type: 'string' },
          blocking: { type: 'boolean' },
        },
      },
    },
    deletable: { type: 'array', items: { type: 'string' }, description: 'что диффу можно удалить' },
    note: { type: 'string' },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['real', 'why'],
  properties: {
    real: { type: 'boolean' },
    why: { type: 'string' },
  },
}

const QA_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['versionOk', 'bugs', 'verdict'],
  properties: {
    versionOk: { type: 'boolean', description: 'GET /api/version отдаёт только что собранную версию' },
    bugs: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['area', 'summary'],
        properties: {
          area: { type: 'string', description: 'backend, frontend, deploy или model' },
          summary: { type: 'string' },
          steps: { type: 'string' },
        },
      },
    },
    verdict: { type: 'string', description: 'прошла фаза критерии готовности или нет, одной строкой' },
    ownerQuestions: { type: 'array', items: { type: 'string' } },
  },
}

const SYNC_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['drift', 'docHealth', 'verifiedClean'],
  properties: {
    drift: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['side', 'where', 'what'],
        properties: {
          side: { type: 'string', description: 'code — неправ код, docs — неправы документы' },
          where: { type: 'string' },
          what: { type: 'string' },
        },
      },
    },
    docHealth: { type: 'array', items: { type: 'string' }, description: 'битые ссылки, сироты, переросшие документы, противоречия' },
    verifiedClean: { type: 'array', items: { type: 'string' }, description: 'документы, сверенные и чистые — их штампует оркестратор' },
  },
}

const ownerQuestions = []
function collectOwner(r) {
  if (r && r.ownerQuestions) {
    for (const q of r.ownerQuestions) ownerQuestions.push(q)
  }
}

phase('Реализация')

const backendPrompt = [
  base,
  `План сборки, слой → стек: ${plan}`,
  'Реализуй только серверные слои этой фазы — веб-клиент строит logos-frontend-coder, браузерный код не пиши.',
  `Подними PRODUCT_VERSION в gateway/app/version.py по §9 в ${projectRef}: обычный semver по смыслу выпуска, не по номеру фазы. Это правка одной строки — без абзаца о том, что фаза принесла.`,
  'Верни: файлы и что в них сделано, новую версию, контракты для веб-клиента, вынужденные расхождения с документами и строку самопроверки комментариев.',
].join('\n')

const frontendPromptBase = [
  base,
  `Спецификация веб-интерфейса: ${DOCS}/Дизайн/Веб-интерфейс/ — хаб и страницы экранов этой фазы.`,
  'Строй только веб-часть фазы. Переиспользуй сложившийся стиль Logos: существующие токены, компоненты, каркас страницы, соглашения CSS. Новый визуальный язык не изобретай.',
  'Тонкий клиент: источника истины и бизнес-логики на клиенте нет; версию продукта читай через GET /api/version и не меняй.',
  'Верни: файлы и что в них сделано, как закрыты критерии готовности, что переиспользовал, расхождения с документами и строку самопроверки комментариев.',
].join('\n')

let backend = null
let frontend = null

if (touchesFrontend && contractsPinned) {
  log('Контракты зафиксированы в документе фазы — бэкенд и веб-клиент идут параллельно.')
  const both = await parallel([
    () => agent(backendPrompt, { agentType: CODER, label: 'бэкенд', phase: 'Реализация', schema: CODER_SCHEMA }),
    () =>
      agent(
        [frontendPromptBase, 'Контракты бэкенда бери из документа фазы — они там зафиксированы; бэкенд пишется параллельно.'].join('\n'),
        { agentType: FRONT, label: 'веб-клиент', phase: 'Реализация', schema: CODER_SCHEMA }
      ),
  ])
  backend = both[0]
  frontend = both[1]
} else {
  backend = await agent(backendPrompt, { agentType: CODER, label: 'бэкенд', phase: 'Реализация', schema: CODER_SCHEMA })
  if (touchesFrontend) {
    frontend = await agent(
      [frontendPromptBase, `Контракты бэкенда, которые надо потреблять: ${(backend && backend.contracts) || 'бэкенд их не вернул — прочитай код гейтвея'}`].join('\n'),
      { agentType: FRONT, label: 'веб-клиент', phase: 'Реализация', schema: CODER_SCHEMA }
    )
  }
}

collectOwner(backend)
collectOwner(frontend)

if (!backend && !frontend) {
  log('Кодеры не отработали — сборка остановлена.')
  return { ok: false, reason: 'реализация не выполнена' }
}

function fixerFor(area) {
  const s = String(area || '').toLowerCase()
  if (s.indexOf('front') !== -1 || s.indexOf('фронт') !== -1 || s.indexOf('веб') !== -1) return FRONT
  if (s.indexOf('infra') !== -1 || s.indexOf('deploy') !== -1 || s.indexOf('devops') !== -1 || s.indexOf('стенд') !== -1) return DEVOPS
  return CODER
}

function fixerLabel(t) {
  if (t === FRONT) return 'правки · веб-клиент'
  if (t === DEVOPS) return 'правки · стенд'
  return 'правки · бэкенд'
}

async function dispatchFixes(items, phaseTitle, extra) {
  const byFixer = {}
  for (const it of items) {
    const t = fixerFor(it.area)
    byFixer[t] = (byFixer[t] || []).concat([it])
  }
  const targets = Object.keys(byFixer)
  if (!targets.length) return []
  return (
    await parallel(
      targets.map((t) => () =>
        agent(
          [
            base,
            'Почини найденное в уже написанном коде фазы. Ничего сверх списка не строй.',
            byFixer[t].map((x, i) => `${i + 1}. ${x.where ? x.where + ' — ' : ''}${x.summary}`).join('\n'),
            extra || '',
            ROUTING,
            'Верни: что исправил и что удалил.',
          ].join('\n'),
          { agentType: t, label: fixerLabel(t), phase: phaseTitle, schema: CODER_SCHEMA }
        )
      )
    )
  ).filter(Boolean)
}

phase('Сторож доктрины')

const guardPrompt = [
  `Репозиторий кода: ${CODE}.`,
  'Ты проверяешь дифф этой фазы против двух правил доктрины, которые пофайловый хук поймать не может. Код не меняешь.',
  '1. Объём прозы. Посчитай долю комментариев среди добавленных строк:',
  `git -C "${CODE}" diff main --unified=0 -- 'gateway/app' 'web/src' | grep -E '^\\+' | grep -vE '^\\+\\+\\+'`,
  'Строка считается прозой, если после плюса идёт #, //, * или тройная кавычка. Верни долю в процентах.',
  '2. История в инфра-файлах. Найди пофазный нарратив в docker-compose.yml, gateway/.env.example и RUN.md:',
  `grep -nE 'Фаза-[0-9]|What changed in Phase|Verify.*Phase-?[0-9]|Carried over from Phase' "${CODE}/docker-compose.yml" "${CODE}/gateway/.env.example" "${CODE}/RUN.md"`,
  '3. Прочитай сами добавленные комментарии. Верни те, что утверждают факт, которым владеет ДРУГОЙ файл: кто это вызывает, какая кнопка есть в интерфейсе, «единственный эндпоинт, который…», имя поля или маршрута, процитированное там, где на него лишь ссылаются. Такой комментарий верен в день написания и лжив в день переезда чужого файла.',
  'Форма spec: Фазы/Фаза-NN-имя.md — разрешённое исключение, это не история.',
].join('\n')

let guard = await agent(guardPrompt, { label: 'сторож доктрины', phase: 'Сторож доктрины', effort: 'low', schema: GUARD_SCHEMA })

if (guard && guard.infraHits && guard.infraHits.length) {
  log(`История в инфра-файлах: ${guard.infraHits.length} мест — отправляю devops удалить.`)
  await agent(
    [
      base,
      'Удали пофазный нарратив из инфра-артефактов — это блокер, а не придирка:',
      guard.infraHits.join('\n'),
      'Заодно убери из compose переменные окружения, продублированные значением по умолчанию из config/defaults.py: у значения один источник, compose несёт только топологию и осознанно недефолтные значения.',
      'Верни: что удалил.',
    ].join('\n'),
    { agentType: DEVOPS, label: 'чистка инфра-файлов', phase: 'Сторож доктрины', schema: CODER_SCHEMA }
  )
  guard = await agent(guardPrompt, { label: 'сторож доктрины (повтор)', phase: 'Сторож доктрины', effort: 'low', schema: GUARD_SCHEMA })
}

if (guard && (guard.proseShare > 25 || (guard.foreignFacts && guard.foreignFacts.length))) {
  const items = []
  if (guard.proseShare > 25) {
    items.push({
      area: 'backend',
      summary: `Проза составляет ${guard.proseShare}% добавленных строк — самопроверку комментариев ты не делал. Прогони её: удали всё, что пересказывает код, и верни числа.`,
    })
  }
  for (const f of guard.foreignFacts || []) {
    items.push({ area: f.indexOf('web/') !== -1 ? 'frontend' : 'backend', where: f, summary: 'Комментарий утверждает факт из чужого файла — удалить, а не «обновить по факту».' })
  }
  log(`Сторож вернул ${items.length} замечаний до ревью — правлю до того, как ревьюер увидит дифф.`)
  await dispatchFixes(items, 'Сторож доктрины', 'Комментарии удаляются, а не переписываются.')
}

phase('Ревью')

const reviewPrompt = [
  base,
  'Отревьюй дифф фазы против документов и доктрины: настоящие баги и дыры, механизмы, которых не просила спецификация, комментарии с чужими фактами, боги-модули, история в коде.',
  'Для каждой находки укажи область (backend, frontend, infra), файл:строку, суть и блокер ли это. Отдельно верни список того, что диффу можно удалить.',
  'В конце запиши отметку ревью по файлам, которые смотрел.',
].join('\n')

let review = await agent(reviewPrompt, { agentType: REVIEWER, label: 'ревью', phase: 'Ревью', schema: REVIEW_SCHEMA })

let confirmed = []
// Находки, которые правил последний круг: повторного ревью на них уже не было, их проверяет только дельта-ревью.
let unclosed = []
if (review && review.findings && review.findings.length) {
  const blocking = review.findings.filter((f) => f.blocking)
  const toVerify = blocking.slice(0, VERIFY_CAP)
  if (blocking.length > toVerify.length) {
    log(`Блокеров ${blocking.length}, состязательно проверяю первые ${toVerify.length}; остальные идут в правки без проверки.`)
  }
  const verdicts = await parallel(
    toVerify.map((f) => () =>
      agent(
        [
          `Репозиторий кода: ${CODE}. Документ фазы: ${phaseFile}.`,
          `Находка ревью: ${f.where} — ${f.summary}`,
          'Твоя задача — опровергнуть её. Открой это место в коде и проверь: правда ли там баг, правда ли этого механизма нет в спецификации, правда ли комментарий утверждает чужой факт.',
          'Если сомневаешься — считай находку ложной: цена лишнего круга правок выше цены пропущенной придирки.',
          'Верни: real — настоящая ли находка, why — на чём основан вывод.',
        ].join('\n'),
        { label: `проверка · ${f.where || 'находка'}`, phase: 'Ревью', effort: 'medium', schema: VERDICT_SCHEMA }
      )
    )
  )
  const checked = toVerify.filter((f, i) => verdicts[i] && verdicts[i].real)
  const dropped = toVerify.length - checked.length
  if (dropped) log(`Состязательная проверка отсеяла ложных находок: ${dropped}.`)
  confirmed = checked.concat(blocking.slice(toVerify.length))
}

if (confirmed.length) {
  const deletable = review.deletable && review.deletable.length ? `Заодно удали то, что ревьюер назвал лишним:\n${review.deletable.join('\n')}` : ''
  await dispatchFixes(confirmed, 'Ревью', deletable)
  const reReview = await agent(
    [base, 'Повторное ревью: посмотри файлы, изменённые после твоего прошлого прохода. Отметку ревью обнови.'].join('\n'),
    { agentType: REVIEWER, label: 'ревью (повтор)', phase: 'Ревью', schema: REVIEW_SCHEMA }
  )
  const stillBlocking = reReview && reReview.findings ? reReview.findings.filter((f) => f.blocking) : []
  if (stillBlocking.length) {
    log(`После круга правок осталось блокеров: ${stillBlocking.length} — второй и последний круг.`)
    unclosed = stillBlocking.map((f) => `${f.where} — ${f.summary}`)
    await dispatchFixes(stillBlocking, 'Ревью', '')
  }
  review = reReview || review
} else if (review && review.deletable && review.deletable.length) {
  await dispatchFixes(
    [{ area: 'backend', summary: `Удали лишнее, названное ревьюером:\n${review.deletable.join('\n')}` }],
    'Ревью',
    ''
  )
}

phase('Тесты и стенд')

const deployPrompt = [
  base,
  'Сделай фазу запускаемой по её стеку в рамках ресурсного бюджета архитектуры И разверни собранную версию на ЛОКАЛЬНОМ стенде: собери образы и перезапусти контейнеры, чтобы работала именно свежая сборка.',
  'Прод-стенд не трогаешь ни при каких условиях — его закрывает хук.',
  'Верни: что изменил в инфраструктуре и что сейчас запущено.',
].join('\n')

const testAndDeploy = await parallel([
  () =>
    agent(
      [base, 'Напиши машинно-проверяемые тесты на «Критерии готовности» фазы — на критерии, а не на каждую внутреннюю ветку. Механизм, которого нет ни в одном документе, тестами не закрепляй.', 'Верни: файлы тестов и какой критерий каким тестом закрыт.'].join('\n'),
      { agentType: TESTER, label: 'тесты', phase: 'Тесты и стенд', schema: CODER_SCHEMA }
    ),
  () => agent(deployPrompt, { agentType: DEVOPS, label: 'стенд', phase: 'Тесты и стенд', schema: CODER_SCHEMA }),
])

const tests = testAndDeploy[0]
const deploy = testAndDeploy[1]

phase('Проверка')

const qaPrompt = [
  base,
  `Сначала убедись, что стенд отдаёт только что собранную версию: GET /api/version должен совпасть с PRODUCT_VERSION (${(backend && backend.version) || 'см. gateway/app/version.py'}). Если версия старая — верни versionOk=false и не тестируй: PASS против старого образа недействителен.`,
  'Затем прогони фазу насквозь против «Критериев готовности», включая пути отказа, которые они называют: сбой провайдера хозяин должен увидеть, а не найти в логе.',
  'Каждый баг маршрутизируй областью: backend, frontend, deploy или model.',
  ROUTING,
].join('\n')

let qa = await agent(qaPrompt, { agentType: QA, label: 'QA', phase: 'Проверка', schema: QA_SCHEMA })
collectOwner(qa)

if (qa && qa.versionOk === false) {
  log('Стенд отдаёт старую версию — пересобираю и проверяю заново.')
  await agent([deployPrompt, 'Стенд отдаёт старую версию: пересобери образы и перезапусти.'].join('\n'), {
    agentType: DEVOPS,
    label: 'пересборка стенда',
    phase: 'Проверка',
    schema: CODER_SCHEMA,
  })
  qa = await agent(qaPrompt, { agentType: QA, label: 'QA (повтор)', phase: 'Проверка', schema: QA_SCHEMA })
  collectOwner(qa)
}

const modelBugs = []
let qaFixed = false
if (qa && qa.bugs && qa.bugs.length) {
  const codeBugs = []
  for (const b of qa.bugs) {
    if (String(b.area).toLowerCase().indexOf('model') !== -1) modelBugs.push(b.summary)
    else codeBugs.push({ area: b.area, where: '', summary: `${b.summary}${b.steps ? ' — шаги: ' + b.steps : ''}` })
  }
  if (codeBugs.length) {
    await dispatchFixes(codeBugs, 'Проверка', '')
    qaFixed = true
  }
  if (modelBugs.length) log(`Наблюдений о поведении модели: ${modelBugs.length} — они уходят хозяину, а не в код.`)
}

if (qaFixed) {
  await agent([deployPrompt, 'Правки после QA уже в репозитории — пересобери стенд под них.'].join('\n'), {
    agentType: DEVOPS,
    label: 'стенд после правок',
    phase: 'Проверка',
    schema: CODER_SCHEMA,
  })
  qa = await agent([qaPrompt, 'Это повторный прогон после правок: проверь исправленное и критерии, которых оно касается.'].join('\n'), {
    agentType: QA,
    label: 'QA после правок',
    phase: 'Проверка',
    schema: QA_SCHEMA,
  })
  collectOwner(qa)
}

phase('Сверка')

const syncPrompt = [
  base,
  `Сверь код фазы ${phaseNumber} с ${DOCS}/Дизайн/Архитектура.md (хаб и страницы папки Архитектура/) и с документом фазы.`,
  'Для каждого расхождения укажи сторону: code — неправ код, docs — неправы документы. Код не меняешь.',
  'Отдельно верни здоровье документации и список документов, сверенных и чистых.',
].join('\n')

let sync = await agent(syncPrompt, { agentType: SYNC, label: 'сверка', phase: 'Сверка', schema: SYNC_SCHEMA })

let docsDrift = []
if (sync && sync.drift && sync.drift.length) {
  const codeDrift = sync.drift.filter((d) => String(d.side).toLowerCase().indexOf('code') !== -1)
  docsDrift = sync.drift.filter((d) => String(d.side).toLowerCase().indexOf('code') === -1)
  if (codeDrift.length) {
    log(`Расхождений на стороне кода: ${codeDrift.length} — правлю.`)
    await dispatchFixes(
      codeDrift.map((d) => ({ area: d.where && d.where.indexOf('web/') !== -1 ? 'frontend' : 'backend', where: d.where, summary: d.what })),
      'Сверка',
      'Механизм, которого не называет ни один документ, удаляется, а не переносится в документы.'
    )
    sync = await agent([syncPrompt, 'Это повторная сверка после правок кода.'].join('\n'), {
      agentType: SYNC,
      label: 'сверка (повтор)',
      phase: 'Сверка',
      schema: SYNC_SCHEMA,
    })
    docsDrift = sync && sync.drift ? sync.drift : docsDrift
  }
}

phase('Финальное ревью')

const delta = await agent(
  [
    base,
    'Финальный проход по файлам, изменённым после твоего прошлого ревью: тесты, правки после QA, правки после сверки. Проход лёгкий — ищешь то, что успело просочиться.',
    'В конце обнови отметку ревью: без неё ворота не дадут закоммитить.',
  ].join('\n'),
  { agentType: REVIEWER, label: 'финальное ревью', phase: 'Финальное ревью', schema: REVIEW_SCHEMA }
)

return {
  ok: true,
  phase: phaseNumber,
  version: (backend && backend.version) || '',
  backend: backend ? { files: backend.files, summary: backend.summary, drift: backend.drift } : null,
  frontend: frontend ? { files: frontend.files, summary: frontend.summary, drift: frontend.drift } : null,
  tests: tests ? tests.summary : '',
  deploy: deploy ? deploy.summary : '',
  qa: qa ? { verdict: qa.verdict, bugsLeft: (qa.bugs || []).length } : null,
  modelObservations: modelBugs,
  reviewLeft: unclosed,
  deltaReview: delta ? (delta.findings || []).map((f) => `${f.where} — ${f.summary}`) : [],
  docsDrift: docsDrift.map((d) => `${d.where} — ${d.what}`),
  docHealth: (sync && sync.docHealth) || [],
  verifiedClean: (sync && sync.verifiedClean) || [],
  ownerQuestions: ownerQuestions,
}
