# Cicka Prototype Source

Transparent source sheet for the Cicka Ridge runtime sprite proof.

Current state:

- this folder is the **minimal retained source** for the first Ridge runtime
  Cicka adoption slice
- `public/assets/ridge/cicka/` contains the promoted runtime copy that Ridge
  explicitly preloads
- duplicate runtime outputs, chroma-key source, intermediate source crops, and
  normalized frame PNGs were pruned after promotion
- use `public/assets/ridge/cicka/manifest.json` for the loaded spritesheet,
  frame contract, and QA sheet
- the art is approved only for a small display-only NPC/perch read; it is not a
  proven full locomotion, collision, or pet-system asset set

Contents:

- `source.png` - transparent original source sheet retained only for short-term
  regeneration, comparison, and animation review

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

The promoted runtime spritesheet passes the sprite-pipeline audit:

- all frames are `128x96` RGBA PNGs
- all frame centers stay within `63.5-64.5`
- all bottom padding is `10px`
- the promoted horizontal spritesheet is `1536x96`

The asset is visually detailed because of the hatching, so future use should
continue through small review gates. Prefer perch/idle/notice poses first; treat
walk, hop, and sleep as candidates until they are reviewed in motion inside the
actual Ridge camera.

Deletion trigger: delete this source folder when Cicka is accepted as final
enough for the Ridge proof or when a replacement Cicka sheet is generated and
adopted.
