# Game Design

This directory separates shipped behavior, active Ridge pre-production design,
current runtime prototype truth, long-term direction, and reference material.
Do not treat every file here as equally active.

## Source Of Truth

- **Shipped player behavior:** [`player-manual.md`](./player-manual.md).
- **Ridge design router:** [`ridge/README.md`](./ridge/README.md).
- **Active Ridge pre-production story/route canon:** [`ridge/story-level-bible.md`](./ridge/story-level-bible.md).
- **Active Ridge pre-production area design:** [`ridge/areas/`](./ridge/areas/README.md).
- **Current Ridge runtime/prototype snapshot:** [`ridge/ridge-snapshot.md`](./ridge/ridge-snapshot.md).
- **Current Bridge runtime spatial source:** [`stageComposition.ts`](../../src/game/scenes/ridge/bridge/stageComposition.ts), described by
  [`ridge/ridge-snapshot.md`](./ridge/ridge-snapshot.md).
- **Legacy blockout contract (historical):** [`ridge/map-language.md`](./ridge/map-language.md) — source removed from repo.
- **Pre-production product vision:** [`ridge/summit.md`](./ridge/summit.md).
- **Milestone map:** [`ridge/milestone-plan.md`](./ridge/milestone-plan.md)
  for current route-reset milestones and prototype reuse rules.
- **Optional/current mini-game routing:** [`mini-games/README.md`](./mini-games/README.md).
- **Live PRDs, issues, triage state, and agent briefs:** GitHub Issues, as
  configured in [`../agents/issue-tracker.md`](../agents/issue-tracker.md).

For future Ridge design, prefer [`CONTEXT.md`](../../CONTEXT.md),
[`ridge/README.md`](./ridge/README.md), and
[`ridge/story-level-bible.md`](./ridge/story-level-bible.md), then the matching
[`ridge/areas/`](./ridge/areas/README.md) file for area-local detail. For
current runtime behavior, prefer runtime source and
[`ridge/ridge-snapshot.md`](./ridge/ridge-snapshot.md). For live work state,
prefer GitHub Issues.

## Documents

- **[Player Manual](./player-manual.md)**: Shipped controls, rooms,
  interactions, return behavior, and playtest notes.
- **[Ridge Design Router](./ridge/README.md)**: First-read status matrix for
  Ridge docs, source ownership, legacy prototype rules, and update protocol.
- **[Ridge Snapshot](./ridge/ridge-snapshot.md)**: Human-readable snapshot
  of the currently implemented/prototyped Ridge level, including which parts
  are disposable legacy prototype.
- **[Ridge Story/Level Bible](./ridge/story-level-bible.md)**: Prose-first
  route spine, cross-area dependencies, Living Proof, Cicka/guitar logic, and
  ending order for the active Bridge -> Concert -> Dance Festival -> Relay/Cicka
  direction.
- **[Ridge Areas](./ridge/areas/README.md)**: Local source-of-truth docs for
  Bridge, Concert, Dance Festival, and Relay Ending design details. Area
  folders may contain narrow subdocs for layout, characters, or interaction
  flow when one README would get bulky.
- **[Ridge Decision Intake](./ridge/decision-intake.md)**: Routing template for
  future grilling or research transcripts so candidate ideas do not become
  accidental canon.
- **[Ridge Open Questions](./ridge/open-questions.md)**: Active unresolved
  ending, Dance Festival, dependency, and scope questions for future grilling.
- **[Mini-Games](./mini-games/README.md)**: Routing index for optional and
  current-prototype mini-game-specific rules. These docs do not make a
  mini-game required Living Proof unless the Ridge router and active route canon
  explicitly say so.
- **[Potassium Slip Manual](./mini-games/potassium-slip.md)**: Focused guide for the
  Potassium Slip mini-game.
- **[Stampede Sketch](./mini-games/stampede-sketch.md)**: Purpose, player fantasy, enemy
  intent, and first-slice asset direction for the Stampede mini-game.
- **[Sketchbook Ridge Summit](./ridge/summit.md)**: Pre-production vision for
  the desired Ridge rework, including pillars, ending promise, scope cuts, and
  optional-toy stance.
