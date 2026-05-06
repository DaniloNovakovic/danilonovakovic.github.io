# Agent D Proposal: The Sketchbook Summit

## Pillars

- **Small world, big curiosity**: compact, landmark-led, low-pressure exploration.
- **Mini-games as personality rooms**: learn the person through verbs, not resume panels.
- **One scene, one toy**: every mini-game is self-contained and built around one strong input idea.
- **Gameplay first, visuals economical**: spend polish on feedback, sound, telegraphs, and touch controls.
- **No architecture sprawl**: Phaser scenes own gameplay, React overlays handle text/menu UI, and bridge state owns progress.

## Core Concept

The portfolio becomes a small climb through a sketchy city-hill called **The Sketchbook Summit**. The player starts in a rough hand-drawn street, finds the Glasses in the Basement, reveals hidden unfinished objects, completes mini-games, earns Stickers, opens routes, decorates the Hobby room, and reaches a final contact/credits route.

Tone: warm, goofy, lightly self-aware. Less epic quest, more a weird little day where every hobby becomes an arcade machine.

## Overworld Loop

The player wanders a compact street/hill, notices a landmark or odd prop, interacts to open an overlay or enter a scene, plays for 2-6 minutes, earns a Sticker or route change, and returns with one new thing to try.

The overworld should stay to three zones:

- **Outskirts**: current street, basement hole, banana secret, first Glasses reveal.
- **Hobby Block**: Hobbies room, rooftop route, characters that point to mini-games.
- **Summit Gate**: final area unlocked after enough Stickers.

## Progression

- **Glasses** reveal hidden triggers and jittering secret entrances.
- **Coffee Sticker** grants sprint/dash or faster acceleration.
- **Spring Sticker** grants higher jump or double-jump-lite.
- **Circuit Sticker** from Potassium Slip activates odd machines and arcade props.
- **Focus Sticker** from Muay Thai unlocks timing-based obstacles.
- **Palette Sticker** from art colors certain sketch platforms.
- **Amp Sticker** from music opens sound/rhythm doors.

Final unlock: complete any four of six mini-games, keeping the game forgiving.

## Mini-Game Concepts

- **Potassium Slip**: flagship arcade run and production benchmark.
- **Muay Thai Mayhem**: 1-3 button timing duel against `TODO: AI`; attack turn, defense turn, Focus meter, knee strike.
- **Deadline Survivors**: 3-minute top-down survival against notifications, calendar pings, and quick questions.
- **Sketch Knight: Pogo Errands**: 3-room side-view pogo challenge inside a notebook page.
- **Manual Page Mystery**: Tunic-like knowledge rules layered across the overworld rather than a separate combat scene.
- **Barrelmancer Whiteboard**: 5x5 turn-based puzzle board where sticky notes, coffee, bugs, and firewalls chain react.

## Mobile Controls

Each mini-game must choose one approved profile:

- **Drag Board**: aim, drag, release.
- **Virtual Buttons**: 2-4 large buttons.
- **Direct Touch Grid**: tap/select/move.

Rules: 44px minimum touch targets, no required multi-touch, no keyboard-only secrets, visible Return action plus `Esc` on desktop, portrait-first for arcade boards, and `portrait-cover` for side-view scenes when needed.

## Implementation Scope

Vertical-slice order:

1. Competition docs and templates.
2. Progression spine: completed mini-games, earned Stickers, unlocked gates.
3. Overworld upgrade slice: one Sticker opens one route.
4. Potassium integration polish as benchmark.
5. Muay Thai Mayhem vertical slice.
6. Deadline Survivors vertical slice.
7. Manual Page Mystery.
8. Final Summit gate.

Recommended scene convention:

```txt
src/game/scenes/<miniGame>/
  README.md
  index.ts
  sceneContext.ts
  runtime/
    <MiniGame>Scene.ts
    session.ts
    controls.ts
    renderer.ts
    rules.test.ts
```

Only add deeper files when the scene earns them.

## Competition System Recommendation

Keep the competition package under docs:

```txt
docs/game-design/ai-competition/
  README.md
  brief.md
  proposal-template.md
  judging-rubric.md
  submissions/
  judging/
```

The synthesis should choose the smallest coherent spine, then pull only ideas that fit it.

## Risks

- Too many genres: enforce one-scene rule and 2-6 minute sessions.
- Progression bloat: use Stickers as simple booleans, not RPG stats.
- Architecture drift: avoid a new framework until repeated shipped pain proves it.
- Secrets becoming invisible: combine landmarks with manual-page hints.
- Visual overproduction: prototype with simple shapes, text, and sound first.

## Fun Thesis

This design is shippable because each piece can be built and enjoyed alone while still making the world feel more alive when connected. The overworld gives curiosity; mini-games give focused mastery.
