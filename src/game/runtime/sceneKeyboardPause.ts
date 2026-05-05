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
 * and re-enable key capture when returning to gameplay. Use this from pausable
 * scenes instead of toggling keyboard capture directly so overlay text inputs and
 * scene physics pause stay consistent.
 */
export function setSceneKeyboardPaused(
  scene: Phaser.Scene,
  paused: boolean,
  opts: SceneKeyboardPauseOptions = {}
): void {
  const kb = scene.input?.keyboard;
  if (!kb) return;
  const keyboard = kb as Phaser.Input.Keyboard.KeyboardPlugin & {
    removeCapture?: (keycode: number | string | Array<number | string>) => void;
    clearCaptures?: () => void;
  };

  kb.enabled = !paused;

  if (paused) {
    // Release gameplay captures while React overlays are focused so text inputs
    // can receive A/D/E (and other gameplay keys).
    if (typeof keyboard.removeCapture === 'function') {
      keyboard.removeCapture([...GAMEPLAY_KEYBOARD_CAPTURES]);
    } else if (typeof keyboard.clearCaptures === 'function') {
      keyboard.clearCaptures();
    }
    if (opts.pausePhysicsWorld) {
      scene.physics.world.pause();
    }
    opts.zeroHorizontalVelocity?.();
  } else {
    if (opts.pausePhysicsWorld) {
      scene.physics.world.resume();
    }
    if (typeof keyboard.addCapture === 'function') {
      keyboard.addCapture([...GAMEPLAY_KEYBOARD_CAPTURES]);
    }
  }
}
