# Runtime Architecture (Current)

This document describes how playable mode is structured today. The canonical
game vocabulary is explicit:

- **Scenes** are Phaser worlds.
- **Overlays** are React surfaces rendered above the game.
- **Scene UI** is scene-owned React status/panel UI rendered by the shell
  without using the global overlay pause path.
- **Triggers** are scene-owned interaction points that enter scenes or open overlays.

## High-level flow

1. `App` renders the selected mode shell.
2. Shared React/Phaser state lives in `src/game/bridge/store.ts`.
3. `Game` boots Phaser and wires scene lifecycle.
4. `SceneLifecycleController` observes bridge scene/overlay state and delegates scene transitions/pause to `SceneManager`.
5. `SceneManager` manages scene contexts through the Phaser adapter.
6. `OverlayHost` renders the active React overlay from the overlay registry.
7. `SceneUiHost` renders scene-owned React status/panel surfaces from bridge
   `sceneUi` requests.
8. Notebook shell profile policy can wrap selected presentation scenes in the
   shared notebook layout primitives while the Phaser scene still owns gameplay.

## Runtime subsystems

- **Bridge state** - `src/game/bridge/store.ts` is the observable React/Phaser state seam. It owns active scene id, active overlay id, loading scene id, pause derivation, scene-owned UI requests/actions, inventory/progress, scene hint text, touch input one-shots, and opt-in scene control pointer events.
- **Scene lifecycle** - `src/game/sceneLifecycle` owns `SceneLifecycleController`, `SceneManager`, scene transition coordination, lifecycle events, and scene context assembly.
- **Phaser adapter** - `src/game/adapters/phaser/PhaserSceneAdapter.ts` translates scene lifecycle requests into concrete Phaser scene API calls.
- **Scene ids and lookup** - `src/game/scenes/sceneIds.ts` names Phaser scene ids and keys. `src/game/scenes/sceneRegistry.ts` answers how loadable scenes are resolved.
- **Overlay ids and lookup** - `src/game/overlays/overlayIds.ts` names React overlay ids. `src/game/overlays/overlayRegistry.ts` answers how overlay components and display metadata are resolved. `OverlayHost` is the only shared React overlay renderer.
- **Scene UI lookup** - `src/game/sceneUi` hosts scene-owned React UI surfaces
  for non-global, scene-controlled status and panels. These surfaces do not
  pause Phaser automatically; the owning scene decides whether gameplay is
  gated and consumes one-shot UI actions through the bridge.
- **Scene header chrome** - `src/game/shell/sceneHeaderChrome.ts` owns the
  small shell-level policy for replacing default shell controls with a scene
  navigation control in presentation-heavy arcade scenes.
- **Notebook shell profile policy** - `src/game/shell/notebookShellProfile.ts`
  maps runtime scenes onto shared Notebook Shell layout primitives. Potassium
  uses the `ruledBoardPage` focus profile; Stampede uses the `survivalPage`
  focus profile. Scene-specific panels stay colocated with their owning scenes.
- **Shared scene runtime** - reusable Phaser-facing machinery lives in `src/game/sharedSceneRuntime`: side-view player lifecycle, camera policy, scene presentation, resume policy, keyboard pause, interior interactions, text, textures, and vision helpers.
- **Pure gameplay decisions** - `src/game/core` contains deterministic ECS, input, and player logic that can be tested without Phaser, React, browser globals, or bridge state.
- **Scene-owned modules** - scene folders own local layout, triggers, Phaser objects, scene contexts, scene-local overlays, and heavy scene runtime modules.
- **Ridge exploration runtime** - Ridge treats
  `src/game/scenes/ridge/blockout/sources/folded-desk-ridge.source.ts` as
  typed authoring source data and imports the committed generated artifact at
  runtime. The Ridge scene derives geometry, compiles typed facts, resolves
  durable progress, and hands those outputs to scene-owned presentation,
  traversal, interaction, and Cicka Home mutation modules.

## Scene presentation and camera

Phaser runs at the fixed design size from `src/game/sharedSceneRuntime/config.ts`
and scales with `Scale.ENVELOP`. React owns the visible shell aspect ratio:

