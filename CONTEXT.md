# Sketchbook Ridge

This context defines the game-design language for the gamified portfolio and its Ridge overworld work.

## Language

**Typed Ridge Blockout Source**:
A human- and agent-editable TypeScript source notation that describes Ridge
topology, room blockouts, traversal primitives, shortcuts, anchors, tile
registry entries, and Cicka Home mutation declarations as source data.
_Avoid_: map editor, final art map

**Ridge Blockout Source**:
The validated source file for the Ridge Blockout. It is optimized for direct
editing by Danilo and AI level-design agents, then compiled into typed runtime
facts and geometry.
_Avoid_: final art source, exported screenshot

**Ridge Blockout**:
A playable primitive Ridge map generated from the typed Ridge Blockout Source before
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
A configurable unit in the typed Ridge Blockout Source that converts text-grid positions into world-space pixels.
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
encounters Cicka, helps residents, finds artifacts, and reads the world through
shortcuts and changed landmarks.
_Avoid_: mini-game arena, old modal overworld

**Sketchbook Neighborhood**:
The intended first-read fantasy of the Exploration Map: an inhabited paper place
where the player moves toward the Relay Spire by helping tiny residents and
seeing routes change.
_Avoid_: metroidvania platforming map, portfolio theme park, static building row

**Exploration Traversal**:
The common forgiving movement model for the Exploration Map, centered on
walking and authored traversal interactions such as climb, descend, drop, lift,
bridge, enter, inspect, and recovery helpers.
_Avoid_: mini-game controls, one-off arcade movement, required jump platforming

**Authored Traversal Interaction**:
A local route action that moves the player through a designed object or route
change instead of requiring freeform jump execution.
_Avoid_: precision jump, hidden platforming verb, generic movement upgrade

**Mini-Game Movement System**:
A scene-owned movement model for an opt-in mini-game, tuned around that
mini-game's primary toy and input needs.
_Avoid_: shared overworld movement

**Mini-Game Entrance**:
An opt-in world attachment that can offer a hobby toy, proof, reward, shortcut,
alternate solution, or just fun without being required for the core ending path.
_Avoid_: mandatory arcade gate, generic content silo

**Cicka Home Mutation**:
A Ridge-owned declaration that a durable progress source can change Cicka Home,
such as adding a Stampede note or opening a return fold. Declarations without a
real progress source stay typed as future promises instead of rendering.
_Avoid_: stored sticker state, generic landmark memory

**Cicka Field Presence**:
An authored Cicka appearance inside the Exploration Map where she observes,
loafs, points attention, or quietly reacts at a meaningful route beat through
subtle posture, placement, and tiny reactions instead of explicit instructions.
_Avoid_: companion AI, quest marker, follower pet, objective dispenser

**Cicka Threshold Farewell**:
The first ending beat where Cicka accompanies the player to the Relay Spire
threshold, then departs somewhere the player cannot follow.
_Avoid_: literal death scene, grief monologue, Cicka leaving with the player

**Guitar Farewell**:
The final shared Cicka moment where the player plays guitar for her at the Relay
Spire, echoing an established comfort interaction from Cicka Home and the Ridge.
_Avoid_: generic music mini-game, melodrama, one-off ending prop

**Concert Crossing Beat**:
A mid-route Resident Room Beat where a blocked concert/traffic crossing becomes
the way the player earns the guitar through a small music performance problem.
_Avoid_: joke-only drunk musician, random item pickup, final-farewell skill gate

**Resident Help Beat**:
A small Sketchbook Neighborhood progression beat where the player helps a tiny
resident with a concrete local problem and the world visibly changes in return.
_Avoid_: quest chain, dialogue tree, generic fetch quest, portfolio sales pitch

**Resident Room Beat**:
An authored Room Beat centered on one required resident problem, its local
characters, possible solutions, Cicka field presence, and visible route change.
_Avoid_: Phaser scene, isolated quest room, dialogue hub

**Living Proof Gate**:
A quiet ending gate where the player can physically reach the Relay Spire, but
the sketchbook cannot send until the route has created enough visible world
changes, proofs, and Cicka familiarity to make the destination legible.
_Avoid_: boss gate, precision climb gate, arbitrary content checklist

## Relationships

- A **Topology Map** defines the route logic between **Room Beats**.
- The **Typed Ridge Blockout Source** describes **Room Beats** in a validated source file.
- The **Ridge Blockout Source** is written as **Typed Ridge Blockout Source**.
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
  one implementation PR for parity checks, but the project does not carry two
  permanent Ridge source formats after validation passes.
- A **Grid Cell** gives **Room Beats** their scale in the **Ridge Blockout**.
- A **Ridge Blockout** is replaced or enriched by final assets after traversal feels good.
- The current **Ridge Blockout** is the prototype **Exploration Map**.
- The **Exploration Map** should read first as a **Sketchbook Neighborhood**,
  with shortcut relief supporting that fantasy instead of required precision
  platforming defining it.
- The **Exploration Map** uses **Exploration Traversal**.
- A mini-game may use its own **Mini-Game Movement System** instead of
  **Exploration Traversal**.
- The first ending path should be completable through conversation, collection,
  authored traversal, Resident Room Beats, and world changes without requiring
  full arcade mini-games.
- **Mini-Game Entrances** can provide optional alternate path unlocks, proof
  sources, rewards, or pure side fun, but they should not be the default way the
  core route solves blockers.
- **Exploration Traversal** treats jump as non-core for the v0 main path;
  vertical movement should come from **Authored Traversal Interactions** unless
  a future mobility item deliberately changes the route grammar.
