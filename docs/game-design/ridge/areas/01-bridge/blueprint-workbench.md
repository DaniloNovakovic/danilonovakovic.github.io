# Blueprint Bridge Workbench

> Status: implemented.
> Parent: [`README.md`](./README.md).

- Entry: bring the toy car back to the Bridge Draftsperson ("Draw the Bridge").
  The camera eases onto the gap and a taped blueprint sheet with a dot grid
  appears over it. Leaving mid-drawing keeps the design; returning skips straight
  back to the table.
- Grid: 8 × 36-unit columns across the gap, rows from 3 above the deck to 2
  below. Four bank bolts: deck level and low on each cliff face.
- Tools: **Road** (the car drives on it; heavier) and **Wood** (supports only).
  Drag from a bolt or existing joint to a grid point; members reach about two
  squares, and an over-long drag slides to the farthest legal point. Tap a beam
  to repaint it with the current tool; **Eraser** taps or swipes beams away.
  Undo, Clear, and an ink budget (48) keep spam in check.
- Test: the toy car waits on the near bank while the bridge settles under its
  own weight, then drives right. Members strain visibly (wobble and hatch ticks,
  monochrome only) and snap past their strength, falling into the river as
  debris. Pass = car reaches the far-bank pennant.
- Tuning promise (covered by tests): bare decks and triangles with unjoined tops
  fail; any properly triangulated truss above or below the deck passes.
- Kindness: Draftsperson tips explain the failure (no road across, sagged under
  its own weight, snapped under the car, stuck). Hint shows the Draftsperson's
  sketch as a ghost to trace; after two failed tests it is offered outright and
  can be traced in one tap.
- Success: brief victory beat, then `bridge.draftsperson.bridge_built` thanks
  the player, beat becomes `bridge_complete`, and the player's own settled
  bridge is baked into the scenery; walkers follow its deck.
- Console/AI: `build road|wood X,Y X,Y`, `build test`, `build edit`,
  `build sketch`, `build done` (see `pnpm ridge:console --script "help"`).
- Physics is a pure deterministic XPBD sim in
  `src/game/core/ridge/bridgeBuilder/`, so the console verdict and the animated
  Phaser run always agree.
