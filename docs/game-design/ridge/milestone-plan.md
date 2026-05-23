# Sketchbook Ridge Milestone Plan

> Planning companion for [`summit.md`](./summit.md).
> The Summit doc is the product vision. This file is the implementation and
> milestone map for agents working across branches.

This is not the live issue tracker. PRDs, implementation issues, triage state,
current backlog, and agent-ready briefs live in GitHub Issues through the
workflow in [`docs/agents/issue-tracker.md`](../../agents/issue-tracker.md).

Use this file for durable milestone shape, ownership boundaries, branch/seam
strategy, and reference stacks. Use [`ridge-snapshot.md`](./ridge-snapshot.md)
for the current human-readable Ridge snapshot.

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

This section is a milestone snapshot for orientation. Do not mirror every
GitHub issue update here; update it only when the milestone-level reality or
current shipped/prototype capability changes.

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
- **M4 Stampede Sketch Prototype** is underway with M4a movement, M4b pressure
  loop, M4c/M4d prototype shell, and M4d.5 responsive shell/input work accepted
  for continuation: the Stampede Trail Card can enter a scene-local arena with
  timer, page-noise cadence, capped swarm surges, pressure-aware swarm motion,
  soft contact feedback, automatic pencil swipe, run ending UI, return to
  Ridge, bridge-backed React scene UI, Notebook shell presentation, enlarged
  arcade control mats shared with Potassium, and a first scene-local
  pickup/upgrade draft. First M4e playtest tuning widened the true arena to
  match the visible notebook page, added HP/contact readability, softened the
  contact limit, and added respawn telegraphs. The tuning pass is accepted for
  continuation; the respawn warning improved fairness and added useful route
  planning. M4f durable rewards are accepted for continuation: first clear
  awards the `stampede-sketch` Ridge stamp and one glide pip, repeat clears do
  not duplicate rewards, and the result panel reports earned/already-owned
  reward state.
- **M5 Ridge Memory** has its first visual slices accepted for continuation:
  M5a derives Ridge-owned sticker/world-change memories from durable progress
  without stored sticker state, and M5b adds the first Cicka note/translator
  tease plus a dev-only `devRidgeStamp=stampede-sketch` seed for fast local
  testing. M5c/M5d add Cicka's Stampede-gated walk-by bark, first deliberate
  pre-translator interaction, and a primitive readability polish pass. M5e has
  promoted the prepared Cicka prototype spritesheet into
  `public/assets/ridge/cicka/` as the first runtime-wired AI sprite adoption
  proof, with audit notes and refined pipeline gates.
