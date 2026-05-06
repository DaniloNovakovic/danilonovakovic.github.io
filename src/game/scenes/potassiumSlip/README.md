# Potassium Slip Scene Map

This folder owns the Potassium Slip Phaser scene and its scene-local gameplay modules.

## Ownership

- Scene-local gameplay facts live beside the scene; the Phaser runtime owns board objects, HUD, pointer input, combat visuals, and scene-local persistence.
- Pure or mostly pure Potassium gameplay decisions stay in focused runtime modules under this scene.
- Potassium is a fresh-start Phaser scene in resume policy, so it should not rely on side-view resume behavior.

## Extension Points

- Keep Potassium-specific combat, wave, boss, projectile, leaderboard, renderer, and Phaser data changes inside this scene folder.
- Use the scene registry and presentation helpers for app-level integration instead of local React/Phaser kind checks.
- Add shared runtime code only when another scene genuinely needs the same lifecycle or policy.

See `docs/runtime-architecture.md` and `.agents/rules/20-game-runtime.md` for the global runtime rules.
