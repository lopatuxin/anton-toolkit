---
name: task-interview
description: >
  Conduct a short, adaptive interview before work begins to agree on the desired
  outcome and how the owner will accept the whole deliverable. Use across domains
  for requests such as «проведи интервью перед задачей» or «давай решим, что я
  хочу получить и как это проверить». Use feature-planner for a software
  implementation plan. A straightforward request to do already specified work
  does not need a new interview.
---

# Task interview

Run the conversation in the main chat, in plain Russian. The output is a brief the person doing the work can follow and the owner can use to accept or return the finished result.

## Conduct the interview

Start with the user's goal, the materials they supplied, and decisions already made. In a discussion-only request, work from the conversation. Otherwise consult an identified project source when it settles a consequential question cheaply. Carry decisions forward. If a new answer changes an earlier choice, update the brief and the checks it affects.

Ask one or two related questions per turn and wait for the answer. Choose the uncertainty that would most change the result. When the goal is unclear, ask who will use the result, in what situation, and what they should be able to do or understand. When the goal is known, start with one concrete moment in that person's experience. Ask what should happen and what the owner would look for to judge it. Offer plausible alternatives if they help the owner articulate a preference. Leave room for their own answer.

Unpack words like «удобно», «понятно» or «реалистично» using an example, a reference, or a result the owner would send back. Ask what feature of the reference matters. If the owner specifies a production method, keep it as a constraint. An example, a proposed method, or a suggestion from you remains illustrative until the owner adopts it. Distinguish required outcomes, preferences, and choices left to the implementer.

Move from the example to the whole assignment. Identify the remaining parts or use cases and the points where they join. Establish which choices apply throughout and which belong to that example alone. Combine equivalent parts under a shared check and state its coverage. Ask about a transition, exception, or failure only if it could change what the owner accepts. Stop asking when another answer would no longer change the work or its acceptance. A simple task may need a single exchange.

## Turn answers into a brief

Give the owner a concise draft in their terms, scaled to the task. Include:

- The intended user, deliverable, and what success lets them do or understand.
- Agreed content, behavior or appearance, relevant constraints and references, and any material decisions still open.
- For **every required part**, the observable result and a practical way to check it. Organize by the units of the actual work: sections of a document, scenes of a film, steps of a service, or user journeys in a product.
- A check of the **finished result as a whole**, in the form and situation in which the recipient will use it. Include the connections between parts. Give the owner a concrete reason to return an incomplete result. When taste is decisive, record who judges it and against which agreed example or signs. Use numerical thresholds only when grounded in a real constraint or the owner's decision.

A short list usually suffices. For a larger task use a table with «Что получаем», «Как проверить» and «Признак готовности». Checks describe a future inspection; leave them unchecked. For example, for an expense summary, «итог сходится с источником» checks the arithmetic. If the owner's goal is to explain the rise in spending, also ask a reader to identify the main contributing item from the finished summary.

Invite the owner to correct or confirm the brief once. Incorporate corrections where they belong, preserving unaffected decisions. Mark unresolved choices explicitly. A confirmation accepts the brief; perform implementation only when the user requested it, including any next step already explicitly authorized.

When the owner confirms a project brief, save the agreed decisions, acceptance checks and links to approved artifacts in the project's authoritative documentation in that same turn. Use the existing location and format. For example, if a decision resolves an open question in the phase plan, replace the question with the agreed requirement and its check. A chat recap alone leaves the plan out of date. Link to the saved material in the reply, or say what remains unsaved if the write fails. Keep a standalone interview in chat unless a file was requested, and honor an explicit chat-only request.
