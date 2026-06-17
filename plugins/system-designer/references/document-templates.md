# Document Templates

Canonical section structure for each document type under the documentation root (`<DOCROOT>` — either `Документация/` or `docs/`, resolved by the orchestrator). All agents and the orchestrator skill follow these templates so documents stay consistent across projects and iterations.

**Language rule:** all documents are written in Russian — headings, content, examples. Folder and file names are also Russian (`Концепт.md`, `Архитектура.md`, `Модули/`, `Дорожные карты/`, `Фазы/`). The project and communication are in Russian, and the documentation should match. Technical terms (REST, API, JWT, SLA, etc.) are not translated — leave them in their original form.

**Writing style — describe the finished system, not the design process.** The reader has no idea this document was produced by a consortium, by debate, or through iterations — they read it cold to understand how the system works. Every sentence must describe WHAT the system is and HOW it behaves, never HOW the team arrived at it.
- Cut design-process traces. Forbidden: "выбрано потому что…", "вариант X отклонён…", "отвергнутая альтернатива…", "мы решили…", "ради единообразия…", "новая таблица" / "общая таблица" (new/common relative to a past version the reader never saw). State the decision as a fact, optionally with a one-line *why it works* (not *why we picked it over Y*). Incorrect: `Первичный ключ — составной (выбрано потому, что surrogate id отклонён как лишняя колонка).` Correct: `Первичный ключ — составной (token_id, organization_id): пара уникальна и неизменяема.`
- No duplicate summaries. State each fact in exactly ONE home section; elsewhere reference it ("см. поток N", "см. «Зависимости»") instead of restating. Do NOT add a "сводка правил/решений" block that repeats what tables or flows already say.
- Plain language over jargon. If a term like STI / class-table-inheritance / CHECK-инвариант is used, either gloss it in one plain phrase on first use or drop it. Prefer "БД сама не даст создать строку без email" over "декларативный CHECK-инвариант гарантирует NOT NULL".
- Lead with meaning, mechanism second. A flow/step opens with what happens in user/system terms; DB mechanics (atomic conditional UPDATE, affected-row counts, column names) come after as a clause, not as the headline.

**Cross-references:** link to sibling documents with Obsidian wiki-links — `[[Концепт]]`, `[[Архитектура]]`, `[[Модули/Аутентификация]]` — so the documents navigate like an Obsidian vault. Do NOT use relative markdown paths (`../Архитектура.md`).

No runnable code. Pseudo-API shapes and pseudo-types are welcome.

## Концепт — Концепт.md

```markdown
# Концепт — <название продукта>

## Что это
Один абзац. Простым языком. После этого раздела не-технический читатель должен понимать, что за продукт.

## Для кого
Типы пользователей. Для каждого — одно предложение: кто это и что ему нужно.

## Зачем это нужно (проблема и ценность)
Какую боль решаем. Чего не хватает сегодня. Почему именно такая форма решения подходит.

## Ключевые сценарии
Нумерованный список 2–5 самых частых сценариев использования. По одному абзацу на каждый, от лица пользователя.

## Ограничения
Жёсткие рамки: платформы, регуляторика, масштаб, бюджет, сроки. Маркированный список.

## Что сознательно вне scope
Явные не-цели. Что продукт намеренно НЕ делает. Маркированный список.
```

## Архитектура — Архитектура.md

```markdown
# Архитектура — <название продукта>

## Обзор
3–5 предложений технического саммари.

## Ключевые архитектурные решения
Маркированный список. Каждый пункт: решение + однострочное обоснование.

## Компоненты
Для каждого компонента: **Название** — ответственность (1 предложение), какие данные владеет, какие интерфейсы предоставляет, зависимости. Имена компонентов — на русском; они становятся именами файлов модулей в `Модули/`.

## Потоки данных
2–4 самых важных end-to-end потока, описанных прозой.

## Модель данных (верхний уровень)
Основные сущности и связи между ними. Только форма, не полные схемы.

## Стек
Технологические выборы по слоям, каждый с однострочным обоснованием.

## Сквозная функциональность
Аутентификация, логирование, обработка ошибок, конфигурация, observability. По одному короткому разделу на каждое.

## Топология деплоя
Где запускается каждый компонент. Как они упаковываются и соединяются в проде.

## Открытые вопросы
Нерешённые моменты, по которым нужно мнение пользователя.
```

