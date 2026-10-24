import * as Phaser from 'phaser';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import type { StampedeSpellCast, StampedeSpellId, StampedeSpellPoint } from './spells';

interface StampedeSpellVfxOptions {
  scene: Phaser.Scene;
}

export interface StampedeSpellAim {
  spellId: StampedeSpellId;
  origin: StampedeSpellPoint;
  direction: StampedeSpellPoint;
  ready: boolean;
}

export interface StampedeSpellVfx {
  show(cast: StampedeSpellCast): void;
  aim(aim: StampedeSpellAim): void;
  reset(): void;
}

export function createStampedeSpellVfx(options: StampedeSpellVfxOptions): StampedeSpellVfx {
  return new PhaserStampedeSpellVfx(options.scene);
}

class PhaserStampedeSpellVfx implements StampedeSpellVfx {
  private readonly scene: Phaser.Scene;
  private readonly aimGraphics: Phaser.GameObjects.Graphics;
  private readonly burstGraphics: Phaser.GameObjects.Graphics;
  private readonly rings: Phaser.GameObjects.Arc[];
  private readonly lenses: Phaser.GameObjects.Arc[];
  private readonly bark: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.aimGraphics = scene.add.graphics().setDepth(26);
    this.burstGraphics = scene.add.graphics().setDepth(27);
    this.rings = [0, 1].map(() =>
      scene.add.circle(0, 0, 28, 0xfbfbf9, 0)
        .setStrokeStyle(3, 0x1a1a1a, 0.8)
        .setDepth(27)
        .setVisible(false)
    );
    this.lenses = [ -16, 16 ].map((offset) =>
      scene.add.circle(offset, 0, 18, 0xfbfbf9, 0.9)
        .setStrokeStyle(3, 0x1a1a1a, 1)
        .setDepth(27)
        .setVisible(false)
    );
    this.bark = createUiText(scene, 0, 0, '', {
      fontSize: '28px',
      color: '#b4533d',
      fontStyle: 'bold'
    }).setOrigin(0.5, 1).setDepth(32).setVisible(false);
  }

  show(cast: StampedeSpellCast): void {
    this.scene.tweens.killTweensOf(this.burstGraphics);
    this.burstGraphics.clear().setAlpha(1).setVisible(true);
    if (cast.spellId === 'badBreath') {
      drawBreath(this.burstGraphics, cast.origin, cast.direction, 1);
    }
    this.scene.tweens.add({
      targets: this.burstGraphics,
      alpha: 0,
      duration: cast.spellId === 'badBreath' ? 680 : 280,
      ease: 'Sine.easeOut',
      onComplete: () => this.burstGraphics.clear()
    });

    if (cast.spellId === 'badSmell') {
      this.pulseRings(cast.origin);
    } else {
      this.rings.forEach((ring) => ring.setVisible(false));
    }

    if (cast.spellId === 'fakeGlasses') {
      this.flashLenses(cast.origin);
      this.scene.cameras.main.flash(160, 251, 251, 249);
    } else {
      this.lenses.forEach((lens) => lens.setVisible(false));
    }

    this.scene.tweens.killTweensOf(this.bark);
    this.bark
      .setText(cast.bark)
      .setPosition(cast.origin.x, cast.origin.y - 28)
      .setAlpha(1)
      .setVisible(true);
    this.scene.tweens.add({
      targets: this.bark,
      y: cast.origin.y - 62,
      alpha: 0,
      duration: 700,
      ease: 'Sine.easeOut',
      onComplete: () => this.bark.setVisible(false)
    });
  }

  aim({ spellId, origin, ready }: StampedeSpellAim): void {
    this.aimGraphics.clear();
    if (!ready) return;
    this.aimGraphics.lineStyle(2, 0x1a1a1a, 0.28);
    if (spellId === 'badBreath' || spellId === 'badSmell') return;
    this.aimGraphics.strokeCircle(origin.x - 10, origin.y - 18, 7);
    this.aimGraphics.strokeCircle(origin.x + 10, origin.y - 18, 7);
  }

  reset(): void {
    this.scene.tweens.killTweensOf(this.burstGraphics);
    this.scene.tweens.killTweensOf(this.bark);
    this.rings.forEach((ring) => this.scene.tweens.killTweensOf(ring));
    this.lenses.forEach((lens) => this.scene.tweens.killTweensOf(lens));
    this.aimGraphics.clear();
    this.burstGraphics.clear();
    this.bark.setVisible(false);
    this.rings.forEach((ring) => ring.setVisible(false));
    this.lenses.forEach((lens) => lens.setVisible(false));
  }

  private pulseRings(origin: StampedeSpellPoint): void {
    this.rings.forEach((ring, index) => {
      this.scene.tweens.killTweensOf(ring);
      ring
        .setPosition(origin.x, origin.y)
        .setScale(0.35 + index * 0.15)
        .setAlpha(0.9)
        .setVisible(true);
      this.scene.tweens.add({
        targets: ring,
        scale: 4.4,
        alpha: 0,
        duration: 520,
        delay: index * 90,
        ease: 'Sine.easeOut',
        onComplete: () => ring.setVisible(false)
      });
    });
  }

  private flashLenses(origin: StampedeSpellPoint): void {
    this.lenses.forEach((lens, index) => {
      this.scene.tweens.killTweensOf(lens);
      const side = index === 0 ? -1 : 1;
      lens
        .setPosition(origin.x + side * 16, origin.y - 8)
        .setScale(0.4)
        .setAlpha(1)
        .setVisible(true);
      this.scene.tweens.add({
        targets: lens,
        scale: 2.4,
        alpha: 0,
        x: origin.x + side * 42,
        duration: 460,
        ease: 'Sine.easeOut',
        onComplete: () => lens.setVisible(false)
      });
    });
  }
}

function drawBreath(
  graphics: Phaser.GameObjects.Graphics,
  origin: StampedeSpellPoint,
  direction: StampedeSpellPoint,
  alpha: number
): void {
  const sideX = -direction.y;
  const sideY = direction.x;
  const puffs = [
    { along: 34, side: 0, rx: 14, ry: 10 },
    { along: 62, side: 16, rx: 20, ry: 13 },
    { along: 66, side: -18, rx: 16, ry: 11 },
    { along: 98, side: 8, rx: 26, ry: 15 },
    { along: 118, side: -10, rx: 18, ry: 12 }
  ];
  graphics.lineStyle(3, 0x1a1a1a, alpha);
  graphics.beginPath();
  graphics.moveTo(origin.x + direction.x * 18, origin.y + direction.y * 18);
  puffs.forEach((puff) => {
    graphics.lineTo(
      origin.x + direction.x * puff.along + sideX * puff.side,
      origin.y + direction.y * puff.along + sideY * puff.side
    );
  });
  graphics.strokePath();
  puffs.forEach((puff) => {
    const x = origin.x + direction.x * puff.along + sideX * puff.side;
    const y = origin.y + direction.y * puff.along + sideY * puff.side;
    graphics.lineStyle(2.5, 0x1a1a1a, alpha);
    graphics.strokeEllipse(x, y, puff.rx * 2, puff.ry * 2);
  });
  graphics.fillStyle(0xb4533d, 0.9 * alpha);
  graphics.fillCircle(origin.x + direction.x * 96 + sideX * 18, origin.y + direction.y * 96 + sideY * 18, 2.4);
  graphics.fillCircle(origin.x + direction.x * 78 + sideX * -14, origin.y + direction.y * 78 + sideY * -14, 1.8);
}
