# Game Runtime Rules

Applies to Phaser scenes, adapters, scene contexts, and per-frame runtime code.

## Hard Rules

1. **Phaser owns the loop; scenes own `update`.** Do not write a custom `requestAnimationFrame` loop. Put per-frame logic in scene `update(time, delta)` and delegate repeated decisions to pure systems or runtime Modules when that creates real Locality.
2. **Avoid per-frame allocations in obvious hot paths.** Hoist objects, arrays, and closures out of `update()` where practical, but do not make setup or cold code harder to read for theoretical allocation wins.
3. **Prefer state machines over boolean flag webs.** If an entity or scene has several mode booleans, model the mode as a discriminated union or focused FSM.
4. **Pause/input goes through the scene lifecycle path.** React overlays pause scenes via bridge-derived overlay state and scene lifecycle pause propagation. Pausable scenes should use [`setSceneKeyboardPaused`](../../src/game/sharedSceneRuntime/sceneKeyboardPause.ts).
5. **Collider order matters.** Instantiate the player/static bodies before registering colliders.
6. **Phaser 4 render guardrails.** Use DynamicTexture with explicit `render()` flushes; use SpriteGPULayer only for dense, mostly static quads; avoid high-frequency layer membership churn.
7. **Object pools only when profiled.** If GC pressure is measured, prefer Phaser `Group.createMultiple` + `getFirstDead` before hand-rolled pools.
8. **Scene resume goes through policy.** Resume capture scenes implement `getResumeCapturePosition()` and use scene keys matching `src/game/scenes/sceneIds.ts`. Persistence/reset rules go through [`sceneResumePolicy`](../../src/game/sharedSceneRuntime/sceneResumePolicy.ts); do not import the low-level store directly unless editing the policy.
9. **Side-view player scenes use the shared scene runtime.** Use [`SideViewPlayerRuntime`](../../src/game/sharedSceneRuntime/player/SideViewPlayerRuntime.ts) for spawn/resume placement, input, pause propagation, `PlayerController`, appearance sync, sprite animation, resume capture, and camera follow/clamp setup when needed. Camera math belongs in [`sideViewCameraRuntime`](../../src/game/sharedSceneRuntime/camera/sideViewCameraRuntime.ts), not copied into individual scenes. Scenes still own layout, colliders, prompts, and scene-specific interactions.
10. **Interior prop interactions use the shared scene runtime.** Use [`InteriorInteractionRuntime`](../../src/game/sharedSceneRuntime/interactions/InteriorInteractionRuntime.ts) for Hobbies/Basement-style target selection, prompt facts, exit requests, and typed effect commands. Keep Phaser objects and bridge mutations scene-owned.
11. **Scene presentation is shell policy.** Use [`phaserScenePresentation`](../../src/game/sharedSceneRuntime/phaserScenePresentation.ts) for `portrait-cover`, `full-board`, and `vertical-board` decisions. Potassium uses `vertical-board`; do not hardcode Potassium-style layout or side-view portrait-cover checks inside unrelated React/Phaser callers.
12. **Do not duplicate shared scene runtime policy locally.** Pause/input, resume, scene presentation, side-view camera/player behavior, and interior interactions should use the shared scene runtime seams above.

## When In Doubt

Use the deletion test before adding a shared scene runtime Module: if deleting it would spread the same ordering/rule knowledge back across scenes, it is probably earning its keep. If it only wraps one caller without hiding behavior, keep the scene code direct.
