import { bridgeActions, bridgeStore } from '../shared/bridge/store';

/**
 * Touch / on-screen controls write here; Phaser scenes read flags in `update()`.
 * Synthetic DOM KeyboardEvents are not trusted, so Phaser's keyboard plugin ignores them.
 */
export const mobileTouch = {
  get left() {
    return bridgeStore.getState().touch.left;
  },
  set left(value: boolean) {
    bridgeActions.setTouchDirectional('left', value);
  },
  get right() {
    return bridgeStore.getState().touch.right;
  },
  set right(value: boolean) {
    bridgeActions.setTouchDirectional('right', value);
  },
  /** One-shot: consumed by scenes through bridge actions. */
  get jumpQueued() {
    return bridgeStore.getState().touch.jumpQueued;
  },
  set jumpQueued(value: boolean) {
    if (value) {
      bridgeActions.queueJump();
    } else {
      bridgeActions.consumeTouchOneShots();
    }
  },
  /** One-shot: consumed by scenes through bridge actions. */
  get interactTap() {
    return bridgeStore.getState().touch.interactTap;
  },
  set interactTap(value: boolean) {
    if (value) {
      bridgeActions.tapInteract();
    } else {
      bridgeActions.consumeTouchOneShots();
    }
  }
};

export function resetMobileTouch() {
  bridgeActions.resetTouch();
}
