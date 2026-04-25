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

In use for runtime modes; still a candidate for deeper player movement:

- `[src/runtime/gameState.ts](../../src/runtime/gameState.ts)` defines `RuntimeMode` as a discriminated union (`exploring`, `reactOverlay`, `phaserScene`) plus pure helpers for interaction, close, and pause derivation.
- `[src/shared/bridge/store.ts](../../src/shared/bridge/store.ts)` keeps the current mode as the bridge's cross-boundary source of truth while preserving legacy `status` / `activeMiniGameId` projections.
- `[GameKernel](../../src/core/kernel/GameKernel.ts)` transitions between contexts based on explicit runtime mode instead of loose mini-game id checks.
- Player movement is currently expressed as booleans (`grounded`, `enabled`) in `[src/core/ecs/components/player.ts](../../src/core/ecs/components/player.ts)` and `[playerSystems.ts](../../src/core/ecs/systems/playerSystems.ts)`. **Candidate refactor:** a small `PlayerState` discriminated union (`idle` / `walking` / `jumping` / `interacting`).
- A pushdown automaton isn't needed today because overlay pause is handled at kernel level — but if we add nested modals (e.g. settings *over* a paused mini-game), that's the moment to add one.

## Status

`in use` — runtime mode is modeled as a small FSM. Player movement state is still a possible future refinement.

## See also

- Book chapter: [State](https://gameprogrammingpatterns.com/state.html)
- Related: [Update Method](./update-method.md), [Command](./command.md), [Subclass Sandbox](./subclass-sandbox.md)