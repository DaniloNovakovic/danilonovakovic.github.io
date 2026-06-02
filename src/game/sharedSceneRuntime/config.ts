import * as Phaser from 'phaser';
import { GAME_DESIGN_HEIGHT, GAME_DESIGN_WIDTH } from './designSize';

export { GAME_DESIGN_HEIGHT, GAME_DESIGN_WIDTH } from './designSize';

/** Shared side-view player physics and movement tuning. */
export const SIDE_VIEW_PLAYER_GRAVITY_Y = 800;
export const SIDE_VIEW_JUMP_VELOCITY_Y = -500;
export const SIDE_VIEW_WALK_SPEED = 300;
export const SIDE_VIEW_SPRINT_SPEED = 600;

/** Hobbies interior uses the same logical height as the canvas. */
export const HOBBIES_ROOM_WIDTH = GAME_DESIGN_WIDTH;
export const HOBBIES_ROOM_HEIGHT = GAME_DESIGN_HEIGHT;
export const HOBBIES_FLOOR_Y = 500;
export const HOBBIES_PLAYER_START_OFFSET_Y = 50;
/** Clamp restored player position inside the hobbies room (logical px). */
export const HOBBIES_RESUME_CLAMP = {
  minX: 40,
  maxX: HOBBIES_ROOM_WIDTH - 40,
  minY: 120,
  maxY: HOBBIES_FLOOR_Y - 20
} as const;
/** Proximity radius for hobby stations / exit (Phaser distance check). */
export const HOBBIES_INTERACT_RADIUS = 60;
/** Ground collider zone relative to floor. */
export const HOBBIES_GROUND_ZONE = {
  centerOffsetY: 10,
  width: HOBBIES_ROOM_WIDTH,
  height: 20
} as const;

/**
 * Keycodes passed to Phaser `addCapture` when gameplay resumes after a React overlay.
 * Shift, Space, Arrows, W, A, S, D, E, H.
 */
export const GAMEPLAY_KEYBOARD_CAPTURES = [
  16, 32, 37, 38, 39, 40, 65, 68, 69, 72, 83, 87
] as const;

export const getGameConfig = (container: HTMLElement): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent: container,
  width: GAME_DESIGN_WIDTH,
  height: GAME_DESIGN_HEIGHT,
  backgroundColor: '#fbfbf9', // Paper off-white
  scale: {
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1000 },
      debug: false
    }
  }
});
