# Bridge Area

> Status: accepted first-area direction / needs focused area pass.
> Read [`../../README.md`](../../README.md) and
> [`../README.md`](../README.md) before editing this file.

This file owns local design detail for **Bridge Area / Blueprint Bridge**. The
route-level role lives in [`../../story-level-bible.md`](../../story-level-bible.md).

## Route Role

Bridge Area is the first required Ridge Area. It teaches the core route grammar:

```text
Cicka noticed something -> a resident needs local help -> the route visibly changes
```

The emotional idea is: **I can change the world by making something through
art.**

## Accepted Local Contract

- The main blocker is a missing, unsafe, or unfinished crossing.
- Bridge Area can be the first time the player meets Cicka.
- The game can begin with a simple walk-right control introduction from a hill
  or nature edge before the bridge problem is visible.
- Cicka first appears peacefully playing with the tiny toy car / weight-test
  prop. The player can meet her through a tiny pet/play interaction before
  knowing the toy matters.
- The player then reaches the blocked bridge and learns from the Bridge
  Draftsperson that the test car is missing. The player can infer that Cicka has
  it and return to retrieve it through **Cicka Parallel Play**.
- The local resident role is the **Bridge Draftsperson**: a tiny nervous or
  blocked planner responsible for the crossing blueprint.
- The Bridge Draftsperson's problem is a missing middle span on the blueprint:
  they keep erasing and redrawing it because they are overthinking whether the
  structure will hold.
- Nearby failed doodles, eraser marks, or a tiny toy car/weight-test prop can
  make the problem readable and support a future bridge-physics toy.
- The solution is a tiny art/drawing soft gate: help a resident finish a bridge
  drawing or blueprint by drawing or visually completing the bridge, then the
  finished sketch becomes the crossing.
- For v0, this can be a basic authored drawing/completion visual rather than a
  full freeform drawing system.
- For v0, the bridge test should be auto-success presentation: after Cicka
  Parallel Play returns the toy car, the player places or brings it to the
  completed blueprint, the toy car rolls across the drawn bridge, and the sketch
  becomes the real crossing.
- Cicka gives an obvious but nonverbal attention cue near the unsafe edge,
  blank plan, or missing part of the bridge.
- After this first encounter, Cicka should become a recurring authored field
  presence rather than a continuous follower.
- The route change must be visible in the world, not only in dialogue.
- The beat should be tiny, obvious, local, and kind.

## Cicka Resting Spot

Use **Bridge Resting Spot** as the practical label.

- Before resolution: Cicka peacefully plays with or carries the toy car /
  weight-test prop, then the player recontextualizes the toy as the missing
  bridge test car.
- After resolution: Cicka settles near the completed bridge sketch or leaves a
  tiny mark by the crossing.

The resting spot is readable flavor, not a gate.

## Rough Stage Composition

Stage-order sketch:

```text
Nature / hill entry
  -> Cicka + toy car play spot
  -> blocked bridge + unfinished blueprint
  -> Bridge Draftsperson / prop zone
  -> Cicka Parallel Play return
  -> toy car bridge test + completed crossing
  -> Concert transition exit
```

Framing intent: start with a gentle walk-right introduction, then compose the
blocked crossing and blueprint as the readable center of the stage. Foreground
paper edges and failed sketch props can frame the playable lane; background
layers should make the bridge feel like a small handmade crossing rather than a
platforming gauntlet.

## Prototype Floor

The first Bridge implementation should serve as the **Bridge Tracer Slice** for
the wider route. It should prove shared route state, prompts/dialogue shape,
camera framing, Cicka placement, transition handling, and Coherent Sketchbook
Blockout conventions before the other required areas fan out.

The first blockout only needs:

- walk-right nature/hill intro
- peaceful Cicka + toy car first encounter
- basic sit/play interaction
- blocked bridge
- Bridge Draftsperson + missing middle span blueprint
- return to Cicka for Cicka Parallel Play
- toy car bridge test
- simple bridge drawing completion visual
- bridge becomes crossing
- Cicka settles near the completed crossing
- Bridge-to-Concert transition trigger

