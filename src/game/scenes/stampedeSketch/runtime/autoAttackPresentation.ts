import * as Phaser from 'phaser';
import type { StampedeAutoAttackEvent } from './autoAttack';

interface StampedeAutoAttackPresentationRuntimeOptions {
  scene: Phaser.Scene;
}

export interface StampedeAutoAttackPresentationRuntime {
  show(attack: StampedeAutoAttackEvent): void;
  reset(): void;
  destroy(): void;
}

export function createStampedeAutoAttackPresentationRuntime(
  options: StampedeAutoAttackPresentationRuntimeOptions
): StampedeAutoAttackPresentationRuntime {
  return new PhaserStampedeAutoAttackPresentationRuntime(options.scene);
}

class PhaserStampedeAutoAttackPresentationRuntime implements StampedeAutoAttackPresentationRuntime {
  private readonly scene: Phaser.Scene;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly timers = new Set<Phaser.Time.TimerEvent>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics().setDepth(55);
  }

  show(attack: StampedeAutoAttackEvent): void {
    this.reset();
    this.drawTelegraph(attack);

    const activeTimer = this.scene.time.delayedCall(220, () => {
      this.timers.delete(activeTimer);
      this.drawActiveSwipe(attack);

      const clearTimer = this.scene.time.delayedCall(140, () => {
        this.timers.delete(clearTimer);
        this.graphics.clear();
      });
      this.timers.add(clearTimer);
    });
    this.timers.add(activeTimer);
  }

  reset(): void {
    this.timers.forEach((timer) => timer.remove(false));
    this.timers.clear();
    this.graphics.clear();
  }

  destroy(): void {
    this.reset();
    this.graphics.destroy();
  }

  private drawTelegraph(attack: StampedeAutoAttackEvent): void {
    this.graphics.clear();
    this.graphics.lineStyle(4, 0x1a1a1a, 0.18);
    this.drawSwipeLine(attack);
  }

  private drawActiveSwipe(attack: StampedeAutoAttackEvent): void {
    this.graphics.clear();
    this.graphics.lineStyle(9, 0x1a1a1a, 0.88);
    this.drawSwipeLine(attack);

    if (attack.hitIds.length === 0) return;

    this.graphics.fillStyle(0x1a1a1a, 0.62);
    this.graphics.fillCircle(attack.target.x, attack.target.y, 7);
    this.graphics.lineStyle(3, 0x1a1a1a, 0.42);
    this.graphics.beginPath();
    this.graphics.moveTo(attack.target.x - 12, attack.target.y - 5);
    this.graphics.lineTo(attack.target.x + 12, attack.target.y + 5);
    this.graphics.moveTo(attack.target.x - 8, attack.target.y + 9);
    this.graphics.lineTo(attack.target.x + 8, attack.target.y - 9);
    this.graphics.strokePath();
  }

  private drawSwipeLine(attack: StampedeAutoAttackEvent): void {
    const perpendicular = {
      x: -attack.direction.y,
      y: attack.direction.x
    };
    const start = {
      x: attack.origin.x + perpendicular.x * 10,
      y: attack.origin.y + perpendicular.y * 10
    };
    const end = {
      x: attack.target.x - perpendicular.x * 12,
      y: attack.target.y - perpendicular.y * 12
    };
    const mid = {
      x: (start.x + end.x) / 2 + perpendicular.x * 12,
      y: (start.y + end.y) / 2 + perpendicular.y * 12
    };

    this.graphics.beginPath();
    this.graphics.moveTo(start.x, start.y);
    this.graphics.lineTo(mid.x, mid.y);
    this.graphics.lineTo(end.x, end.y);
    this.graphics.strokePath();
  }
}
