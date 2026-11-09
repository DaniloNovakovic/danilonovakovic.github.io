import * as Phaser from 'phaser';
import type { StampedePickup } from './progression';

interface StampedePickupRuntimeOptions {
  scene: Phaser.Scene;
}

export interface StampedePickupRuntime {
  sync(pickups: readonly StampedePickup[]): void;
  reset(): void;
}

export function createStampedePickupRuntime(
  options: StampedePickupRuntimeOptions
): StampedePickupRuntime {
  return new PhaserStampedePickupRuntime(options.scene);
}

class PhaserStampedePickupRuntime implements StampedePickupRuntime {
  private readonly scene: Phaser.Scene;
  private readonly shapes = new Map<string, Phaser.GameObjects.Graphics>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  sync(pickups: readonly StampedePickup[]): void {
    const activeIds = new Set(pickups.map((pickup) => pickup.id));

    this.shapes.forEach((shape, id) => {
      if (activeIds.has(id)) return;
      this.scene.tweens.killTweensOf(shape);
      shape.destroy();
      this.shapes.delete(id);
    });

    pickups.forEach((pickup) => {
      const existing = this.shapes.get(pickup.id);
      if (existing) {
        existing.setPosition(pickup.x, pickup.y);
        return;
      }

      const shape = this.scene.add.graphics().setPosition(pickup.x, pickup.y).setDepth(16);
      if (pickup.kind === 'heart') {
        drawHeart(shape);
      } else if (pickup.kind === 'gift') {
        drawGift(shape);
      } else {
        const width = Math.max(8, pickup.radius * 2.4);
        const height = Math.max(6, pickup.radius * 1.5);
        shape.fillStyle(0xfacc15, 0.95);
        shape.fillEllipse(0, 0, width, height);
        shape.lineStyle(2, 0x1a1a1a, 0.9);
        shape.strokeEllipse(0, 0, width, height);
      }

      this.scene.tweens.add({
        targets: shape,
        scale: 1.18,
        alpha: 0.72,
        duration: 520,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.shapes.set(pickup.id, shape);
    });
  }

  reset(): void {
    this.shapes.forEach((shape) => {
      this.scene.tweens.killTweensOf(shape);
      shape.destroy();
    });
    this.shapes.clear();
  }
}

function drawGift(shape: Phaser.GameObjects.Graphics): void {
  shape.fillStyle(0x1a1a1a, 0.14);
  shape.fillEllipse(0, 15, 28, 8);
  shape.fillStyle(0xf3c1d0, 1);
  shape.lineStyle(2.4, 0x1a1a1a, 1);
  shape.fillRect(-12, -8, 24, 20);
  shape.strokeRect(-12, -8, 24, 20);
  shape.fillStyle(0xc0263b, 1);
  shape.fillRect(-3, -8, 6, 20);
  shape.fillRect(-12, -1, 24, 5);
  shape.strokeRect(-3, -8, 6, 20);
  shape.fillTriangle(0, -8, -10, -15, -9, -5);
  shape.strokeTriangle(0, -8, -10, -15, -9, -5);
  shape.fillTriangle(0, -8, 10, -15, 9, -5);
  shape.strokeTriangle(0, -8, 10, -15, 9, -5);
}

function drawHeart(shape: Phaser.GameObjects.Graphics): void {
  shape.fillStyle(0xb4533d, 1);
  shape.fillCircle(-4, -2, 5);
  shape.fillCircle(4, -2, 5);
  shape.fillTriangle(-9, -1, 9, -1, 0, 10);
  shape.lineStyle(2, 0x1a1a1a, 1);
  shape.strokeCircle(-4, -2, 5);
  shape.strokeCircle(4, -2, 5);
  shape.strokeTriangle(-9, -1, 9, -1, 0, 10);
}
