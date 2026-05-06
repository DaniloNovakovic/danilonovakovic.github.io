# Runtime Modes

This note captures the current high-level scene and overlay transitions. The
code remains the source of truth.

## State

- `activeSceneId`: the Phaser scene world currently owned by scene lifecycle.
  `overworld` is the default scene.
- `activeOverlayId`: the React overlay currently rendered by `OverlayHost`, or
  `null` when no overlay is open.
- `loadingSceneId`: the scene currently being lazy-loaded, or `null`.
- `isPaused`: derived in the bridge from active overlay or scene loading state.

## Dev Starts

In development, `?startScene=<sceneId>` can boot directly into a Phaser scene
for fast iteration. Current useful targets include `hobbies`, `basement`,
`potassium`, and `ridge`.

## Transition Owners

- `src/game/bridge/store.ts` owns observable cross-boundary state and actions:
  `enterScene`, `returnToOverworld`, `openOverlay`, and `closeOverlay`.
  `openOverlay(overlayId, options)` can carry overlay params and return-scene
  intent from Phaser scenes to React overlays.
- `src/game/sceneLifecycle/SceneLifecycleController.ts` maps bridge scene changes to
  `SceneManager` transitions and maps pause changes to active Phaser scenes.
- `src/game/overlays/OverlayHost.tsx` renders React overlays from the active
  overlay id.
- Phaser scenes keep local pause state only as a scene runtime concern; they do
  not decide whether an overlay should pause the engine.

## Smoke Path

Use this path when checking pattern refactors:

1. Move and interact in the overworld.
2. Open and close a React overlay from a building.
3. Enter and exit the hobbies Phaser scene.
4. Open and close a hobby overlay from inside the hobbies scene.
5. Enter the Developer Basement, open the computer console, and close it back
   to the basement scene.
6. Boot `?startScene=ridge`; verify the Ridge shell renders, movement works,
   and walking near a Stampede/Telegraph/Domino prop shows `[E] INTERACT`.
   Interact to open the Trail Card, confirm its primary action is disabled while
   the target scene is unavailable, then close back to Ridge.
7. Open inventory from the overworld and from a child scene.
8. Verify mobile touch movement, jump, and interact one-shots.
