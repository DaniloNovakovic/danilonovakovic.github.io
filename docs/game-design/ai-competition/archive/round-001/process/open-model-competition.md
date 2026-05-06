# Open Model Competition

This document extends the AI Game Design Competition into a multi-model tournament.

The current local round is the **OpenAI league**. Run equivalent leagues in other model environments, then compare the league winners in a final global championship.

## Tournament Shape

```txt
OpenAI league
  agent proposals
  judge scores
  league winner

Gemini league
  agent proposals
  judge scores
  league winner

Claude league
  agent proposals
  judge scores
  league winner

Cursor league
  agent proposals
  judge scores
  league winner

Global championship
  compare every league winner
  optionally include judge notes from each league
  declare global winner
  write final global synthesis
```

## Fairness Rules

- Every model league gets the same brief, proposal template, judging rubric, and architecture constraints.
- Do not show a model another model's submissions, winner, or synthesis until the global championship.
- Preserve raw outputs before editing or summarizing them.
- Use the same number of contestants and judges per league when possible.
- Tell every model the same scope: indie portfolio project, compact overworld, hobby mini-games, mobile-friendly, gameplay first.
- Avoid web browsing in one league unless every league can browse the same materials. Prefer local research docs as the shared source.
- Record the model name, environment, date, and any special constraints in the league result.

## Recommended League Format

For each model:

1. Create 3-5 proposal agents or proposal passes with different design lenses.
2. Score them with 2 judge passes:
   - gameplay/design judge
   - technical producer/architecture judge
3. Pick one league winner.
4. Write a league synthesis that names:
   - winner
   - runner-up strengths
   - ideas to steal
   - ideas to reject or defer
   - risks specific to that model's proposal set
5. Save the result using `model-league-result-template.md`.

## Suggested Design Lenses

Use these same lenses across models:

- **Cozy Explorer**: A Short Hike-inspired overworld, characters, movement upgrades, gentle discovery.
- **Systems Designer**: Ball x Pit, Vampire Survivors, Tunic, Divinity/BG3, small deterministic systems.
- **Combat Feel Designer**: Clair Obscur, fighting games, Hollow Knight, Muay Thai, timing and mastery.
- **Producer Architect**: shippability, folder rules, templates, mobile controls, vertical-slice order.

## Output Storage

Recommended folder convention:

```txt
docs/game-design/ai-competition/archive/round-001/model-leagues/
  openai/
    result.md
    submissions/
    judging/
  gemini/
    result.md
    submissions/
    judging/
  claude/
    result.md
    submissions/
    judging/
  cursor/
    result.md
    submissions/
    judging/
  global/
    championship.md
    final-global-synthesis.md
```

Create only the folders you need. Raw pasted outputs are valuable; do not over-polish them before the global round.

## Global Championship Rule

The global winner should not be the most verbose or most ambitious proposal. It should be the proposal that best combines:

- immediate fun
- indie scope
- current architecture fit
- mobile viability
- personality fit
- implementation momentum

The final global synthesis may steal from every model, but it must choose one coherent spine.
