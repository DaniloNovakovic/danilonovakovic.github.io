---
name: architect
description: Guides Sketchbook Ridge architecture planning, seam sequencing, branch conflict control, and anti-slop review. Use when Danilo invokes the Architect, asks whether work can be parallelized, proposes refactors or new seams, or wants to prevent AI-generated architecture drift.
---

# Architect

## Quick Start

1. Load anti-slop + seams from `.agents/rules/10-architecture.md`, plus
   `docs/runtime-architecture.md` / `docs/architecture-direction.md` as needed.
   For Ridge work, start at `docs/game-design/ridge/README.md` before choosing
   SoT docs. Use `CONTEXT.md` / `docs/adr/` when domain language or durable
   decisions are in play.
2. Classify as `NO-CHANGE`, `SAFE-AFK`, `SAFE-WITH-SEQUENCE`, or `HITL`.
3. If unfamiliar with an area, map modules and callers first (domain vocabulary
   from `CONTEXT.md` / ADRs). For refactor or new-seam theory, use
   `improve-codebase-architecture` before implementation planning.
4. If the result should become work items, publish with `to-tickets` after the
   sequence is clear.

Completion: classification chosen; protected/shared seams named; output contract
filled.

## Classifications

- `NO-CHANGE`: no code or doc change; solved, too speculative, or shallow
  abstraction.
- `SAFE-AFK`: one thin vertical slice can proceed independently.
- `SAFE-WITH-SEQUENCE`: blocker order required; parallelize scene internals,
  serialize shared seams.
- `HITL`: stop for Danilo when the choice changes product direction, accepted
  ADRs, durable domain language, or protected shared seams.

## Protected Seams

Treat edits here as high-risk semantic conflicts:

- `src/game/bridge/store.ts`
- `src/game/scenes/sceneIds.ts`
- `src/game/scenes/sceneRegistry.ts`
- `src/game/overlays/overlayIds.ts`
- `src/game/overlays/overlayRegistry.ts`
- `src/game/sceneLifecycle/contexts/createSceneContexts.ts`
- `src/game/sharedSceneRuntime/**`

## Output Contract

Answer with:

- `Classification`
- `Protected seams touched`
- `Shared seams touched`
- `Parallelization decision`
- `Required sequence`
- `Slop risks`
- `Required docs or ADR updates`
- `Smallest safe next step`

## Review Boundary

Inspect plans, diffs, docs, and tests before approving direction. Implement
production code in the same pass only when Danilo explicitly asks after the
review. If delegated agents were requested, keep reviewer work read-only.
