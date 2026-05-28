# Ridge Story/Level Bible

> Status: active route canon / in-progress design.
> Prose-first design artifact for the active Sketchbook Ridge direction. Read
> [`README.md`](./README.md) first for source-of-truth routing and
> [`decision-intake.md`](./decision-intake.md) before folding in large grilling
> or research transcripts. Track unresolved gaps in
> [`open-questions.md`](./open-questions.md). Use
> [`areas/`](./areas/README.md) for local area details.

## Status

This bible is in-progress. It records resolved story, level-design, character,
and progression decisions for the core Exploration Map route.

Current design focus: work backward from the ending while preserving the
fixed first-ending route order: Bridge Area, Concert Area, Dance Festival Area,
then Relay Ending.

Design order:

1. canonical first ending
2. fixed Area Barricade Chain
3. Dance Festival Area / Opening Dance Shuttle Beat
4. Concert Area / Concert Crossing Beat
5. Bridge Area / Blueprint Bridge
6. optional residents and Mini-Game Entrances

## Core Promise

The Ridge should read first as a **Sketchbook Neighborhood**: a lived-in paper
place where the player moves toward the Relay Spire by talking with residents,
collecting meaningful objects, noticing Cicka, and seeing routes change.

Even when the world uses sketchbook visuals, route blockers should obey
**Lived-In Causality**. Each required beat should make practical sense as a
place, a physical blockage, and a resident relationship: where does this happen,
what is actually blocking progress, and why can this person help?

The first ending path should be completable through conversations, collection,
authored traversal interactions, Ridge Areas, Resident Beats, and visible world
changes.
Mini-games attach to the world as optional fun, rewards, shortcuts, or future
alternate ways to finish a level. They should not become required first-ending
proof or the default solution for main route blockers.

## Canonical Ending

The first ending is the **Cicka Threshold Farewell**. It is the canonical ending
target; alternate endings are out of scope unless a later story/level pass proves
they add meaningful replay value without weakening Cicka's farewell.

Accepted ending outline:

1. The fixed main route carries the player through Bridge Area, Concert Area,
   and Dance Festival Area before Relay.
2. Clearing the Dance Festival barricade grants the last daylight ride to Relay.
3. Cicka appears in her final field-presence spot, calm and familiar.
4. The player uses a **Sit and Play Prompt** near Cicka to share a quiet,
   player-triggered **Guitar Farewell**, ideally under a warm sunset or other
   cozy threshold light. The first playable version should stay short and quiet:
   sit beside Cicka, play the familiar Concert guitar phrase, and let the moment
   breathe without a pass/fail challenge.
5. The first playable ending includes a brief **Route Memory Montage** during
   the guitar with exactly three soft flashes, no interaction, and no captions:
   the completed Bridge crossing, the opened Concert crossing / guitar handoff
   echo, and Dance Festival night beginning after the player leaves. Cicka
   Resting Spot echoes are later polish unless one is visually cheap and already
   established.
6. After the montage, return to Relay at sunset while Danilo keeps playing as
   the sun lowers. Do not show the stop-playing option immediately; after a
   short delay, reveal a soft prompt such as **Let the song end**. If the player
   does not press it, the guitar phrase resolves on its own. Only after that
   small musical ending and silence should Cicka move toward the threshold.
7. **Sit and Play Prompt** is the final completion trigger for the first
   ending. Do not add **Send the Sketchbook Prompt** in v0 unless the sketchbook
   becomes a seeded object or interaction across the route first.
8. After the final guitar phrase, Cicka moves toward the threshold, pauses,
   turns back toward the seated player, gives one small raw meow, then slips
   into a warm sketchbook-threshold artifact beyond the player's path. It
   should read like a small place in the page that opens for Cicka, not
   necessarily a literal fold at a paper edge: possible reads include warm
   light, a scratch-like seam, a paper hole, or a gentle glitch-portal-like
   artifact. The player cannot follow into that threshold and does not force
   Cicka away. The initial version uses no translated farewell line. Art
   direction should refine the exact threshold presentation while preserving
   this v0 read.
9. After Cicka disappears, hold on the empty sunset spot for a short silent
   beat, then fade to a restrained non-diegetic dedication card:
   **For Cicka.** / **Thank you for playing.** This card should not be presented
   as Cicka writing, speaking, or explaining the farewell. The card should hold
   briefly, then auto-fade into the clean Bridge Area reset without a button
   prompt. Do not add a separate credits card or "The End" card in v0.
