# Stampede Sketch Enemy Sprites

Transparent, normalized enemy sprites prepared from generated concept sheets.
These assets are not loaded by the runtime yet.

Each enemy folder contains:

- `source-keyed.png` - original green-screen sheet copied from generated concepts
- `source.png` - transparent full source sheet
- `source-frames/` - larger transparent crops from the generated sheet
- `frames/` - normalized runtime frames
- `<slug>-spritesheet.png` - horizontal Phaser spritesheet
- `minimal-frames/` - one clean high-count gameplay frame
- `<slug>-minimal-spritesheet.png` - safest default for large swarms
- `body-frames/` - cleaner four-frame body animation
- `<slug>-body-spritesheet.png` - normal enemy body animation
- `fx-frames/` - noisy hit, clear, surge, and respawn effects
- `<slug>-fx-spritesheet.png` - optional transient effect animation
- `<slug>-debug-contact.png` - frame boundary and name QA sheet
- `manifest.json` - frame contract and suggested body metadata
- `runtime-manifest.json` - recommended minimal/body/fx runtime split

Runtime contract:

- `frameWidth`: `192`
- `frameHeight`: `192`
- `origin`: `{ "x": 0.5, "y": 0.5 }`
- `runtimeScale`: `0.32`

Recommended use:

1. Use `<slug>-minimal-spritesheet.png` for high-count swarm rendering.
2. Add life with Phaser tweens: wobble, scale pulse, slight rotation, alpha.
3. Use `<slug>-body-spritesheet.png` only when a closer animated body read is
   worth the extra visual noise.
4. Spawn `<slug>-fx-spritesheet.png` as a short-lived overlay for hit, clear,
   pressure, and respawn moments.

Example Phaser preload:

```ts
this.load.spritesheet(
  'stampede-enemy-current-swarm-dot',
  '/assets/stampede-sketch/enemies/current-swarm-dot/current-swarm-dot-minimal-spritesheet.png',
  { frameWidth: 192, frameHeight: 192 }
);
```

Use each folder's `manifest.json` for state names and suggested Arcade Physics
circle bodies. Tune contact radii in-game before replacing the current
placeholder circles.
