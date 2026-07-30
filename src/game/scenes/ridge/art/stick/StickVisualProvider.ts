import type * as Phaser from 'phaser';
import type { RidgeVisualProvider, RidgeVisualViewModel } from '../types';
import {
  drawStickCicka,
  drawStickDraftsperson,
  drawStickPlayer,
  drawStickToyCar
} from './stickFigures';

const PAPER = 0xfbfbf9;
const INK = 0x1a1a1a;
const FAINT = 0x4b4337;

const STAGE_WIDTH = 1600;
const STAGE_HEIGHT = 720;
const GROUND_Y = 520;

export interface StickVisualProviderOptions {
  stageWidth?: number;
  stageHeight?: number;
}

/**
 * Mathematical stick-figure presentation for Ridge.
 * Swap this class for a sprite-backed provider later without touching core.
 */
export class StickVisualProvider implements RidgeVisualProvider {
  private readonly scene: Phaser.Scene;
  private readonly stageWidth: number;
  private readonly stageHeight: number;
  private readonly root: Phaser.GameObjects.Container;
  private readonly background: Phaser.GameObjects.Graphics;
  private readonly actors: Phaser.GameObjects.Graphics;
  private readonly overlay: Phaser.GameObjects.Graphics;
  private promptText?: Phaser.GameObjects.Text;
  private destroyed = false;

  constructor(scene: Phaser.Scene, options: StickVisualProviderOptions = {}) {
    this.scene = scene;
    this.stageWidth = options.stageWidth ?? STAGE_WIDTH;
    this.stageHeight = options.stageHeight ?? STAGE_HEIGHT;

    this.background = scene.add.graphics();
    this.actors = scene.add.graphics();
    this.overlay = scene.add.graphics();
    this.root = scene.add.container(0, 0, [this.background, this.actors, this.overlay]);
    this.root.setDepth(10);

    this.promptText = scene.add
      .text(0, 0, '', {
        fontFamily: 'Caveat, Comic Neue, cursive',
        fontSize: '22px',
        color: '#1a1a1a',
        backgroundColor: '#fbfbf9cc',
        padding: { x: 10, y: 6 }
      })
      .setOrigin(0.5, 1)
      .setDepth(40)
      .setVisible(false);

    scene.cameras.main.setBounds(0, 0, this.stageWidth, this.stageHeight);
    scene.cameras.main.setBackgroundColor(PAPER);
  }

  get bounds(): { width: number; height: number; groundY: number } {
    return {
      width: this.stageWidth,
      height: this.stageHeight,
      groundY: GROUND_Y
    };
  }

  worldXForProgress(progress: number): number {
    return 80 + progress * (this.stageWidth - 160);
  }

