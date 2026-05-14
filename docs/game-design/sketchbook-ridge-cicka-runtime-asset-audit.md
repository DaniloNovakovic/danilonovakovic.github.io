# Cicka Runtime Asset Audit

> First AI-generated sprite adoption review for Sketchbook Ridge.

Active references:

- `docs/design/style-guide.md`
- `docs/game-design/sketchbook-ridge-asset-staging-plan.md`
- `asset-sources/prepared/characters/cicka/README.md`
- `.agents/skills/sketchbook-sprite-pipeline/SKILL.md`

## Decision

Adopt the prepared Cicka kit as a small Ridge-owned runtime proof of concept:

- use the spritesheet for Cicka's perch presence
- add only tiny idle/notice animation
- keep Cicka display-only, with no Phaser physics body
- preserve the existing Ridge interaction target as the gameplay hit area
- keep walk, hop, stretch, loaf, and sleep as candidate frames until reviewed in
  motion

This is not approval for a global sprite framework, full Cicka locomotion, or a
pet-system scope increase.

## Audit Results

Command:

```bash
python3 .agents/skills/sketchbook-sprite-pipeline/scripts/audit_frames.py \
  asset-sources/prepared/characters/cicka/frames \
  --manifest asset-sources/prepared/characters/cicka/manifest.json \
  --spritesheet public/assets/ridge/cicka/cicka-spritesheet.png
```

Results:

- all runtime frames are `128x96` RGBA PNGs
- all frame centers are stable within `63.5-64.5`
- all bottom padding is stable at `10px`
- manifest frame count matches `12`
- horizontal spritesheet size matches `1536x96`
- no alpha bbox touches the frame edge
- duplicate prepared-folder copies of the runtime spritesheet and QA sheet were
  deleted after promotion; `public/assets/ridge/cicka/` is the runtime owner

## Risks

- The hatching is visually charming but dense; it may become muddy at smaller
  mobile sizes.
- The poses are consistent enough for perch/idle reads, but not yet proven as a
  fluid walk cycle.
- The prepared asset has no perch. Ridge should keep drawing the perch locally
  until a combined character/prop composition is deliberately generated.
- The manifest body shape is useful for review, but Ridge should not attach a
  physics body to Cicka in this slice.

## Follow-Up Gates

Before expanding Cicka beyond this proof:

1. Capture Ridge desktop and mobile screenshots with Cicka visible.
2. Review whether hatching stays readable at actual gameplay scale.
3. If Cicka walks, build a walk-specific QA sheet and verify foot-line stability
   in motion.
4. If Cicka needs collision, define a gameplay hitbox separately from the visual
   alpha bounds.
5. If a perch should become generated art, generate it as a prop contract first
   rather than baking it into the Cicka character sheet.
