# Service Locator

## Intent

Provide a global point of access to a service **without** coupling callers to the concrete implementation. Callers ask a locator for "the audio service"; the locator hands them something that satisfies the audio interface.

## The Pattern

A registry with `register(name, instance)` and `get(name)`. Callers never `new` the concrete class; they ask the locator. This lets you swap the implementation (real, fake for tests, null-object for missing), and it separates *"how do I reach this service globally?"* from *"is there only one of it?"* (that's the [Singleton](./singleton.md) trap).

## When to Use It

- A cross-cutting service genuinely needs to be reachable from many places (audio, logging, persistence).
- You want to be able to swap it (tests, feature flags, platform differences).
- You don't want to thread the service through every constructor just to land it somewhere deep.

For local dependencies, prefer passing them in. Service Locator is a *last resort for cross-cutting concerns*, not a default.

## Keep in Mind

- It's still global state. Test hygiene: always reset the locator between tests.
- Implicit coupling: a function that reaches into the locator hides its dependency from its signature. That's the cost you pay for the convenience.
- Always have a **null-object** fallback. If audio isn't registered, a missing-service null-object keeps the game playable; throwing crashes everything.
- Don't register implementations at random call sites. Do it once, at the composition root (here: [`src/App.tsx`](../../src/App.tsx) / [`src/components/Game.tsx`](../../src/components/Game.tsx)).

## In JS/TS + Phaser

- A module that exports `getX()` / `setX()` functions is already a minimal service locator.
- A module-scoped object with `register` / `get` is the textbook version.
- React Context is a React-flavored service locator; use it for services that only React components need.

## In this repo

The [`bridgeStore`](../../src/shared/bridge/store.ts) **is** our service locator for shared UI/engine state. It is:

- **Module-scoped** — not a class, no `getInstance()` ceremony, not a Singleton-the-pattern.
- **Narrow** — exposes `subscribe`, `getState`, and a curated `bridgeActions` surface. Not a free-for-all dictionary.
- **Observed** — readers subscribe, they don't poll.
- **Typed** — `BridgeState` is a single, documented contract.

The kernel-level bus [`KernelEventBus`](../../src/core/kernel/events.ts) is another small locator-shaped thing: one registration point, many consumers, typed events. Both are examples of the pattern applied in the smallest useful shape.

**Rule for this codebase:** do not introduce new globals. If you want a new service, decide whether (a) it belongs on the bridge (shared UI/engine state), (b) it belongs on the kernel (scene lifecycle events), or (c) it's local enough to be passed in. A brand-new `window.*` or module-level `export const foo = new Foo()` that everybody reaches into is not the answer.

## Status

`in use` (scoped). The bridge covers the legitimate use cases; no freeform locator registry is needed yet.

## See also

- Book chapter: [Service Locator](https://gameprogrammingpatterns.com/service-locator.html)
- Related: [Singleton](./singleton.md), [Observer](./observer.md), [Event Queue](./event-queue.md)
