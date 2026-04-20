# Agent Instructions & Project Context

Rules and gotchas for agents working on this gamified portfolio. Descriptive docs (what the project *is*) live in [`README.md`](README.md) and [`docs/ARCHITECTURE_RUNTIME.md`](docs/ARCHITECTURE_RUNTIME.md). This file is for things that, if ignored, will break something.

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

1. **Phaser world** — a 2D side-scrolling street where the player walks and jumps. World dimensions and physics constants live in [`src/game/config.ts`](src/game/config.ts); building placements in [`src/config/worldLayout.ts`](src/config/worldLayout.ts).
2. **React overlays** — when the player interacts with a building, a React modal opens. Most mini-games are React components inside these modals.
3. **Bridge** — React and Phaser synchronize via [`src/shared/bridge/store.ts`](src/shared/bridge/store.ts) (`bridgeStore`, `bridgeActions`, `useBridgeState`). Pause state and touch one-shots (`jumpQueued`, `interactTap`) are derived and consumed there. **Do not introduce new ad-hoc globals** — see [`.cursor/rules/10-architecture.mdc`](.cursor/rules/10-architecture.mdc) and [`docs/patterns/service-locator.md`](docs/patterns/service-locator.md).
4. **Kernel + scene lifecycle** — [`src/components/Game.tsx`](src/components/Game.tsx) boots Phaser, then delegates transitions to [`src/core/kernel/GameKernel.ts`](src/core/kernel/GameKernel.ts) and [`src/core/kernel/SceneManager.ts`](src/core/kernel/SceneManager.ts) through [`src/infra/phaser/PhaserSceneAdapter.ts`](src/infra/phaser/PhaserSceneAdapter.ts).
5. **Scene resume** — new interior scenes should implement `getResumeCapturePosition()` (see `ResumeCaptureScene` in [`src/game/sceneContracts.ts`](src/game/sceneContracts.ts)) and use a registry key matching the scene key. Storage at [`src/game/sceneResumeStore.ts`](src/game/sceneResumeStore.ts).

## Mobile / small screens

- The canvas uses **Phaser `Scale.FIT`** inside a responsive aspect-ratio shell. Logical size is defined in [`src/game/config.ts`](src/game/config.ts). A `ResizeObserver` calls `game.scale.refresh()` when the container resizes.
- **Touch controls** (hidden `md+`): the touch row in [`src/components/Game.tsx`](src/components/Game.tsx) writes through `bridgeActions`. Scenes read bridge touch state and consume one-shot flags via `consumeTouchOneShots()`.

## Important implementation gotchas

- **Input while a React overlay is open** — Phaser's keyboard plugin can capture keys during gameplay. Kernel pause propagation calls scene `setPaused()`, and scenes disable the keyboard manager (`enabled = false`). Reuse `setSceneKeyboardPaused` from [`src/game/sceneKeyboardPause.ts`](src/game/sceneKeyboardPause.ts) for new pausable scenes.
- **Physics collider order** — always initialize the physics collider *after* the player object is instantiated. Otherwise: `ReferenceError` or fall-through-floor.
- **Phaser 4 render constraints** — `DynamicTexture` buffers draw commands and requires explicit `render()` flushes. Avoid high-frequency `SpriteGPULayer` mutations; prefer static-ish GPU layers and explicit flush points. See [`docs/ARCHITECTURE_RUNTIME.md`](docs/ARCHITECTURE_RUNTIME.md) and [`docs/patterns/double-buffer.md`](docs/patterns/double-buffer.md).

## Folder ownership

Migration in progress: [`src/game`](src/game) is the active Phaser runtime home; [`src/games`](src/games) holds plugin/context wrappers and is the preferred location for new context modules. See [`docs/ARCHITECTURE_RUNTIME.md`](docs/ARCHITECTURE_RUNTIME.md) for the current split.

## Further reading

- **Architectural patterns (primary reference):** [`docs/patterns/`](docs/patterns/README.md) — per-pattern notes anchored to Robert Nystrom's *Game Programming Patterns*, with adoption status and JS/TS + Phaser caveats for this repo.
- **Scoped AI rules:** [`.cursor/rules/`](.cursor/rules/) — narrow, folder-scoped `.mdc` rules that mirror the patterns folder.
- **Runtime layering:** [`docs/ARCHITECTURE_RUNTIME.md`](docs/ARCHITECTURE_RUNTIME.md).
- **Project constitution:** [`docs/ARCHITECTURE_CONSTITUTION.md`](docs/ARCHITECTURE_CONSTITUTION.md).
- **Visual style guide:** [`docs/design/STYLE_GUIDE.md`](docs/design/STYLE_GUIDE.md).
