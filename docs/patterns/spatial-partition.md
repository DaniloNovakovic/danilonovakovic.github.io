# Spatial Partition

## Intent

Avoid O(n²) "check everything against everything" loops for spatial queries (collision, proximity, visibility). Index objects by *where they are*, so a query only examines nearby objects.

## The Pattern

Choose a structure that matches your world:

- **Fixed grid** — bucket objects into a uniform grid; query neighbors by cell.
- **Quadtree** (2D) / **Octree** (3D) — recursive subdivision; good for non-uniform density.
- **BSP / k-d tree** — static geometry, precomputed.

## When to Use It

- Many objects that each need to query "what's near me?" every frame.
- The naive O(n²) loop is actually showing up in your profile.

## Keep in Mind

- Every partition pays for its own bookkeeping on move. If objects move every frame, uniform grids beat trees in practice.
- Wrong partition granularity is worse than no partition: too-large cells don't prune; too-small cells spend all their time moving objects between cells.
- Static and dynamic objects can go in different partitions with different tradeoffs.

## In JS/TS + Phaser

- **Phaser Arcade Physics already does broadphase for you.** `physics.add.overlap(a, b, …)` and `physics.add.collider(…)` are O(n) amortized, not O(n²). For a small-to-medium number of bodies, you never need to think about this.
- Phaser Matter also does broadphase via its underlying physics engine.
- You roll your own partition when you need spatial queries *outside* physics: "which building is closest to the player?", "which NPCs are in this trigger zone?" — and even then, with ~6 buildings, a linear scan is not just acceptable, it's the right answer.

## In this repo

Not in use. Not needed.

- ~6 buildings along a 3000px street. Interaction proximity is a linear scan; Phaser handles any physics broadphase.
- Revisit if any mini-game puts *hundreds* of active interacting entities on screen simultaneously.

## Status

`skip-for-now` — guarded under-apply. The AI should not introduce spatial partitioning in this repo unprompted.

## See also

- Book chapter: [Spatial Partition](https://gameprogrammingpatterns.com/spatial-partition.html)
- Related: [Data Locality](./data-locality.md), [Object Pool](./object-pool.md)
