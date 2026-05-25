# Sketchbook Ridge

This context defines the game-design language for the gamified portfolio and its Ridge overworld work.

## Language

**Ridge Pre-Production Plan**:
The active design target for the game rework: a linear emotional Ridge route
through Bridge Area, Concert Area, Dance Festival Area, and Relay Spire. It can
override legacy prototype plans, but it does not describe shipped behavior until
implemented and reflected in the player manual.
_Avoid_: current runtime, shipped game, legacy prototype

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

**Ridge Area**:
A logical section of the Ridge route, such as the Bridge Area, Concert Area, or
Dance Festival Area. A Ridge Area can contain exterior space, interiors,
residents, props, Cicka Resting Spots, mini-game entrances, and one or more
runtime Phaser Scenes.
_Avoid_: hub, Phaser scene, single room, isolated mini-game silo

**Bridge Area**:
The first required Ridge Area. It contains the Blueprint Bridge Resident Beat
and teaches that helping a resident can visibly change the route.
_Avoid_: calling the whole area Blueprint Bridge, bridge hub

**Concert Area**:
The middle required Ridge Area. It contains the Concert Crossing Beat, the
Concert Resting Spot, and the guitar's first entrusted use.
_Avoid_: calling the whole area Concert Crossing, music hub

**Dance Festival Area**:
The final required Ridge Area at the foot of the Relay hill. It contains the
Opening Dance Shuttle Beat and clears the last daylight ride to Relay before
the night festival begins.
_Avoid_: calling the whole area Opening Dance Shuttle, final hub

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
An opt-in world attachment that can offer a hobby toy, reward, shortcut,
alternate solution, or just fun without being required for the core ending path.
For the current first-ending route, mini-games are optional fun and do not
count as first-ending proof; future passes may let them unlock alternate ways to
finish a level.
_Avoid_: mandatory arcade gate, generic content silo

**Cicka Home Mutation**:
A current Ridge proof-of-concept declaration that a durable progress source can
change Cicka Home, such as adding a Stampede note or opening a return fold.
Declarations without a real progress source stay typed as future promises
instead of rendering. In the newer linear story route, this should become a
compatibility detail or be replaced by local Cicka Resting Spot state.
_Avoid_: stored sticker state, generic landmark memory

**Cicka Resting Spot**:
A small local Cicka perch, loafing place, or quiet seat inside a required Ridge
Area where Cicka can be present without creating a central hub;
in the initial route it is mostly visual and has no dedicated prompt, while
later affection passes can add tiny optional comfort interactions such as
sitting together, petting, lap loafing, or playing guitar nearby.
Each v0 spot should support two tiny visual states: before its area beat
resolves, Cicka uses the spot to draw attention; after resolution, the spot
settles immediately into a calmer pose, tiny mark, or changed prop. The Guitar
Farewell montage can revisit these already-changed states, but should not be
the first time the player sees them. Noticing or revisiting these changed states
should be an optional emotional reward, never a progression requirement.
_Avoid_: Cicka Home hub, quest board, required backtracking checkpoint, inventory stash, required affection system, v0 interaction node, checklist gate

**Bridge Resting Spot**:
The Cicka Resting Spot in the Bridge Area, staged near the unsafe crossing,
blank plan, or newly completed bridge so Cicka can quietly point attention to
the first resident-help route change.
_Avoid_: tutorial UI marker, required backtracking perch

**Concert Resting Spot**:
The Cicka Resting Spot in the Concert Area, where the guitar first becomes a
comfort object and where the Open Ridge Return State can show one quiet
empty-spot echo after the farewell.
_Avoid_: abandoned guitar, shrine, required sad objective

**Dance Festival Resting Spot**:
The Cicka Resting Spot in the Dance Festival Area, staged near the operations
table, shuttle step, lantern crates, or service gate so Cicka can observe the
last social handoff before the daylight ride to Relay.
_Avoid_: route gate, dialogue station, confirmed parentage scene

**Cicka Field Presence**:
An authored Cicka appearance inside the Exploration Map where she observes,
loafs, points attention, or quietly reacts at a meaningful route beat through
subtle posture, placement, and tiny reactions instead of explicit instructions.
_Avoid_: companion AI, quest marker, follower pet, objective dispenser

**Cicka Threshold Farewell**:
The first ending beat where Cicka accompanies the player to the Relay Spire
threshold, looks back, leaves one final paw/page mark, then slips into a page
fold or light beyond the player's path without translated farewell text in the
initial version.
_Avoid_: literal death scene, grief monologue, Cicka leaving with the player, written goodbye

