# Philosophy

Applies to all source changes.

## Hard Rules

1. **YAGNI within the architecture.** Use the cleanest, most direct solution inside the correct existing seam. Do not add speculative extensibility, abstract base classes, plugin systems, or configuration surfaces unless the current task actually requires them.
2. **Follow existing conventions before inventing new ones.** Before introducing a new store, bus, global, or lifecycle mechanism, check whether the problem is already solved by the bridge store, kernel, SceneManager, ECS, or a runtime Module. Follow local conventions unless they conflict with hard rules or documented architecture.
3. **Favor composition over inheritance.** Prefer small pure functions, discriminated unions, runtime objects, and ECS components over subclassing.
4. **No new globals.** No module-level `window.foo`, no one-off singleton backdoors. If state must cross a boundary, use the bridge store or pass it in.
5. **Do not duplicate runtime policy locally.** Pause, resume, bridge state, registry lookup, scene presentation, and input policy should go through existing seams instead of one-off branches.
6. **Avoid speculative infrastructure.** Do not introduce object pools, spatial indexes, scripting engines, broad event systems, or similar machinery without measured need or an explicit ask.

## Before Adding An Abstraction

Answer these before adding a new Module:

- Does this remove repeated caller knowledge or make the immediate code easier to change?
- Does the bridge store, kernel, SceneManager, ECS, or an existing runtime Module already cover it?
- Would the same lifecycle, ordering, or state rule otherwise appear in two places?
- Would removing this abstraction in two weeks be cheap if it turns out unnecessary?

If the answer is unclear, prefer the direct solution inside the existing seam.
