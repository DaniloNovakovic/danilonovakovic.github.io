# Agent Instructions & Project Context

Rules and gotchas for agents working on this gamified portfolio. Descriptive docs (what the project *is*) live in [`README.md`](README.md) and [`docs/ARCHITECTURE_RUNTIME.md`](docs/ARCHITECTURE_RUNTIME.md). This file is for things that, if ignored, will break something.

## AI tool entry points

`AGENTS.md` is the high-level, tool-agnostic instruction file for agents. Detailed reusable agent rules live in [`.agents/rules/`](.agents/rules/) and are the canonical source for scoped AI rules. If another AI tool needs its own entry file (for example `CLAUDE.md`), keep it as a thin pointer back to this file and `.agents/rules/`.

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

1. **Phaser world** — a 2D side-scrolling street where the player walks and jumps. World dimensions and physics constants live in [`src/runtime/config.ts`](src/runtime/config.ts); building placements live in [`src/features/overworld/worldLayout.ts`](src/features/overworld/worldLayout.ts).
2. **React overlays** — when the player interacts with a building or supported interior prop, a React modal opens. Most mini-games are React components inside these modals.
3. **Bridge** — React and Phaser synchronize via [`src/shared/bridge/store.ts`](src/shared/bridge/store.ts) (`bridgeStore`, `bridgeActions`, `useBridgeState`). Pause state and touch one-shots (`jumpQueued`, `interactTap`) are derived and consumed there. **Do not introduce new ad-hoc globals** — see [`.agents/rules/10-architecture.md`](.agents/rules/10-architecture.md) and [`docs/patterns/service-locator.md`](docs/patterns/service-locator.md).
4. **Runtime modes** — mode transitions live in [`src/runtime/gameState.ts`](src/runtime/gameState.ts) as a small discriminated union (`exploring`, `reactOverlay`, `phaserScene`) and are projected through the bridge. React overlays may close back to an interior parent scene such as `hobbies` or `basement` via registry `overlayParentId`; do not re-derive app mode from loose `activeMiniGameId` checks in new code. See [`docs/ARCHITECTURE_RUNTIME_MODES.md`](docs/ARCHITECTURE_RUNTIME_MODES.md).
5. **Kernel + scene lifecycle** — [`src/app/modes/interactive/Game.tsx`](src/app/modes/interactive/Game.tsx) boots Phaser, then delegates transitions to [`src/core/kernel/GameKernel.ts`](src/core/kernel/GameKernel.ts) and [`src/core/kernel/SceneManager.ts`](src/core/kernel/SceneManager.ts) through [`src/infra/phaser/PhaserSceneAdapter.ts`](src/infra/phaser/PhaserSceneAdapter.ts). Known Phaser contexts are assembled by [`src/contextPlugins/createContextPlugins.ts`](src/contextPlugins/createContextPlugins.ts); add new context registration there rather than expanding `Game.tsx`.
6. **Runtime catalogs** — feature-owned catalog entries live in [`src/features/catalog.ts`](src/features/catalog.ts), with compatibility exports in [`src/config/featureRuntimeBindings.ts`](src/config/featureRuntimeBindings.ts) and runtime lookup helpers in [`src/runtime/miniGameRegistry.ts`](src/runtime/miniGameRegistry.ts). React overlay resolution, parent returns, and Phaser/React kind checks should go through the catalog helpers instead of local maps.
7. **Scene resume** — new interior scenes should implement `getResumeCapturePosition()` (see `ResumeCaptureScene` in [`src/runtime/sceneContracts.ts`](src/runtime/sceneContracts.ts)) and use a registry key matching the scene key. Resume persistence and reset rules go through [`src/runtime/sceneResumePolicy.ts`](src/runtime/sceneResumePolicy.ts); [`src/runtime/sceneResumeStore.ts`](src/runtime/sceneResumeStore.ts) is low-level storage behind that policy.

## Mobile / small screens

- The canvas uses fixed Phaser logical dimensions from [`src/runtime/config.ts`](src/runtime/config.ts) with **Phaser `Scale.ENVELOP`** inside a responsive React shell. The shell chooses a scene presentation mode via [`src/runtime/phaserScenePresentation.ts`](src/runtime/phaserScenePresentation.ts): side-view scenes use `portrait-cover` on phones, while full-board arcade scenes such as Potassium use `full-board`.
- Presentation sizing for the interactive shell lives in [`src/app/modes/interactive/gameShellLayout.ts`](src/app/modes/interactive/gameShellLayout.ts). When presentation mode or container size changes, [`src/app/modes/interactive/Game.tsx`](src/app/modes/interactive/Game.tsx) refreshes Phaser scale after the DOM layout settles; do not recreate the Phaser game just to switch shell aspect ratios.
- **Touch controls** (hidden `md+`): the touch surface in [`src/app/modes/interactive/Game.tsx`](src/app/modes/interactive/Game.tsx) writes through `bridgeActions`. Side-view scenes read bridge touch state and consume one-shot flags via `consumeTouchOneShots()`. Full-board Phaser scenes should opt out of the React gesture overlay when they need direct Phaser pointer input.

