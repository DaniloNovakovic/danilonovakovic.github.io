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
- `src/games/plugins/StreetPlugin.ts`, `src/games/plugins/HobbiesPlugin.ts`
  - Context plugin definitions for the two Phaser scene contexts.

## Folder ownership (`game` vs `games`)

This codebase is in a transitional split:

- `src/game`
  - Legacy/active Phaser runtime code (scenes, texture builders, scene contracts, registry helpers).
  - Treat as stable runtime area while migration continues.
- `src/games`
  - Plugin/context definitions used by kernel scene orchestration.
  - Target home for feature-context modules over time.

Migration rule for new code:
- Add new context/plugin modules under `src/games`.
- Touch `src/game` only when integrating with existing scene runtime until those scenes are moved.

## ECS migration status

Initial player ECS scaffolding is in place:

- `src/core/ecs/world.ts` for entity/component storage.
- `src/core/ecs/components/player.ts` for player-focused pure data components.
- `src/core/ecs/systems/playerSystems.ts` for input + movement/jump/interact system logic.
- `src/game/OverworldScene.ts` uses this ECS layer to drive player decisions, then syncs results into Phaser sprite/body calls.

This is an incremental migration: Phaser physics/rendering remains in infra-facing scene code while gameplay decisions move into component + system flow.

## Rendering guardrails (Phaser 4)

Guardrails are currently policy-level (documented) rather than a dedicated utility module:

- Use `SpriteBatch` for interactive entities.
- Use `DynamicTexture` for composited or stamp-style static textures, with explicit `dynamicTexture.render()` flush calls.
- Use `SpriteGPULayer` only for dense, mostly static quads; avoid high-frequency member add/remove churn.

If repeated render policy code appears, re-introduce a shared helper under `src/infra/phaser/render/`.