- **[Sketchbook Ridge Milestone Plan](./ridge/milestone-plan.md)**:
  Current route-reset milestones, source stack, prototype reuse rules, and
  first-agent checklist. It is not the live issue tracker.
- **[Ridge Blockout Source](./ridge/map-language.md)**: Historical typed
  blockout contract (removed from repo; Bridge stage composition is the active
  spatial source).
- **[Ridge Legacy Docs](./ridge/legacy/README.md)**: Superseded folded/Cicka
  Home map plans, old summit/milestone history, and blockout reviews. Reference
  only unless a current active doc explicitly links there.
- **[Ridge Reference Packs](./ridge/reference/README.md)**: Art/audio/overlay
  and asset support packs. Use when active docs or implementation issues need
  support material.
- **[Sketchbook Ridge Asset Staging Plan](./ridge/reference/asset-staging-plan.md)**:
  Organization guide for POC assets, prepared runtime candidates, and
  milestone-safe adoption.
- **[Cicka Runtime Asset Audit](./ridge/reference/cicka-runtime-asset-audit.md)**:
  First AI-generated sprite adoption review and follow-up gates.
- **[Sketchbook Ridge M3 Visual Pack](./ridge/reference/m3-visual-pack.md)**:
  Reference visual direction for Cicka, NPCs, landmarks, stickers, and M4
  placeholders.
- **[Sketchbook Ridge M3 Overlay Pack](./ridge/reference/m3-overlay-pack.md)**:
  Reference Trail Card, Manual Page, mobile readability, and reward-state spec.
- **[Sketchbook Ridge M3 Audio Pack](./ridge/reference/m3-audio-pack.md)**:
  Reference Ridge, Cicka, optional mini-game, and timing-cue audio direction.

## Document Status

- **Shipped:** `player-manual.md`.
- **Ridge routing and governance:** `ridge/README.md` and
  `ridge/decision-intake.md`.
- **Active Ridge open questions:** `ridge/open-questions.md`.
- **Active Ridge pre-production design:** `ridge/README.md`,
  `ridge/areas/`,
  `ridge/story-level-bible.md`,
  `ridge/summit.md`, and `ridge/milestone-plan.md`.
- **Optional/current mini-game design:** `mini-games/potassium-slip.md` and
  `mini-games/stampede-sketch.md`. These are local mini-game contracts, not
  required first-ending Living Proof.
- **Current Ridge runtime/prototype reality:** `ridge/ridge-snapshot.md`.
- **Current runtime source:** `../../src/game/scenes/ridge/bridge/stageComposition.ts`.
- **Historical blockout documentation:** `ridge/map-language.md`.
- **Legacy/prototype topology and planning history:** `ridge/legacy/`.
- **Reference/provenance:** `ridge/reference/` plus `docs/research/`. These can
  guide future work, but should not override active Ridge design, shipped
  behavior, runtime docs, or GitHub issues.
- **Implementation source:** `../runtime-architecture.md`,
  `../runtime-modes.md`, and scoped rules under `../../.agents/rules/`.
- **Issue tracker:** PRDs, implementation issues, triage state, current backlog,
  and agent briefs live in GitHub Issues. Do not mirror live issue state here.
- **Retention:** archive and staging folders must earn their keep. If a folder
  is no longer active, it needs a clear provenance reason and deletion trigger;
  otherwise summarize the useful decision and remove the bulk.

## Core Pillars

1. **Discovery:** The world is full of hidden artifacts that change how you see and interact with it.
2. **Evolution:** The game starts as a raw sketch and becomes a polished product through player action.
3. **Fun & Surprise:** Secrets, mini-games, and "glitches" keep the experience engaging.

When a concept becomes shipped behavior, update `player-manual.md` first. When
current Ridge runtime/prototype reality changes, update `ridge/ridge-snapshot.md`.
When future Ridge route canon changes, update `ridge/story-level-bible.md`
through the routing rules in `ridge/README.md`. When area-local accepted detail
changes, update the matching file under `ridge/areas/`. When work needs
planning, publish or update GitHub issues instead of growing local backlog
sections.
