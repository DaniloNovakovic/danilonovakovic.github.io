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

ECS scales better (data locality, easy parallelism in the languages where that matters, clear separation of data and logic). It's also what this repo is migrating toward.

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
- For gameplay logic, an ECS layer *around* Phaser is the sweet spot: ECS decides, Phaser renders/physics-acts. Avoid putting game rules inside Phaser `GameObject` subclasses.
- In TS, components are just interfaces over plain objects. No class ceremony needed.

## In this repo

Initial ECS is in place and growing:

- `[src/core/ecs/world.ts](../../src/core/ecs/world.ts)` — minimal `EcsWorld` with entity ids and named component stores (`Map<EntityId, T>`).
- `[src/core/ecs/components/player.ts](../../src/core/ecs/components/player.ts)` — player-focused data components (input, movement, jump, interaction, facing, velocity, pause).
- `[src/core/ecs/systems/playerSystems.ts](../../src/core/ecs/systems/playerSystems.ts)` — pure per-frame system that reads components and returns a `PlayerStepResult`. Phaser then applies that result to the body.
- `[src/core/ecs/systems/roomInteractSystems.ts](../../src/core/ecs/systems/roomInteractSystems.ts)` — pure room interaction picking used by Phaser scenes through plain data slots.
- Migration rule: new gameplay decisions go into ECS components + systems. Phaser code stays a thin adapter that reads component state and drives sprites/bodies.

Per `[docs/ARCHITECTURE_RUNTIME.md](../ARCHITECTURE_RUNTIME.md)`: Phaser physics/rendering remains in infra-facing scene code while gameplay decisions move into component + system flow.

## Status

`in use` (partial) — player and interaction picking are moving through pure systems. Other entities (buildings, NPCs) are not yet ECS-shaped.

## See also

- Book chapter: [Component](https://gameprogrammingpatterns.com/component.html)
- Related: [Type Object](./type-object.md), [Update Method](./update-method.md), [Data Locality](./data-locality.md), [Event Queue](./event-queue.md)