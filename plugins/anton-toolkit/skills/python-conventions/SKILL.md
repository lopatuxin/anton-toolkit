---
name: python-conventions
description: >
  Python conventions of this toolkit: PEP 8 with full type hints, no comments or docstrings
  by default, error and async rules, package-manager discipline, and the ruff/mypy/pytest
  done criteria. Loaded automatically when working with Python files; also preloaded into
  the python-dev agent.
user-invocable: false
paths:
  - "**/*.py"
  - "**/*.pyi"
---

# Python conventions

These rules apply to every Python change, a one-line edit included. A concrete project's existing conventions win over anything here: read `pyproject.toml` / `setup.cfg` / `requirements*.txt` for the Python version, dependencies and linter configuration, find the analogue in the repo (an existing service, router, model, test) and follow its pattern before writing. Read `.env.example` and the settings modules when configuration is involved.

## Hard rules

- PEP 8 / PEP 257 strictly; line length and style follow the project config (`[tool.ruff]` / `[tool.black]` in `pyproject.toml`).
- Type hints on all public functions and methods, and on module-level variables with non-obvious types, in PEP 585/604 syntax (`list[str]`, `dict[str, int]`, `X | None`). Prefer `collections.abc` over `typing` for generics on 3.9+; use `from __future__ import annotations` if the project does.
- No comments and no docstrings by default — the code is read by an LLM. A comment only for a non-obvious why the reader cannot reconstruct from the code: a hidden invariant, a workaround for a specific bug, a surprising external constraint. A docstring only when the behaviour is not obvious from the signature and types.
- No logic duplication: before writing, check the module and its neighbours for an equivalent and reuse it or extract a shared helper.
- Decompose: functions past ~30 lines get split; I/O, pure logic, data assembly and validation are separate. Early returns over nested ifs, at most three nesting levels.
- Errors: raise specific exception types that match the project's hierarchy, never bare `except:`; no defensive `try/except` for failures that cannot happen at the call site; let exceptions propagate unless there is a concrete recovery.
- Dataclasses or Pydantic for structured data, whichever the project uses — do not mix them, and do not pass dicts or tuples where a dataclass belongs.
- Async projects stay async end-to-end: no `asyncio.run()` inside library code, no blocking I/O in async functions.
- Imports absolute by default, grouped stdlib / third-party / local with blank lines between groups, or whatever `ruff`/`isort` enforces.
- `pathlib.Path`, f-strings and `logging` (not `print`).
- No decorative separators, banners or ASCII art; no usage examples or `__main__` blocks unless asked; no "just in case" code.
- No dead code, no TODO placeholders, no half-finished implementations: if a step cannot be completed, stop and report.
- Use the stdlib and the packages already installed; a new dependency needs a justification in the report.

## Package managers

Detect the project's tool — `uv`, `poetry`, `pip-tools` or plain `pip` — and use only that one. Adding a dependency: `uv add <pkg>`, `poetry add <pkg>`, or with plain pip an entry in the correct `requirements*.txt` (runtime vs dev) plus a note in the report. Do not run `pip install` in a project that uses `uv` or `poetry`.

## Done criteria

Run the project's checks in this order, fixing and re-running on the first failure:

- lint and types: `ruff check .`, `mypy <package>` (or whatever the project configures)
- format: `ruff format --check .` or `black --check .`
- smoke import: `python -c "import <package>"`
- tests: `pytest`, through the project's runner (`uv run pytest`, `poetry run pytest`), plus the coverage gate when the project configures one (`--cov` with `fail_under`)

A change is done when all of them pass. Tests follow the project's existing pytest style: its fixtures and `conftest.py` helpers, `pytest.mark.parametrize` for cases that differ only in input, test modules placed where the project places them.

## Library documentation

When unsure about the API of a library version, use the documentation tools available in the session: the Context7 connector (resolve-library-id, then query-docs) when present, otherwise WebFetch of the official docs. Do not guess signatures.
