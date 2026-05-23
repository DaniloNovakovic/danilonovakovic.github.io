# Ridge Snapshot

> Status: implemented/prototype snapshot.
> This is the current human-readable snapshot of Ridge's implemented/prototyped
> state, not the active future design target, shipped player documentation, or
> issue tracker. Update this when current runtime behavior or prototype
> capability changes.

## Ownership

- **Shipped behavior:** [`player-manual.md`](../player-manual.md).
- **Ridge source router:** [`README.md`](./README.md).
- **Active story/route canon:** [`story-level-bible.md`](./story-level-bible.md).
- **Active area design:** [`areas/`](./areas/README.md).
- **Runtime spatial data:** [`folded-desk-ridge.source.ts`](../../../src/game/scenes/ridge/blockout/sources/folded-desk-ridge.source.ts).
- **Blockout language contract:** [`map-language.md`](./map-language.md).
- **Legacy folded topology reference:** [`legacy/`](./legacy/README.md).
- **Product vision:** [`summit.md`](./summit.md).
- **Live implementation work:** GitHub Issues.

If this file disagrees with the folded desk Ridge blockout about room layout,
route order, anchors, shortcuts, or progress-gated geometry, the blockout wins.
If this file disagrees with GitHub about active work state, GitHub wins.
If this file disagrees with `story-level-bible.md` or the matching `areas/`
doc about future route intent, the active design docs win.

## Current Runtime Shape

Ridge is a separate Phaser scene that can boot directly in development with:

```text
?mode=interactive&startScene=ridge
```

Current runtime characteristics:

- Ridge uses shared side-view movement and camera/runtime support.
- The scene imports the generated Ridge blockout artifact, derives geometry,
  compiles typed facts, and hands those facts to scene-owned presentation,
  traversal, interaction, and Cicka Home mutation modules.
- The runtime source is the folded Ridge blockout, not a separate hand-coded
  room catalog.
- Stampede can be reached from the Ridge Trail Card path.
- Telegraph, Domino, high ledge, underpath, and other future beats are present
  as route promises or disabled/teased anchors until their implementation
  slices exist.
- Ridge remains a proof-of-concept surface. The current playable traversal code
  can be replaced if the next design pass preserves the useful source contract,
  compiler, generated facts, and viewer/debugger workflow.
- Newer story-route planning demotes Cicka Home from canonical hub to local
  **Cicka Resting Spots** inside each required Ridge Area. The current
  Cicka Home runtime pieces are proof-of-concept infrastructure until a route
  rewrite chooses whether to adapt or remove them.

## Protected PoC Assets

The valuable Ridge proof-of-concept investment is the authoring and QA spine,
not the current moment-to-moment traversal model.

Preserve or adapt:

- Ridge Blockout Source / source contract.
- compiler and generated spatial facts.
- route, anchor, shortcut, collider, validation, and mutation facts.
- read-only previewer/debugger workflow.
- map-loading path that lets agents and Danilo inspect topology quickly.

Disposable if a better Ridge emerges:

- current required-jump traversal feel.
- slope/ramp-first geometry assumptions.
- current folded-desk room arrangement.
- any runtime module whose main job was proving the old platformer-like route.

## Current Route Read

The current blockout route is the folded desk Ridge:

```text
Outskirts
  -> Cicka Home
  -> Work Artifact Ledge
  -> Stampede Blanket
  -> Switchback Shelf
  -> Telegraph Terrace
  -> Guide Overlook
  -> Relay Gate
  -> Domino Desk
```

Future or optional promises in the blockout include:

- Paw Underpath from Outskirts/Cicka Home.
- Lucky Luna Drop Pocket from Guide Overlook toward Stampede Blanket.
- High Ledge above Domino Desk.
- Telegraph cord drop back to Cicka Home.
- Domino lift back to Cicka Home.

The level-design goal is that the player walks a compact lived-in sketchbook
neighborhood, sees Relay early, follows subtle Cicka field-presence hints at
route blockers, helps tiny residents change the route, and learns Danilo
through artifacts rather than static portfolio buildings.

## Current Landmarks

- **Outskirts:** old city edge / future Overworld absorption point, Basement
  hatch promise, Potassium hint space, early Relay sightline.
- **Cicka Home:** progress memory space, Cicka home base, memento/home mutation
  space, future underpath clue.
- **Work Artifact Ledge:** first obvious work/project artifact area with a
  side-shelf skill scrap promise.
- **Stampede Blanket:** first new opt-in mini-game anchor and first earned
  Ridge memory source.
- **Switchback Shelf:** first spatial fold above Cicka Home and Stampede
  shortcut promise.
- **Telegraph Terrace:** future one-button parry/timing lane landmark.
- **Guide Overlook:** reorientation point and Relay sightline.
- **Relay Gate:** first-ending promise and proof-slot destination.
- **Domino Desk:** future deterministic puzzle/lift promise.

