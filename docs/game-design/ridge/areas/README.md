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

Use the First Playable Interaction Vocabulary for area-local beats: movement,
talk/interact, inspect, optional enter/exit, sit/play where appropriate, and
contextual prompt confirms. Do not add local inventory, required rhythm/drawing
checks, or fail states before the end-to-end route works.

Use Minimal Route Guidance for area-local readability. Prefer blockers,
composition, barks, Cicka placement, changed props, and contextual prompts over
quest logs, checklists, minimaps, objective trackers, or "go talk to X" UI.

Use Compact Area Transitions between required areas. An area exit should resolve
through a short authored handoff, page/ink/blackout-style transition, soft
travel cue or stinger, and framed respawn at the next local problem. Do not make
area exits depend on playable travel routes, vehicle mini-games, long cutscenes,
or a map screen in the First Playable Route.

Use Role Names for First Playable residents and animals until a focused
naming/tone pass accepts final proper names. Role labels are stable enough for
area docs, dialogue IDs, implementation references, and issue writing.

Use Tone-Locked Placeholder Dialogue for area-local writing: stable IDs, Role
Name speakers, one to three provisional lines or prompts per required beat, and
clear state outcomes. Save polished banter, deep branches, and final proper
names for later writing passes.

Keep each area's First Playable cast to the Minimum Route Cast. Add only the
required route resident(s), Cicka, and the smallest useful barks or silhouettes
needed for staging; reserve richer optional residents and hangouts for later
liveliness passes.

When an area-local detail becomes implementation work, package it through the
Agent-Ready Slice Contract in [`../milestone-plan.md`](../milestone-plan.md):
area, local beat state, prompt/dialogue IDs, blocker, world change, Cicka
placement, exit condition, and acceptance checks.

Before implementation starts, use the Area Paper Pass to make each local area
doc agent-ready rather than final: define beat states, blocker or threshold,
Cicka before/after, required prompt/dialogue IDs, Rough Stage Composition,
transition or reset behavior, audio floor needs, and acceptance checks. Rough
Stage Composition should name beat order, entry/exit sides, blocker location,
Cicka spot, resident/prop zone, optional Area Interior Pocket, and camera
framing intent. Each area README should include a tiny Stage-Order Sketch, using
ASCII arrows or equivalent simple text, for the first-read route shape. Do not
turn the area docs into pixel maps, collision geometry, final scripts, complete
dialogue trees, or final art briefs.

For Concert, Dance Festival, and Relay, P1 acceptance checks are paper-level:
list five to eight player-visible outcomes or documented requirements in the
area README, but do not require runtime proof until those areas become
implementation slices after the Bridge Tracer Slice.

For first playable audio, use the First Playable Audio Floor: placeholder
handmade ambience, blocker/world-change cues, Cicka cue if present, and only the
small guitar or transition cues needed by that area. Use the audio reference
pack for palette, not as a requirement to produce final songs or mixes.

Ownership rule: root [`../open-questions.md`](../open-questions.md) is for
route-level or taste-sensitive decisions. Area docs own local **Open Local
Slots** such as Rough Stage Composition, prompt wording, resident silhouettes,
camera framing intent, exact blockout geometry, and local art/audio choices.

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
