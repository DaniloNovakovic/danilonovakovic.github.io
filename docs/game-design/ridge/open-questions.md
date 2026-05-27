# Ridge Open Questions

> Status: needs-HITL / active brainstorming.
> This file tracks route-level unresolved design gaps for the active Ridge
> route. It is not implementation scope and not a backlog. When a question
> resolves, move the accepted decision to the correct canon file and remove or
> rewrite the question.

Read [`README.md`](./README.md) first for source-of-truth routing. Resolved
area-local detail belongs in the matching [`areas/`](./areas/README.md) file or
the narrowest subdoc inside that area folder.

## How To Read This File

The main route shape is already accepted:

```text
Bridge Area -> Concert Area -> Dance Festival Area -> Relay Ending
```

Bridge, Concert, and Dance Festival each have accepted local contracts in
[`areas/`](./areas/README.md). Local questions about topology, prompts, prop
placement, character silhouettes, or exact room staging belong in the matching
area doc's **Open Local Slots**, not here.

Use these labels:

- **True design unknown:** taste-sensitive or product-shaping decision still
  needs Danilo.
- **Route blockout TBD:** accepted route needs cross-area room checklist,
  transition triggers, or recurring Cicka/state language.
- **Future/post-v0:** valid idea, but not required for the **First Playable
  Route**.

Area-local detail lives here:

- [`01-bridge/README.md`](./areas/01-bridge/README.md#open-local-slots)
- [`02-concert/README.md`](./areas/02-concert/README.md#open-local-slots)
- [`03-dance-festival/README.md`](./areas/03-dance-festival/README.md#open-local-slots)
- [`03-dance-festival/layout.md`](./areas/03-dance-festival/layout.md#open-spatial-slots)
- [`03-dance-festival/characters.md`](./areas/03-dance-festival/characters.md#open-character-slots)
- [`03-dance-festival/interaction-flow.md`](./areas/03-dance-festival/interaction-flow.md#open-prompt-slots)
- [`04-relay-ending/README.md`](./areas/04-relay-ending/README.md#open-local-slots)

## Ending

True design unknowns:

- **Guitar Farewell micro-staging:** Given the accepted quiet, short Sit and
  Play shape, what are the exact camera, input handoff, animation, silence, and
  audio beats from guitar phrase through Cicka's threshold departure?
- **Cicka Threshold Farewell staging:** What exact physical sequence carries
  Cicka's final walk, look back, and page-fold/light departure without relying
  on unseeded paw/page marks as a mechanic?
- **Open Ridge Return State:** What interactions remain available immediately
  after the ending, and what minimal visual absence echo, if any, is preserved
  at Relay or the Concert Resting Spot?
- **Micka timing:** What post-ending action eventually introduces Micka, and
  what must stay hidden until then?

Route blockout TBD:

- **Relay arrival linger:** What small movement, sitting, looking, or comfort
  interactions are available after the Dance-to-Relay transition but before the
  player chooses Sit and Play, without adding a separate pre-ready Relay access
  state?

## Route Transitions

Route blockout TBD:

- **Concert-to-Dance travel staging:** What exact beats show the accepted
  implied post-concert rest and post-rest Band Roadie Van Ride without becoming
  a required driving mini-game?
- **Band roadie destination flavor:** Is the band roadie taking the injured
  guitarist to a local hospital/clinic, heading to another gig route, going to
  band storage, or leaving the destination unexplained while dropping the player
  near Dance Festival because it is on the way?
- **Recurring festival superfan placement:** Where should the desired comic
  resident be seeded at Bridge and Concert, where he sleeps through Dance,
  and is he cheap enough for the First Playable Route or better saved for the
  immediate post-v0 liveliness pass?

## First Playable Route Blockout

The **First Playable Route** scope floor is already accepted in
[`../../../CONTEXT.md`](../../../CONTEXT.md): the smallest complete Bridge Area
through Relay Spire path that proves the emotional arc without required
mini-games, optional interiors, campfire hangouts, or extra resident liveliness.
Do not re-grill that scope unless Danilo changes the product target.

Route blockout TBD:

- **Route blockout checklist:** What exact rooms, prompts, blockers, route
  changes, Cicka before/after states, and transition triggers must exist for a
  complete Bridge -> Concert -> Dance -> Relay blockout pass?
- **Cicka Resting Spots first-pass states:** Which exact before/after prop,
  posture, or visual trace is the smallest readable version for each required
  Ridge Area, and which of those states should echo in the Route Memory Montage?

## Resolution Rule

When a grilling/research pass resolves a question:

1. Add accepted route/story decisions to [`story-level-bible.md`](./story-level-bible.md).
2. Add accepted local area detail to the matching [`areas/`](./areas/README.md)
   file or area subdoc.
3. Add new stable terms or ambiguities to [`../../../CONTEXT.md`](../../../CONTEXT.md).
4. Add implementation work to GitHub Issues.
5. Add runtime/prototype facts to [`ridge-snapshot.md`](./ridge-snapshot.md).
6. Remove or rewrite the resolved question here.
