export const meta = {
  name: 'task-build',
  description: 'Сборка одной задачи: код и тесты по стекам, ревью всего диффа с состязательной проверкой блокеров, локальный стенд, QA, финальное ревью с отметкой',
  phases: [
    { title: 'Реализация', detail: 'dev-агенты по стекам: код и тесты' },
    { title: 'Ревью', detail: 'ревью всего диффа, состязательная проверка блокеров, круги правок' },
    { title: 'Стенд', detail: 'локальный стенд на свежей сборке' },
    { title: 'Проверка', detail: 'QA против запущенного приложения' },
    { title: 'Финальное ревью', detail: 'дельта после правок, отметка ревью' },
  ],
}

// args:
//   repo          абсолютный путь к корню репозитория
//   task          задача одним абзацем
//   planFile      абсолютный путь к плану из feature-planner, если он есть
//   scopeOut      «вне scope», дословно из плана
//   modules       [{ label, agentType, path, slice }] — кто что реализует
//   parallelOk    можно ли пускать модули одновременно (контракты зафиксированы в плане)
//   reviewTarget  что ревьюить, строкой
//   deploy        поднимать ли локальный стенд
//   qa            прогонять ли QA
//   newService    сервис пишется с нуля: контейнеров ещё нет

const a = args || {}
const REPO = a.repo
const task = a.task || '(задача не передана)'
const planFile = a.planFile || ''
const scopeOut = a.scopeOut || '(границы не заданы)'
const modules = (a.modules || []).filter((m) => m && m.agentType)
const parallelOk = a.parallelOk === true
const reviewTarget = a.reviewTarget || 'текущие изменения рабочего дерева: git status --porcelain, git diff HEAD и все untracked-файлы'
const wantDeploy = a.deploy !== false
const wantQa = a.qa !== false
const newService = a.newService === true

const REVIEWER = 'anton-toolkit:code-reviewer'
const QA = 'anton-toolkit:qa-engineer'
const DEVOPS = 'anton-toolkit:devops'

const VERIFY_CAP = 4
const FIX_ROUNDS = 2

if (!modules.length) {
  log('Ни одного модуля не передано — реализовывать нечего.')
  return { ok: false, reason: 'не передан ни один модуль' }
}

const base = [
  `Репозиторий: ${REPO}.`,
  `Задача: ${task}`,
  planFile ? `План (прочитать целиком, это спецификация): ${planFile}` : 'Отдельного файла плана нет — спецификация в тексте задачи выше.',
  `Вне scope, вперёд не строить: ${scopeOut}`,
].join('\n')

const CODER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['files', 'summary', 'verification'],
  properties: {
    files: { type: 'array', items: { type: 'string' }, description: 'файл — что сделано, по строке' },
    summary: { type: 'string' },
    verification: { type: 'string', description: 'какие команды прогнаны и с каким результатом' },
    contracts: { type: 'string', description: 'контракты наружу: эндпоинты, форматы запроса и ответа' },
    openQuestions: { type: 'array', items: { type: 'string' }, description: 'что осталось неоднозначным и решается пользователем' },
  },
}

const REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['where', 'severity', 'summary'],
        properties: {
          where: { type: 'string', description: 'файл:строка' },
          severity: { type: 'string', description: 'Critical, Warning или Info' },
          confidence: { type: 'string', description: 'high, medium или low' },
          area: { type: 'string', description: 'какой модуль или слой: метка модуля, backend, frontend, infra' },
          summary: { type: 'string' },
        },
      },
    },
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

const DEVOPS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['up', 'summary'],
  properties: {
    up: { type: 'boolean', description: 'отвечает ли приложение после развёртывания' },
    urls: { type: 'string', description: 'на каких адресах отвечает' },
    files: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
    blocked: { type: 'string', description: 'что помешало поднять стенд' },
  },
}

const QA_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['appUp', 'bugs', 'verdict'],
  properties: {
    appUp: { type: 'boolean', description: 'было ли приложение запущено и доступно' },
    bugs: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['area', 'summary'],
        properties: {
          area: { type: 'string', description: 'метка модуля, backend, frontend или deploy' },
          where: { type: 'string' },
          summary: { type: 'string' },
          steps: { type: 'string' },
        },
      },
    },
    verdict: { type: 'string', description: 'закрыты ли критерии из плана, одной строкой' },
    openQuestions: { type: 'array', items: { type: 'string' } },
  },
}

const openQuestions = []
function collectQuestions(r) {
  if (r && r.openQuestions) {
    for (const q of r.openQuestions) openQuestions.push(q)
  }
}

