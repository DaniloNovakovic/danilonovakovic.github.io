# Architecture Boundaries

This codebase uses scene lifecycle + bridge + ECS arrangement. The layering is load-bearing.

## Hard Rules

1. **`src/game/core/**` is pure gameplay decision logic.** No Phaser, React, `window`, `document`, bridge state, or UI rendering access inside core code. Use it for deterministic ECS/input/player decisions, not for scene lifecycle orchestration.
2. **One game bridge state store.** Durable React/Phaser state lives in [`src/game/bridge/store.ts`](../../src/game/bridge/store.ts). Read via `bridgeStore.getState()` or `useBridgeState`; write via `bridgeActions`. React Context is fine for dependency injection or UI-local concerns, but not as a second gameplay/runtime state store.
3. **Scene lifecycle events are lifecycle notifications, not a generic bus.** Use [`SceneLifecycleEventBus`](../../src/game/sceneLifecycle/events.ts) for synchronous transition/overlay/pause reactions inside the scene lifecycle/shared scene runtime boundary. Do not use it for durable state, React overlay communication, analytics dumping, or broad app events.
4. **Scene contexts own lifecycle entry, not overlay discovery.** Each Phaser scene that participates in scene lifecycle owns a `sceneContext.ts`. Known scene context assembly belongs in [`src/game/sceneLifecycle/contexts/createSceneContexts.ts`](../../src/game/sceneLifecycle/contexts/createSceneContexts.ts).
5. **ECS components are pure data.** Components are plain objects; logic goes into pure systems under `src/game/core/ecs/systems/**`. Use ECS where pure gameplay decision logic benefits from it; do not migrate scene/runtime code into ECS just to satisfy architecture aesthetics.
6. **Scenes own triggers.** Scene interaction points should call `enterScene` or `openOverlay` through bridge callbacks. Do not recreate a catalog of scene/overlay parent facts.
7. **Upgrade from Observer to Event Queue deliberately.** Synchronous bridge/scene lifecycle events are fine for same-frame reactions. Introduce an Event Queue only for demonstrated time-decoupled delivery such as delayed cross-scene side effects, audio one-shots, analytics, or ordering that must not fire synchronously.

## Folder Ownership

Use [`docs/runtime-architecture.md`](../../docs/runtime-architecture.md) and [`src/README.md`](../../src/README.md) for the full source map. The agent-specific rule is narrower: cross-folder imports should respect the public `index.ts` barrels when they exist, and internals should stay unexported unless another folder intentionally depends on them.
