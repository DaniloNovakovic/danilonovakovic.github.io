# Cicka Ridge Assets

Owner: `src/game/scenes/ridge/**`

Current Bridge runtime draws Cicka as a stick figure via
`src/game/scenes/ridge/art/stick/`. PNG sheets in this folder are historical
reference only and are not loaded by the stick provider.

When hand-drawn Cicka art returns, implement a sprite-backed
`RidgeVisualProvider` and keep `src/game/core/ridge/` unchanged.

## Legacy Frame Contract (reference)

- frame size: `128x96`
- frame count: `12`
- origin: `{ "x": 0.5, "y": 1 }`
- former runtime scale: `0.58`
