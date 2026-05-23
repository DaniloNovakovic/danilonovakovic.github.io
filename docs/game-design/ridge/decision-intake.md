# Ridge Decision Intake

Use this when a grilling session, research pass, or Danilo conversation creates
many possible Ridge decisions. A transcript is input, not canon.

The job of a decision intake is to classify claims, compress them, and route
each claim to one canonical home.

## Routing Rules

| Claim type | Destination |
| --- | --- |
| New stable domain term or ambiguity | [`../../../CONTEXT.md`](../../../CONTEXT.md) |
| Accepted route spine, ending order, Cicka, guitar, or Living Proof decision | [`story-level-bible.md`](./story-level-bible.md) |
| Accepted area-local Bridge, Concert, Dance Festival, or Relay detail | matching file under [`areas/`](./areas/README.md) |
| Current implemented/runtime truth | [`ridge-snapshot.md`](./ridge-snapshot.md) or runtime source |
| Hard-to-reverse surprising trade-off | `docs/adr/NNNN-slug.md` |
| Work to build | GitHub Issue |
| Raw inspiration, rejected ideas, or source rationale | `docs/research/provenance/` or no repo change |

Do not update multiple canon docs with the same decision. Link instead.

## Intake Template

```md
# Decision Intake: <Topic> - YYYY-MM-DD

Status: research-input
Source: grilling transcript / research pass / Danilo conversation
Canon target: none yet
Reviewer needed: yes/no

## One-Screen Summary

- 3 to 5 bullets max.

## Candidate Decisions

| ID | Claim | Conflicts with current docs? | Proposed home | Status |
| --- | --- | --- | --- | --- |

## Canon Updates Requested

- `CONTEXT.md`: terms only
- `story-level-bible.md`: route spine, cross-area dependencies, ending logic only
- `areas/`: area-local accepted detail only
- `ridge-snapshot.md`: runtime truth only
- GitHub issue: implementation only

## Rejected / Deferred

Ideas that must not leak into implementation.

## HITL Questions

Only product, tone, tribute, naming, or irreversible scope questions.
```

## Area Update Template

Use this shape when a decision intake produces accepted detail for one Ridge
Area. Keep the area `README.md` as the first local home; split subdocs only after
it crosses the soft cap in [`README.md`](./README.md).

```md
# <Area Name>

Status: accepted / candidate / superseded
Parent: Ridge Areas
Scope: one area only

## Contract

10 bullets max: what must stay true.

## Player Path

8 steps max.

## Characters

Role-first labels only until naming pass.

## Cicka Use

Presence, marks, limits, no exposition.

## Out Of Bounds

Rejected names, mechanics, tone, reveals.

## Open Slots

Only unresolved decisions, each with owner/status.

## Sources

Links only. No transcript paste.
```

## Failure Modes

- Pasting transcripts into `story-level-bible.md`.
- Treating provenance or research summaries as active spec.
- Using `CONTEXT.md` as a story bible instead of a glossary.
- Repeating one decision in `summit.md`, `story-level-bible.md`,
  `ridge-snapshot.md`, and GitHub Issues.
- Letting `candidate` ideas drive implementation.
- Creating ADRs for reversible tone choices.
- Locking proper names before role-first labels survive play/design review.
- Mirroring GitHub backlog state in local docs.
