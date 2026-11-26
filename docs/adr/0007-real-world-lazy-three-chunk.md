# Real World: A Lazy Three.js Chunk Beside Phaser

Status: accepted (2026-11-26, #145).

Out of Bounds Acts 4–5 happen in the **real world**: first-person low-poly 3D
(see [`out-of-bounds.md`](../game-design/secrets/out-of-bounds.md), Act 4). The
#144/#145 prototype (branch `prototype/ob-ship-3d`) showed that Three.js runs
the look (ink lines over flat colour) on desktop and on a real phone.

## Decision

1. **Three.js is a dependency, but only inside a lazy chunk.** `three` is pinned
   in `package.json`. Only `src/game/realWorld/**` imports it, and the shell
   reaches that folder through a single dynamic `import()` behind the **Wake up**
   click. Nobody who doesn't reach the black screen downloads it (~150 KB gzip
   for r187 with the adapter and the lab).
2. **The real world is a takeover, not a scene.** It isn't in `sceneIds` or the
   `sceneRegistry`, and it doesn't go through the scene lifecycle. The shell
   mounts `RealWorldTakeover` over the whole viewport once the page has fallen
   into black and the player clicks Wake up. The Phaser game stays mounted
   underneath, paused, and is never shown again until a reload.
3. **No new store.** Whether the player is awake lives in shell-local React
   state, so a reload resets it (the doc's "reload is the only reset"). Progress
   inside the real world stays in the takeover until a milestone needs to
   persist it; then it goes through `bridge/store.ts`, never a second store.
4. **Pure rules live in `src/game/core/realWorld/`.** Maps, collision, and later
   stealth visibility and alien behaviour are plain TypeScript, testable without
   WebGL, with no Three.js types. `src/game/realWorld/` is the Three.js adapter:
   it renders the core's state and feeds it input.
5. **One boot function owns the GPU.** `bootRealWorld(host, callbacks)` creates
   the renderer, the ink pass and the input listeners, and returns `dispose()`,
   which removes every listener and frees the WebGL context. The takeover calls
   it on unmount.
6. **Browser rules.** The Wake up click is the user gesture for fullscreen
   (best effort; on iPhone the takeover just fills the viewport) and pointer
   lock. Losing pointer lock or pressing `Esc` pauses behind a "click to keep
   going" card. Touch gets a left-half move stick and right-half drag to look.
   No WebGL, or a failed chunk load, shows a plain message instead of a broken
   canvas.

## Rejected

- **A Phaser / canvas raycaster.** Kept as the fallback in #140. The prototype
  showed it isn't needed, and it can't draw the ink pass.
- **Loading Three.js from a CDN.** Fine for the throwaway, but production pins
  the version in the lockfile and serves it from our own build.
- **A generic renderer adapter** shared by Phaser and Three.js. There is only
  one 3D adapter: the deletion test says no.

## Consequences

- The main bundle is unchanged. Check the build output for a separate
  `realWorld` chunk when changing imports in the shell.
- The shell has two full-viewport surfaces at the end of Out of Bounds: the
  black screen, then the takeover.
- Tests cover the core rules and the takeover's mount and teardown with the
  boot function mocked; WebGL itself is checked by hand on desktop and phone.
