# Sketchbook Ridge Milestone Plan

> Pre-production milestone router for the desired Ridge game rework.
> This is not the live issue tracker. PRDs, implementation issues, triage state,
> and agent-ready briefs live in GitHub Issues through
> [`docs/agents/issue-tracker.md`](../../agents/issue-tracker.md).

Status: accepted route-reset planning. Read [`README.md`](./README.md) first for
Ridge source-of-truth routing, [`story-level-bible.md`](./story-level-bible.md)
for active route canon, and [`areas/`](./areas/README.md) for area-local design.

Legacy/prototype milestone history moved to
[`legacy/prototype-milestone-history.md`](./legacy/prototype-milestone-history.md).

## Active Goal

The current phase is **Ridge pre-production for the desired game rework**.

The first complete route should prove:

1. Bridge -> Concert -> Dance Festival -> Relay exists as a compact route
2. Relay Spire is visible early
3. required Resident Help Beats visibly change the Ridge
4. Cicka feels present through field appearances and resting spots
5. Guitar Farewell, Cicka Threshold Farewell, Dedication Card, and First
   Playable Reset Return land without arcade gating or an unseeded extra final
   prompt
6. optional mini-games remain side fun, rewards, shortcuts, or future
   alternate-path candidates rather than required first-ending proof

Anything beyond that is future scope unless a slice explicitly pulls it in.

## Retention Rule

Keep this file as a compact phase compass. It may name the active goal,
route-reset milestones, source stack, prototype reuse rules, and handoff
checks. It must not collect issue status, owner assignments, implementation
task lists, transcript excerpts, dates, or release notes. Put those in GitHub
Issues, [`decision-intake.md`](./decision-intake.md), or the matching source
doc instead.

## Route-Reset Milestones

- **P0 Decision Intake**: convert grilling/research transcripts into accepted
  route claims, rejected ideas, and open questions.
- **P1 Area Paper Pass**: tighten Bridge, Concert, Dance Festival, and Relay
  docs until each area is clear enough to turn into agent-ready implementation
  slices. "Paper" means docs only: no pixel maps, final scripts, final art
  specs, or complete dialogue trees.
- **P2 First Playable Route Blockout**: prove the route can be walked end to
  end with a **Coherent Sketchbook Blockout** and no required precision
  platforming.
- **P3 Route Readiness Feedback**: make area barricades, resident help, world
  changes, and Relay arrival readable without a visible chore checklist.
- **P4 Ending Pass**: land Guitar Farewell as the final trigger, Cicka Threshold
  Farewell, Dedication Card, and clean First Playable Reset Return. Keep
  long-term Open Ridge Return State and Micka timing as future/post-v0
  questions.

Optional mini-games, old Cicka Home mutation work, and folded-desk topology
enter these milestones only when an active route doc or issue pulls a specific
piece forward.

### P1 Area Paper Pass Contract

Before implementation starts, each required area should have enough local docs
to satisfy the **Agent-Ready Slice Contract** without asking an agent to resolve
product taste. Bridge, Concert, Dance Festival, and Relay should each define:

1. the local route role and emotional idea
2. local beat states and the intended before/after state for the area
3. the visible blocker or ending threshold
4. Cicka's before/after placement or final field-presence role
5. required Role Name characters from the Minimum Route Cast
6. required prompt/dialogue IDs using Tone-Locked Placeholder Dialogue
7. Rough Stage Composition for the Compact Ridge Stage, including any Area
   Interior Pocket
8. visible world change or ending handoff result
9. Compact Area Transition, exit condition, or First Playable Reset Return
10. first playable audio needs from the First Playable Audio Floor
11. acceptance checks for the first implementation slice

For Rough Stage Composition, P1 should resolve the left-to-right beat order,
entry and exit sides, blocker location, Cicka spot, resident or prop zone,
optional Area Interior Pocket if any, and camera framing intent. Leave pixel
positions, collision geometry, parallax layer distances, and final prop
placement to the Bridge Tracer Slice and later blockout work. Each area README
should include a tiny **Stage-Order Sketch** so implementation agents can read
the local route shape without treating it as a pixel map.

