# Current Ridge Level

> Current human-readable Ridge level snapshot. This is not shipped player
> documentation and not the issue tracker. Update this when the playable Ridge
> route, runtime blockout, reward contract, or current level target changes.

## Ownership

- **Shipped behavior:** [`player-manual.md`](../player-manual.md).
- **Runtime spatial data:** [`folded-desk-ridge.source.ts`](../../../src/game/scenes/ridge/blockout/sources/folded-desk-ridge.source.ts).
- **Blockout language contract:** [`map-language.md`](./map-language.md).
- **Current map target:** [`proper-map-plan.md`](./map-plans/proper-map-plan.md).
- **Story/level plan:** [`story-level-bible.md`](./story-level-bible.md).
- **Product vision:** [`summit.md`](./summit.md).
- **Live implementation work:** GitHub Issues.

If this file disagrees with the folded desk Ridge blockout about room layout,
route order, anchors, shortcuts, or progress-gated geometry, the blockout wins.
If this file disagrees with GitHub about active work state, GitHub wins.

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

## Current Target

The current map target is the **Sketchbook Neighborhood Spine With Folded Shortcuts**
from [`proper-map-plan.md`](./map-plans/proper-map-plan.md).

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
The first prose artifact should be a short ending sequence outline before any
required Resident Room Beats are designed: arrival state, Relay readiness,
Cicka's final field presence, farewell action, final mark, and return-to-Ridge
state.

Accepted first ending outline:

1. The player reaches Relay Spire and can stand there before it is ready.
2. Once Living Proof is enough, the Relay sign becomes readable.
3. Cicka appears in her final field-presence spot, calm and familiar.
4. The player shares a quiet Guitar Farewell with Cicka, ideally under a warm
   sunset or other cozy threshold light.
5. The player activates or sends the sketchbook.
6. Cicka walks with the player to the threshold, pauses, leaves one final
   paw/page mark, then departs somewhere unreachable.
7. The player returns to Ridge after the ending, with the final mark preserved
   and the world still open.

The guitar should be established earlier as a meaningful comfort item: something
the player can pick up, carry, and play in the world, especially at Cicka Home.
Petting can be a smaller recurring affection interaction. A hug is optional and
should wait until character art can support it without making the farewell feel
awkward or over-staged.
The guitar should enter mid-route through a Resident Room Beat as an entrusted
reward or responsibility, not as a random pickup. A resident can give or lend it
after the player helps with a local music/concert problem, then Cicka Home and
quiet Ridge spots can teach the player that playing for Cicka is a comfort
ritual before the Relay Spire ending.
Middle required Resident Room Beat: **Concert Crossing Beat**. A blocked concert/traffic crossing
halts the route because the local guitarist cannot play, the paper-stage setup
is tangled, or the guitar needs a small repair. Cicka subtly points attention to
the guitar case, loose string, or blocked crossing. The player learns a small
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
has created enough resident/world changes, mini-game proofs, and Cicka
familiarity to make the destination emotionally and semantically ready. Avoid an
exact visible checklist unless testing shows the player needs clearer feedback.
Planning assumption: start with 2-3 required main-path Resident Help Beats
before the first ending, plus optional extra residents for return play. Treat the
exact count as a Level Designer and Story/Tone tuning variable, not a fixed
rule.

The target asks for:

- a readable mostly forward neighborhood route toward Relay Spire
- Relay Spire physically reachable before it can send
- Living Proof Gate made from enough visible world changes, proofs, and Cicka
  familiarity rather than an exact checklist
- first ending path completable through conversations, collection, authored
  traversal, Resident Room Beats, and world changes without requiring full
  arcade mini-games
- Mini-Game Entrances as optional alternate path unlockers, proof sources,
  rewards, or pure side fun
- non-arcade fallback for any required beat that contains arcade-like interaction
- tiny resident problems that create visible route changes
- first v0 Resident Help Beat as **Blueprint Bridge**: a required soft gate
  where helping a resident finish a bridge drawing/blueprint makes the crossing
  real
- 2-3 required main-path Resident Room Beats before the first ending, each
  centered on a Resident Help Beat, with optional extra residents only if they
  add texture instead of errand fatigue
- final required Resident Room Beat candidate as Last Dance / Bachata Crossing:
  a nervous dance/romance setup at the foot of the Relay hill. The route
  blocker should be practical: festival barriers, a locked service-road gate,
  and/or the last hill shuttle not running until the event closes properly. The
  locked route-agent is the nervous hill-shuttle driver, whose daily job and
  emotional problem both connect to the final approach. His romantic partner is
  the shy last-stop song-table volunteer, whose daily work connects the dance,
  final shuttle, service-road barrier, and last-song timing. Locked arrival
  state: **Last Song Table + Final Shuttle Hold**. The driver waits by the
  shuttle with the route clipboard; the volunteer stays at the song table
  because the final song stalls unless a trusted person covers it.
  Introduce the beat through a practical wayfinding loop: the player asks how
  to reach Relay, notices the blocked service road and shuttle sign, then
  discovers the emotional layer through the delayed final song. Reveal the
  relationship through a triangulated discovery flow: the driver and song-table
  volunteer give truthful but incomplete practical answers, then nearby locals
  help the player understand that they are avoiding each other. Do not let the
  player solve the beat by directly confronting them with their feelings. Each
  romantic character should need a small readiness favor before the final song,
  shy dance, and lane-clearing handoff can happen. Conversation choices can
  create different tones, orderings, and recoverable awkward paths, but should
  not permanently block the first ending.
- required route spine: Blueprint Bridge means changing the world through art,
  Concert Crossing means turning memory into comfort, Last Dance / Bachata
  Crossing means life can keep moving with someone new, then Relay Spire /
  Guitar Farewell resolves Cicka's threshold farewell
- Cicka field presence in every required Resident Help Beat, with her role
  varying from subtle obstacle hint to changed-object observer to quiet trust marker
- optional residents, NPCs, interactive props, and chill spaces that can offer
  mini-games, atmosphere, jokes, or company without solving barricades
- Cicka Home as a progress memory space, not the only emotional anchor
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
- Making Cicka Home a checklist hub, shop, or quest board.
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
- the current map target changes
- a prior topology/design spike is superseded

Do not update this file just to record every implementation issue. Use GitHub
Issues for live planning and agent-ready briefs.
