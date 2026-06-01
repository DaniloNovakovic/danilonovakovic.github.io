# Sketchbook Ridge

This context defines the game-design language for the gamified portfolio and its Ridge overworld work.

## Language

**Ridge Pre-Production Plan**:
The active design target for the game rework: a linear emotional Ridge route
through Bridge Area, Concert Area, Dance Festival Area, and Relay Spire. It can
override legacy prototype plans, but it does not describe shipped behavior until
implemented and reflected in the player manual.
_Avoid_: current runtime, shipped game, legacy prototype

**First Playable Route**:
The smallest complete Bridge Area -> Concert Area -> Dance Festival Area ->
Relay Spire path that proves the emotional arc without required mini-games,
optional interiors, campfire hangouts, or extra resident liveliness.
_Avoid_: v0, route MVP, prototype floor, first route prototype

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

**Ridge Stage Debugger**:
A development QA surface for Walkable Sketchbook Stages. It runs the live Ridge
stage preview and exposes route beats, Walk Rail readouts, Stage Spot movement,
Rail Perspective Cues, and debug overlays so Danilo and AI agents can tune a
Ridge Stage Composition Source. It is not the legacy Ridge Blockout Viewer or a
final art map editor.
_Avoid_: Ridge Blockout Viewer, final art editor, generic map editor

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

**Compact Ridge Stage**:
The First Playable Route topology target for each required Ridge Area: one
small, readable stage/chapter with a local entry, blocker, resident beat, Cicka
spot, visible world change, and exit composition. It can contain small depth
pockets, but it should not become a sprawling mini-map.
_Avoid_: sprawling area map, free-roam zone, multi-room maze

**Area Interior Pocket**:
A small enterable building, nook, facade interior, or side space that belongs to
the current Ridge Area. It may use a Phaser scene change if useful, but it
shares the same area progress and exists to add staged depth, richness, or
local context rather than becoming a separate Ridge Area.
_Avoid_: separate chapter, required dungeon, second mini-map

**Bridge Area**:
The first required Ridge Area. It contains the Blueprint Bridge Resident Beat
and teaches that helping a resident can visibly change the route.
_Avoid_: calling the whole area Blueprint Bridge, bridge hub

**Blueprint Bridge**:
The first required Resident Beat where the player helps the Bridge Draftsperson
complete a missing middle span on a bridge drawing or blueprint so the finished
sketch becomes the physical crossing.
_Avoid_: required physics puzzle, fetch quest, platforming test

**Toy Car Play**:
The first Cicka encounter where she peacefully plays with the Bridge
Draftsperson's tiny weight-test car before the player later realizes it is
needed for the bridge test.
_Avoid_: generic fetch quest, thief tutorial, permanent follower setup

**Cicka Parallel Play**:
The gentle Bridge interaction where the player sits or relaxes near Cicka until
she treats the toy car as shared play and lets it become usable for the bridge
test.
_Avoid_: taking the toy by force, obedient quest-item handoff, food-fetch gate

**Toy Car Bridge Test**:
The v0 auto-success presentation where the retrieved toy car rolls across the
completed bridge drawing and proves the sketch can become the physical crossing.
_Avoid_: required physics failure, hidden pass criteria, simulation-first MVP

**Cicka Treat Shortcut**:
A future optional Bridge interaction where nearby cabin food can persuade Cicka
to release the toy car, acting as an alternate path around a richer toy-car play
mini-game.
_Avoid_: required food fetch, first-route errand, replacing parallel play in v0

**Bridge Draftsperson**:
The nervous or blocked resident responsible for the Blueprint Bridge plan.
_Avoid_: wizard, quest board, generic artist-god, final proper name too early

**Role Name**:
A stable pre-production label for a resident, character, or animal before a
final proper name is accepted. Role Names are safe for docs, dialogue IDs,
implementation references, and issue writing until a focused naming/tone pass
chooses final names.
_Avoid_: throwaway final name, unstable nickname, hardcoded proper name too early

**Tone-Locked Placeholder Dialogue**:
Pre-production route dialogue that is specific enough to test implementation,
state changes, and emotional feel, but not treated as final writing. Each
required beat should have stable IDs, Role Name speakers, one to three
provisional lines or prompts, clear intent, and the route or world-state outcome
it supports.
_Avoid_: final polish pass, generic placeholder text, deep branching tree, final proper names too early

