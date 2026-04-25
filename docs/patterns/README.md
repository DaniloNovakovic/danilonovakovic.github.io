# Game Programming Patterns — applied to this repo

This folder is a living companion to Robert Nystrom's *[Game Programming Patterns](https://gameprogrammingpatterns.com/)* (free online). The book is the primary architectural reference for this project. Each chapter has a matching file here that records:

- what the pattern is (Nystrom's framing, condensed),
- what it means in JS/TS + React + Phaser 4 specifically,
- whether/how it is used in this repo,
- and its adoption status.

## How to use this folder

1. Read a chapter in the book (or on [gameprogrammingpatterns.com](https://gameprogrammingpatterns.com/)).
2. Open the matching file in this folder.
3. If it is a stub (`Status: not yet read`), expand it with your own notes. You can also ask the AI to draft one for you from the chapter.
4. If the pattern lands in the repo, update the **In this repo** section with a link to the code that uses it, and bump the **Status**.
5. If the pattern is deliberately not a fit, set **Status** to `skip-for-now` with a one-line reason. That reason is load-bearing — it prevents the AI from introducing it unprompted.

Status values used across all chapter files:

- `in use` — the pattern is already load-bearing in `src/`.
- `planned` — there is a clear place for it but it is not wired up yet.
- `deferred` — probably useful eventually, not today.
- `skip-for-now` — intentionally not applied at current scale; re-evaluate later.
- `not yet read` — stub; expand as you read the chapter.

## Table of contents (mirrors the book)

### Part II — Design Patterns Revisited

- [Command](./command.md)
- [Flyweight](./flyweight.md)
- [Observer](./observer.md)
- [Prototype](./prototype.md)
- [Singleton](./singleton.md)
- [State](./state.md)

### Part III — Sequencing Patterns

- [Double Buffer](./double-buffer.md)
- [Game Loop](./game-loop.md)
- [Update Method](./update-method.md)

### Part IV — Behavioral Patterns

- [Bytecode](./bytecode.md)
- [Subclass Sandbox](./subclass-sandbox.md)
- [Type Object](./type-object.md)

### Part V — Decoupling Patterns

- [Component](./component.md)
- [Event Queue](./event-queue.md)
- [Service Locator](./service-locator.md)

### Part VI — Optimization Patterns

- [Data Locality](./data-locality.md)
- [Dirty Flag](./dirty-flag.md)
- [Object Pool](./object-pool.md)
- [Spatial Partition](./spatial-partition.md)

## Adoption map

A quick scan of which patterns are live, planned, or intentionally parked for this repo's current scale (React + Phaser 4 portfolio with a 3000px street and a small number of entities).

- **Command** — `in use` (small). `src/core/input/commands.ts` models scene input as intent frames before player movement consumes it.
- **Flyweight** — `not yet read`. Possible fit for tilemaps / repeated sprites later.
- **Observer** — `in use`. [`src/shared/bridge/store.ts`](../../src/shared/bridge/store.ts) subscriptions + `useBridgeState`.
- **Prototype** — `not yet read`.
- **Singleton** — `skip-for-now`. Nystrom warns against it; the bridge store covers the legitimate use case as a scoped service locator.
- **State** — `in use` (small). `src/runtime/gameState.ts` models runtime modes as a discriminated union used by the bridge and kernel.
- **Double Buffer** — `deferred`. Phaser handles frame presentation; revisit only if we author composite dynamic textures that get read mid-mutation.
- **Game Loop** — `in use` (via Phaser). We read from it, we don't reinvent it.
- **Update Method** — `in use`. Scenes implement `update(time, delta)`; ECS systems run per-frame from there.
- **Bytecode** — `skip-for-now`. Overkill for a portfolio; revisit only if a mini-game needs user-authored scripts.
- **Subclass Sandbox** — `deferred`. Possible fit if we expose a mini-game authoring surface later.
- **Type Object** — `in use` (small). Feature, building, and room interactable kinds are data-driven config variants.
- **Component** — `in use` (partial). [`src/core/ecs`](../../src/core/ecs); player and interaction-system migration is in progress.
- **Event Queue** — `in use` (scaffolded, narrow). `KernelEventQueue` exists beside the synchronous kernel bus for future time-decoupled side effects; same-frame observers remain the default.
- **Service Locator** — `in use` (scoped). The bridge store *is* the locator; do not introduce new globals.
- **Data Locality** — `skip-for-now`. V8 hides memory layout; actionable subset is "no per-frame allocations, typed arrays for hot numeric loops."
- **Dirty Flag** — `in use` at the bridge/kernel boundary; `planned` for composited dynamic textures.
- **Object Pool** — `deferred`. Only worth it for particles/bullets after a measured GC problem. Phaser `Group` is already pool-shaped (`createMultiple` / `getFirstDead`).
- **Spatial Partition** — `skip-for-now`. Arcade Physics already does broadphase; entity counts are tiny.

## Patterns we intentionally under-apply

The AI should not introduce these unprompted in this repo at its current scale. Each is valuable, but cargo-culting them from a C++/AAA context hurts more than it helps here:

- **Data Locality** — you cannot control memory layout in V8 the way the chapter assumes. The applicable slice is "avoid allocations in per-frame code."
- **Object Pool** — don't pool until profiling shows GC pressure. Phaser's `Group` already gives you the API shape if/when we need it.
- **Spatial Partition** — Arcade Physics does broadphase. Revisit only if we cross into hundreds of active entities interacting each frame.
- **Bytecode** — no current user-authored scripting surface.
- **Singleton (as a convenience global)** — banned. Pass dependencies in, or go through the bridge store / kernel.

See also: [AGENTS.md](../../AGENTS.md), [docs/ARCHITECTURE_CONSTITUTION.md](../ARCHITECTURE_CONSTITUTION.md), [docs/ARCHITECTURE_RUNTIME.md](../ARCHITECTURE_RUNTIME.md).