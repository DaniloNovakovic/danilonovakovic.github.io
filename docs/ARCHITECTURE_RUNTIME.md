# Runtime Architecture (Current)

This document describes the current runtime architecture in `src/`. It is the developer-facing top-down map of how the app works today.

## High-level flow

1. `App` renders the selected mode shell.
2. Shared state lives in `src/game/bridge/store.ts`.
3. `Game` boots Phaser and wires the kernel runtime.
4. `GameKernel` subscribes to bridge state and delegates transitions/pause to `SceneManager`.
5. `SceneManager` manages scene contexts via a Phaser adapter boundary.

## Runtime subsystems

- **Bridge state** - `src/game/bridge/store.ts` is the observable React/Phaser state boundary. It owns runtime mode projections, pause derivation, inventory/progress, scene hint text, and touch input one-shots. Volatile action semantics live in JSDoc next to `bridgeActions`.
- **Kernel orchestration** - `src/game/kernel/GameKernel.ts` observes bridge state and delegates scene transitions, pause propagation, resume capture, and lifecycle notifications through `SceneManager`.
- **Phaser adapter and scene contexts** - `src/game/infra/phaser/PhaserSceneAdapter.ts` keeps Phaser-specific scene control behind an adapter. `src/game/sceneContexts/createSceneContexts.ts` assembles known scene contexts and injects runtime callbacks.
- **Registry and runtime lookup** - `src/game/registry/catalog.ts` composes game-owned catalog facts from scene and portfolio modules. `src/game/runtime/miniGameRegistry.ts` is the caller-facing lookup surface for overlay/scene resolution and parent returns.
- **Shared scene runtime** - reusable Phaser scene machinery lives in `src/game/runtime`: side-view player lifecycle, side-view camera policy, scene presentation, scene resume policy, keyboard pause, interior interactions, and shared text helpers. Symbol-level behavior belongs in JSDoc near each runtime export.
- **Pure gameplay decisions** - `src/game/core` contains deterministic ECS, input, and player logic that can be tested without Phaser, React, browser globals, or bridge state.
- **Concrete adapters** - `src/game/infra` contains adapters to concrete external APIs. Today, `PhaserSceneAdapter` is the adapter from kernel scene requests to Phaser scene APIs.
- **Scene-owned runtime modules** - scene folders own local layout, Phaser objects, catalog facts, text, and heavy mini-game modules. For example, Potassium keeps its command, renderer, projectile, enemy, session, combat, and data seams under its own scene runtime rather than expanding global docs with a file inventory.

## Scene presentation and camera

Phaser runs at the fixed design size from `src/game/runtime/config.ts` and scales with `Scale.ENVELOP`. React owns the visible shell aspect ratio:

- `portrait-cover` is the default for side-view player scenes on phones. The shell is portrait, overflow is clipped, and the shared side-view camera runtime follows/clamps the player so cover-mode crop does not reveal off-world space.
- `full-board` is for arcade scenes where the whole landscape board must remain visible.
- `vertical-board` is for portrait arcade scenes such as Potassium. The shell is tall, Phaser still uses the fixed logical design size with `Scale.ENVELOP`, and direct Phaser pointer input is preserved instead of the React swipe/tap gesture overlay.

When a scene changes presentation mode, `src/game/shell/Game.tsx` keeps the existing Phaser instance mounted and calls `game.scale.refresh()` after the new DOM size lands. Side-view camera runtimes listen for Phaser scale resize and re-apply camera bounds/profile math.

## Runtime seams for new scenes

- Game presentation facts and runtime bindings belong in scene-owned or game-portfolio catalog modules composed by `src/game/registry/catalog.ts`. Catalogs answer what playable feature exists and how it is resolved. Avoid local React overlay maps or ad hoc runtime-kind checks in React/Phaser callers.
- Add Phaser scene lifecycle wiring through scene-owned `sceneContext.ts` files and compose them in `createSceneContexts`; keep `src/game/shell/Game.tsx` as the DOM host and put Phaser boot, bridge callbacks, resizing, and touch controls in focused shell hooks.
- Import scene-owned public facts across folders through `src/game/scenes/*/index.ts` barrels. Import Phaser scene classes/builders through `src/game/scenes/*/runtime/index.ts` barrels so registry/catalog tests stay headless. Scene-internal runtime modules can keep local direct imports.
- Use `sceneResumePolicy` for resume persistence and reset rules. The low-level resume store should not be imported directly by scenes or adapters.
- Side-view player scenes should compose `SideViewPlayerRuntime` before creating colliders against `runtime.player`; pass its camera config when the scene should follow and clamp the player.
- Interior rooms should describe prop targets and effect commands, then let `InteriorInteractionRuntime` choose the active target and prompt/effect result. Phaser text mutation, bridge writes, and scene-local helpers stay in the scene.

