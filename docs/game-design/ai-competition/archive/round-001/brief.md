# Round 001 Brief: Tiny Hike, Big Toy Box

## Goal

Design the next shape of the interactive portfolio: a compact cozy overworld, inspired by the fun of A Short Hike, with hobby-themed mini-games that capture the fun cores from the research folder.

The output should be a story and game design direction that can guide future implementation, not a giant speculative feature list.

## Required Ingredients

- A compact overworld with low-pressure exploration, readable landmarks, and soft-gated routes.
- Potassium Slip remains the flagship existing mini-game and a benchmark for "done".
- Mini-games should feel like playable hobbies or personality postcards.
- Each mini-game should be fun mechanically even with simple visuals.
- Mobile friendliness matters from the start.
- Scope should feel plausible for an indie portfolio project.

## Research Sources

Use the fun cores documented in `docs/research/`:

- A Short Hike: harmonious autonomy, joyful traversal, curiosity-led exploration, short complete experience.
- Ball x Pit: ricochet tactility, upgrade synergies, run escalation, persistent reward.
- Vampire Survivors: low-input accessibility, power spiral, reward cadence, cathartic overload.
- Clair Obscur: reactive turns, parry/dodge agency, rhythmic mastery.
- Fighting games: spacing, mental stack, hit feedback, modern controls, readable tension.
- Hollow Knight: precise movement, tension/release, SOUL-like resource choices, mastery routes.
- Tunic: knowledge gates, manual fragments, "aha" discovery.
- Divinity/BG3: small systemic toys, deterministic interactions, fallback paths, player creativity.

## Architecture Constraints

- Add playable mini-games as scene-owned Phaser worlds under `src/game/scenes/<miniGame>/`.
- Keep React overlays for menus, dialogue, manuals, score summaries, drafts, and results.
- Let existing bridge actions own scene entry, return, overlay open/close, and durable progress.
- Do not add new global stores or a second overlay registry.
- Use shared runtime or pure core modules only when repeated behavior earns them.

## Submission Format

Use [proposal-template.md](process/proposal-template.md).