10. A final trace at Relay or a quiet Concert Resting Spot echo can exist only as
   visual staging if earlier route art has taught that language. Do not present
   paw/page marks as a mechanic or required symbol in v0.
11. For the first playable version, use **First Playable Reset Return** after
   the **Dedication Card**: cleanly reset route progress and return the player
   directly to the beginning of Bridge Area rather than opening a post-game
   free-travel Ridge or title/menu return. Long-term, this can become an
   **Open Ridge Return State** where the player can freely move between
   completed areas after the farewell, but that pays off only once optional
   mini-games, return content, and completed-area revisits exist.
   Do not surface any visible ending-seen memory in v0: no Micka, no changed
   post-ending world, no special marker, and no new objective after reset.

Tone boundaries:

- no literal death scene
- no grief monologue
- no credits-only ending
- no separate credits card or "The End" card in v0; the **Dedication Card** is
  the full end card
- no arcade pass/fail challenge during the Guitar Farewell
- no explanatory departure speech and no written goodbye in the initial version;
  Cicka's only farewell sound is one tiny raw meow before she crosses the
  threshold, and it should stay smaller than the silence
- the dedication card is non-diegetic; do not present it as a message from
  Cicka or as an explanation of where she went
- no immediate replacement reveal; Micka remains delayed until the later
  post-ending trigger
- no scattering sad marks everywhere in the initial return state; use at most a
  minimal visual absence echo if the route has already taught that language

## Area Barricade Chain

The first-ending route is currently a fixed linear chain:

```text
Bridge Area -> Concert Area -> Dance Festival Area -> Relay Ending
```

Each required Ridge Area has a concrete local barricade. Clearing that
barricade opens the next area. Relay does not currently need a separate
"collect enough proof" or optional-area readiness system.

For the first playable route, treat the areas as separate compact maps connected
by short transitions rather than one continuous walkable geography. This gives
each area freedom to have its own time of day, environment, and staging while
still reading as a linear route. Distance between areas can stay ambiguous, with
background composition, distant Relay silhouettes, signage, or skyline changes
implying progress toward the final ridge.

Current time-of-day arc: Bridge begins during the day at a nature/hill edge;
Concert moves into evening/night small-town festival energy; a short sleep/rest
interlude carries the player from Concert night to Dance Festival daytime
arrival; Dance Festival plays from daytime setup into later afternoon; Relay
uses sunset for Sit and Play and the Cicka Threshold Farewell.

Current Concert-to-Dance transition direction: after the night concert, the
route should rest instead of sending the player walking through the night. The
rest can be implied or skipped in v0; a small post-concert campfire/tent hangout
can become later liveliness scope for talking with characters, playing with
Cicka, or adding a tiny optional toy. Morning travel toward Dance Festival uses
a grounded **Band Roadie Van Ride**. The transport role is a band roadie / van
driver from the Concert area, not the injured guitarist. The roadie is a
practical, helpful character who offers the ride because the player saved the
concert and the band is already packing up gear; he should not own the
sleep-through-festival joke. The roadie/band do not need to attend the Dance
Festival. They are headed somewhere else nearby, such as a local hospital or
clinic for the guitarist's wrist, another gig route, band storage, or an
unexplained practical destination, and Dance Festival road is on the way.
Cicka can be present if the later campfire/tent rest is shown, and she may
arrive near Dance Festival by sneaking into or around the van. V0 does not need
to explain her travel; she can simply appear nearby as authored field presence.

A separate recurring **Festival Superfan** is desired for the game, but can wait
until the immediate post-v0 liveliness pass if the first route prototype is
already cast-heavy. His running joke: he mentions at Bridge that he is excited
for the Dance Festival, talks about it again at Concert, then sleeps through it.
Keep this role separate from the driver unless a later staging pass finds a
clean vehicle reason.

Earlier "Living Proof" language should be treated as poetic shorthand for the
meaning of completed area changes, not as a required mechanic, resource, or
checklist. If a later version restores optional ordering or alternate endings,
the gate can be reconsidered.

## Cicka

Cicka is a recurring field presence, not a continuous follower or objective
giver. Required Ridge Areas should include authored Cicka appearances,
but her role should evolve:

- early: subtle attention cue near an obstacle
- middle: observer of a changed object or resident moment
- late: quiet trust marker near the threshold

