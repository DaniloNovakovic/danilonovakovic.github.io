# Sketchbook Ridge Milestone Plan

> Planning companion for [`sketchbook-ridge-summit.md`](./sketchbook-ridge-summit.md).
> The Summit doc is the product vision. This file is the implementation and
> issue-planning map for agents working across branches.

## Active Goal

The current product milestone is **Sketchbook Ridge Summit**.

The first complete milestone should prove:

1. a compact Ridge route exists
2. the Relay Spire is visible early
3. Potassium Slip can act as the existing arcade anchor
4. Stampede Sketch is the first new opt-in mini-game
5. rewards visibly change the Ridge
6. Cicka and one NPC make the world feel inhabited

Anything beyond that is future scope unless a slice explicitly pulls it in.

## Current Implementation Status

- **M1 Ridge Shell** is complete for the current placeholder slice: Ridge can
  boot directly with `?startScene=ridge`, uses shared side-view movement, shows
  the Relay Spire, Cicka's first perch, a static Ridge Guide, and three Trail
  Card props.
- **M2 Trail Card and Manual Overlay Surface** is complete for the current
  prototype slice: the reusable global Trail Card overlay, reusable Manual Page
  overlay shape, Ridge trigger contract, and mobile/readability polish are in
  place.
- **M3 Art and Audio Research Pack** is in review: visual, overlay/manual, and
  audio direction packs now guide Cicka, Guide, Trail Card, Manual Page,
  Stampede, Relay Spire, and Ridge audio without blocking rough engineering
  prototypes.
- **M4 Stampede Sketch Prototype** should start after Danilo reviews the key M3
  taste calls, with a movement-only Stampede scene enabled from the Stampede
  Trail Card once the empty scene exists.

## Production Crew

Role contracts and activation phrases live in
[`docs/agents/sketchbook-ridge-team.md`](../agents/sketchbook-ridge-team.md).

- **Aleksa**: level design and milestone shape.
- **Iva**: emotional/story tone.
- **Vuk**: systems and production constraints.
- **Milena**: NPC/character design.
- **Zoran**: architecture and branch conflict control.
- **Rade**: character and environment art research.
- **Aleksandra**: overlay, manual, and mobile visual readability.
- **Django**: music and sound design research.

## Reference Stack

Every implementation issue should link these:

- [`sketchbook-ridge-summit.md`](./sketchbook-ridge-summit.md)
- [`runtime-architecture.md`](../runtime-architecture.md)
- [`runtime-modes.md`](../runtime-modes.md)
- [`architecture-direction.md`](../architecture-direction.md)
- [`../design/style-guide.md`](../design/style-guide.md)
- [`../../.agents/rules/10-architecture.md`](../../.agents/rules/10-architecture.md)
- [`../../.agents/rules/20-game-runtime.md`](../../.agents/rules/20-game-runtime.md)
- [`../../.agents/rules/30-react-overlays.md`](../../.agents/rules/30-react-overlays.md)

Use [`potassium-slip.md`](./potassium-slip.md) for Potassium-specific behavior.

## Conflict Strategy

Zoran's rule:

> Parallelize scene internals. Serialize shared seams.

Do not let many branches edit these at the same time:

- `src/game/bridge/store.ts`
- `src/game/scenes/sceneIds.ts`
- `src/game/scenes/sceneRegistry.ts`
- `src/game/overlays/overlayIds.ts`
- `src/game/overlays/overlayRegistry.ts`
- `src/game/sceneLifecycle/contexts/createSceneContexts.ts`
- `src/game/sharedSceneRuntime/**`
- `src/game/sharedSceneRuntime/phaserScenePresentation.ts`

Use one short-lived integration branch to land shared seam edits in dependency
order. Feature branches should export scene-local definitions from their own
folders and let the integration owner wire them into shared registries.

Suggested branches:

- `ridge/integration`
- `ridge/m0-progress-baseline`
- `ridge/shell-scene`
- `ridge/trail-card-overlay`
- `ridge/stampede-sketch`
- `ridge/memory-layer`
- `ridge/art-audio-research`
- `ridge/telegraph-terrace`

## Ownership Boundaries

- Runtime/integration owns bridge progress, scene ids, scene registry, overlay ids, overlay registry, presentation policy, and scene context assembly.
- Ridge scene owner owns `src/game/scenes/ridge/**`.
- Stampede owner owns `src/game/scenes/stampedeSketch/**`.
- Telegraph owner owns `src/game/scenes/telegraphTerrace/**`.
- Reusable overlay owner owns `src/game/overlays/**`.
- Scene-local result overlays belong with their scene unless promoted deliberately.
- Shared scene runtime changes require explicit review because they affect existing scenes.
- Art/audio research should write docs and asset specs first; implementation should not block on final polish.

## Milestones

### M0: Production Baseline

Goal: establish the shared seams before parallel work starts.

Owner: runtime/integration.

Outputs:

- Potassium Circuit source confirmed as existing inventory ownership.
- Minimal Ridge progress shape defined: stamps, manual pages, glide pips, shortcuts.
- First reward ids reserved.
- Current smoke path confirmed: Overworld, Hobbies, Basement, Potassium, overlays, pause, touch.