- **Ridge Architecture Deepening (#60-#64)** is implemented as the current Ridge
  architecture direction: #60 made the blockout the spatial source of truth,
  #61 consolidated traversal comfort, #62 added compiled blockout facts, #63
  slimmed `RidgeScene` into lifecycle glue, and #64 made Cicka Home mutation
  resolution data-driven. #65 is the documentation cleanup slice that records
  this final shape.
- **Asset staging is now an active coordination concern**: prepared POC assets
  still exist for Potassium, Stampede, and future Ridge character/prop families.
  Cicka's adopted runtime copy now lives under `public/assets/ridge/cicka/`;
  its external prepared archive is provenance/source material, not a pending
  runtime adoption target. Keep remaining candidates documented and adopt them
  in small scene-owned slices instead of turning them into a broad
  art-integration branch. See
  [`asset-staging-plan.md`](./reference/asset-staging-plan.md).

## Production Crew

Role contracts and activation phrases live in
[`docs/agents/sketchbook-ridge-team.md`](../../agents/sketchbook-ridge-team.md).

- **Level Designer**: level design and milestone shape.
- **Story / Tone Designer**: emotional/story tone.
- **Systems / Production Designer**: systems and production constraints.
- **Character Designer**: NPC/character design.
- **Architect**: architecture and branch conflict control.
- **Visual Direction Artist**: character and environment art research.
- **Overlay Readability Designer**: overlay, manual, and mobile visual readability.
- **Audio Designer**: music and sound design research.

## Reference Stack

Every GitHub implementation issue should link the relevant subset of these:

- [`summit.md`](./summit.md)
- [`ridge-snapshot.md`](./ridge-snapshot.md)
- [`runtime-architecture.md`](../../runtime-architecture.md)
- [`runtime-modes.md`](../../runtime-modes.md)
- [`architecture-direction.md`](../../architecture-direction.md)
- [`style-guide.md`](../../design/style-guide.md)
- [`10-architecture.md`](../../../.agents/rules/10-architecture.md)
- [`20-game-runtime.md`](../../../.agents/rules/20-game-runtime.md)
- [`30-react-overlays.md`](../../../.agents/rules/30-react-overlays.md)

Use [`potassium-slip.md`](../mini-games/potassium-slip.md) for Potassium-specific behavior,
[`stampede-sketch.md`](../mini-games/stampede-sketch.md) for Stampede-specific behavior,
and [`mini-games/README.md`](../mini-games/README.md) as the mini-game routing
index.

## Conflict Strategy

Architect's rule:

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

Owners: Visual Direction Artist, Overlay Readability Designer, Audio Designer.

Outputs:

- NPC silhouette sheet for Cicka, Ridge Guide, Potassium Compliance Officer, `TODO: AI`, Printer Oracle.
- Cicka mini kit spec: perch, blink, loaf, stretch, suspicious turn, tiny hop, paw-print mark, pre-translator "meow" bubble.
- landmark silhouette board: Relay Spire, Basement hatch, Potassium hint, Stampede picnic blanket, Telegraph terrace, Domino desk/elevator.
- sticker / ink-memory vocabulary.
- Trail Card and Manual Page visual specs.
- Ridge audio palette, Cicka SFX language, Potassium acknowledgement micro-pack, Stampede prototype audio notes.

Current review packs:

- [`m3-visual-pack.md`](./reference/m3-visual-pack.md)
- [`m3-overlay-pack.md`](./reference/m3-overlay-pack.md)
- [`m3-audio-pack.md`](./reference/m3-audio-pack.md)

These are research/spec deliverables. They should not block engineering beyond
basic silhouette placeholders.

### M4: Stampede Sketch Prototype

Goal: ship the first new opt-in mini-game.

Owner: Stampede scene.

Purpose: protect one calm picnic-blanket patch from a stampede of runaway ideas.
Use [`stampede-sketch.md`](../mini-games/stampede-sketch.md) for player-guardian and enemy
intent before generating or wiring final Stampede art.

Outputs:

- `src/game/scenes/stampedeSketch/**`.
- 60-90 second survivor prototype. M4a movement feel covers direct entry from
  the Stampede Trail Card, top-down 8-way movement, pointer drag steering, and
  return to Ridge. M4b adds a scene-local page-noise cadence, pressure HUD,
  capped swarm surges, and soft contact feedback before reward wiring.
- capped enemies.
- central or near-central calm patch objective with proximity aggro: nearby
  enemies chase the player, distant enemies may crowd the blanket.
- auto-attacks.
- XP pickups.
- three-choice upgrade draft.
- result overlay.
- first-clear stamp and glide pip reward.

Depends on M0 and the Ridge trigger contract from M1. Most scene internals can
be built independently.

Current checkpoint:

- **M4a Movement Feel** accepted: direct entry from the Stampede Trail Card,
  top-down 8-way movement, pointer drag steering, vertical-board presentation,
  and return to Ridge are in place.
- **M4b Pressure Loop** accepted for prototype continuation: session timer,
  page-noise cadence, pressure HUD, capped swarm surges, contact limit, soft
  contact feedback, and pressure-aware swarm motion are in place.
- **M4c/M4d prototype shell** accepted: run ending surfaces, Retry/Back
  routing, the first automatic pencil swipe, mobile-friendly start/result UI,
  and the bridge-backed scene UI path are in place. Stampede text-heavy status
  and panels now render through React scene UI instead of Phaser canvas text,
  and Potassium uses the same scene UI path for draft-choice and terminal
  panels.
- **M4d.5 Responsive Shell/Input Spike** accepted for prototype continuation:
  Notebook shell presentation, scene UI panels, and larger control mats are in
  place for Stampede and Potassium. Reusable Notebook Shell language now lives
  in [`notebook-shell-design-language.md`](../../design/notebook-shell-design-language.md).
  Keep the notebook treatment restrained if future polish makes it too noisy or
  brittle.
- **M4e Pickup / Upgrade Draft** accepted for continuation: cleared marks spawn
  simple scrap pickups, collecting the first threshold opens a scene UI upgrade
  draft, and one selected upgrade can make the pencil faster, the swipe wider,
  or the guardian slightly quicker. First tuning feedback also made the playable
  arena fill the notebook page more honestly, exposed HP/contact radius in the
  HUD/scene, raised prototype survivability, and telegraphed mark respawns.
  The respawn warning is now part of the prototype loop because it creates
  fairer avoidance and direction-planning decisions.
- **M4f Durable Rewards Draft** accepted for continuation: first Stampede clear
  now awards the `stampede-sketch` Ridge stamp and one glide pip through bridge
  progress, repeat clears do not duplicate the reward, the result panel reports
  earned/already-owned reward state, and Ridge renders one small Stampede blanket
  memory mark derived from the stamp.
- Scene architecture is intentionally scene-local. `StampedeSketchScene` should
  remain the Phaser adapter/orchestrator while run decisions live behind
  `runtime/runFlow.ts` and swarm steering lives behind `runtime/swarmMotion.ts`.

Potential next implementation slices:

These are local planning notes. Publish approved work as GitHub Issues before
assigning an AFK agent.

1. **M5 Ridge Memory continuation**: add the first small Ridge shortcut or the
   first Cicka proximity/talk interaction as its own scene-owned slice.

Hold until later:

- Enemy-enemy avoidance beyond pressure-aware steering.
- More Stampede upgrades and endless mode.
- Player manual updates; Stampede is still dev/prototype behavior.

### M5: Ridge Memory

Goal: make the Ridge visibly remember rewards.

Owner: Ridge scene.

Outputs:

- sticker/world-change rendering from stamps and manual pages.
- one shortcut.
- Ridge-only glide behavior.
- first Cicka Note, memory reaction, or pre-translator interaction.

Current checkpoint:

- **Architecture-deepening child issues #60-#64 are represented in code**:
  spatial facts now derive from the Ridge Blockout, traversal assists are owned
  by the Ridge traversal runtime, Ridge scene presentation is split into
  blockout/landmark modules, and Cicka Home mutations resolve from compiled
  facts plus durable Ridge progress.

- **M5a Durable Sticker Layer** accepted: `worldMemory.ts` derives visible
  Ridge memory ids from durable progress, empty progress returns no memories,
  and the `stampede-sketch` stamp renders Stampede blanket memories without
  storing sticker ids.
- **M5b Cicka Memory + Dev Stamp Seed** accepted: `stampede-sketch` also derives
  the `cicka-stampede-note` memory at Cicka's perch, Ridge renders the tiny
  Cicka memory tease, and local dev can seed the known stamp with
  `?mode=interactive&startScene=ridge&devRidgeStamp=stampede-sketch`.
- **M5c Cicka Walk-By Memory** accepted for continuation: after the Stampede
  stamp, Cicka gives one tiny walk-by bark per Ridge entry without stored Cicka
  state.
- **M5d Cicka First Interaction** accepted for continuation: Cicka can answer a
  deliberate interaction with pre-translator meow punctuation, while the permanent
  Cicka memory becomes a paw/scratch decal instead of duplicate speech text;
  the same PR includes a small primitive readability polish pass for Cicka,
  her speech bubble, and the memory decal.
- **M5e Cicka Runtime Asset Adoption** accepted for continuation: the prepared
  Cicka spritesheet has been promoted into `public/assets/ridge/cicka/`, Ridge
  loads it as a display-only perch NPC with tiny idle/notice animation, and the
  first AI sprite audit records frame stability, runtime risks, and future
  review gates.

Potential next implementation slices:

These are local planning notes. Publish approved work as GitHub Issues before
assigning an AFK agent.

1. **Ridge / Outskirts Topology Spike**: design and lightly prototype how the
   current Overworld becomes Outskirts/Trailhead and Ridge becomes a connected
   Hollow Knight topology side-view world. Use
   [`topology-spike.md`](./map-plans/topology-spike.md)
   as the active M5 map brief. Do not fully replace the default Overworld in
   the same PR.
2. **Later First Ridge Shortcut / Ridge-Only Glide**: revisit these after the
   topology spike gives shortcuts and movement rewards a real route shape.
3. **Translator / Cicka Daydream**: keep translated Cicka subtitles and the
   Cicka daydream mini-slice for later, after Ridge Memory proves return play.

Do not add stored sticker state. Do not add Stampede upgrades, endless mode,
shared memory architecture, or Ridge shortcuts inside Cicka memory slices.

### M6: Relay Spire First Ending

Goal: close the first complete route.

Owner: integration + Ridge.

Outputs:

- final gate: at least three major clears / proofs, with Potassium Circuit
  counting as one proof, plus one Cicka / translator / manual insight.
- short ending/contact overlay.
- return to Ridge after ending.
- post-ending Ridge state where Micka first appears after the player completes
  or replays one mini-game and returns.
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