Cabin, food, physics simulation, and toy-car ping-pong are later optional
layers.

Definition of done for the Bridge Tracer Slice:

1. player can start at Bridge and move through the nature/hill entry
2. player can encounter Cicka with the toy car
3. player can talk to the Bridge Draftsperson at the unfinished blueprint
4. player can use Cicka Parallel Play to receive or unlock the toy car test prop
5. player can run the toy-car bridge test
6. the bridge visibly changes from blocked to usable
7. player can trigger the Bridge-to-Concert transition
8. implementation proves shared route state, prompt/dialogue lookup by ID,
   camera framing, Cicka placement, transition handoff, and basic playability
   evidence

First Playable Audio Floor needs for the tracer: gentle Bridge/nature ambience,
Cicka chirp or purr cue, toy-car bridge-test cue, visible bridge-change cue, and
a soft Bridge-to-Concert transition stinger.

## Bridge Visual Coherence Pass

Track this as a new follow-up issue after the Bridge Tracer Slice rather than
expanding the tracer PR. Run it after the Bridge Tracer Slice works and before
Concert Area implementation begins. The goal is not final art; it is to make
Bridge Area a credible **Walkable Sketchbook Stage** that sets the visual bar
for the rest of the First Playable Route.

Sequence after the Bridge Tracer Slice:

1. Run the Bridge Visual Coherence Pass.
2. Build the route-wide **Character Conversation Overlay** as a React Scene UI
   surface, first integrated into Bridge Area. Phaser should own conversation
   start, player stand-still/freeze behavior, and active dialogue IDs; React
   should own the lower-screen panel, character icon/portrait frame, typed text
   reveal, and advance/close affordance. The first version should show one
   speaker and one active line at a time, Persona-like, while allowing authored
   line sequences to advance and switch speaker between lines. Conversation
   state should freeze player control and interaction target switching, while
   harmless ambient animation can continue. Do not include Ambient Bark Bubbles
   in this first conversation overlay issue beyond preserving a clean data
   boundary between deliberate conversations and later non-blocking barks.
3. Investigate interactive shell screen usage / fullscreen direction if the
   conversation overlay or Bridge staging still feels cramped in the current
   game card.
4. Begin Concert Area implementation.

Minimum outcomes:

- Cicka is grounded at the Bridge Resting Spot and visibly plays with the toy
  car / weight-test prop instead of floating near a generic marker.
- Keep the current left-to-right route geometry for this pass. Solve the
  Cicka / Draftsperson sightline problem through visual staging: foreground
  paper folds, trees, terrain, or set dressing should screen Cicka's toy-car
  play spot from the Draftsperson's work zone without adding a new pocket,
  traversal branch, or route mechanic.
- Stage the Bridge Area as a wooded paper-set scene with multi-parallax forest
  layers: pale distant trees, midground pines/brush, and a few foreground
  paper-fold or tree screens. The environment should read as "wood like" before
  individual props are noticed.
- The Bridge Draftsperson has a distinct blueprint work zone, such as a tiny
  taped paper construction nook with a small desk/blueprint table. Add a nearby
  worker rest cue, such as a rough tent, tiny cabin facade, or sleep shelter, so
  the Draftsperson feels like someone stationed at the bridge rather than a
  generic marker.
- Keep the Bridge Draftsperson's construction zone visually simple: one clear
  bridge, one clear blueprint/plan surface, one clear worker silhouette, and one
  clear rest shelter cue. Avoid random paper scraps, oversized overlapping
  shapes, or doodles that compete with the bridge read.
- The worker rest cue is visual-only in this pass: no enterable pocket, food
  pickup, treat shortcut, new prompt, or route mechanic.
