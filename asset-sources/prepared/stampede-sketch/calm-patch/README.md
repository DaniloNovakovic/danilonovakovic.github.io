# Stampede Calm Patch

Prepared runtime candidate for the Stampede Sketch protected picnic blanket /
calm patch.

This asset is not loaded by Phaser yet. It should stay visually sparse so the
arena remains readable when enemies are on screen.

Runtime contract:

- `frameWidth`: `256`
- `frameHeight`: `192`
- `frameCount`: `8`
- `origin`: `{ "x": 0.5, "y": 0.5 }`
- `runtimeScale`: `0.72`

Use `manifest.json` for frame names and suggested animation groups.

Example Phaser preload after promoting this folder into
`public/assets/stampede-sketch/calm-patch/`:

```ts
this.load.spritesheet(
  'stampede-calm-patch',
  '/assets/stampede-sketch/calm-patch/calm-patch-spritesheet.png',
  { frameWidth: 256, frameHeight: 192 }
);
```

Recommended use:

- show `arena-anchor` or `idle-calm` during normal play
- switch to `crowded-edge` / `corner-smudge` for pressure feedback
- switch to `calm-restored` / `clear-ready` after relief or clear moments

Gameplay intent:

- place this as the central or near-central objective
- enemies near the player chase the player for the survivor-game feel
- enemies farther from the player may drift toward the calm patch
- the player protects it by returning to the patch and re-taking attention