## Модуль — Модули/<имя>.md

```markdown
# Модуль — <название>

## Назначение
2–3 предложения. Зачем этот модуль существует.

## Ответственности
Маркированный список того, чем владеет этот модуль.

### Не-ответственности
Маркированный список того, что модуль явно НЕ делает.

## Публичный интерфейс
API, который модуль предоставляет остальной системе. По одной строке на эндпоинт/функцию.

## Модель данных
Таблицы/коллекции/типы, которыми владеет модуль. Поля с типами, ключевые связи.

## Ключевые потоки
2–4 сценария, расписанных пошагово прозой.

## Зависимости
Другие модули / внешние сервисы, к которым обращается этот модуль. Что нужно от каждого.

## Обработка ошибок
Что может пойти не так и как модуль на это реагирует.

## Стек и библиотеки
Конкретные выборы для этого модуля, по однострочному обоснованию.

## Конфигурация
Переменные окружения, секреты, настройки. Имя, назначение, значение по умолчанию.

## Открытые вопросы
Нерешённые моменты.
```

## Дорожная карта — Дорожные карты/<срез>/Дорожная карта.md

**Folder layout:** each roadmap lives in its own subfolder `<DOCROOT>/Дорожные карты/<срез>/Дорожная карта.md`, together with its phase documents in `<DOCROOT>/Дорожные карты/<срез>/Фазы/`. Roadmaps NEVER go directly into `<DOCROOT>/` (no `<DOCROOT>/Дорожная карта.md` at the root). The "срез" is a human-readable Russian slice name (e.g. `Аутентификация`, `Публичная часть`, `MVP`). For a project with a single overall roadmap, default to `Основная`.

```markdown
# Roadmap — <название продукта или среза>

## Обзор
1–2 предложения: как система (или её срез) разбита на фазы и логика разбиения (от какого минимального осязаемого функционала к полному). Если roadmap покрывает не весь продукт, а конкретный срез (модуль, фичу) — назови этот срез прямо здесь.

## Фаза 1 — <короткое название>
**Что пользователь сможет потрогать:** 1–2 предложения о минимальном законченном функционале этой фазы.
**Затронутые модули:** [[Модули/<module-a>]], [[Модули/<module-b>]] (имена строго из Архитектура.md).
**Зависит от:** — (для первой фазы прочерк).

## Фаза 2 — <короткое название>
**Что пользователь сможет потрогать:** ...
**Затронутые модули:** ...
**Зависит от:** Фаза 1.

<!-- и так далее, каждая следующая фаза опирается на одну или несколько предыдущих -->
```

Правила для roadmap:
- Каждая фаза — минимальный законченный функционал, который можно запустить и проверить руками.
- Каждая следующая фаза опирается на предыдущие, не висит в воздухе.
- В Дорожная карта.md только короткие описания. Детальная разбивка фазы — отдельный документ, создаётся другим инструментом.
- Имена модулей в `Затронутые модули` — строго из `Архитектура.md`, без выдумок (ссылайся wiki-ссылкой `[[Модули/<имя>]]`).
- Фаза может затрагивать кусок модуля (срез), не обязательно весь модуль целиком.

## Фаза — Дорожные карты/<срез>/Фазы/Фаза-NN-<имя>.md

**Folder layout:** phase documents live next to their roadmap, in `<DOCROOT>/Дорожные карты/<срез>/Фазы/`, NEVER in a top-level `<DOCROOT>/Фазы/` folder. Each roadmap owns its own `Фазы/` subdirectory so that phases of different scopes (Аутентификация vs Публичная часть vs Платежи) do not mix.

