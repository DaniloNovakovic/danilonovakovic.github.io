# Repo-Wide Constraints

Applies to all source changes.

## Hard Rules

1. **Use the smallest change inside the existing seam.** Before introducing a new store, bus, global, lifecycle mechanism, or shared scene runtime Module, check whether the bridge store, scene lifecycle, SceneManager, ECS, or an existing shared scene runtime Module already covers the job.
2. **No new globals.** No module-level `window.foo`, no one-off singleton backdoors. If state must cross a boundary, use the bridge store or pass it in.
3. **Avoid speculative infrastructure.** Do not introduce object pools, spatial indexes, scripting engines, broad event systems, or configuration surfaces without measured need or an explicit ask.

## Before Adding An Abstraction

Answer these before adding a new Module:

- Does this remove repeated caller knowledge or make the immediate code easier to change?
- Does the bridge store, scene lifecycle, SceneManager, ECS, or an existing shared scene runtime Module already cover it?
- Would the same lifecycle, ordering, or state rule otherwise appear in two places?
- Would removing this abstraction in two weeks be cheap if it turns out unnecessary?

If the answer is unclear, prefer the direct solution inside the existing seam.
