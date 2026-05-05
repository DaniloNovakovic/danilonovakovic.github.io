# Source Architecture Map

This folder is organized by surface ownership.

## Folder Guide

- `App.tsx` - App entry and mode routing only.
- `modePicker/` - Entry routing UI for choosing static or playable mode.
- `static/` - Static, non-game portfolio surface.
- `game/` - Playable mode: shell, bridge, scenes, registry, kernel, shared runtime, and Phaser infrastructure.
- `shared/` - Code reused by static and game, such as UI primitives, generic hooks, shared content, and shared config.

## Rules Of Thumb

- If it only exists for the playable mode, put it in `game/`.
- If it only exists for the static portfolio, put it in `static/`.
- If both static and game need it, put it in `shared/`.
- Keep `App.tsx` thin: route between picker, static, and game; do not put surface implementation there.
- Keep app routing state in `shared/hooks/useReadMode.ts`; keep generic loading UI in `shared/ui/LoadingFallback.tsx`.
- Import shared UI primitives with `@shared/ui`.
- Use ownership aliases for cross-folder imports: `@static/*`, `@game/*`, and `@shared/*`.

## Game Conventions

- `game/scenes/*/catalog.ts` - Game registry facts for a scene or game-owned overlay group.
- `game/scenes/*/text.ts` - Game-only display strings.
- `game/scenes/*/index.ts` - Public scene barrel for cross-folder scene facts.
- `game/scenes/*/runtime` - Scene-specific Phaser code and scene-local modules.
- `game/scenes/*/runtime/index.ts` - Public runtime barrel for cross-folder Phaser scene classes and builders.
- `game/shell/use*.ts` - Focused React hooks for Phaser boot, bridge callbacks, touch controls, and scale refresh.
- `game/portfolio` - Portfolio overlays as they appear inside the playable mode.
- `game/registry` - IDs, runtime bindings, catalog composition, and registry-facing type objects.
- `game/runtime` - Reusable game machinery shared by multiple scenes.
