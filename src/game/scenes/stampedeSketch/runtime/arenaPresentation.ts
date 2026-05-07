import * as Phaser from 'phaser';
import { STAMPEDE_ARENA } from './movement';

export function drawStampedeArena(scene: Phaser.Scene): void {
  const centerX = (STAMPEDE_ARENA.left + STAMPEDE_ARENA.right) / 2;
  const centerY = (STAMPEDE_ARENA.top + STAMPEDE_ARENA.bottom) / 2;
  const width = STAMPEDE_ARENA.right - STAMPEDE_ARENA.left;
  const height = STAMPEDE_ARENA.bottom - STAMPEDE_ARENA.top;

  scene.add.rectangle(centerX, centerY, width, height, 0xffffff, 1)
    .setStrokeStyle(5, 0x1a1a1a, 0.9);
}