- Cicka's space and the Draftsperson's work zone are separated by local terrain,
  trees, paper folds, or foreground/background staging so the Draftsperson does
  not appear able to see Cicka holding the toy car.
- The bridge, missing span, completed span, floor, background, and prop
  placeholders read as one handmade paper set rather than unrelated debug
  shapes.
- For the first playable forest read, prefer **monochrome-first staging**:
  black ink on off-white paper, with value/line weight/hatching doing the work.
  Yellowed paper fills should be subdued by runtime presentation rather than
  becoming a new Bridge palette. Later color can be applied deliberately as a
  programmatic treatment, not baked into these rough assets.
- This pass may use actual bitmap/image placeholders for the Bridge map set and
  Minimum Route Cast reads, not only Phaser-drawn primitive shapes. The target
  is nice-enough first-playable presentation for Ridge mood, map readability,
  Cicka, and the Bridge Draftsperson while still avoiding final art or a broad
  production asset pack. These images should still follow the Digital
  Sketchbook visual identity: off-white paper, black ink, silhouette-first
  reads, hatching/value for depth, and no new color palette.
- Bridge-specific runtime image placeholders should live under
  `public/assets/ridge/bridge/` with local README/manifest notes, owned by
  `src/game/scenes/ridge/**`. Follow the Cicka asset adoption pattern, but do
  not introduce a shared Ridge asset framework from this single pass.
- Issue #90 should try to create the rough Bridge runtime PNGs directly rather
  than only adding code that waits for future art. These assets may stay rough
  and replaceable, but they should be real images wired into the Ridge scene.
- Replace the asset direction with a **hybrid layered stage** rather than many
  unrelated environment cutouts. The Bridge Area should use a small number of
  coherent horizontal sketch plates for scenery, then keep interactive objects
  modular:
  1. deep sky / mountain plate
  2. far forest plate with varied pines and rounded bushy trees
  3. mid forest / work-camp staging plate
  4. playable terrain / gorge plate with visible top surface, cliff faces,
     hatching, and bridge supports
  5. modular before/after bridge state
  6. modular Cicka, toy car, Bridge Draftsperson, prompts, and route-state
     objects
- Do not return to a single baked whole-map image. The layered plates should
  keep parallax, camera framing, and runtime route-state flexibility while
  preventing the scene from reading as a collage of isolated generated props.
- Individual tree, bush, rock, and terrain cutouts are allowed only when they
  support a coherent layer plate or a clear gameplay staging need. They should
  not be the main way the forest read is created.
- When the player reaches the bridge vista, the background can become the first
  route-wide promise shot. The deep layers may eventually hint at later Ridge
  areas beyond the gorge: a distant city / Concert Area silhouette, the Ridge
  Threshold, and the area near the threshold that leads toward the Dance
  Festival. Keep these as tiny environmental reads in the far distance, not
  literal UI labels or busy landmarks. If the downstream areas are not visually
  settled yet, leave the current forest/mountain vista intact and add these
  silhouettes after their art direction exists.
- The Bridge plate must include both staging moods, not only the bridge vista:
  the left approach should stay on the same continuous sidescroller path while
  close trees and brush hide most distant layers; the bridge approach should
  then open into the ridge vista so the player feels the space clear as they
  reach the crossing. Do not turn the Cicka approach into a separate lower
  forest floor, blocked foreground-room composition, new traversal pocket, or
  angled/isometric top-plane view. The scene may imply cliff height at the gorge
  and ridge edges, but the playable lane should read primarily as a side-on
  horizontal path.
- Keep Bridge assets layered and individually placeable rather than compositing
  the full stage into one image. A generated full-scene image may be used as
  target/reference, but Phaser should still own placement, before/after bridge
  visibility, toy-car movement, prompts, collision, and route-state
  presentation.
- For the current playable proof, use a side-scroller-first lane with generated
  layered plates: far mountains, mid forest, and close terrain/camp/gorge.
  Avoid mixing a separate floor-line system and unrelated terrain slabs under
  the same scene.
