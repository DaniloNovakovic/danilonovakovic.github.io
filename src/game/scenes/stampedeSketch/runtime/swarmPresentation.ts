import * as Phaser from 'phaser';
import { clampStampedePosition } from './movement';
import {
  getStampedeSwarmMotion,
  resolveStampedeSwarmTarget
} from './swarmMotion';

interface StampedeSwarmDot {
  shape: Phaser.GameObjects.Arc;
  homeX: number;
  homeY: number;
  homeRadius: number;
  homeAlpha: number;
  speed: number;
  phase: number;
}

export type StampedeSwarmMode = 'calm' | 'build' | 'surge' | 'recover';

export interface StampedeSwarmUpdateOptions {
  mode?: StampedeSwarmMode;
  pressure?: number;
}

export interface StampedeSwarmContactCandidate {
  x: number;
  y: number;
  radius: number;
}

interface StampedeSwarmRuntimeOptions {
  scene: Phaser.Scene;
}

export interface StampedeSwarmRuntime {
  update(target: { x: number; y: number }, delta: number, options?: StampedeSwarmUpdateOptions): void;
  getContactCandidates(): readonly StampedeSwarmContactCandidate[];
  reset(): void;
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
    homeX: point.x,
    homeY: point.y,
    homeRadius: index % 3 === 0 ? 7 : 5,
    homeAlpha: 0.68,
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

  update(target: { x: number; y: number }, delta: number, options: StampedeSwarmUpdateOptions = {}): void {
    const deltaSeconds = delta / 1000;
    const pressure = Phaser.Math.Clamp(options.pressure ?? 0, 0, 1);
    const mode = options.mode ?? 'calm';
    const motion = getStampedeSwarmMotion(mode, pressure);

    this.dots.forEach((dot) => {
      const chaseTarget = resolveStampedeSwarmTarget({
        target,
        phase: dot.phase,
        mode,
        pressure,
        nowMs: this.scene.time.now
      });
      const dx = chaseTarget.x - dot.shape.x;
      const dy = chaseTarget.y - dot.shape.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const wobbleX = Math.sin(this.scene.time.now / 380 + dot.phase) * 8 * motion.wobbleMultiplier;
      const wobbleY = Math.cos(this.scene.time.now / 420 + dot.phase) * 6 * motion.wobbleMultiplier;
      dot.shape.x += (dx / distance) * dot.speed * motion.speedMultiplier * deltaSeconds + wobbleX * deltaSeconds;
      dot.shape.y += (dy / distance) * dot.speed * motion.speedMultiplier * deltaSeconds + wobbleY * deltaSeconds;

      const clamped = clampStampedePosition({ x: dot.shape.x, y: dot.shape.y });
      dot.shape.setPosition(clamped.x, clamped.y);
      const isNear = distance < 38;
      dot.shape.setScale((isNear ? 1.35 : 1) * motion.scaleMultiplier);
      dot.shape.setAlpha(Math.min(isNear ? 0.96 : 0.82, (isNear ? 0.9 : 0.62) * motion.alphaMultiplier));
    });
  }

  getContactCandidates(): readonly StampedeSwarmContactCandidate[] {
    return this.dots.map((dot) => ({
      x: dot.shape.x,
      y: dot.shape.y,
      radius: dot.shape.radius * dot.shape.scaleX
    }));
  }

  reset(): void {
    this.dots.forEach((dot) => {
      this.scene.tweens.killTweensOf(dot.shape);
      dot.shape
        .setPosition(dot.homeX, dot.homeY)
        .setRadius(dot.homeRadius)
        .setScale(1)
        .setAlpha(dot.homeAlpha);
    });
  }
}
