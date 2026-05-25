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
5. Guitar Farewell, Send the Sketchbook Prompt, Cicka Threshold Farewell, and
   Open Ridge Return State land without arcade gating
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
  docs until each area has layout, resident beats, blockers, Cicka presence,
  and exit conditions.
- **P2 First Playable Route Blockout**: prove the route can be walked end to
  end with placeholder art and no required precision platforming.
- **P3 Route Readiness Feedback**: make area barricades, resident help, world
  changes, and Relay arrival readable without a visible chore checklist.
- **P4 Ending Pass**: land Guitar Farewell, Send the Sketchbook Prompt, Cicka
  Threshold Farewell, Open Ridge Return State, and later Micka timing.

Optional mini-games, old Cicka Home mutation work, and folded-desk topology
enter these milestones only when an active route doc or issue pulls a specific
piece forward.

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
