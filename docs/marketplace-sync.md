# Общий маркетплейс Claude, Codex и Kimi

Источник всех восьми плагинов — `https://github.com/lopatuxin/anton-toolkit`, ветка `main`. Личные правила и память остаются в Obsidian.

## Что редактировать

- `plugins/` — общие навыки, агенты, справочники, скрипты и исходная версия для Claude.
- `adapters/codex/` — особенности Codex, включая распределение моделей и хуки.
- `adapters/kimi/` — особенности Kimi.
- `codex/plugins/`, `.agents/plugins/marketplace.json` и `kimi/` — автоматически собранные версии. Вручную их не правят.

Claude использует `.claude-plugin/marketplace.json`, Codex — `.agents/plugins/marketplace.json`, Kimi — `kimi/marketplace.json` и манифесты `kimi.plugin.json`. Все каталоги находятся в одном Git-репозитории. При изменении исходника сборка меняет версии пакетов Codex и Kimi по содержимому, даже если версия Claude не менялась.

## Модели

Настройки Claude остаются в `plugins/*/agents/*.md`. Для Codex отдельный файл `adapters/codex/models.json`: разработчики и devops — GPT-6.1 Sol/high; QA и test-writer — Sol/medium; code-reviewer — GPT-6 Astra/medium; mr-spec-reviewer — Astra/xhigh. Остальные роли наследуют модель основного чата, пока владелец не назначит другую.

В Codex для `task-build` выберите GPT-6 Astra под полем ввода. Оркестратор и планировщик работают в этом чате с выбранным уровнем рассуждения. `task-build` проверяет модель при запуске и при продолжении после ответа пользователя. Агенты Kimi наследуют модель основного чата; распределение моделей Claude и Codex к нему не относится.

## Получить изменения на компьютере

Из существующей рабочей копии репозитория:

```powershell
& .\scripts\sync-marketplace.ps1
```

Скрипт выполняет `git pull --ff-only origin main`, собирает пакеты и обновляет установленные плагины трёх программ. Ради сохранности чужой работы он останавливается при незакоммиченных изменениях в репозитории. Включённые и отключённые плагины сохраняют свой выбор; новые плагины сами не включаются. Для первоначальной установки шести используемых плагинов на другом компьютере добавьте `-InstallDefaults`. `character-animation` и курс `vibe-coding-course` остаются доступными для отдельной установки.

Если установлена только одна программа, используйте `-Client Claude`, `-Client Codex` или `-Client Kimi`. Путь к нестандартному Claude Code можно передать параметром `-ClaudeCommand`, отдельные домашние каталоги Kimi — через `-KimiHomes`.

Запущенные чаты продолжают пользоваться загруженными инструкциями. После обновления откройте новые чаты; в Kimi также можно выполнить `/plugins reload`. В Claude есть штатное автообновление: `/plugin` → Marketplaces → anton-toolkit-marketplace → Enable auto-update. Git push публикует изменения; он сам по себе не перезагружает открытые приложения.

Установщик `.kimi-sync/setup-machine.ps1` из Obsidian вызывает эту же синхронизацию с `-InstallDefaults`. Управляемые копии и `installed.json` перед обновлением сохраняются в `backups/marketplace-sync-*` домашнего каталога Kimi.

## Опубликовать изменение

```powershell
npm ci --ignore-scripts
npm test
npm run build
npm run check
```

После этого сохраните в одном коммите изменённые исходники и результат сборки и отправьте коммит в `main`. Для Claude увеличьте версию изменённого плагина в его `.claude-plugin/plugin.json`. GitHub Actions также запускает сборку после изменения исходников в `main` и при необходимости сохраняет обновлённые пакеты Codex и Kimi отдельным коммитом. Если сборка не прошла, последние успешные версии остаются доступными; состояние видно на вкладке Actions репозитория.

Старый каталог Obsidian `.codex-sync/marketplace` больше не является источником. Его установщик перенаправлен на Git-репозиторий; архив предыдущей копии нужен только для отката. Не переносите личные правила, память и учётные данные из Obsidian в этот репозиторий.

## Форматы и команды

- [OpenAI: упаковка плагинов и Git-маркетплейсы](https://developers.openai.com/plugins/build/plugins)
- [OpenAI: команды управления маркетплейсами](https://learn.chatgpt.com/docs/developer-commands)
- [Claude: установка и обновление плагинов](https://code.claude.com/docs/en/plugins/install)
- [Kimi: установка, манифесты и обновление плагинов](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/plugins.html)