function looksLikeDeploy(s) {
  const t = String(s || '').toLowerCase()
  return t.indexOf('deploy') !== -1 || t.indexOf('infra') !== -1 || t.indexOf('docker') !== -1 || t.indexOf('compose') !== -1 || t.indexOf('стенд') !== -1 || t.indexOf('инфра') !== -1
}

// Находку отдаём тому, кто владеет файлом; если файл не назван — по метке области; иначе первому модулю.
function fixerFor(item) {
  const where = String((item && item.where) || '').replace(/\\/g, '/').toLowerCase()
  const area = String((item && item.area) || '').toLowerCase()
  if (where) {
    for (const m of modules) {
      const p = String(m.path || '').replace(/\\/g, '/').toLowerCase()
      if (p && where.indexOf(p) !== -1) return m.agentType
    }
  }
  if (area) {
    for (const m of modules) {
      const l = String(m.label || '').toLowerCase()
      if (l && area.indexOf(l) !== -1) return m.agentType
    }
  }
  if (looksLikeDeploy(area) || looksLikeDeploy(where)) return DEVOPS
  return modules[0].agentType
}

function labelFor(agentType) {
  for (const m of modules) {
    if (m.agentType === agentType) return 'правки · ' + m.label
  }
  return agentType === DEVOPS ? 'правки · стенд' : 'правки'
}

async function dispatchFixes(items, phaseTitle) {
  const byFixer = {}
  for (const it of items) {
    const t = fixerFor(it)
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
            'Почини найденное в уже написанном коде. Ничего сверх списка не строй и соседний код не рефакторь.',
            byFixer[t].map((x, i) => `${i + 1}. ${x.where ? x.where + ' — ' : ''}${x.summary}${x.steps ? ' | шаги: ' + x.steps : ''}`).join('\n'),
            'Тесты, которые ломает правка, чинишь в этой же правке.',
            'Если правка требует решения, которого нет ни в задаче, ни в плане, — не выдумывай: сделай остальное и верни вопрос в openQuestions.',
            'Верни: что исправил и чем проверил.',
          ].join('\n'),
          { agentType: t, label: labelFor(t), phase: phaseTitle, schema: CODER_SCHEMA }
        )
      )
    )
  ).filter(Boolean)
}

phase('Реализация')

function coderPrompt(m, contracts) {
  return [
    base,
    `Твой участок: ${m.label} — ${m.path}`,
    m.slice ? `Что делаешь именно ты: ${m.slice}` : '',
    newService ? 'Модуля ещё нет — создаёшь его с нуля по плану: структура, сборочный файл, зависимости, минимальный рабочий каркас. Инфраструктуру (контейнеры, compose) не делаешь, её делает devops.' : 'Код встраивается в существующий: сначала найди аналог того, что собираешься писать, и следуй его паттерну. Соседний код не переписываешь.',
    'Тесты к своей правке пишешь сам, в стиле и на фреймворке, которые уже есть в проекте. Отдельного тест-райтера в этом конвейере нет.',
    'Прогони done-критерии своих соглашений (компиляция, линтер, тесты) и почини всё, что упало.',
    contracts ? `Контракты соседнего модуля, которые надо потреблять: ${contracts}` : '',
    'Верни: файлы и что в них сделано, чем проверял, контракты наружу и открытые вопросы.',
  ]
    .filter(Boolean)
    .join('\n')
}

const built = []
if (modules.length === 1) {
  built.push(await agent(coderPrompt(modules[0], ''), { agentType: modules[0].agentType, label: modules[0].label, phase: 'Реализация', schema: CODER_SCHEMA }))
} else if (parallelOk) {
  log(`Контракты зафиксированы в плане — ${modules.length} модуля идут параллельно.`)
  const all = await parallel(modules.map((m) => () => agent(coderPrompt(m, ''), { agentType: m.agentType, label: m.label, phase: 'Реализация', schema: CODER_SCHEMA })))
  for (const r of all) built.push(r)
} else {
  log('Контракты в плане не зафиксированы — модули идут по очереди, каждый следующий получает контракты предыдущего.')
  let contracts = ''
  for (const m of modules) {
    const r = await agent(coderPrompt(m, contracts), { agentType: m.agentType, label: m.label, phase: 'Реализация', schema: CODER_SCHEMA })
    built.push(r)
    if (r && r.contracts) contracts = r.contracts
  }
}

const coded = built.filter(Boolean)
for (const r of coded) collectQuestions(r)

if (!coded.length) {
  log('Ни один dev-агент не отработал — сборка остановлена.')
  return { ok: false, reason: 'реализация не выполнена' }
}

phase('Ревью')

