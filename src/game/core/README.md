# Core Folder

`core/` contains pure game decision logic. Code here should be testable without
Phaser, React, browser globals, or scene lifecycle state.

Use this folder when repeated gameplay decisions can be expressed as plain data
and deterministic functions/classes. Do not put orchestration here just because
it feels important; scene transitions belong to `sceneLifecycle/`,
Phaser-facing scene machinery belongs to `sharedSceneRuntime/`, and concrete
engine adapters belong to `adapters/`.

## Owns

- ECS data model and pure systems (`ecs/`)
- Input command frames and pure input-to-player translation (`input/`)
- Engine-agnostic player decision logic (`player/`)

## Depends on

- Other `core/` modules
- Plain TypeScript types that do not import Phaser, React, or browser APIs

## Related guardrails

- `sceneLifecycle/contexts/` and scene-owned `sceneContext.ts` files must not import `sharedSceneRuntime/` (enforced by ESLint; see `eslint.config.js`).

## Does not own

- Scene lifecycle orchestration (`../sceneLifecycle`)
- Direct Phaser imports
- React component rendering
- Bridge state or browser state
- Scene asset creation, rendering details, or Phaser lifecycle hooks

## Common entrypoints

- `ecs/world.ts`
- `ecs/systems/playerSystems.ts`
- `input/commands.ts`
- `player/PlayerController.ts`