Bridge Area can serve as the first Cicka encounter. In the current accepted
opening, the game begins with a simple walk-right control introduction from a
hill or nature edge before the bridge problem is visible. Cicka first appears
peacefully playing with the Bridge Draftsperson's tiny toy car / weight-test
prop, and the player can meet her through a tiny pet/play interaction before
knowing the toy matters. After the player reaches the blocked bridge and learns
the test car is missing, they can infer that Cicka has it and return to retrieve
it through **Cicka Parallel Play**: the player sits or relaxes near Cicka long
enough that she treats the toy as shared play, bats or rolls it toward the
player, and eventually lets it become usable for the bridge test. After this
first meeting, she should not become a continuous follower; she becomes a
recurring authored field presence across meaningful route beats.

Each required Ridge Area should include one local **Cicka Resting
Spot**: a small perch, loafing place, or quiet seat where Cicka can be present
without making the player return to a central hub. This replaces **Cicka Home**
as the canonical story-route anchor for the current linear three-beat shape;
the existing Cicka Home blockout can remain a proof-of-concept implementation
detail until the route is rewritten.

Initial scope: keep these spots mostly visual. They can hold Cicka posture,
changed-object memory, tiny marks, and later absence echoes without needing an
interaction prompt. Do not add a dedicated resting-spot prompt in v0; keep the
only explicit comfort prompt as **Sit and Play** at Relay for the **Guitar
Farewell**. A later affection pass can add optional sitting together, petting,
Cicka jumping into the player's lap, or Cicka loafing on the player while
resting.

Each resting spot should have two tiny visual states:

- **Before area beat resolution**: Cicka uses the spot to draw attention to a
  local problem, route blocker, or emotional handoff.
- **Immediately after area beat resolution**: the spot becomes calmer through a
  settled pose, tiny mark, changed prop, or quiet absence echo.

The Guitar Farewell montage may revisit these changed resting-spot states, but
it should not be the first time the player sees them. The world should feel
responsive during play, not only during the ending.

The player is never required to notice, inspect, or revisit changed resting
spots to progress. They are readable rewards and emotional continuity for
players who look, not route gates or checklist items.

Use practical design labels for these spots:

| Area | Practical resting spot label | Before resolution | After resolution |
| --- | --- | --- | --- |
| [Bridge Area](./areas/01-bridge/README.md) | Bridge Resting Spot | Cicka perches near the unsafe crossing or blank plan | Cicka settles near the completed bridge sketch or leaves a tiny mark by the crossing |
| [Concert Area](./areas/02-concert/README.md) | Concert Resting Spot | Cicka avoids the crowd and watches from a hidden musician-side place near the guitar case, stage props, or injured guitarist | Cicka chills with the musicians near the opened exit, optionally being quietly pet by the injured guitarist or another band member; this can later become the post-ending echo spot |
| [Dance Festival Area](./areas/03-dance-festival/README.md) | Dance Festival Resting Spot | Cicka loafs near the operations table, shuttle step, lantern crates, or service gate | Cicka settles near the cleared service gate or finished shuttle sign, optionally beside the Unnamed Counterpart Cat |

## Guitar

The guitar is a meaningful comfort item. It should enter mid-route through a
Resident Beat as an entrusted reward or responsibility, not as a random
pickup.

After the player receives it, the guitar should feel present as a carried
comfort item, but v0 does not need repeatable guitar prompts at every resting
spot. The required playable comfort moment is the Relay **Guitar Farewell**.
The only required guitar uses in the first-ending route are the Concert
performance and the Relay **Sit and Play** interaction. Optional later polish can
let the player sit at Cicka Resting Spots and play a tiny phrase there, but
these should stay optional comfort interactions rather than route gates.

Petting, lap resting, and similar affection interactions are later polish
passes. A hug is optional and should wait until character art can support it
cleanly.

## Required Ridge Areas

Start with three required main-path Ridge Areas before the Relay ending. Each
Ridge Area can contain one main Resident Beat plus local interiors, optional
interactions, and runtime Phaser Scenes.

Area-specific accepted details live in [`areas/`](./areas/README.md). Keep this
bible focused on the route spine, cross-area dependencies, and ending logic.

Current required route spine:

