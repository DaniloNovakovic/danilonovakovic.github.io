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
    const targets = attack.targets.length > 0 ? attack.targets : [attack.target];
    const active = flashRadius > 12;
    targets.forEach((target) => {
      this.graphics.lineBetween(phoneX + 7, phoneY + 18, target.x, target.y);
      if (active) {
        this.graphics.fillStyle(0xfff6c8, 0.85);
        this.graphics.fillCircle(target.x, target.y, flashRadius * 1.3);
        drawFlashStar(this.graphics, target.x, target.y, flashRadius * 1.9);
      }
      this.graphics.strokeRect(
        target.x - flashRadius * 1.25,
        target.y - flashRadius * 1.25,
        flashRadius * 2.5,
        flashRadius * 2.5
      );
      this.graphics.strokeCircle(target.x, target.y, flashRadius * 0.45);
    });
  }
}

function drawFlashStar(graphics: Phaser.GameObjects.Graphics, x: number, y: number, size: number): void {
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const inner = size * 0.55;
    const outer = index % 2 === 0 ? size : size * 0.75;
    graphics.lineBetween(
      x + Math.cos(angle) * inner,
      y + Math.sin(angle) * inner,
      x + Math.cos(angle) * outer,
      y + Math.sin(angle) * outer
    );
  }
}
