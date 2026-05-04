# Runtime Folder

`runtime/` is the shared Phaser runtime home. Feature-owned Phaser scenes and modules live
under `features/*/runtime`.

## Owns

- Scene helpers (keyboard pause, resume store, contracts)
- Runtime registries and runtime-oriented types/config
- Shared scene-specific rendering/build modules (`textures/`, `text/`)

## Depends on

- `core/` for reusable domain logic (for example ECS player controller)
- `shared/bridge/store.ts` for cross-boundary UI/engine state
- `config/` for feature/world metadata

## Does not own

- Kernel orchestration (`core/kernel`)
- Adapter boundary implementations (`infra/`)
- Context plugin definitions (`contextPlugins/`)

## Common entrypoints

- `miniGameRegistry.ts`
- `sceneResumeStore.ts`