**Character Conversation Overlay**:
A reusable deliberate-conversation UI pattern for Ridge character interactions.
When the player chooses to talk, sit, or respond to a resident, exploration
pauses or the player stands still, a stylized lower-screen conversation panel
appears with a character icon or portrait, and the line text can reveal with a
typed effect before the player advances or closes it. The first version shows
one speaker and one active line at a time, while still allowing authored line
sequences to advance and switch speaker between lines. Its first character
icons should come from the local visual coherence pass for the area using the
overlay, not from generic unrelated UI symbols. While it is open, player control
and interaction target switching should freeze, but harmless ambient animation
such as paper sway, blinking, idle bobs, or line boil can continue.
_Avoid_: sticky top-of-screen debug text, ambient bark bubble, quest log,
dialogue tree by default, multiple simultaneous portraits, backlog/history,
route objective panel

**Interactive Shell Screen-Usage Investigation**:
A focused layout investigation for making interactive mode use more available
viewport space, potentially through a fullscreen or fuller-bleed game shell.
It should evaluate Ridge readability, conversation overlay placement, touch
controls, header/footer chrome, safe areas, and desktop/mobile framing before
committing to a shell rewrite.
_Avoid_: Bridge art pass, per-scene asset polish, hiding required controls,
unreviewed fullscreen-only layout, changing gameplay scale without camera tests

**Ambient Bark Bubble**:
A lightweight in-world bubble above or near a character for background flavor,
short reactions, or local noise. It does not freeze exploration, does not open
the Character Conversation Overlay, and should stay short enough to read while
moving. Implement it as a later separate issue from the first Character
Conversation Overlay pass, while keeping the data model boundaries distinct.
_Avoid_: deliberate conversation UI, required progress prompt, long dialogue
line, objective hint spam

**Prompt/Dialogue ID**:
A stable area-scoped label for a prompt, line, bark, or interaction beat before
the final text is locked. The ID lets docs, implementation issues, runtime data,
and tests point at the same beat while wording can still change.
_Avoid_: final line text, final character name, throwaway TODO label, implementation-only magic string

**Paper-Level Acceptance Check**:
A pre-implementation readiness phrase for an area-doc outcome that has not yet
been proven in runtime. The detailed checklist is owned by the Ridge milestone
plan.
_Avoid_: runtime test result, playtest evidence, implementation done state, vague design wish

**Minimum Route Cast**:
The smallest set of visible characters needed for the First Playable Route to
feel alive, readable, and emotionally staged without requiring optional
residents, hangouts, or rich crowd writing.
_Avoid_: full town cast, optional resident backlog, empty gray-box route, writing every background silhouette as required content

**Bridge Drawing Toy**:
A future optional upgrade where the player draws or customizes the bridge more
directly, potentially with simple bridge-building physics.
_Avoid_: required v0 route blocker, full simulation before route MVP

**Concert Area**:
The middle required Ridge Area: a compact small-town / varos-like concert block
at evening or night with bars, street details, the Concert Crossing Beat, the
Concert Resting Spot, and the guitar's first entrusted use.
_Avoid_: calling the whole area Concert Crossing, night-club gig, music hub

**Travel Interlude**:
A short between-area passage that implies meaningful distance, time change, or
rest between compact Ridge Areas without becoming a required vehicle mini-game.
_Avoid_: unexplained teleport, mandatory driving game, full overworld commute

**Concert-to-Dance Rest Interlude**:
The post-Concert night-to-daytime passage where the player rests after the
concert, then travels toward Dance Festival through a short non-driving
transition using the Band Roadie Van Ride; the rest can be implied or skipped in
v0, while a campfire/tent hangout can be later liveliness scope.
_Avoid_: walking all night, required driving mini-game, unexplained time skip

**Band Roadie Van Ride**:
The grounded Concert-to-Dance daytime transition where a practical band roadie /
van driver gives the player a lift because the player helped the concert and the
band is already packing up gear; the band is headed somewhere else nearby and
drops the player near Dance Festival because it is on the way.
_Avoid_: making the roadie the festival-sleep joke, required driving mini-game, making the band attend Dance Festival by default, random bus substitute

