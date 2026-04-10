---
name: ps-improve-plugin
description: >
  IMPORTANT: Invoke this skill via the Skill tool IMMEDIATELY (do NOT just
  save to memory) when the user corrects behavior produced by any
  personal-strategist skill or agent.

  Concrete trigger situations:
  - User says interview questions are bad or irrelevant
  - User says analysis is superficial or wrong
  - User says strategy recommendations don't match their personality
  - User corrects any output or behavior from personal-strategist
  - User says "улучши стратега", "исправь интервьюера", "обнови плагин"
  - After Claude fixes the behavior in conversation AND the user confirms
    the fix is correct — persist the fix into the plugin source code
---

# Improve Plugin — самосовершенствование personal-strategist

Внеси исправление в плагин personal-strategist на основе обратной связи, закоммить и запушь.

## Когда активировать

Активируй когда ВСЕ условия выполнены:
1. В разговоре использовался скилл или агент из personal-strategist
2. Пользователь указал на проблему
3. Проблема была исправлена в разговоре и пользователь доволен
4. Исправление можно зафиксировать как изменение в файлах плагина

## Процесс

### 1. Найди репозиторий плагина

```bash
ls -d /c/projects/anton-toolkit ~/projects/anton-toolkit 2>/dev/null
find ~ /c/projects -maxdepth 3 -name "plugin.json" -path "*/personal-strategist/*" 2>/dev/null | head -5
```

Если НЕ найден — склонируй:
```bash
git clone git@github.com:lopatuxin/anton-toolkit.git /tmp/anton-toolkit
```

Путь к файлам: `$PLUGIN_REPO/plugins/personal-strategist/`

### 2. Определи что менять

Проанализируй разговор:
- Какой скилл/агент/reference вызвал проблему
- В чём конкретно была ошибка
- Какое исправление решило проблему

### 3. Прочитай текущее состояние

Прочитай файлы из `$PLUGIN_REPO/plugins/personal-strategist/`.

### 4. Обнови версию плагина

Инкрементируй версию в `$PLUGIN_REPO/plugins/personal-strategist/.claude-plugin/plugin.json`:
- **PATCH**: точечные исправления, правки формулировок
- **MINOR**: новый агент/скилл или значительная переработка

### 5. Внеси минимальное исправление

- МИНИМАЛЬНОЕ изменение для решения проблемы
- НЕ рефактори остальное заодно
- НЕ добавляй «улучшения» сверх запрошенного

### 6. Покажи diff и получи подтверждение

### 7. Закоммить и запушь

```bash
cd $PLUGIN_REPO
git pull origin main
git add <файлы>
git commit -m "<сообщение на русском>"
git push
```

## Важные правила

- ВСЕГДА показывай diff перед коммитом
- ВСЕГДА спрашивай подтверждение перед push
- ВСЕГДА делай git pull перед коммитом
- НИКОГДА не редактируй файлы в ~/.claude/plugins/cache/
