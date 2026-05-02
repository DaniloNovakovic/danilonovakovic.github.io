# Game Runtime Rules

Applies to Phaser scenes, adapters, context plugins, and per-frame runtime code.

## Hard Rules

1. **Phaser owns the loop; scenes own `update`.** Do not write a custom `requestAnimationFrame` loop. Put per-frame logic in scene `update(time, delta)` and delegate repeated decisions to pure systems or runtime Modules when that creates real Locality.
2. **Avoid per-frame allocations in hot paths.** Hoist objects, arrays, and closures out of `update()` where practical.
3. **Prefer state machines over boolean flag webs.** If an entity or scene has several mode booleans, model the mode as a discriminated union or focused FSM.
4. **Pause/input goes through the kernel path.** React overlays pause scenes via bridge-derived runtime mode and kernel pause propagation. Pausable scenes should use [`setSceneKeyboardPaused`](../../src/runtime/sceneKeyboardPause.ts).
5. **Collider order matters.** Instantiate the player/static bodies before registering colliders.
6. **Phaser 4 render guardrails.** Use DynamicTexture with explicit `render()` flushes; use SpriteGPULayer only for dense, mostly static quads; avoid high-frequency layer membership churn.
7. **Object pools only when profiled.** If GC pressure is measured, prefer Phaser `Group.createMultiple` + `getFirstDead` before hand-rolled pools.
8. **Scene resume goes through policy.** Resume capture scenes implement `getResumeCapturePosition()` and use scene keys matching registry keys. Persistence/reset rules go through [`sceneResumePolicy`](../../src/runtime/sceneResumePolicy.ts); do not import the low-level store directly unless editing the policy.
9. **Side-view player scenes use the shared runtime.** Use [`SideViewPlayerRuntime`](../../src/runtime/player/SideViewPlayerRuntime.ts) for spawn/resume placement, input, pause propagation, `PlayerController`, appearance sync, sprite animation, and resume capture. Scenes still own layout, colliders, prompts, and scene-specific interactions.
10. **Interior prop interactions use the shared runtime.** Use [`InteriorInteractionRuntime`](../../src/runtime/interactions/InteriorInteractionRuntime.ts) for Hobbies/Basement-style target selection, prompt facts, exit requests, and typed effect commands. Keep Phaser objects and bridge mutations scene-owned.

## When In Doubt

Use the deletion test before adding a shared runtime Module: if deleting it would spread the same ordering/rule knowledge back across scenes, it is probably earning its keep. If it only wraps one caller without hiding behavior, keep the scene code direct.