**Open Ridge Return State**:
The immediate post-ending Ridge state where the world remains playable with the
canonical final mark at the Relay threshold and one quiet echo at the Concert
Resting Spot before any later Micka trigger; the echo should read as an empty
usual spot with one small paw/page mark, not the player's guitar left behind.
_Avoid_: closed ending, sad objective, immediate replacement reveal, scattered sadness marks, abandoned inventory

**Guitar Farewell**:
The final shared Cicka moment where the player plays guitar for her at the Relay
Spire, echoing the visual presence, tiny marks, and accumulated memory from
Cicka Resting Spots across the Ridge.
_Avoid_: generic music mini-game, melodrama, one-off ending prop

**Sit and Play Prompt**:
The final Relay Spire interaction that starts the Guitar Farewell when the
player chooses to sit near Cicka and play guitar.
_Avoid_: rhythm UI, fail state, final skill check, objective popup

**Living Proof Montage**:
A previous name for the brief ending montage, now better treated as **Route
Memory Montage** unless a later design restores a separate proof system.
_Avoid_: full recap, credits roll, visible checklist, objective summary

**Route Memory Montage**:
A brief Guitar Farewell montage that wordlessly shows the fixed route's resident
help, world changes, and Cicka Resting Spot echoes before the final send.
_Avoid_: full recap, credits roll, visible checklist, objective summary

**Area Barricade Chain**:
The fixed first-ending route structure where Bridge, Concert, and Dance
Festival each contain one concrete local barricade whose resolution opens the
next area and finally brings the player to Relay.
_Avoid_: optional proof checklist, hub progression, abstract emotional gate

**Send the Sketchbook Prompt**:
The post-Guitar Farewell Relay Spire interaction that begins the Cicka Threshold
Farewell after the player has shared the quiet song with Cicka.
_Avoid_: automatic send, guitar-as-send-button, boss gate, extra skill check

**Relay Holding State**:
The small post-Guitar Farewell state where Cicka remains present at Relay and
the player may linger, but cannot return to the wider Ridge route until choosing
Send the Sketchbook.
_Avoid_: open backtracking, menu-only ending choice, automatic cutscene trigger

**Relay Blue Hour**:
The final send lighting state after the Guitar Farewell, where Relay has moved
from sunset warmth into blue-hour threshold light while the night festival begins
elsewhere.
_Avoid_: full night farewell, hard time cut, cold death-coded darkness

**Concert Crossing Beat**:
A mid-route Resident Beat where a blocked concert/traffic crossing becomes
the way the player earns the guitar through a small music performance problem.
_Avoid_: joke-only drunk musician, random item pickup, final-farewell skill gate

**Opening Dance Shuttle Beat**:
A final-route Resident Beat where afternoon festival setup blocks the Relay
hill service road until the player helps prepare the night dance and catches the
last daylight shuttle to the Relay Spire.
_Avoid_: Last Dance, Final Shuttle Hold, after-festival closure gate

**Last-Stop Operations Helper**:
The shy colleague in the Opening Dance Shuttle Beat who handles visible plaza
operations such as shuttle questions, setup checks, volunteer handoffs, and
service-road clearance calls.
_Avoid_: DJ, song-table volunteer, generic festival helper, niche technician

**Dance Teacher**:
The Opening Dance facilitator who teaches the hill-shuttle driver one private
step and covers the operations watch so the Last-Stop Operations Helper can
enjoy the night dance.
_Avoid_: romance target, competition judge, extra route gate, new protagonist

**Role-First Character Labels**:
Placeholder character labels that describe the resident's job in the beat before
a later naming pass, such as hill-shuttle driver, Last-Stop Operations Helper,
and Dance Teacher.
_Avoid_: premature proper names, joke aliases, final character names before role clarity

**Operations Handoff Check**:
A Readiness Favor where the player helps the Last-Stop Operations Helper prove
the plaza setup is safe enough for the Dance Teacher to watch while she enjoys
the night dance.
_Avoid_: confidence speech, therapy puzzle, arbitrary item fetch

**One-Step Practice**:
A Readiness Favor where the hill-shuttle driver privately learns one tiny dance
step so he can offer shared rhythm without pretending to be a good dancer.
_Avoid_: dance mastery, public embarrassment, required rhythm challenge

**Folded Song Request**:
The small paper invitation where the hill-shuttle driver requests a simple,
cute, guitar-friendly song and asks the Last-Stop Operations Helper for one
dance without forcing a public confession; the exact requested song does not
need to be shown or heard by the player.
_Avoid_: love letter, public proposal, player-delivered confession

