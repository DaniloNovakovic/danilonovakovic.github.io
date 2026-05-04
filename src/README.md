# Source Architecture Map

This folder contains the app shells, feature modules, shared UI, and game runtime code.

## Folder guide

- `app/` - Thin React entry shells for mode routing, interactive mode, static mode, and the mode picker.
- `features/` - Feature-owned React overlays, mini-game UI, catalog entries, and colocated domain presentation code.
- `game/runtime/` - Shared Phaser runtime, registries, scene contracts, and gameplay-facing modules.
- `game/contextPlugins/` - Kernel context plugin definitions that describe scene entry/exit behavior.
- `game/core/` - Domain-first kernel and ECS logic.
- `game/infra/` - Engine adapters and infrastructure boundaries.
- `shared/` - Cross-boundary bridge state, shared UI primitives, hooks, and cross-feature helpers.
- `config/` - Shared feature IDs, runtime binding composition, content, and typography.

## Rules of thumb

- If it talks directly to shared Phaser scene lifecycle, start in `game/runtime/` or `game/infra/`.
- If it describes a context for `SceneManager`, put it in `game/contextPlugins/`.
- If it is a mode-level React shell, put it in `app/modes/`.
- If it is feature-specific React UI or mini-game presentation, put it under `features/`.
- If it should remain engine-agnostic, keep it in `game/core/`.
- If both React and Phaser need it, use `shared/` (via bridge patterns).
- Use ownership aliases for cross-folder imports: `@app/*`, `@features/*`, `@game/*`, `@shared/*`, and `@config/*`.
- Import shared UI primitives with `@shared/ui`.
