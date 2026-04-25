# Event Queue

## Intent

Decouple *when* an event is raised from *when* it's handled. The sender appends to a queue and moves on; the receiver drains the queue on its own schedule.

## Observer vs Event Queue (read this first)

These are often mashed together but they're different tools:


|                      | [Observer](./observer.md)                 | Event Queue                                          |
| -------------------- | ----------------------------------------- | ---------------------------------------------------- |
| Timing               | synchronous, same frame                   | deferred to the consumer's tick                      |
| Coupling in identity | decoupled                                 | decoupled                                            |
| Coupling in time     | **coupled** — sender blocks on listeners  | **decoupled**                                        |
| Good for             | immediate reactions (UI updates, logging) | cross-system, cross-scene, order-sensitive workflows |
| Bad for              | cross-scene lifecycle events, bursts      | things that need "now" semantics                     |


When in doubt: start with Observer. Upgrade to Event Queue only when you hit timing or lifetime problems Observer can't solve.

## When to Use It

- The sender shouldn't care when (or whether) the event is consumed.
- Multiple producers feeding one consumer (input events, network packets, telemetry).
- You need to batch, re-order, deduplicate, drop stale, or persist events.
- Events survive across scene transitions or across frames (e.g. "mini-game X was completed" should be actionable even if the scene that emitted it has unmounted).

## Keep in Mind

- A queue adds latency. For input-sensitive reactions, Observer is usually better.
- Queues can grow unboundedly — cap size, or drop oldest/lowest priority.
- Draining the queue mid-processing is a classic footgun: events produced during drain can create feedback loops. Prefer "snapshot then drain."
- Ordering semantics need to be explicit: FIFO? priority? coalesced?

## In JS/TS + Phaser

- Implementation is small: an array of typed events, a `post(event)` that pushes, a `drain()` that the consumer calls once per tick.
- Use a discriminated union for the event type — cheap exhaustiveness checking in the handler.
- Don't bolt a queue onto every bus. Most intra-scene reactions are fine with synchronous subscribers.

## In this repo

Mostly synchronous today, with a small queued boundary available:

- `[bridgeStore](../../src/shared/bridge/store.ts)` — state-change notifications for the UI/engine bridge.
- `[KernelEventBus](../../src/core/kernel/events.ts)` — typed kernel events (`SceneTransitionRequested`, `OverlayOpened`, `OverlayClosed`, `PauseChanged`), also synchronous.
- `[KernelEventQueue](../../src/core/kernel/events.ts)` — a minimal FIFO queue that can flush into the kernel bus when a side effect needs time decoupling.

When we need a queue:

- **Cross-scene notifications** — e.g. "the guitar mini-game was completed with score X" that should be actionable from the street scene after it's remounted.
- **Telemetry / analytics** — batch and flush, never blocking gameplay.
- **Audio one-shots fired from gameplay** — currently we'd invoke an audio call directly; a queue would let the audio system drain on its own cadence.

## Status

`in use` (scaffolded) — the queue exists, but synchronous Observer remains the default. Use it only for real cross-frame/cross-scene timing needs.

## See also

- Book chapter: [Event Queue](https://gameprogrammingpatterns.com/event-queue.html)
- Related: [Observer](./observer.md), [Service Locator](./service-locator.md), [Command](./command.md)