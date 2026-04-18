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

# Debug — systematic root cause analysis

Find the TRUE cause of the problem, not a hypothetical one. Never propose a solution until the cause is proven.

## Core rule

**PROOF > ASSUMPTION.** Do not say "the problem is probably in X". Instead — prove it is X through logs, traces, reproduction, or elimination of alternatives.

## Process — Method escalation

Go from simple to complex. If method N gives no answer — move to N+1.

### Level 1: Reproduction and logs

**Goal: see the error with your own eyes.**

1. **Clarify the symptom.** Ask the user:
   - What exactly happens? (exact error, response code, behavior)
   - When? (always, sometimes, after a specific action)
   - Where? (which endpoint, which page, which service)

2. **Reproduce the error:**
   ```bash
   # API — send the same request
   curl -v -X POST http://localhost:8080/api/... -H "Content-Type: application/json" -d '{...}'
   
   # Browser — open the same page via Playwright/Chrome DevTools
   ```

3. **Read the logs:**
   ```bash
   # Docker containers
   docker compose logs --tail=100 <service>
   docker compose logs --tail=100 <service> | grep -i "error\|exception\|warn"
   
   # File logs
   tail -100 logs/app.log | grep -i "error\|exception"
   
   # Frontend — console errors via Playwright
   ```

4. **Find the stack trace.** If there is an exception — read it IN FULL. Find the line in YOUR code (not in the framework) where the error originated.

**If you found the exact line and cause → STOP. Report the cause.**

### Level 2: Code and data analysis

**Goal: understand the logic that led to the error.**

1. **Read the code** around the error point. Not just the line, but the full method and calling code.

2. **Trace the call chain.** Track the data path from input to error:
   ```
   Controller → Service → Repository → DB
   ```
   For each step: what comes in? what is returned? where does the data get corrupted?

3. **Check the data:**
   ```bash
   # SQL — what is actually in the database?
   docker compose exec postgres psql -U app -d appdb -c "SELECT * FROM orders WHERE id = ..."
   
   # Redis — what is in the cache?
   docker compose exec redis redis-cli GET "key"
   ```

4. **Check the configuration:**
   ```bash
   # Env variables inside the container
   docker compose exec <service> env | grep -i "spring\|db\|redis"
   
   # Application config
   cat src/main/resources/application.yml
   ```

**If you found the cause → STOP. Report it.**

### Level 3: Dynamic analysis

**Goal: observe the application in real time.**

1. **Add temporary logging** to suspicious code:
   ```java
   log.debug(">>> Input: {}, State: {}", input, state);
   ```
   Then reproduce the error and read the logs. MANDATORY remove temporary logs after debugging.

2. **Spring Boot Actuator:**
   ```bash
   # Health check
   curl http://localhost:8080/actuator/health
   
   # Beans — is the needed component loaded?
   curl http://localhost:8080/actuator/beans | jq '.contexts[].beans | keys[]' | grep -i "order"
   
   # HTTP traces (if enabled)
   curl http://localhost:8080/actuator/httpexchanges
   ```

3. **Network analysis:**
   ```bash
   # Check that the port is listening
   curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health
   
   # DNS/connection issues between containers
   docker compose exec <service> curl -v http://other-service:8080/health
   ```

**If you found the cause → STOP. Report it.**

### Level 4: Profiling (slow performance)

**Goal: find the specific bottleneck.**

1. **Measure response time:**
   ```bash
   curl -w "\n  DNS: %{time_namelookup}s\n  Connect: %{time_connect}s\n  TTFB: %{time_starttransfer}s\n  Total: %{time_total}s\n" \
     http://localhost:8080/api/...
   ```

2. **SQL queries — enable logging:**
   ```yaml
   # application.yml — temporary!
   logging.level.org.hibernate.SQL: DEBUG
   logging.level.org.hibernate.type.descriptor.sql: TRACE
   ```
   Reproduce the slow request → see which SQL queries execute (N+1?).

3. **JVM profiling:**
   ```bash
   # Thread dump — what are threads doing right now?
   docker compose exec <service> jcmd 1 Thread.print
   
   # GC statistics
   docker compose exec <service> jcmd 1 GC.heap_info
   
   # If async-profiler is available
   docker compose exec <service> jcmd 1 jfr.start duration=30s filename=/tmp/profile.jfr
   ```

4. **Frontend performance:**
   - Chrome DevTools → Performance tab (via MCP)
   - Lighthouse audit
   - Network waterfall — which request is slow?

**If you found the bottleneck → STOP. Report it.**

### Level 5: Bisection and isolation

**Goal: narrow the area down to the minimum when everything else has failed.**

1. **Git bisect** — if "it worked before":
   ```bash
   git log --oneline -20  # find the approximate commit
   git bisect start
   git bisect bad
   git bisect good <commit-hash>
   # Test each commit
   ```

2. **Minimal reproducible example:**
   - Remove all optional fields from the request — does the error persist?
   - Substitute different data — is the error data-dependent?
   - Call the service directly (without the controller) — is the error in the service or the controller?

3. **Comparison** — if it works in one environment but not another:
   ```bash
   # Compare configs
   diff <(docker compose exec service1 env | sort) <(docker compose exec service2 env | sort)
   
   # Compare dependency versions
   ./gradlew dependencies | diff - expected-deps.txt
   ```

## Report format

When the cause is found, report:

```
## Root cause
<what specifically causes the problem>

## Proof
<how you proved it — log, trace, request, data>

## Location in code
<file:line — exact location>

## Recommendation
<what needs to be fixed — hand off to java-dev, test-writer, or frontend-dev>
```

## Rules

- NEVER propose a solution without a proven cause
- NEVER say "probably" or "the cause might be" — prove it or say "haven't found it yet, moving to level N"
- If a level gives no result — explicitly say so and move to the next
- Remove temporary logging after debugging
- Do not fix code yourself — your job is to find the cause. Fixing is the responsibility of java-dev/test-writer/frontend-dev
- If the problem is in tests or test configs (application-test.yml etc.) — hand off to test-writer, not java-dev
- If the problem is in data (not in code) — say so explicitly
- If the problem is in infrastructure (network, DNS, Docker) — say so explicitly
