# Personal website

## Brief

The goal is to create a place where I can easily surface interesting personal open-source projects and exercises, share a bit about myself, and maybe attract and connect with like-minded people.

**This repository (v3)** is a gamified portfolio: **Phaser** scenes for worlds plus **React** overlays for portfolio, inventory, and scene-local surfaces. Stack: **Vite**, **React 19**, **TypeScript**, **Tailwind CSS v4**. Design direction lives in [`docs/design/style-guide.md`](docs/design/style-guide.md); agent-oriented notes in [`AGENTS.md`](AGENTS.md).

**Current active design slice:** Ridge is in pre-production for the desired route rework. The phase compass is [`docs/game-design/ridge/milestone-plan.md`](docs/game-design/ridge/milestone-plan.md); live PRDs, backlog, and agent-ready briefs stay in GitHub Issues.

**Personal log / opinions by version:** see [`CHANGELOG.md`](CHANGELOG.md) (v1 → v2 → current v3).

## Development

```bash
pnpm install
pnpm dev
```

## Quality checks

```bash
pnpm check              # includes fallow:audit on changed files since main
pnpm lint
pnpm test
pnpm build
pnpm fallow:health    # complexity + duplication overview
pnpm fallow:baseline  # regenerate committed CI baselines after cleanup
```

Fallow CI policy and agent workflow: [`docs/agents/fallow.md`](docs/agents/fallow.md).

Current Bridge staging lives in
`src/game/scenes/ridge/bridge/stageComposition.ts`. In development, open the
Ridge Stage Debugger with `?mode=ridge-stage-debugger` after starting
`pnpm dev`; it hosts the live Bridge preview, route-beat controls, Walk Rail
readouts, Stage Spot movement, and Bridge Stage debug overlays.

Stampede Sketch remains a standalone mini-game scene (`stampedeSketch`) for
optional future content; reach it via the dev scene switcher or basement console
(`stampede`) until the Ridge rework wires a player-facing entry.

## Architecture

Runtime layering follows explicit scene/overlay boundaries. Phaser world lookup lives in [`src/game/scenes/sceneRegistry.ts`](src/game/scenes/sceneRegistry.ts), React overlay lookup lives in [`src/game/overlays/overlayRegistry.ts`](src/game/overlays/overlayRegistry.ts), scene lifecycle lives in [`src/game/sceneLifecycle`](src/game/sceneLifecycle), and Phaser-facing shared modules live in [`src/game/sharedSceneRuntime`](src/game/sharedSceneRuntime).

User-facing copy is centralized in the typed i18n catalog under [`src/shared/i18n/messages/en`](src/shared/i18n/messages/en). React surfaces read it through `useMessages()` for live locale updates, while Phaser/runtime code reads the active catalog with `getMessages()` and refreshes on scene restart or re-entry. Non-copy portfolio facts live in [`src/shared/portfolio`](src/shared/portfolio) and are combined with localized messages by selectors.

Full runtime layering and Module seams are in [`docs/runtime-architecture.md`](docs/runtime-architecture.md). Agent rules live in [`.agents/rules/`](.agents/rules/).

## Working with AI agents

Start with [`AGENTS.md`](AGENTS.md). It is the entrypoint for AI tooling and points to the canonical rules, runtime docs, style guide, issue tracker conventions, and Sketchbook Ridge specialist roles. Keep new agent instructions there or in `.agents/rules/`; do not copy large rule blocks into random prompts.

For small changes, ask the agent directly and let it read the relevant rules:

```text
Fix the inventory overlay spacing bug. Read AGENTS.md first, then implement and run the relevant checks.
```

For larger or fuzzier work, use the workflow skills as planning tools before coding:

| Situation | Ask for | What it produces |
| --- | --- | --- |
| You have a broad feature idea and need the shape clarified | `grill-with-docs` | A structured conversation that sharpens terms, checks existing domain docs, and records durable decisions in `CONTEXT.md` or ADRs when needed. |
| You want a product-level spec from an already-discussed idea | `to-prd` | A PRD, meaning a Product Requirements Document. In this repo it is published as a GitHub issue that captures the problem, solution, user stories, decisions, tests, and out-of-scope items. |
| You have a PRD, plan, or big issue and need buildable work items | `to-issues` | Small GitHub issues in dependency order. Each issue should be a vertical slice with acceptance criteria, not a layer-by-layer task list. |
| You need to manage or prepare existing issues | `triage` | Issue state changes such as `needs-info`, `ready-for-human`, or `ready-for-agent`. For agent-ready work it can add an agent brief comment that becomes the implementation contract. |
| You want the implementation to be test-first | `tdd` | A red-green-refactor loop: one behavior test, one small implementation step, then refactor. Best for risky behavior changes and shared logic. |
| Something is broken or flaky | `diagnose` | A reproduction loop, hypotheses, instrumentation, fix, and regression test. |
| You are worried about architecture drift or parallel work conflicts | `Architect` | A seam review: what should change, what should stay serialized, what can safely be parallelized, and whether the work should become issues. |
| You need coordination across roles or a next-work recommendation | `Producer` | A short production plan, suggested issue order, role assignment, and handoff notes. |

A useful default flow for a new feature is:

```text
grill-with-docs -> to-prd -> to-issues -> triage ready-for-agent -> implement with tdd or normal coding
```

Skip steps when the work is already clear. A one-line copy fix does not need a PRD. A half-formed game-system idea probably benefits from `grill-with-docs` before anybody writes code. A feature that spans multiple scenes, overlays, assets, or runtime seams probably deserves a PRD and sliced issues.

Useful prompts:

```text
Use grill-with-docs to stress-test this idea against the current Ridge domain docs: ...
```

```text
Turn our discussion into a PRD and publish it to GitHub Issues.
```

```text
Break issue #42 into vertical implementation issues with to-issues.
```

```text
Triage #57 and tell me whether it is ready-for-agent or needs-info.
```

```text
Ask the Producer what the next three agent-ready tasks should be.
```

```text
Ask the Architect whether these two scene changes can be worked in parallel.
```

## Deploy (GitHub Pages)

Production build outputs to `dist/`. [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs lint, tests, and build on `push` / `pull_request` against `main`. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs the same quality gates and deploys GitHub Pages from `main`.

## Credits & License

- **Code:** Licensed under the [MIT License](LICENSE).
- **Character Art:** This project uses "Punpun" from *Oyasumi Punpun* by Inio Asano as a placeholder/mascot for non-commercial, personal portfolio purposes (Fair Use). All rights belong to the original copyright owners.
