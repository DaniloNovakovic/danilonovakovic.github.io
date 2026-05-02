# React Overlay Rules

React is the overlay/menu/mini-game shell. Phaser is the world. The bridge is the only supported channel between them.

## Hard Rules

1. **No direct Phaser imports in React overlays.** React components under `src/components/**` must not import Phaser, except the bootstrap component that owns the `Phaser.Game` instance.
2. **Bridge in, bridge out.** Read with `useBridgeState` or scoped selectors; write with `bridgeActions`. Do not subscribe to Phaser emitters from React, and do not poll Phaser state.
3. **Pause propagation goes through the kernel.** Opening a React overlay should set bridge runtime mode and let `GameKernel` apply pause from `derivePause`.
4. **Use the feature runtime catalog.** React overlay resolution, overlay parent returns, and React/Phaser kind checks should go through [`miniGameRegistry`](../../src/runtime/miniGameRegistry.ts), not local maps.
5. **One-shot touch events are consumed.** Touch `jumpQueued` and `interactTap` are consumed via `bridgeActions.consumeTouchOneShots()`. Add new one-shots next to the existing bridge flags.
6. **No `window` backdoors.** Shared UI/game services must be passed by props, React Context, or the bridge. Use React Context for dependencies/UI-local state; use the bridge for state that Phaser, the kernel, or runtime modes must observe.

## Why It Matters

The bridge keeps the React-overlays-on-Phaser hybrid tractable. Side channels make mini-games fragile and hard to test.
