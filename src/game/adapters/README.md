# Adapters Folder

`adapters/` contains concrete adapters that connect game-owned interfaces to
external engines or browser APIs.

Use this folder when code must know about a concrete dependency such as Phaser.
For example, scene lifecycle asks a `SceneRuntimeAdapter` to start, stop, pause,
and inspect scenes; `PhaserSceneAdapter` turns those requests into Phaser API
calls.

## Owns

- Phaser scene adapter boundary (`phaser/PhaserSceneAdapter.ts`)
- Engine-facing integration details that should not leak into `core/`, scene
  lifecycle policy, or scene context definitions

## Depends on

- `sceneLifecycle/` adapter interfaces such as `SceneRuntimeAdapter`
- `sharedSceneRuntime/` scene contracts when runtime capabilities must be
  detected on concrete Phaser scene instances

## Does not own

- Scene transition policy
- Scene gameplay rules
- React overlay lifecycle logic
- Pure ECS or player decision logic

## Common entrypoints

- `phaser/PhaserSceneAdapter.ts`
