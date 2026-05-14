---
name: sketchbook-sprite-pipeline
description: Generate, convert, normalize, and QA transparent sprite assets for Sketchbook Ridge Phaser scenes. Use when creating player/NPC/enemy/prop sprites, making glasses or equipment variants, converting generated images into Phaser-usable assets, slicing sprite sheets, removing chroma-key backgrounds, or auditing sprite consistency.
---

# Sketchbook Sprite Pipeline

Turn pretty generated art into Phaser-ready sprites. Do not stop at "looks good"; produce normalized frames, manifests, and QA artifacts.

## Path Conventions

All project paths in this skill are repository-relative. When running commands
manually, run them from the repository root or prefix paths with your checkout
path. The workflow should not depend on a Codex-specific home directory.

## Style Lock

Before prompting or editing, read `docs/design/style-guide.md`. For Ridge/Basement characters prefer:

- monochrome black ink + cream fill, hatching instead of color
- Open Peeps-ish simple silhouettes, side-view profile for movement
- generous padding in source sheets, no text/grid/scenery in sprite cells
- transparent final PNGs; keep keyed/source files for rework

Scene-specific art can bend the style only when the scene already does, such as Potassium Slip's more colorful arcade assets.

For first-time AI art adoption, generated asset review, approval gates, or
pipeline design, also read
`references/sprite-generation-system.md`.

## New Sprite Workflow

1. Choose the asset class: `player`, `playerVariant`, `npc`, `enemy`, `prop`, or `pickup`.
2. Define a fixed frame contract before generation: frame names, grid layout, facing direction, baseline/origin, expected runtime size, and output folder.
3. Generate source art on a flat `#ff00ff` chroma-key background unless the image is already transparent. Prompt: no shadows, no labels, no grid lines, no scenery, consistent baseline, generous padding, one asset family only. Generate props/perches separately unless the frame contract explicitly says they are baked into every pose.
4. Put exploratory or not-yet-adopted source in the gitignored
   `asset-sources/inbox/` and/or the external archive recorded in
   `asset-sources/settings.local.json`. Never leave a project asset only in a
   tool-specific generated-image cache. Once selected as a project candidate,
   keep it in `asset-sources/prepared/**` locally or record a stable external
   source pointer in the adopting asset's tracked README/manifest.
5. Remove chroma key with the project helper:

   ```bash
   python3 .agents/skills/sketchbook-sprite-pipeline/scripts/remove_chroma_key.py \
     --input <source-keyed.png> \
     --out <transparent-source.png> \
     --auto-key border \
     --soft-matte \
     --transparent-threshold 12 \
     --opaque-threshold 220 \
     --despill
   ```

6. Slice into `source-frames/` first. These may be large and uneven.
7. Normalize into runtime `frames/`: same dimensions, stable center/foot anchor, predictable bottom padding, no frame-to-frame origin drift.
8. Build a runtime spritesheet from `frames/`.
9. Write `manifest.json`.
10. Generate or update a debug/contact sheet showing frame boundaries, names, and any body/hitbox assumptions.
11. Validate alpha, dimensions, bbox drift, spritesheet dimensions, and manifest consistency before finishing.
12. Keep the prepared runtime bundle in the external archive and local ignored
    mirror at `asset-sources/prepared/<scene-or-domain>/<slug>/` until scene
    code actually loads it.
13. Promote the loaded bundle into `public/assets/<scene-or-domain>/<slug>/` as part of the runtime integration slice.

## Existing Image Conversion

Use this when Danilo already likes a generated image.

1. Preserve the original as `source.png` or `source-keyed.png`.
2. If it has a background, remove it; if removal is messy, isolate the subject manually or regenerate only the matte/source, not the design.
3. Split the image into poses/subjects. Put rough crops in `source-frames/`.
4. Normalize each source frame into runtime cells:
   - fixed `frameWidth` / `frameHeight`
   - common `origin`, usually `{ "x": 0.5, "y": 1 }` for grounded characters or `{ "x": 0.5, "y": 0.5 }` for floating enemies
   - stable foot line for walkers
   - stable center for floating/arcade enemies
   - consistent runtime scale
5. For one great still image, extract it as a static prop/NPC first. Only invent extra animation frames if needed.

## Output Shape

Keep raw generated concepts and bulky source ideation outside Vite's deployable
`public` tree. For private experimental intake, use:

```text
asset-sources/
├── settings.local.json
└── inbox/<date-slug>/
    ├── source.png
    ├── prompt.md
    └── notes.md
```

Those paths are gitignored. When a source becomes durable project provenance,
add a stable external source pointer in the adopting folder README/manifest or,
for a short-lived exception, force-add a small curated source file:

```text
asset-sources/<scene-or-domain>/<slug-or-concept-set>/
├── source-keyed.png
├── source.png
└── notes-or-readme.md
```

Prefer this structure for prepared runtime candidates:

```text
asset-sources/prepared/<scene-or-domain>/<slug>/
├── source-keyed.png            # if chroma-keyed
├── source.png                  # transparent source sheet or still
├── source-frames/*.png         # larger rough transparent crops
├── frames/*.png                # normalized runtime frames
├── <slug>-spritesheet.png
├── <slug>-debug-contact.png
└── manifest.json
```

For quick concept assets, use the ignored `asset-sources/inbox/**` workbench.
`public/assets/**` is for assets that are runtime-wired. Existing prepared flat
folders under `asset-sources/prepared/characters` are legacy backlog and should
migrate to external archive or runtime ownership during cleanup.

Prefer external archive storage for large rejected variants, raw AI batches,
layered source files, and prompt experiments. The repo should keep what ships,
what is being actively prepared, and the durable provenance needed to remake or
audit the asset. When both raw generated concepts and prepared candidates exist,
prefer the prepared candidate archive for adoption work and treat the raw
concept archive as reference-only.

## Manifest Minimum

Include:

- `slug`, `source`, `spritesheet`
- `frameWidth`, `frameHeight`, `frameCount`
- `origin`
- `runtimeScale`
- `frames[]` with `state`, `file`, and optional `sourceFile`
- `hitboxCompatibility` or `body` when Phaser physics will use it
- `debugContact`

## QA

Run:

```bash
python3 .agents/skills/sketchbook-sprite-pipeline/scripts/audit_frames.py \
  <frame-dir> \
  --manifest <manifest.json> \
  --spritesheet <spritesheet.png>
```

After runtime promotion, when individual frame PNGs have been pruned, audit the
horizontal runtime sheet directly:

```bash
python3 .agents/skills/sketchbook-sprite-pipeline/scripts/audit_frames.py \
  --manifest <manifest.json> \
  --spritesheet <spritesheet.png>
```

Check:

- all runtime frames are RGBA PNGs
- runtime frames share identical dimensions
- grounded animation bottom padding changes only intentionally
- center/foot anchor drift is small
- source frames are preserved for manual cleanup only until runtime promotion
- spritesheet dimensions equal `frameWidth * frameCount` by `frameHeight` for horizontal sheets
- manifest matches files on disk

If the art is attractive but fails QA, keep it as source art and normalize from it. Do not discard good taste because the first export is not game-ready.

## Adoption Rule

Adopt the smallest runtime proof first. For a character, a display-only idle NPC
is usually safer than a physics actor; for an enemy, one family is safer than a
whole pack; for a prop, one static readable object is safer than an animated set.
Do not promote assets into `public/assets/**` until code preloads them and a
folder-local README explains ownership, source, frame contract, and runtime use.
After promotion, remove duplicate runtime outputs from `asset-sources/**` and
leave a deletion trigger for any source/prepared files that remain in the
external archive or local ignored mirror.
