# Cicka Ridge Runtime Assets

Owner: `src/game/scenes/ridge/**`

Runtime loader: `src/game/scenes/ridge/cickaAssets.ts`

Promoted from: `asset-sources/prepared/characters/cicka/`

## Current Use

Ridge loads `cicka-spritesheet.png` as a display-only NPC/perch sprite. Cicka
does not use a Phaser physics body in this slice; the existing Ridge
interaction target remains the gameplay affordance.

## Frame Contract

- frame size: `128x96`
- frame count: `12`
- origin: `{ "x": 0.5, "y": 1 }`
- runtime scale: `0.58`
- initial animations: perch idle and notice

`manifest.json` is the runtime-facing contract and points back to the prepared
source bundle. `cicka-debug-contact.png` is retained here as the promoted
runtime QA sheet because this is the first AI sprite adoption slice.
