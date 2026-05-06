# Final Synthesis: The Sketchbook Summit

## Verdict

**Winner: Agent D, The Sketchbook Summit.**

The final direction uses Agent D as the production spine, Agent A for overworld movement fantasy, Agent B for systems restraint, and Agent C for Muay Thai/game-feel spark.

## One-Sentence Game

The interactive portfolio is a compact sketchbook hike up a tiny city-hill, where playful hobby props open short, juicy mini-games that reward Stickers, secrets, and movement changes on the path to Contact Peak.

## Core Pillars

1. **Small World, Big Curiosity**: the overworld stays compact, readable, and dense with odd props, characters, shortcuts, and visible destinations.
2. **Movement Is The Main Reward**: the best upgrades make the same world feel better to traverse before they serve as keys.
3. **One Scene, One Toy**: each mini-game gets one strong verb and one pressure system.
4. **Personality Through Play**: hobbies and portfolio identity are expressed through mechanics, not only text.
5. **Prototype Fun Before Visual Polish**: simple graphics are acceptable if input, feedback, retry flow, and audio cues feel good.

## Overworld

The overworld becomes **The Sketchbook Summit**: a side-view street folded into a small vertical climb. The player should see **Contact Peak** early, then get pleasantly distracted by reachable-looking routes, props, characters, and secrets.

Keep the world to three zones until proven otherwise:

- **Outskirts**: current street, basement hatch, banana secret, first Glasses reveal.
- **Hobby Block**: Hobbies room, rooftop route, hobby props, friendly characters, mini-game entrances.
- **Summit Gate**: final climb and contact/credits route.

The loop:

1. Wander toward a visible landmark.
2. Notice a strange prop, character, scribble, sound cue, or jittering secret.
3. Enter a Phaser scene or open a React overlay.
4. Play a 2-6 minute mini-game or learn a small secret rule.
5. Earn a Sticker, stamp, shortcut, hint, or world change.
6. Return to the overworld with one new thing to try.

## Progression Language

Use one main reward language: **Stickers**.

Stickers are simple bridge-owned progress facts. They can unlock movement, routes, props, or final-gate credit, but they should not become RPG stats.

Recommended first set:

- **Glasses**: existing artifact; reveal hidden triggers and sketch glitches.
- **Circuit Sticker**: earned from Potassium Slip; powers odd machines and the first mini-game hint surface.
- **Receipt Glider**: hold jump while falling to drift; the first movement joy upgrade.
- **Spring Sticker**: higher jump or double-jump-lite.
- **Focus Sticker**: earned from Muay Thai; unlocks timing-based props or shortcuts.
- **Manual Pages**: knowledge clues, not currency. They teach interactions the player can perform.

Use **Hobby Stamps** for completion tracking:

- **Played stamp**: the player completed or meaningfully sampled the mini-game.
- **Shiny stamp**: optional mastery goal.

Final unlock: reach Contact Peak after Glasses plus any four meaningful mini-game/sticker milestones. Do not require perfect completion.

## Mini-Game Slate

### 1. Potassium Slip

Status: shipped anchor and benchmark.

Keep the banana ricochet run as the flagship proof that the portfolio can hide a real arcade game. Its Circuit reward should matter in the wider world, but the run itself should not absorb every new progression idea.

Next design task: document Potassium as the "done mini-game" standard: clear core verb, mobile-first control, short restart loop, reward, records, return path, and focused runtime modules.

### 2. Muay Thai Mayhem

Theme: fitness and Muay Thai.

Inspiration: Clair Obscur, fighting games, and Agent C's "combat as conversation."

Core verb: read a telegraph and answer with a timed defensive action.

Shape:

- One opponent first: `TODO: AI` training dummy.
- Attack turn: choose Jab, Teep, Kick, Guard, or Breathe.
- Defense turn: enemy performs a clear rhythm pattern.
- Tap, hold, or swipe to dodge, guard, or parry.
- Perfect defense builds Focus.
- Focus powers a goofy knee finisher.

Scope limit: one arena, one opponent, three rounds, generous timing windows, optional shiny mastery. No full fighting-game engine.

Mobile profile: 2-4 large buttons plus tap/hold/swipe timing.

### 3. Deadline Garden

Theme: work pressure and focus.

Inspiration: Vampire Survivors.

Core verb: move through pressure while auto-attacks and upgrades create a power spiral.

Shape:

