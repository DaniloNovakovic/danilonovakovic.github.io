# Source Architecture Map

This folder is organized by surface ownership.

## Folder Guide

- `App.tsx` - App entry and mode routing only.
- `modePicker/` - Entry routing UI for choosing static or playable mode.
- `static/` - Static, non-game portfolio surface.
- `game/` - Playable mode: shell, bridge, scenes, overlays, scene lifecycle, shared scene runtime, core, and adapters.
- `shared/` - Code reused by static and game, such as UI primitives, generic hooks, shared portfolio facts, shared i18n, and shared config.

## Rules Of Thumb

- If it only exists for the playable mode, put it in `game/`.
- If it only exists for the static portfolio, put it in `static/`.
- If both static and game need it, put it in `shared/`.
- Keep `App.tsx` thin: route between picker, static, and game; do not put surface implementation there.
- Keep app routing state in `shared/hooks/useReadMode.ts`; keep generic loading UI in `shared/ui/LoadingFallback.tsx`.
- Import shared UI primitives with `@/shared/ui`.
- Use the source-root alias for cross-folder imports: `@/*` resolves to `src/*`.
- Folder `index.ts` files mark public boundaries; cross-folder imports should prefer those barrels when they exist.

## Game Conventions

- `game/scenes/sceneIds.ts` - Canonical scene ids and Phaser scene keys.
- `game/scenes/sceneRegistry.ts` - Loadable scene lookup and dev-switcher scene metadata.
- `game/scenes/*/sceneContext.ts` - Scene lifecycle/start-data contract for a Phaser scene.
- `game/scenes/*/worldLayout.ts` or `roomLayout.ts` - Scene-owned trigger and layout facts.
- `game/scenes/*/overlays` - React overlays owned by a specific scene.
- `game/scenes/*/overlayDefinitions.ts` - Public overlay definitions exported by that scene.
- `game/scenes/*/index.ts` - Public scene barrel for cross-folder scene facts.
- `game/scenes/*/runtime` - Scene-specific Phaser code and scene-local modules.
- `game/scenes/*/runtime/index.ts` - Public runtime barrel for cross-folder Phaser scene classes and builders.
- `game/overlays` - Shared overlay ids, overlay registry, `OverlayHost`, global overlays, and portfolio overlays.
- `game/shell/use*.ts` - Focused React hooks for Phaser boot, bridge callbacks, touch controls, and scale refresh.
- `game/sceneLifecycle` - Scene lifecycle orchestration, scene manager, lifecycle events, and context assembly.
- `game/sharedSceneRuntime` - Reusable Phaser-facing machinery shared by multiple scenes.
- `game/core` - Pure ECS, input, and player decision logic with no Phaser/React/browser imports.
- `game/adapters` - Concrete adapters to external engines/APIs, such as the Phaser scene adapter.
- `shared/i18n/messages/en/` - English user-facing copy for React and Phaser. `index.ts` composes the locale from domain files. Add new display strings here first; do not add scene `text.ts` compatibility shims.

## Scene vs Overlay

- A **scene** is a Phaser world entered through scene lifecycle.
- An **overlay** is a React surface rendered by `game/overlays/OverlayHost.tsx`.
- A **trigger** is an interaction point owned by a scene. Triggers call `enterScene(sceneId)` or `openOverlay(overlayId, options)` through bridge callbacks.
- `sceneContext.ts` answers how an actual Phaser scene enters, exits, lazy-loads, and receives start data from scene lifecycle.
- `shared/ui/<Component>/` - UI primitive component, stories, tests, and local `index.ts` grouped together.
