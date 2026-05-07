import * as Phaser from 'phaser';
import { clampStampedePosition } from './movement';

interface StampedeSwarmDot {
  shape: Phaser.GameObjects.Arc;
  speed: number;
  phase: number;
}

interface StampedeSwarmRuntimeOptions {
  scene: Phaser.Scene;
}

export interface StampedeSwarmRuntime {
  update(target: { x: number; y: number }, delta: number): void;
}

export function createStampedeSwarmRuntime(
  options: StampedeSwarmRuntimeOptions
): StampedeSwarmRuntime {
  const spawnPoints = [
    { x: 330, y: 202 },
    { x: 392, y: 158 },
    { x: 608, y: 164 },
    { x: 668, y: 214 },
    { x: 684, y: 438 },
    { x: 612, y: 506 },
    { x: 388, y: 510 },
    { x: 318, y: 426 },
    { x: 330, y: 292 },
    { x: 672, y: 302 }
  ];
  const dots = spawnPoints.map((point, index) => ({
    shape: options.scene.add.circle(
      point.x,
      point.y,
      index % 3 === 0 ? 7 : 5,
      0x1a1a1a,
      0.68
    ).setDepth(20),
    speed: 18 + index * 2,
    phase: index * 0.7
  }));

  return new PhaserStampedeSwarmRuntime(options.scene, dots);
}

class PhaserStampedeSwarmRuntime implements StampedeSwarmRuntime {
  private readonly scene: Phaser.Scene;
  private readonly dots: StampedeSwarmDot[];

  constructor(
    scene: Phaser.Scene,
    dots: StampedeSwarmDot[]
  ) {
    this.scene = scene;
    this.dots = dots;
  }

  update(target: { x: number; y: number }, delta: number): void {
    const deltaSeconds = delta / 1000;
    this.dots.forEach((dot) => {
      const dx = target.x - dot.shape.x;
      const dy = target.y - dot.shape.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const wobbleX = Math.sin(this.scene.time.now / 380 + dot.phase) * 8;
      const wobbleY = Math.cos(this.scene.time.now / 420 + dot.phase) * 6;
      dot.shape.x += (dx / distance) * dot.speed * deltaSeconds + wobbleX * deltaSeconds;
      dot.shape.y += (dy / distance) * dot.speed * deltaSeconds + wobbleY * deltaSeconds;

      const clamped = clampStampedePosition({ x: dot.shape.x, y: dot.shape.y });
      dot.shape.setPosition(clamped.x, clamped.y);
      dot.shape.setScale(distance < 38 ? 1.35 : 1);
      dot.shape.setAlpha(distance < 38 ? 0.9 : 0.62);
    });
  }
}
