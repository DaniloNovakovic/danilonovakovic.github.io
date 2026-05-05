# Runtime Folder

`runtime/` is the shared Phaser-facing runtime home. Scene-owned Phaser code
lives under `src/game/scenes/*/runtime`; this folder is for reusable machinery
that more than one scene or shell path can compose.

## Owns

- Runtime mode and presentation policy
- Scene helpers such as keyboard pause, resume policy/store, and scene contracts
- Shared side-view player, camera, interaction, input, text, texture, and vision
  modules
- Runtime lookup helpers such as `miniGameRegistry.ts`

## Depends on

- `core/` for pure gameplay decisions, input command frames, and player control
- `game/bridge` for React/Phaser state projections when runtime modules need
  bridge state
- `game/registry` and scene barrels for catalog-driven feature resolution

## Does not own

- Kernel orchestration (`../kernel`)
- Concrete adapter implementations (`../infra`)
- Scene context definitions (`../sceneContexts` and scene-owned
  `sceneContext.ts`)
- Scene-specific Phaser objects, layouts, and text

## Common entrypoints

- `miniGameRegistry.ts`
- `gameState.ts`
- `sceneResumePolicy.ts`
- `player/SideViewPlayerRuntime.ts`
- `interactions/InteriorInteractionRuntime.ts`
