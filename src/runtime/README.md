# Runtime Folder

`runtime/` is the Phaser runtime home.

## Owns

- Scene classes (`OverworldScene`, `HobbiesScene`)
- Scene helpers (keyboard pause, resume store, contracts)
- Runtime registries and runtime-oriented types/config
- Scene-specific rendering/build modules (`street/`, `hobbies/`, `textures/`, `text/`)

## Depends on

- `core/` for reusable domain logic (for example ECS player controller)
- `shared/bridge/store.ts` for cross-boundary UI/engine state
- `config/` for feature/world metadata

## Does not own

- Kernel orchestration (`core/kernel`)
- Adapter boundary implementations (`infra/`)
- Context plugin definitions (`contextPlugins/`)

## Common entrypoints

- `OverworldScene.ts`
- `HobbiesScene.ts`
- `miniGameRegistry.ts`
- `sceneResumeStore.ts`