```text
Bridge Area / Blueprint Bridge -> I can change the world by making something through art.
Concert Area / Concert Crossing Beat -> I can turn memory into comfort.
Dance Festival Area / Opening Dance Shuttle Beat -> Life can keep moving with someone new.
Relay Spire / Guitar Farewell -> I am ready for Cicka's threshold farewell.
```

| Area | Resident Beat | Status | Route role | Cicka role | World change |
| --- | --- | --- | --- | --- | --- |
| [Bridge Area](./areas/01-bridge/README.md) | Blueprint Bridge | Accepted first art/drawing beat | Required soft gate tutorial for resident help | Obvious subtle attention cue at unsafe edge or blank plan | Finished bridge sketch becomes the crossing |
| [Concert Area](./areas/02-concert/README.md) | Concert Crossing Beat | Accepted middle beat | Blocks a concert/traffic crossing and earns the guitar | Crowd-shy observer near hidden musician-side space, then relaxed with the band after the crossing opens | Concert continues; crossing opens; guitar entrusted to player |
| [Dance Festival Area](./areas/03-dance-festival/README.md) | Opening Dance Shuttle Beat | Accepted final beat direction; Last-Stop Operations Helper locked as romantic partner role | Creates the last emotional readiness before Relay through daytime setup that progresses toward late afternoon for a night dance festival at the foot of the Relay hill | Quiet threshold observer near the lantern crates, operations table, shuttle step, or service gate; may loaf with the Unnamed Counterpart Cat | Festival setup clears enough for one last daylight shuttle to Relay before the night road closure |
| [Relay Ending Area](./areas/04-relay-ending/README.md) | Guitar Farewell / Cicka Threshold Farewell | Active ending direction | Final threshold after the Dance Festival barricade is cleared | Final field-presence spot and threshold departure | First playable cleanly resets to Bridge Area after the Dedication Card; long-term Open Ridge Return State can keep the completed world open after the farewell |

## Opening Dance Shuttle Beat

Detailed local contract:
[`Dance Festival Area`](./areas/03-dance-festival/README.md).

Accepted route summary: the player reaches **Last-Stop Plaza** at the foot of
the Relay hill during daytime setup for a night dance festival, then the beat
progresses toward the late-afternoon last daylight shuttle. Festival setup
blocks the service road with barriers, lantern lines, chair stacks,
stage/speaker cables, and a locked gate. The last daylight hill shuttle can
leave only after the setup lane is safe.

The player helps the **hill-shuttle driver** and **Last-Stop Operations Helper**
through two dignity-preserving Readiness Favors: **One-Step Practice** for the
driver and **Operations Handoff Check** for the helper. The connector is a
small **Folded Song Request**, followed by a **Setup Clearance Walkthrough** that
opens the service lane for the final ride to Relay.

The beat should stay practical first and romantic second. The player's natural
question is "How do I get to Relay?", while the shy dance promise emerges from
local behavior and observation. The actual night dance can remain promised and
then echo in the Guitar Farewell montage.

## Concert Crossing Beat

Detailed local contract:
[`Concert Area`](./areas/02-concert/README.md).

Concert Area should read as a compact small-town / varos-like concert block at
evening or night, with small buildings, bars, stage-adjacent storefronts,
alleys, street lights, and lived-in festival details around the blocked
crossing. The first prototype can use facades and silhouettes instead of
enterable buildings; later passes may add interiors, extra residents, and
hangout spaces to make the block feel more alive.

A crowd, traffic line, or gathering blocks the route while everyone waits for
the concert to start. The player can learn that the concert is late from
annoyed crowd chatter, but the area should stay compact enough that simply
wandering and talking with people can reveal the musician-side space. There the
player finds the local guitarist and learns that he cannot play because of a
clumsy show-off mishap: after a kid teased him about being old, he tried to prove
he was still young by doing an absurd concert stunt, such as playing guitar
while riding a skateboard on one leg, and hurt his hand or wrist. The player
learns one **Forgiving Practice Riff** and takes over the concert. In v0, the
concert performance can be auto-success or highly forgiving so the main route is
not blocked by rhythm-game production. After the first playable route lands, a
Guitar-Hero-like or Baka Mitai-style button-rhythm guitar mini-game can become
the richer expression, potentially using Danilo's real guitar/song material and
generated button prompts from authored song data. Once the performance begins,
the crowd/traffic clears. After the concert, the musician or band waits near
the opened exit for a short goodbye/reward beat where the guitarist entrusts
the guitar to the player. This is the same physical guitar the player carries
for the rest of the game and uses at Relay for the **Guitar Farewell**.

