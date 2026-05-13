import * as Phaser from 'phaser';
import {
  STAMPEDE_ARENA,
  clampStampedePosition
} from './movement';
import { STAMPEDE_CONTACT_RADIUS_PADDING } from './pressure';
import {
  getStampedeSwarmMotion,
  resolveStampedeSwarmTarget
} from './swarmMotion';
import type { StampedeClearedMarkPoint } from './progression';

interface StampedeSwarmDot {
  id: string;
  shape: Phaser.GameObjects.Arc;
  halo: Phaser.GameObjects.Arc;
  telegraph: Phaser.GameObjects.Arc;
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
  clearMarks(ids: readonly string[]): readonly StampedeClearedMarkPoint[];
  reset(): void;
}

const STAMPEDE_SWARM_BOUNDS = {
  safeLeft: STAMPEDE_ARENA.left + 12,
  safeRight: STAMPEDE_ARENA.right - 12,
  safeTop: STAMPEDE_ARENA.top + 24,
  safeBottom: STAMPEDE_ARENA.bottom - 24
} as const;
const STAMPEDE_RESPAWN_DELAY_MS = 3_200;
const STAMPEDE_RESPAWN_TELEGRAPH_MS = 1_100;

export function createStampedeSwarmRuntime(
  options: StampedeSwarmRuntimeOptions
): StampedeSwarmRuntime {
  const spawnPoints = createStampedeSwarmSpawnPoints();
  const dots = spawnPoints.map((point, index) => ({
    id: `mark-${index + 1}`,
    shape: options.scene.add.circle(
      point.x,
      point.y,
      index % 3 === 0 ? 7 : 5,
      0x1a1a1a,
      0.68
    ).setDepth(20),
    halo: options.scene.add.circle(
      point.x,
      point.y,
      (index % 3 === 0 ? 7 : 5) + STAMPEDE_CONTACT_RADIUS_PADDING,
      0xffffff,
      0
    ).setStrokeStyle(2, 0x1a1a1a, 0.24).setDepth(19),
    telegraph: options.scene.add.circle(
      point.x,
      point.y,
      (index % 3 === 0 ? 7 : 5) + STAMPEDE_CONTACT_RADIUS_PADDING + 5,
      0xffffff,
      0
    ).setStrokeStyle(3, 0xb4533d, 0.84).setDepth(18).setVisible(false).setAlpha(0),
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
        if (nowMs < dot.clearedUntilMs) {
          this.updateRespawnTelegraph(dot, dot.clearedUntilMs - nowMs);
          return;
        }
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
      this.syncHalo(dot, isNear, motion.alphaMultiplier);
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

  clearMarks(ids: readonly string[]): readonly StampedeClearedMarkPoint[] {
    if (ids.length === 0) return [];

    const hitIds = new Set(ids);
    const clearedMarks: StampedeClearedMarkPoint[] = [];
    this.dots.forEach((dot) => {
      if (!hitIds.has(dot.id)) return;
      if (dot.clearedUntilMs !== null) return;

      clearedMarks.push({
        id: dot.id,
        x: dot.shape.x,
        y: dot.shape.y
      });

      dot.clearedUntilMs = this.scene.time.now + STAMPEDE_RESPAWN_DELAY_MS;
      this.scene.tweens.killTweensOf(dot.shape);
      this.scene.tweens.killTweensOf(dot.halo);
      this.scene.tweens.killTweensOf(dot.telegraph);
      dot.shape.setVisible(true);
      dot.halo.setVisible(true);
      dot.telegraph.setVisible(false).setAlpha(0);
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
      this.scene.tweens.add({
        targets: dot.halo,
        alpha: 0.05,
        scale: 1.8,
        duration: 180,
        ease: 'Sine.easeOut',
        onComplete: () => {
          if (dot.clearedUntilMs !== null) {
            dot.halo.setVisible(false);
          }
        }
      });
    });

    return clearedMarks;
  }

  reset(): void {
    this.dots.forEach((dot) => {
      this.scene.tweens.killTweensOf(dot.shape);
      this.scene.tweens.killTweensOf(dot.halo);
      this.scene.tweens.killTweensOf(dot.telegraph);
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
    dot.halo
      .setVisible(true)
      .setPosition(dot.homeX, dot.homeY)
      .setRadius(dot.homeRadius + STAMPEDE_CONTACT_RADIUS_PADDING)
      .setScale(1)
      .setAlpha(1);
    dot.telegraph
      .setVisible(false)
      .setPosition(dot.homeX, dot.homeY)
      .setScale(1)
      .setAlpha(0);
  }

  private syncHalo(
    dot: StampedeSwarmDot,
    isNear: boolean,
    alphaMultiplier: number
  ): void {
    dot.halo
      .setVisible(true)
      .setPosition(dot.shape.x, dot.shape.y)
      .setScale(dot.shape.scaleX)
      .setAlpha(Math.min(isNear ? 0.56 : 0.28, (isNear ? 0.44 : 0.22) * alphaMultiplier));
  }

  private updateRespawnTelegraph(
    dot: StampedeSwarmDot,
    remainingMs: number
  ): void {
    if (remainingMs > STAMPEDE_RESPAWN_TELEGRAPH_MS) {
      dot.telegraph.setVisible(false).setAlpha(0);
      return;
    }

    const progress = 1 - remainingMs / STAMPEDE_RESPAWN_TELEGRAPH_MS;
    const pulse = 0.5 + Math.sin(this.scene.time.now / 85) * 0.5;
    dot.telegraph
      .setVisible(true)
      .setPosition(dot.homeX, dot.homeY)
      .setRadius(dot.homeRadius + STAMPEDE_CONTACT_RADIUS_PADDING + 8)
      .setScale(0.82 + progress * 0.34 + pulse * 0.06)
      .setAlpha(0.3 + progress * 0.55);
  }
}

function createStampedeSwarmSpawnPoints(): Array<{ x: number; y: number }> {
  const left = STAMPEDE_ARENA.safeLeft + 20;
  const right = STAMPEDE_ARENA.safeRight - 20;
  const top = STAMPEDE_ARENA.safeTop + 16;
  const bottom = STAMPEDE_ARENA.safeBottom - 16;
  const centerX = (STAMPEDE_ARENA.left + STAMPEDE_ARENA.right) / 2;
  const centerY = (STAMPEDE_ARENA.top + STAMPEDE_ARENA.bottom) / 2;

  return [
    { x: left, y: centerY - 130 },
    { x: centerX - 260, y: top },
    { x: centerX - 90, y: top + 12 },
    { x: centerX + 110, y: top },
    { x: centerX + 280, y: top + 24 },
    { x: right, y: centerY - 85 },
    { x: right, y: centerY + 90 },
    { x: centerX + 260, y: bottom },
    { x: centerX + 70, y: bottom - 8 },
    { x: centerX - 130, y: bottom },
    { x: centerX - 300, y: bottom - 28 },
    { x: left, y: centerY + 110 }
  ];
}
