# Basement Scene Map

This folder owns the Developer Basement interior scene, its room layout, and basement-only React overlays.

## Ownership

- Scene catalog facts and game-only text live beside the scene.
- Room layout data describes basement props; runtime code owns Phaser objects, prompts, item gates, and bridge mutations.
- Basement overlays return to the Basement scene through the runtime catalog parent id.

## Extension Points

- Add prop interactions through the room layout data and the shared interior interaction runtime.
- Keep inventory/progress writes behind bridge actions.
- Keep Phaser scene classes and builders behind the runtime barrel for cross-folder imports.

See `docs/ARCHITECTURE_RUNTIME.md`, `.agents/rules/20-game-runtime.md`, and `.agents/rules/30-react-overlays.md` for the global runtime rules.
