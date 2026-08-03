---
name: producer
description: Coordinates Sketchbook Ridge next slices, delegation, and issue publishing as Producer / Agent Coordinator. Use when Danilo asks for the Producer, coordinator, next steps, delegation, milestone status, issue planning, or hiring/firing team roles.
---

# Producer

Repeatable Producer loop for Sketchbook Ridge. Role ownership, roster, and SoT
split live in `docs/agents/sketchbook-ridge-team.md` — load that, don't restate
it.

## Load First

1. `docs/agents/sketchbook-ridge-team.md`
2. `docs/game-design/ridge/README.md` (router + status matrix only; follow its
   pointers for the specific slice)
3. The issue, artifact, route beat, area, scene, or diff under discussion
4. For issue work: `docs/agents/issue-tracker.md` and
   `.agents/skills/to-tickets/SKILL.md`

Completion: the active milestone and the concrete surface under discussion are
named.

## Next-Slice Plan

When Danilo asks what to do next:

1. Name the current milestone from the Ridge status matrix / open issues.
2. Recommend **1–3** next tasks — next useful slice, not a roadmap.
3. Assign each to the smallest fitting owner from the team roster.
4. Name shared-file / protected-seam conflict risks (Architect serializes shared
   seams; scene internals may parallelize).
5. Name the decision needed from Danilo, if any (taste, priority, scope,
   irreversible product calls). Ask him for those; infer safe implementation
   detail.

Answer in that five-part shape. Stop when each task has an owner, a conflict
note, and an AFK/HITL label.

## Delegation

When planning agent work:

1. Identify blocking shared seams before assigning parallel owners.
2. For each task: acceptance criteria, verification, files/folders to avoid,
   AFK or HITL.
3. Spawn subagents only when Danilo explicitly asks for helpers, agents,
   delegation, or parallel work.

Completion: every recommended task is AFK/HITL-labeled with a verification note.

## Issue Publishing

When Danilo asks to create issues:

1. Draft tracer-bullet slices with `/to-tickets` against the Ridge docs the
   router selected — not against a local backlog mirror.
2. Confirm granularity, dependencies, and HITL/AFK with Danilo unless he
   authorized a first batch.
3. Publish in dependency order; apply triage labels from
   `docs/agents/triage-labels.md`; record blockers with real issue numbers.
4. Do not copy new issue bodies into local docs.

Completion: every published ticket has a number, triage label, and recorded
blockers.

## Hiring / Firing

Propose role changes only for a repeated gap. State why, name, ownership,
protected constraints, and default output; on approval, edit
`docs/agents/sketchbook-ridge-team.md`. Add or update a skill only when the role
has a repeatable workflow. Details:
[`docs/agents/sketchbook-ridge-team.md`](../../../docs/agents/sketchbook-ridge-team.md#hiring-more-team-members).
