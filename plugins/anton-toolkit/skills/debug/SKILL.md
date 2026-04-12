---
name: debug
description: >
  IMPORTANT: Invoke this skill via the Skill tool IMMEDIATELY when the user
  reports a bug, error, slow performance, unexpected behavior, or any
  problem that needs investigation. Do NOT guess the cause — load this
  skill to follow a systematic debugging process.

  Trigger phrases: "баг", "ошибка", "не работает", "падает", "500",
  "NPE", "exception", "тормозит", "медленно", "зависает", "не отвечает",
  "неправильно работает", "странное поведение", "дебаг", "debug",
  "почему не работает", "в чём проблема", "найди причину", "/debug",
  or any report of incorrect behavior, errors, or performance issues.
---

# Debug — систематический поиск первопричины

Найди ИСТИННУЮ причину проблемы, а не предположительную. Никогда не предлагай решение пока не доказал причину.

## Главное правило

**ДОКАЗАТЕЛЬСТВО > ПРЕДПОЛОЖЕНИЕ.** Не говори "скорее всего проблема в X". Вместо этого — докажи что проблема именно в X через логи, трейсы, воспроизведение, или исключение альтернатив.

## Процесс — Эскалация методов

Иди от простого к сложному. Если метод N не дал ответ — переходи к N+1.

### Уровень 1: Воспроизведение и логи

**Цель: увидеть ошибку своими глазами.**

1. **Уточни симптом.** Спроси пользователя:
   - Что конкретно происходит? (точная ошибка, код ответа, поведение)
   - Когда? (всегда, иногда, после определённого действия)
   - Где? (какой эндпоинт, какая страница, какой сервис)

2. **Воспроизведи ошибку:**
   ```bash
   # API — отправь тот же запрос
   curl -v -X POST http://localhost:8080/api/... -H "Content-Type: application/json" -d '{...}'
   
   # Браузер — открой ту же страницу через Playwright/Chrome DevTools
   ```

3. **Прочитай логи:**
   ```bash
   # Docker контейнеры
   docker compose logs --tail=100 <service>
   docker compose logs --tail=100 <service> | grep -i "error\|exception\|warn"
   
   # Файловые логи
   tail -100 logs/app.log | grep -i "error\|exception"
   
   # Фронтенд — console errors через Playwright
   ```

4. **Найди стектрейс.** Если есть exception — прочитай его ЦЕЛИКОМ. Найди строку в ТВОЁМ коде (не в фреймворке), с которой началась ошибка.

**Если нашёл точную строку и причину → СТОП. Сообщи причину.**

### Уровень 2: Анализ кода и данных

**Цель: понять логику, которая привела к ошибке.**

1. **Прочитай код** вокруг точки ошибки. Не только строку, а весь метод и вызывающий код.

2. **Трассировка вызовов.** Отследи путь данных от входа до ошибки:
   ```
   Controller → Service → Repository → DB
   ```
   Для каждого шага: что приходит на вход? что возвращается? где данные искажаются?

3. **Проверь данные:**
   ```bash
   # SQL — что реально в базе?
   docker compose exec postgres psql -U app -d appdb -c "SELECT * FROM orders WHERE id = ..."
   
   # Redis — что в кеше?
   docker compose exec redis redis-cli GET "key"
   ```

4. **Проверь конфигурацию:**
   ```bash
   # Env-переменные внутри контейнера
   docker compose exec <service> env | grep -i "spring\|db\|redis"
   
   # Application config
   cat src/main/resources/application.yml
   ```

**Если нашёл причину → СТОП. Сообщи.**

### Уровень 3: Динамический анализ

**Цель: наблюдать за приложением в реальном времени.**

1. **Добавь временное логирование** в подозрительный код:
   ```java
   log.debug(">>> Input: {}, State: {}", input, state);
   ```
   Потом воспроизведи ошибку и прочитай логи. ОБЯЗАТЕЛЬНО удали временные логи после дебага.

