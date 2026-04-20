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

## ECS migration status

Initial player ECS scaffolding is in place:

- `src/core/ecs/world.ts` for entity/component storage.
- `src/core/ecs/components/player.ts` for player-focused pure data components.
- `src/core/ecs/systems/playerSystems.ts` for input + movement/jump/interact system logic.
- `src/game/OverworldScene.ts` uses this ECS layer to drive player decisions, then syncs results into Phaser sprite/body calls.

This is an incremental migration: Phaser physics/rendering remains in infra-facing scene code while gameplay decisions move into component + system flow.

## Rendering guardrails (Phaser 4)

See `src/infra/phaser/render/renderGuardrails.ts`:

- `chooseRenderStrategy` for strategy selection (`SpriteBatch`, `DynamicTexture`, `SpriteGPULayer`).
- `DynamicTextureRenderQueue` to enforce explicit `dynamicTexture.render()` flushes.
- `exceedsSpriteGpuLayerMutationBudget` to protect against high-frequency GPU buffer churn.

Use these helpers when adding render-heavy plugins or effects.