- `portrait-cover` is the default for side-view player scenes on phones. The shell is portrait, overflow is clipped, and the shared side-view camera runtime follows/clamps the player so cover-mode crop does not reveal off-world space.
- `full-board` is for arcade scenes where the whole landscape board must remain visible.
- `vertical-board` is for portrait arcade scenes such as Potassium and the
  first Stampede movement prototype. The shell is tall, Phaser still uses the
  fixed logical design size with `Scale.ENVELOP`, and direct Phaser pointer
  input is preserved instead of the React swipe/tap gesture overlay.
- Potassium additionally opts into the Notebook Shell `ruledBoardPage` focus
  layout. Stampede opts into the Notebook Shell `survivalPage` focus layout.
  Their shell-level control mats can forward pointer events outside the visible
  canvas back to the owning scene in Phaser design coordinates.

When a scene changes presentation mode, `src/game/shell/Game.tsx` keeps the
existing Phaser instance mounted and calls `game.scale.refresh()` after the new
DOM size lands. Side-view camera runtimes listen for Phaser scale resize and
re-apply camera bounds/profile math.

## Runtime seams for new work

- Add new Phaser worlds under `src/game/scenes/<scene>/` with a scene context and, when loadable, a scene registry entry.
- Keep scene triggers in the owning scene. A trigger should call `enterScene(sceneId)` or `openOverlay(overlayId, options)` through the bridge callback it receives at scene start.
- Use overlay options for scene-owned overlay params and return intent. Ridge
  Trail Cards use this path to show reusable entry cards. Stampede can enter
  its movement prototype from the Trail Card, while later Ridge props stay
  disabled until their target scenes exist.
- Put scene-local overlays under `src/game/scenes/<scene>/overlays` and export overlay definitions from that scene. Put shared/global overlays under `src/game/overlays`.
- Use `src/game/overlays/OverlayHost.tsx` for overlay rendering. Do not add local React overlay maps to shell or scene code.
- Use `src/game/sceneUi/SceneUiHost.tsx` for scene-owned React status/panels
  when the UI belongs to the active Phaser scene but should be rendered as DOM.
  Keep gameplay state in the scene/runtime; React sends only one-shot scene UI
  actions back through the bridge. Panel surfaces mount above the clipped Phaser
  frame so dialog-style UI can remain centered without being cropped by the
  game card. Stampede uses this for status/start/result UI; Potassium uses it
  for draft choices and terminal actions while Phaser keeps the active HUD and
  gameplay field.
- Use shell header chrome policy for app navigation controls that belong
  outside the Phaser card, such as Back buttons for arcade scenes. Do not push
  those controls through scene-owned UI unless they need scene gameplay state.
- Use the scene control pointer bridge only for explicit shell-level control
  mats. Potassium consumes these events to extend launch/recall drag input
  beyond the visible canvas; Stampede consumes them to extend drag-to-move
  beyond the visible survival page. Other scenes should opt in through profile policy
  instead of reading those events opportunistically.
- Use `sceneResumePolicy` for resume persistence and reset rules. The low-level resume store should not be imported directly by scenes or adapters.
- Side-view player scenes should compose `SideViewPlayerRuntime` before creating colliders against `runtime.player`; pass its camera config when the scene should follow and clamp the player.
- Interior rooms should describe prop targets and effect commands, then let `InteriorInteractionRuntime` choose the active target and prompt/effect result. Phaser text mutation, bridge writes, and scene-local helpers stay in the scene.
- Ridge spatial changes should start in the typed Ridge blockout source, then flow through the generated blockout artifact, geometry derivation, and compiled fact layer. Keep raw string attributes at the source-contract boundary; callers should consume typed facts or geometry outputs.
- Ridge traversal assists are owned by the Ridge traversal runtime. The current runtime consumes compiled geometry and applies ramp, climb, drop, step-up, mantle, safe-position capture, and fall-recovery decisions around the shared side-view player.
- Ridge landmark presentation owns ordinary landmark visuals such as Stampede blanket, Telegraph, Relay, Domino, guide, and high ledges. Cicka Home mutation visuals are resolved separately from compiled home-mutation facts and durable Ridge progress.
- Cicka Home mutation declarations are data-driven but conservative: active mutations render only when a durable source exists, and future declarations stay typed promises until their progress source is implemented.

## Folder ownership

Current split:

- `src/App.tsx` and `src/modePicker`
  - App entry and mode routing UI only.
- `src/static`
  - Static, non-game portfolio surface.
