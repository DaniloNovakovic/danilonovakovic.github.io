# Stampede Player Guardian

Prepared runtime candidate for the Stampede Sketch player avatar.

This asset is not loaded by Phaser yet. It is a scene-specific top-down /
three-quarter version of the Ridge player for the Stampede arena.

Runtime contract:

- `frameWidth`: `192`
- `frameHeight`: `192`
- `frameCount`: `10`
- `origin`: `{ "x": 0.5, "y": 0.5 }`
- `runtimeScale`: `0.48`

Use `manifest.json` for frame names, animations, and suggested Arcade Physics
circle body metadata. The earlier `move-up-1` and `move-side-1` frames were
removed in favor of the stronger `move-up` and `move-side` poses.

Example Phaser preload:

```ts
this.load.spritesheet(
  'stampede-player-guardian',
  '/assets/stampede-sketch/player-guardian/player-guardian-spritesheet.png',
  { frameWidth: 192, frameHeight: 192 }
);
```

The player is holding a pencil and a tiny blanket string/charm. The pencil
should read consistently as sharpened point up, eraser down. The full calm
patch remains a separate center/near-center `calm-patch` prop so the protected
object does not become visually ambiguous.

Frame `8` is named `tether-guard`, not `blanket-held`, because the player is
linked to the calm patch rather than carrying the whole blanket.
