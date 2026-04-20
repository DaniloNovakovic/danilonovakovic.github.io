# Data Locality

## Intent

Cache misses dominate modern CPU cost. Arrange your data so the CPU's prefetcher can stream it linearly: store things you iterate together, together in memory.

## The Pattern

- Iterate **contiguous arrays** of the data you actually read in the hot loop.
- Don't chase pointers inside the inner loop.
- **Hot/cold splitting** — keep frequently accessed ("hot") fields packed; move rarely used ("cold") ones into a separate structure.

It's the ECS argument at the hardware level: component arrays beat heaps of pointer-chasing objects.

## When (not) to Use It

This is a native, AAA-engine optimization pattern. Its reasoning applies to any language, but **the mechanisms do not translate directly to JavaScript**, because V8 owns the memory layout.

In JS/TS you cannot:

- Guarantee that two objects are adjacent in memory.
- Force a struct-of-arrays layout over a plain array of objects (objects get their own hidden class + properties elsewhere).
- Reliably predict when a hidden-class transition (shape change) will deoptimize a loop.

## In JS/TS + Phaser — the actionable subset

- **Typed arrays** (`Float32Array`, `Int32Array`, …) are the one place you get contiguous, predictable layout. Use them for hot numeric loops (positions, velocities of many entities).
- **Don't allocate inside per-frame code.** Every `{}` or `new Something()` in a 60Hz loop is future GC pressure. Hoist allocations out.
- **Stable object shapes.** Don't add/remove properties on hot objects. Initialize with all fields present, even if zero/null. Helps V8 keep one hidden class.
- **Avoid polymorphic hot functions.** A function that sometimes sees `{x, y}` and sometimes sees `{x, y, z, extra}` deoptimizes. Keep the shapes consistent.
- **Prefer `for` over `.forEach` / `.map`** only in measured hot loops. Don't prematurely uglify everything.

You cannot meaningfully "hot/cold split" a JS object by moving fields to a cold sister object — the engine doesn't guarantee adjacency anyway. Skip that part of the chapter.

## In this repo

Not currently applicable. Entity counts are tiny (one player, a handful of buildings). We do not have a hot inner loop large enough for this to matter.

When it will: any mini-game that pushes hundreds of active sprites per frame (particles, bullets, crowds). At that point the rule is "typed arrays + no per-frame allocation," not "hot/cold splitting."

## Status

`skip-for-now` — under-apply guard. Do not restructure existing code for data locality without profiling showing a problem.

## See also

- Book chapter: [Data Locality](https://gameprogrammingpatterns.com/data-locality.html)
- Related: [Component](./component.md), [Object Pool](./object-pool.md), [Dirty Flag](./dirty-flag.md)
