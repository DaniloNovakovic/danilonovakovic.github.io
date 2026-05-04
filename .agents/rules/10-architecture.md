# Architecture Boundaries

This codebase uses a micro-kernel + bridge + ECS arrangement. The layering is load-bearing.

## Hard Rules

1. **`src/game/core/**` is domain/engine-agnostic.** No Phaser, React, `window`, or `document` access inside `src/game/core/ecs/**` or pure kernel code. The kernel talks to Phaser through [`src/game/infra/phaser/PhaserSceneAdapter.ts`](../../src/game/infra/phaser/PhaserSceneAdapter.ts).
2. **One game bridge state store.** Durable React/Phaser state lives in [`src/game/bridge/store.ts`](../../src/game/bridge/store.ts). Read via `bridgeStore.getState()` or `useBridgeState`; write via `bridgeActions`. React Context is fine for dependency injection or UI-local concerns, but not as a second gameplay/runtime state store.
3. **Kernel events are lifecycle notifications, not a generic bus.** Use [`KernelEventBus`](../../src/game/kernel/events.ts) for synchronous transition/overlay/pause reactions inside the kernel/runtime seam. Do not use it for durable state, React overlay communication, analytics dumping, or broad app events.
4. **Plugins own a context, not the world.** Each plugin under `src/game/contextPlugins/plugins/**` defines one `ContextPluginDefinition`. Known context assembly belongs in [`src/game/contextPlugins/createContextPlugins.ts`](../../src/game/contextPlugins/createContextPlugins.ts).
5. **ECS components are pure data.** Components are plain objects; logic goes into pure systems under `src/game/core/ecs/systems/**`. Use ECS where pure gameplay decision logic benefits from it; do not migrate scene/runtime code into ECS just to satisfy architecture aesthetics.
6. **Upgrade from Observer to Event Queue deliberately.** Synchronous bridge/kernel events are fine for same-frame reactions. Introduce an Event Queue only for demonstrated time-decoupled delivery.

## Folder Ownership

- `src/game/runtime` — shared Phaser runtime code and runtime Modules.
- `src/game/contextPlugins` — context wrappers and assembly used by kernel scene orchestration.
- `src/game/infra` — concrete adapters to engine/browser infrastructure.
- `src/game/core` — engine-agnostic kernel, ECS, input, and player logic.

See [`AGENTS.md`](../../AGENTS.md) and [`docs/ARCHITECTURE_RUNTIME.md`](../../docs/ARCHITECTURE_RUNTIME.md) for the current runtime split.