**Sneaky Cicka Arrival**:
An optional travel flavor where Cicka is present around the Concert rest/travel
beat or sneaks into/around the roadie van, while v0 can simply place her near
Dance Festival without explaining the trip.
_Avoid_: managed pet passenger, required travel explanation, companion logistics

**Festival Superfan**:
A desired recurring comic resident who talks up the Dance Festival in earlier
areas, then sleeps through the festival when it finally happens; likely
immediate post-v0 scope unless cheap to reserve in v0.
_Avoid_: making him the required driver without vehicle setup, stealing focus from area residents

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

**Walkable Sketchbook Stage**:
The accepted Ridge presentation direction: a Harold Halibut-like or theater-set
2.5D area presentation that preserves side-view interaction simplicity while
composing each area like a hand-built paper set with shallow staged depth.
_Avoid_: isometric RPG map, true 3D navigation, flat precision-platformer camera

**Coherent Sketchbook Blockout**:
The First Playable Route art target: rough and cheap enough to change, but
already art-directed enough to test Sketchbook Ridge mood, readability, Cicka
staging, blockers, resident silhouettes, before/after world changes, and the
Walkable Sketchbook Stage presentation. It is not gray-box art and not final
polish.
_Avoid_: gray-box placeholder, final art pass, polished asset set

**Ridge Stage Composition Source**:
The authorable spatial staging source for a Walkable Sketchbook Stage. It owns
major placement decisions such as the player movement track, character spots,
props, interaction anchors, foreground blockers, and camera framing before final
art is locked.
_Avoid_: scattered runtime constants, Procreate export, Tiled map, final art map

**Walk Rail**:
The authored one-dimensional movement track inside a Walkable Sketchbook Stage.
Left and right input move the player along the rail while the player's foot
anchor resolves to staged world position, scale, depth, camera, and interaction
readability. For the First Playable Route, it is the movement authority for
Ridge exploration rather than a visual helper layered over platform colliders.
_Avoid_: path, collision strip, navmesh, route, spline, platform floor

**Rail Perspective Cue**:
Scale, depth, or framing data carried by Walk Rail points so rail-attached
characters and props inherit a coherent staged perspective by default. Stage
Objects can override these cues only when local art polish needs it.
_Avoid_: per-sprite scale guessing, hidden perspective hack

**Rail-Relative Stage Depth**:
The default visual-only Walkable Sketchbook Stage draw-order rule where a Stage
Object's contact point is compared with the nearby Walk Rail: objects at or
above the rail read behind the player, while objects below the rail read in
front.
_Avoid_: manual depth guessing by default, magic foreground layer, collision depth

**Primary Walk Rail**:
The main left-to-right Walk Rail through a Compact Ridge Stage. Required route
progress stays on this rail, while any optional side pocket must stay short,
named, and clearly connected so the stage does not become a maze or free-roam
map.
_Avoid_: rail network, top-down branch graph, maze, multi-lane navigation

**Stage Spot**:
A named rail-relative placement in a Ridge Stage Composition Source, used for
characters, props, interactions, exits, camera beats, or Cicka field presence.
It attaches to a Walk Rail by progress and can use small offsets for art polish.
_Avoid_: raw coordinate, hard-coded position, invisible quest marker

**Stage Contact Point**:
The staged foot, base, or ground-touch point for a rail-attached character or
Stage Object. It is the point used to judge visual grounding and Rail-Relative
Stage Depth, rather than the sprite center or full art bounds.
_Avoid_: sprite center, bounding-box center, collision body, visual midpoint

**Stage Plate**:
A large hand-authored visual layer in a Ridge Stage Composition Source, such as
far background, close stage, or foreground frame art exported from Procreate or
another drawing tool. Stage Plates align to the declared canvas of their owning
Compact Ridge Stage; canvas width can vary by stage while height should stay
stable unless the area really needs different framing. Multiple Stage Plates
can compose one layer for long scenes, but the default workflow is a full-stage
aligned plate per layer until segmentation is needed.
_Avoid_: tilemap, collision map, gameplay source, one global Ridge canvas

