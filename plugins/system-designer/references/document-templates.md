# Document Templates

Canonical section structure for each document type in `docs/`. All agents and the orchestrator skill follow these templates so documents stay consistent across projects and iterations.

**Language rule:** all documents are written in Russian — headings, content, examples. The project and communication are in Russian, and the documentation should match. Technical terms (REST, API, JWT, SLA, etc.) are not translated — leave them in their original form.

No runnable code. Pseudo-API shapes and pseudo-types are welcome.

## concept.md

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

## architecture.md

```markdown
# Архитектура — <название продукта>

## Обзор
3–5 предложений технического саммари.

## Ключевые архитектурные решения
Маркированный список. Каждый пункт: решение + однострочное обоснование.

## Компоненты
Для каждого компонента: **Название** — ответственность (1 предложение), какие данные владеет, какие интерфейсы предоставляет, зависимости.

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

## modules/<name>.md

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

## Consistency rules across documents

- **Concept** speaks user language. **Architecture** speaks system language. **Modules** speak implementation language (without code).
- A capability mentioned in concept.md must be traceable into architecture.md (some component owns it) and into at least one module.
- Architecture.md's component list is the source of truth for which modules exist. `docs/modules/` must match it — no orphan module docs, no missing ones.
- When a change affects multiple levels, edit top-down: concept → architecture → modules. This keeps the narrative consistent.