- **Cicka Home Mutations** resolve compiled Ridge facts against durable Ridge
  progress; active mutations can render Cicka Home changes, while unresolved
  future mutations remain data only.
- **Cicka Field Presence** complements **Cicka Home** by making Cicka recur
  across the **Sketchbook Neighborhood** without turning her into a follower,
  solver, vendor, or quest board.
- A **Resident Help Beat** may use **Cicka Field Presence** to draw attention to
  a route blocker, but the solution should come from a resident, artifact,
  mini-game clear, or visible environment change.
- Required **Resident Help Beats** should include **Cicka Field Presence**, but
  Cicka's role can shift from obvious attention cue to changed-object observer
  to quiet trust marker.
- A required **Resident Help Beat** usually belongs to one **Resident Room Beat**;
  that room beat can include multiple residents, optional interactions, and
  alternate solutions without becoming a separate Phaser scene.
- The **Cicka Threshold Farewell** resolves Cicka's recurring field guidance
  without closing the **Sketchbook Neighborhood**; the Ridge remains replayable
  with Cicka's final mark or absence-shaped changes.
- The **Guitar Farewell** should be established before the ending as a repeatable
  comfort interaction, especially at Cicka Home, so the final Relay Spire use
  feels remembered rather than introduced for drama.
- The **Concert Crossing Beat** can teach the guitar through a small
  Guitar-Hero-like mini-game, but the **Guitar Farewell** itself should remain a
  cozy remembrance interaction rather than an arcade pass/fail challenge.
- Required **Resident Room Beats** that contain arcade-like interactions should
  also have a non-arcade fallback through conversation, collection, practice, or
  a forgiving auto-resolve path.
- A **Living Proof Gate** blocks the **Cicka Threshold Farewell** emotionally and
  semantically, not by making the Relay Spire physically unreachable.
- The old Overworld and Hobbies scenes are transitional surfaces. Long-term,
  their best content should fold into the **Exploration Map** as artifacts,
  entrances, Cicka reactions, Basement/Potassium paths, and mini-game props.

## Example Dialogue

> **Dev:** "Should we change the Stampede room art now?"
> **Domain expert:** "No, first update the **Room Beat** in the **Typed Ridge Blockout Source** so the **Ridge Blockout** proves the shortcut back to Cicka."

> **Dev:** "Should the player always return to Cicka Home after a blocked bridge?"
> **Domain expert:** "No — use **Cicka Field Presence** at the bridge to draw attention, while **Cicka Home Mutations** keep home as the place that remembers durable progress."

> **Dev:** "Can Cicka tell the player to fix the bridge?"
> **Domain expert:** "No — let **Cicka Field Presence** make the bridge feel suspicious, then resolve it as a **Resident Help Beat** with a visible route change."

> **Dev:** "Does every resident need to solve a barricade?"
> **Domain expert:** "No — required **Resident Help Beats** change routes, while optional residents can offer mini-games, atmosphere, jokes, or quiet company."

> **Dev:** "Should each resident scene be a Phaser scene?"
> **Domain expert:** "No — call it a **Resident Room Beat** unless it truly needs a separate runtime scene."

> **Dev:** "Does Cicka leave with the player at the ending?"
> **Domain expert:** "No — the **Cicka Threshold Farewell** means she walks with the player to the threshold, then departs somewhere the player cannot follow."

> **Dev:** "Can the final Cicka beat be the player playing guitar for her?"
> **Domain expert:** "Yes — make it the **Guitar Farewell**, but establish guitar as a quiet comfort interaction before Relay so it carries memory instead of exposition."

> **Dev:** "Can the guitar come from a concert problem?"
> **Domain expert:** "Yes — use the **Concert Crossing Beat** to earn the guitar through a tiny performance/help moment, then let Cicka Home turn it into comfort."

> **Dev:** "Does every obstacle need a mini-game?"
> **Domain expert:** "No — the first ending path should work through residents, conversations, collection, and world changes; **Mini-Game Entrances** can add alternate paths or side fun."

> **Dev:** "Should the Relay Spire require a boss or hard climb?"
> **Domain expert:** "No — use a **Living Proof Gate** so the player can reach it early but cannot send until the path has created enough visible change and emotional tie to Cicka."

## Flagged Ambiguities

- "map" can mean **Topology Map**, **Ridge Blockout**, or final art; resolved by naming the layer explicitly.
- "scene" can mean a design beat or a Phaser runtime scene; use **Resident Room
  Beat** for required resident progression spaces unless a separate runtime
  scene is deliberately needed.
- "metroidvania" is inspiration for shortcut relief, route memory, and changed
  landmarks, not a promise of required ability-gated precision platforming on
  the main **Exploration Map** route.
- "no jump" means no required jump button for v0 **Exploration Traversal**, not
  a ban on jump-like toys inside opt-in mini-games, future items, or separate
  **Mini-Game Movement Systems**.
- "slope" or "ramp" should not describe required v0 **Exploration Traversal**;
  use object-like route language such as stairs, cords, bridges, lifts, shelves,
  and soft drops. `ramp` may remain an internal connector label where needed.
- "Cicka follows the player" means authored **Cicka Field Presence** at route
  beats, not continuous companion following or autonomous navigation.
- "Cicka departs with us" means **Cicka Threshold Farewell**, where she
  accompanies the player to the Relay Spire threshold and then leaves from the
  player, not with the player.
- "hint" from Cicka means subtle attention guidance through staging or reaction,
  not explicit objective text like "go fix the bridge."
