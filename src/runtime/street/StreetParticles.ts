/**
 * StreetParticles — atmospheric ink particle effect for the overworld.
 * Call `updateStreetParticles(scene)` each frame from OverworldScene.update.
 *
 * perf: candidate for Phaser Group pool, see docs/patterns/object-pool.md
 */
import * as Phaser from 'phaser';
import { OVERWORLD_PARTICLE_MAX_Y } from '../config';

const SPAWN_CHANCE_THRESHOLD = 95; // spawn when random(0..100) > this value (~5%)

export function updateStreetParticles(scene: Phaser.Scene): void {
  if (Phaser.Math.Between(0, 100) <= SPAWN_CHANCE_THRESHOLD) return;

  const px = scene.cameras.main.scrollX + 1100;
  const py = Phaser.Math.Between(0, OVERWORLD_PARTICLE_MAX_Y);
  const p = scene.add.circle(px, py, Phaser.Math.Between(1, 3), 0x1a1a1a, 0.2);

  scene.tweens.add({
    targets: p,
    x: px - 1200,
    y: py + Phaser.Math.Between(-100, 100),
    duration: Phaser.Math.Between(5000, 10000),
    onComplete: () => p.destroy()
  });
}
