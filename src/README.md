# Source Architecture Map

This folder contains the app shells, feature modules, shared UI, and game runtime code.

## Folder guide

- `app/` - Thin React entry shells for mode routing, interactive mode, static mode, and the mode picker.
- `features/` - Feature-owned React overlays, mini-game UI, and colocated domain presentation code.
- `runtime/` - Phaser scene runtime, registries, scene contracts, and gameplay-facing modules.
- `contextPlugins/` - Kernel context plugin definitions that describe scene entry/exit behavior.
- `core/` - Domain-first kernel and ECS logic.
- `infra/` - Engine adapters and infrastructure boundaries.
- `shared/` - Cross-boundary bridge state, shared UI primitives, hooks, and cross-feature helpers.
- `config/` - Feature metadata, world layout, and content bindings.

## Rules of thumb

- If it talks directly to Phaser scene lifecycle, start in `runtime/` or `infra/`.
- If it describes a context for `SceneManager`, put it in `contextPlugins/`.
- If it is a mode-level React shell, put it in `app/modes/`.
- If it is feature-specific React UI or mini-game presentation, put it under `features/`.
- If it should remain engine-agnostic, keep it in `core/`.
- If both React and Phaser need it, use `shared/` (via bridge patterns).
- Import shared UI primitives with `@shared/ui`.
