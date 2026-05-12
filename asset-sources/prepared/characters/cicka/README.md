# Cicka Prototype Sprite Kit

Prepared Cicka prototype sprites for Ridge exploration and small interaction
beats.

Current state:

- this folder is a **prepared runtime candidate**
- it is not automatically the canonical runtime source unless Ridge explicitly
  preloads it
- it exists to support a small Cicka adoption slice without requiring final art

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
