# Game Design

This directory separates shipped player-facing behavior from future design concepts.

## Documents

- **[Player Manual](./player-manual.md)**: Current shipped controls, rooms, interactions, return behavior, and playtest notes.
- **[Potassium Slip Manual](./potassium-slip.md)**: Focused guide for the Potassium Slip mini-game.
- **[Stampede Sketch](./stampede-sketch.md)**: Purpose, player fantasy, enemy intent, and first-slice asset direction for the Stampede mini-game.
- **[Sketchbook Ridge Summit](./sketchbook-ridge-summit.md)**: Post-competition production vision and development plan for the Ridge overworld and opt-in mini-games.
- **[Sketchbook Ridge Milestone Plan](./sketchbook-ridge-milestone-plan.md)**: Implementation milestone, branch, ownership, and issue-planning map for Ridge Summit.
- **[Sketchbook Ridge Asset Staging Plan](./sketchbook-ridge-asset-staging-plan.md)**: Planning and organization guide for POC assets, prepared runtime candidates, and milestone-safe adoption order.
- **[Sketchbook Ridge Long-Term Topology Ideas](./sketchbook-ridge-long-term-topology-ideas.md)**: Exploratory long-term map, shortcut, and secret-direction companion for Ridge after the current milestone is proven.
- **[Sketchbook Ridge M3 Visual Pack](./sketchbook-ridge-m3-visual-pack.md)**: Rade/Milena visual direction for Cicka, NPCs, landmarks, stickers, and M4 placeholders.
- **[Sketchbook Ridge M3 Overlay Pack](./sketchbook-ridge-m3-overlay-pack.md)**: Aleksandra's Trail Card, Manual Page, mobile readability, and monochrome reward-state spec.
- **[Sketchbook Ridge M3 Audio Pack](./sketchbook-ridge-m3-audio-pack.md)**: Django's Ridge, Cicka, Potassium acknowledgement, Stampede, and Telegraph audio direction.
- **[AI Game Design Competition Archive](./ai-competition/README.md)**: Closed provenance for the competition that produced the current Ridge Summit direction.

## Document Status

- **Shipped behavior:** `player-manual.md`.
- **Active product/design source:** `sketchbook-ridge-summit.md`,
  `sketchbook-ridge-milestone-plan.md`, `potassium-slip.md`, and
  `stampede-sketch.md`.
- **Active implementation source:** `../runtime-architecture.md`,
  `../runtime-modes.md`, and scoped rules under `../../.agents/rules/`.
- **Reference/provenance:** M3 visual/audio/overlay packs, asset staging,
  long-term topology, Notebook Shell spike/tournament docs, and prototype HTML.
  These can guide future work, but should not override the active milestone or
  runtime docs.
- **Archive:** `ai-competition/` is closed competition history. Do not treat it
  as an active roadmap or current source of truth. Search hits from
  `ai-competition/archive/**` are historical by default; use the active Summit,
  milestone, and runtime docs for current planning.

## Core Pillars

1. **Discovery:** The world is full of hidden artifacts that change how you see and interact with it.
2. **Evolution:** The game starts as a raw sketch and becomes a polished product through player action.
3. **Fun & Surprise:** Secrets, mini-games, and "glitches" keep the experience engaging.

When a concept becomes shipped behavior, update `player-manual.md` first. Keep speculative material in the Ridge Summit or milestone docs so agents do not treat old roadmaps as current implementation.
