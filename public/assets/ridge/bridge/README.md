# Bridge Ridge Assets

Owner: `src/game/scenes/ridge/**`

Current Bridge runtime art is **procedural stick-figure drawing** in
`src/game/scenes/ridge/art/stick/`. It does not load PNGs from this folder.

Legacy PNG folders under `modular/` and `layered-reset/` are kept only as
historical reference. Do not wire them back without a VisualProvider that
intentionally replaces the stick provider.

## Replace With Hand-Drawn Art Later

1. Implement a new `RidgeVisualProvider` (for example sprite-backed).
2. Keep `src/game/core/ridge/` unchanged.
3. Point `RidgeScene` at the new provider.
4. Normalize frame sizes/pivots through the sketchbook sprite pipeline skill.
