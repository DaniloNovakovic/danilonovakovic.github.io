# Double Buffer

## Intent

Present a fully-formed result while the next one is still being produced. Two buffers: one "current" (read) and one "next" (write). When the next is ready, swap.

## The Pattern

Classic uses: screen framebuffers (no tearing), simulation state that's read while being computed (cellular automata, "everyone updates simultaneously"), and any producer/consumer where the consumer must never see a half-built result.

## When to Use It

- Some state is read and written by different parties, and the reader must see a coherent snapshot.
- Per-frame logic where "everyone updates from the previous frame" is the right semantic (e.g. simultaneous step in a cellular grid or in an AI flocking tick).
- Rendering: you never want to show a partially composed frame.

## Keep in Mind

- Double buffering doubles memory. Fine for two framebuffers; measure before using it for large world state.
- Swapping pointers is the cheap part. Making sure nobody holds a stale reference across the swap is the work.
- If the next buffer depends on *both* buffers, you're really doing something more like snapshotting, not double buffering.

## In JS/TS + Phaser

- The GPU framebuffer is already double-buffered by the browser; you don't have to think about it.
- Where it matters for us: **Phaser 4 `DynamicTexture*`* buffers draw commands and requires an explicit `render()` flush. If you both mutate and read the same dynamic texture in the same frame without flushing, you'll see stale or half-built content. See `docs/ARCHITECTURE_RUNTIME.md` — this is already called out as a render guardrail.
- ECS flavor: if a system needs "all entities update from the old values, then commit," allocate the "next" values in a side buffer, then swap after the iteration is done. Usually overkill for small entity counts.

## In this repo

- We do not currently allocate our own double buffers. Phaser handles the framebuffer; scenes don't have simultaneous-update semantics that would require it.
- **Planned cases where it may apply**: composited dynamic textures for stamp-style sketch effects (if/when we add them), and any system that builds "next frame state" during iteration.

## Status

`deferred` — no active use; revisit if a composited dynamic texture grows a read/write race.

## See also

- Book chapter: [Double Buffer](https://gameprogrammingpatterns.com/double-buffer.html)
- Related: [Game Loop](./game-loop.md), [Dirty Flag](./dirty-flag.md)