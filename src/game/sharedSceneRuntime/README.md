# Shared Scene Runtime Folder

`sharedSceneRuntime/` is the shared Phaser-facing runtime home. Scene-owned
Phaser code lives under `src/game/scenes/*/runtime`; this folder is for reusable
machinery that more than one scene or shell path can compose.

## Owns

- Scene presentation policy
- Scene helpers such as keyboard pause, resume policy/store, and scene contracts
- Shared side-view player, camera, interaction, input, text, texture, and vision modules

## Depends on

- `core/` for pure gameplay decisions, input command frames, and player control
- `game/bridge` for React/Phaser state projections when runtime modules need bridge state
- Scene barrels only when a reusable helper needs public scene facts

## Does not own

- Scene lifecycle orchestration (`../sceneLifecycle`)
- Concrete adapter implementations (`../adapters`)
- Overlay lookup or rendering (`../overlays`)
- Scene context definitions (`../sceneLifecycle/contexts` and scene-owned `sceneContext.ts`)
- Scene-specific Phaser objects, layouts, triggers, and text

## Common entrypoints

- `sceneResumePolicy.ts`
- `phaserScenePresentation.ts`
- `player/SideViewPlayerRuntime.ts`
- `interactions/InteriorInteractionRuntime.ts`
