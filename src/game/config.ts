import * as Phaser from 'phaser';

/** Fixed internal resolution; canvas is scaled to fit the parent via `Scale.FIT`. */
export const GAME_DESIGN_WIDTH = 1000;
export const GAME_DESIGN_HEIGHT = 600;

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
