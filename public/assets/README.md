# Asset Staging

This directory mixes several asset states on purpose, but they should stay
clearly separated.

## Asset States

### Design Direction

Visual style and prompt guidance live under `docs/design/**` and
`docs/game-design/**`. Those docs do not make an asset runtime-ready by
themselves.

### Raw Generated Concepts

Use these as preserved source ideation only. They are not loaded directly by
the game runtime, and they live outside `public` so Vite does not copy them into
production builds.

Example:

- `asset-sources/stampede-sketch/generated-concepts/`

### Prepared Runtime Candidates

These are transparent, normalized, scene-specific assets with manifests or
readmes describing their intended runtime contract.

Examples:

- `public/assets/characters/cicka/`
- `public/assets/potassium-slip/**`
- `public/assets/stampede-sketch/enemies/**`
- `public/assets/stampede-sketch/player-guardian/`
- `public/assets/stampede-sketch/calm-patch/`

Prepared does not automatically mean "currently loaded by Phaser."

For Stampede Sketch, `player-guardian` and `calm-patch` are designed as a pair:
the blanket stays separate in the arena, while the player only carries a small
tether/charm/pencil read that explains why nearby enemies focus on them.

### Runtime-Wired Assets

These are the assets active scene code actually preloads and depends on. Adopt
prepared candidates one scene at a time rather than through a repo-wide art
switch.

## Folder Expectations

Prepared asset folders should answer:

1. who owns this asset family
2. whether it is concept, prepared, or runtime-wired
3. which manifest/readme defines frame sizing and usage
4. whether the current runtime loads it

If that information is missing, add a small folder-local `README.md`.
