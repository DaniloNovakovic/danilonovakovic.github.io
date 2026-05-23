# Ridge Story/Level Bible

> Prose-first design artifact for the next Sketchbook Ridge direction. This file
> should be accepted before a Ridge runtime or blockout rewrite starts.

## Status

This bible is in-progress. It records resolved story, level-design, character,
and progression decisions for the core Exploration Map route.

Current design focus: work backward from the ending by detailing **Dance
Festival Area / Opening Dance Shuttle Beat** before Concert Area / Concert
Crossing Beat and Bridge Area / Blueprint Bridge.

Design order:

1. canonical first ending
2. Living Proof Gate readiness
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
Mini-games attach to the world as optional alternate paths, proof sources,
rewards, shortcuts, or pure side fun.

## Canonical Ending

The first ending is the **Cicka Threshold Farewell**. It is the canonical ending
target; alternate endings are out of scope unless a later story/level pass proves
they add meaningful replay value without weakening Cicka's farewell.

Accepted ending outline:

1. The player reaches Relay Spire and can stand there before it is ready.
2. Once Living Proof is enough, the Relay sign becomes readable.
3. Cicka appears in her final field-presence spot, calm and familiar.
4. The player uses a **Sit and Play Prompt** near Cicka to share a quiet
   **Guitar Farewell**, ideally under a warm sunset or other cozy threshold
   light.
5. A brief **Living Proof Montage** can appear during the guitar: Blueprint
   Bridge being used, Concert Crossing continuing, Opening Dance beginning at
   night as an emotional echo under the player's guitar, and earlier Cicka
   Resting Spots carrying accumulated marks.
6. Control returns in **Relay Blue Hour** at the Relay sign/spire for a **Send
   the Sketchbook Prompt**.
7. Cicka walks with the player to the threshold, pauses, looks back once, leaves
   one final paw/page mark, then slips into a page fold or light beyond the
   player's path. The initial version uses no translated farewell line.
8. The player returns to the **Open Ridge Return State** after the ending, with
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

## Living Proof Gate

The Relay Spire can be physically reachable before it can send. The blocker is
that the sketchbook is not ready yet: the path has not created enough visible
world changes, proofs, and Cicka familiarity.

The gate should feel like emotional and semantic readiness, not an exact visible
checklist. The route to Relay should naturally provide enough resident help and
cat familiarity for the first ending.

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
| Bridge Area | Bridge Resting Spot | Cicka perches near the unsafe crossing or blank plan | Cicka settles near the completed bridge sketch or leaves a tiny mark by the crossing |
| Concert Area | Concert Resting Spot | Cicka watches the guitar case, stage edge, or blocked crossing | Cicka rests in a quiet listening corner near the opened crossing; this can later become the post-ending echo spot |
| Dance Festival Area | Dance Festival Resting Spot | Cicka loafs near the operations table, shuttle step, lantern crates, or service gate | Cicka settles near the cleared service gate or finished shuttle sign, optionally beside the Unnamed Counterpart Cat |

## Guitar

The guitar is a meaningful comfort item. It should enter mid-route through a
Resident Beat as an entrusted reward or responsibility, not as a random
pickup.

After the player receives it, the guitar should feel present as a carried
comfort item, but v0 does not need repeatable guitar prompts at every resting
spot. The required playable comfort moment is the Relay **Guitar Farewell**.

Petting, lap resting, and similar affection interactions are later polish
passes. A hug is optional and should wait until character art can support it
cleanly.

## Required Ridge Areas

Start with 2-3 required main-path Ridge Areas before the first ending. Each
Ridge Area can contain one main Resident Beat plus local interiors, optional
interactions, and runtime Phaser Scenes. Treat the exact count as a Level
Designer and Story/Tone tuning variable.

Current required route spine:

```text
Bridge Area / Blueprint Bridge -> I can change the world by making something through art.
Concert Area / Concert Crossing Beat -> I can turn memory into comfort.
Dance Festival Area / Opening Dance Shuttle Beat -> Life can keep moving with someone new.
Relay Spire / Guitar Farewell -> I am ready for Cicka's threshold farewell.
```