Blocks:

- Ridge Shell
- Stampede reward wiring
- Ridge Memory
- Relay Spire gate

### M1: Ridge Shell

Goal: make the main game shape playable with placeholders.

Owner: Ridge scene.

Start Ridge as a separate `ridge` scene first. Keep the current overworld as
the default route until the Ridge shell feels good. During development, boot
directly into Ridge with `?startScene=ridge` for fast iteration.

Keep the first movement shell flat and readable. Use visual height changes,
landmark silhouettes, and prop staging before adding real vertical traversal.

Outputs:

- `src/game/scenes/ridge/**`.
- Side-view Ridge scene using shared player/camera runtime.
- Relay Spire silhouette.
- three hobby triggers with Trail Cards.
- Cicka first perch.
- one static NPC.
- return path to prior/current parent scene.
- placeholder sticker layer.

Can proceed with rough art. Do not wait for final drawings.

### M2: Trail Card And Manual Overlay Surface

Goal: make opt-in scene entry and one-screen knowledge clues readable.

Owner: reusable overlay/UI.

Outputs:

- Trail Card overlay via `OverlayHost`.
- first Manual Page overlay shape if needed by Relay/Telegraph.
- mobile-first layout rules.
- copy lives in `src/shared/i18n/messages/en/`.

Registry wiring should be serialized through the integration branch.

### M3: Art And Audio Research Pack

Goal: unblock implementation without creating final-asset pressure.

Owners: Rade, Aleksandra, Django.

Outputs:

- NPC silhouette sheet for Cicka, Ridge Guide, Potassium Compliance Officer, `TODO: AI`, Printer Oracle.
- Cicka mini kit spec: perch, blink, loaf, stretch, suspicious turn, tiny hop, paw-print mark, pre-translator "meow" bubble.
- landmark silhouette board: Relay Spire, Basement hatch, Potassium hint, Stampede picnic blanket, Telegraph terrace, Domino desk/elevator.
- sticker / ink-memory vocabulary.
- Trail Card and Manual Page visual specs.
- Ridge audio palette, Cicka SFX language, Potassium acknowledgement micro-pack, Stampede prototype audio notes.

Current review packs:

- [`sketchbook-ridge-m3-visual-pack.md`](./sketchbook-ridge-m3-visual-pack.md)
- [`sketchbook-ridge-m3-overlay-pack.md`](./sketchbook-ridge-m3-overlay-pack.md)
- [`sketchbook-ridge-m3-audio-pack.md`](./sketchbook-ridge-m3-audio-pack.md)

These are research/spec deliverables. They should not block engineering beyond
basic silhouette placeholders.

### M4: Stampede Sketch Prototype

Goal: ship the first new opt-in mini-game.

Owner: Stampede scene.

Outputs:

- `src/game/scenes/stampedeSketch/**`.
- 60-90 second move-only survivor prototype.
- capped enemies.
- auto-attacks.
- XP pickups.
- three-choice upgrade draft.
- result overlay.
- first-clear stamp and glide pip reward.

Depends on M0 and the Ridge trigger contract from M1. Most scene internals can
be built independently.

### M5: Ridge Memory

Goal: make the Ridge visibly remember rewards.

Owner: Ridge scene.

Outputs:

- sticker/world-change rendering from stamps and manual pages.
- one shortcut.
- Ridge-only glide behavior.
- first Cicka Note or translator tease.

Do not start until reward ids and first real reward are stable.

### M6: Relay Spire First Ending

Goal: close the first complete route.

Owner: integration + Ridge.

Outputs:

- final gate: any three stamps or Circuit, plus one manual insight.
- short ending/contact overlay.
- return to Ridge after ending.
- player manual updated when behavior ships.

### M7: Telegraph Terrace Prototype

Goal: test the Muay Thai / Clair Obscur reactive timing lane.

Owner: Telegraph scene.

Outputs:

- `src/game/scenes/telegraphTerrace/**`.
- one-button parry loop.
- three attack patterns.
- Tempo build and counter release.
- assist timing.
- manual page reward.

This can begin after M0 and the Trail/Manual overlay shape. It should not block
Stampede or the first ending.

## Draft Issue Breakdown

These are proposed GitHub issues. Keep them thin and vertical.

### 1. Establish Ridge Progress Baseline

Type: AFK  
Blocked by: none

What to build:

- Add minimal Ridge durable progress to the bridge.
- Add explicit actions for stamps, manual pages, glide pips, and shortcuts.
- Confirm the Relay gate can derive Circuit ownership from existing inventory.
- Add tests for progress actions.

Shared files touched:

- `src/game/bridge/store.ts`
- bridge tests

### 2. Document Potassium As Ridge Anchor

Type: AFK  
Blocked by: none

What to build:

- Update docs so Potassium's Circuit is clearly the alternate finale key.
- Record the exact ownership check future Ridge gates should use.
- Keep Potassium behavior unchanged.

