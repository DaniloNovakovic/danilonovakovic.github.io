# Ridge Snapshot

> Status: implemented/prototype snapshot.
> This is the current human-readable snapshot of Ridge's implemented/prototyped
> state, not the active future design target, shipped player documentation, or
> issue tracker. Update this when current runtime behavior or prototype
> capability changes.

## Ownership

- **Shipped behavior:** [`player-manual.md`](../player-manual.md).
- **Ridge source router:** [`README.md`](./README.md).
- **Active story/route canon:** [`story-level-bible.md`](./story-level-bible.md).
- **Active area design:** [`areas/`](./areas/README.md).
- **Runtime architecture ADR:** [`../../adr/0005-ridge-console-core-and-stick-visuals.md`](../../adr/0005-ridge-console-core-and-stick-visuals.md).
- **Product vision:** [`summit.md`](./summit.md).
- **Live implementation work:** GitHub Issues.

If this file disagrees with the current Ridge runtime code about implemented
behavior, the code wins. If this file disagrees with GitHub about active work
state, GitHub wins.
If this file disagrees with `story-level-bible.md` or the matching `areas/`
doc about future route intent, the active design docs win.

## Current Runtime Shape

Player-facing Ridge entry (secret side game):

```text
Overworld banana peel
  -> win Potassium Slip (earn Circuit)
  -> insert Circuit into the street CRT (between Projects and Abilities)
  -> Ridge
```

Dev direct boot:

```text
?mode=interactive&startScene=ridge
```

Headless / AI playtest:

```text
pnpm ridge:console
pnpm ridge:console --script "look; go right 3; interact; advance"
pnpm ridge:console --script "look" --json
```

Current runtime characteristics:

- Gameplay authority lives in pure `src/game/core/ridge/` (`RidgeConsoleSession`).
- Phaser `RidgeScene` is a thin adapter: left/right (+ touch) walks progress,
  interact starts conversation, Scene UI owns the Persona-style talk panel.
- Default art is mathematical stick figures via `StickVisualProvider`
  (`src/game/scenes/ridge/art/`). Replace that provider later for iPad art
  without rewriting route logic.
- Bridge route beats still use bridge-store `firstPlayableRoute`
  (`intro` -> `needs_toy_car` -> `toy_car_shared` -> `bridge_complete` ->
  concert handoff).
- The Ridge Stage Debugger, Walk-Rail authoring commit plugin, and large PNG
  stage-plate pipeline were removed as disposable prototype tooling.
- **Stampede Sketch** remains a standalone optional scene; it is not on the
  active Bridge route.

## Active Runtime Route Read

```text
Nature / hill entry
  -> Cicka + toy car play spot (optional Persona-style choice)
  -> blocked bridge + unfinished blueprint
  -> Bridge Draftsperson
  -> Cicka Parallel Play (receive toy car)
  -> toy-car bridge test
  -> completed crossing
  -> Bridge-to-Concert handoff
```

Concert, Dance Festival, Relay, and the ending sequence remain future
implementation slices. Copy the Bridge console-content + stick-visual pattern.

## Console Contract (for AI agents)

Useful commands:

| Command | Meaning |
| --- | --- |
| `look` / `status` | Surroundings, nearby distances, beat, progress |
| `go left\|right [n]` | Walk the progress line |
| `interact [name]` | Start nearest/named conversation |
| `advance` | Continue halted conversation |
| `choose <n\|id>` | Persona-style reply |
| `leave` | Exit conversation early |
| `help` | Command list |

Observation JSON (`--json`) includes `nearby[].distance`, actors, inventory,
conversation state, and hints.

## What Remains Disposable

- Stick art itself (replace via VisualProvider)
- Exact progress numbers / interact radii
- Temporary conversation choice copy on first Cicka meet

## What Should Survive Area Blueprints

1. Pure console session + scripted playthrough tests
2. Progress-based Compact Ridge Stage spots
3. Conversation halt + React Scene UI panel
4. VisualProvider seam between gameplay and art
5. Bridge-store `firstPlayableRoute` for durable route beats
