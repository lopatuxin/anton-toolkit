---
name: frontend-conventions
description: >
  Frontend (React/TypeScript) conventions of this toolkit: no business logic on the client,
  one hook per page, LLM-friendly naming, types, components and comments, non-generic visual
  choices, and the build/lint/test done criteria. Loaded automatically when working with
  frontend files; also preloaded into the frontend-dev agent.
user-invocable: false
paths:
  - "**/*.tsx"
  - "**/*.ts"
  - "**/*.jsx"
  - "**/*.js"
  - "**/*.css"
  - "**/*.scss"
---

# Frontend conventions

These rules apply to every frontend change, a one-line edit included. A concrete project's existing conventions win over anything here: check `package.json` and `tsconfig.json`, find the analogues — how components are organised, the styling approach (CSS Modules, Tailwind, SCSS), API calls (fetch, axios, react-query), routing, state management — and place new files by the same principles. Type everything: props, API responses, state. Use the libraries already in the project; a new dependency needs a justification in the report.

## Hard rules

- No business logic on the frontend. Sorting, filtering, aggregation and pagination are the backend's job; the frontend displays what it receives.
  - Incorrect: `[...data].sort((a, b) => b.amount - a.amount).slice(0, 4)`
  - Correct: `data.map(item => ...)` over data the backend already prepared
- One hook/endpoint — one page. Do not reuse a hook across pages that display different data. Before creating a hook, Grep whether the same endpoint is used on another page; if it is, separate hooks and separate backend endpoints are required.

## LLM-friendly code

The code is read and edited by future Claude sessions; each rule below maximises comprehension and minimises token cost. Apply them to new code; in existing code follow the file's own patterns and leave unrelated style alone.

Naming and exports:
- Named exports only, no `export default` — default exports break Grep and goto-definition.
- Names unique project-wide: `UserProfileCard`, not `Card`. Generic names give ambiguous Grep hits and force the next agent to read unrelated files.
- File name = exported symbol name (`UserProfileCard.tsx` exports `UserProfileCard`); components in `PascalCase`, everything else `camelCase`.
- No abbreviations: `user`, `button`, `config` — not `usr`, `btn`, `cfg`.
- Boolean names start with `is`/`has`/`can`/`should`, so the type is obvious without the signature.
- No barrel `index.ts` except at the public API boundary of a feature module; deep re-exports hide where symbols live.

Types:
- Explicit types for the public API — exported functions, component props, hook return types. Inference for local variables: annotating what TypeScript infers is token waste.
- No `any`; use `unknown` and narrow explicitly.
- `type <ComponentName>Props = {...}` declared immediately above the component, so the contract is visible without scrolling.
- Discriminated unions over interdependent optional fields: `{ status: 'ok'; data: T } | { status: 'err'; error: Error } | { status: 'loading' }`, not `{ data?: T; error?: Error; loading?: boolean }`.
- Validate external data (API responses, forms, env) with the project's schema library (Zod, valibot, yup) and derive the type via `z.infer<>` — one declaration gives both the runtime check and the type.
- One source of truth per domain type; no duplicate `User` shapes in three places.

Components and hooks:
- One public component per file; small private subcomponents used only there may share it. Files stay under ~200 lines so the next agent reads them in one call.
- No `useMemo`/`useCallback` by default — only for a measured re-render cost or a referential identity a downstream hook or effect requires. Default memoisation is noise that LLMs propagate.
- Early return for conditional rendering; nested ternaries deeper than one level are out.
- Hooks isolate side effects and JSX stays declarative: no `fetch`, parsing and rendering interleaved in one function body.
- Co-locate a component with its types, hooks and tests (same file or same folder), not in parallel `types/`, `hooks/`, `tests/` trees.

Comments and token economy:
- No `// what` comments — well-named identifiers explain what. Comments only for a `// why`: a non-obvious constraint, a workaround for a specific bug, a subtle invariant the reader could not infer.
- No commented-out code (git remembers) and no tombstone comments (`// removed legacy`, `// used by X`) — they rot.
- No dead code or "kept for later" stubs: every export has at least one caller. No long JSDoc on internal components; the type is the contract, do not duplicate it in a comment.
- Prefer well-known libraries the model already knows (React Hook Form + Zod, TanStack Query, Zustand) over hand-rolled equivalents — fewer tokens to explain them later.

## Visual choices without a design system

This section applies only when visual choices must be invented from scratch — no design system, no Figma or mockup, no analogue component to copy. When the project has an established style, fonts, colour tokens or reference components, follow them and ignore this section.

When inventing, avoid the generic AI aesthetic:
- Fonts: not Inter, Roboto, Arial, system-ui or another stock sans-serif as the primary typeface; choose a face with character (a serif, a humanist sans, a display face) that matches the product's tone.
- Colours: no purple-to-blue gradients, pastel rainbow palettes or neon on black; one accent plus neutrals, consistent across components.
- Layout: not the "centred card on a gradient background" or "three-column feature grid with icons" template; derive the layout from the content's information hierarchy.
- Animation: none on page load or the hero; motion only for micro-interactions that give feedback (button press, form validation, list reorder).

A Tailwind config with `font-display: 'Fraunces'` and a custom green palette means those tokens, and this section does not apply. No design system and "сделай красиво" means one distinctive font (say, "Newsreader" for headings with a system stack for body), one accent colour from the brand context, and a plain layout driven by the content — not `font-family: Inter` with a `bg-gradient-to-br from-purple-500 to-blue-600` hero.

## Done criteria

A change is done when all of these pass:

- `npm run build` (or the project's `yarn`/`pnpm` equivalent) with no TypeScript errors
- `npm run lint` when the project has a linter
- the tests through the project's runner (`npm test`, `npx vitest run`, `npx jest`), plus the coverage gate when the project configures one
- the affected page renders without console errors

Tests mirror the project's existing test files (Vitest or Jest with Testing Library, as already configured) and sit next to the component they cover.

## Library documentation

When unsure about the API of a library version, use the documentation tools available in the session: the Context7 connector (resolve-library-id, then query-docs) when present, otherwise WebFetch of the official docs. Do not guess signatures.