Детальный документ одной фазы. Читает его `python-dev` агент и должен без вопросов реализовать — значит документ должен быть достаточно конкретным: интерфейсы, модели данных, сценарии, границы scope.

```markdown
# Фаза NN — <название>

## Цель
1–2 предложения. Что пользователь получает после этой фазы — тот же смысл, что в Дорожная карта.md, можно расширить.

## Что входит в scope
Маркированный список конкретных возможностей / эндпоинтов / экранов / команд, которые должны работать после фазы. Формулировки пользовательские и проверяемые, не «добавить сервис X».

## Что НЕ входит
Маркированный список явных границ. Смежные фичи, которые могут показаться частью фазы, но отложены на следующие. Это критично — без этого scope расползается.

## Затронутые модули (срезы)
Для каждого модуля из roadmap — отдельный подраздел:

### <module-name>
- **Публичный интерфейс этой фазы** — какие конкретно эндпоинты / функции / команды модуль должен выставить в этой фазе. По одной строке на каждый, в форме `METHOD /path → ResponseShape` или `func_name(args) → ReturnShape`.
- **Модель данных этой фазы** — какие таблицы / коллекции / типы создаются или меняются. Поля с типами и ключевыми ограничениями.
- **Внутренняя логика** — ключевые шаги обработки прозой. Без кода, но достаточно детально, чтобы не было неоднозначности (валидация, вызовы других модулей, обработка ошибок, побочные эффекты).
- **Не делаем в этой фазе** — что из полной спеки модуля откладываем.

## End-to-end сценарии приёмки
Нумерованный список 2–5 сценариев, которые проверяются руками после фазы. Каждый сценарий — пошагово от лица пользователя или тестировщика, с ожидаемым результатом на каждом шаге.

## Зависимости
- **Опирается на:** `Фаза X` — что именно из предыдущих фаз используется.
- **Разблокирует:** `Фаза Y, Z` — почему следующие фазы без этой невозможны.
- **Внешние зависимости:** библиотеки, сервисы, API, переменные окружения, которые должны быть доступны. Указать, если что-то новое появляется именно в этой фазе.

## Конфигурация
Переменные окружения / секреты / фичефлаги, добавляемые в этой фазе. Имя, назначение, пример значения.

## Открытые вопросы
Всё, что нужно решить до старта реализации. Если список пуст — пиши «нет».
```

Правила для phase docs:
- **Целевой читатель — python-dev агент.** Детализация должна быть такой, что агент не задаёт уточняющих вопросов. Если что-то неясно — это `Открытые вопросы`.
- Имена модулей в подразделах строго совпадают с `Архитектура.md`.
- Scope в phase-документе — подмножество scope той же фазы в `Дорожная карта.md`. Никаких «забежать в следующую фазу по пути».
- Никакого runnable кода. Pseudo-API (`POST /auth/login → {token, expiresAt}`) и pseudo-типы (`User { id: uuid, email: str, createdAt: datetime }`) — можно и нужно.
- Имя файла — `Фаза-NN-<имя>.md`, где `NN` с ведущим нулём (`Фаза-01-Регистрация.md`), `<имя>` — русское название фазы. Полный путь — `<DOCROOT>/Дорожные карты/<срез>/Фазы/Фаза-NN-<имя>.md`.

## Consistency rules across documents

- **Concept** speaks user language. **Architecture** speaks system language. **Modules** speak implementation language (without code).
- A capability mentioned in Концепт.md must be traceable into Архитектура.md (some component owns it) and into at least one module.
- Архитектура.md's component list is the source of truth for which modules exist. `<DOCROOT>/Модули/` must match it — no orphan module docs, no missing ones. The module file name equals the Russian component name from Архитектура.md.
- Cross-document references use Obsidian wiki-links (`[[Архитектура]]`, `[[Модули/<имя>]]`), not relative paths. A wiki-link must resolve to an existing document.
- When a change affects multiple levels, edit top-down: concept → architecture → modules. This keeps the narrative consistent.