The ideal later version can include a small Guitar-Hero-like performance
mini-game. The required v0 route should use forgiving practice or auto-success
performance first.

The first blockout floor is: blocked crowd/traffic crossing, 2-3 annoyed crowd
NPCs, hidden musician-side nook, injured guitarist, one forgiving practice
interaction, auto-success concert start, crowd clears, goodbye/reward at the
opened exit, guitar received, and Cicka hidden before/chilling with the band
after.

Avoid making the guitarist a joke-only drunk if it undercuts the later tribute.
Gentle comedy, clumsiness, and foolishness are welcome; the guitar's emotional
role needs room to breathe.

## Blueprint Bridge

Detailed local contract:
[`Bridge Area`](./areas/01-bridge/README.md).

The **Bridge Area** should contain the first required Resident Beat,
**Blueprint Bridge**: a required art/drawing soft gate. It teaches:

```text
Cicka noticed something -> a resident needs local help -> the route visibly changes
```

Current recommended solution: the player first meets Cicka peacefully playing
with the **Bridge Draftsperson**'s tiny toy car / weight-test prop, then later
recontextualizes that toy as the missing bridge test car after reaching the
blocked crossing. The Draftsperson is a tiny nervous or blocked planner
responsible for the crossing blueprint. The player retrieves the toy car from
Cicka through **Cicka Parallel Play**, then helps finish the bridge
drawing/blueprint by drawing or visually completing the bridge. The
Draftsperson's specific problem is a missing middle span: they keep erasing and
redrawing it because they are overthinking whether the structure will hold.
Failed doodles, eraser marks, and the toy car/weight-test prop make this
readable and support a future bridge-physics toy. The finished sketch becomes
the crossing. For v0, this can be a basic authored drawing/completion visual
rather than a full freeform drawing system, and the toy car test should be
auto-success presentation: place or bring the toy car to the completed
blueprint, roll it across the drawn bridge, then let the sketch become the real
crossing.

Future optional upgrade: let the player draw directly on the bridge, either as
a visual customization or a small physics/bridge-building toy, potentially
testing whether the drawn bridge can carry a car or similar weight. Do not make
that the required v0 solution.

Keep it tiny, obvious, and local. It should not feel like a fetch quest or a
test of platforming skill.

The first blockout floor is: walk-right nature/hill intro, peaceful Cicka + toy
car first encounter, basic sit/play interaction, blocked bridge, Bridge
Draftsperson + missing middle span blueprint, return to Cicka for Cicka
Parallel Play, toy car bridge test, simple bridge drawing completion visual,
bridge becomes crossing, and Cicka settles near the completed crossing. Cabin,
food, physics simulation, and toy-car ping-pong are later optional layers.

## Mini-Game Entrances

Mini-game ideas can attach to the Ridge without holding up the core path.

Current candidates:

- Potassium Slip: polished flagship secret / future alternate-path candidate.
- Stampede Sketch: optional Vampire Survivors-style homage / future alternate-path candidate.
- Telegraph / Clair-Obscur-style timing: optional timing/parry future alternate-path candidate.
- Concert guitar performance: small teaching toy for the guitar, with required
  non-arcade fallback.
- Bridge drawing/physics: future bridge-building toy after the route MVP is
  proven; v0 should use an authored drawing/completion visual.
- Toy-car parallel play: future tiny back-and-forth Cicka game after the route
  MVP is proven; v0 should be a short sit/play/share interaction.
- Cabin/treat shortcut: future optional Bridge interaction where the player can
  bring food to Cicka as an alternate way to retrieve the toy car, such as a
  shortcut around the toy-car parallel-play mini-game rather than required v0
  route logic.

Mini-games may unlock alternate paths, shortcuts, rewards, or just exist for
fun. In the current first-ending route they are not required proof. Future
passes can let them unlock alternate ways to finish a level.

## Open Design Slots

Track unresolved gaps in [`open-questions.md`](./open-questions.md). Area-local
slots live in the matching [`areas/`](./areas/README.md) file.

Current cross-area hot spots:

- Required resident cast names and silhouettes.
- Optional resident cast and hangout spaces.
- Concert guitar acquisition as an ending dependency.
- Return-to-Ridge state after the Cicka Threshold Farewell.
