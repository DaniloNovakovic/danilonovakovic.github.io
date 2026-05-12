# Asset Readiness Triage

Date: 2026-05-12

This note records the current producer/art/engineering read on
`asset-sources/**`. It is a staging decision, not an integration plan and not a
promise that every candidate ships.

## Phase Name

Call this phase **Asset Readiness Triage**.

The goal is to answer:

- what should stay as source material
- what is ready enough for a small adoption slice
- what should be deferred
- what cleanup is safe without losing future options

## Current Inventory

- `asset-sources`: about 105 MB
- PNG files: 575
- `asset-sources/stampede-sketch/generated-concepts`: about 20 MB
- `asset-sources/prepared`: about 86 MB
- `asset-sources/prepared/stampede-sketch`: about 32 MB
- `asset-sources/prepared/potassium-slip`: about 42 MB
- `asset-sources/prepared/characters`: about 12 MB

This is not currently a deployment concern because source and prepared
candidates stay outside `public/assets/**`.

## Producer Decision

Keep the current asset families. Do not do broad taste-based deletion now.

The repo is large enough that cleanup discipline is useful, but not large enough
to justify removing staged art before the team has used it for comparison,
regeneration, or a scene-owned adoption slice.

The only near-term cleanup candidate is exact duplicate source baggage where
manifests and readmes can be updated without weakening the source contract.

## Triage Table

| Asset area | Readiness | Decision | Notes |
| --- | --- | --- | --- |
| `stampede-sketch/generated-concepts/` | Raw concept source | Keep | Useful source and comparison material. Do not load directly in runtime. |
| `prepared/characters/cicka/` | Prepared candidate | Keep; good next adoption candidate | Strong milestone fit for Ridge warmth. Frames are normalized and documented. |
| `prepared/characters/sketchbook-player/` | Prepared candidate | Keep; defer adoption | Useful Ridge character source, but not the immediate asset risk. |
| `prepared/characters/sketchbook-player-glasses/` | Prepared candidate | Keep; defer adoption | Variant source. Keep until player presentation direction is settled. |
| `prepared/characters/sketchbook-npcs/` | Prepared candidate | Keep; defer adoption | Useful NPC seed material. Needs scene-specific selection before runtime use. |
| `prepared/stampede-sketch/calm-patch/` | Prepared candidate | Keep; high priority for Stampede slice | Good objective prop. Should remain sparse and readable in arena. |
| `prepared/stampede-sketch/player-guardian/` | Prepared candidate | Keep; high priority for Stampede slice | Good top-down/three-quarter player read for the arena. |
| `prepared/stampede-sketch/enemies/` | Prepared candidate set | Keep; adopt one family first | Minimal/body/fx split is useful. Avoid adopting every enemy family at once. |
| `prepared/potassium-slip/banana/**` | Prepared candidate set | Keep; defer to Potassium visual pass | Good upgrade/projectile material. Potassium is not the current first-fun risk. |
| `prepared/potassium-slip/enemies/**` | Prepared candidate set | Keep; defer to Potassium visual pass | Valid replacements for procedural textures, but should be adopted enemy-by-enemy. |

## Recommended Specialist Read

- Mira: keep this bounded to readiness, not production art overhaul.
- Rade: review silhouettes and style fit before each adoption slice.
- Vuk: check whether each asset supports the current gameplay loop.
- Zoran: own duplicate cleanup and manifest safety.
- Milena: review Cicka and NPC assets before Ridge character adoption.

Do not bring in the whole team at once. Four specialist reads are enough for
this phase.

## Cleanup Candidates

Exact duplicates were detected in 46 PNG groups. The theoretical current-tree
savings from keeping only one copy per exact duplicate group is about 25.6 MB.

The biggest duplicate groups are:

| Duplicate pattern | Suggested action |
| --- | --- |
| Potassium enemy `source-keyed.png` byte-identical to `source.png` | Keep `source.png`; remove or stop requiring redundant `source-keyed.png` only after manifests/readmes are updated. |
| Stampede generated concept sheet byte-identical to prepared `source-keyed.png` | Keep the raw generated concept as canonical source; either keep prepared `source-keyed.png` for local folder completeness or replace its contract with a reference to the raw concept. |
| Stampede minimal spritesheets byte-identical to single minimal frames | Usually too small to matter. Only remove if a runtime manifest can point at one canonical file without confusion. |
| Some `frames/` files byte-identical to `fx-frames/` files | Do not remove yet; these folders express different runtime roles even when the pixels match. |

Do not rewrite Git history for this cleanup. Deleting duplicates later reduces
the current checkout and future tree weight, but old blobs remain in repository
history unless history is rewritten. A history rewrite is not worth it for this
repo size.

## Asset Size Policy

Use these practical thresholds for normal Git:

- target individual PNGs under 1-2 MB when possible
- 2-5 MB is acceptable for source/concept art
- pause and justify files above 5 MB
- avoid normal Git for files above 10-25 MB unless they are important and stable
- keep videos, layered source files, large generated batches, and frequently
  regenerated exports out of normal Git unless there is a strong reason

For this repo, start a cleanup discussion if `asset-sources/**` passes about
250 MB. Treat 500 MB as a hard producer checkpoint before adding more staged
art.

## Next Slice

Recommended next issue/task:

1. Keep this triage note as the source of truth for asset readiness.
2. Optionally run a small duplicate cleanup branch limited to source duplicates.
3. After cleanup, pick one adoption slice: Cicka in Ridge or Stampede
   calm-patch/player-guardian.

Acceptance criteria for duplicate cleanup:

- no runtime files are touched
- no `public/assets/**` files are introduced
- manifests/readmes do not reference missing files
- `asset-sources` folder contracts still answer raw vs prepared vs runtime
- the diff is easy to review without judging art taste
