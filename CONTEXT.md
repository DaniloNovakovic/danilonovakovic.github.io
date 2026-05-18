# Sketchbook Ridge

This context defines the game-design language for the gamified portfolio and its Ridge overworld work.

## Language

**Ridge Map Language**:
A human- and agent-editable source notation that describes Ridge topology, room
blockouts, traversal primitives, shortcuts, anchors, and Cicka Home mutation
declarations as source data. It may be schema-backed text such as JSONC rather
than a custom ASCII-only DSL, as long as it remains readable and strictly
validated.
_Avoid_: map editor, final art map

**Ridge Blockout Source**:
The validated source file for the Ridge Blockout. It is optimized for direct
editing by Danilo and AI level-design agents, then compiled into typed runtime
facts and geometry.
_Avoid_: final art source, exported screenshot

**Ridge Blockout**:
A playable primitive Ridge map generated from the Ridge Map Language before
final assets are placed. The current blockout compiles into typed facts,
geometry, connectors, and presentation inputs.
_Avoid_: final map, finished level

**Ridge Blockout Editor**:
A visual authoring and QA surface for the Ridge Blockout Source that renders the
compiled blockout and supports scrolling around the Exploration Map. Its first
useful version is a read-only visual QA surface; validated source editing can be
added after the viewer proves the source, compiler, and renderer agree. It is
not a final art map editor.
_Avoid_: final art editor, generic map editor

**Grid Cell**:
A configurable unit in the Ridge Map Language that converts text-grid positions into world-space pixels.
_Avoid_: hard-coded tile size, permanent pixel size

**Ridge Tile Registry**:
The validated dictionary that maps readable authoring symbols to explicit
runtime tile IDs and tile meanings such as empty, solid, platform, ladder, or
design-only marker. The registry lets AI level-design agents edit readable
grids while the runtime and editor consume numeric tile IDs.
_Avoid_: magic character table, hard-coded tile numbers

**Authoring Symbol**:
A short readable grid token in the Ridge Blockout Source, such as `.`, `#`, or
`L`, that is meaningful only through the Ridge Tile Registry.
_Avoid_: raw runtime tile ID

**Runtime Tile ID**:
The numeric tile identity compiled from an Authoring Symbol through the Ridge
Tile Registry for renderer, validation, editor internals, and Phaser tilemap
interop.
_Avoid_: authoring symbol, room beat id

**Ridge Source Contract**:
The build-time validation contract for the Ridge Blockout Source. It proves the
source is structurally and semantically valid before Ridge runtime code depends
on it, and exposes committed typed generated artifacts for runtime and editor
imports. Agents edit the source file; the generator updates the compiled
TypeScript artifact.
_Avoid_: runtime-only validation, informal parser convention

**Room Beat**:
A named playable region with a traversal purpose, environment identity, and links to other room beats.
_Avoid_: scene, screen, box

**Topology Map**:
A high-level route graph showing room beats, locks, shortcuts, and return paths.
_Avoid_: blockout map, minimap

**Exploration Map**:
The shared side-view route outside opt-in mini-games where the player explores,
returns to Cicka, finds artifacts, and reads the world through shortcuts and
changed landmarks.
_Avoid_: mini-game arena, old modal overworld

**Exploration Traversal**:
The common forgiving movement model for the Exploration Map, such as walking,
jumping, ramps, climbs, drops, mantles, and recovery helpers.
_Avoid_: mini-game controls, one-off arcade movement

**Mini-Game Movement System**:
A scene-owned movement model for an opt-in mini-game, tuned around that
mini-game's primary toy and input needs.
_Avoid_: shared overworld movement

**Cicka Home Mutation**:
A Ridge-owned declaration that a durable progress source can change Cicka Home,
such as adding a Stampede note or opening a return fold. Declarations without a
real progress source stay typed as future promises instead of rendering.
_Avoid_: stored sticker state, generic landmark memory

## Relationships

- A **Topology Map** defines the route logic between **Room Beats**.
- The **Ridge Map Language** describes **Room Beats** in a parseable source file.
- The **Ridge Blockout Source** is written in the **Ridge Map Language**.
- The **Ridge Blockout Source** produces a **Ridge Blockout** and a compiled
  fact layer for routes, anchors, shortcuts, and Cicka Home mutations.
- A **Ridge Blockout Editor** reads and writes the **Ridge Blockout Source**
  through the same validation and compilation path used by runtime.
- The **Ridge Tile Registry** maps **Authoring Symbols** in room grids to
  explicit **Runtime Tile IDs**.
- Danilo and AI level-design agents edit **Authoring Symbols**; runtime systems
  consume compiled **Runtime Tile IDs**, geometry, and facts.
- The **Ridge Source Contract** validates the **Ridge Blockout Source** before
  runtime/editor code imports compiled Ridge blockout data.
- A Ridge Blockout Source format migration may use a temporary dual path inside
  one implementation PR for parity checks, but the project should not carry two
  permanent Ridge source formats after validation passes.
- A **Grid Cell** gives **Room Beats** their scale in the **Ridge Blockout**.
- A **Ridge Blockout** is replaced or enriched by final assets after traversal feels good.
- The current **Ridge Blockout** is the prototype **Exploration Map**.
- The **Exploration Map** uses **Exploration Traversal**.
- A mini-game may use its own **Mini-Game Movement System** instead of
  **Exploration Traversal**.
- **Cicka Home Mutations** resolve compiled Ridge facts against durable Ridge
  progress; active mutations can render Cicka Home changes, while unresolved
  future mutations remain data only.
- The old Overworld and Hobbies scenes are transitional surfaces. Long-term,
  their best content should fold into the **Exploration Map** as artifacts,
  entrances, Cicka reactions, Basement/Potassium paths, and mini-game props.

## Example Dialogue

> **Dev:** "Should we change the Stampede room art now?"
> **Domain expert:** "No, first update the **Room Beat** in the **Ridge Map Language** so the **Ridge Blockout** proves the shortcut back to Cicka."

## Flagged Ambiguities

- "map" can mean **Topology Map**, **Ridge Blockout**, or final art; resolved by naming the layer explicitly.
