---
name: sketchbook-sprite-pipeline
description: Generate, convert, normalize, and QA transparent sprite assets for Sketchbook Ridge Phaser scenes. Use when creating player/NPC/enemy/prop sprites, making glasses or equipment variants, converting generated images into Phaser-usable assets, slicing sprite sheets, removing chroma-key backgrounds, or auditing sprite consistency.
---

# Sketchbook Sprite Pipeline

Turn pretty generated art into Phaser-ready sprites. Do not stop at "looks good"; produce normalized frames, manifests, and QA artifacts.

## Style Lock

Before prompting or editing, read `docs/design/style-guide.md`. For Ridge/Basement characters prefer:

- monochrome black ink + cream fill, hatching instead of color
- Open Peeps-ish simple silhouettes, side-view profile for movement
- generous padding in source sheets, no text/grid/scenery in sprite cells
- transparent final PNGs; keep keyed/source files for rework

Scene-specific art can bend the style only when the scene already does, such as Potassium Slip's more colorful arcade assets.

## New Sprite Workflow

1. Choose the asset class: `player`, `playerVariant`, `npc`, `enemy`, `prop`, or `pickup`.
2. Define a fixed frame contract before generation: frame names, grid layout, facing direction, baseline/origin, expected runtime size, and output folder.
3. Generate source art on a flat `#ff00ff` chroma-key background unless the image is already transparent. Prompt: no shadows, no labels, no grid lines, no scenery, consistent baseline, generous padding.
4. Copy the keyed source into the project. Never leave a project asset only under `$CODEX_HOME/generated_images`.
5. Remove chroma key with the system imagegen helper:

   ```bash
   python3 /Users/TestUser/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py \
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
11. Validate alpha, dimensions, bbox drift, and manifest consistency before finishing.

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

Prefer this structure for production assets:

```text
public/assets/<scene-or-domain>/<slug>/
├── source-keyed.png            # if chroma-keyed
├── source.png                  # transparent source sheet or still
├── source-frames/*.png         # larger rough transparent crops
├── frames/*.png                # normalized runtime frames
├── <slug>-spritesheet.png
├── <slug>-debug-contact.png
└── manifest.json
```

For quick concept assets under `public/assets/characters`, existing flat folders are acceptable, but production integration should migrate to the structure above.

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
python3 .agents/skills/sketchbook-sprite-pipeline/scripts/audit_frames.py <frame-dir>
```

Check:

- all runtime frames are RGBA PNGs
- runtime frames share identical dimensions
- grounded animation bottom padding changes only intentionally
- center/foot anchor drift is small
- source frames are preserved for manual cleanup
- spritesheet dimensions equal `frameWidth * frameCount` by `frameHeight` for horizontal sheets
- manifest matches files on disk

If the art is attractive but fails QA, keep it as source art and normalize from it. Do not discard good taste because the first export is not game-ready.
