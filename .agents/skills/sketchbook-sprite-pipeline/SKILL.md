---
name: sketchbook-sprite-pipeline
description: Generate, convert, normalize, and QA transparent sprite assets for Sketchbook Ridge Phaser scenes. Use when creating player/NPC/enemy/prop sprites, equipment variants, converting images into Phaser assets, slicing sheets, removing chroma-key backgrounds, or auditing sprite consistency.
---

# Sketchbook Sprite Pipeline

Turn generated art into Phaser-ready sprites: normalized frames, manifests, and
QA artifacts — not just "looks good."

Folder trees, gitignore policy, manifest fields, and promotion rules:
[`references/asset-layout.md`](references/asset-layout.md).

AI art adoption / approval gates:
[`references/sprite-generation-system.md`](references/sprite-generation-system.md).

## Style Lock

Read `docs/design/style-guide.md` before prompting or editing. For
Ridge/Basement characters prefer:

- monochrome black ink + cream fill, hatching instead of color
- Open Peeps-ish simple silhouettes, side-view profile for movement
- generous padding in source sheets; no text/grid/scenery in sprite cells
- transparent final PNGs; keep keyed/source files for rework

Scene-specific art may bend the style only when that scene already does (e.g.
Potassium Slip arcade color).

## New Sprite Workflow

1. Choose asset class: `player` | `playerVariant` | `npc` | `enemy` | `prop` |
   `pickup`.
2. Lock a frame contract before generation: frame names, grid, facing,
   baseline/origin, expected runtime size, output folder.
3. Generate on flat `#ff00ff` chroma-key unless already transparent. Prompt:
   no shadows, labels, grid, or scenery; consistent baseline; generous padding;
   one asset family only. Generate props/perches separately unless the contract
   bakes them into every pose.
4. Land exploratory source in `asset-sources/inbox/` and/or the external archive
   from `asset-sources/settings.local.json` — never only in a tool image cache.
   Selected candidates go to `asset-sources/prepared/**` (see asset-layout).
5. Remove chroma key:

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

6. Slice into `source-frames/` (may be large/uneven).
7. Normalize into runtime `frames/`: identical dimensions, stable center/foot
   anchor, predictable bottom padding, no origin drift.
8. Build runtime spritesheet from `frames/`.
9. Write `manifest.json` (fields in asset-layout).
10. Generate/update debug/contact sheet (boundaries, names, hitbox assumptions).
11. Validate alpha, dimensions, bbox drift, spritesheet size, and manifest
    consistency.
12. Keep the prepared bundle under
    `asset-sources/prepared/<scene-or-domain>/<slug>/` until code loads it.
13. Promote to `public/assets/<scene-or-domain>/<slug>/` as part of the runtime
    integration slice (adoption rules in asset-layout).

Completion: contract locked, QA audit clean, prepared path or public promotion
matches asset-layout rules.

## Existing Image Conversion

When Danilo already likes a generated image:

1. Preserve original as `source.png` or `source-keyed.png`.
2. Remove background; if matte is messy, isolate or regenerate matte/source —
   not the design.
3. Split poses/subjects into `source-frames/`.
4. Normalize to runtime cells:
   - fixed `frameWidth` / `frameHeight`
   - common `origin` — usually `{ "x": 0.5, "y": 1 }` grounded, or
     `{ "x": 0.5, "y": 0.5 }` floating
   - stable foot line (walkers) or center (floating/arcade)
   - consistent `runtimeScale`
5. One great still → static prop/NPC first; invent animation frames only when
   needed.

## QA

```bash
python3 .agents/skills/sketchbook-sprite-pipeline/scripts/audit_frames.py \
  <frame-dir> \
  --manifest <manifest.json> \
  --spritesheet <spritesheet.png>
```

After promotion, when individual frame PNGs are pruned, audit the horizontal
sheet directly:

```bash
python3 .agents/skills/sketchbook-sprite-pipeline/scripts/audit_frames.py \
  --manifest <manifest.json> \
  --spritesheet <spritesheet.png>
```

Check:

- runtime frames are RGBA PNGs with identical dimensions
- grounded bottom padding changes only intentionally; anchor drift is small
- source frames kept for cleanup until promotion
- horizontal sheet size = `frameWidth * frameCount` by `frameHeight`
- manifest matches files on disk

Attractive art that fails QA stays as source and gets re-normalized — taste
survives a bad first export.
