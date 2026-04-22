# Command

## Intent

*(From the book: an object that represents an invocation of a method, so it can be stored, queued, undone, remapped, etc.)*

## In this repo

- **Input Decoupling:** We use the Command pattern to decouple raw hardware input (keyboard, touch gestures) from the player's logical action (`MoveCommand`, `JumpCommand`, `InteractCommand`).
  - `[InputMapper](../../src/runtime/input/InputMapper.ts)` reads hardware state and translates it into Commands.
  - `[PlayerController](../../src/core/player/PlayerController.ts)` executes these Commands to update logical `PlayerInputState`.

## In JS/TS + Phaser

- **Performance Caveat (Micro-Pooling):** In a pure Command pattern, objects are immutable. However, allocating a `new MoveCommand(...)` 60 times a second creates garbage collection (GC) pressure in JavaScript, which can cause frame stuttering.
- **The Solution:** We combine the Command pattern with a micro **Object Pool**. The `InputMapper` pre-allocates exactly one instance of each Command and reuses them every frame via a `.set()` method.
  - The array of commands returned by `getCommands()` is also reused. **Never store references to these commands or the array across frames.**

## Status

`adopted` — applied to player input mapping with zero-allocation optimizations.

## See also

- Book chapter: [Command](https://gameprogrammingpatterns.com/command.html)
- Related: [Event Queue](./event-queue.md), [State](./state.md), [Bytecode](./bytecode.md), [Object Pool](./object-pool.md)