# React Overlay Rules

React owns overlays and menus. Phaser owns scenes. The bridge is the only supported channel between them.

## Hard Rules

1. **No direct Phaser imports in React overlays.** React overlays under `src/game/**/overlays` or `src/game/overlays` must not import Phaser; the bootstrap component that owns the `Phaser.Game` instance lives under `src/game/shell`.
2. **Bridge in, bridge out.** Read with `useBridgeState`; write with `bridgeActions`. Do not invent selector APIs, subscribe to Phaser emitters from React, or poll Phaser state.
3. **Pause propagation goes through scene lifecycle.** Opening a React overlay should set `activeOverlayId` through the bridge and let `SceneLifecycleController` apply pause from bridge-derived state.
4. **Use the overlay system.** React overlay resolution should go through [`overlayRegistry`](../../src/game/overlays/overlayRegistry.ts) and rendering should go through [`OverlayHost`](../../src/game/overlays/OverlayHost.tsx), not local maps.
5. **Scenes own trigger return behavior.** Scene-local triggers decide whether they open an overlay or enter a scene. Do not add overlay parent metadata to overlay definitions.
6. **One-shot touch events are consumed.** Touch `jumpQueued` and `interactTap` are consumed via `bridgeActions.consumeTouchOneShots()`. Add new one-shots only for rare edge-triggered bridge events, next to the existing flags; do not use them as a replacement for scene input command frames.
7. **No `window` backdoors.** Shared UI/game services must be passed by props, React Context, or the bridge. Use React Context for dependencies and UI-local state; use the bridge for durable state that Phaser, scene lifecycle, overlays, inventory/progress, or scene transitions must observe.

## Why It Matters

The bridge keeps the React-overlays-on-Phaser hybrid tractable. Side channels make overlays and scenes fragile and hard to test.