**Setup Clearance Walkthrough**:
The physical route solve in the Opening Dance Shuttle Beat where final visible
festival setup details clear the service lane for the last daylight shuttle;
default symbolic snaps are securing a lantern line, clearing or taping the
service-lane obstruction, and flipping the shuttle sign to "Last daylight ride."
_Avoid_: long chore list, black-screen-only solve, abstract emotional unlock

**Prompt-Driven Playable Montage**:
A compact presentation pattern where the player triggers a few authored
interactions that snap through visible work and a time-of-day shift; the work
can be symbolic one-action prep rather than literal manual labor.
_Avoid_: pure cutscene, full manual chores, repeated object hauling

**Short Threshold Transition**:
A brief non-controllable passage that carries the player from a solved route
beat into the next playable emotional threshold, often through a line, sound
cue, blackout, and respawn.
_Avoid_: driving mini-game, long travel scene, instant unexplained teleport

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

**Resident Beat**:
An authored resident problem/story sequence inside a Ridge Area, including its
local characters, possible solutions, Cicka field presence, and visible route
change.
_Avoid_: Phaser scene, isolated quest room, dialogue hub, whole area name

**Recoverable Conversation Choice**:
A dialogue choice inside a Resident Beat that can change tone, trust,
order, optional rewards, or temporary awkwardness without permanently blocking
the first ending. A failed or clumsy choice should create an in-world recovery
path rather than a dead end.
_Avoid_: permanent fail state, gotcha dialogue, illusion-only choice

**Practical Wayfinding Loop**:
A Resident Beat discovery pattern where the player first learns a route problem
through signs, blocked paths, local roles, and travel questions before
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
A retired or provisional ending-gate term. The current first-ending route uses
the fixed **Area Barricade Chain** instead of a separate proof resource,
checklist, or optional readiness system.
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
- The **Ridge Pre-Production Plan** is the current target for the desired game
  rework; the existing Phaser Ridge is a legacy prototype/reference unless a
  task explicitly targets current runtime behavior.
- The **Sketchbook Neighborhood** should obey **Lived-In Causality** even when
  its art direction is sketchbook-like: a route change can be whimsical in
  presentation, but its blocker, helper, and resolution should feel practical
  and locally motivated.
- The **Exploration Map** uses **Exploration Traversal**.
- The first-ending route currently uses an **Area Barricade Chain**: Bridge
  Area clears into Concert Area, Concert Area clears into Dance Festival Area,
  and Dance Festival clears into Relay Ending.
- A mini-game may use its own **Mini-Game Movement System** instead of
  **Exploration Traversal**.
- The first ending path should be completable through conversation, collection,
  authored traversal, Ridge Areas, Resident Beats, and world changes without
  requiring full arcade mini-games.
- **Mini-Game Entrances** can provide optional rewards, shortcuts, alternate
  path unlocks, or pure side fun, but they should not be required first-ending
  proof for the current first ending. Future passes may let them unlock alternate
  ways to finish a level.
- **Exploration Traversal** treats jump as non-core for the v0 main path;
  vertical movement should come from **Authored Traversal Interactions** unless
  a future mobility item deliberately changes the route grammar.
- **Cicka Home Mutations** are current proof-of-concept data for the old
  hub-like blockout. The newer linear story route should prefer local
  **Cicka Resting Spots** unless a future map deliberately restores a central
  home space.
- **Cicka Field Presence** complements **Cicka Resting Spots** by making Cicka
  recur across the **Sketchbook Neighborhood** without turning her into a
  follower, solver, vendor, or quest board.
- A **Resident Help Beat** may use **Cicka Field Presence** to draw attention to
  a route blocker, but the solution should come from a resident, artifact,
  mini-game clear, or visible environment change.
- Required **Resident Help Beats** should include **Cicka Field Presence**, but
  Cicka's role can shift from obvious attention cue to changed-object observer
  to quiet trust marker.
- Each required **Ridge Area** should have one local **Cicka Resting Spot**: a
  **Bridge Resting Spot** near the crossing, **Concert Resting Spot** as a
  listening corner, and **Dance Festival Resting Spot** near operations or the
  service gate. These spots are local emotional anchors, not hubs.
- A required **Resident Help Beat** usually belongs to one **Resident Beat**
  inside a **Ridge Area**; that area can include multiple residents, interiors,
  optional interactions, and alternate solutions without becoming one Phaser
  scene.