- Bridge staging should read as a side-scroller sketchbook route. Characters
  and stateful props still need contact shadows and clear foot placement, but
  the playable lane should not become a shallow isometric/top-plane diorama.
- Treat distant forest readability as more than transparent pine silhouettes.
  Depth should come from simpler shapes, smaller scale, lighter ink/tint, and
  reduced hatching/detail, not from making full objects translucent. Background
  layers may be visually quieter, but they should still read as solid drawings.
- The Bridge forest should not be pine-only. Match the reference read with a
  varied woodland stack: distant mountains, low-detail bush/tree masses made
  from actual forest assets, scattered lower-detail tree marks, then sharper
  pines and foreground brush near the playable lane. Avoid drawn circle blobs
  that read as construction marks rather than forest.
- Remove notebook/ruling lines from the Bridge stage unless they have a clear
  authored meaning. A few clouds, small wind marks, or tiny bird silhouettes can
  add life as non-interactive atmosphere when they do not compete with prompts
  or traversal.
- The before-bridge state should read primarily as a real gap. Avoid showing a
  ghost completed bridge in the background if it reads like a small floating
  bridge. The completed bridge visual must align its deck with the playable
  floor line and banks.
- The Bridge Draftsperson should have minimal living-paper motion: idle wobble
  by default and a distinct talking/working wiggle during Draftsperson dialogue
  or toy-car test beats. Do not add a full animation sheet until the still
  character package needs it.
- The Bridge Draftsperson should stand out from the forest/background through
  silhouette contrast, a small paper backing or shadow mass, and staging that
  keeps prompts away from the blueprint.
- During the toy-car bridge test, Cicka does not need to follow or teleport to
  the car. For this first pass she can remain at the Bridge Resting Spot while
  the car proves the crossing.
- The pass produces tiny role portrait/icon placeholders for the first
  **Character Conversation Overlay** integration: Cicka, Bridge Draftsperson,
  and neutral Prompt/narration.
- The pass may create a small reusable Bridge art kit, but it should stay rough,
  scene-owned, and conservative until repeated asset-pipeline pain is proven.
- Keep staging compatible with the route-wide **Character Conversation Overlay**
  follow-up, but do not expand this visual pass into the final conversation UI.

## Boundaries

- Do not make Bridge Area a platforming test.
- Do not make the required v0 solution depend on physics drawing.
- Do not turn the beat into a fetch quest.
- Do not turn Cicka into a continuous follower after the first encounter.
- Do not make Cicka obediently hand over the toy car as a quest item; the player
  should join her play until she chooses to share it.
- Future optional upgrade: let the player draw directly on the bridge as a
  small customization or bridge-building toy, potentially with simple
  bridge-building physics that tests whether the drawn bridge can carry a car
  or similar weight.
- Future optional upgrade: turn Cicka Parallel Play into a tiny toy-car
  back-and-forth game, like a low-stakes ping-pong riff using the car instead of
  a ball.
- Future optional upgrade: add a nearby cabin/treat interaction that lets the
  player bring Cicka food as an alternate way to retrieve the toy car, such as a
  shortcut around the toy-car ping-pong version rather than a required v0 step.

## Open Local Slots

- Bridge Draftsperson silhouette, personality, and eventual name
- exact bridge topology, collision geometry, and final camera tuning during
  blockout
- blockout validation for the accepted route grammar: Cicka noticed something,
  a resident needs local help, and the route visibly changes
- prop kit for the unfinished sketch/blueprint
- failed doodles, eraser marks, or toy car/weight-test prop staging
- Toy Car Play first Cicka encounter and gentle retrieval staging
- Cicka Parallel Play timing and prompt wording
- auto-success toy car test staging
- one or two prompts that make the crossing change feel authored
- future cabin/treat shortcut scope and placement
- future drawing/bridge-physics toy scope after the route MVP is proven
