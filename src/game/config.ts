import * as Phaser from 'phaser';

/** Fixed internal resolution; canvas is scaled to fit the parent via `Scale.FIT`. */
export const GAME_DESIGN_WIDTH = 1000;
export const GAME_DESIGN_HEIGHT = 600;

/** Overworld street width (logical px). */
export const OVERWORLD_WIDTH = 3000;

/** Player spawn and physics tuning — overworld. */
export const OVERWORLD_PLAYER_START = { x: 100, y: 400 } as const;
export const OVERWORLD_PLAYER_GRAVITY_Y = 800;
export const OVERWORLD_JUMP_VELOCITY_Y = -500;
export const OVERWORLD_WALK_SPEED = 300;
export const OVERWORLD_SPRINT_SPEED = 600;
/** Ground zone for collider (center x/y, width, height). */
export const OVERWORLD_GROUND_ZONE = {
  centerY: 575,
  height: 50
} as const;

/** Building interaction: max horizontal distance to sprite center, min player Y. */
export const OVERWORLD_INTERACT_DISTANCE_X = 80;
export const OVERWORLD_INTERACT_MIN_PLAYER_Y = 400;
export const OVERWORLD_INTERACT_PROMPT_OFFSET_Y = 40;

/** Hobbies interior uses the same logical height as the canvas. */
export const HOBBIES_ROOM_WIDTH = GAME_DESIGN_WIDTH;
export const HOBBIES_ROOM_HEIGHT = GAME_DESIGN_HEIGHT;
export const HOBBIES_FLOOR_Y = 500;
export const HOBBIES_PLAYER_START_OFFSET_Y = 50;
export const HOBBIES_WALK_SPEED = 300;
/** Proximity radius for hobby stations / exit (Phaser distance check). */
export const HOBBIES_INTERACT_RADIUS = 60;
/** Ground collider zone relative to floor. */
export const HOBBIES_GROUND_ZONE = {
  centerOffsetY: 10,
  width: 900,
  height: 20
} as const;

/** Ink particle spawn band (overworld ambience). */
export const OVERWORLD_PARTICLE_MAX_Y = GAME_DESIGN_HEIGHT;

/**
 * Keycodes passed to Phaser `addCapture` when gameplay resumes after a React overlay.
 * Shift, Space, Arrows, A, D, E, H.
 */
export const GAMEPLAY_KEYBOARD_CAPTURES = [
  16, 32, 37, 38, 39, 40, 65, 68, 69, 72
] as const;

export const getGameConfig = (container: HTMLElement): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent: container,
  width: GAME_DESIGN_WIDTH,
  height: GAME_DESIGN_HEIGHT,
  backgroundColor: '#fbfbf9', // Paper off-white
  scale: {
    mode: Phaser.Scale.FIT,
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
