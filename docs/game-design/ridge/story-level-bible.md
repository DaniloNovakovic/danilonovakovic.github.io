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
4. The player uses a **Sit and Play Prompt** near Cicka to share a quiet
   **Guitar Farewell**, ideally under a warm sunset or other cozy threshold
   light.
5. A brief **Route Memory Montage** can appear during the guitar: Blueprint
   Bridge being used, Concert Crossing continuing, Opening Dance beginning at
   night as an emotional echo under the player's guitar, and earlier Cicka
   Resting Spots carrying accumulated marks.
6. Control returns in a small **Relay Holding State** for a **Send
   the Sketchbook Prompt**.
7. While in the Relay Holding State, the player can remain present with Cicka
   near the threshold, such as by walking around the small Relay clearing,
   sitting again, replaying a quiet guitar phrase, or using an optional comfort
   interaction if supported. The player cannot return to the wider Ridge route
   until the sketchbook is sent.
8. **Send the Sketchbook Prompt** is the final completion trigger. It is
   currently provisional in exact staging, but it should mean the player is
   ready to let the sketchbook carry the completed farewell forward.
9. Cicka walks with the player to the threshold, pauses, looks back once, leaves
   one final paw/page mark, then slips into a page fold or light beyond the
   player's path. The player does not force Cicka away. The initial version uses
   no translated farewell line.
10. The player returns to the **Open Ridge Return State** after the ending, with
   the canonical final mark preserved at the Relay threshold, one quieter echo
   at the Concert Resting Spot, and the world still open. The echo is the
   empty usual spot plus one small paw/page mark, not the player's guitar left
   behind.

Tone boundaries:

- no literal death scene
- no grief monologue
- no credits-only ending
- no arcade pass/fail challenge during the Guitar Farewell
- no explanatory departure speech and no written goodbye in the initial version;
  a tiny raw meow/chirp sound is optional only if it stays smaller than the
  silence
- no immediate replacement reveal; Micka remains delayed until the later
  post-ending trigger
- no scattering sad marks everywhere in the initial return state; use the Relay
  threshold mark plus one quiet Concert Resting Spot echo first

## Area Barricade Chain

The first-ending route is currently a fixed linear chain:

```text
Bridge Area -> Concert Area -> Dance Festival Area -> Relay Ending
```

Each required Ridge Area has a concrete local barricade. Clearing that
barricade opens the next area. Relay does not currently need a separate
"collect enough proof" or optional-area readiness system.

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
| [Dance Festival Area](./areas/03-dance-festival/README.md) | Opening Dance Shuttle Beat | Accepted final beat direction; Last-Stop Operations Helper locked as romantic partner role | Creates the last emotional readiness before Relay through afternoon setup for a night dance festival at the foot of the Relay hill | Quiet threshold observer near the lantern crates, operations table, shuttle step, or service gate; may loaf with the Unnamed Counterpart Cat | Festival setup clears enough for one last daylight shuttle to Relay before the night road closure |
| [Relay Ending Area](./areas/04-relay-ending/README.md) | Guitar Farewell / Cicka Threshold Farewell | Active ending direction | Final threshold after the Dance Festival barricade is cleared | Final field-presence spot and threshold departure | Open Ridge Return State preserves the final Relay mark and one quiet Concert echo |

## Opening Dance Shuttle Beat

Detailed local contract:
[`Dance Festival Area`](./areas/03-dance-festival/README.md).

Accepted route summary: the player reaches **Last-Stop Plaza** at the foot of
the Relay hill during afternoon setup for a night dance festival. Festival
setup blocks the service road with barriers, lantern lines, chair stacks,
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

Concert Area should read as a compact city-like concert block with small
buildings, bars, stage-adjacent storefronts, alleys, and lived-in street details
around the blocked crossing. The first prototype can use facades and silhouettes
instead of enterable buildings; later passes may add interiors, extra residents,
and hangout spaces to make the block feel more alive.

A crowd, traffic line, or gathering blocks the route while everyone waits for
the concert to start. The player can learn that the concert is late from
annoyed crowd chatter, but the area should stay compact enough that simply
wandering and talking with people can reveal the musician-side space. There the
player finds the local guitarist and learns that he cannot play because of a
clumsy show-off mishap: after a kid teased that he was old, he tried to prove
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

Current recommended solution: help a resident finish a tiny bridge
drawing/blueprint, then the finished sketch becomes the crossing. Cicka can sit
on or near the blank/missing part of the plan.

Future optional upgrade: let the player draw directly on the bridge, either as
a visual customization or a small physics/bridge-building toy. Do not make that
the required v0 solution.

Keep it tiny, obvious, and local. It should not feel like a fetch quest or a
test of platforming skill.

## Mini-Game Entrances

Mini-game ideas can attach to the Ridge without holding up the core path.

Current candidates:

- Potassium Slip: polished flagship secret / future alternate-path candidate.
- Stampede Sketch: optional Vampire Survivors-style homage / future alternate-path candidate.
- Telegraph / Clair-Obscur-style timing: optional timing/parry future alternate-path candidate.
- Concert guitar performance: small teaching toy for the guitar, with required
  non-arcade fallback.

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
- Exact Send the Sketchbook staging after the Guitar Farewell.
- Return-to-Ridge state after the Cicka Threshold Farewell.
