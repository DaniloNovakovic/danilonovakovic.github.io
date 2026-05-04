# Runtime Folder

`runtime/` is the shared Phaser runtime home. Feature-owned Phaser scenes can live under
`features/*/runtime` with compatibility re-exports here during migration.

## Owns

- Shared scene classes (`OverworldScene`) and compatibility scene re-exports
- Scene helpers (keyboard pause, resume store, contracts)
- Runtime registries and runtime-oriented types/config
- Shared scene-specific rendering/build modules (`street/`, `textures/`, `text/`)
- Focused Phaser runtime Modules such as Potassium command adaptation, renderer effects, typed Phaser data helpers, projectile control, and enemy setup decisions

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
- `HobbiesScene.ts` (compatibility re-export for `features/hobbies/runtime/HobbiesScene.ts`)
- `potassiumSlip/PotassiumSlipScene.ts`
- `potassiumSlip/potassiumSlipCommandAdapter.ts`
- `potassiumSlip/potassiumSlipRenderer.ts`
- `potassiumSlip/potassiumSlipPhaserData.ts`
- `potassiumSlip/potassiumSlipProjectileControl.ts`
- `potassiumSlip/potassiumSlipEnemyFactory.ts`
- `miniGameRegistry.ts`
- `sceneResumeStore.ts`
