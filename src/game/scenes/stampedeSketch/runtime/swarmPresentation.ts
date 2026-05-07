import * as Phaser from 'phaser';
import {
  STAMPEDE_ARENA,
  clampStampedePosition
} from './movement';
import {
  getStampedeSwarmMotion,
  resolveStampedeSwarmTarget
} from './swarmMotion';

interface StampedeSwarmDot {
  id: string;
  shape: Phaser.GameObjects.Arc;
  homeX: number;
  homeY: number;
  homeRadius: number;
  homeAlpha: number;
  speed: number;
  phase: number;
  clearedUntilMs: number | null;
}

export type StampedeSwarmMode = 'calm' | 'build' | 'surge' | 'recover';

export interface StampedeSwarmUpdateOptions {
  mode?: StampedeSwarmMode;
  pressure?: number;
}

export interface StampedeSwarmContactCandidate {
  id: string;
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
  clearMarks(ids: readonly string[]): void;
  reset(): void;
}

const STAMPEDE_SWARM_BOUNDS = {
  safeLeft: STAMPEDE_ARENA.left + 12,
  safeRight: STAMPEDE_ARENA.right - 12,
  safeTop: STAMPEDE_ARENA.top + 24,
  safeBottom: STAMPEDE_ARENA.bottom - 24
} as const;

export function createStampedeSwarmRuntime(
  options: StampedeSwarmRuntimeOptions
): StampedeSwarmRuntime {
  const spawnPoints = [
    { x: 292, y: 236 },
    { x: 344, y: 84 },
    { x: 468, y: 72 },
    { x: 612, y: 84 },
    { x: 708, y: 220 },
    { x: 708, y: 388 },
    { x: 624, y: 520 },
    { x: 504, y: 568 },
    { x: 372, y: 520 },
    { x: 292, y: 388 },
    { x: 292, y: 512 },
    { x: 708, y: 512 }
  ];
  const dots = spawnPoints.map((point, index) => ({
    id: `mark-${index + 1}`,
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
    phase: index * 0.7,
    clearedUntilMs: null
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
    const nowMs = this.scene.time.now;
    const pressure = Phaser.Math.Clamp(options.pressure ?? 0, 0, 1);
    const mode = options.mode ?? 'calm';
    const motion = getStampedeSwarmMotion(mode, pressure);

    this.dots.forEach((dot) => {
      if (dot.clearedUntilMs !== null) {
        if (nowMs < dot.clearedUntilMs) return;
        this.restoreDot(dot);
      }

      const chaseTarget = resolveStampedeSwarmTarget({
        target,
        phase: dot.phase,
        mode,
        pressure,
        nowMs
      });
      const dx = chaseTarget.x - dot.shape.x;
      const dy = chaseTarget.y - dot.shape.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const wobbleX = Math.sin(nowMs / 380 + dot.phase) * 8 * motion.wobbleMultiplier;
      const wobbleY = Math.cos(nowMs / 420 + dot.phase) * 6 * motion.wobbleMultiplier;
      dot.shape.x += (dx / distance) * dot.speed * motion.speedMultiplier * deltaSeconds + wobbleX * deltaSeconds;
      dot.shape.y += (dy / distance) * dot.speed * motion.speedMultiplier * deltaSeconds + wobbleY * deltaSeconds;

      const clamped = clampStampedePosition(
        { x: dot.shape.x, y: dot.shape.y },
        STAMPEDE_SWARM_BOUNDS
      );
      dot.shape.setPosition(clamped.x, clamped.y);
      const isNear = distance < 38;
      dot.shape.setScale((isNear ? 1.35 : 1) * motion.scaleMultiplier);
      dot.shape.setAlpha(Math.min(isNear ? 0.96 : 0.82, (isNear ? 0.9 : 0.62) * motion.alphaMultiplier));
    });
  }

  getContactCandidates(): readonly StampedeSwarmContactCandidate[] {
    return this.dots.filter((dot) => dot.clearedUntilMs === null).map((dot) => ({
      id: dot.id,
      x: dot.shape.x,
      y: dot.shape.y,
      radius: dot.shape.radius * dot.shape.scaleX
    }));
  }

  clearMarks(ids: readonly string[]): void {
    if (ids.length === 0) return;

    const hitIds = new Set(ids);
    this.dots.forEach((dot) => {
      if (!hitIds.has(dot.id)) return;

      dot.clearedUntilMs = this.scene.time.now + 3_000;
      this.scene.tweens.killTweensOf(dot.shape);
      dot.shape.setVisible(true);
      this.scene.tweens.add({
        targets: dot.shape,
        alpha: 0.08,
        scale: 1.8,
        duration: 180,
        ease: 'Sine.easeOut',
        onComplete: () => {
          if (dot.clearedUntilMs !== null) {
            dot.shape.setVisible(false);
          }
        }
      });
    });
  }

  reset(): void {
    this.dots.forEach((dot) => {
      this.scene.tweens.killTweensOf(dot.shape);
      this.restoreDot(dot);
    });
  }

  private restoreDot(dot: StampedeSwarmDot): void {
    dot.clearedUntilMs = null;
    dot.shape
      .setVisible(true)
      .setPosition(dot.homeX, dot.homeY)
      .setRadius(dot.homeRadius)
      .setScale(1)
      .setAlpha(dot.homeAlpha);
  }
}
