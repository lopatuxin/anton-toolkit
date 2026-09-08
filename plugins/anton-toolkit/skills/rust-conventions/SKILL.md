---
name: rust-conventions
description: >
  Rust conventions of this toolkit: errors as Result, the unsafe and panic rules, ownership
  instead of shared-mutability workarounds, the zero-comment policy, flat data layout in hot
  code, crate and dependency rules, WebAssembly specifics, and the fmt/clippy/test done
  criteria. Loaded automatically when working with Rust files; also preloaded into the
  rust-dev agent.
user-invocable: false
paths:
  - "**/*.rs"
---

# Rust conventions

These rules apply to every Rust change, a one-line edit included. A concrete project's existing conventions win over anything here: read `Cargo.toml` (edition, features, dependencies), the workspace layout, `rustfmt.toml` and `clippy.toml`, the `justfile` / `Makefile` if present, find the analogue (an existing module, system, loader, test) and follow its pattern before writing.

## Hard rules

- Errors are values: a fallible function returns `Result<T, E>`. A library defines its own error enum with `thiserror`; binaries and top-level glue use `anyhow::Result` with `.context("...")` at layer crossings. Never match on an error's text.
- `unwrap` / `expect` outside tests only where failure is impossible by construction, and then `expect` carries the reason. Every such use is named in the report. `unwrap` on parsing, I/O or anything derived from user data is a rejected change.
- `panic!` only for programmer bugs detectable at startup. A library path returns an error. In a WebAssembly build a panic kills the module for the rest of the page — there is no "it will just restart".
- `unsafe` needs a justification in the report and a `// SAFETY:` line stating the invariant that makes it sound. `unsafe` to get around a borrow error is never the answer — reshape the data.
- Ownership first: pass `&T` / `&mut T`, take `T` when the callee stores it. `Rc<RefCell<...>>` and `Arc<Mutex<...>>` are for genuinely shared ownership, not an escape from the borrow checker; the usual fix is indices into a flat collection.
- `clone()` is a decision, not a reflex: fine in cold code or when it removes a lifetime knot, never per element in a hot loop.
- Iterators when the intent is a transformation; a plain `for` when the body mutates several collections at once. No iterator chain so long it needs re-reading.
- No `dyn Trait` on a hot path where an enum or a generic works. `Box<dyn Error>` belongs in binaries, not in a library's public API.
- No dead or speculative `pub`: private by default, `pub(crate)` before `pub`, and `pub` only for what crosses a crate boundary and has a caller in this change.
- Naming: `snake_case` for modules and functions, `CamelCase` for types, `SCREAMING_SNAKE` for constants; no stuttering (`render::Pass`, not `render::RenderPass`); acronyms as ordinary words (`HttpClient`, `id`).
- Early return over nesting: `?`, `let ... else`, guard clauses; at most three levels of nesting.
- Decompose: functions past ~50 lines get split; I/O, pure computation and assembly are separate.
- No logic duplication: read the module and its neighbours, reuse or extract before writing a second copy.
- No dead code, no `todo!()` / `unimplemented!()` left behind, no half-finished implementations. If a step cannot be completed, stop and report.

## Data layout in hot code

Hot code is anything running per frame or per simulation step.

- Entities are parallel flat collections — a `Vec` per field, addressed by index — not a graph of structs holding references to each other. The borrow checker and the cache want the same shape here.
- A handle from one entity to another is an index (`u32`), never a reference, never `Rc`.
- No allocation per frame: reuse buffers, `clear()` instead of a fresh `Vec`, `with_capacity` where the size is known.
- No `HashMap` lookup per element where a `Vec` indexed by id works.
- These are the cheap defaults, not a licence for hand-tuned tricks: anything beyond them needs a measurement in the report.

## Comments

The default is zero comments, and a file with none is the normal outcome: the code is read by an LLM, and anything reconstructible from the code costs more to read than it explains. Write a comment only when the code cannot state it — a hidden invariant, a workaround for a specific bug, a surprising external constraint such as a driver quirk or a misbehaving API — and keep it as short as the point allows. Do not write a restatement of what the code does, a design rationale for the chosen shape, a rejected alternative, or a description of how the type fits the wider architecture; that belongs in the project's documentation. `// SAFETY:` on every `unsafe` block is required and is not subject to this rule. Doc comments (`///`) on public items only where the crate already writes them or a configured lint demands them. Machine-read attributes (`#[cfg]`, `#[allow(...)]` with a reason) are always fine. The comment language follows the project's own convention.

- Correct: `// SAFETY: the buffer is sized in new() and never reallocated, so this pointer stays valid.`
- Incorrect: `// Moves every entity by its velocity.` — restates the code.

## Crates and dependencies

- Prefer `std`. A crate for what `std` already does is a rejected change; any other new dependency needs a justification in the report.
- Add with `cargo add <crate>@<version>`; do not hand-edit version lines in `Cargo.toml`. An upgrade is its own change, never a side effect.
- Enable only the features actually used; `default-features = false` where the default pulls in a runtime the project does not need.
- Before adding a crate to code that ships to the browser, check that it supports `wasm32-unknown-unknown`: many crates reach for threads, the filesystem or `std::time` and fail there at runtime rather than at build time.
- `Cargo.lock` is committed for binaries and for a workspace with binaries.

## WebAssembly

- The core of an engine or library stays free of browser calls — no `web-sys`, no `wasm-bindgen` inside it. Browser access lives in the outer crate, so the core can also be built natively.
- `std::time::Instant` and `SystemTime` do not work on `wasm32-unknown-unknown`: time is passed in by the caller.
- `std::thread::spawn` fails there unless the project has deliberately set up cross-origin isolation.
- Build with `cargo build --target wasm32-unknown-unknown`, package with `wasm-pack`. Keep `console_error_panic_hook` in development builds so a panic is readable in the browser console.
- Watch the size of the produced `.wasm`: `opt-level = "s"` or `"z"` plus `lto = true` in the release profile once it grows.

## Non-Rust files inside the crate

Shaders (WGSL), `build.rs`, Dockerfiles, TOML/JSON configs and scripts inside the crate follow the same discipline: find the existing analogue in the repo and match it, change only what the task requires, never invent a second way to do what the repo already does one way. Shell scripts get `set -euo pipefail` unless the repo deliberately does otherwise.

## Done criteria

Run in this order, fixing and re-running on the first failure:

- `cargo fmt --check` prints nothing
- `cargo clippy --all-targets --all-features -- -D warnings`
- `cargo test`
- `cargo build --target wasm32-unknown-unknown` for every crate that ships to the browser

A change is done when all of them pass. Tests go into `#[cfg(test)] mod tests` next to the code, or into `tests/` for integration tests, matching the project's existing choice.

## Library documentation

When unsure about the API of a crate version, use the documentation tools available in the session: the Context7 connector (resolve-library-id, then query-docs) when present, otherwise WebFetch of docs.rs for the exact version. Do not guess signatures — `wgpu`, `winit` and the WebAssembly crates change their APIs between minor versions.