- `src/game`
  - Playable mode shell, bridge, scenes, overlays, scene lifecycle, shared scene runtime, pure game decisions, and adapters.
- `src/shared`
  - Code reused by static and game: UI primitives, generic hooks, shared portfolio facts, shared i18n, and shared config. User-facing copy belongs in `src/shared/i18n/messages/en/`; non-copy portfolio facts belong in `src/shared/portfolio`. React reads localized copy through `useMessages()` and updates live; Phaser/runtime reads through `getMessages()` and picks up locale changes when scenes restart/re-enter. Import shared UI primitives through the `@/shared/ui` alias.

Migration rule for new code:

- Keep `src/App.tsx` thin; add surface implementation under `src/static` or `src/game`.
- Add static-only portfolio presentation under `src/static`.
- Add playable-mode scenes and overlays under `src/game`.
- Add code reused by static and game under `src/shared`.
- Add new Phaser scene lifecycle wiring in the owning scene folder as `sceneContext.ts`, then include it from `src/game/sceneLifecycle/contexts/createSceneContexts.ts`.
- Add scene-specific Phaser runtime under `src/game/scenes/*/runtime`; touch `src/game/sharedSceneRuntime` only for reusable game machinery.
- Add pure deterministic gameplay decisions under `src/game/core`; put Phaser-facing reuse under `src/game/sharedSceneRuntime`, lifecycle orchestration under `src/game/sceneLifecycle`, and concrete external adapters under `src/game/adapters`.
- Use the source-root alias for cross-folder imports: `@/*` resolves to `src/*`. Keep short local relative imports inside a module folder.
- Import shared UI primitives through `@/shared/ui`.

## Pure decision and runtime modules

Current pure decision and shared runtime seams:

- `src/game/core/ecs` is the canonical anchor for pure entity/component
  decisions. It covers player movement/input decisions and low-level
  interaction picking without importing Phaser or React.
- `SideViewPlayerRuntime`, `InteriorInteractionRuntime`, and
  `sceneResumePolicy` are shared runtime modules for repeated lifecycle,
  policy, or orchestration knowledge.

Potassium uses focused runtime modules to keep the large arcade scene navigable:

- `potassiumSlipCommandAdapter` is the command seam between pure session/combat/boss decisions and mutable Phaser/bridge/renderer side effects.
- `potassiumSlipRenderer` is the visual seam for field/HUD/overlay drawing, attachment positioning, and transient Phaser graphics/tweens.
- `potassiumSlipProjectileControl` is the pure control-state seam for banana launch, recall, and drag feel.
- `potassiumSlipEnemyFactory` is the enemy setup seam for kind facts, spawn placement, and body/attachment setup.
- `potassiumSlipPhaserData` is the typed data seam for Potassium-specific Phaser object metadata.

Ridge uses focused runtime modules to keep the Exploration Map editable:

- The source compiler accepts the typed Ridge blockout source and validates
  rooms, symbols, anchors, route references, shortcuts, traversal movement
  values, and runtime cell overlap.
- The geometry layer turns grid cells, exits, and progress-gated shortcuts into
  bounds, collider runs, connector platforms, and assist zones.
- The compiled fact layer exposes room beats, route links, anchors, shortcuts,
  and home mutations for presentation and interaction callers.
- Ridge traversal runtime owns forgiving movement assists for the Exploration
  Map; opt-in mini-games such as Stampede keep their own movement systems.
- Cicka Home mutation resolution maps compiled home-mutation facts to durable
  Ridge progress and keeps unresolved future mutations inactive.

## Manual smoke verification

After changes that touch Phaser boot, bridge, scene lifecycle, scenes, overlays,
or scene UI, run `pnpm dev` and use the canonical
[`runtime-modes.md` smoke path](runtime-modes.md#smoke-path). Record pass/fail
in the PR or release notes when shipping runtime changes.

## Rendering guardrails (Phaser 4)

Guardrails are currently policy-level (documented) rather than a dedicated utility module:

- Use `SpriteBatch` for interactive entities.
- Use `DynamicTexture` for composited or stamp-style static textures, with explicit `dynamicTexture.render()` flush calls.
- Use `SpriteGPULayer` only for dense, mostly static quads; avoid high-frequency member add/remove churn.

If repeated render policy code appears, introduce a shared helper under the Phaser adapter layer.