| Area | Resident Beat | Status | Route role | Cicka role | World change |
| --- | --- | --- | --- | --- | --- |
| Dance Festival Area | Opening Dance Shuttle Beat | Accepted final beat direction; Last-Stop Operations Helper locked as romantic partner role | Creates the last emotional readiness before Relay through afternoon setup for a night dance festival at the foot of the Relay hill | Quiet threshold observer near the lantern crates, operations table, shuttle step, or service gate; may loaf with the Unnamed Counterpart Cat | Festival setup clears enough for one last daylight shuttle to Relay before the night road closure |
| Concert Area | Concert Crossing Beat | Accepted middle beat | Blocks a concert/traffic crossing and earns the guitar | Points attention to guitar case, string, stage, or crossing | Concert continues; crossing opens; guitar entrusted to player |
| Bridge Area | Blueprint Bridge | Accepted first art/drawing beat | Required soft gate tutorial for resident help | Obvious subtle attention cue at unsafe edge or blank plan | Finished bridge sketch becomes the crossing |

## Opening Dance Shuttle Beat

The **Dance Festival Area** should contain the final required Resident Beat,
**Opening Dance Shuttle Beat**. It should be romantic, warm, and
different from the Guitar Farewell. Two fictional residents like each other but are too
nervous to step onto the dance floor or talk directly. The night dance festival
is real, but the player participates in afternoon setup and leaves before the
festival fully begins. The player helps make the event ready, prepares one
nervous partner for a future dance, and helps the pair find enough rhythm to
meet without turning the beat into public matchmaking.

Accepted geography and blocker: the dance happens in a small town square,
community hall, or festival street at the foot of the Relay hill, where a local
dance night naturally belongs. The route to the Relay Spire is blocked by a
practical final-approach problem: festival setup temporarily occupies the
service road with barriers, lantern lines, chair stacks, stage/speaker cables,
and a locked gate. Once setup is safe enough, the steward can open one short
daylight window for the final hill shuttle before the road closes again for the
night festival. The player helps the hill-shuttle driver, the Last-Stop
Operations Helper, and nearby festival helpers finish that setup window, giving
the driver a believable reason and means to take the player toward the Relay
overlook at sunset.

Accepted arrival premise: **Opening Dance Setup + Last Daylight Shuttle**. This
replaces the previous after-festival **Last Song Table + Final Shuttle Hold**
candidate. The stable spine is now:

```text
Last-Stop Plaza at the foot of the Relay hill.
Festival setup blocks the service road.
Sign: "Service road closes for night dance. Last daylight shuttle after setup check."
```

On arrival, the hill-shuttle driver stands beside the shuttle near the locked
service-road gate, checking the same route clipboard too many times. He cannot
drive yet because setup is still blocking the service lane and the steward will
not open the barrier until the lane is safe. He is genuinely working the
afternoon/evening event shuttle shift, but the clipboard is also a safe place to
hide from asking one small question before the dance begins.

The romantic partner is the shy **Last-Stop Operations Helper**. She works the
visible plaza table that sits between the shuttle, dance setup, and service-road
barrier: shuttle questions, setup checklist, lantern tags/signs, volunteer
handoff, and radioing the steward when the lane is clear. She is not a flashy
performer; she is the trusted local who keeps the last-stop plaza from becoming
confused. Emotionally, the operations table lets her keep being useful instead
of becoming visible enough to be asked to dance.

Supporting static residents:

- traveler near the plaza entry: points the player toward the shuttle and
  explains that Relay requires the last daylight hill shuttle
- festival steward near the barrier: explains that the service road opens only
  after setup is safe and closes again when the night festival begins
- **Dance Teacher** near the floor: offers gentle facilitation, teaches one small
  step, covers the operations watch once setup is proven safe, and notices that
  two shy people are orbiting each other, but is not the romance target

Accepted discovery pattern: use a **Practical Wayfinding Loop**, not a quest
giver. The player arrives asking how to reach Relay, notices the closed
service-road barrier and shuttle sign, then learns from practical local roles
that the final daylight shuttle leaves after setup passes inspection and before
the road closes for the night dance.

First-read sequence:

```text
Player arrives at Last-Stop Plaza.
Festival barriers, lantern lines, and shuttle sign show the route is blocked.
Traveler says Relay requires the last daylight hill shuttle.
Driver is visible by the shuttle, stuck on the route clipboard.
Operations helper is visible near the dance floor, stuck perfecting setup details.
Steward explains that the road opens after setup check, then closes for night.
```

