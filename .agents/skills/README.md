# Skill Invocation Playbook

This file is for AI agents choosing repo-local skills; human project documentation lives in `README.md`, `AGENTS.md`, and `docs/`.

This directory contains optional workflow skills for this repository. Project rules come first: read `AGENTS.md`, the scoped `.cursor/rules/`, and the relevant runtime docs before applying any generic workflow skill.

## Core stack

- `mattpocock-tdd/SKILL.md`
- `mattpocock-improve-codebase-architecture/SKILL.md`

## Manual opt-in

- `top-down-node-architect/SKILL.md` — use only when the user explicitly asks for a top-down approach, wishful thinking, or stubs-first decomposition.

## How to choose quickly

- **Runtime, scene, input, or physics changes:** start from `AGENTS.md`, `.cursor/rules/20-game-runtime.mdc`, and `docs/ARCHITECTURE_RUNTIME.md`; pair with `mattpocock-tdd` when behavior is risky.
- **Large refactor or architecture drift:** run `mattpocock-improve-codebase-architecture`.
- **Top-down requests:** use `top-down-node-architect` only when the user explicitly asks for that workflow, then pair with `mattpocock-tdd` if implementation follows.

## Usage cadence

- The project architecture rules override any generic method advice from a skill.
- Use `tdd` for most implementation changes that touch runtime, kernel, or bridge behavior.
- Use architecture skill sparingly for larger changes, not every PR.
- Keep YAGNI in force when a manual top-down workflow is requested; do not add abstraction layers just because the skill can name them.