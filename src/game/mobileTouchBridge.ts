/**
 * Touch / on-screen controls write here; Phaser scenes read flags in `update()`.
 * Synthetic DOM KeyboardEvents are not trusted, so Phaser's keyboard plugin ignores them.
 */
export const mobileTouch = {
  left: false,
  right: false,
  /** One-shot: consumed by OverworldScene when grounded. */
  jumpQueued: false,
  /** One-shot: cleared each frame after scenes read it (see scenes). */
  interactTap: false
};

export function resetMobileTouch() {
  mobileTouch.left = false;
  mobileTouch.right = false;
  mobileTouch.jumpQueued = false;
  mobileTouch.interactTap = false;
}