- **Resident Beats** can use **Recoverable Conversation Choices** to make
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
  with Cicka's Relay threshold mark and one Concert Resting Spot echo.
- The **Cicka Threshold Farewell** departure should be physical and mostly
  silent: walk together, pause, look back, final mark, then page-fold/light
  departure. The initial version should use no translated farewell line; a tiny
  raw meow/chirp sound can remain optional if it supports the staging.
- The immediate return after the **Cicka Threshold Farewell** should be the
  **Open Ridge Return State**: replayable, quiet, and minimally absence-marked,
  with the canonical final mark at the Relay threshold, one quieter echo at
  the **Concert Resting Spot**, and Micka still delayed until the later
  post-ending trigger. The echo should be an empty usual spot with one small
  paw/page mark, not the guitar left behind.
- The **Guitar Farewell** should be established before the ending through the
  guitar's story role and visual Cicka Resting Spot presence. The initial route
  does not need repeatable resting-spot interactions; sitting together, petting,
  lap loafing, or playing guitar at local spots can wait for a later affection
  pass.
- The **Guitar Farewell** can include a **Route Memory Montage**, but the montage
  should stay brief and keep Cicka as the emotional focus; the player's guitar
  is the only music the player needs to hear during the montage.
- The **Sit and Play Prompt** starts the **Guitar Farewell** at Relay Spire
  without turning it into a rhythm challenge.
- The **Send the Sketchbook Prompt** should happen after the **Guitar Farewell**,
  keeping the final send as an active player choice while preserving the song as
  comfort rather than a send button.
- The Relay ending should use sunset for **Sit and Play Prompt**, then a
  **Relay Holding State** for **Send the Sketchbook Prompt**; the **Route Memory
  Montage** can show the night festival beginning elsewhere.
- The **Concert Crossing Beat** can teach the guitar through a small
  Guitar-Hero-like mini-game, but the **Guitar Farewell** itself should remain a
  cozy remembrance interaction rather than an arcade pass/fail challenge.
- The **Opening Dance Shuttle Beat** keeps the dance festival as a night event,
  but the required route action happens during daytime setup so the player can
  reach the Relay Spire for the sunset **Guitar Farewell**.
- The **Opening Dance Shuttle Beat** centers the hill-shuttle driver and the
  **Last-Stop Operations Helper** as colleagues whose practical work and private
  nervousness both delay the last daylight ride.
- The hill-shuttle driver, **Last-Stop Operations Helper**, and **Dance Teacher**
  should use **Role-First Character Labels** until a later character naming pass;
  their jobs and emotional functions matter more than proper names right now.
- The **Operations Handoff Check** is the Last-Stop Operations Helper's current
  **Readiness Favor**; the **Dance Teacher** covers the operations watch after
  setup is proven safe, keeping the cast small and letting the helper enjoy the
  dance without implying someone else planned it better.
- **One-Step Practice** is the hill-shuttle driver's current **Readiness Favor**;
  it gives him one private, imperfect step rather than turning dance into a
  public skill test.
- The **Folded Song Request** connects the two Readiness Favors by letting the
  driver ask through a subtle operations-table object instead of direct public
  matchmaking; the song should be simple, cute, and guitar-friendly, not locked
  to bachata or any other specific dance genre, and it can remain unshown and
  unheard as a specific track.
- The **Setup Clearance Walkthrough** restores the practical route blocker after
  the romantic connector by making the service lane visibly ready for the last
  daylight shuttle.
- The **Setup Clearance Walkthrough** should present as a **Prompt-Driven
  Playable Montage**, with three default symbolic snaps: secure the lantern
  line, clear or tape the service-lane obstruction, and flip the shuttle sign to
  "Last daylight ride." These can collapse further if implementation needs a
  shorter transition, but they should not become full manual chores.
- In the **Opening Dance Shuttle Beat**, **Cicka Field Presence** should read as
  a quiet threshold observer near the operations table or service gate; the
  **Unnamed Counterpart Cat** can add texture and imply future continuity, but
  it should stay visual-only and should not be named or treated as Micka.
- The ride from Last-Stop Plaza to Relay should be a **Short Threshold
  Transition**, not a controllable driving scene; a driver line, vehicle-start
  sound, brief blackout, and Relay spawn are enough.
- Required **Resident Beats** that contain arcade-like interactions should
  also have a non-arcade fallback through conversation, collection, practice, or
  a forgiving auto-resolve path.
