import * as Phaser from 'phaser';
import { clampStampedePosition } from './movement';

interface StampedeSwarmDot {
  shape: Phaser.GameObjects.Arc;
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

  update(target: { x: number; y: number }, delta: number, options: StampedeSwarmUpdateOptions = {}): void {
    const deltaSeconds = delta / 1000;
    const pressure = Phaser.Math.Clamp(options.pressure ?? 0, 0, 1);
    const motion = getSwarmMotion(options.mode ?? 'calm', pressure);

    this.dots.forEach((dot) => {
      const dx = target.x - dot.shape.x;
      const dy = target.y - dot.shape.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const wobbleX = Math.sin(this.scene.time.now / 380 + dot.phase) * 8 * motion.wobbleMultiplier;
      const wobbleY = Math.cos(this.scene.time.now / 420 + dot.phase) * 6 * motion.wobbleMultiplier;
      dot.shape.x += (dx / distance) * dot.speed * motion.speedMultiplier * deltaSeconds + wobbleX * deltaSeconds;
      dot.shape.y += (dy / distance) * dot.speed * motion.speedMultiplier * deltaSeconds + wobbleY * deltaSeconds;

      const clamped = clampStampedePosition({ x: dot.shape.x, y: dot.shape.y });
      dot.shape.setPosition(clamped.x, clamped.y);
      dot.shape.setScale((distance < 38 ? 1.35 : 1) * motion.scaleMultiplier);
      dot.shape.setAlpha(Math.min(distance < 38 ? 0.96 : 0.82, (distance < 38 ? 0.9 : 0.62) * motion.alphaMultiplier));
    });
  }

  getContactCandidates(): readonly StampedeSwarmContactCandidate[] {
    return this.dots.map((dot) => ({
      x: dot.shape.x,
      y: dot.shape.y,
      radius: dot.shape.radius * dot.shape.scaleX
    }));
  }
}

function getSwarmMotion(
  mode: StampedeSwarmMode,
  pressure: number
): { speedMultiplier: number; wobbleMultiplier: number; alphaMultiplier: number; scaleMultiplier: number } {
  switch (mode) {
    case 'build':
      return {
        speedMultiplier: 1.15 + pressure * 0.35,
        wobbleMultiplier: 1.1 + pressure * 0.35,
        alphaMultiplier: 1.05 + pressure * 0.18,
        scaleMultiplier: 1 + pressure * 0.08
      };
    case 'surge':
      return {
        speedMultiplier: 1.55 + pressure * 0.45,
        wobbleMultiplier: 1.45 + pressure * 0.4,
        alphaMultiplier: 1.2 + pressure * 0.24,
        scaleMultiplier: 1.08 + pressure * 0.16
      };
    case 'recover':
      return {
        speedMultiplier: 0.82 + pressure * 0.12,
        wobbleMultiplier: 0.86,
        alphaMultiplier: 0.92,
        scaleMultiplier: 0.96
      };
    case 'calm':
    default:
      return {
        speedMultiplier: 1,
        wobbleMultiplier: 1,
        alphaMultiplier: 1,
        scaleMultiplier: 1
      };
  }
}