const reviewPrompt = [
  base,
  `Ревьюишь ${reviewTarget}. Весь код задачи уже написан, включая тесты — смотри его целиком, а не по кускам.`,
  'Для каждой находки укажи файл:строку, серьёзность (Critical, Warning, Info), уверенность и область — метку модуля или backend/frontend/infra.',
  `Метки модулей этой задачи: ${modules.map((m) => `${m.label} (${m.path})`).join(', ')}.`,
].join('\n')

let review = await agent(reviewPrompt, { agentType: REVIEWER, label: 'ревью', phase: 'Ревью', schema: REVIEW_SCHEMA })

function blockersOf(r) {
  if (!r || !r.findings) return []
  return r.findings.filter((f) => String(f.severity || '').toLowerCase().indexOf('critical') !== -1)
}

function nonBlockersOf(r) {
  if (!r || !r.findings) return []
  return r.findings.filter((f) => String(f.severity || '').toLowerCase().indexOf('critical') === -1)
}

let openFindings = nonBlockersOf(review)
let unclosed = []

let pending = blockersOf(review)
let round = 0
while (round < FIX_ROUNDS && pending.length) {
  let toFix = pending
  if (round === 0) {
    const toVerify = pending.slice(0, VERIFY_CAP)
    if (pending.length > toVerify.length) {
      log(`Блокеров ${pending.length}, состязательно проверяю первые ${toVerify.length}; остальные идут в правки без проверки.`)
    }
    const verdicts = await parallel(
      toVerify.map((f) => () =>
        agent(
          [
            `Репозиторий: ${REPO}.`,
            planFile ? `План задачи: ${planFile}` : `Задача: ${task}`,
            `Находка ревью: ${f.where} — ${f.summary}`,
            'Твоя задача — опровергнуть её. Открой это место в коде и проверь, правда ли там баг: воспроизводится ли описанный сценарий, есть ли выше по стеку проверка, которая его закрывает, не соответствует ли код тому, что просил план.',
            'Если сомневаешься — считай находку ложной: круг правок стоит дороже пропущенной придирки.',
            'Верни: real — настоящая ли находка, why — на чём основан вывод.',
          ].join('\n'),
          { label: `проверка · ${f.where || 'находка'}`, phase: 'Ревью', effort: 'medium', schema: VERDICT_SCHEMA }
        )
      )
    )
    const checked = toVerify.filter((f, i) => verdicts[i] && verdicts[i].real)
    const dropped = toVerify.length - checked.length
    if (dropped) log(`Состязательная проверка отсеяла ложных находок: ${dropped}.`)
    toFix = checked.concat(pending.slice(toVerify.length))
    if (!toFix.length) {
      pending = []
      break
    }
  }

  await dispatchFixes(toFix, 'Ревью')
  round += 1

  const again = await agent([base, 'Повторное ревью: посмотри файлы, изменённые после твоего прошлого прохода. Отметку ревью обнови.'].join('\n'), {
    agentType: REVIEWER,
    label: `ревью (круг ${round})`,
    phase: 'Ревью',
    schema: REVIEW_SCHEMA,
  })
  if (!again) {
    // Ревьюер не отработал — считаем незакрытым то, что отправляли в правку: подтвердить исправление некому.
    pending = toFix
    break
  }
  review = again
  openFindings = nonBlockersOf(review)
  pending = blockersOf(review)
}

if (pending.length) {
  log(`Незакрытых блокеров осталось: ${pending.length} — следующий круг не запускаю, отдаю пользователю.`)
  unclosed = pending.map((f) => `${f.where} — ${f.summary}`)
}

phase('Стенд')

const deployPrompt = [
  base,
  'Разверни ЛОКАЛЬНЫЙ стенд на только что написанном коде: пересобери образы и перезапусти, чтобы работала свежая сборка, а не предыдущая.',
  newService ? 'Сервис новый — контейнерной обвязки может не быть вовсе: создай её по шаблонам своих references.' : 'Существующую обвязку не переписывай — меняй только то, что нужно этой задаче.',
  'Убедись, что приложение действительно отвечает, и верни адреса. Удалённые и прод-окружения не трогаешь.',
  'Верни: up — отвечает ли приложение, адреса, что менял и что помешало, если не поднялось.',
].join('\n')

let deploy = null
if (wantDeploy) {
  deploy = await agent(deployPrompt, { agentType: DEVOPS, label: 'стенд', phase: 'Стенд', schema: DEVOPS_SCHEMA })
} else {
  log('Стенд не поднимаю — так решено на шаге планирования.')
}

phase('Проверка')

