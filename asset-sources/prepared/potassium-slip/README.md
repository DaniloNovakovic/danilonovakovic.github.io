# Potassium Slip Sprite Assets

Transparent, normalized sprite assets prepared for Phaser. These assets are not
wired into the runtime yet.

## Runtime Manifest

Use `runtime-manifest.json` as the Phaser-facing integration draft. It lists
texture keys, `publicUrlAfterPromotion` values, frame sizes, frame counts, state
names, suggested animations, and hitbox compatibility notes.

## Enemy Loading

Enemy spritesheets are sized to match the current procedural texture boxes. They
can be loaded under the existing Potassium texture keys after the chosen files
are promoted to `public/assets/potassium-slip/**` and before
`PotassiumSlipRenderer.ensureTextures()` runs:

```ts
this.load.spritesheet(
  'potassium_enemy_intern',
  '/assets/potassium-slip/enemies/intern-bug/intern-bug-spritesheet.png',
  { frameWidth: 48, frameHeight: 46 }
);
```

Because frame `0` is the neutral pose, existing `this.physics.add.sprite(...)`
calls can keep using the same texture keys. State animations are optional runtime
work and are described in each enemy folder's `runtime-manifest.json`.

## Banana Loading

For a minimal drop-in pass, promote the chosen files and load image replacements
for the existing keys:

```ts
this.load.image(
  'banana_peel_yellow',
  '/assets/potassium-slip/banana/projectile/frames/00-yellow-base.png'
);
this.load.image(
  'banana_peel_green',
  '/assets/potassium-slip/banana/projectile/frames/02-poison-green.png'
);
this.load.image(
  'potassium_fire',
  '/assets/potassium-slip/banana/fire-patches/frames/01-medium.png'
);
```

For richer upgrade visuals, load the composable spritesheets:

```ts
this.load.spritesheet(
  'potassium_banana_projectile',
  '/assets/potassium-slip/banana/projectile/banana-projectile-spritesheet.png',
  { frameWidth: 64, frameHeight: 64 }
);
this.load.spritesheet(
  'potassium_banana_overlays',
  '/assets/potassium-slip/banana/overlays/banana-overlays-spritesheet.png',
  { frameWidth: 96, frameHeight: 96 }
);
this.load.spritesheet(
  'potassium_fire_patches',
  '/assets/potassium-slip/banana/fire-patches/banana-fire-patches-spritesheet.png',
  { frameWidth: 60, frameHeight: 36 }
);
```

Keep the current Arcade Physics bodies when swapping textures first; tune bodies
only after seeing the assets in motion.