P1 should not produce pixel-perfect maps, final scripts, final names, final art
briefs, finished audio specs, complete dialogue trees, optional mini-game
designs, final collision geometry, or post-v0 liveliness scope.

For Prompt/Dialogue IDs, the Bridge Area should be filled to line/prompt level
before the Bridge Tracer Slice. Concert, Dance Festival, and Relay may stay at
planned conversation IDs plus explicit TODO slots until their implementation
slices are next.

For non-Bridge areas, P1 acceptance checks are **Paper-Level Acceptance
Checks**: five to eight player-visible outcomes or documented slice
requirements in the area README. They should confirm that the blocker, Cicka
placement, resident role, prompt/dialogue ID plan, world change or ending
handoff, transition/reset condition, and audio-floor need are named. They do
not require runtime proof, screenshots, automated tests, or playability evidence
until each area becomes an implementation slice after the Bridge Tracer Slice.

### P1 Readiness Matrix

Use this matrix as the paper-pass exit check before writing implementation
issues. "Ready" here means the docs are ready to package a slice; only Bridge
requires immediate runtime/playability proof because it is the tracer.

| Area | Stage sketch | Prompt/dialogue IDs | Cicka placement | Transition/reset | Audio floor | Acceptance checks | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Bridge | In area README | Concrete line/prompt IDs in `dialogue.md` | Before/after resting spot named | Bridge-to-Concert transition named | Bridge ambience, Cicka cue, bridge-change cue, transition cue named | Bridge Tracer Slice definition of done | Ready for tracer slice |
| Concert | In area README | Planned conversation IDs | Hidden before, band/resting after | Dance transition exit named | Night ambience, guitar phrase, crowd-clearing cue, Cicka/transition cues named | Paper-Level Acceptance Checks | Paper-ready; implement after Bridge |
| Dance Festival | In area README and `layout.md` | Planned conversation IDs | Operations/shuttle/service-gate before/after options named | Relay sunset transition named | Setup ambience, setup-clearance cue, Cicka/transition cues named | Paper-Level Acceptance Checks | Paper-ready; implement after Bridge |
| Relay | In area README | Planned prompt IDs plus dedication text | Final field-presence / threshold role named | First Playable Reset Return named | Relay ambience, guitar phrase, raw meow, silence/reset cues named | Paper-Level Acceptance Checks | Paper-ready; implement after Bridge |

### Implementation Sequencing

After the Area Paper Pass, begin implementation with the **Bridge Tracer
Slice** rather than building all required areas in parallel. The first slice
should include the Bridge blocker, Bridge Draftsperson, Cicka toy-car play,
visible bridge change, and Bridge-to-Concert transition.

This slice proves the shared seams before other areas fan out: First Playable
Route State, prompt/dialogue data shape, camera framing, Cicka placement,
Compact Area Transition handling, and Coherent Sketchbook Blockout conventions.
For the experimental 2.5D staging pass, Bridge should also prove the Ridge
Stage Composition Source: a Primary Walk Rail as movement authority, rail-
relative Stage Spots for the player/Cicka/resident/props/exit, Stage Plates for
current bridge art layers, Stage Objects for modular assets, Stage Presentation
State for blocked/completed route changes, and a debug overlay for rail/spots/
interactions. Do not build a visual editor before the Bridge source/runtime
consumption proves useful. Manual tweak tooling should start with read-only
debug overlays and copyable dev readouts for rail progress, offsets, spots, and
world coordinates before any drag-to-edit surface is considered. Colocate the
Bridge source, area-specific stage runtime, interactions, and assets in a
Bridge-owned Ridge area folder; leave broader Ridge reorganization until the
Bridge slice proves the shape.
Once the Bridge Tracer Slice is playable and verified, Concert, Dance Festival,
and Relay can be split into Agent-Ready Slice Contract issues.

