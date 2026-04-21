# Infrastructure Folder

`infra/` contains implementation adapters that connect core logic to concrete engines/APIs.

## Owns

- Phaser runtime adapter boundary (`phaser/PhaserSceneAdapter.ts`)
- Engine-facing integration details that should not leak into core domain code

## Depends on

- `core/kernel` adapter interfaces
- `runtime/` scene contracts when runtime capabilities must be detected

## Does not own

- Kernel transition policies
- Scene gameplay rules
- React overlay lifecycle logic

## Common entrypoints

- `phaser/PhaserSceneAdapter.ts`
