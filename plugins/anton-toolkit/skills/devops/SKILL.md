---
name: devops
description: >
  Use when the user needs to containerize, deploy, configure infrastructure,
  or manage services for their projects. Triggers on: "docker", "dockerfile",
  "compose", "контейнер", "контейнеризация", "разверни", "задеплой", "деплой",
  "запусти проект", "подними сервис", "инфра", "инфраструктура", "cicd",
  "ci/cd", "пайплайн", "pipeline", "nginx", "health check", "логи контейнера",
  "/devops", or any request related to Docker, deployment, infrastructure
  setup, or service orchestration.
---

# DevOps — контейнеризация, деплой и инфраструктура

Помоги пользователю развернуть проект, настроить контейнеры, оркестрацию и инфраструктуру.

## Общий подход

1. **Изучи проект.** Прежде чем создавать конфиги, прочитай:
   - Build-файл (`build.gradle.kts`, `pom.xml`, `package.json`)
   - Существующие `Dockerfile`, `docker-compose.yml`, `.dockerignore`
   - Конфиги приложения (`application.yml`, `.env`)
   - Структуру модулей (моно-репо или мульти-модуль)

2. **Спроси чего не хватает.** Не угадывай — спроси пользователя:
   - Какие сервисы нужны (БД, кэш, брокер, прокси)
   - Какие порты использовать
   - Нужны ли volumes для данных
   - Окружение: dev, staging или prod

3. **Создай конфигурацию.** Используй шаблоны из `references/`:
   - Dockerfile → `references/docker.md`
   - docker-compose.yml → `references/compose.md`
   - CI/CD → `references/cicd.md`

4. **Проверь работоспособность.** После создания конфигов:
   - Проверь что Docker запущен: `docker info`
   - Собери образ: `docker compose build`
   - Запусти: `docker compose up -d`
   - Проверь статус: `docker compose ps`
   - Покажи логи при ошибках: `docker compose logs <service>`

## Возможности

### Контейнеризация
- Создание Dockerfile (multi-stage build для Java/Spring Boot)
- Создание .dockerignore
- Оптимизация размера образа и времени сборки
- Layer caching для Gradle/Maven зависимостей

### Оркестрация (Docker Compose)
- Сборка docker-compose.yml с нужными сервисами
- Настройка сетей, volumes, healthchecks
- Профили для разных окружений (dev/prod)
- Зависимости между сервисами (depends_on + healthcheck)

### Управление контейнерами
- Запуск/остановка/перезапуск: `docker compose up -d`, `down`, `restart`
- Логи: `docker compose logs -f <service>`
- Статус: `docker compose ps`
- Вход в контейнер: `docker compose exec <service> bash`
- Очистка: `docker system prune`, `docker volume prune`

### CI/CD (когда потребуется)
- GitHub Actions workflows
- Сборка и push образов
- Автодеплой по тегам/веткам

### Мониторинг и отладка
- Health check эндпоинты (Spring Boot Actuator)
- Проверка портов и сетей
- Анализ ресурсов: `docker stats`
- Диагностика проблем запуска

## Правила

- ВСЕГДА читай проект перед генерацией конфигов — не шаблонируй вслепую
- Не перезаписывай существующие Dockerfile/compose без подтверждения
- Используй multi-stage builds для продакшен-образов
- Не хардкодь пароли и секреты — используй `.env` файлы и переменные окружения
- Добавляй healthcheck для каждого сервиса в compose
- Для volumes с данными (БД) используй named volumes, не bind mounts
- Порты: не маппь на 80/443 по умолчанию — спроси пользователя
- При ошибках сборки — покажи логи и диагностируй, не повторяй слепо
