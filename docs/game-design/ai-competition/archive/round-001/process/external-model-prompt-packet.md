# External Model Prompt Packet

Use this packet when running the competition in Gemini, Claude, Cursor, or another model environment.

For repo-aware tools such as Cursor, give the model access to the repository and point it to the paths below. For chat-only tools, paste the brief, proposal template, judging rubric, and the relevant research summaries.

## Setup Prompt

```md
You are participating in a model league for an AI Game Design Competition.

Goal: write the best indie-scope game design proposal for improving a gamified portfolio.

Project context:
- Frontend: React + Vite.
- Game runtime: Phaser 4.
- Styling: TailwindCSS v4.
- Current architecture vocabulary:
  - Phaser Scenes are playable worlds.
  - React Overlays are menus, manuals, results, text-heavy UI, and dialogs.
  - Scene-owned Triggers enter scenes or open overlays.
  - Durable React/Phaser progress should live in the bridge store.
- Existing mini-game: Potassium Slip, a Ball x Pit-like vertical banana ricochet roguelite. Treat it as a successful anchor, not something to replace.

Design goal:
- Create a compact A Short Hike-inspired overworld.
- Add hobby/personality-themed mini-games inspired by the research.
- Keep scope indie and shippable.
- Prioritize gameplay fun over visual fidelity.
- Make mobile controls part of the first design pass.

Research fun cores:
- A Short Hike: compact exploration, low pressure, landmarks, joyful traversal, short complete experience.
- Ball x Pit: ricochet feel, upgrade synergies, run escalation, persistent reward.
- Vampire Survivors: low-input accessibility, power spiral, reward cadence.
- Clair Obscur: reactive turn-based combat, parry/dodge agency, rhythmic mastery.
- Fighting games: spacing, hit feedback, mental stack, modern controls.
- Hollow Knight: precise movement, tension/release, optional mastery.
- Tunic: knowledge gates, manual fragments, discovery through understanding.
- Divinity/BG3: deterministic systemic toys, player creativity, fallback paths.

Architecture constraints:
- New playable mini-games should be Phaser scenes.
- React overlays should handle instructions, score summaries, manuals, drafts, results, and text-heavy UI.
- Do not propose a new global store, second overlay registry, or generic mini-game framework unless repeated shipped pain proves it.
- Mini-games should be scene-owned and built around one strong verb.

Write one proposal using this structure:
- Title
- Pillars
- Overworld loop
- Progression
- 5-8 mini-game concepts
- Mobile controls
- Implementation scope
- Risks
- Fun thesis
```

## Contestant Prompts

Run one contestant for each lens.

### Contestant A: Cozy Explorer

```md
Use the setup prompt. Your design lens is cozy exploration.

Focus on an A Short Hike-inspired overworld, movement upgrades, characters, gentle secrets, landmarks, and the feeling of returning to the same compact world with new traversal joy.
```

### Contestant B: Systems Designer

```md
Use the setup prompt. Your design lens is systems-first mini-game anthology.

Pull from Ball x Pit, Vampire Survivors, Tunic, Divinity, and BG3, but keep every idea indie-scoped and rule-budgeted.
```

### Contestant C: Combat Feel Designer

```md
Use the setup prompt. Your design lens is combat and game feel.

Pull from Clair Obscur reactive turns, fighting games, Hollow Knight mastery, and Muay Thai. Keep it approachable, goofy, and mobile-friendly.
```

### Contestant D: Producer Architect

```md
Use the setup prompt. Your design lens is production and architecture.

Focus on the most shippable design system: folder conventions, mini-game templates, rules for submissions, vertical-slice order, mobile profiles, and a coherent final game direction.
```

## Judge Prompt

```md
You are judging this model league.

Evaluate every contestant proposal using this 100-point rubric:
- Fun core clarity: 20
- Indie scope control: 20
- Architecture fit: 20
- Mobile friendliness: 15
- Personality/hobby/theme fit: 15
- Incremental delivery plan: 10

Return:
- score table
- per-contestant notes
- winner
- what to steal for synthesis
- what to reject or defer

Judge candidly. The winner should be the most coherent shippable direction, not the most verbose pitch.
```

Run this judge prompt twice if possible:

- once as a gameplay/design judge
- once as a technical producer/architecture judge

## League Synthesis Prompt

```md
You are the final editor for this model league.

Using the contestant proposals and judge results:
- declare the league winner
- explain why it won
- steal the best ideas from losing proposals
- reject or defer risky ideas
- write a final league synthesis that can compete against other model league winners

The synthesis must be decisive. Do not average all proposals into a vague compromise. Choose one coherent spine.
```
