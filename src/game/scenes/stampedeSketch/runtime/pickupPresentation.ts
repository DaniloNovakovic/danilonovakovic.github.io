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
  private readonly shapes = new Map<string, Phaser.GameObjects.Arc>();

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

      const shape = this.scene.add.circle(
        pickup.x,
        pickup.y,
        pickup.radius,
        0xfacc15,
        0.9
      )
        .setStrokeStyle(2, 0x1a1a1a, 0.9)
        .setDepth(24);

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