**Stage Object**:
A modular character, prop, route-change piece, or foreground blocker placed by
the Ridge Stage Composition Source. Stage Objects can attach to Stage Spots and
change visibility or presentation with local beat state.
_Avoid_: baked-only prop, scattered scene sprite, final asset requirement

**Stage Presentation State**:
The visibility, placement, or presentation changes that a Ridge Stage
Composition Source derives from local route beat state. It describes how a
state looks on the stage, not the story or progression rule that changes the
state.
_Avoid_: route logic, quest state, story progression, scene if-statement web

**Stage Occluder**:
An explicit foreground Stage Object or authored depth shape that can pass in
front of the player or other rail-attached objects. Use it for player-affecting
foreground depth instead of baking gameplay-relevant occlusion into one large
front image.
_Avoid_: magic foreground layer, hidden depth mask, visual blocker as collision

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

**First Playable Interaction Vocabulary**:
The small shared verb set for the First Playable Route: move left/right,
interact or talk, inspect, enter/exit an Area Interior Pocket when present,
sit/play for Cicka or Relay guitar moments, and confirm contextual prompts.
Object handoffs can exist, but they should be immediate authored interactions
rather than inventory systems.
_Avoid_: inventory screen, freeform item combining, required rhythm/drawing/dance skill check, fail state

**First Playable Route State**:
The tiny linear progress idea for the First Playable Route: enough state to move
through the required areas without turning progress into a quest-log system.
The concrete contract is owned by the Ridge milestone plan.
_Avoid_: quest log, proof inventory, optional-area readiness score, complex save model, visible checklist

**Minimal Route Guidance**:
The First Playable Route's guidance style: readable staging and contextual
prompts instead of explicit objective tracking.
_Avoid_: quest log, checklist, minimap, objective tracker, "go talk to X" UI, repeated hint popup

**Agent-Ready Slice Contract**:
The Ridge milestone-plan checklist for deciding whether an implementation slice
is specific enough to hand to an AFK agent without asking that agent to resolve
product taste.
_Avoid_: vague area build request, taste-sensitive unresolved premise, broad "make this level" task, hidden dependency on undocumented canon

**Area Paper Pass**:
The pre-implementation documentation pass that gets required Ridge Areas ready
to slice into agent work without producing final maps, scripts, art, or runtime
proof.
_Avoid_: final level spec, pixel map, implementation ticket, polished script, final art brief

**Rough Stage Composition**:
The P1-level spatial description for a Compact Ridge Stage. It names the
left-to-right beat order, entry and exit sides, blocker location, Cicka spot,
resident or prop zone, optional Area Interior Pocket, and camera framing intent
without fixing pixel positions, collision geometry, parallax distances, or final
prop placement.
_Avoid_: exact coordinates, collision map, final prop placement, production layout pass

**Stage-Order Sketch**:
A tiny non-coordinate ASCII sketch inside an area doc that summarizes Rough
Stage Composition for first-read planning, such as entry -> Cicka/prop ->
blocker/resident -> changed route -> exit. It is a schematic beat order, not a
map.
_Avoid_: minimap, tile layout, pixel layout, final camera plan

**Bridge Tracer Slice**:
The first implementation slice after the Area Paper Pass. It proves the Bridge
route seam before Concert, Dance Festival, and Relay implementation fan out; the
done checklist is owned by the Ridge milestone plan.
_Avoid_: parallelizing all areas first, full Bridge polish, isolated tech spike, final art pass

**Bridge Visual Coherence Pass**:
The follow-up Bridge Area staging pass after the Bridge Tracer Slice. It makes
the existing Bridge route feel like an authored paper stage by grounding Cicka
and the toy car, giving the Bridge Draftsperson a distinct work zone, separating
their spaces with local terrain or trees, and unifying bridge, floor,
background, and prop placeholders into one readable handmade set.
_Avoid_: final art pass, production asset pack, generic beautification pass,
new route mechanics, expanding the Bridge Area into a larger map

