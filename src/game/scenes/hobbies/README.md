# Hobbies Scene Map

This folder owns the Hobbies interior scene and its React hobby overlays.

## Ownership

- Scene catalog facts and game-only text live beside the scene.
- Room layout data describes interactable props; Phaser objects and side effects stay in the runtime scene.
- Hobby overlays are React mini-games opened from interior prop interactions and return to the Hobbies scene through the runtime catalog parent id.

## Extension Points

- Add or change room props through the room layout data and keep interaction effects typed.
- Put reusable side-view player behavior in `src/game/runtime`; keep Hobbies-only colliders, prompts, and bridge mutations local.
- Cross-folder imports should use this folder's public barrels, not runtime internals.

See `docs/runtime-architecture.md`, `.agents/rules/20-game-runtime.md`, and `.agents/rules/30-react-overlays.md` for the global runtime rules.
