# Philosophy

Applies to all source changes.

This project uses Robert Nystrom's [*Game Programming Patterns*](../../docs/patterns/README.md) as its primary architectural reference. Full notes and adoption status live in [`docs/patterns/`](../../docs/patterns/README.md).

## Hard Rules

1. **YAGNI first.** Write the cleanest, most direct solution. Do not add speculative extensibility, abstract base classes, plugin systems, or configuration surfaces unless the current task actually requires them.
2. **Follow existing conventions before inventing new ones.** Before introducing a new store, bus, global, or lifecycle mechanism, check whether the problem is already solved by the bridge store, kernel, SceneManager, ECS, or a runtime Module.
3. **Favor composition over inheritance.** Prefer small pure functions, discriminated unions, runtime objects, and ECS components over subclassing.
4. **No new globals.** No module-level `window.foo`, no one-off singleton backdoors. If state must cross a boundary, use the bridge store or pass it in.
5. **Under-apply guarded patterns.** Do not introduce Data Locality hot/cold splitting, Object Pools, Spatial Partitions, or Bytecode-style scripting without measured need or an explicit ask.

## Before Adding An Abstraction

Answer these before adding a new Module:

- Does this match an existing pattern note, improve Depth/Locality, or remove repeated caller knowledge?
- Does the bridge store, kernel, SceneManager, ECS, or an existing runtime Module already cover it?
- Would removing this abstraction in two weeks be cheap if it turns out unnecessary?

If the answer is unclear, prefer the direct solution.