The Bridge Tracer Slice is done when a player can:

1. start at the Bridge nature/hill entry
2. encounter Cicka with the toy car
3. talk to the Bridge Draftsperson at the unfinished blueprint
4. use Cicka Parallel Play to receive or unlock the toy car test prop
5. run the toy-car bridge test
6. see the crossing visibly change from blocked to usable
7. cross or confirm the opened bridge exit
8. trigger the Bridge-to-Concert Compact Area Transition

The implementation should also prove the shared route state, prompt/dialogue
lookup by Prompt/Dialogue ID, camera framing, Cicka placement, transition
handoff, and Coherent Sketchbook Blockout conventions. Record basic playability
evidence with the issue or PR so later area slices inherit a tested seam rather
than a guess.

### P2 Blockout Completeness Contract

For the first end-to-end **First Playable Route** blockout, each required
Bridge, Concert, and Dance Festival area is blockout-complete when it has:

1. an entry state where the player enters, can move, and the camera frames the
   local problem
2. one Compact Ridge Stage topology, with any Area Interior Pocket kept inside
   the same area progress rather than becoming a second mini-map
3. coherent sketchbook blockout art with a foreground frame, playable lane, and
   background set dressing
4. a visible blocker where the next route is physically blocked before dialogue
   explains it
5. a Cicka cue near the problem, prop, or emotional handoff
6. Minimum Route Cast presence: required route resident(s), Cicka, and only
   the smallest useful barks or silhouettes for area readability
7. a resident help beat where one local resident has a practical reason they
   can affect the blocker
8. one simple interaction chain with two to four authored prompts or dialogue
   beats using the First Playable Interaction Vocabulary and no fail state
9. Minimal Route Guidance: readable staging and contextual prompts, not a quest
   log, checklist, minimap, objective tracker, or "go talk to X" UI
10. a visible world change that changes the map, not only dialogue
11. a Cicka after-state where the local resting spot changes or settles
12. First Playable Audio Floor cues for the area: placeholder ambience,
   blocker/world-change cue, Cicka cue if present, and transition/guitar cue
   where relevant
13. a tiny local beat state that feeds the shared First Playable Route State
14. a Compact Area Transition that carries the player to the next Ridge Area
    through a short authored handoff, cue/stinger, and framed respawn rather
    than playable travel, a vehicle mini-game, long cutscene, or map screen

Relay replaces the resident help beat with a brief playable linger, **Sit and
Play**, authored farewell, **Dedication Card**, and clean Bridge reset with no
player-facing ending-seen marker, changed world, Micka tease, or new objective.

### Agent-Ready Slice Contract

Before assigning a Ridge implementation issue to an AFK agent, make the slice
small and concrete enough to implement without resolving product taste:

1. Name the Ridge Area and route segment.
2. Name the local beat state before and after the slice.
3. Link the smallest relevant source docs from the Source Stack.
4. List required prompt/dialogue IDs or say that the slice creates
   Tone-Locked Placeholder Dialogue in the area's `dialogue.md`.
5. Describe the visible blocker before the slice and the visible world-change
   result after it.
6. Describe Cicka's before/after placement if the slice touches a route beat.
7. Name the exit condition or Compact Area Transition unlocked by the slice.
8. State the constraints it must preserve: Compact Ridge Stage, Minimum Route
   Cast, Minimal Route Guidance, First Playable Interaction Vocabulary, and no
   new fail state.
9. For audio-touching slices, state whether the slice uses the First Playable
   Audio Floor or deliberately defers audio with a silent placeholder.
10. Include acceptance checks: route reaches the slice start, the slice outcome
   is visible, the next route state or transition unlocks, and required runtime
   checks/playability evidence are recorded when code changes.

Avoid vague assignments like "make Concert Area" or "add the Dance Festival."
Prefer vertical route slices such as "Bridge blocker + Bridge Draftsperson +
toy-car handoff + opened crossing" where an agent can prove a player-facing
before/after state.

