# Ridge Areas

> Status: active design index.
> Read [`../README.md`](../README.md) first for Ridge source-of-truth routing.

This folder holds the local source-of-truth docs for the active Ridge route:

```text
01 Bridge Area -> 02 Concert Area -> 03 Dance Festival Area -> 04 Relay Ending
```

Use [`../story-level-bible.md`](../story-level-bible.md) for the route spine,
ending order, area barricade chain, and cross-area Cicka/guitar logic. Use these
area files for local geography, blockers, residents, prompts, traversal,
staging, Cicka Resting Spot details, visual/audio notes, and area-specific open
questions. Use [`../dialogue-conventions.md`](../dialogue-conventions.md) for
dialogue file format, placeholder policy, and line ID rules.

For the First Playable Route, each required area should be designed as a
Compact Ridge Stage. Small Area Interior Pockets are allowed when they add
depth or local richness, but they remain part of the same area/chapter and
should not create sprawling mini-map navigation.

Ownership rule: root [`../open-questions.md`](../open-questions.md) is for
route-level or taste-sensitive decisions. Area docs own local **Open Local
Slots** such as topology, prompt wording, prop placement, resident silhouettes,
camera framing, and local art/audio choices.

## Area Docs

| Route order | Area doc | Owns |
| --- | --- | --- |
| 1 | [`01-bridge/README.md`](./01-bridge/README.md) / [`dialogue.md`](./01-bridge/dialogue.md) | Blueprint Bridge, first resident-help soft gate, first Cicka attention cue |
| 2 | [`02-concert/README.md`](./02-concert/README.md) / [`dialogue.md`](./02-concert/dialogue.md) | Concert Crossing, guitar acquisition, comfort-through-memory beat |
| 3 | [`03-dance-festival/README.md`](./03-dance-festival/README.md) / [`dialogue.md`](./03-dance-festival/dialogue.md) | Opening Dance Shuttle index; local detail split into [`layout.md`](./03-dance-festival/layout.md), [`characters.md`](./03-dance-festival/characters.md), and [`interaction-flow.md`](./03-dance-festival/interaction-flow.md) |
| 4 | [`04-relay-ending/README.md`](./04-relay-ending/README.md) / [`dialogue.md`](./04-relay-ending/dialogue.md) | Relay Spire, Guitar Farewell staging, Cicka Threshold Farewell, return state |

## Update Rules

- Keep each area doc focused on one playable area or ending location.
- Do not paste full research transcripts here; route them through
  [`../decision-intake.md`](../decision-intake.md).
- Put unresolved decisions in [`../open-questions.md`](../open-questions.md)
  unless they are purely local notes inside one area doc.
- If an area decision changes the route order, Area Barricade Chain, Cicka's
  cross-area role, or guitar/ending dependency, update
  [`../story-level-bible.md`](../story-level-bible.md) too.
- If a design becomes implementation work, publish or update a GitHub Issue
  instead of adding a local backlog.
- If an area folder has subdocs, update the narrowest subdoc first and keep the
  area `README.md` as the quick local index.
