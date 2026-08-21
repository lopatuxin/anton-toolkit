---
name: go-conventions
description: >
  Go conventions of this toolkit: error handling, context and goroutine discipline,
  interfaces and exports, the zero-comment policy, module and dependency rules, and the
  gofmt/build/vet/lint/test done criteria. Loaded automatically when working with Go files;
  also preloaded into the go-dev agent.
user-invocable: false
paths:
  - "**/*.go"
---

# Go conventions

These rules apply to every Go change, a one-line edit included. A concrete project's existing conventions win over anything here: read `go.mod` (module path, Go version, dependencies), the `Makefile` / `Taskfile` and `.golangci.yml`, learn the layout (`cmd/`, `internal/`, `pkg/`), find the analogue (an existing service, handler, config loader, test) and follow its pattern before writing.

## Hard rules

- Errors are values and every one is handled. Discard with `_ =` only when the call cannot fail in a way that matters, and say why in the report. Wrap with context when crossing a layer: `fmt.Errorf("open profile: %w", err)`. Compare with `errors.Is` / `errors.As`, not by string. Sentinel errors are package-level `var ErrX = errors.New(...)`.
- `panic` only for programmer bugs that cannot be recovered from at startup; bad input or a failed network call in a library path returns an error.
- `context.Context` is the first parameter of any function that does I/O, blocks or spawns work; it is propagated, never stored in a struct. `context.Background()` belongs in `main` and in tests, not in library code.
- Every goroutine has a stated way to end: a context, a closed channel, or a `sync.WaitGroup` the caller waits on. A goroutine without a termination path is a leak. Prefer `errgroup.Group` when several goroutines share a failure.
- Shared state is either guarded or not shared: `sync.Mutex`/`RWMutex` or channel ownership, no invented lock-free schemes. A struct with both a mutex and public fields is a bug — make the fields unexported.
- `defer` the cleanup right after the acquiring call (`resp.Body.Close()`, `f.Close()`, `mu.Unlock()`); check the error of a deferred `Close` when the result matters (writes, not reads).
- Accept interfaces, return structs. Define the interface in the package that consumes it, sized to what that consumer calls, not a mirror of the implementation's full method set.
- No dead or speculative public API: unexported by default, export only what crosses a package boundary and has a caller in this change. Grep for the caller before exporting.
- No `any` / `interface{}` where a concrete type or a type parameter works; generics only when they remove real duplication.
- Naming: no stuttering (`transport.Manager`, not `transport.TransportManager`), short receiver names (`m *Manager`), no `Get` prefix on plain accessors, acronyms in uniform case (`URL`, `ID`, `DNS`).
- No package-level mutable state and no `init()` with side effects: wiring happens in `main` and is passed down explicitly. Package-level `var` is for sentinel errors, immutable tables and compile-time interface assertions.
- Early return over nesting: handle the error and return, keep the happy path at the leftmost indent, at most three nesting levels.
- No logic duplication: check the package and its neighbours before writing and reuse or extract an unexported helper.
- Decompose: functions past ~50 lines get split; I/O, pure logic and assembly are separate.
- Platform-specific code lives in build-tagged files (`_windows.go`, `_linux.go`, `//go:build`), not behind a runtime `if runtime.GOOS == ...` for something the build can decide.
- No dead code, no TODO placeholders, no half-finished implementations: if a step cannot be completed, stop and report.

## Comments

The default is zero comments, and a file with none is the normal outcome: the code is read by an LLM, and anything a reader can reconstruct from the code costs more to read than it explains. Write a comment only when the code cannot state it — a hidden invariant, a workaround for a specific bug, a surprising external constraint such as a misbehaving API or a platform quirk — and keep it as short as the point allows. Do not write a restatement of what the code does, a design rationale for why this shape was chosen or an alternative rejected, a description of how the type fits the wider architecture, or a file-header essay; all of that belongs in the project's documentation. Doc comments on exported identifiers only when the project already writes them or a configured linter (`revive`, `golint`) demands them — then match the project's form exactly and keep them to one line. Machine-read directives (`//go:build`, `//go:generate`, `//nolint:`) are always fine. The comment language follows the project's own convention (its CLAUDE.md and the surrounding code); the examples below are English only because this document is.

- Correct: `// Windows clears this flag on every adapter change — re-apply it after the reconnect.`
- Incorrect: `// ManualLevelFor returns the rule-engine level for a match kind: 2 for name, whole domain and subnet, 3 for an app path.` — restates the code.
- Incorrect: `// Exported deliberately instead of being recomputed in the rule engine: a second computation in another package would eventually diverge from this one and the rule would silently stop applying.` — design rationale, reconstructible from the code; it belongs in the documentation.

## Modules and dependencies

- Prefer the standard library; a new dependency for something `net/http`, `encoding/json`, `log/slog`, `errors` or `sync` already does is a rejected change. Any other new dependency needs a justification in the report.
- Add a dependency with `go get <module>@<version>`, then `go mod tidy`; do not hand-edit `go.mod` version lines. Pin the version deliberately — an upgrade is its own change, never a side effect of `go get` without a version.
- If the project vendors (`vendor/` exists), run `go mod vendor` after any dependency change and stage the result.
- Libraries pulled in as a Go package rather than a released binary (sing-box, wireguard-go, netstack) expose internal APIs that are not a stable contract: they change between minor versions without a deprecation path. Read the actual source of the version in the module cache (`go doc`, or the file under `$GOPATH/pkg/mod`) before calling such an API, and never upgrade its version as a side effect of unrelated work.

## Non-Go files inside the module

Deploy scripts, systemd units, installer XML, Dockerfiles and configs inside a Go module follow the same discipline: find the existing analogue in the repo and match it, change only what the task requires, never invent a second way to do what the repo already does one way. Shell scripts get `set -euo pipefail` unless the repo deliberately does otherwise.

## Done criteria

Run in this order, fixing and re-running on the first failure:

- `gofmt -l .` prints nothing (or `goimports -l .`)
- `go build ./...`
- `go vet ./...`
- `golangci-lint run` when `.golangci.yml` exists
- `go test ./...`, plus the coverage gate when the project configures one

A change is done when all of them pass. Tests mirror the project's existing `*_test.go` files and `testdata/` fixtures, next to the code they cover.

## Library documentation

When unsure about the API of a library version, use the documentation tools available in the session: the Context7 connector (resolve-library-id, then query-docs) when present, otherwise WebFetch of the official docs. Do not guess signatures.
