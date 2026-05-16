# Agent Instructions & Project Context

This is the high-level, tool-agnostic entrypoint for agents working on this gamified portfolio. Keep it thin: route agents to the canonical docs and rules rather than restating them here.

## Canonical guidance

- **Scoped agent rules:** [`.agents/rules/`](.agents/rules/) is the canonical source for coding rules, runtime gotchas, architecture boundaries, React overlay constraints, and documentation freshness policy.
- **Runtime architecture:** [`docs/runtime-architecture.md`](docs/runtime-architecture.md) explains how the current React + Phaser runtime is structured.
- **Architecture direction:** [`docs/architecture-direction.md`](docs/architecture-direction.md) records the current technical direction without overriding the scoped rules.
- **Runtime modes:** [`docs/runtime-modes.md`](docs/runtime-modes.md) explains app mode transitions and parent-scene returns.
- **Visual identity:** [`docs/design/style-guide.md`](docs/design/style-guide.md) is the source of truth for the "Digital Sketchbook" aesthetic.

If another AI tool needs its own entry file, keep it as a thin pointer back to this file and [`.agents/rules/`](.agents/rules/). Do not duplicate the scoped rules into tool-specific files.

## Agent skills

### Issue tracker

Issues and PRDs are tracked in GitHub Issues for `DaniloNovakovic/danilonovakovic.github.io`. See [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md).

### Triage labels

Uses the default mattpocock/skills triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md).

### Domain docs

Single-context repo: read root `CONTEXT.md` and `docs/adr/` when present. See [`docs/agents/domain.md`](docs/agents/domain.md). Missing context and ADR files are allowed; create them lazily only when real terminology or durable decisions need recording.

### Sketchbook Ridge team roles

When Danilo invokes helper roles such as "Producer", "Level Designer", or "Audio Designer", use [`docs/agents/sketchbook-ridge-team.md`](docs/agents/sketchbook-ridge-team.md) for the role contract and activation rules.

When Danilo invokes the Producer specifically, use [`.agents/skills/producer/SKILL.md`](.agents/skills/producer/SKILL.md) for the repeatable producer workflow.

When Danilo invokes the Architect specifically, use [`.agents/skills/architect/SKILL.md`](.agents/skills/architect/SKILL.md) for the repeatable anti-slop and shared-seam review workflow.

### Sprite asset pipeline

When generating or converting sprite assets for Phaser scenes, use [`.agents/skills/sketchbook-sprite-pipeline/SKILL.md`](.agents/skills/sketchbook-sprite-pipeline/SKILL.md) to preserve the Digital Sketchbook style while producing normalized runtime frames, manifests, and QA sheets.

## Tech stack

- **Frontend Framework:** React (Vite)
- **Game Engine:** Phaser 4 (Arcade Physics; npm package `phaser`)
- **Styling:** TailwindCSS v4
- **Icons:** Lucide-React
- **Audio:** Web Audio API

## Project docs

- [`README.md`](README.md) — project overview, development commands, deployment notes.
- [`docs/game-design/`](docs/game-design/) — shipped player-facing behavior and future design notes.
- [`src/README.md`](src/README.md) — source folder map.