- **Living Proof Gate** language should not imply a required proof resource in
  the current first-ending route; use **Area Barricade Chain** for progression
  and **Route Memory Montage** for the ending echo.
- The old Overworld and Hobbies scenes are transitional surfaces. Long-term,
  their best content should fold into the **Exploration Map** as artifacts,
  entrances, Cicka reactions, Basement/Potassium paths, and mini-game props.

## Example Dialogue

> **Dev:** "Should we change the Stampede room art now?"
> **Domain expert:** "No, first update the **Room Beat** in the **Typed Ridge Blockout Source** so the **Ridge Blockout** proves the shortcut back to Cicka."

> **Dev:** "Should the player always return to Cicka Home after a blocked bridge?"
> **Domain expert:** "No — in the linear story route, use a local **Cicka Resting Spot** and **Cicka Field Presence** at the bridge instead of requiring hub returns."

> **Dev:** "Can Cicka tell the player to fix the bridge?"
> **Domain expert:** "No — let **Cicka Field Presence** make the bridge feel suspicious, then resolve it as a **Resident Help Beat** with a visible route change."

> **Dev:** "Does every resident need to solve a barricade?"
> **Domain expert:** "No — required **Resident Help Beats** change routes, while optional residents can offer mini-games, atmosphere, jokes, or quiet company."

> **Dev:** "Should each resident scene be a Phaser scene?"
> **Domain expert:** "No — call the place a **Ridge Area** and the problem sequence a **Resident Beat**. Use **Phaser Scene** only for runtime implementation."

> **Dev:** "Does Cicka leave with the player at the ending?"
> **Domain expert:** "No — the **Cicka Threshold Farewell** means she walks with the player to the threshold, then departs somewhere the player cannot follow."

> **Dev:** "Should Cicka's final departure include translated text?"
> **Domain expert:** "No — the initial **Cicka Threshold Farewell** should be fully nonverbal. Use staging, the final mark, silence, and optionally a tiny raw sound instead of a written goodbye."

> **Dev:** "Where does Cicka's final mark persist after the ending?"
> **Domain expert:** "Use a minimal **Open Ridge Return State**: the canonical final mark persists at the Relay threshold, with one quieter echo at the **Concert Resting Spot** and no scattershot sad marks."

> **Dev:** "Should the Cicka Resting Spot echo leave the guitar there?"
> **Domain expert:** "No — the guitar stays with the player. The echo should be the empty usual spot plus one small paw/page mark."

> **Dev:** "Should each bridge/concert/dance area have a small Cicka resting spot?"
> **Domain expert:** "Yes — give each required **Ridge Area** one local **Cicka Resting Spot**. It keeps Cicka present across a linear route without turning any area into a hub."

> **Dev:** "What should we call the bridge/concert/dance festival chunks?"
> **Domain expert:** "Use **Ridge Area** for the logical place and **Resident Beat** for the authored problem inside it; reserve **Phaser Scene** for runtime units."

> **Dev:** "Can the final Cicka beat be the player playing guitar for her?"
> **Domain expert:** "Yes — make it the **Guitar Farewell**, but establish guitar as a quiet comfort interaction before Relay so it carries memory instead of exposition."

> **Dev:** "Can the Guitar Farewell show what happened to the residents?"
> **Domain expert:** "Yes — use a brief **Route Memory Montage** of resident/world changes, not a full recap."

> **Dev:** "Can the guitar come from a concert problem?"
> **Domain expert:** "Yes — use the **Concert Crossing Beat** to earn the guitar through a tiny performance/help moment, then let local **Cicka Resting Spots** turn it into comfort."

> **Dev:** "Does the dance festival happen at night?"
> **Domain expert:** "Yes — but the required route beat is the **Opening Dance Shuttle Beat**, where daytime setup opens one last daylight ride to Relay before the night festival begins."

> **Dev:** "Is the driver's crush the DJ?"
> **Domain expert:** "No — she is the **Last-Stop Operations Helper**, a visible plaza worker whose setup checklist and service-road handoff make her role immediately readable."

> **Dev:** "How do we help the shy operations helper without therapizing her?"
> **Domain expert:** "Use the **Operations Handoff Check**: prove the setup is ready and let the **Dance Teacher** keep watch so she can enjoy the night."

> **Dev:** "Who covers the operations watch?"
> **Domain expert:** "Use the **Dance Teacher**. They already belong in the beat as the gentle facilitator, so they can cover the watch without adding another resident role."

