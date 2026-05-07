import * as Phaser from 'phaser';
import { STAMPEDE_ARENA } from './movement';

export const STAMPEDE_BACK_BOUNDS = new Phaser.Geom.Rectangle(
  STAMPEDE_ARENA.safeLeft + 8,
  STAMPEDE_ARENA.safeTop - 48,
  96,
  44
);

export function drawStampedeArena(scene: Phaser.Scene, onBack: () => void): void {
  const centerX = (STAMPEDE_ARENA.left + STAMPEDE_ARENA.right) / 2;
  const centerY = (STAMPEDE_ARENA.top + STAMPEDE_ARENA.bottom) / 2;
  const width = STAMPEDE_ARENA.right - STAMPEDE_ARENA.left;
  const height = STAMPEDE_ARENA.bottom - STAMPEDE_ARENA.top;

  scene.add.rectangle(centerX, centerY, width, height, 0xf4f1ea, 1)
    .setStrokeStyle(5, 0x1a1a1a, 0.9);
  scene.add.ellipse(centerX, centerY + 48, width - 78, height - 270, 0xfbfbf9, 1)
    .setStrokeStyle(4, 0x1a1a1a, 0.8);

  for (let x = STAMPEDE_ARENA.left + 22; x < STAMPEDE_ARENA.right; x += 34) {
    scene.add.line(x, 50, -18, 18, 18, -18, 0x1a1a1a, 0.14).setLineWidth(2);
    scene.add.line(x, 550, -18, 18, 18, -18, 0x1a1a1a, 0.14).setLineWidth(2);
  }

  scene.add.text(centerX, 90, 'Stampede Sketch', {
    fontFamily: 'monospace',
    fontSize: '26px',
    color: '#1a1a1a'
  }).setOrigin(0.5);
  scene.add.text(centerX, 120, 'M4a movement feel: kite the ink, no rewards yet.', {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#4b4337'
  }).setOrigin(0.5);
  scene.add.text(centerX, 542, 'Drag or WASD. E / H / Esc returns to Ridge.', {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#4b4337'
  }).setOrigin(0.5);

  drawPicnicBlanket(scene, centerX, centerY + 36);
  drawBackTarget(scene, onBack);
}

function drawPicnicBlanket(scene: Phaser.Scene, x: number, y: number): void {
  const blanket = scene.add.polygon(
    x,
    y,
    [
      0, -44,
      84, 0,
      0, 44,
      -84, 0
    ],
    0xfbfbf9,
    1
  );
  blanket.setStrokeStyle(5, 0x1a1a1a, 0.9);

  scene.add.line(x, y, -54, -16, 54, 16, 0x1a1a1a, 0.4).setLineWidth(3);
  scene.add.line(x, y, -54, 16, 54, -16, 0x1a1a1a, 0.4).setLineWidth(3);
  scene.add.circle(x - 42, y - 58, 9, 0x1a1a1a, 0.85);
  scene.add.circle(x + 52, y - 48, 7, 0x1a1a1a, 0.7);
  scene.add.circle(x + 34, y + 58, 6, 0x1a1a1a, 0.62);
}

function drawBackTarget(scene: Phaser.Scene, onBack: () => void): void {
  scene.add.rectangle(
    STAMPEDE_BACK_BOUNDS.centerX,
    STAMPEDE_BACK_BOUNDS.centerY,
    STAMPEDE_BACK_BOUNDS.width,
    STAMPEDE_BACK_BOUNDS.height,
    0xfbfbf9,
    1
  ).setStrokeStyle(4, 0x1a1a1a, 1);
  scene.add.text(STAMPEDE_BACK_BOUNDS.centerX, STAMPEDE_BACK_BOUNDS.centerY, 'BACK', {
    fontFamily: 'monospace',
    fontSize: '15px',
    color: '#1a1a1a'
  }).setOrigin(0.5);

  scene.add.zone(
    STAMPEDE_BACK_BOUNDS.centerX,
    STAMPEDE_BACK_BOUNDS.centerY,
    STAMPEDE_BACK_BOUNDS.width,
    STAMPEDE_BACK_BOUNDS.height
  )
    .setInteractive({ useHandCursor: true })
    .on('pointerup', onBack);
}