- 3-minute run.
- Enemies are emails, pings, quick questions, and calendar blocks.
- Auto-attacks are Coffee Orbit, Pomodoro Pulse, Rubber Duck Decoy, and Refactor Beam.
- XP pickups are coffee beans or sticky notes.

Scope limit: one board, four weapons, six upgrades, one timer win condition.

Mobile profile: drag-to-move; no attack buttons.

### 4. Manual Page Mystery

Theme: curiosity and hidden knowledge.

Inspiration: Tunic.

Core verb: notice a clue and apply it in the world.

Shape:

- Manual pages are found through overworld exploration and mini-game rewards.
- Each page teaches a hidden interaction with a mobile equivalent.
- Pages should clarify, not obscure: landmarks and hints come first, secret input comes second.

Scope limit: three pages in the first pass.

Mobile profile: tap, hold, swipe, and stand-still interactions only.

### 5. One Systemic Puzzle Later

Theme candidate: art or engineering creativity.

Inspiration: Divinity/BG3.

Choose **one**, not both, after Muay Thai and Deadline Garden prove the mini-game pipeline:

- **Paint Alchemy**: four paint surfaces with deterministic interactions.
- **Barrelmancer Whiteboard**: 5x5 grid puzzle with sticky notes, coffee, bugs, firewalls, and rubber ducks.

Scope limit: four object types, handcrafted puzzles, deterministic pure rules tests, no procedural generator.

## Mobile Control Profiles

Every mini-game must choose one profile before implementation:

- **Drag Board**: aim, drag, release, hold recall.
- **Virtual Buttons**: 2-4 large buttons, no tiny active-play UI.
- **Direct Touch Grid**: tap/select/move, undo, visible return.
- **Drag-To-Move**: one-thumb movement with no attack button.

Rules:

- No required multi-touch.
- No keyboard-only secrets.
- Include a visible Return action plus `Esc` on desktop.
- Arcade boards prefer portrait-first presentation.
- Side-view scenes use `portrait-cover` where it protects the playfield.

## Architecture Rules

- Mini-games are Phaser **Scenes** under `src/game/scenes/<miniGame>/`.
- React **Overlays** handle instructions, manuals, drafts, results, and score summaries.
- Scene-owned **Triggers** enter mini-games or open overlays through bridge callbacks.
- Durable progress lives in the bridge store as small facts: completed games, earned Stickers, best scores, discovered pages.
- Scene-local runtime comes first. Promote shared code only after repeated pain appears.
- Do not create a generic mini-game framework during Round 001.

Recommended mini-game folder:

```txt
src/game/scenes/<miniGame>/
  README.md
  index.ts
  sceneContext.ts
  runtime/
    <MiniGame>Scene.ts
    controls.ts
    session.ts
    renderer.ts
    rules.test.ts
```

Only add files that the scene earns.

## First Implementation Path

1. **Progress spine**: define the smallest bridge progress facts for Stickers, played stamps, shiny stamps, and manual pages.
2. **Potassium integration**: make Circuit matter outside the run and document Potassium as the mini-game benchmark.
3. **One overworld movement slice**: add Receipt Glider or equivalent and one route that proves the world can feel new without growing huge.
4. **Muay Thai Mayhem prototype**: one opponent, one arena, three actions, one Focus finisher, touch controls from day one.
5. **Deadline Garden prototype**: 3-minute low-input run to balance the skill-heavy Muay Thai slice.
6. **Manual Pages**: add three knowledge clues after there are enough interactions worth hinting.
7. **Contact Peak gate**: require Glasses plus any four meaningful milestones.

## Rejected Or Deferred

- Full generic mini-game framework.
- Full fighting-game engine.
- Large Hollow Knight-style platform combat.
- Multiple systemic puzzle games at once.
- Completion of every stamp as the final requirement.
- Large overworld expansion before movement upgrades prove value.
- Obscure secrets without A Short Hike-style landmarks and Tunic-style clues.

## Definition Of A Good Mini-Game

A candidate mini-game is ready to expand only when its 60-second prototype passes this test:

- the core verb is understandable without a long tutorial
- mobile controls work in the first prototype
- losing or finishing naturally invites one retry
- the reward changes the overworld, Hobbies room, Basement, or player knowledge
- it can return cleanly to the parent scene
- at least one deterministic rules path can be tested outside Phaser when the logic branches

## Final Design Thesis

The best version of this portfolio is not a giant game. It is a small place with surprising depth: a cozy climb, a few excellent toys, and enough secrets that the player feels they are learning the author's taste by playing it.
