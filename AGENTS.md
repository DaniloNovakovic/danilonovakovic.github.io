# Agent Instructions & Project Context

Rules and gotchas for agents working on this gamified portfolio. Descriptive docs (what the project *is*) live in [`README.md`](README.md) and [`docs/ARCHITECTURE_RUNTIME.md`](docs/ARCHITECTURE_RUNTIME.md). This file is for things that, if ignored, will break something.

## AI tool entry points

`AGENTS.md` is the high-level, tool-agnostic instruction file for agents. Detailed reusable agent rules live in [`.agents/rules/`](.agents/rules/) and are the canonical source for scoped AI rules. If another AI tool needs its own entry file (for example `CLAUDE.md`), keep it as a thin pointer back to this file and `.agents/rules/`.

## Agent skills

### Issue tracker

Issues and PRDs are tracked in GitHub Issues for `DaniloNovakovic/danilonovakovic.github.io`. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the default mattpocock/skills triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo: read root `CONTEXT.md` and `docs/adr/` when present. See `docs/agents/domain.md`.

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

1. **Phaser world** — a 2D side-scrolling street where the player walks and jumps. World dimensions and physics constants live in [`src/game/runtime/config.ts`](src/game/runtime/config.ts); building placements live in [`src/game/scenes/overworld/worldLayout.ts`](src/game/scenes/overworld/worldLayout.ts).
2. **React overlays** — when the player interacts with a building or supported interior prop, a React modal opens. Most mini-games are React components inside these modals.
3. **Bridge** — React and Phaser synchronize via [`src/game/bridge/store.ts`](src/game/bridge/store.ts) (`bridgeStore`, `bridgeActions`, `useBridgeState`). Pause state and touch one-shots (`jumpQueued`, `interactTap`) are derived and consumed there. **Do not introduce new ad-hoc globals** — see [`.agents/rules/10-architecture.md`](.agents/rules/10-architecture.md) and [`docs/patterns/service-locator.md`](docs/patterns/service-locator.md).
4. **Runtime modes** — mode transitions live in [`src/game/runtime/gameState.ts`](src/game/runtime/gameState.ts) as a small discriminated union (`exploring`, `reactOverlay`, `phaserScene`) and are projected through the bridge. React overlays may close back to an interior parent scene such as `hobbies` or `basement` via registry `overlayParentId`; do not re-derive app mode from loose `activeMiniGameId` checks in new code. See [`docs/ARCHITECTURE_RUNTIME_MODES.md`](docs/ARCHITECTURE_RUNTIME_MODES.md).
5. **Kernel + scene lifecycle** — [`src/game/shell/Game.tsx`](src/game/shell/Game.tsx) renders the Phaser host and composes shell hooks for Phaser boot, scale refresh, touch controls, and bridge callbacks. Boot still delegates transitions to [`src/game/kernel/GameKernel.ts`](src/game/kernel/GameKernel.ts) and [`src/game/kernel/SceneManager.ts`](src/game/kernel/SceneManager.ts) through [`src/game/infra/phaser/PhaserSceneAdapter.ts`](src/game/infra/phaser/PhaserSceneAdapter.ts). Known Phaser scene contexts are assembled by [`src/game/sceneContexts/createSceneContexts.ts`](src/game/sceneContexts/createSceneContexts.ts); add new scene lifecycle wiring in scene-owned `sceneContext.ts` files rather than expanding `Game.tsx`.
6. **Runtime catalogs** — game-owned catalog entries live in [`src/game/registry/catalog.ts`](src/game/registry/catalog.ts), with runtime binding exports in [`src/game/registry/featureRuntimeBindings.ts`](src/game/registry/featureRuntimeBindings.ts) and runtime lookup helpers in [`src/game/runtime/miniGameRegistry.ts`](src/game/runtime/miniGameRegistry.ts). Catalogs answer "what playable feature exists and how is it resolved?"; scene contexts answer "how does this Phaser scene enter/exit the kernel lifecycle?" React overlay resolution, parent returns, and Phaser/React kind checks should go through the catalog helpers instead of local maps.
7. **Scene resume** — new interior scenes should implement `getResumeCapturePosition()` (see `ResumeCaptureScene` in [`src/game/runtime/sceneContracts.ts`](src/game/runtime/sceneContracts.ts)) and use a registry key matching the scene key. Resume persistence and reset rules go through [`src/game/runtime/sceneResumePolicy.ts`](src/game/runtime/sceneResumePolicy.ts); [`src/game/runtime/sceneResumeStore.ts`](src/game/runtime/sceneResumeStore.ts) is low-level storage behind that policy.

## Mobile / small screens

- The canvas uses fixed Phaser logical dimensions from [`src/game/runtime/config.ts`](src/game/runtime/config.ts) with **Phaser `Scale.ENVELOP`** inside a responsive React shell. The shell chooses a scene presentation mode via [`src/game/runtime/phaserScenePresentation.ts`](src/game/runtime/phaserScenePresentation.ts): side-view scenes use `portrait-cover` on phones, landscape board scenes use `full-board`, and portrait arcade scenes such as Potassium use `vertical-board`.
- Presentation sizing for the interactive shell lives in [`src/game/shell/gameShellLayout.ts`](src/game/shell/gameShellLayout.ts). When presentation mode or container size changes, [`src/game/shell/Game.tsx`](src/game/shell/Game.tsx) refreshes Phaser scale after the DOM layout settles; do not recreate the Phaser game just to switch shell aspect ratios.
- **Touch controls** (hidden `md+`): the touch surface in [`src/game/shell/Game.tsx`](src/game/shell/Game.tsx) writes through `bridgeActions`. Side-view scenes read bridge touch state and consume one-shot flags via `consumeTouchOneShots()`. Full-board Phaser scenes should opt out of the React gesture overlay when they need direct Phaser pointer input.

