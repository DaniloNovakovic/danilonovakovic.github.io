# Architecture Boundaries

This codebase uses a micro-kernel + bridge + ECS arrangement. The layering is load-bearing.

## Hard Rules

1. **`src/game/core/**` is pure gameplay decision logic.** No Phaser, React, `window`, `document`, bridge state, or UI rendering access inside core code. Use it for deterministic ECS/input/player decisions, not for kernel orchestration or scene lifecycle.
2. **One game bridge state store.** Durable React/Phaser state lives in [`src/game/bridge/store.ts`](../../src/game/bridge/store.ts). Read via `bridgeStore.getState()` or `useBridgeState`; write via `bridgeActions`. React Context is fine for dependency injection or UI-local concerns, but not as a second gameplay/runtime state store.
3. **Kernel events are lifecycle notifications, not a generic bus.** Use [`KernelEventBus`](../../src/game/kernel/events.ts) for synchronous transition/overlay/pause reactions inside the kernel/runtime seam. Do not use it for durable state, React overlay communication, analytics dumping, or broad app events.
4. **Scene contexts own lifecycle entry, not feature discovery.** Each Phaser scene that participates in kernel lifecycle owns a `sceneContext.ts`. Known scene context assembly belongs in [`src/game/sceneContexts/createSceneContexts.ts`](../../src/game/sceneContexts/createSceneContexts.ts).
5. **ECS components are pure data.** Components are plain objects; logic goes into pure systems under `src/game/core/ecs/systems/**`. Use ECS where pure gameplay decision logic benefits from it; do not migrate scene/runtime code into ECS just to satisfy architecture aesthetics.
6. **Upgrade from Observer to Event Queue deliberately.** Synchronous bridge/kernel events are fine for same-frame reactions. Introduce an Event Queue only for demonstrated time-decoupled delivery such as delayed cross-scene side effects, audio one-shots, analytics, or ordering that must not fire synchronously.

## Folder Ownership

- `src/game/kernel` — runtime mode and scene lifecycle orchestration.
- `src/game/runtime` — shared Phaser-facing runtime code and runtime Modules.
- `src/game/scenes/*/index.ts` — public scene-owned fact barrels for cross-folder imports.
- `src/game/scenes/*/runtime/index.ts` — public Phaser runtime barrels for cross-folder scene classes/builders.
- `src/game/shell/use*.ts` — focused shell hooks for Phaser boot, scale refresh, bridge callbacks, and touch controls.
- `src/game/sceneContexts` — assembly of scene-owned lifecycle contexts used by kernel scene orchestration.
- `src/game/scenes/*/sceneContext.ts` — scene-owned lifecycle/start-data contracts for Phaser scenes.
- `src/game/infra` — concrete adapters to engine/browser infrastructure. The kernel talks to Phaser through [`src/game/infra/phaser/PhaserSceneAdapter.ts`](../../src/game/infra/phaser/PhaserSceneAdapter.ts).
- `src/game/core` — pure ECS, input, and player decision logic.

Folder `index.ts` files are public boundaries: export only what other folders should use. Keep component internals, shell hooks, and implementation helpers unexported unless they are intentionally part of that folder's public API. UI primitives under `src/shared/ui` are colocated in component folders.

See [`AGENTS.md`](../../AGENTS.md) and [`docs/runtime-architecture.md`](../../docs/runtime-architecture.md) for the current runtime split.

## React Effects

Write React effects with a named function expression: `useEffect(function syncThing() { ... }, deps)`. The name should describe the effect's reason to exist; if naming it feels awkward, extract a focused hook or split the effect.
