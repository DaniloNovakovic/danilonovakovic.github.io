# React Overlay Rules

React is the overlay/menu/mini-game shell. Phaser is the world. The bridge is the only supported channel between them.

## Hard Rules

1. **No direct Phaser imports in React overlays.** React overlays under `src/game/**/overlays` or `src/game/portfolio` must not import Phaser; the bootstrap component that owns the `Phaser.Game` instance lives under `src/game/shell`.
2. **Bridge in, bridge out.** Read with `useBridgeState`; write with `bridgeActions`. Do not invent selector APIs, subscribe to Phaser emitters from React, or poll Phaser state.
3. **Pause propagation goes through the kernel.** Opening a React overlay should set bridge runtime mode and let `GameKernel` apply pause from `derivePause`.
4. **Use the game runtime catalog.** React overlay resolution, overlay parent returns, and React/Phaser kind checks should go through [`miniGameRegistry`](../../src/game/runtime/miniGameRegistry.ts), not local maps.
5. **One-shot touch events are consumed.** Touch `jumpQueued` and `interactTap` are consumed via `bridgeActions.consumeTouchOneShots()`. Add new one-shots only for rare edge-triggered bridge events, next to the existing flags; do not use them as a replacement for scene input command frames.
6. **No `window` backdoors.** Shared UI/game services must be passed by props, React Context, or the bridge. Use React Context for dependencies and UI-local state; use the bridge for durable state that Phaser, the kernel, runtime modes, inventory/progress, or scene transitions must observe.

## Why It Matters

The bridge keeps the React-overlays-on-Phaser hybrid tractable. Side channels make mini-games fragile and hard to test.
