# Blueprint Bridge Workbench

> Status: implemented.
> Parent: [`README.md`](./README.md).

- Entry: show the toy car to the Bridge Draftsperson and choose "Set it on the
  blueprint".
  The camera eases onto the gap and a taped blueprint sheet with a dot grid
  appears over it. Leaving mid-drawing keeps the design; returning offers "Back to
  the table" (plus advice or later).
- Grid: 8 × 36-unit columns across the gap, rows from 3 above the deck to 2
  below. Four bank bolts: deck level and low on each cliff face. The bolts are
  the only ground; below the deck is air and river (the sheet has no bottom
  edge, and the water line is inked across the gap so nothing reads as a floor).
- Tools: **Road** (the car drives on it; heavier) and **Wood** (supports only).
  Drag from a bolt or existing joint to a grid point; members reach about two
  squares, and an over-long drag slides to the farthest legal point. Reach
  indicator: hovering a joint shows a faint dashed compass circle at max beam
  length; while dragging it darkens, every legal end point gets a small ring,
  and an over-long drag trails a dotted rubber band from the clamped end to the
  pointer. Tap a beam
  to repaint it with the current tool; **Eraser** taps or swipes beams away.
  Undo, Clear, and an ink budget (48) keep spam in check.
- Self-weight preview: after every edit the drawing is settled without the car
  (the same sim, frozen just after the first snap). Its droop shows as faint
  dashed pencil, members that would snap wear strain hatching, and once road
  reaches across the Draftsperson says whether it holds itself (`steady`) or
  not (`wobbly`). It never counts as an attempt.
- Test: the toy car waits on the near bank while the bridge settles under its
  own weight, then drives right. Members strain visibly (wobble and hatch ticks,
  monochrome only) and snap past their strength, falling into the river as
  debris. Pass = car reaches the far-bank pennant.
- Tuning promise (covered by tests): bare decks and triangles with unjoined tops
  fail; any properly triangulated truss above or below the deck passes.
- Kindness: Draftsperson remarks react to the failure (no road across, bare
  deck, loose triangle tops, low joints dangling over the river, snapped mid-span
  or by a bank, stuck). The `?` button (H) shows the Draftsperson's
  sketch as gray dashes to trace, with a caption naming it; after two failed
  tests it is offered outright and
  can be traced in one tap.
- Success: brief victory beat, then `bridge.draftsperson.bridge_built` thanks
  the player, beat becomes `bridge_complete`, and the player's own settled
  bridge is baked into the scenery; walkers follow its deck with their feet on
  the road (easing up from the lane footing at each bank).
- Console/AI: `build road|wood X,Y X,Y`, `build test`, `build edit`,
  `build sketch`, `build done` (see `pnpm ridge:console --script "help"`).
- Physics is a pure deterministic XPBD sim in
  `src/game/core/ridge/bridgeBuilder/`, so the console verdict and the animated
  Phaser run always agree.
