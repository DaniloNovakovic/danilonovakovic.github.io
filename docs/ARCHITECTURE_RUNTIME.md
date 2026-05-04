# Runtime Architecture (Current)

This document describes the current runtime architecture in `src/`. It is the developer-facing top-down map of how the app works today.

## High-level flow

1. `App` renders the game shell and overlays.
2. Shared state lives in `src/shared/bridge/store.ts`.
3. `Game` boots Phaser and wires the kernel runtime.
4. `GameKernel` subscribes to bridge state and delegates transitions/pause to `SceneManager`.
5. `SceneManager` manages context plugins via a Phaser adapter boundary.

## Core modules

- `src/shared/bridge/store.ts`
  - Single source of truth for:
    - app state (`status`, `activeMiniGameId`, `isPaused`)
    - touch flags (`left`, `right`, `jumpQueued`, `interactTap`)
  - Exposes `bridgeActions` and `useBridgeState`.
- `src/core/kernel/GameKernel.ts`
  - Reacts to bridge state changes.
  - Emits lifecycle events (`SceneTransitionRequested`, `OverlayOpened`, `OverlayClosed`, `PauseChanged`).
- `src/core/kernel/SceneManager.ts`
  - Registers context plugins.
  - Handles scene enter/exit, resume capture, and pause propagation.
- `src/infra/phaser/PhaserSceneAdapter.ts`
  - Adapter boundary for scene start/stop, active scene pause, callback rebinding, and resume capture.
- `src/contextPlugins/createContextPlugins.ts`
  - Assembles the ordered Phaser context plugins and injects runtime callbacks, lazy scene loading, pause state, and resume policy.
- `src/contextPlugins/plugins/StreetPlugin.ts`, `src/contextPlugins/plugins/HobbiesPlugin.ts`,
`src/contextPlugins/plugins/BasementPlugin.ts`
  - Context plugin definitions for the Phaser scene contexts.
- `src/runtime/miniGameRegistry.ts`
  - Runtime feature catalog for mini-game lookup, React overlay component resolution, overlay parent returns, and React/Phaser kind checks.
- `src/runtime/sceneResumePolicy.ts`
  - Resume policy over the low-level store. The Phaser adapter captures raw positions; the policy decides whether to persist, clear, or restore by scene key.
- `src/runtime/player/SideViewPlayerRuntime.ts`
  - Shared side-view player lifecycle for Phaser scenes: spawn/resume placement, controller mounting, input frame updates, pause propagation, appearance sync, sprite animation, and resume capture.
- `src/runtime/camera/sideViewCameraRuntime.ts`
  - Shared side-view camera lifecycle. It applies follow target, zoom, follow offset, camera bounds, portrait cover crop padding, Phaser scale resize re-application, and shutdown cleanup.
- `src/runtime/phaserScenePresentation.ts`
  - Scene presentation policy for the React shell. Side-view Phaser scenes use `portrait-cover`; Potassium uses a dedicated `vertical-board` arcade presentation.
- `src/components/interactive/gameShellLayout.ts`
  - React shell layout helper for presentation-mode-specific canvas aspect and max-size rules. Phaser still keeps the fixed logical design size from `src/runtime/config.ts`.
- `src/runtime/interactions/InteriorInteractionRuntime.ts`
  - Pure interior prop interaction runtime. It resolves active targets, prompt placement facts, exit requests, and typed effect commands while scenes keep Phaser objects and side effects.
- `src/runtime/text/PlayerThoughtText.ts`
  - Small scene-local helper for character thoughts that follow a target, reuse the shared typewriter effect, and auto-hide without adding bridge state.
- `src/runtime/potassiumSlip/potassiumSlipCommandAdapter.ts`
  - Phaser-backed Potassium command Adapter. It interprets session, combat, and boss commands, extracts combat facts from Phaser objects, applies recursive combat results, and receives grouped runtime/object/board/renderer ports for bridge, timer, leaderboard, Phaser mutation, and visual effects.