**First Playable Audio Floor**:
The smallest placeholder audio layer needed to test route mood, timing, and
emotional handoffs before final songs, mix, or adaptive scoring exist.
_Avoid_: full soundtrack, final polished mix, voiced dialogue, adaptive score engine, rhythm-game-quality track, full song system

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
The Cicka Resting Spot in the Concert Area: first a hidden musician-side place
where crowd-shy Cicka watches the delay, then a relaxed band-side spot near the
opened exit where the long-term Open Ridge Return State can show one quiet
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
The route should stay readable through compact layout, NPC barks, camera
framing, prop placement, and prompt availability rather than depending on Cicka
as a hint system.
_Avoid_: companion AI, quest marker, follower pet, objective dispenser, hint system

**Cicka Threshold Farewell**:
The first ending beat where Cicka leaves the seated player through a warm
sketchbook threshold beyond the player's path after one small raw meow, without
translated farewell text in the initial version.
_Avoid_: literal death scene, grief monologue, Cicka leaving with the player, written goodbye, player escort

**Open Ridge Return State**:
The long-term post-game Ridge state where the world remains playable after the
farewell, with free travel between areas and any minimal absence echo treated as
visual staging rather than a required mark mechanic before any later Micka
trigger.
_Avoid_: first-playable reset, closed ending, sad objective, immediate replacement reveal, scattered sadness marks, abandoned inventory

**First Playable Reset Return**:
The v0 post-dedication behavior where the game returns the player to the
beginning of Bridge Area with clean route progress instead of opening a
post-game free-travel Ridge. An internal ending-seen flag may exist only as
invisible implementation or debug state; it should not create player-facing
memory, objectives, Micka setup, or altered world state in v0.
_Avoid_: post-game world, immediate Micka reveal, new objective, credits lockout, partial completed-world return, visible ending-seen marker

**Guitar Farewell**:
The final shared Cicka moment where the player chooses Sit and Play at the Relay
Spire, plays the familiar Concert guitar phrase for her, and commits to the
ending through a quiet, short, non-arcade farewell sequence.
_Avoid_: generic music mini-game, melodrama, one-off ending prop

**Concert Guitar**:
The literal guitar entrusted to the player after Concert Crossing; it remains
with the player for the rest of the first-ending route and becomes the
instrument used for the Guitar Farewell.
_Avoid_: abstract music ability, temporary quest prop, separate ending guitar

**Optional Guitar Comfort Interaction**:
A later-polish interaction where the player may sit near a Cicka Resting Spot
and play a tiny guitar phrase without changing route progression.
_Avoid_: hidden required prompt, affection checklist, extra proof token

**Sit and Play Prompt**:
The final Relay Spire interaction that starts the Guitar Farewell and commits to
the first ending when the player chooses to sit near Cicka and play guitar.
_Avoid_: rhythm UI, fail state, final skill check, objective popup, unseeded second ending prompt

**Living Proof Montage**:
A previous name for the brief ending montage, now better treated as **Route
Memory Montage** unless a later design restores a separate proof system.
_Avoid_: full recap, credits roll, visible checklist, objective summary

**Route Memory Montage**:
A brief three-flash Guitar Farewell montage that wordlessly shows the fixed
route's changed world states during the final song.
_Avoid_: full recap, credits roll, visible checklist, objective summary

**Warm Sketchbook Threshold**:
The small Relay threshold artifact that opens for Cicka beyond the player's
path, readable as warm light, a scratch-like seam, a paper hole, or a gentle
glitch-portal-like artifact rather than a literal page-edge fold.
_Avoid_: ordinary doorway, page-edge-only fold, portal the player can enter

**Dedication Card**:
A restrained non-diegetic card after Cicka's departure and the empty-sunset hold
that says "For Cicka." and "Thank you for playing.", then auto-fades without a
button prompt.
_Avoid_: message from Cicka, written goodbye, explanation of where she went, menu prompt, separate credits card, "The End" card

**Area Barricade Chain**:
The fixed first-ending route structure where Bridge, Concert, and Dance
Festival each contain one concrete local barricade whose resolution opens the
next area and finally brings the player to Relay.
_Avoid_: optional proof checklist, hub progression, abstract emotional gate