## Important implementation gotchas

- **Input while a React overlay is open** — Phaser's keyboard plugin can capture keys during gameplay. Kernel pause propagation calls scene `setPaused()`, and scenes disable the keyboard manager (`enabled = false`). Reuse `setSceneKeyboardPaused` from [`src/runtime/sceneKeyboardPause.ts`](src/runtime/sceneKeyboardPause.ts) for new pausable scenes.
- **Side-view player scenes** — new side-view Phaser scenes should use [`src/runtime/player/SideViewPlayerRuntime.ts`](src/runtime/player/SideViewPlayerRuntime.ts) for spawn/resume placement, keyboard/touch input, optional camera follow/clamp setup via [`src/runtime/camera/sideViewCameraRuntime.ts`](src/runtime/camera/sideViewCameraRuntime.ts), pause propagation, `PlayerController`, sprite facing/idle animation, appearance sync, and resume capture. Keep scene-specific layout, colliders, prompts, and interactions in the scene or a focused runtime Module.
- **Interior prop interactions** — Hobbies/Basement-style prop interactions should use [`src/runtime/interactions/InteriorInteractionRuntime.ts`](src/runtime/interactions/InteriorInteractionRuntime.ts). Keep Phaser text objects and bridge mutations scene-owned; pass typed target facts/effect commands into the runtime rather than duplicating proximity/prompt/effect branches.
- **Scene input commands** — lower-level input helpers live in [`src/core/input/commands.ts`](src/core/input/commands.ts), [`src/runtime/input/readSceneInputCommands.ts`](src/runtime/input/readSceneInputCommands.ts), and [`src/runtime/input/scenePlayerInput.ts`](src/runtime/input/scenePlayerInput.ts). Use them inside runtime Modules rather than duplicating raw cursor/WASD/touch one-shot assembly in scenes.
- **Kernel event timing** — [`KernelEventBus`](src/core/kernel/events.ts) is synchronous and remains the default. [`KernelEventQueue`](src/core/kernel/events.ts) is an unwired scaffold for demonstrated time-decoupling needs such as cross-scene side effects, audio one-shots, or analytics; do not use it as a generic global bus.
- **Physics collider order** — always initialize the physics collider *after* the player object is instantiated. Otherwise: `ReferenceError` or fall-through-floor.
- **Phaser 4 render constraints** — `DynamicTexture` buffers draw commands and requires explicit `render()` flushes. Avoid high-frequency `SpriteGPULayer` mutations; prefer static-ish GPU layers and explicit flush points. See [`docs/ARCHITECTURE_RUNTIME.md`](docs/ARCHITECTURE_RUNTIME.md) and [`docs/patterns/double-buffer.md`](docs/patterns/double-buffer.md).

## Folder ownership

Current ownership: [`src/app`](src/app) holds thin React mode shells, [`src/features`](src/features) holds feature-owned React overlays and presentation modules, [`src/shared`](src/shared) holds shared bridge/UI/hooks, [`src/runtime`](src/runtime) is the Phaser runtime home, and [`src/contextPlugins`](src/contextPlugins) holds plugin/context wrappers for kernel orchestration. See [`docs/ARCHITECTURE_RUNTIME.md`](docs/ARCHITECTURE_RUNTIME.md) for the current split.

## Further reading

- **Architectural patterns (primary reference):** [`docs/patterns/`](docs/patterns/README.md) — per-pattern notes anchored to Robert Nystrom's *Game Programming Patterns*, with adoption status and JS/TS + Phaser caveats for this repo.
- **Scoped AI rules:** [`.agents/rules/`](.agents/rules/) — canonical reusable rules for any coding agent.
- **Runtime layering:** [`docs/ARCHITECTURE_RUNTIME.md`](docs/ARCHITECTURE_RUNTIME.md).
- **Project constitution:** [`docs/ARCHITECTURE_CONSTITUTION.md`](docs/ARCHITECTURE_CONSTITUTION.md).
- **Visual style guide:** [`docs/design/STYLE_GUIDE.md`](docs/design/STYLE_GUIDE.md).
