# Agent Instructions & Project Context

Rules and gotchas for agents working on this gamified portfolio. Descriptive docs (what the project *is*) live in [`README.md`](README.md) and [`docs/ARCHITECTURE_RUNTIME.md`](docs/ARCHITECTURE_RUNTIME.md). This file is for things that, if ignored, will break something.

## AI tool entry points

`AGENTS.md` is the canonical, tool-agnostic instruction file for agents. Cursor-specific scoped rules live in [`.cursor/rules/`](.cursor/rules/) and mirror the same architecture constraints with file-level targeting. If another AI tool needs its own entry file (for example `CLAUDE.md`), keep it as a thin pointer back to this file rather than duplicating rules.

## Tech stack

- **Frontend Framework:** React (Vite)
- **Game Engine:** Phaser 4 (Arcade Physics; npm package `phaser`)
- **Styling:** TailwindCSS v4
- **Icons:** Lucide-React
- **Audio:** Web Audio API (for interactive soundscapes)

## Visual identity

Strict **"Digital Sketchbook"** aesthetic — high-contrast monochromatic, hand-drawn ink, inspired by Open Peeps and Life is Strange journal pages. All visual rules live in [`docs/design/STYLE_GUIDE.md`](docs/design/STYLE_GUIDE.md); do not re-state them here.

## Architecture

Hybrid Phaser + React application:

1. **Phaser world** — a 2D side-scrolling street where the player walks and jumps. World dimensions and physics constants live in [`src/runtime/config.ts`](src/runtime/config.ts); building placements in [`src/config/worldLayout.ts`](src/config/worldLayout.ts).
2. **React overlays** — when the player interacts with a building, a React modal opens. Most mini-games are React components inside these modals.
3. **Bridge** — React and Phaser synchronize via [`src/shared/bridge/store.ts`](src/shared/bridge/store.ts) (`bridgeStore`, `bridgeActions`, `useBridgeState`). Pause state and touch one-shots (`jumpQueued`, `interactTap`) are derived and consumed there. **Do not introduce new ad-hoc globals** — see [`.cursor/rules/10-architecture.mdc`](.cursor/rules/10-architecture.mdc) and [`docs/patterns/service-locator.md`](docs/patterns/service-locator.md).
4. **Runtime modes** — mode transitions live in [`src/runtime/gameState.ts`](src/runtime/gameState.ts) as a small discriminated union (`exploring`, `reactOverlay`, `phaserScene`) and are projected through the bridge. Do not re-derive app mode from loose `activeMiniGameId` checks in new code. See [`docs/ARCHITECTURE_RUNTIME_MODES.md`](docs/ARCHITECTURE_RUNTIME_MODES.md).
5. **Kernel + scene lifecycle** — [`src/components/Game.tsx`](src/components/Game.tsx) boots Phaser, then delegates transitions to [`src/core/kernel/GameKernel.ts`](src/core/kernel/GameKernel.ts) and [`src/core/kernel/SceneManager.ts`](src/core/kernel/SceneManager.ts) through [`src/infra/phaser/PhaserSceneAdapter.ts`](src/infra/phaser/PhaserSceneAdapter.ts).
6. **Scene resume** — new interior scenes should implement `getResumeCapturePosition()` (see `ResumeCaptureScene` in [`src/runtime/sceneContracts.ts`](src/runtime/sceneContracts.ts)) and use a registry key matching the scene key. Storage at [`src/runtime/sceneResumeStore.ts`](src/runtime/sceneResumeStore.ts).

## Mobile / small screens

- The canvas uses **Phaser `Scale.FIT`** inside a responsive aspect-ratio shell. Logical size is defined in [`src/runtime/config.ts`](src/runtime/config.ts). A `ResizeObserver` calls `game.scale.refresh()` when the container resizes.
- **Touch controls** (hidden `md+`): the touch row in [`src/components/Game.tsx`](src/components/Game.tsx) writes through `bridgeActions`. Scenes read bridge touch state and consume one-shot flags via `consumeTouchOneShots()`.

## Important implementation gotchas

- **Input while a React overlay is open** — Phaser's keyboard plugin can capture keys during gameplay. Kernel pause propagation calls scene `setPaused()`, and scenes disable the keyboard manager (`enabled = false`). Reuse `setSceneKeyboardPaused` from [`src/runtime/sceneKeyboardPause.ts`](src/runtime/sceneKeyboardPause.ts) for new pausable scenes.
- **Scene input commands** — new scenes should map keyboard/touch into `InputCommandFrame` via [`src/core/input/commands.ts`](src/core/input/commands.ts) and [`src/runtime/input/readSceneInputCommands.ts`](src/runtime/input/readSceneInputCommands.ts), then feed player movement through `PlayerController`. Do not duplicate raw cursor/WASD/touch one-shot assembly in every scene.
- **Kernel event timing** — [`KernelEventBus`](src/core/kernel/events.ts) is synchronous and remains the default. [`KernelEventQueue`](src/core/kernel/events.ts) exists only for demonstrated time-decoupling needs such as cross-scene side effects, audio one-shots, or analytics; do not use it as a generic global bus.
- **Physics collider order** — always initialize the physics collider *after* the player object is instantiated. Otherwise: `ReferenceError` or fall-through-floor.
- **Phaser 4 render constraints** — `DynamicTexture` buffers draw commands and requires explicit `render()` flushes. Avoid high-frequency `SpriteGPULayer` mutations; prefer static-ish GPU layers and explicit flush points. See [`docs/ARCHITECTURE_RUNTIME.md`](docs/ARCHITECTURE_RUNTIME.md) and [`docs/patterns/double-buffer.md`](docs/patterns/double-buffer.md).

## Folder ownership

Current ownership: [`src/runtime`](src/runtime) is the Phaser runtime home; [`src/contextPlugins`](src/contextPlugins) holds plugin/context wrappers for kernel orchestration. See [`docs/ARCHITECTURE_RUNTIME.md`](docs/ARCHITECTURE_RUNTIME.md) for the current split.

## Further reading

- **Architectural patterns (primary reference):** [`docs/patterns/`](docs/patterns/README.md) — per-pattern notes anchored to Robert Nystrom's *Game Programming Patterns*, with adoption status and JS/TS + Phaser caveats for this repo.
- **Scoped AI rules:** [`.cursor/rules/`](.cursor/rules/) — narrow, folder-scoped `.mdc` rules that mirror the patterns folder.
- **Runtime layering:** [`docs/ARCHITECTURE_RUNTIME.md`](docs/ARCHITECTURE_RUNTIME.md).
- **Project constitution:** [`docs/ARCHITECTURE_CONSTITUTION.md`](docs/ARCHITECTURE_CONSTITUTION.md).
- **Visual style guide:** [`docs/design/STYLE_GUIDE.md`](docs/design/STYLE_GUIDE.md).
