# Cicka Prototype Sprite Kit

Prepared Cicka prototype sprites for Ridge exploration and small interaction
beats.

Current state:

- this folder is the **prepared source bundle** for the first Ridge runtime
  Cicka adoption slice
- `public/assets/ridge/cicka/` contains the promoted runtime copy that Ridge
  explicitly preloads
- the art is approved only for a small display-only NPC/perch read; it is not a
  proven full locomotion, collision, or pet-system asset set

Contents:

- `source-keyed.png` - keyed generated source sheet
- `source.png` - transparent source sheet
- `source-frames/` - larger source crops
- `frames/` - normalized runtime candidate frames
- `cicka-spritesheet.png` - combined horizontal spritesheet
- `cicka-debug-contact.png` - frame boundary QA sheet
- `manifest.json` - frame contract and intended states

Intended first-use reads:

- perch sit
- perch blink
- loaf/content
- suspicious turn
- tail alert / tail point / tail question
- tiny hop
- stretch

If Ridge adopts this kit, keep the first slice small and warmth-focused. Do not
block on full navigation behavior or a large pet-system interpretation.

## First Runtime Audit

The runtime frames pass the sprite-pipeline audit:

- all frames are `128x96` RGBA PNGs
- all frame centers stay within `63.5-64.5`
- all bottom padding is `10px`
- the horizontal spritesheet is `1536x96`

The asset is visually detailed because of the hatching, so future use should
continue through small review gates. Prefer perch/idle/notice poses first; treat
walk, hop, and sleep as candidates until they are reviewed in motion inside the
actual Ridge camera.
