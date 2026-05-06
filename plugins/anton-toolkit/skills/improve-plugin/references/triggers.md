# Trigger and Discrimination Reference

This file expands the compact trigger rules in the skill `description`. Read it after invocation when you are uncertain whether the current situation is a true plugin-level incident.

The `description` field carries the matching signals (trigger phrases, the proactive rule, the manual-patch rule, the high-level discrimination). This file carries the long-form examples and the edge-case test.

---

## Full proactive rule

**Rule:** if the user corrects the behavior of a plugin component (agent or skill) AND the correction is about behavior that should persist across sessions, **proactively offer to run `improve-plugin` in the SAME reply where you acknowledge the mistake**. Do not wait for a second prompt. Do not ask "should I fix the plugin?" — just say "Правлю плагин через improve-plugin" and proceed.

"Behavior that should persist" includes:
- wrong description in the agent/skill that caused mis-routing or no-routing
- missing trigger phrase that caused the skill not to fire
- wrong delegation rule (skill A should have called agent B, but didn't)
- skill produced an artifact in the wrong language / wrong format / wrong style for the project context
- agent silently took an action it should have asked about

---

## Full manual-patch rule

**Rule:** manual patch in the project does NOT substitute a plugin fix.

If you already fixed the symptom in the project via `Edit` / `Write` / `Bash` after the user complained about a plugin component's output — you MUST STILL invoke `improve-plugin` in the same reply.

**Why:** fixing the artifact in the current project does not fix the skill/agent that produced it. On the next invocation in any project, the same bug returns. Project-level patch ≠ plugin-level patch.

The user's complaint about plugin output stays open until the plugin source is updated and committed.

---

## Plugin-level-correction test

When in doubt, ask: **"Can I phrase this fix as 'in the agent/skill description/body, add/change <rule, trigger, or language/format constraint>'?"**

- If yes → it IS plugin-level. Proactively run `improve-plugin`.
- If no → it is a one-off project-level override with no downstream rule. Skip.

---

## Correct examples — DO invoke `improve-plugin`

### Example 1: language rule violation

> User: "концепт на русском, а заголовки на английском — это косяк".
> You translated the headings via `Edit` to fix the artifact.

The `system-designer` skill just produced English headings in a Russian-language project — that is a plugin-level bug in the skill's language rules. You MUST run `improve-plugin` on `system-designer` in the same reply. Do not treat "I already fixed the file" as closure.

### Example 2: missed invocation

> User: "почему ты сам правил Java-файл, должен был java-dev вызвать".

The agent `java-dev` should have been invoked but was not. Even though there is no broken artifact to revert, the agent's `description` is missing the trigger that should have fired. Plugin-level fix.

### Example 3: non-imperative complaint

> User: "это косяк" (no "fix" verb).

Evaluative remarks about a skill/agent output ARE the correction signal. Treat the same as an explicit "fix the plugin".

---

## Incorrect examples — SKIP `improve-plugin`

### Example 1: one-off factual override

> User: "in this specific file use 'foo' instead of 'bar'".

One-off factual override with no generalization to the skill's behavior. Skip.

### Example 2: fresh-session design discussion

> User (start of session, no prior incidents): "хочу обсудить, как улучшить плагин X".

No incident occurred yet. Use `extend-plugin` (proactive modification) or `create-plugin` (new plugin) instead.

### Example 3: user accepts current behavior

> User: "ну ладно, в этот раз пусть так — но в следующий раз сделай иначе".

User explicitly tolerates current behavior in this session. No plugin fix until they actually flag it as broken.

---

## Discrimination — when NOT to fire

Only trigger when there was a **concrete incident** with a plugin skill/agent earlier in the current session. An "incident" includes BOTH:

- (a) a plugin component ran and produced wrong output, OR
- (b) a plugin component should have been invoked but was NOT.

The second case is just as much an incident as the first.

If neither (a) nor (b) happened — fresh session, user is just planning or asking — do NOT invoke `improve-plugin`. Delegate:
- to `extend-plugin` if the user wants to add new behavior to an existing plugin,
- to `create-plugin` if the user wants a new plugin.

---

## Interaction model

This skill runs DIRECTLY in conversation. Engages in at most one round of user interaction — the target-plugin confirmation in Step 1. No interview, no multi-turn dialog beyond that.
