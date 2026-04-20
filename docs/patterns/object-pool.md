# Object Pool

## Intent

Reuse a fixed set of pre-allocated objects instead of creating and destroying them on the fly. Avoid fragmentation, avoid GC churn, keep per-frame cost predictable.

## The Pattern

- Allocate N slots up front.
- "Create" → take the first free slot, mark it in use, return it.
- "Destroy" → mark the slot free, zero-out what you must, leave the allocation alone.
- Optional: keep a free list inside the unused slots themselves (union/in-place).

## When to Use It

- Many short-lived objects: particles, bullets, projectiles, damage numbers.
- Measured GC pauses or allocation-heavy hot loops.
- Predictable max count — capacity is bounded by the pool size, which can be a feature.

## Keep in Mind

- A pool with an unused capacity is wasted memory. Right-size it.
- Reused objects can retain stale state; reset fully on acquire, not on release (or both).
- Forgetting to return to the pool is a leak that won't surface as a memory growth but *will* surface as running out of slots.
- Pools couple callers to lifecycle — now they have to know *not* to hold references across frames.

## In JS/TS + Phaser

- V8's GC is very good at short-lived small objects; you usually don't need a manual pool until profiling shows otherwise.
- **Phaser's `Group` with `createMultiple` + `getFirstDead` is already a pool.** Use that before inventing your own. `child.setActive(false).setVisible(false)` returns a sprite to the pool conceptually; `getFirstDead()` acquires one.
- Typed arrays themselves are pool-shaped: the array is pre-allocated; "indices" are your handles.

## In this repo

Not in use today. There are no hundreds-of-objects lifecycles in the current scope (player + buildings + a handful of NPCs).

**Fit-candidates when/if they land:**

- Particles in any sketch-effect mini-game.
- Rhythm-game "notes" scrolling across the screen in the Guitar Hero-style mini-game.
- Bullets / projectiles in any future mini-game.

When we do need one: reach for a Phaser `Group` with `createMultiple`, not a from-scratch TS pool.

## Status

`deferred` — guarded under-apply. Do not add pooling until profiling shows GC pressure.

## See also

- Book chapter: [Object Pool](https://gameprogrammingpatterns.com/object-pool.html)
- Related: [Data Locality](./data-locality.md), [Update Method](./update-method.md), [Component](./component.md)