> **Dev:** "Do the driver and Last-Stop Operations Helper need proper names now?"
> **Domain expert:** "No — use **Role-First Character Labels** for now. Names can wait until their jobs, movement, and emotional function survive a later character pass."

> **Dev:** "How do we help the driver if he cannot dance?"
> **Domain expert:** "Use **One-Step Practice**: he learns one tiny private step, enough to ask without pretending he is suddenly good."

> **Dev:** "How does he actually ask her to dance?"
> **Domain expert:** "Use the **Folded Song Request**: a small paper invitation at the operations table, not a public confession."

> **Dev:** "Does the dance need to be bachata?"
> **Domain expert:** "No — keep bachata as loose inspiration at most. Canon should use a simple, cute, guitar-friendly requested song so the driver can plausibly dance and the Guitar Farewell montage can carry the same feeling."

> **Dev:** "Is the night festival literally hearing the same guitar song as the Relay farewell?"
> **Domain expert:** "No — treat it as an emotional echo. The requested festival song stays implied/offscreen; the only song the player needs to hear is the guitar during the **Guitar Farewell**."

> **Dev:** "How does the road physically open after the cute paper moment?"
> **Domain expert:** "Use the **Setup Clearance Walkthrough** so visible setup details clear the service lane for the last daylight shuttle."

> **Dev:** "Do we make the player manually move every chair?"
> **Domain expert:** "No — present the **Setup Clearance Walkthrough** as a **Prompt-Driven Playable Montage** with a few authored interaction snaps."

> **Dev:** "Which setup snaps should the montage use?"
> **Domain expert:** "Use three symbolic one-action snaps by default: lantern line, service-lane obstruction, and shuttle sign. They are story-readable, practical, and easy to collapse if the beat needs to be shorter."

> **Dev:** "Can Cicka hang out with another cat during the dance setup?"
> **Domain expert:** "Yes — use the **Unnamed Counterpart Cat** for implied continuity, but do not spend Micka before the post-ending return."

> **Dev:** "Should we design the other cat now?"
> **Domain expert:** "Only at silhouette/color level: a pale or light-ink contrast to Cicka, with no name, dialogue, or parentage reveal."

> **Dev:** "Do we play the shuttle ride?"
> **Domain expert:** "No — use a **Short Threshold Transition**: driver line, vehicle-start sound, brief blackout, then control resumes at Relay."

> **Dev:** "Does every obstacle need a mini-game?"
> **Domain expert:** "No — the first ending path should work through residents, conversations, collection, and world changes; **Mini-Game Entrances** can add alternate paths or side fun."

> **Dev:** "Should the Relay Spire require a boss or hard climb?"
> **Domain expert:** "No — use the **Area Barricade Chain** so the player reaches Relay after clearing the Bridge, Concert, and Dance Festival barricades."

## Flagged Ambiguities

- "map" can mean **Topology Map**, **Ridge Blockout**, or final art; resolved by naming the layer explicitly.
- "scene" can mean a design beat or a Phaser runtime scene; use **Ridge Area**
  for the logical place, **Resident Beat** for the authored problem sequence,
  and **Phaser Scene** for runtime implementation.
- "Resident Room Beat" is retired terminology; use **Ridge Area** for
  bridge/concert/dance chunks and **Resident Beat** for their authored resident
  problems.
- "bridge/concert/dance festival" names the **Bridge Area**, **Concert Area**,
  or **Dance Festival Area**; **Blueprint Bridge**, **Concert Crossing Beat**,
  and **Opening Dance Shuttle Beat** name the Resident Beats inside those
  areas.
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
- "bachata" is loose discarded inspiration, not canonical genre; use a simple,
  cute, guitar-friendly implied request for the **Folded Song Request** while
  the later **Route Memory Montage** dance image is emotionally scored by the
  player's guitar.
- "festival helper" is too generic for the driver's colleague; resolved: use
  **Last-Stop Operations Helper**.
- "name" or "alias" for Opening Dance residents should mean a **Role-First
  Character Label** for now, not a final proper name.
- "Cicka Home" is a current proof-of-concept/runtime blockout term; the newer
  linear story route should say **Cicka Resting Spot** unless a central home
  space is deliberately restored.
- "lighthouse" is current story shorthand for the **Relay Spire** as a beacon or
  overlook; keep docs on **Relay Spire** unless the final landmark is renamed.
- "another cat" during **Opening Dance Shuttle Beat** means the **Unnamed
  Counterpart Cat**, not **Micka**, whose first appearance remains after the
  first-ending return unless that timing is deliberately reopened.
