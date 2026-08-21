---
name: debug
description: >
  Systematic root-cause analysis of an error, crash, slow or wrong behavior: reproduce it,
  read logs and stack traces, trace the code and data, escalate to dynamic analysis,
  profiling, and bisection until the cause is proven — no fix is proposed on a guess. Use
  on an explicit request to investigate a problem, not on every mention of something not
  working; a sizeable fix is handed to the dev agent of the module's language, a small
  well-understood one is applied directly.
when_to_use: >
  "найди причину", "разберись почему падает", "дебаг", "/debug"
---

# Debug — systematic root-cause analysis

Find the real cause, not a plausible one. A fix built on a guess buys a second round of debugging, so no fix is proposed until the cause is proven.

## Core rule

Proof beats assumption. "The problem is probably in X" is not a result. Prove it is X — with a log line, a stack trace, a reproduced request, a data row, or by eliminating the alternatives — or say plainly "not found yet, moving to level N".

Reading the code first is fine and often the fastest way in. What is not fine is stopping at a theory that nothing has confirmed.

## Escalation ladder

Go from cheap to expensive. When a level gives no answer, say so and move to the next. When the cause is proven at any level, stop there and report — the remaining levels are not a checklist to complete.

Stack specifics — JVM tooling, Spring Actuator, Docker log and exec commands, Hibernate SQL logging, Gradle — live in `${CLAUDE_SKILL_DIR}/references/jvm-and-docker.md`; read it when the stack is JVM or Docker. The levels below say what to collect and how to prove a cause on any stack.

### Level 1 — reproduce and read the evidence

Goal: see the failure yourself.

1. Pin the symptom. If the report is vague, ask the user in Russian: what exactly happens (the exact error text, response code, or wrong value), when (always, sometimes, after a specific action), where (which endpoint, page, service). Do not ask what the report already states.
2. Reproduce it. For an API, send the same request again (`curl -v ...`). For a UI, open the same page with the browser tools available in the session and watch the console and the network panel.
3. Read the logs around the moment of failure — application logs, container logs, browser console — filtered for errors and warnings.
4. Read the stack trace in full, down to the last `Caused by`. The first frame in the project's own code, not in the framework, is where the investigation starts.

Stop when the exact line and cause are found.

### Level 2 — code and data

Goal: understand the logic that led to the failure.

1. Read the code around the failure point — the whole method and its callers, not one line.
2. Trace the data path from input to failure (request → handler → service → storage). At each step: what comes in, what goes out, where does it stop matching expectations.
3. Look at the actual data: query the database or cache for the record involved. A bug that "cannot happen" is usually data the code never expected.
4. Check the configuration the process really runs with — environment variables inside the container, the active profile, the config file that is actually loaded — not the one in the repo.

Stop when the cause is found.

### Level 3 — dynamic analysis

Goal: observe the running system.

1. Add temporary logging at the suspicious points (inputs, state, which branch was taken), reproduce, read. Remove it when done — a debug log left behind is the next incident's noise.
2. Ask the runtime what it actually loaded: which components are registered, which configuration is active, which routes exist.
3. Check the network path: is the port listening, does service A resolve and reach service B from inside its own container, does the proxy forward the header.

Stop when the cause is found.

### Level 4 — profiling (slow or hanging)

Goal: a measured bottleneck, not "it's slow".

1. Measure first: time the request end to end and split it (`curl -w` with connect, first-byte, and total times). The number is the proof later and the baseline for the fix.
2. Enable query logging temporarily and count what one request executes — an N+1 shows up as the same query repeated per row.
3. Take a thread dump or a CPU profile while the slow request runs — what are the threads actually doing?
4. Frontend: record a performance profile and the network waterfall with the browser tools available in the session — which request or render is slow?

Stop when the bottleneck is measured.

### Level 5 — bisection and isolation

Goal: shrink the search space when everything else failed.

1. If it worked before: `git bisect` between the last known good commit and now, testing each step with the reproduction from level 1.
2. Minimal reproduction: strip optional fields from the request — does it still fail? Swap the data — is it data-dependent? Call the service directly, bypassing the controller — which layer fails?
3. If it works in one environment and not another: diff the environments — variables, config, dependency versions — before diffing the code.

## Report

Report in Russian, in this order: the cause (what exactly produces the problem), the proof (the log line, trace, request, or data row that shows it), the location (`file:line`), and what to do next with who does it. A cause without its proof goes back to the ladder, not into the report.

## Hand-off

The fix goes to the dev agent of the module's language (java-dev, kotlin-dev, python-dev, go-dev, frontend-dev) when it is sizeable; a small, well-understood fix is applied directly in the main session. A problem in tests or test configuration goes to test-writer. When the problem is in the data rather than the code, or in the infrastructure (network, DNS, containers), say so explicitly — there is nothing to hand to a dev agent.

## Rules

- No fix is proposed without a proven cause; "probably" is replaced by either proof or "not found yet, moving to level N".
- A level that gave nothing is named as exhausted before moving on, so the reader can follow the elimination.
- Temporary logging and temporary config changes are removed before the report.
