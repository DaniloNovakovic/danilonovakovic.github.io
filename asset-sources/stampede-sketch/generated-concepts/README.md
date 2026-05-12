# Stampede Sketch Generated Concepts

Generated source sheets for Stampede Sketch enemy, weapon, upgrade, pickup, and
reward art exploration.

These files are intentionally parked under `asset-sources/**` as raw generated
PNGs. They are not loaded by the game runtime and should not be moved into
`asset-sources/prepared/**` until a prepared runtime asset pass needs them
there.

Before using them in Phaser, run an asset-prep pass:

- remove the green chroma-key background or export transparent PNGs
- slice sheets into frames or build a texture atlas
- normalize scale and anchor points per enemy/weapon type
- add runtime preload keys and presentation code

Original generated images remain under the Codex generated image cache.
