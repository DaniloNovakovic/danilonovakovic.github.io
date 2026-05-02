# Architecture Boundaries

This codebase uses a micro-kernel + bridge + ECS arrangement. The layering is load-bearing.

## Hard Rules

1. **`src/core/**` is domain/engine-agnostic.** No Phaser, React, `window`, or `document` access inside `src/core/ecs/**` or pure kernel code. The kernel talks to Phaser through [`src/infra/phaser/PhaserSceneAdapter.ts`](../../src/infra/phaser/PhaserSceneAdapter.ts).
2. **One shared state store: the bridge.** Durable cross-boundary UI/engine state lives in [`src/shared/bridge/store.ts`](../../src/shared/bridge/store.ts). Read via `bridgeStore.getState()` or `useBridgeState`; write via `bridgeActions`. React Context is fine for dependency injection or UI-local concerns, but not as a second gameplay/runtime state store.
3. **Kernel events are lifecycle notifications, not a generic bus.** Use [`KernelEventBus`](../../src/core/kernel/events.ts) for synchronous transition/overlay/pause reactions inside the kernel/runtime seam. Do not use it for durable state, React overlay communication, analytics dumping, or broad app events.
4. **Plugins own a context, not the world.** Each plugin under `src/contextPlugins/plugins/**` defines one `ContextPluginDefinition`. Known context assembly belongs in [`src/contextPlugins/createContextPlugins.ts`](../../src/contextPlugins/createContextPlugins.ts).
5. **ECS components are pure data.** Components are plain objects; logic goes into pure systems under `src/core/ecs/systems/**`. Use ECS where pure gameplay decision logic benefits from it; do not migrate scene/runtime code into ECS just to satisfy architecture aesthetics.
6. **Upgrade from Observer to Event Queue deliberately.** Synchronous bridge/kernel events are fine for same-frame reactions. Introduce an Event Queue only for demonstrated time-decoupled delivery.

## Folder Ownership

- `src/runtime` — active Phaser runtime code and runtime Modules.
- `src/contextPlugins` — context wrappers and assembly used by kernel scene orchestration.
- `src/infra` — concrete adapters to engine/browser infrastructure.
- `src/core` — engine-agnostic kernel, ECS, input, and player logic.

See [`AGENTS.md`](../../AGENTS.md) and [`docs/ARCHITECTURE_RUNTIME.md`](../../docs/ARCHITECTURE_RUNTIME.md) for the current runtime split.
