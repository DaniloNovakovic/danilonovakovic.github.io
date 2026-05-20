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

**Lived-In Causality**:
A design rule for the Sketchbook Neighborhood: route blockers and world changes
should have practical in-world causes, local context, and residents with
believable reasons and means to help. A beat should answer where it belongs,
what physically blocks progress, and why the character involved can affect that
blocker.
_Avoid_: purely magical unlock, abstract emotional gate, quest-giver robot

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

**Living Proof Montage**:
A brief Guitar Farewell montage that wordlessly shows the resident help and
world changes that made the sketchbook ready to send.
_Avoid_: full recap, credits roll, visible checklist, objective summary

**Concert Crossing Beat**:
A mid-route Resident Room Beat where a blocked concert/traffic crossing becomes
the way the player earns the guitar through a small music performance problem.
_Avoid_: joke-only drunk musician, random item pickup, final-farewell skill gate

**Opening Dance Shuttle Beat**:
A final-route Resident Room Beat where afternoon festival setup blocks the Relay
hill service road until the player helps prepare the night dance and catches the
last daylight shuttle to the Relay Spire.
_Avoid_: Last Dance, Final Shuttle Hold, after-festival closure gate

**Last-Stop Operations Helper**:
The shy colleague in the Opening Dance Shuttle Beat who handles visible plaza
operations such as shuttle questions, setup checks, volunteer handoffs, and
service-road clearance calls.
_Avoid_: DJ, song-table volunteer, generic festival helper, niche technician

**Operations Handoff Check**:
A Readiness Favor where the player helps the Last-Stop Operations Helper prove
the plaza setup is safe enough for another resident to watch while she enjoys
the night dance.
_Avoid_: confidence speech, therapy puzzle, arbitrary item fetch

**One-Step Practice**:
A Readiness Favor where the hill-shuttle driver privately learns one tiny dance
step so he can offer shared rhythm without pretending to be a good dancer.
_Avoid_: dance mastery, public embarrassment, required rhythm challenge

**Folded Song Request**:
The small paper invitation that lets the hill-shuttle driver ask the Last-Stop
Operations Helper to dance without forcing a public confession.
_Avoid_: love letter, public proposal, player-delivered confession

**Setup Clearance Walkthrough**:
The physical route solve in the Opening Dance Shuttle Beat where final visible
festival setup details clear the service lane for the last daylight shuttle.
_Avoid_: long chore list, black-screen-only solve, abstract emotional unlock

**Prompt-Driven Playable Montage**:
A compact presentation pattern where the player triggers a few authored
interactions that snap through visible work and a time-of-day shift.
_Avoid_: pure cutscene, full manual chores, repeated object hauling

**Unnamed Counterpart Cat**:
The non-Micka local cat who may quietly interact with Cicka during the Opening
Dance Shuttle Beat as implied continuity foreshadowing.
Use only silhouette/color specificity, such as a pale or light-ink contrast to
Cicka.
_Avoid_: Micka's dad, explicit parentage reveal, early Micka reveal, exposition,
named dialogue

**Resident Help Beat**:
A small Sketchbook Neighborhood progression beat where the player helps a tiny
resident with a concrete local problem and the world visibly changes in return.
_Avoid_: quest chain, dialogue tree, generic fetch quest, portfolio sales pitch

**Resident Room Beat**:
An authored Room Beat centered on one required resident problem, its local
characters, possible solutions, Cicka field presence, and visible route change.
_Avoid_: Phaser scene, isolated quest room, dialogue hub

**Recoverable Conversation Choice**:
A dialogue choice inside a Resident Room Beat that can change tone, trust,
order, optional rewards, or temporary awkwardness without permanently blocking
the first ending. A failed or clumsy choice should create an in-world recovery
path rather than a dead end.
_Avoid_: permanent fail state, gotcha dialogue, illusion-only choice

**Practical Wayfinding Loop**:
A Resident Room Beat discovery pattern where the player first learns a route
problem through signs, blocked paths, local roles, and travel questions before
uncovering the emotional or character layer underneath.
_Avoid_: quest-giver monologue, immediate emotional exposition, objective popup

**Triangulated Discovery Flow**:
A conversation pattern where the player first receives incomplete but truthful
answers from the directly involved residents, then learns the fuller social
context by asking nearby locals who have partial observations.
_Avoid_: omniscient NPC reveal, instant confession, hidden-state guessing

**Readiness Favor**:
A small personal or practical favor that helps a resident become ready to take
the next route-solving action without the player exposing private feelings or
forcing a confession. It should reveal character and reduce a believable
insecurity, not act as arbitrary busywork.
_Avoid_: generic fetch quest, public romantic confrontation, puppet-master solve

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
- The **Sketchbook Neighborhood** should obey **Lived-In Causality** even when
  its art direction is sketchbook-like: a route change can be whimsical in
  presentation, but its blocker, helper, and resolution should feel practical
  and locally motivated.
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
- **Resident Room Beats** can use **Recoverable Conversation Choices** to make
  resident help feel authored and personal, but the main ending path should not
  become permanently missable because of one dialogue choice.
- A **Practical Wayfinding Loop** should introduce route blockers before
  emotional stakes when a beat needs to feel lived-in and grounded.