## Important implementation gotchas

- **Input while a React overlay is open** — Phaser's keyboard plugin can capture keys during gameplay. Kernel pause propagation calls scene `setPaused()`, and scenes disable the keyboard manager (`enabled = false`). Reuse `setSceneKeyboardPaused` from [`src/game/runtime/sceneKeyboardPause.ts`](src/game/runtime/sceneKeyboardPause.ts) for new pausable scenes.
- **Side-view player scenes** — new side-view Phaser scenes should use [`src/game/runtime/player/SideViewPlayerRuntime.ts`](src/game/runtime/player/SideViewPlayerRuntime.ts) for spawn/resume placement, keyboard/touch input, optional camera follow/clamp setup via [`src/game/runtime/camera/sideViewCameraRuntime.ts`](src/game/runtime/camera/sideViewCameraRuntime.ts), pause propagation, `PlayerController`, sprite facing/idle animation, appearance sync, and resume capture. Keep scene-specific layout, colliders, prompts, and interactions in the scene or a focused runtime Module.
- **Interior prop interactions** — Hobbies/Basement-style prop interactions should use [`src/game/runtime/interactions/InteriorInteractionRuntime.ts`](src/game/runtime/interactions/InteriorInteractionRuntime.ts). Keep Phaser text objects and bridge mutations scene-owned; pass typed target facts/effect commands into the runtime rather than duplicating proximity/prompt/effect branches.
- **Scene input commands** — lower-level input helpers live in [`src/game/core/input/commands.ts`](src/game/core/input/commands.ts), [`src/game/runtime/input/readSceneInputCommands.ts`](src/game/runtime/input/readSceneInputCommands.ts), and [`src/game/runtime/input/scenePlayerInput.ts`](src/game/runtime/input/scenePlayerInput.ts). Use them inside runtime Modules rather than duplicating raw cursor/WASD/touch one-shot assembly in scenes.
- **Kernel event timing** — [`KernelEventBus`](src/game/kernel/events.ts) is synchronous and remains the default. [`KernelEventQueue`](src/game/kernel/events.ts) is an unwired scaffold for demonstrated time-decoupling needs such as cross-scene side effects, audio one-shots, or analytics; do not use it as a generic global bus.
- **Physics collider order** — always initialize the physics collider *after* the player object is instantiated. Otherwise: `ReferenceError` or fall-through-floor.
- **Phaser 4 render constraints** — `DynamicTexture` buffers draw commands and requires explicit `render()` flushes. Avoid high-frequency `SpriteGPULayer` mutations; prefer static-ish GPU layers and explicit flush points. See [`docs/ARCHITECTURE_RUNTIME.md`](docs/ARCHITECTURE_RUNTIME.md) and [`docs/patterns/double-buffer.md`](docs/patterns/double-buffer.md).

## Folder ownership

Current ownership follows the surface rule: code that only exists for the playable mode belongs in [`src/game`](src/game), code that only exists for the static portfolio belongs in [`src/static`](src/static), and code reused by both surfaces belongs in [`src/shared`](src/shared). [`src/App.tsx`](src/App.tsx) is only the app entry and mode router.

Use the source-root alias for cross-folder imports: `@/static/*`, `@/game/*`, and `@/shared/*` all resolve under `src/`. Keep short local relative imports within a module folder, and import shared UI primitives through `@/shared/ui`.

Game conventions: scene registry facts live in `src/game/scenes/*/catalog.ts`, Phaser lifecycle wiring lives in `src/game/scenes/*/sceneContext.ts`, game-only scene text lives in `src/game/scenes/*/text.ts`, shared portfolio records/text live in `src/shared/content/portfolio`, and reusable Phaser-facing machinery lives in `src/game/runtime`. Pure deterministic ECS/input/player decisions live in `src/game/core`; runtime mode and scene lifecycle orchestration lives in `src/game/kernel`; concrete engine/browser adapters live in `src/game/infra`. Cross-folder imports of scene-owned public facts should go through `src/game/scenes/*/index.ts` barrels; Phaser scene classes and room builders should go through `src/game/scenes/*/runtime/index.ts` barrels so registry tests do not import Phaser. Keep scene-internal imports local.

Folder `index.ts` files are public boundaries: export only what other folders should use. Keep component internals, shell hooks, and implementation helpers unexported unless they are intentionally part of that folder's public API. UI primitives under `src/shared/ui` are colocated as `Component/Component.tsx`, optional tests/stories, and `Component/index.ts`.

React effects should use a named function expression, e.g. `useEffect(function syncThing() { ... }, deps)`, unless the effect is being removed or extracted into a focused hook. The name should describe the effect's intent so oversized or misplaced effects are easier to spot during review.

## Further reading

- **Architectural patterns (primary reference):** [`docs/patterns/`](docs/patterns/README.md) — per-pattern notes anchored to Robert Nystrom's *Game Programming Patterns*, with adoption status and JS/TS + Phaser caveats for this repo.
- **Scoped AI rules:** [`.agents/rules/`](.agents/rules/) — canonical reusable rules for any coding agent.
- **Runtime layering:** [`docs/ARCHITECTURE_RUNTIME.md`](docs/ARCHITECTURE_RUNTIME.md).
- **Project constitution:** [`docs/ARCHITECTURE_CONSTITUTION.md`](docs/ARCHITECTURE_CONSTITUTION.md).
- **Visual style guide:** [`docs/design/STYLE_GUIDE.md`](docs/design/STYLE_GUIDE.md).
