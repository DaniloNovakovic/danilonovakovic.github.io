# Source Architecture Map

This folder contains the interactive app runtime and UI code.

## Folder guide

- `runtime/` - Phaser scene runtime, registries, scene contracts, and gameplay-facing modules.
- `contextPlugins/` - Kernel context plugin definitions that describe scene entry/exit behavior.
- `core/` - Domain-first kernel and ECS logic.
- `infra/` - Engine adapters and infrastructure boundaries.
- `shared/` - Cross-boundary shared state (bridge store).
- `components/` - React shell, overlays, and UI composition.
- `config/` - Feature metadata, world layout, and content bindings.

## Rules of thumb

- If it talks directly to Phaser scene lifecycle, start in `runtime/` or `infra/`.
- If it describes a context for `SceneManager`, put it in `contextPlugins/`.
- If it should remain engine-agnostic, keep it in `core/`.
- If both React and Phaser need it, use `shared/` (via bridge patterns).