The player's natural question should be "How do I get to Relay?", not "How do I
fix the romance?" The romantic problem should emerge only after the player asks
why the last daylight shuttle is delayed and notices that the driver and
operations helper are both hiding inside practical work.

Accepted conversation discovery pattern: **Triangulated Discovery Flow**. The
player should be able to talk to the driver and Last-Stop Operations Helper first and
receive practical but incomplete answers:

```text
Driver: cannot leave until setup clears and the steward opens the service gate.
Operations helper: cannot stop fixing setup details until someone trusted checks the handoff.
```

Both answers are true, but they do not explain why the two are hiding inside
work instead of making a small social move. The player can then return to the
plaza and ask nearby locals what is going on.

Possible local reads:

- traveler: "The driver's been rereading that clipboard for ten minutes."
- festival steward: "The shuttle waits on the lane. She waits on one perfect
  lantern. He waits on anything except asking."
- **Dance Teacher**: "They both know where the floor is. They are practicing the
  art of being unavailable."

This lets the player piece together the relationship from public behavior and
local observations rather than receiving an instant confession or omniscient
quest explanation.

The player should not be able to solve the beat immediately by confronting the
driver and Last-Stop Operations Helper with "you like each other." That would likely make
shy people defensive and would flatten the scene into forced matchmaking.
Instead, Opening Dance should use two **Readiness Favors**, one for each
romantic character, before the setup handoff, last daylight shuttle, and later
night-dance promise can happen.

Current readiness direction:

- driver insecurity: he does not know how to dance and does not want to
  embarrass himself in front of the Last-Stop Operations Helper
- Last-Stop Operations Helper insecurity: if she stays useful behind an
  organizer role, she knows who she is; if she steps onto the floor, she is just
  someone hoping to be asked

The Readiness Favors should let the player help each person feel prepared while
preserving their dignity.

- Last-Stop Operations Helper: **Operations Handoff Check**. The player helps
  her prove the plaza setup is safe enough by checking a few visible festival
  details, then getting the **Dance Teacher** to keep watch once the night dance
  starts. The emotional point is not that someone else can plan better; it is
  that she has done enough and the event can keep going while she enjoys it.
- Hill-shuttle driver: **One-Step Practice**. The player helps him learn exactly
  one tiny dance step from the **Dance Teacher**, privately enough to protect his
  dignity. He does not become good at dancing; he gains one small shared rhythm
  he can offer later.

After both romantic characters are ready, the connector is **Folded Song
Request**. The driver writes a tiny folded paper request at the operations
table, requesting a simple, cute song and asking her for one dance later without
making a public confession. The request should not lock the beat to bachata or
any other specific dance genre; it should feel playable on guitar, simple enough
for a non-dancer, and emotionally compatible with the later Guitar Farewell
montage. The exact requested song does not need to be shown or heard by the
player; the only presented music can be the guitar during the farewell. It can
use her own event paper, handwriting marks, or song-request language so the ask
feels rooted in her work rather than imposed by the player.

Required relocation should stay minimal. After the player helps, the driver and
Last-Stop Operations Helper can share or acknowledge the Folded Song Request,
then return to their practical roles for the **Setup Clearance Walkthrough**:
the remaining visible setup details clear the service lane enough for the
steward to open the barrier and the driver to offer the last daylight ride
toward Relay. Present this as a **Prompt-Driven Playable Montage**, not a full
manual chore sequence or pure cutscene. The player chooses a prompt such as
"Help with remaining preparations," then triggers a few authored interaction
snaps. Default symbolic set: secure the lantern line, clear or tape the
service-lane obstruction, and flip the shuttle sign to "Last daylight ride."
Treat these as one-action story beats rather than small chore gameplay; they
can collapse further if the beat needs to move faster. After the snaps, the sky
warms, the plaza reads more ready, the **Dance Teacher** keeps watch, and the
steward opens the gate. The actual dance can remain a promised night-festival
moment and/or appear in the Guitar Farewell montage.

Locked route-agent: the nervous dance resident is the **hill-shuttle driver**.
He runs the last practical route up toward the Relay overlook, but he is stuck
at the festival because the service road is not yet clear and because he cannot
bring himself to ask about the night dance. His daily job, his emotional
problem, and the player's route blocker should all point at the same practical
situation. Do not assign him a proper name yet; the role label is enough until a
later character pass.

