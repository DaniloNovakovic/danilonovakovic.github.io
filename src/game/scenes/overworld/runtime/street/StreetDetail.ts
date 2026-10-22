/**
 * StreetDetail — the street drawing "levels up" as secrets are found.
 * Level 2 adds an ink pass (flowers, cast shadows, fences); level 3 adds the
 * finished pass (street lamps with light pools, twinkling sky). Monochrome only.
 */
import * as Phaser from 'phaser';
import { OVERWORLD_BUILDING_SPOTS, type SketchDetailLevel } from '@/game/core/console';
import { getMessages } from '@/shared/i18n';
import { GAME_DESIGN_WIDTH } from '@/game/sharedSceneRuntime/config';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import { OVERWORLD_WIDTH } from '../../worldLayout';

const INK = 0x1a1a1a;
const PAPER = 0xfbfbf9;
const GROUND_Y = 550;
const LAMP_XS = [1150, 2150] as const;
const LAMP_TOP_Y = 400;
const STAR_COUNT = 18;
const TOAST_MS = 3200;

/** Survives scene restarts so the "more detail" toast only fires on real upgrades. */
let lastShownLevel: SketchDetailLevel | null = null;

export class StreetDetail {
  private readonly scene: Phaser.Scene;
  private readonly inkPass: Phaser.GameObjects.Graphics;
  private readonly finishedPass: Phaser.GameObjects.Graphics;
  private readonly lampGlow: Phaser.GameObjects.Graphics;
  private readonly stars: Phaser.GameObjects.Text[] = [];
  private level: SketchDetailLevel | null = null;
  private lastTick = -1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.inkPass = scene.add.graphics().setDepth(3).setVisible(false);
    this.finishedPass = scene.add.graphics().setDepth(3).setVisible(false);
    this.lampGlow = scene.add.graphics().setDepth(2).setVisible(false);
    this.drawInkPass();
    this.drawFinishedPass();
    for (let i = 0; i < STAR_COUNT; i += 1) {
      this.stars.push(
        createUiText(scene, 80 + ((i * 523) % (OVERWORLD_WIDTH - 160)), 70 + ((i * 97) % 150), '+', {
          fontSize: '14px',
          color: '#1a1a1a'
        })
          .setOrigin(0.5)
          .setDepth(1)
          .setVisible(false)
      );
    }
  }

  update(level: SketchDetailLevel, tick: number, motion: boolean): void {
    if (level !== this.level) this.applyLevel(level);
    if (level < 3 || tick === this.lastTick) return;
    this.lastTick = tick;
    this.twinkle(motion ? tick : 0);
  }

  private twinkle(frame: number): void {
    this.stars.forEach((star, i) => {
      star.setAlpha((i + frame) % 5 === 0 ? 0.15 : 0.55).setText((i + frame) % 7 === 0 ? '*' : '+');
    });
    this.lampGlow.setAlpha(frame > 0 && frame % 13 === 0 ? 0.6 : 1);
  }

  private applyLevel(level: SketchDetailLevel): void {
    this.level = level;
    this.inkPass.setVisible(level >= 2);
    this.finishedPass.setVisible(level >= 3);
    this.lampGlow.setVisible(level >= 3);
    for (const star of this.stars) star.setVisible(level >= 3);

    const upgraded = lastShownLevel !== null && level > lastShownLevel && level >= 2;
    lastShownLevel = level;
    if (upgraded) this.showToast();
  }

  private showToast(): void {
    const toast = createUiText(this.scene, GAME_DESIGN_WIDTH / 2, 46, getMessages().scenes.overworld.sketchUpgrade, {
      fontSize: '15px',
      color: '#1a1a1a',
      backgroundColor: '#fbfbf9',
      padding: { x: 10, y: 5 }
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(60);
    this.scene.tweens.add({
      targets: toast,
      alpha: 0,
      delay: TOAST_MS,
      duration: 500,
      onComplete: () => toast.destroy()
    });
  }

  private drawInkPass(): void {
    const g = this.inkPass;
    // Cast shadows to the right of each building.
    g.lineStyle(1.5, INK, 0.3);
    for (const building of OVERWORLD_BUILDING_SPOTS) {
      for (let i = 0; i < 9; i += 1) {
        const x = building.x + 70 + i * 8;
        g.lineBetween(x, GROUND_Y + 2, x + 10, GROUND_Y + 12);
      }
    }
    // Little daisies along the curb.
    for (let i = 0; i < 26; i += 1) {
      const x = 140 + ((i * 331) % (OVERWORLD_WIDTH - 280));
      if (OVERWORLD_BUILDING_SPOTS.some((b) => Math.abs(b.x - x) < 80)) continue;
      this.drawDaisy(g, x, GROUND_Y - 4 - (i % 3) * 2);
    }
    // Picket fences in a couple of gaps.
    for (const start of [1020, 2020]) {
      g.lineStyle(2, INK, 0.75);
      g.lineBetween(start, GROUND_Y - 22, start + 120, GROUND_Y - 22);
      g.lineBetween(start, GROUND_Y - 10, start + 120, GROUND_Y - 10);
      for (let x = start; x <= start + 120; x += 15) {
        g.lineBetween(x, GROUND_Y, x, GROUND_Y - 30);
        g.lineBetween(x, GROUND_Y - 30, x + 3, GROUND_Y - 34);
      }
    }
  }

  private drawDaisy(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.lineStyle(1.5, INK, 0.8);
    g.lineBetween(x, GROUND_Y, x, y - 8);
    g.fillStyle(PAPER, 1);
    for (let p = 0; p < 5; p += 1) {
      const angle = (Math.PI * 2 * p) / 5;
      g.fillCircle(x + Math.cos(angle) * 4, y - 12 + Math.sin(angle) * 4, 3);
      g.strokeCircle(x + Math.cos(angle) * 4, y - 12 + Math.sin(angle) * 4, 3);
    }
    g.fillStyle(INK, 1);
    g.fillCircle(x, y - 12, 2);
  }

  private drawFinishedPass(): void {
    const g = this.finishedPass;
    for (const x of LAMP_XS) {
      g.lineStyle(4, INK, 1);
      g.lineBetween(x, GROUND_Y, x, LAMP_TOP_Y);
      g.lineBetween(x, LAMP_TOP_Y, x + 22, LAMP_TOP_Y);
      g.lineStyle(2, INK, 1);
      g.strokeRect(x + 14, LAMP_TOP_Y + 2, 16, 14);
      g.fillStyle(INK, 1);
      g.fillRect(x - 6, GROUND_Y - 6, 12, 6);

      const glow = this.lampGlow;
      glow.fillStyle(PAPER, 1);
      glow.fillTriangle(x + 22, LAMP_TOP_Y + 16, x - 30, GROUND_Y, x + 74, GROUND_Y);
      glow.lineStyle(1, INK, 0.18);
      for (let i = -4; i <= 4; i += 1) glow.lineBetween(x + 22, LAMP_TOP_Y + 18, x + 22 + i * 13, GROUND_Y);
      glow.lineStyle(2, INK, 0.35);
      glow.strokeEllipse(x + 22, GROUND_Y + 4, 110, 12);
    }
  }
}
