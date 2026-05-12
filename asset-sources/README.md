# Asset Sources

This directory stores generated art that should stay in the repository but
should not be copied into the production Vite build.

## Raw Concepts

Raw generated sheets and ideation live in scene-owned folders such as
`asset-sources/stampede-sketch/generated-concepts/`.

## Prepared Candidates

Transparent, normalized, Phaser-ready candidates live under
`asset-sources/prepared/**` until a runtime integration slice actually loads
them.

Use `public/assets/**` only for runtime-wired assets that are intentionally
browser-addressable and deployed.
