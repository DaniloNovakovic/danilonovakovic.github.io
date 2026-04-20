# Observer

## Intent

Let one object notify a set of interested parties when something happens, without the sender knowing who is listening. Subscribers register with the subject and get called synchronously when the subject emits.

## The Pattern

A **subject** holds a list of **observer** callbacks. When the subject's state changes, it iterates the list and invokes each observer. Observers don't know about each other, and the subject doesn't know what they'll do.

## When to Use It

- Two domains need to react to the same event but should not be coupled. Classic Nystrom example: physics emits a collision, audio and achievement systems both want to know.
- The reactions are **synchronous** and ideally idempotent — the event fires, every listener reacts in the same frame, done.

## Keep in Mind

- Observers run in arbitrary order; don't rely on ordering.
- A listener that throws can break others unless you guard around the dispatch.
- Lifetimes are the hard part: if an observer doesn't unsubscribe, it leaks and keeps firing after its subject should be dead.
- If listeners mutate the subject, you can invalidate the iteration — snapshot the listener list before dispatch, or use a stable collection.
- Sync observers are great for "same-frame reactions." For anything that should survive a frame, cross-scene, or be replayable, prefer an [Event Queue](./event-queue.md).

## In JS/TS + Phaser

- The idiomatic shape is a tiny pub/sub: a `Set<() => void>` of listeners and an `emit()` that walks the set.
- For React consumers, wrap it with `useSyncExternalStore` (or `useEffect` + `useState`) so renders track the subject.
- Phaser has its own event emitters (`this.events`, `game.events`) — they're fine inside Phaser, but don't use them as a *cross-boundary* bus to React; use the bridge instead.
- Watch out for double-subscription in React under Strict Mode — make sure every `subscribe` returns a clean `unsubscribe`.

## In this repo

Core example: `[src/shared/bridge/store.ts](../../src/shared/bridge/store.ts)` — the `bridgeStore` keeps a `Set<() => void>` of listeners, `emit()` fires them on any state change, and `useBridgeState` adapts that for React. `[GameKernel](../../src/core/kernel/GameKernel.ts)` itself is just an observer of the bridge: `start()` calls `bridgeStore.subscribe(() => this.sync(bridgeStore.getState()))`.

The kernel also exposes its own synchronous bus — `[KernelEventBus](../../src/core/kernel/events.ts)` — for a narrower set of typed events (`SceneTransitionRequested`, `OverlayOpened`, `OverlayClosed`, `PauseChanged`). Same pattern, one abstraction layer up.

## Status

`in use` — canonical pattern for state propagation in this repo.

## See also

- Book chapter: [Observer](https://gameprogrammingpatterns.com/observer.html)
- Related: [Event Queue](./event-queue.md) (decouple in time, not just in identity), [Service Locator](./service-locator.md), [Component](./component.md)