# Infrastructure Folder

`infra/` contains concrete adapters that connect game-owned interfaces to
external engines or browser APIs.

Use this folder when code must know about a concrete dependency such as Phaser.
For example, the kernel asks a `SceneRuntimeAdapter` to start, stop, pause, and
inspect scenes; `PhaserSceneAdapter` is the concrete adapter that turns those
requests into Phaser API calls.

## Owns

- Phaser runtime adapter boundary (`phaser/PhaserSceneAdapter.ts`)
- Engine-facing integration details that should not leak into `core/`, `kernel/`,
  or scene context definitions

## Depends on

- `kernel/` adapter interfaces such as `SceneRuntimeAdapter`
- `runtime/` scene contracts when runtime capabilities must be detected on
  concrete Phaser scene instances

## Does not own

- Kernel transition policies
- Scene gameplay rules
- React overlay lifecycle logic
- Pure ECS or player decision logic

## Common entrypoints

- `phaser/PhaserSceneAdapter.ts`
