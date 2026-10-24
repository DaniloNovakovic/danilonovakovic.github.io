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
    this.graphics.lineStyle(3, 0x1a1a1a, 0.28);
    this.drawSelfie(attack, 10);
  }

  private drawActiveSwipe(attack: StampedeAutoAttackEvent): void {
    this.graphics.clear();
    this.graphics.lineStyle(3, 0x1a1a1a, 0.9);
    this.drawSelfie(attack, 16);
  }

  private drawSelfie(attack: StampedeAutoAttackEvent, flashRadius: number): void {
    const phoneX = attack.origin.x - 7;
    const phoneY = attack.origin.y - 22;
    this.graphics.strokeRect(phoneX, phoneY, 14, 18);
    this.graphics.strokeCircle(phoneX + 7, phoneY + 8, 3);
    this.graphics.strokeCircle(attack.target.x, attack.target.y, flashRadius);
    this.graphics.strokeCircle(attack.target.x, attack.target.y, flashRadius * 0.45);
    this.graphics.lineBetween(phoneX + 7, phoneY + 18, attack.target.x, attack.target.y);
  }
}
