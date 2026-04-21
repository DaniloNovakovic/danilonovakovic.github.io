# Runtime Architecture (Current)

This document describes the current runtime architecture in `src/` after the micro-kernel, bridge, and ECS migration steps.

## High-level flow

1. `App` renders the game shell and overlays.
2. Shared state lives in `src/shared/bridge/store.ts`.
3. `Game` boots Phaser and wires the kernel runtime.
4. `GameKernel` subscribes to bridge state and delegates transitions/pause to `SceneManager`.
5. `SceneManager` manages context plugins via a Phaser adapter boundary.

## Core modules

- `src/shared/bridge/store.ts`
  - Single source of truth for:
    - app state (`status`, `activeMiniGameId`, `isPaused`)
    - touch flags (`left`, `right`, `jumpQueued`, `interactTap`)
  - Exposes `bridgeActions` and `useBridgeSelector`.
- `src/core/kernel/GameKernel.ts`
  - Reacts to bridge state changes.
  - Emits lifecycle events (`SceneTransitionRequested`, `OverlayOpened`, `OverlayClosed`, `PauseChanged`).
- `src/core/kernel/SceneManager.ts`
  - Registers context plugins.
  - Handles scene enter/exit, resume capture, and pause propagation.
- `src/infra/phaser/PhaserSceneAdapter.ts`
  - Adapter boundary for scene start/stop, active scene pause, callback rebinding, and resume capture.
- `src/contextPlugins/plugins/StreetPlugin.ts`, `src/contextPlugins/plugins/HobbiesPlugin.ts`
  - Context plugin definitions for the two Phaser scene contexts.

## Folder ownership (`runtime` vs `contextPlugins`)

Current split:

- `src/runtime`
  - Active Phaser runtime code (scenes, texture builders, scene contracts, registry helpers).
- `src/contextPlugins`
  - Plugin/context definitions used by kernel scene orchestration.

Migration rule for new code:

- Add new context/plugin modules under `src/contextPlugins`.
- Touch `src/runtime` when integrating with existing scene runtime.

## ECS migration status

Initial player ECS scaffolding is in place:

- `src/core/ecs/world.ts` for entity/component storage.
- `src/core/ecs/components/player.ts` for player-focused pure data components.
- `src/core/ecs/systems/playerSystems.ts` for input + movement/jump/interact system logic.
- `src/core/ecs/systems/overworldInteractSystems.ts` for pure overworld building interact targeting (called from `OverworldScene`).
- `src/runtime/OverworldScene.ts` uses this ECS layer to drive player decisions, then syncs results into Phaser sprite/body calls.

This is an incremental migration: Phaser physics/rendering remains in infra-facing scene code while gameplay decisions move into component + system flow.

## Manual smoke verification

After changes that touch Phaser boot, bridge, kernel, scenes, or overlays, run `npm run dev` and confirm:

1. **Overworld** — canvas loads; move left/right, jump, interact near a building.
2. **Hobbies** — enter hobbies (building or `H` where applicable); walk; interact with an interior target; exit (`H` / `Esc` / close flow) returns to overworld.
3. **React overlays** — open a building overlay from the street; close it; no stuck keyboard focus in the canvas.
4. **Pause / input** — with a React overlay open, scene pause propagates (no gameplay input leaking); closing overlay resumes overworld input.

Record pass/fail in the PR or release notes when shipping runtime changes.

## Rendering guardrails (Phaser 4)

Guardrails are currently policy-level (documented) rather than a dedicated utility module:

- Use `SpriteBatch` for interactive entities.
- Use `DynamicTexture` for composited or stamp-style static textures, with explicit `dynamicTexture.render()` flush calls.
- Use `SpriteGPULayer` only for dense, mostly static quads; avoid high-frequency member add/remove churn.

If repeated render policy code appears, re-introduce a shared helper under `src/infra/phaser/render/`.