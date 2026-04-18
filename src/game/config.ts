import * as Phaser from 'phaser';

export const getGameConfig = (container: HTMLElement): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent: container,
  width: 1000,
  height: 600,
  backgroundColor: '#fbfbf9', // Paper off-white
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1000 },
      debug: false
    }
  }
});
