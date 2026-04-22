# State

## Intent

Make an object's behavior depend on what state it's in, without drowning in `if` ladders or boolean flag combinations. Each state is an object that encapsulates the behavior for that state, and the object delegates to its current state.

## The Pattern

The *State* chapter covers two flavors that are often (wrongly) treated as separate patterns:

1. **Finite State Machine (FSM)** — one current state at a time; transitions are explicit edges between states. Good for things with a small, well-understood set of modes (idle / walking / jumping / falling).
2. **Pushdown Automaton** — a *stack* of states. Push a state to enter it (e.g. "open pause menu"), pop to return. Good when you want the old state to resume cleanly after a temporary overlay.

Both are in the same chapter. Don't treat them as separate patterns.

## When to Use It

- You catch yourself with more than two booleans tracking the same entity (`isJumping`, `isGrounded`, `isFalling`, `isClimbing`…) and the combinations don't all make sense.
- Transitions have rules: "can only jump if grounded"; "can only interact if exploring."
- You want per-state behavior (e.g. "while paused, ignore input but keep rendering").

Use a pushdown automaton when you need nested modes that should resume cleanly (pause overlay, modal dialog, cutscene).

## Keep in Mind

- FSMs are great until a state-to-state transition needs complex logic; that's a smell that you might want a *hierarchical* FSM or a different abstraction entirely.
- Keep states as plain data + functions in TS; don't reach for class hierarchies unless behavior really demands it.
- Don't confuse state-the-object with state-the-data. The pattern is about who owns the behavior, not about where the fields live.

## In JS/TS + Phaser

- A discriminated union is the TS-idiomatic way to model an FSM: `type PlayerState = { kind: 'idle' } | { kind: 'walking'; dir: -1 | 1 } | { kind: 'jumping'; since: number } ...`.
- Per-state handlers become pure functions: `function tick(state: PlayerState, input: Input, dt: number): PlayerState`. Easy to test without Phaser.
- Phaser scenes are already an engine-level FSM (`scene.start`, `scene.pause`, `scene.stop`); lean on that rather than recreating it.

## In this repo

- `[src/runtime/gameState.ts](../../src/runtime/gameState.ts)` defines `GameState` (`EXPLORING`, `IN_MINIGAME`), which the bridge tracks — a simple two-state FSM for app mode.
- `[GameKernel](../../src/core/kernel/GameKernel.ts)` transitions between contexts based on bridge state and mini-game type — a coarse scene-level FSM, implemented ad-hoc.
- **Player Movement FSM:** Player movement is implemented as an explicit Finite State Machine using a TypeScript discriminated union (`PlayerState`) in `[src/core/ecs/components/player.ts](../../src/core/ecs/components/player.ts)`.
  - States: `idle`, `walking`, `jumping`, `falling`.
  - Logic: Managed by `tickFsm` in `[playerSystems.ts](../../src/core/ecs/systems/playerSystems.ts)`.
- A pushdown automaton isn't needed today because overlay pause is handled at kernel level — but if we add nested modals (e.g. settings *over* a paused mini-game), that's the moment to add one.

## Status

`adopted` — player movement migrated to a proper state machine; coarse kernel FSM active.

## See also

- Book chapter: [State](https://gameprogrammingpatterns.com/state.html)
- Related: [Update Method](./update-method.md), [Command](./command.md), [Subclass Sandbox](./subclass-sandbox.md)