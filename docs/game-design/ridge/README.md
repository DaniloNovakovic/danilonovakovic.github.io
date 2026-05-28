# Ridge Design Router

This is the first doc to read before changing Ridge design, Ridge planning, or
Ridge implementation issues. It is the pre-production router for the desired
game rework, while the existing Phaser Ridge remains a legacy prototype and
runtime reference.

The active pre-production product direction is the linear emotional Ridge route:

```text
Bridge Area / Blueprint Bridge
  -> Concert Area / Concert Crossing Beat
  -> Dance Festival Area / Opening Dance Shuttle Beat
  -> Relay Spire / Guitar Farewell / Cicka Threshold Farewell
```

The current folded/Cicka Home/platformer-like Phaser Ridge is a prototype and
runtime reference, not the desired product target.

## Source Matrix

Use each file for exactly one concern:

| Concern | Source | Notes |
| --- | --- | --- |
| Domain language | [`../../../CONTEXT.md`](../../../CONTEXT.md) | Use these terms exactly. Add only stable domain terms and ambiguities. |
| Shipped behavior | [`../player-manual.md`](../player-manual.md) | Update only when behavior ships. |
| Current Ridge route canon | [`story-level-bible.md`](./story-level-bible.md) | Route spine, area barricade chain, cross-area Cicka/guitar logic, ending order. |
| Area-specific design canon | [`areas/`](./areas/README.md) | Local geography, blockers, residents, prompts, staging, Cicka Resting Spots, visual/audio notes. |
| Current runtime/prototype truth | [`ridge-snapshot.md`](./ridge-snapshot.md) | What exists now in the Phaser prototype, what can be reused, and what is disposable. |
| Active open questions | [`open-questions.md`](./open-questions.md) | True design unknowns and blockout-detail TBD. Area premises may already be accepted even when prompt/topology details remain open. |
| Product vision | [`summit.md`](./summit.md) | Durable fantasy and pillars, not detailed route implementation. |
| Implementation sequencing | [`milestone-plan.md`](./milestone-plan.md) | Current route-reset milestones, source stack, prototype reuse rules, and agent checklist. Not live backlog. |
| Runtime blockout contract | [`map-language.md`](./map-language.md) | Source format and generated facts for the current/prototype blockout. |
| Legacy prototype history | [`legacy/`](./legacy/README.md) | Superseded folded/Cicka Home plans, old summit/milestone history, map plans, and reviews. Reference only unless an active doc links there. |
| Art/audio/asset support | [`reference/`](./reference/README.md) | Reference packs that support active docs but do not override route canon. |
| Live work | GitHub Issues | PRDs, current backlog, triage state, and agent briefs. |

When docs disagree about future Ridge design, prefer `CONTEXT.md`,
`story-level-bible.md`, and the matching `areas/` doc. When docs disagree about
current runtime behavior, prefer runtime source plus `ridge-snapshot.md`.

## Status Labels

Use these labels at the top of Ridge planning docs or sections:

- `research-input`: material from a transcript or research pass, not canon.
- `candidate`: plausible direction that needs Danilo or role review.
- `accepted`: may guide future design and issue writing.
- `implemented`: exists in runtime/prototype.
- `shipped`: player-facing behavior; also update `player-manual.md`.
- `deferred`: valid idea, not current scope.
- `rejected`: do not revive without new Danilo direction.
- `superseded`: kept only for history or comparison.
- `needs-HITL`: blocked on taste, tribute, naming, scope, or irreversible product choice.

Only `accepted`, `implemented`, and `shipped` material may drive implementation.
If unsure, mark the point as `candidate` or move it to open questions.

## Legacy Prototype Rules

Treat these as prototype/reference unless a task explicitly says to adapt them:

- Cicka Home as the central hub.
- Cicka Home mutation ledgers as the main memory model.
- Folded-desk route order.
- Required jump/platformer traversal.
- Main-path slopes, ramps, wall jumps, double jumps, or precision platforming.
- Mini-game clears as required first-ending proof.

Useful legacy pieces may still be preserved or adapted: the Ridge Blockout
Source contract, compiler, generated facts, validation, and preview/debugger
workflow.

Superseded planning docs live under [`legacy/`](./legacy/README.md). Do not
search that folder first when updating active route design.

## Update Rules

For Ridge planning changes:

1. Read this file first.
2. Use `CONTEXT.md` vocabulary exactly.
3. Update one canonical target file per claim.
4. Do not paste transcripts into source-of-truth docs.
5. Put area-local accepted detail in [`areas/`](./areas/README.md); update the
   bible only when route spine, cross-area dependency, or ending logic changes.
6. Put unresolved design gaps in [`open-questions.md`](./open-questions.md) or a decision intake.
7. Put implementation work in GitHub Issues, not local backlog sections.
8. If a chat creates many claims, use [`decision-intake.md`](./decision-intake.md) before updating canon.

## Size Guardrails

These are soft caps. When a section crosses them, summarize, split, or delete
stale material before appending more.

| File type | Soft cap |
| --- | ---: |
| Router docs | 120 lines |
| `CONTEXT.md` | 700 lines |
| `story-level-bible.md` | 600 lines |
| Area docs | 300 lines |
| `ridge-snapshot.md` | 450 lines |
| Research intake | 150 lines |
| ADR | 80 lines |

If an area doc crosses the soft cap, split only stable subtopics such as
`layout.md`, `characters.md`, or `staging.md`, and leave a short summary plus
link in the area `README.md`.
