# Dirty Flag

## Intent

A piece of derived state is expensive to compute. Compute it only when the inputs actually changed; otherwise reuse the last result. The "flag" is a boolean that says "inputs changed since last compute — result is stale."

## The Pattern

- On input change, set `dirty = true`.
- On read, if `dirty`, recompute and set `dirty = false`.
- Careful around cascading dirtiness (a parent is dirty, so its children are dirty too — classic scene-graph transform case).

## When to Use It

- The computation is expensive relative to the cost of tracking dirtiness.
- The inputs change much less often than the output is read.
- Reads happen in a hot loop (e.g. every frame).

## Keep in Mind

- Correctness > performance. If the "inputs" aren't all visible to the flag, you'll read stale data and not know why.
- Don't sprinkle dirty flags everywhere. Each one is a little state machine and they compose badly.
- There's an opposing pattern: always recompute, and cache at the edge (memoize). Often simpler when inputs are easy to equate.

## In JS/TS + React + Phaser

- React rerenders are already gated by state equality — that's dirty-flag-ish at the framework level.
- `useMemo` and `useSyncExternalStore` are the React shapes of this pattern.
- Phaser: hand-authored dynamic textures benefit from "only redraw if inputs changed" logic, especially since Phaser 4 `DynamicTexture` needs explicit `render()` flushes (see the Phaser 4 render guardrails in [`docs/ARCHITECTURE_RUNTIME.md`](../ARCHITECTURE_RUNTIME.md)).

## In this repo

Implicit but worth making explicit:

- [`bridgeStore`](../../src/shared/bridge/store.ts)'s `setState` already does a dirty check — it compares fields against the previous snapshot and skips `emit()` if nothing changed. That's Dirty Flag at the store level; it keeps React renders cheap.
- [`GameKernel.sync`](../../src/core/kernel/GameKernel.ts) similarly avoids emitting `PauseChanged` / overlay events unless they actually flipped.

**Planned fits:**

- Composited hand-drawn dynamic textures (street backdrop, peep paper dolls): only re-render when contributing layers change.
- Any derived Phaser geometry that depends on bridge state but doesn't need per-frame updates.

## Status

`in use` at the bridge/kernel boundary; `planned` for dynamic texture compositing.

## See also

- Book chapter: [Dirty Flag](https://gameprogrammingpatterns.com/dirty-flag.html)
- Related: [Observer](./observer.md), [Double Buffer](./double-buffer.md), [Data Locality](./data-locality.md)
