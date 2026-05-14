# Sprite Generation System

Use this reference when AI-generated art is being created, reviewed, converted,
or adopted into runtime.

## Lifecycle

1. **Contract**: define the asset class, scene owner, frame names, count, grid,
   facing direction, origin, expected runtime scale, gameplay hitbox needs, and
   output folders before generation.
2. **Generation**: create source art that satisfies the contract. Use one asset
   family per sheet. Keep props, perches, scenery, labels, shadows, and UI text
   out of character sheets unless deliberately part of every frame.
3. **Source archive**: store raw/keyed/transparent source under `asset-sources/**`.
   Nothing generated should exist only in a local image cache.
4. **Preparation**: remove backgrounds, slice source frames, normalize runtime
   frames, build a spritesheet, write `manifest.json`, and create a debug/contact
   sheet.
5. **QA**: run the audit script with manifest and spritesheet checks. Inspect the
   debug/contact sheet visually.
6. **Approval**: record whether the asset is approved for source-only, prepared
   candidate, limited runtime proof, or production runtime use.
7. **Adoption**: promote only runtime-loaded files to `public/assets/**`; add a
   folder README with owner, source, frame contract, and runtime loader.

## Generation Contract

Every request should specify:

- asset class: `player`, `playerVariant`, `npc`, `enemy`, `prop`, or `pickup`
- scene/domain owner
- frame list and exact order
- expected sheet layout or separate-frame output
- orientation/facing direction
- origin: usually bottom-center for grounded characters, center for floating
  enemies, or a named prop anchor
- expected runtime size in scene pixels
- whether gameplay uses physics, interaction radius, or display-only art
- style constraints from `docs/design/style-guide.md`

## AI Prompt Constraints

For character and enemy sheets:

- transparent output or flat `#ff00ff` chroma key
- no shadows, labels, grid lines, scenery, props, platforms, or text
- consistent pose scale, baseline, facing direction, and silhouette language
- generous padding around every pose
- high-contrast black ink, readable cream fill, controlled hatching
- no pose-specific costume drift unless the frame contract calls for it

Generate props separately. A cat perch, blanket, desk, bag, sign, or platform is
a prop contract, not a hidden dependency inside a character sheet.

## QA Gates

Hard fail:

- missing source art or manifest
- non-RGBA runtime frames
- inconsistent frame dimensions
- empty alpha bbox
- manifest frame count/files mismatch
- spritesheet dimensions do not match the frame contract
- alpha bounds touch the frame edge without an explicit reason

Review warning:

- bottom padding drift greater than `2px` for grounded characters
- center drift greater than `4px`
- hatching/detail becomes muddy at intended runtime scale
- walk frames look like pose variants rather than a readable step cycle
- visual alpha bbox is mistaken for gameplay hitbox

## Runtime Adoption Rules

Adopt the smallest useful proof:

- display-only NPC before physics actor
- one idle/notice animation before locomotion
- one enemy family before an enemy pack
- one static prop before animated prop variants

Scene code owns scene assets. Do not create a global asset framework until two
or more scenes repeat the same loader, manifest, and QA pain.

Gameplay hitboxes are separate from visual bounds. If a sprite needs gameplay
collision, define the intended body/interaction shape in the manifest and verify
it in a debug/contact sheet before wiring physics.

## Review Output

When reviewing an asset, leave behind:

- audit command and result summary
- approval state and allowed runtime use
- visual risks at actual gameplay scale
- source folder and promoted runtime folder
- follow-up gates before expanding animation, collision, or scope