## Current Rewards And Memory

Durable Ridge progress is intentionally small:

- stamps
- manual pages
- glide pips
- shortcuts

Current accepted behavior:

- First Stampede clear awards the `stampede-sketch` Ridge stamp.
- First Stampede clear awards one glide pip.
- Repeat Stampede clears do not duplicate those rewards.
- Ridge derives visible Stampede blanket memory from the stamp instead of
  storing sticker ids.
- Cicka Home mutation facts are compiled from the blockout and become active
  only when a real durable progress source exists.
- Cicka can provide early pre-translator presence and Stampede-gated memory
  flavor without becoming a quest board, vendor, or inventory checklist.

## Future Design Target

The active future design target is the linear Ridge route from
[`story-level-bible.md`](./story-level-bible.md):

```text
Bridge Area / Blueprint Bridge
  -> Concert Area / Concert Crossing Beat
  -> Dance Festival Area / Opening Dance Shuttle Beat
  -> Relay Spire / Guitar Farewell / Cicka Threshold Farewell
```

The folded/Cicka Home route in [`legacy/`](./legacy/README.md) remains legacy
prototype and topology reference until it is rewritten around this route.

Before implementing the next Ridge runtime or blockout rewrite, write and accept
a prose story/level/character plan for the core Exploration Map scenes and
their route blockers. Start from the middle/end emotional and progression beats,
then work backward to the opening so the first scene teaches the right promise.
Mini-games, shortcuts, and optional platforming pockets may stay rougher in
this prose pass, but the core overworld/Ridge route blockers should be legible
in words first.

The accepted ending anchor is the **Cicka Threshold Farewell**: Cicka recurs
through the Ridge as field presence, accompanies the player to the Relay Spire
threshold, and then departs somewhere the player cannot follow. The ending
should stay replayable, tender, and non-literal rather than becoming a death
scene or grief speech.
Design the canonical first ending before designing optional endings. Multiple
endings are not required for the Ridge; add alternate endings only if a later
story/level pass proves they create meaningful replay value without weakening
the Cicka farewell.
The first prose artifact should be a short ending sequence outline before the
required Ridge Areas and their Resident Beats are designed: arrival state, Relay
readiness, Cicka's final field presence, farewell action, final mark, and
return-to-Ridge state.

Accepted first ending outline:

1. The player reaches Relay Spire and can stand there before it is ready.
2. Once Living Proof is enough, the Relay sign becomes readable.
3. Cicka appears in her final field-presence spot, calm and familiar.
4. The player shares a quiet Guitar Farewell with Cicka, ideally under a warm
   sunset or other cozy threshold light.
5. Control returns in **Relay Blue Hour** at the Relay sign/spire for a **Send
   the Sketchbook Prompt**.
6. Cicka walks with the player to the threshold, pauses, looks back once, leaves
   one final paw/page mark, then slips into a page fold or light beyond the
   player's path. The initial version uses no translated farewell line.
7. The player returns to the **Open Ridge Return State** after the ending, with
   the canonical final mark preserved at the Relay threshold, one quieter echo
   at the Concert Resting Spot, and the world still open. The echo is the
   empty usual spot plus one small paw/page mark, not the player's guitar left
   behind.

The guitar should be established earlier as a meaningful comfort item:
something the player can pick up and carry before the Relay **Guitar Farewell**.
Initial local Cicka Resting Spots can stay mostly visual instead of becoming
repeatable guitar prompts or dedicated interaction nodes.
Petting, lap resting, and similar affection interactions can wait for a later
polish pass. A hug is optional and should wait until character art can support
it without making the farewell feel awkward or over-staged.
The guitar should enter mid-route through a Resident Beat as an entrusted
reward or responsibility, not as a random pickup. A resident can give or lend it
after the player helps with a local music/concert problem; the route can then
stage Cicka around local Resting Spots so the final Relay comfort moment feels
prepared without requiring resting-spot interactions in v0.
Middle route area: **Concert Area**, containing **Concert Crossing Beat**. A
blocked concert/traffic crossing halts the route because the local guitarist
cannot play, the paper-stage setup is tangled, or the guitar needs a small
repair. Cicka subtly points attention to the guitar case, loose string, or
blocked crossing. The player learns a small
Guitar-Hero-like performance mini-game, helps the concert continue, the crossing
opens, and the guitar is entrusted to the player afterward. Keep the comedy
gentle; avoid making the guitarist a joke-only drunk if that undercuts the later
tribute.
Because dialogue UI, character assets, route blockers, trees/props, and audio
are already enough production load, the Concert Crossing Beat needs a non-arcade
fallback: conversation, collection, practice together, or a forgiving auto-play
path can resolve the main route while the Guitar-Hero-like mini-game remains the
ideal or optional version.

