---
name: onboarding
description: >
  Use when the user wants to start the initial interview for their strategic
  profile, or when launching personal-strategist for the first time.
  Triggers on: "познакомимся", "расскажу о себе", "онбординг", "onboarding",
  "начнём знакомство", "создай профиль", or when personal-profile repo
  does not exist.
---

# Onboarding — первичное знакомство

Проведи первичное интервью с пользователем и создай его стратегический профиль.

## Процесс

### 1. Проверь/создай репозиторий personal-profile

```bash
# Проверь существует ли репо
ls -d /c/projects/personal-profile ~/projects/personal-profile 2>/dev/null
```

Если НЕ существует — создай:

```bash
mkdir -p /c/projects/personal-profile
cd /c/projects/personal-profile
git init

# Создай структуру
mkdir -p identity goals/archive skills resources decisions context strategy/archive meta
```

Создай все файлы со стартовым содержимым:

**identity/personality.md:**
```markdown
---
last_updated: YYYY-MM-DD
confidence: 0.0
---

# Личность

## Ценности

## Мотиваторы

## Демотиваторы

## Характерные черты
```

**identity/cognitive-style.md:**
```markdown
---
last_updated: YYYY-MM-DD
confidence: 0.0
---

# Когнитивный стиль

## Принятие решений

## Стиль обучения

## Работа с информацией
```

**identity/psychological-models.md:**
```markdown
---
last_updated: YYYY-MM-DD
confidence: 0.0
---

# Психологические модели

## Big Five

## Когнитивные стили

## Мотивационные драйверы

## Стратегии совладания
```

**goals/long-term.md:**
```markdown
---
last_updated: YYYY-MM-DD
confidence: 0.0
---

# Долгосрочные цели (3-10 лет)
```

**goals/mid-term.md:**
```markdown
---
last_updated: YYYY-MM-DD
confidence: 0.0
---

# Среднесрочные цели (6-12 месяцев)
```

**goals/short-term.md:**
```markdown
---
last_updated: YYYY-MM-DD
confidence: 0.0
---

# Краткосрочные цели (1-3 месяца)
```

**skills/competencies.md:**
```markdown
---
last_updated: YYYY-MM-DD
confidence: 0.0
---

# Навыки и компетенции
```

**skills/development.md:**
```markdown
---
last_updated: YYYY-MM-DD
confidence: 0.0
---

# Развитие навыков

## Активно развиваю

## Хочу развить

## Пробелы
```

**skills/learning-log.md:**
```markdown
---
last_updated: YYYY-MM-DD
confidence: 0.0
---

# Лог обучения
```

**resources/constraints.md:**
```markdown
---
last_updated: YYYY-MM-DD
confidence: 0.0
---

# Ограничения

## Время

## Финансы

## Обязательства

## Другое
```

**resources/assets.md:**
```markdown
---
last_updated: YYYY-MM-DD
confidence: 0.0
---

# Ресурсы и активы

## Контакты и сеть

## Инструменты

## Возможности
```

**decisions/log.md:**
```markdown
---
last_updated: YYYY-MM-DD
confidence: 0.0
---

# Лог решений
```

**decisions/patterns.md:**
```markdown
---
last_updated: YYYY-MM-DD
confidence: 0.0
---

# Паттерны решений

## Что работает

## Что не работает

## Повторяющиеся паттерны
```

**context/current.md:**
```markdown
---
last_updated: YYYY-MM-DD
confidence: 0.0
---

# Текущий контекст

## Жизненная ситуация

## Активные проекты

## Текущие приоритеты

## Что беспокоит
```

**context/changelog.md:**
```markdown
---
last_updated: YYYY-MM-DD
---

# Лог изменений
```

**strategy/active-strategy.md:**
```markdown
---
last_updated: YYYY-MM-DD
confidence: 0.0
status: none
---

# Текущая стратегия

Стратегия ещё не разработана. Используй скилл `strategist` после заполнения профиля.
```

**strategy/roadmap.md:**
```markdown
---
last_updated: YYYY-MM-DD
---

# Дорожная карта

Дорожная карта ещё не создана.
```

**meta/profile-summary.md:**
```markdown
---
last_updated: YYYY-MM-DD
---

# Обобщённый профиль

Профиль ещё не заполнен. Запусти onboarding для начала.
```

**meta/last-review.md:**
```markdown
---
last_review: YYYY-MM-DD
next_review: YYYY-MM-DD
---

# Последнее ревью

Ревью ещё не проводилось.
```

После создания:

```bash
cd /c/projects/personal-profile
git add -A
git commit -m "$(cat <<'EOF'
Инициализировал структуру стратегического профиля
EOF
)"
```

### 2. Запусти интервьюера

Запусти агента `ps-interviewer` с промптом:

> Проведи первичное интервью. Начни с базовых вопросов (Фаза 1 из interview-framework.md). Цель — собрать информацию по всем категориям профиля. После 10-15 вопросов предложи углубиться в конкретную область.

### 3. После интервью — запусти аналитика

Когда интервьюер завершит, автоматически запусти `ps-analyst`:

> Проведи первичный анализ собранного профиля. Сформируй profile-summary.md и определи области, которые нуждаются в углублении.

### 4. Покажи результат

После аналитика покажи пользователю:
- Краткое резюме что узнали
- Какие области хорошо покрыты, какие нет
- Предложи следующие шаги (углубить профиль или перейти к стратегии)
