# Game Design

This directory separates shipped behavior, current Ridge design, long-term
direction, runtime blockout source, and reference material. Do not treat every
file here as equally active.

## Source Of Truth

- **Shipped player behavior:** [`player-manual.md`](./player-manual.md).
- **Runtime spatial source:** [`folded-desk-ridge.blockout.txt`](../../src/game/scenes/ridge/blockout/maps/folded-desk-ridge.blockout.txt), described by
  [`ridge/map-language.md`](./ridge/map-language.md).
- **Current Ridge level read:** [`ridge/current-level.md`](./ridge/current-level.md).
- **Current map target:** [`ridge/map-plans/proper-map-plan.md`](./ridge/map-plans/proper-map-plan.md).
- **Product vision:** [`ridge/summit.md`](./ridge/summit.md).
- **Milestone map:** [`ridge/milestone-plan.md`](./ridge/milestone-plan.md).
- **Mini-game routing:** [`mini-games/README.md`](./mini-games/README.md).
- **Live PRDs, issues, triage state, and agent briefs:** GitHub Issues, as
  configured in [`../agents/issue-tracker.md`](../agents/issue-tracker.md).

When files disagree, prefer this order: shipped behavior, runtime source,
current Ridge level read, current map target, product vision, milestone map,
then reference/provenance.

## Documents

- **[Player Manual](./player-manual.md)**: Shipped controls, rooms,
  interactions, return behavior, and playtest notes.
- **[Current Ridge Level](./ridge/current-level.md)**: Human-readable snapshot
  of the currently implemented/prototyped Ridge level and what source owns each
  part.
- **[Mini-Games](./mini-games/README.md)**: Routing index for mini-game-specific
  rules and Ridge reward contracts.
- **[Potassium Slip Manual](./mini-games/potassium-slip.md)**: Focused guide for the
  Potassium Slip mini-game.
- **[Stampede Sketch](./mini-games/stampede-sketch.md)**: Purpose, player fantasy, enemy
  intent, and first-slice asset direction for the Stampede mini-game.
- **[Sketchbook Ridge Summit](./ridge/summit.md)**: Post-competition
  production vision for the Ridge overworld and opt-in mini-games.
- **[Sketchbook Ridge Milestone Plan](./ridge/milestone-plan.md)**:
  Durable milestone, branch, shared-seam, and ownership map. It is not the live
  issue tracker.
- **[Sketchbook Ridge Proper Map Plan](./ridge/map-plans/proper-map-plan.md)**:
  Current target map plan for the folded, multi-screen Ridge around Cicka Home.
- **[Ridge Map Language](./ridge/map-language.md)**: Text-first blockout
  language for Ridge room beats, environment tags, traversal primitives, and
  greybox generation.
- **[Ridge Blockout Source](../../src/game/scenes/ridge/blockout/maps/folded-desk-ridge.blockout.txt)**:
  Current runtime spatial data for the seamless Ridge world. It lives under
  the Ridge runtime because it is build input, not prose.
- **[Ridge Blockout Fun Review](./ridge/reviews/blockout-fun-review.md)**: Design review
  of the first blockout skeleton.
- **[Sketchbook Ridge Topology Spike](./ridge/map-plans/topology-spike.md)**:
  Earlier M5 map-design spike. Keep as design history unless a current plan
  explicitly points back to it.
- **[Sketchbook Ridge Long-Term Topology Ideas](./ridge/map-plans/long-term-topology-ideas.md)**:
  Exploratory long-term topology companion. Not an active roadmap.
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
  Reference Ridge, Cicka, Potassium acknowledgement, Stampede, and Telegraph
  audio direction.

## Document Status

- **Shipped:** `player-manual.md`.
- **Current design:** `ridge/current-level.md`,
  `ridge/summit.md`, `ridge/milestone-plan.md`,
  `ridge/map-plans/proper-map-plan.md`,
  `mini-games/potassium-slip.md`, and `mini-games/stampede-sketch.md`.
- **Current runtime source:**
  `../../src/game/scenes/ridge/blockout/maps/folded-desk-ridge.blockout.txt`.
- **Current runtime source documentation:** `ridge/map-language.md`.
- **Planning history / design review:** `ridge/map-plans/topology-spike.md`
  and `ridge/reviews/blockout-fun-review.md`.
- **Reference/provenance:** M3 visual/audio/overlay packs, asset staging,
  Cicka runtime asset audit, and long-term topology. These can guide future
  work, but should not override current design, shipped behavior, runtime docs,
  or GitHub issues.
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
current Ridge level reality changes, update `ridge/current-level.md`. When work
needs planning, publish or update GitHub issues instead of growing local backlog
sections.
