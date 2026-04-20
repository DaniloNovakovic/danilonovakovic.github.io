# Update Method

## Intent

Each game object (or system) has an `update(dt)` method that simulates one frame of its behavior. The game loop walks the collection and calls `update` on each.

## The Pattern

Complementary to [Game Loop](./game-loop.md). The loop *is* the clock; Update Method is how individual objects plug into it. Each object is responsible for its own per-frame behavior.

## When to Use It

- You have a set of things that each have their own per-frame logic, and the logic varies by the kind of thing.
- You want to add/remove things mid-game without the loop knowing about them specifically.

Almost every game uses it in some form.

## Keep in Mind

- Update order matters more than you think. If `A.update` mutates state that `B.update` reads, the result depends on iteration order. Be explicit about it.
- A common trap: an object removes itself from the update list during its own `update`, invalidating iteration. Use deferred removal or iterate a snapshot.
- "Everything is an entity with an `update` method" is the classic OOP take. **ECS** flips this: data lives on entities, `update` logic lives in per-frame **systems** that query entity data. Both are valid; ECS scales better when behaviors cross many entity types.

## In JS/TS + Phaser

- Phaser scenes expose `update(time, delta)` — this is Update Method at the scene level, baked into the engine.
- Phaser's `GameObject`s can also have per-instance update logic via `scene.events.on('update', …)` or by overriding `preUpdate`, but at scale this gets noisy. Prefer scene-level `update` that delegates to systems.
- ECS: each system is essentially an `update(world, dt)` function. No per-entity method dispatch, no virtual calls; just "for each entity with these components, do this."

## In this repo

- Scene-level update: scenes in [`src/game`](../../src/game) call into ECS systems each frame.
- Function-style systems: [`runPlayerInputAndMovementSystems`](../../src/core/ecs/systems/playerSystems.ts) is an update method over the player entity's components. It returns a `PlayerStepResult` that the scene then applies to Phaser's physics body — the ECS *decides*, the scene *renders*.
- There is no per-`GameObject` update method sprinkled across the codebase, and that's deliberate — one update path per scene keeps ordering explicit.

## Status

`in use` — scene `update` + per-frame ECS systems.

## See also

- Book chapter: [Update Method](https://gameprogrammingpatterns.com/update-method.html)
- Related: [Game Loop](./game-loop.md), [Component](./component.md), [Double Buffer](./double-buffer.md)
