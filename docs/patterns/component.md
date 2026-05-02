# Component

## Intent

Split a game entity's concerns (graphics, physics, AI, input, audio, …) into separate **components** so each one is reusable and the entity itself stays a thin container. "Favor composition over inheritance," in game-engine form.

## The Pattern

An entity is a bag of components; each component owns one concern. Components communicate either through the entity they share or through a narrow message/bus. Adding a new kind of entity is a new combination of existing components, not a new subclass.

## ECS vs "classic" Component

Nystrom's chapter describes the OOP flavor: components are objects with methods, entities hold references to them, update happens per-component-per-entity. **ECS** (Entity Component System) is the evolution:

- **Entity** — just an id.
- **Component** — pure data, no methods.
- **System** — a function run once per frame that queries entities with specific components and processes them.

ECS scales better in the places where entity counts, data iteration, or pure gameplay decision logic justify it. This repo uses ECS selectively; it is not the default destination for every runtime concern.

## When to Use It

- The same entity needs behaviors from multiple, otherwise-unrelated domains (physics, AI, rendering, audio).
- Deep inheritance trees are starting to bite — multiple inheritance, diamond problem, "should this be on the base class or the subclass?" arguments.
- You want data-driven variation: an entity's "kind" is the set of components it has.

## Keep in Mind

- Components that tightly need each other are a smell: that's really one concern, split for no reason.
- Entity↔component lookup has a cost. ECS amortizes it by iterating component stores, not entities.
- In a small game with few entity kinds, plain TS classes are fine. Don't adopt ECS ceremonially.

## In JS/TS + Phaser

- Phaser `GameObject`s are closer to the OOP flavor (you can mix in input, physics, animation components on a sprite).
- For pure gameplay decisions, an ECS layer *around* Phaser can be a good fit: ECS decides, Phaser renders/physics-acts. For scene lifecycle, pause/input wiring, resume policy, or repeated interaction orchestration, prefer a deep runtime Module with a small Interface.
- In TS, components are just interfaces over plain objects. No class ceremony needed.

## In this repo

Initial ECS is in place:

- `[src/core/ecs/world.ts](../../src/core/ecs/world.ts)` — minimal `EcsWorld` with entity ids and named component stores (`Map<EntityId, T>`).
- `[src/core/ecs/components/player.ts](../../src/core/ecs/components/player.ts)` — player-focused data components (input, movement, jump, interaction, facing, velocity, pause).
- `[src/core/ecs/systems/playerSystems.ts](../../src/core/ecs/systems/playerSystems.ts)` — pure per-frame system that reads components and returns a `PlayerStepResult`. Phaser then applies that result to the body.
- `[src/core/ecs/systems/roomInteractSystems.ts](../../src/core/ecs/systems/roomInteractSystems.ts)` — pure room interaction picking used by Phaser scenes through plain data slots.
- Use ECS when the decision logic is pure, entity-shaped, and gains leverage from data/logic separation. Use runtime Modules when the duplicated knowledge is lifecycle, policy, input plumbing, or scene orchestration.

Per `[docs/ARCHITECTURE_RUNTIME.md](../ARCHITECTURE_RUNTIME.md)`: Phaser physics/rendering remains in scene/runtime code while pure decisions and repeated lifecycle knowledge move behind focused Interfaces.

## Status

`in use` (partial) — player and interaction picking use pure systems where that buys clarity. Other entities are not being migrated ceremonially.

## See also

- Book chapter: [Component](https://gameprogrammingpatterns.com/component.html)
- Related: [Type Object](./type-object.md), [Update Method](./update-method.md), [Data Locality](./data-locality.md), [Event Queue](./event-queue.md)