The first implementation issue should use the **Bridge Tracer Slice**. Do not
parallelize Concert, Dance Festival, or Relay implementation until Bridge has
proved the shared route state, prompts/dialogue shape, camera framing, Cicka
placement, transition handling, and blockout-art conventions.

## Source Stack

For Ridge rework issues, link the smallest relevant set:

- [`README.md`](./README.md): source matrix and update protocol
- [`summit.md`](./summit.md): product fantasy, pillars, and scope instincts
- [`story-level-bible.md`](./story-level-bible.md): route spine, area barricade
  chain, Cicka/guitar logic, ending order
- [`areas/`](./areas/README.md): Bridge, Concert, Dance Festival, Relay detail
- [`open-questions.md`](./open-questions.md): unresolved design gaps
- [`ridge-snapshot.md`](./ridge-snapshot.md): current Phaser prototype/runtime
  truth
- [`reference/`](./reference/README.md): art, audio, overlay, and asset support
- [`legacy/`](./legacy/README.md): superseded plans and prototype history

When implementing runtime changes, also link the relevant subset of:

- [`../../runtime-architecture.md`](../../runtime-architecture.md)
- [`../../runtime-modes.md`](../../runtime-modes.md)
- [`../../architecture-direction.md`](../../architecture-direction.md)
- [`../../design/style-guide.md`](../../design/style-guide.md)
- [`../../../.agents/rules/10-architecture.md`](../../../.agents/rules/10-architecture.md)
- [`../../../.agents/rules/20-game-runtime.md`](../../../.agents/rules/20-game-runtime.md)
- [`../../../.agents/rules/30-react-overlays.md`](../../../.agents/rules/30-react-overlays.md)

Use [`../mini-games/README.md`](../mini-games/README.md) for optional/current
mini-game routing.

## Prototype Reuse Rules

Useful legacy pieces may be adapted:

- typed Ridge Blockout Source contract, compiler, generated facts, and
  validation patterns
- preview/debugger workflow
- scene-owned Cicka display/audio/asset lessons
- Trail Card, Manual Page, scene UI, and Notebook shell patterns
- Potassium and Stampede as optional toy references

Do not inherit these as active route requirements:

- Cicka Home as central hub
- folded-desk route order
- platformer-like traversal
- required mini-game clears as first-ending proof
- Stampede-gated Cicka memory as first-ending dependency
- old M0-M7 sequence as live backlog

## Work Rules

- Publish approved implementation work as GitHub Issues before assigning an
  AFK/low-thinking agent.
- Keep source-of-truth claims in one canonical doc; do not paste transcripts
  into canon.
- Treat [`decision-intake.md`](./decision-intake.md) as the staging area for
  large grilling sessions.
- Keep shared runtime seams serialized; parallelize area docs, scene-local
  experiments, and reference packs.
- Update [`player-manual.md`](../player-manual.md) only when behavior ships.

## Ownership Boundaries

- Route canon: [`story-level-bible.md`](./story-level-bible.md)
- Area-local design: [`areas/`](./areas/README.md)
- Current prototype truth: [`ridge-snapshot.md`](./ridge-snapshot.md)
- Art/audio/overlay support: [`reference/`](./reference/README.md)
- Legacy/prototype history: [`legacy/`](./legacy/README.md)
- Runtime architecture: [`../../runtime-architecture.md`](../../runtime-architecture.md)
- Live backlog: GitHub Issues

## First-Agent Checklist

Before changing Ridge docs or implementation:

1. Read [`README.md`](./README.md).
2. Identify whether the task is route canon, area detail, runtime prototype,
   reference support, legacy adaptation, or live issue work.
3. Read only the matching source docs.
4. Update one canonical target per claim.
5. Leave unresolved or taste-sensitive decisions in
   [`open-questions.md`](./open-questions.md) or
   [`decision-intake.md`](./decision-intake.md).