2. **Spring Boot Actuator:**
   ```bash
   # Health check
   curl http://localhost:8080/actuator/health
   
   # Бины — загружен ли нужный компонент?
   curl http://localhost:8080/actuator/beans | jq '.contexts[].beans | keys[]' | grep -i "order"
   
   # HTTP-трейсы (если включены)
   curl http://localhost:8080/actuator/httpexchanges
   ```

3. **Сетевой анализ:**
   ```bash
   # Проверь что порт слушается
   curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health
   
   # DNS/connection проблемы между контейнерами
   docker compose exec <service> curl -v http://other-service:8080/health
   ```

**Если нашёл причину → СТОП. Сообщи.**

### Уровень 4: Профилирование (медленная работа)

**Цель: найти конкретный bottleneck.**

1. **Замерь время ответа:**
   ```bash
   # Общее время запроса
   curl -w "\n  DNS: %{time_namelookup}s\n  Connect: %{time_connect}s\n  TTFB: %{time_starttransfer}s\n  Total: %{time_total}s\n" \
     http://localhost:8080/api/...
   ```

2. **SQL-запросы — включи логирование:**
   ```yaml
   # application.yml — временно!
   logging.level.org.hibernate.SQL: DEBUG
   logging.level.org.hibernate.type.descriptor.sql: TRACE
   ```
   Воспроизведи медленный запрос → посмотри какие SQL выполняются (N+1?).

3. **JVM профилирование:**
   ```bash
   # Thread dump — что делают потоки прямо сейчас?
   docker compose exec <service> jcmd 1 Thread.print
   
   # GC статистика
   docker compose exec <service> jcmd 1 GC.heap_info
   
   # Если доступен async-profiler
   docker compose exec <service> jcmd 1 jfr.start duration=30s filename=/tmp/profile.jfr
   ```

4. **Фронтенд-перформанс:**
   - Chrome DevTools → Performance tab (через MCP)
   - Lighthouse audit
   - Network waterfall — какой запрос тормозит?

**Если нашёл bottleneck → СТОП. Сообщи.**

### Уровень 5: Бисекция и изоляция

**Цель: сузить область до минимума, когда всё остальное не помогло.**

1. **Git bisect** — если "раньше работало":
   ```bash
   git log --oneline -20  # найди примерный коммит
   git bisect start
   git bisect bad
   git bisect good <commit-hash>
   # Тестируй каждый коммит
   ```

2. **Минимальный воспроизводимый пример:**
   - Убери из запроса все необязательные поля — ошибка сохраняется?
   - Подставь другие данные — ошибка от данных?
   - Вызови сервис напрямую (без контроллера) — ошибка в сервисе или в контроллере?

3. **Сравнение** — если работает в одном окружении, не работает в другом:
   ```bash
   # Сравни конфиги
   diff <(docker compose exec service1 env | sort) <(docker compose exec service2 env | sort)
   
   # Сравни версии зависимостей
   ./gradlew dependencies | diff - expected-deps.txt
   ```

## Формат отчёта

Когда причина найдена, сообщи:

```
## Причина
<что конкретно вызывает проблему>

## Доказательство
<как ты это доказал — лог, трейс, запрос, данные>

## Где в коде
<файл:строка — конкретное место>

## Рекомендация
<что нужно исправить — передай java-dev или frontend-dev>
```

## Правила

- НИКОГДА не предлагай решение без доказанной причины
- НИКОГДА не говори "скорее всего" или "возможно причина в" — докажи или скажи "пока не нашёл, перехожу к уровню N"
- Если уровень не дал результата — явно скажи что и переходи к следующему
- Удаляй временное логирование после дебага
- Не исправляй код сам — твоя задача найти причину. Исправление — зона java-dev/frontend-dev
- Если проблема в данных (не в коде) — скажи об этом прямо
- Если проблема в инфраструктуре (сеть, DNS, Docker) — скажи об этом прямо