## Folder ownership

Current split:

- `src/App.tsx` and `src/modePicker`
  - App entry and mode routing UI only.
- `src/static`
  - Static, non-game portfolio surface.
- `src/game`
  - Playable mode shell, bridge, scene registry, Phaser scenes, scene contexts, kernel, shared runtime, and engine adapters.
- `src/shared`
  - Code reused by static and game: UI primitives, generic hooks, shared content, shared i18n, and shared config. Import shared UI primitives through the `@/shared/ui` alias.

Migration rule for new code:

- Keep `src/App.tsx` thin; add surface implementation under `src/static` or `src/game`.
- Add static-only portfolio presentation under `src/static`.
- Add playable-mode overlays and scenes under `src/game`.
- Add code reused by static and game under `src/shared`.
- Add new Phaser scene lifecycle wiring in the owning scene folder as `sceneContext.ts`, then include it from `src/game/sceneContexts/createSceneContexts.ts`.
- Add scene-specific Phaser runtime under `src/game/scenes/*/runtime`; touch `src/game/runtime` only for reusable game machinery.
- Add pure deterministic gameplay decisions under `src/game/core`; put Phaser-facing reuse under `src/game/runtime`, lifecycle orchestration under `src/game/kernel`, and concrete external adapters under `src/game/infra`.
- Use the source-root alias for cross-folder imports: `@/*` resolves to `src/*`. Keep short local relative imports inside a module folder.
- Import shared UI primitives through `@/shared/ui`.

## Pure decision modules

Pure decision code exists where it buys leverage, but the app is not trying to migrate all runtime code into ECS. Use the smallest Interface that concentrates repeated knowledge.

The ECS foundation under `src/game/core/ecs` is the canonical anchor for pure entity/component decisions. It covers player movement/input decisions and low-level interaction picking without importing Phaser or React.

Runtime Modules such as `SideViewPlayerRuntime`, `InteriorInteractionRuntime`, and `sceneResumePolicy` are equally valid when the repeated knowledge is lifecycle, policy, or orchestration rather than entity iteration.

Potassium uses focused runtime Modules to keep the large arcade scene navigable without moving Phaser ownership out of the scene:

- `potassiumSlipCommandAdapter` is the command seam between pure session/combat/boss decisions and mutable Phaser/bridge/renderer side effects.
- `potassiumSlipRenderer` is the visual seam for field/HUD/overlay drawing, attachment positioning, and transient Phaser graphics/tweens.
- `potassiumSlipProjectileControl` is the pure control-state seam for banana launch, recall, and drag feel.
- `potassiumSlipEnemyFactory` is the enemy setup seam for kind facts, spawn placement, and body/attachment setup.
- `potassiumSlipPhaserData` is the typed data seam for Potassium-specific Phaser object metadata.

## Manual smoke verification

After changes that touch Phaser boot, bridge, kernel, scenes, or overlays, run `npm run dev` and confirm:

1. **Overworld** — canvas loads; move left/right, jump, interact near a building.
2. **Hobbies** — enter hobbies (building or `H` where applicable); walk; interact with an interior target; exit (`H` / `Esc` / close flow) returns to overworld.
3. **Basement** — enter the Developer Basement; interact with the computer before glasses to see the character thought, then collect glasses and confirm the Developer Console opens and closes back to the basement scene.
4. **React overlays** — open a building overlay from the street; close it; no stuck keyboard focus in the canvas.
5. **Pause / input** — with a React overlay open, scene pause propagates (no gameplay input leaking); closing overlay resumes the parent scene or overworld input.

Record pass/fail in the PR or release notes when shipping runtime changes.

## Rendering guardrails (Phaser 4)

Guardrails are currently policy-level (documented) rather than a dedicated utility module:

- Use `SpriteBatch` for interactive entities.
- Use `DynamicTexture` for composited or stamp-style static textures, with explicit `dynamicTexture.render()` flush calls.
- Use `SpriteGPULayer` only for dense, mostly static quads; avoid high-frequency member add/remove churn.

If repeated render policy code appears, introduce a shared helper under the Phaser infra layer.
