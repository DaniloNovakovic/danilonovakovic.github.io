# Core Folder

`core/` contains engine-agnostic game domain logic.

## Owns

- Kernel orchestration (`kernel/`)
- ECS data model and systems (`ecs/`)
- Shared domain-level player logic (`player/`)

## Depends on

- `shared/bridge/store.ts` for state sync triggers
- Interface contracts from `infra/` (adapter interfaces only, not concrete Phaser code)

## Does not own

- Direct Phaser imports in pure kernel/ECS modules
- React component rendering
- Scene asset creation and rendering details

## Common entrypoints

- `kernel/GameKernel.ts`
- `kernel/SceneManager.ts`
- `ecs/world.ts`
- `player/PlayerController.ts`