The final blocker should be a **Living Proof Gate**. The Relay Spire can be
physically reachable early, but it should not send the sketchbook until the path
has created enough resident/world changes and Cicka familiarity to make the
destination emotionally and semantically ready. The three required Ridge Areas
should be enough proof for the current first ending. Avoid an
exact visible checklist unless testing shows the player needs clearer feedback.
Changed Cicka Resting Spots should not count as proof by themselves; they are
emotional echoes of resident/world changes already earned elsewhere.
Planning assumption: start with 2-3 required main-path Resident Help Beats
before the first ending, plus optional extra residents for return play. Treat the
exact count as a Level Designer and Story/Tone tuning variable, not a fixed
rule.

The target asks for:

- a readable mostly forward neighborhood route toward Relay Spire
- Relay Spire physically reachable before it can send
- Living Proof Gate made from enough visible world changes and Cicka familiarity
  rather than an exact checklist; the three required Ridge Areas should be
  enough for the current first ending
- changed Cicka Resting Spots as emotional echoes of proof, not separate proof
  sources
- first ending path completable through conversations, collection, authored
  traversal, Ridge Areas, Resident Beats, and world changes without requiring
  full arcade mini-games
- Mini-Game Entrances as optional fun, rewards, shortcuts, or future alternate
  ways to finish a level, not required first-ending proof
- non-arcade fallback for any required beat that contains arcade-like interaction
- tiny resident problems that create visible route changes
- first route area as **Bridge Area**, containing **Blueprint Bridge**: a
  required soft gate where helping a resident finish a bridge drawing/blueprint
  makes the crossing real
- 2-3 required main-path Ridge Areas before the first ending, each centered on a
  Resident Beat / Resident Help Beat, with optional extra residents only if they
  add texture instead of errand fatigue
- final required route area as **Dance Festival Area**, containing **Opening
  Dance Shuttle Beat**:
  a nervous dance/romance setup at the foot of the Relay hill. The night dance
  festival is real, but the required route beat happens during afternoon setup.
  The route blocker should be practical: festival barriers, lantern lines,
  chair stacks, stage/speaker cables, and a locked service-road gate block the
  hill route until setup passes inspection. The locked route-agent is the
  nervous hill-shuttle driver, whose daily job and emotional problem both
  connect to the final approach. His romantic partner is the shy **Last-Stop
  Operations Helper**, whose visible plaza-table work connects shuttle
  questions, setup checks, volunteer handoffs, service-road clearance, and the
  night dance. Keep these as role-first character labels for now; proper names
  can wait until a later character pass. Accepted arrival premise: **Opening
  Dance Setup + Last Daylight Shuttle**. Introduce the beat through a practical
  wayfinding loop:
  the player asks how to reach Relay, notices the blocked service road and
  shuttle sign, then discovers the emotional layer through delayed setup and the
  last daylight shuttle window before the road closes for the night festival.
  Reveal the relationship through a triangulated discovery flow: the driver and
  Last-Stop Operations Helper give truthful but incomplete practical answers,
  then nearby locals help the player understand that they are avoiding each
  other. Do not let the player solve the beat by directly confronting them with
  their feelings. The Last-Stop Operations Helper's readiness favor is
  **Operations Handoff Check**: the player helps prove the plaza setup is safe
  enough for the **Dance Teacher** to keep watch once the night dance starts.
  The point is not replacing her planning; it is showing that she did enough
  and can enjoy the event. The driver's readiness favor is **One-Step
  Practice**: the player helps
  him privately learn one tiny dance step before the setup handoff, last
  daylight ride, and later night-dance promise can happen. After both favors,
  the connector is **Folded Song Request**: a tiny paper invitation where the
  driver requests a simple, cute, guitar-friendly song and asks her for one
  dance later without a public confession. Do not lock the beat to bachata or
  any other specific dance genre; the exact requested song can remain unshown
  and unheard by the player. The physical
  route solve is **Setup Clearance Walkthrough**: final visible setup details
  clear the service lane enough for the steward to open the gate and the driver
  to offer the last daylight ride. Present it as a **Prompt-Driven Playable
  Montage**: three default symbolic one-action snaps, plus a visible sky/plaza
  time shift, not full manual chores or a pure cutscene. The default snaps are:
  secure the lantern line, clear or tape the service-lane obstruction, and flip
  the shuttle sign to "Last daylight ride." These can collapse further if the
  beat needs to move faster. Conversation choices can
  create different tones, orderings, and recoverable awkward paths, but should
  not permanently block the first ending. Cicka's role is quiet threshold
  observer near the operations table, shuttle step, or service gate; she can
  loaf with the **Unnamed Counterpart Cat** as implied continuity foreshadowing,
  using only silhouette/color specificity such as a pale or light-ink contrast
  to Cicka. The scene should not name him, give him dialogue, confirm parentage,
  or spend Micka before the post-ending return.
