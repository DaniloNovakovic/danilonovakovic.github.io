# Source Architecture Map

This folder is organized by surface ownership.

## Folder Guide

- `app/` - App entry and mode routing only.
- `static/` - Static, non-game portfolio surface.
- `game/` - Playable mode: shell, bridge, scenes, registry, kernel, shared runtime, and Phaser infrastructure.
- `shared/` - Code reused by static and game, such as UI primitives, generic hooks, shared content, and shared config.

## Rules Of Thumb

- If it only exists for the playable mode, put it in `game/`.
- If it only exists for the static portfolio, put it in `static/`.
- If both static and game need it, put it in `shared/`.
- Keep `app/` thin: route between picker, static, and game; do not put surface implementation there.
- Import shared UI primitives with `@shared/ui`.
- Use ownership aliases for cross-folder imports: `@app/*`, `@static/*`, `@game/*`, and `@shared/*`.

## Game Conventions

- `game/scenes/*/catalog.ts` - Game registry facts for a scene or game-owned overlay group.
- `game/scenes/*/text.ts` - Game-only display strings.
- `game/scenes/*/runtime` - Scene-specific Phaser code and scene-local modules.
- `game/portfolio` - Portfolio overlays as they appear inside the playable mode.
- `game/registry` - IDs, runtime bindings, catalog composition, and registry-facing type objects.
- `game/runtime` - Reusable game machinery shared by multiple scenes.
