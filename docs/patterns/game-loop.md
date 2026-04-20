# Game Loop

## Intent

Decouple the progression of game time from the user's input and from the processor's speed. Keep a loop alive that reads input, updates state, and renders, at a rate you control.

## The Pattern

A loop that runs forever: read input → update simulation → render → (maybe sleep or yield). Variants differ on *how* to handle the time step:

- **Fixed time step** — update by a fixed `dt` regardless of wall-clock. Deterministic but can fall behind.
- **Variable time step** — pass the real elapsed `dt` to update. Smooth, but tricky for physics (tunnelling, non-determinism).
- **Fixed update + variable render** — the Nystrom "play the game at a constant rate, render as fast as the machine can" recipe. The canonical answer for most games.

## When to Use It

- Always, in some form. Every game has a loop. The question is who owns it and how it handles time.

## Keep in Mind

- Don't couple "how often physics runs" to "how often the screen redraws." That is how browser games break on 120Hz monitors.
- Allocating inside the loop causes GC pauses; hoist work out.
- Handle `requestAnimationFrame` pausing (background tabs) — browsers will happily stop calling your callback, and then call it once with a huge delta when the tab comes back. Clamp `dt`.

## In JS/TS + Phaser

- **Phaser owns the loop.** The engine runs its own `requestAnimationFrame` loop and calls `scene.update(time, delta)` for each active scene. Do not write your own loop.
- Arcade Physics runs on a fixed step internally (configurable via `physics.world.fixedStep`), so you get "fixed physics + variable render" out of the box for free.
- Your code lives in `update(time, delta)` and in system functions called from there. Read the `delta`, don't assume a fixed frame rate.
- `delta` can spike (tab switch, long frame). Clamp it in gameplay code that integrates velocity.

## In this repo

- Phaser's loop drives everything. Scenes in `[src/game](../../src/game)` implement `update(time, delta)`.
- `[GameKernel.sync](../../src/core/kernel/GameKernel.ts)` is **not** in the loop — it runs only when bridge state changes (via `bridgeStore.subscribe`). That's intentional: scene/context transitions are event-driven, not per-frame.
- ECS systems like `runPlayerInputAndMovementSystems` in `[src/core/ecs/systems/playerSystems.ts](../../src/core/ecs/systems/playerSystems.ts)` are *called from* a scene's `update` each frame. The scene is the adapter; ECS is the decision layer.

## Status

`in use` — via Phaser. We read the loop, we don't reinvent it.

## See also

- Book chapter: [Game Loop](https://gameprogrammingpatterns.com/game-loop.html)
- Related: [Update Method](./update-method.md), [Double Buffer](./double-buffer.md), [Data Locality](./data-locality.md)