- required route spine: Bridge Area / Blueprint Bridge means changing the world
  through art, Concert Area / Concert Crossing Beat means turning memory into
  comfort, Dance Festival Area / Opening Dance Shuttle Beat means life can keep
  moving with someone new, then Relay Spire / Guitar Farewell resolves Cicka's
  threshold farewell
- Guitar Farewell can include a brief **Living Proof Montage**: Blueprint Bridge
  being used, Concert Crossing continuing, Opening Dance beginning at night as
  an emotional echo under the player's guitar, and earlier Cicka Resting Spots
  carrying accumulated marks. Keep it wordless or nearly wordless so the focus
  stays on Cicka.
- Relay time should progress from sunset for **Sit and Play Prompt** to **Relay
  Blue Hour** for **Send the Sketchbook Prompt**. The montage can show the night
  festival beginning elsewhere, but Relay should not become full night before
  the farewell.
- The shuttle ride from Last-Stop Plaza to Relay should be a **Short Threshold
  Transition**, not a controllable driving segment: the driver can say "All
  aboard the last ride," the vehicle starts over a brief blackout, the player
  respawns at Relay Spire under sunset, and control resumes at Cicka's overlook
  spot.
- The final Relay Spire interaction should be a **Sit and Play Prompt** near
  Cicka. It starts the Guitar Farewell without rhythm UI, fail state, or final
  skill check.
- After the Guitar Farewell, control returns at the Relay sign/spire for a
  **Send the Sketchbook Prompt**. This starts the Cicka Threshold Farewell while
  keeping the guitar as comfort rather than the send button.
- Cicka's departure should be physical and mostly silent: walk together, pause,
  look back, final mark, then page-fold/light departure. The initial version
  should use no translated farewell line; a tiny raw meow/chirp sound can remain
  optional if it supports the staging.
- Immediate post-ending play should use the **Open Ridge Return State**:
  replayable, quiet, and minimally absence-marked. The canonical final mark
  persists at the Relay threshold, one quieter echo appears at the Concert
  Resting Spot, and Micka remains delayed until the later post-ending trigger
  rather than appearing immediately. The echo should be an empty usual spot with
  one small paw/page mark, not the guitar left behind.
- Cicka field presence in every required Resident Help Beat, with one local
  **Cicka Resting Spot** per required Ridge Area: Bridge Resting Spot, Concert
  Resting Spot, and Dance Festival Resting Spot. Her role can vary from subtle
  obstacle hint to changed-object observer to quiet trust marker.
- optional residents, NPCs, interactive props, and chill spaces that can offer
  mini-games, atmosphere, jokes, or company without solving barricades
- Bridge Resting Spot, Concert Resting Spot, and Dance Festival Resting Spot as
  local progress-memory spaces, not hubs or v0 prompt nodes
- two tiny visual states for each Cicka Resting Spot: before resolution, Cicka
  draws attention to the local problem; immediately after resolution, the spot
  becomes calmer through a settled pose, tiny mark, changed prop, or later
  absence echo; the Guitar Farewell montage can revisit these already-changed
  states rather than introducing them
- changed resting-spot states as optional emotional rewards, not required
  noticing, revisiting, checklist, or route-gate steps
- no main-path slope reliance in v0; use chunky stairs, cords, shelves, bridges,
  lifts, and soft drops
- no required jump button on the v0 main route; use authored climb, descend,
  drop, lift, bridge, enter, and inspect interactions instead
- main route traversal that stays mobile-safe and object-driven
- first-walk route mastery before dexterity
- folded shortcuts after mini-game clears or resident help beats
- artifacts as physical learning objects, not resume modal replacements

## Not Current Scope

- Replacing the old Overworld as the default scene.
- Adding a minimap.
- Adding a generic mini-game framework.
- Adding stored sticker state.
- Making Cicka Resting Spots into checklist hubs, shops, or quest boards.
- Making Cicka a continuous follower, puzzle solver, or explicit objective giver.
- Using slopes/ramps as required main-path traversal in the v0 Ridge blockout.
- Requiring jump as a core Exploration Map button in the v0 main route.
- Requiring wall jump, double jump, or precision platforming for the first
  farewell route.
- Moving the runtime blockout source again without an explicit migration issue
  that updates imports and documentation together.

## Update Rule

Update this file when:

- the current blockout route changes meaningfully
- a room or landmark becomes active/inactive in the runtime
- a reward changes durable state shape
- the active future route target changes in a way that affects runtime/prototype
  interpretation
- a prior topology/design spike is superseded

Do not update this file just to record every implementation issue. Use GitHub
Issues for live planning and agent-ready briefs.