  sync(view: RidgeVisualViewModel): void {
    if (this.destroyed) return;

    this.drawBackground(view.bridgeOpen);
    this.actors.clear();

    for (const actor of view.actors) {
      if (!actor.visible) continue;
      const x = this.worldXForProgress(actor.progress);
      const y = GROUND_Y;
      switch (actor.id) {
        case 'player':
          drawStickPlayer(this.actors, x, y, actor.facing, 1.15);
          break;
        case 'cicka':
          drawStickCicka(this.actors, x, y, 1.1);
          break;
        case 'draftsperson':
          drawStickDraftsperson(this.actors, x, y, actor.facing, 1.05);
          break;
        case 'toy-car':
          drawStickToyCar(this.actors, x + 18, y + 4, 1.1);
          break;
      }
    }

    const player = view.actors.find((actor) => actor.id === 'player');
    if (player && this.promptText) {
      if (view.nearbyPrompt && view.mode === 'explore') {
        const x = this.worldXForProgress(player.progress);
        this.promptText
          .setText(`[E] ${view.nearbyPrompt}`)
          .setPosition(x, GROUND_Y - 110)
          .setVisible(true);
      } else {
        this.promptText.setVisible(false);
      }
      this.scene.cameras.main.centerOn(
        this.worldXForProgress(player.progress),
        GROUND_Y - 80
      );
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.root.destroy(true);
    this.promptText?.destroy();
    this.promptText = undefined;
  }

  private drawBackground(bridgeOpen: boolean): void {
    const g = this.background;
    g.clear();

    // paper wash
    g.fillStyle(PAPER, 1);
    g.fillRect(0, 0, this.stageWidth, this.stageHeight);

    // faint ruled lines
    g.lineStyle(1, FAINT, 0.08);
    for (let y = 40; y < this.stageHeight; y += 36) {
      g.lineBetween(0, y, this.stageWidth, y);
    }

    // sky hatch band
    g.lineStyle(1, INK, 0.12);
    for (let x = 0; x < this.stageWidth; x += 28) {
      g.lineBetween(x, 40, x + 18, 90);
    }

    // far hills
    g.lineStyle(2, INK, 0.35);
    g.beginPath();
    g.moveTo(0, 280);
    g.lineTo(220, 210);
    g.lineTo(480, 260);
    g.lineTo(760, 190);
    g.lineTo(1100, 250);
    g.lineTo(1400, 200);
    g.lineTo(this.stageWidth, 240);
    g.strokePath();

    // cornfield sticks (left)
    g.lineStyle(2, INK, 0.7);
    for (let i = 0; i < 26; i += 1) {
      const x = 90 + i * 18;
      const h = 55 + ((i * 17) % 35);
      g.lineBetween(x, GROUND_Y, x, GROUND_Y - h);
      g.lineBetween(x, GROUND_Y - h, x + 8, GROUND_Y - h - 10);
      g.lineBetween(x, GROUND_Y - h, x - 7, GROUND_Y - h - 8);
    }

    // river
    const riverLeft = this.worldXForProgress(0.58);
    const riverRight = this.worldXForProgress(0.78);
    g.lineStyle(2, INK, 0.45);
    for (let y = GROUND_Y + 8; y < GROUND_Y + 70; y += 10) {
      g.beginPath();
      g.moveTo(riverLeft, y);
      for (let x = riverLeft; x <= riverRight; x += 24) {
        g.lineTo(x + 12, y + ((x / 24) % 2 === 0 ? 3 : -3));
      }
      g.strokePath();
    }

    // banks
    g.lineStyle(3, INK, 1);
    g.lineBetween(0, GROUND_Y, riverLeft, GROUND_Y);
    g.lineBetween(riverRight, GROUND_Y, this.stageWidth, GROUND_Y);
    g.lineBetween(riverLeft, GROUND_Y, riverLeft, GROUND_Y + 64);
    g.lineBetween(riverRight, GROUND_Y, riverRight, GROUND_Y + 64);

    // bridge
    g.lineStyle(4, INK, 1);
    if (bridgeOpen) {
      g.lineBetween(riverLeft, GROUND_Y - 4, riverRight, GROUND_Y - 4);
      g.lineBetween(riverLeft + 20, GROUND_Y - 4, riverLeft + 40, GROUND_Y - 28);
      g.lineBetween(riverRight - 20, GROUND_Y - 4, riverRight - 40, GROUND_Y - 28);
      g.lineBetween(riverLeft + 40, GROUND_Y - 28, riverRight - 40, GROUND_Y - 28);
    } else {
      // unfinished: gap in the middle with dashed intent
      const mid = (riverLeft + riverRight) / 2;
      g.lineBetween(riverLeft, GROUND_Y - 4, mid - 36, GROUND_Y - 4);
      g.lineBetween(mid + 36, GROUND_Y - 4, riverRight, GROUND_Y - 4);
      g.lineStyle(2, INK, 0.4);
      g.lineBetween(mid - 30, GROUND_Y - 18, mid + 30, GROUND_Y - 18);
      // blueprint board
      g.lineStyle(2, INK, 0.9);
      g.strokeRect(mid - 42, GROUND_Y - 90, 84, 50);
      g.lineBetween(mid - 28, GROUND_Y - 65, mid - 8, GROUND_Y - 65);
      g.lineBetween(mid + 8, GROUND_Y - 65, mid + 28, GROUND_Y - 65);
    }

    // sun scribble
    g.lineStyle(2, INK, 0.5);
    g.strokeCircle(140, 110, 28);
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI * 2 * i) / 8;
      g.lineBetween(
        140 + Math.cos(a) * 34,
        110 + Math.sin(a) * 34,
        140 + Math.cos(a) * 48,
        110 + Math.sin(a) * 48
      );
    }
  }
}
