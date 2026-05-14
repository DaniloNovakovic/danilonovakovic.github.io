# Asset Sources

This directory stores generated art that should stay in the repository but
should not be copied into the production Vite build.

See [`asset-readiness-triage.md`](asset-readiness-triage.md) for the current
keep/defer/cleanup read on the staged PNGs.

## Raw Concepts

Raw generated sheets and ideation live in scene-owned folders such as
`asset-sources/stampede-sketch/generated-concepts/`.

## Prepared Candidates

Transparent, normalized, Phaser-ready candidates live under
`asset-sources/prepared/**` until a runtime integration slice actually loads
them.

Use `public/assets/**` only for runtime-wired assets that are intentionally
browser-addressable and deployed.

## Retention States

Every asset folder should make its current state obvious in a README or
manifest:

- **raw concept** - source ideation only; keep while it can guide comparison,
  regeneration, or taste review.
- **prepared candidate** - normalized but not loaded; keep until accepted,
  rejected, or superseded by a better candidate.
- **promoted runtime source** - runtime-loaded outputs live in
  `public/assets/**`; keep only the source/rework files needed to regenerate or
  inspect the asset, and delete duplicate runtime outputs from `asset-sources`.
- **rejected or superseded** - delete unless the rejection itself is durable
  provenance that cannot be captured in a short note.

Deletion is expected when an asset is an exact duplicate of a runtime-owned
file, when a prepared candidate has been superseded by a named replacement, or
when a raw concept no longer informs active taste or generation decisions.
Avoid keeping files only because they "might be useful someday"; if that is the
only reason, replace the folder with a short note or delete it.