const qaPrompt = [
  base,
  'Прогони задачу насквозь против запущенного приложения: API через curl, интерфейс через браузерные инструменты сессии, и стык между ними.',
  planFile ? 'Критерии — раздел «Тесты» и функциональные требования плана, включая пути отказа, которые он называет.' : 'Критерии — то, что описано в задаче, включая её пути отказа.',
  deploy && deploy.urls ? `Стенд подняли здесь: ${deploy.urls}` : '',
  `Каждый баг маршрутизируй областью — метка модуля (${modules.map((m) => m.label).join(', ')}) или deploy, если сломана инфраструктура.`,
  'Если приложение недоступно — верни appUp=false и не тестируй.',
]
  .filter(Boolean)
  .join('\n')

let qa = null
let qaSkipped = ''
if (!wantQa) {
  qaSkipped = 'QA отключён на шаге планирования'
  log('QA пропускаю — так решено на шаге планирования.')
} else if (wantDeploy && (!deploy || deploy.up !== true)) {
  qaSkipped = `стенд не поднялся: ${(deploy && (deploy.blocked || deploy.summary)) || 'devops не отчитался'}`
  log('Стенд не поднялся — QA не запускаю, отдаю причину пользователю.')
} else {
  qa = await agent(qaPrompt, { agentType: QA, label: 'QA', phase: 'Проверка', schema: QA_SCHEMA })
  collectQuestions(qa)

  if (qa && qa.appUp === false && wantDeploy) {
    log('QA не достучался до приложения — пересобираю стенд и пробую ещё раз.')
    deploy = await agent([deployPrompt, 'QA не достучался до приложения: разберись, почему, пересобери и перезапусти.'].join('\n'), {
      agentType: DEVOPS,
      label: 'пересборка стенда',
      phase: 'Проверка',
      schema: DEVOPS_SCHEMA,
    })
    if (deploy && deploy.up === true) {
      qa = await agent(qaPrompt, { agentType: QA, label: 'QA (повтор)', phase: 'Проверка', schema: QA_SCHEMA })
      collectQuestions(qa)
    } else {
      qaSkipped = `приложение не поднялось со второй попытки: ${(deploy && (deploy.blocked || deploy.summary)) || 'devops не отчитался'}`
    }
  }

  if (qa && qa.appUp === false && !wantDeploy) {
    qaSkipped = 'приложение не запущено, а разворачивать стенд не просили'
  }

  if (qa && qa.appUp !== false && qa.bugs && qa.bugs.length) {
    log(`QA нашёл багов: ${qa.bugs.length} — отправляю на правку.`)
    await dispatchFixes(qa.bugs, 'Проверка')
    if (wantDeploy) {
      deploy = await agent([deployPrompt, 'Правки после QA уже в репозитории — пересобери стенд под них.'].join('\n'), {
        agentType: DEVOPS,
        label: 'стенд после правок',
        phase: 'Проверка',
        schema: DEVOPS_SCHEMA,
      })
    }
    qa = await agent([qaPrompt, 'Это повторный прогон после правок: проверь исправленное и то, чего оно касается.'].join('\n'), {
      agentType: QA,
      label: 'QA после правок',
      phase: 'Проверка',
      schema: QA_SCHEMA,
    })
    collectQuestions(qa)
  }
}

phase('Финальное ревью')

const delta = await agent(
  [
    base,
    'Финальный проход по файлам, изменённым после твоего прошлого ревью: правки после ревью, правки после QA, изменения инфраструктуры. Проход лёгкий — ищешь то, что успело просочиться.',
    'В конце обнови отметку ревью: без неё ворота не дадут закончить ход и закоммитить.',
  ].join('\n'),
  { agentType: REVIEWER, label: 'финальное ревью', phase: 'Финальное ревью', schema: REVIEW_SCHEMA }
)

if (delta) {
  const deltaBlockers = blockersOf(delta)
  if (deltaBlockers.length) unclosed = unclosed.concat(deltaBlockers.map((f) => `${f.where} — ${f.summary}`))
  openFindings = openFindings.concat(nonBlockersOf(delta))
}

return {
  ok: true,
  modules: built
    .map((r, i) => (r ? { label: (modules[i] && modules[i].label) || '', files: r.files || [], summary: r.summary || '', verification: r.verification || '' } : null))
    .filter(Boolean),
  deploy: deploy ? { up: deploy.up === true, urls: deploy.urls || '', summary: deploy.summary || '', blocked: deploy.blocked || '' } : null,
  qa: qa ? { verdict: qa.verdict || '', appUp: qa.appUp !== false, bugsLeft: (qa.bugs || []).length } : null,
  qaSkipped: qaSkipped,
  blockersLeft: unclosed,
  findings: openFindings.map((f) => `${f.where} [${f.severity}${f.confidence ? ', ' + f.confidence : ''}] — ${f.summary}`),
  openQuestions: openQuestions,
}
