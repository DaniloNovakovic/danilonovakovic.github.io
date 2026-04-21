import * as Phaser from 'phaser';
import { GAMEPLAY_KEYBOARD_CAPTURES } from './config';

export type SceneKeyboardPauseOptions = {
  /** When true, pause/resume `scene.physics.world` (Hobbies room). */
  pausePhysicsWorld?: boolean;
  /** Zero horizontal velocity when entering pause (player drift). */
  zeroHorizontalVelocity?: () => void;
};

/**
 * Shared policy: disable Phaser keyboard plugin while React overlays are focused,
 * and re-enable key capture when returning to gameplay.
 */
export function setSceneKeyboardPaused(
  scene: Phaser.Scene,
  paused: boolean,
  opts: SceneKeyboardPauseOptions = {}
): void {
  const kb = scene.input?.keyboard;
  if (!kb) return;

  kb.enabled = !paused;

  if (paused) {
    if (opts.pausePhysicsWorld) {
      scene.physics.world.pause();
    }
    opts.zeroHorizontalVelocity?.();
  } else {
    if (opts.pausePhysicsWorld) {
      scene.physics.world.resume();
    }
    if (typeof kb.addCapture === 'function') {
      kb.addCapture([...GAMEPLAY_KEYBOARD_CAPTURES]);
    }
  }
}
