# Runtime Modes

This note captures the current high-level runtime transitions. It is
intentionally short: the code remains the source of truth.

## Modes

- `exploring`: the player is in the overworld and React overlays are closed.
- `reactOverlay`: a React mini-game is open and Phaser input/physics are paused
  through the bridge and kernel.
- `phaserScene`: a Phaser mini-game scene is active, such as the hobbies room.

## Transition Owners

- `src/shared/bridge/store.ts` owns the observable cross-boundary state.
- `src/core/kernel/GameKernel.ts` maps bridge mode changes to scene manager
  transitions and pause events.
- `src/components/InteractiveApp.tsx` renders React overlays from the active
  registry entry.
- Phaser scenes keep local pause state only as a scene runtime concern; they do
  not decide whether an overlay should pause the engine.

## Smoke Path

Use this path when checking pattern refactors:

1. Move and interact in the overworld.
2. Open and close a React overlay from a building.
3. Enter and exit the hobbies Phaser scene.
4. Open and close a hobby overlay from inside the hobbies scene.
5. Verify mobile touch movement, jump, and interact one-shots.