- A **Triangulated Discovery Flow** can reveal a resident relationship without
  making the player or one NPC magically know private feelings.
- A **Readiness Favor** can bridge the gap between knowing what a resident wants
  and helping them act without making the player directly manage their feelings.
- The **Cicka Threshold Farewell** resolves Cicka's recurring field guidance
  without closing the **Sketchbook Neighborhood**; the Ridge remains replayable
  with Cicka's final mark or absence-shaped changes.
- The **Guitar Farewell** should be established before the ending as a repeatable
  comfort interaction, especially at Cicka Home, so the final Relay Spire use
  feels remembered rather than introduced for drama.
- The **Guitar Farewell** can include a **Living Proof Montage**, but the montage
  should stay brief and keep Cicka as the emotional focus.
- The **Concert Crossing Beat** can teach the guitar through a small
  Guitar-Hero-like mini-game, but the **Guitar Farewell** itself should remain a
  cozy remembrance interaction rather than an arcade pass/fail challenge.
- The **Opening Dance Shuttle Beat** keeps the dance festival as a night event,
  but the required route action happens during daytime setup so the player can
  reach the Relay Spire for the sunset **Guitar Farewell**.
- The **Opening Dance Shuttle Beat** centers the hill-shuttle driver and the
  **Last-Stop Operations Helper** as colleagues whose practical work and private
  nervousness both delay the last daylight ride.
- The **Operations Handoff Check** is the Last-Stop Operations Helper's current
  **Readiness Favor**; the dance teacher is the simple first candidate to cover
  the operations watch, but the covering resident can remain flexible.
- **One-Step Practice** is the hill-shuttle driver's current **Readiness Favor**;
  it gives him one private, imperfect step rather than turning dance into a
  public skill test.
- The **Folded Song Request** connects the two Readiness Favors by letting the
  driver ask through a subtle operations-table object instead of direct public
  matchmaking.
- The **Setup Clearance Walkthrough** restores the practical route blocker after
  the romantic connector by making the service lane visibly ready for the last
  daylight shuttle.
- The **Setup Clearance Walkthrough** should present as a **Prompt-Driven
  Playable Montage**, with a few interaction snaps and a visible sky/plaza time
  shift instead of full manual chores.
- In the **Opening Dance Shuttle Beat**, **Cicka Field Presence** should read as
  a quiet threshold observer near the operations table or service gate; the
  **Unnamed Counterpart Cat** can add texture and imply future continuity, but
  it should stay visual-only and should not be named or treated as Micka.
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

> **Dev:** "Can the Guitar Farewell show what happened to the residents?"
> **Domain expert:** "Yes — use a brief **Living Proof Montage** of resident/world changes, not a full recap."

> **Dev:** "Can the guitar come from a concert problem?"
> **Domain expert:** "Yes — use the **Concert Crossing Beat** to earn the guitar through a tiny performance/help moment, then let Cicka Home turn it into comfort."

> **Dev:** "Does the dance festival happen at night?"
> **Domain expert:** "Yes — but the required route beat is the **Opening Dance Shuttle Beat**, where daytime setup opens one last daylight ride to Relay before the night festival begins."

> **Dev:** "Is the driver's crush the DJ?"
> **Domain expert:** "No — she is the **Last-Stop Operations Helper**, a visible plaza worker whose setup checklist and service-road handoff make her role immediately readable."

> **Dev:** "How do we help the shy operations helper without therapizing her?"
> **Domain expert:** "Use the **Operations Handoff Check**: prove the setup is ready and let a trusted resident keep watch so she can enjoy the night."

> **Dev:** "How do we help the driver if he cannot dance?"
> **Domain expert:** "Use **One-Step Practice**: he learns one tiny private step, enough to ask without pretending he is suddenly good."

> **Dev:** "How does he actually ask her to dance?"
> **Domain expert:** "Use the **Folded Song Request**: a small paper invitation at the operations table, not a public confession."

> **Dev:** "How does the road physically open after the cute paper moment?"
> **Domain expert:** "Use the **Setup Clearance Walkthrough** so visible setup details clear the service lane for the last daylight shuttle."

> **Dev:** "Do we make the player manually move every chair?"
> **Domain expert:** "No — present the **Setup Clearance Walkthrough** as a **Prompt-Driven Playable Montage** with a few authored interaction snaps."

> **Dev:** "Can Cicka hang out with another cat during the dance setup?"
> **Domain expert:** "Yes — use the **Unnamed Counterpart Cat** for implied continuity, but do not spend Micka before the post-ending return."

> **Dev:** "Should we design the other cat now?"
> **Domain expert:** "Only at silhouette/color level: a pale or light-ink contrast to Cicka, with no name, dialogue, or parentage reveal."

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
- "last dance" previously meant an after-festival closure gate; resolved: use
  **Opening Dance Shuttle Beat** for the final dance-festival route beat.
- "festival helper" is too generic for the driver's colleague; resolved: use
  **Last-Stop Operations Helper**.
- "lighthouse" is current story shorthand for the **Relay Spire** as a beacon or
  overlook; keep docs on **Relay Spire** unless the final landmark is renamed.
- "another cat" during **Opening Dance Shuttle Beat** means the **Unnamed
  Counterpart Cat**, not **Micka**, whose first appearance remains after the
  first-ending return unless that timing is deliberately reopened.