- `src/runtime/potassiumSlip/potassiumSlipRenderer.ts`
  - Phaser-backed Potassium renderer Module. It owns field/HUD/overlay drawing, enemy/projectile attachment visuals, and transient control/combat effects such as aim arrows, recall tethers, explosions, and death tweens.
- `src/runtime/potassiumSlip/potassiumSlipProjectileControl.ts`
  - Pure Potassium launch/recall control Module. It owns pointer control state, launch threshold/speed math, recall transitions, and idle drag decisions as commands for the scene to apply.
- `src/runtime/potassiumSlip/potassiumSlipEnemyFactory.ts`
  - Potassium enemy setup Module. It owns enemy kind facts, lane placement, HP scaling, body profiles, shield/splitter/boss setup facts, and renderer attachment facts while the scene still creates Phaser sprites.
- `src/runtime/potassiumSlip/potassiumSlipPhaserData.ts`
  - Typed Potassium Phaser data helper Module. It centralizes `getData` / `setData` keys and helpers for combat IDs, hit cooldowns, enemy health/status facts, projectile proc flags, trail timing, and renderer attachment metadata.

## Scene presentation and camera

Phaser runs at the fixed design size from `src/runtime/config.ts` and scales with `Scale.ENVELOP`. React owns the visible shell aspect ratio:

- `portrait-cover` is the default for side-view player scenes on phones. The shell is portrait, overflow is clipped, and the shared side-view camera runtime follows/clamps the player so cover-mode crop does not reveal off-world space.
- `full-board` is for arcade scenes where the whole landscape board must remain visible.
- `vertical-board` is for portrait arcade scenes such as Potassium. The shell is tall, Phaser still uses the fixed logical design size with `Scale.ENVELOP`, and direct Phaser pointer input is preserved instead of the React swipe/tap gesture overlay.

When a scene changes presentation mode, `Game.tsx` keeps the existing Phaser instance mounted and calls `game.scale.refresh()` after the new DOM size lands. Side-view camera runtimes listen for Phaser scale resize and re-apply camera bounds/profile math.

## Runtime seams for new scenes

- Feature presentation facts belong in the feature catalog. Avoid local React overlay maps or ad hoc runtime-kind checks in React/Phaser callers.
- Add Phaser context registration through `createContextPlugins`; keep `Game.tsx` focused on Phaser boot, adapters, kernel wiring, resizing, and touch controls.
- Use `sceneResumePolicy` for resume persistence and reset rules. The low-level resume store should not be imported directly by scenes or adapters.
- Side-view player scenes should compose `SideViewPlayerRuntime` before creating colliders against `runtime.player`; pass its camera config when the scene should follow and clamp the player.
- Interior rooms should describe prop targets and effect commands, then let `InteriorInteractionRuntime` choose the active target and prompt/effect result. Phaser text mutation, bridge writes, and scene-local helpers stay in the scene.

## Folder ownership (`runtime` vs `contextPlugins`)

Current split:

- `src/runtime`
  - Active Phaser runtime code (scenes, texture builders, scene contracts, registry helpers).
- `src/contextPlugins`
  - Plugin/context definitions used by kernel scene orchestration.

Migration rule for new code:

- Add new context/plugin modules under `src/contextPlugins`.
- Touch `src/runtime` when integrating with existing scene runtime.

## Pure Decision Modules

Pure decision code exists where it buys leverage, but the app is not trying to migrate all runtime code into ECS. Use the smallest Interface that concentrates repeated knowledge.

- `src/core/ecs/world.ts` for entity/component storage.
- `src/core/ecs/components/player.ts` for player-focused pure data components.
- `src/core/ecs/systems/playerSystems.ts` for input + movement/jump/interact system logic.
- `src/core/ecs/systems/overworldInteractSystems.ts` for pure overworld building interact targeting (called from `OverworldScene`).
- `src/core/ecs/systems/roomInteractSystems.ts` for lower-level room target picking.

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

If repeated render policy code appears, re-introduce a shared helper under `src/infra/phaser/render/`.
