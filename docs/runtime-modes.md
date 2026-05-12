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
- `sceneUi`: optional scene-owned React status/panel requests plus a one-shot
  action from React UI back to the owning Phaser scene. This path does not
  derive pause by itself.
- `sceneControlPointerEvents`: optional owner-scoped pointer event queue for
  shell-level control mats. Potassium uses this to extend drag input outside
  the visible Phaser canvas.

## Dev Starts

In development, `?startScene=<sceneId>` can boot directly into a Phaser scene
for fast iteration. Current useful targets include `hobbies`, `basement`,
`potassium`, `ridge`, and `stampedeSketch`.

## Transition Owners

- `src/game/bridge/store.ts` owns observable cross-boundary state and actions:
  `enterScene`, `returnToOverworld`, `openOverlay`, and `closeOverlay`.
  `openOverlay(overlayId, options)` can carry overlay params and return-scene
  intent from Phaser scenes to React overlays.
- `src/game/sceneLifecycle/SceneLifecycleController.ts` maps bridge scene changes to
  `SceneManager` transitions and maps pause changes to active Phaser scenes.
- `src/game/overlays/OverlayHost.tsx` renders React overlays from the active
  overlay id.
- `src/game/sceneUi/SceneUiHost.tsx` renders scene-owned React UI from bridge
  `sceneUi` state. Status surfaces can live in the shell footer, while panel
  surfaces sit above the game card without being clipped by the Phaser frame;
  the owning scene gates gameplay and consumes UI actions.
- `src/game/shell/sceneHeaderChrome.ts` maps presentation scenes to shell-owned
  header controls. Stampede returns to Ridge from the header Back button;
  Potassium returns to the City/Overworld.
- `src/game/shell/notebookShellProfile.ts` maps selected presentation scenes to
  Notebook Shell runtime profiles. Potassium uses the `ruledBoardPage` focus
  profile, and Stampede uses the `survivalPage` focus profile.
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
   Interact with the Stampede prop to open its Trail Card, confirm `Enter`
   starts Stampede Sketch, confirm the Stampede Notebook shell renders, drag
   from outside the visible page to move, and return to Ridge. Telegraph and
   Domino cards should still keep primary entry disabled.
7. Open inventory from the overworld and from a child scene.
8. In Potassium, confirm the Notebook shell renders with Back and Static Mode,
   then drag/release from outside the visible board area and confirm launch or
   recall still works. Clear or dev-skip a wave and confirm the upgrade-choice
   panel is a React scene UI panel above the notebook stage; choose an upgrade
   and confirm play continues. Confirm terminal Retry/Return actions work from
   the React panel.
9. Verify mobile touch movement, jump, and interact one-shots.