### 3. Reserve Ridge Scene And Overlay Integration Points

Type: AFK  
Blocked by: issue 1

What to build:

- Add scene ids and placeholder scene definitions for Ridge and Stampede early to reserve them for feature branches.
- Reserve overlay ids for Trail Card and Manual Page.
- Keep registry/context edits small and centralized.

Shared files touched:

- `src/game/scenes/sceneIds.ts`
- `src/game/scenes/sceneRegistry.ts`
- `src/game/overlays/overlayIds.ts`
- `src/game/overlays/overlayRegistry.ts`
- `src/game/sceneLifecycle/contexts/createSceneContexts.ts`

### 4. Build Ridge Shell With Three Trail Card Triggers

Type: AFK  
Blocked by: issues 1 and 3

What to build:

- Add the Ridge scene folder.
- Compose the shared side-view player runtime.
- Place Relay Spire, Cicka perch, one NPC, and three hobby trigger placeholders.
- Open Trail Cards from triggers.
- Return cleanly from child scenes.

### 5. Build Trail Card Overlay

Type: AFK  
Blocked by: issue 3

What to build:

- Add reusable Trail Card overlay through `OverlayHost`.
- Support title, one-line mood, time estimate, reward preview, enter/back actions.
- Use mobile-first paper-cut layout.
- Put display copy in shared messages.

### 6. Draft Manual Page Overlay Shape

Type: AFK  
Blocked by: issue 3

What to build:

- Add the first Manual Page overlay shape or document why it should remain scene-local.
- Support one title, one diagram/clue panel, one margin note.
- Keep it readable on mobile.

### 7. Produce Ridge Art Direction Pack

Type: HITL  
Blocked by: none

What to build:

- NPC silhouette sheet.
- Cicka mini kit spec.
- landmark silhouette board.
- sticker/ink-memory vocabulary.
- Trail Card and Manual Page visual direction.

Current draft:
[`sketchbook-ridge-m3-visual-pack.md`](./sketchbook-ridge-m3-visual-pack.md)
and
[`sketchbook-ridge-m3-overlay-pack.md`](./sketchbook-ridge-m3-overlay-pack.md).

Human review required because visual taste, overlay tone, and Cicka personality
matter.

### 8. Produce Ridge Audio Direction Pack

Type: HITL  
Blocked by: none

What to build:

- Ridge loop palette options.
- Cicka SFX language.
- Potassium acknowledgement micro-pack.
- Stampede prototype audio notes.
- Telegraph timing cue notes.

Current draft:
[`sketchbook-ridge-m3-audio-pack.md`](./sketchbook-ridge-m3-audio-pack.md).

Human review required before committing to music direction.

### 9. Build Stampede Sketch Prototype

Type: AFK  
Blocked by: issues 1, 3, and 4

What to build:

- Add `src/game/scenes/stampedeSketch/**`.
- Implement 60-90 second move-only survivor loop.
- Add capped enemies, auto-attacks, XP pickups, and upgrade draft.
- Use direct pointer/touch-friendly input.

### 10. Add Stampede Results And First-Clear Reward

Type: AFK  
Blocked by: issue 9

What to build:

- Add result overlay.
- Award first-clear stamp and glide pip.
- Return to Ridge.
- Verify repeat clears do not duplicate first-clear rewards.

### 11. Add Ridge Memory Layer

Type: AFK  
Blocked by: issues 4 and 10

What to build:

- Render placeholder sticker/world changes from progress.
- Add one shortcut.
- Add first Cicka Note or translator tease.

### 12. Add Ridge-Only Glide

Type: HITL  
Blocked by: issue 11

What to build:

- Add glide behavior only for Ridge.
- Decide whether touch needs durable `jumpHeld` or `glideHeld`.
- Confirm Hobbies/Basement do not inherit glide accidentally.

Human review required because this touches shared input feel.

### 13. Add Relay Spire First Ending

Type: AFK  
Blocked by: issues 6, 10, and 11

What to build:

- Gate on any three stamps or Circuit, plus one manual insight.
- Add short ending/contact overlay.
- Return to Ridge after ending.

### 14. Build Telegraph Terrace Timing Prototype

Type: AFK  
Blocked by: issues 1 and 6

What to build:

- Add `src/game/scenes/telegraphTerrace/**`.
- Implement one-button parry, three attack patterns, Tempo, counter release, assist timing.
- Award a manual page.

This should be parallelizable with late Ridge work once shared ids are reserved.

### 15. Update Player Manual For Shipped Ridge Behavior

Type: AFK  
Blocked by: any shipped behavior from issues 4, 10, 11, 13, or 14

What to build:

- Update `player-manual.md` only for behavior that has actually shipped.
- Keep speculative notes in design docs.

## Suggested First Issue Batch

Start with these before spawning many implementation agents:

1. Establish Ridge Progress Baseline.
2. Document Potassium As Ridge Anchor.
3. Build Trail Card Overlay.
4. Produce Ridge Art Direction Pack.
5. Produce Ridge Audio Direction Pack.

After those land, split Ridge Shell and Stampede Sketch into separate agents.