**Compact Area Transition**:
A short transition between separate compact Ridge Areas that preserves linear
progress without requiring one continuous walkable overworld geography. For the
First Playable Route, it should use a small authored handoff beat such as an
exit prompt or resident line, a quick page/ink/blackout-style transition, one
travel cue or stinger, and a respawn framed at the next area's local problem.
_Avoid_: unexplained teleport, giant continuous map requirement, hard distance scale, playable commute, vehicle mini-game, long cutscene, map screen

**Send the Sketchbook Prompt**:
A retired/provisional ending prompt. Do not use it in v0 unless the sketchbook
becomes a seeded object or interaction across the route first.
_Avoid_: unintroduced final symbol, automatic send, guitar-as-send-button, boss gate, extra skill check

**Pre-Ending Relay Linger**:
The small Relay state before choosing Sit and Play where Cicka is present and
the player may look around, sit nearby, or share a quiet optional comfort beat
before committing to the ending.
_Avoid_: open backtracking after the final song, menu-only ending choice, automatic cutscene trigger

**Relay Blue Hour**:
A retired/provisional name for a post-song send lighting state. Current v0
direction keeps the Guitar Farewell and Cicka Threshold Farewell at sunset unless
blockout proves another lighting transition is needed.
_Avoid_: full night farewell, hard time cut, cold death-coded darkness

**Concert Crossing Beat**:
A mid-route Resident Beat where a crowd or traffic line blocks the crossing
while waiting for a delayed concert, leading the player to take over for an
incapacitated local guitarist who hurt his hand or wrist while trying to prove
he was still young after a kid teased him, clear the crowd, and receive the
Concert Guitar during a goodbye beat at the opened exit.
_Avoid_: joke-only drunk musician, random item pickup, final-farewell skill gate

**Compact-Area Discovery**:
A discovery pattern where a small Ridge Area relies on readable staging,
optional chatter, and player wandering instead of a strict breadcrumb chain.
_Avoid_: over-breadcrumbed objective path, hidden critical clue, giant search space

**Forgiving Practice Riff**:
The simple guitar phrase the injured Concert guitarist teaches the player so v0
can resolve the concert through auto-success or highly forgiving prompts before
a later rhythm mini-game exists.
_Avoid_: required hard rhythm check, mastery test, full song system in MVP

**Opening Dance Shuttle Beat**:
A final-route Resident Beat where daytime festival setup progresses toward late
afternoon, blocks the Relay hill service road until the player helps prepare the
night dance, and ends with the last daylight shuttle to the Relay Spire.
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
- "Cicka departs with us" is imprecise; use **Cicka Threshold Farewell**, where
  the player remains seated while Cicka leaves through the **Warm Sketchbook
  Threshold** somewhere the player cannot follow.
- "hint" from Cicka means subtle attention guidance through staging or reaction,
  not explicit objective text like "go fix the bridge."
- "objective UI" for the First Playable Route should mean **Minimal Route
  Guidance**, not a visible quest tracker, minimap, checklist, or repeated hint
  popup.
- "ready for agent" for Ridge implementation means the issue satisfies the
  **Agent-Ready Slice Contract**, not just that the area direction is accepted.
- "last dance" previously meant an after-festival closure gate; resolved: use
  **Opening Dance Shuttle Beat** for the final dance-festival route beat.
- "bachata" is loose discarded inspiration, not canonical genre; use a simple,
  cute, guitar-friendly implied request for the **Folded Song Request** while
  the later **Route Memory Montage** dance image is emotionally scored by the
  player's guitar.
- "festival helper" is too generic for the driver's colleague; resolved: use
  **Last-Stop Operations Helper**.
- "name" or "alias" for Opening Dance residents should mean a **Role Name** for
  now, not a final proper name.
- "Cicka Home" is a current proof-of-concept/runtime blockout term; the newer
  linear story route should say **Cicka Resting Spot** unless a central home
  space is deliberately restored.
- "lighthouse" is current story shorthand for the **Relay Spire** as a beacon or
  overlook; keep docs on **Relay Spire** unless the final landmark is renamed.
- "another cat" during **Opening Dance Shuttle Beat** means the **Unnamed
  Counterpart Cat**, not **Micka**, whose first appearance remains after the
  first-ending return unless that timing is deliberately reopened.