Locked romantic partner: the shy **Last-Stop Operations Helper**. She belongs in
this place because her daily work sits between the dance, the service-road
barrier, and the last daylight shuttle without requiring technical explanation.
She likes the driver because he is quietly reliable: he waits for helpers to
finish packing, remembers nervous passengers, and takes the hill road gently. He
likes her because she notices small things and keeps the last-stop plaza feeling
kind. Do not assign her a proper name yet; the role label is the canonical
placeholder until her movement and emotional function are stable.

The **Dance Teacher** exists as a facilitator rather than the romance target.
They teach one small step, give the player social cover, cover the operations
watch after the handoff, and notice that two shy people are orbiting each other.
Avoid turning the beat into a competition for the teacher's attention unless a
later tone pass proves it can stay gentle.

Conversation design should use **Recoverable Conversation Choices**. The player
should feel agency through what they ask, who they approach first, how they
encourage the driver, and how they recover from a clumsy read. A failed path can
create awkwardness, delay, or require extra listening, but it should not
permanently block the first ending.

Do not use a purely magical or abstract "dance crossing" explanation. This beat
must answer:

- where a dance naturally belongs in the final approach environment
- what physical barricade prevents the player from reaching the Relay Spire
- why the resident being helped has a believable reason and practical way to
  help with that barricade
- what small backstory or daily purpose makes each involved resident feel like a
  local person rather than a route-solving robot

The couple should be emotionally inspired by Danilo and Milena's story without
being literal stand-ins. Protect the intimacy: carry the emotional truth through
fictional residents, not a private memory exhibit.

The main solution should be conversation, collection, and gentle setup. An
optional dance/rhythm mini-game can deepen the beat later, but the first ending
path should not depend on arcade performance.

Cicka does not explain love or grief. She watches from the edge of the dance
setup, perhaps walking through the cleared lane afterward as if the whole thing
was obvious. She can also hang out with the **Unnamed Counterpart Cat** near the
operations table or service gate: loafing together, staring at the same lantern,
or briefly playing while the humans work. The counterpart cat can visually
contrast with Cicka, such as a pale or white cat if Cicka reads dark, so that
Micka's later half-and-half design feels quietly prepared. Do not name him,
label him as Micka's father, or confirm parentage before the post-ending return.
The player catches the sunset shuttle to Relay through a **Short Threshold
Transition**, not a controllable driving scene. The driver can say a small line
such as "All aboard the last ride," the vehicle starts over a brief blackout,
and the player respawns at Relay Spire under sunset. Control resumes at Cicka's
overlook spot for the **Sit and Play Prompt** and **Guitar Farewell**. The later
night festival can appear as a **Living Proof Montage** image during the
farewell instead of pulling the playable ending away from Cicka; the dancing can
read as an emotional echo of the player's guitar rather than revealing or
playing the actual requested festival song. After the
montage, Relay returns in **Relay Blue Hour** for the **Send the Sketchbook
Prompt** rather than full night. The emotional lesson is that life can continue
and new love can arrive after loss without replacing what was lost.

## Concert Crossing Beat

A blocked concert/traffic crossing halts the route because the local guitarist
cannot play, the paper-stage setup is tangled, or the guitar needs a small
repair. The player helps the resident, learns the guitar, and receives or is
entrusted with the guitar afterward.

The ideal version can include a small Guitar-Hero-like performance mini-game.
The required route must also have a non-arcade fallback through conversation,
collection, practice together, or forgiving auto-play.

Avoid making the guitarist a joke-only drunk if it undercuts the later tribute.
Gentle comedy is welcome; the guitar's emotional role needs room to breathe.

## Blueprint Bridge

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

- Potassium Slip: polished flagship secret/proof candidate.
- Stampede Sketch: optional Vampire Survivors-style homage/proof candidate.
- Telegraph / Clair-Obscur-style timing: optional timing/parry proof candidate.
- Concert guitar performance: small teaching toy for the guitar, with required
  non-arcade fallback.

Mini-games may unlock alternate paths, extra proof, shortcuts, rewards, or just
exist for fun. They should not become the default solution for main route
blockers.

## Open Design Slots

- Dance Festival Area layout near Relay.
- Required resident cast names and silhouettes.
- Optional resident cast and hangout spaces.
- Guitar acquisition details inside Concert Crossing.
- Exact Living Proof feedback when Relay is reachable but not ready.
- Return-to-Ridge state after the Cicka Threshold Farewell.
