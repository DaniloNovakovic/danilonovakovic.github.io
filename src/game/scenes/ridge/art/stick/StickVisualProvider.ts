// Stick sync redraws many actors/layers each frame; branching is presentation policy.
// fallow-ignore-file complexity
import type * as Phaser from 'phaser';
import type { RidgeAreaId } from '@/game/core/ridge';
import type { RidgeVisualProvider, RidgeVisualViewModel } from '../types';
import {
  drawStickCicka,
  drawStickCrowd,
  drawStickDanceTeacher,
  drawStickDraftsperson,
  drawStickDriver,
  drawStickGuitar,
  drawStickGuitarist,
  drawStickOperationsHelper,
  drawStickPlayer,
  drawStickShuttle,
  drawStickSteward,
  drawStickToyCar,
  drawStickTraveler
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
  private readonly nameLabels = new Map<string, Phaser.GameObjects.Text>();
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

  worldXForProgress(progress: number): number {
    return 80 + progress * (this.stageWidth - 160);
  }

  sync(view: RidgeVisualViewModel): void {
    if (this.destroyed) return;

    this.drawBackground(view.areaId, view.crossingOpen, view.beat);
    this.actors.clear();

    const visibleIds = new Set<string>();
    for (const actor of view.actors) {
      if (!actor.visible) continue;
      visibleIds.add(actor.id);
      const x = this.worldXForProgress(actor.progress);
      const y = GROUND_Y;
      switch (actor.id) {
        case 'player':
          drawStickPlayer(this.actors, x, y, actor.facing, 1.15);
          break;
        case 'cicka':
        case 'counterpart-cat':
          drawStickCicka(this.actors, x, y, actor.id === 'counterpart-cat' ? 0.95 : 1.1);
          break;
        case 'draftsperson':
          drawStickDraftsperson(this.actors, x, y, actor.facing, 1.05);
          break;
        case 'toy-car':
          drawStickToyCar(this.actors, x + 18, y + 4, 1.1);
          break;
        case 'guitarist':
          drawStickGuitarist(this.actors, x, y, actor.facing, 1.05);
          break;
        case 'crowd':
          drawStickCrowd(this.actors, x, y, 1);
          break;
        case 'guitar':
          drawStickGuitar(this.actors, x + 16, y + 2, 1.1);
          break;
        case 'traveler':
          drawStickTraveler(this.actors, x, y, actor.facing, 1);
          break;
        case 'driver':
          drawStickDriver(this.actors, x, y, actor.facing, 1.05);
          break;
        case 'operations-helper':
          drawStickOperationsHelper(this.actors, x, y, actor.facing, 1.05);
          break;
        case 'dance-teacher':
          drawStickDanceTeacher(this.actors, x, y, actor.facing, 1.05);
          break;
        case 'steward':
          drawStickSteward(this.actors, x, y, actor.facing, 1);
          break;
        case 'shuttle':
          drawStickShuttle(this.actors, x, y, 1.1);
          break;
      }

      if (actor.id !== 'player' && actor.id !== 'toy-car' && actor.id !== 'guitar') {
        this.syncNameLabel(actor.id, actor.label, x, y);
      }
    }

    for (const [id, label] of this.nameLabels) {
      if (!visibleIds.has(id)) label.setVisible(false);
    }

    const player = view.actors.find((actor) => actor.id === 'player');
    if (player && this.promptText) {
      if (view.nearbyPrompt && view.mode === 'explore') {
        const x = this.worldXForProgress(player.progress);
        this.promptText
          .setText(`[E] ${view.nearbyPrompt}`)
          .setPosition(x, GROUND_Y - 130)
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
    for (const label of this.nameLabels.values()) label.destroy();
    this.nameLabels.clear();
  }

  private syncNameLabel(id: string, text: string, x: number, y: number): void {
    let label = this.nameLabels.get(id);
    if (!label) {
      label = this.scene.add
        .text(0, 0, text, {
          fontFamily: 'Caveat, Comic Neue, cursive',
          fontSize: '16px',
          color: '#1a1a1a',
          backgroundColor: '#fbfbf9aa',
          padding: { x: 4, y: 1 }
        })
        .setOrigin(0.5, 1)
        .setDepth(35);
      this.nameLabels.set(id, label);
    }
    label.setText(text).setPosition(x, y - 78).setVisible(true);
  }

  private drawBackground(
    areaId: RidgeAreaId,
    crossingOpen: boolean,
    beat: RidgeVisualViewModel['beat']
  ): void {
    const g = this.background;
    g.clear();
    g.fillStyle(PAPER, 1);
    g.fillRect(0, 0, this.stageWidth, this.stageHeight);

    g.lineStyle(1, FAINT, 0.08);
    for (let y = 40; y < this.stageHeight; y += 36) {
      g.lineBetween(0, y, this.stageWidth, y);
    }

    g.lineStyle(3, INK, 1);
    g.lineBetween(0, GROUND_Y, this.stageWidth, GROUND_Y);

    if (areaId === 'bridge') {
      this.drawBridgeSet(g, crossingOpen);
    } else if (areaId === 'concert') {
      this.drawConcertSet(g, crossingOpen);
    } else if (areaId === 'danceFestival') {
      this.drawDanceSet(g, crossingOpen);
    } else {
      this.drawRelaySet(g, beat);
    }
  }

  private drawBridgeSet(g: Phaser.GameObjects.Graphics, bridgeOpen: boolean): void {
    g.lineStyle(1, INK, 0.12);
    for (let x = 0; x < this.stageWidth; x += 28) {
      g.lineBetween(x, 40, x + 18, 90);
    }
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

    g.lineStyle(2, INK, 0.7);
    for (let i = 0; i < 26; i += 1) {
      const x = 90 + i * 18;
      const h = 55 + ((i * 17) % 35);
      g.lineBetween(x, GROUND_Y, x, GROUND_Y - h);
      g.lineBetween(x, GROUND_Y - h, x + 8, GROUND_Y - h - 10);
    }

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

    g.lineStyle(4, INK, 1);
    if (bridgeOpen) {
      g.lineBetween(riverLeft, GROUND_Y - 4, riverRight, GROUND_Y - 4);
    } else {
      const mid = (riverLeft + riverRight) / 2;
      g.lineBetween(riverLeft, GROUND_Y - 4, mid - 36, GROUND_Y - 4);
      g.lineBetween(mid + 36, GROUND_Y - 4, riverRight, GROUND_Y - 4);
      g.lineStyle(2, INK, 0.4);
      g.lineBetween(mid - 30, GROUND_Y - 18, mid + 30, GROUND_Y - 18);
      g.strokeRect(mid - 42, GROUND_Y - 90, 84, 50);
    }

    g.lineStyle(2, INK, 0.5);
    g.strokeCircle(140, 110, 28);
  }

  private drawConcertSet(g: Phaser.GameObjects.Graphics, crossingOpen: boolean): void {
    // night wash hatch
    g.lineStyle(1, INK, 0.18);
    for (let x = 0; x < this.stageWidth; x += 22) {
      g.lineBetween(x, 20, x + 10, 120);
    }
    // storefronts
    g.lineStyle(2.5, INK, 0.85);
    for (let i = 0; i < 6; i += 1) {
      const x = 120 + i * 220;
      g.strokeRect(x, GROUND_Y - 160, 140, 160);
      g.strokeRect(x + 20, GROUND_Y - 100, 40, 50);
      g.strokeRect(x + 80, GROUND_Y - 100, 40, 50);
    }
    // crossing / crowd lane mark
    const gate = this.worldXForProgress(0.55);
    g.lineStyle(3, INK, crossingOpen ? 0.25 : 0.9);
    g.lineBetween(gate, GROUND_Y - 8, gate, GROUND_Y - 70);
    if (!crossingOpen) {
      g.lineBetween(gate - 40, GROUND_Y - 40, gate + 40, GROUND_Y - 40);
    }
    // moon
    g.lineStyle(2, INK, 0.55);
    g.strokeCircle(this.stageWidth - 160, 100, 26);
  }

  private drawDanceSet(g: Phaser.GameObjects.Graphics, crossingOpen: boolean): void {
    // daytime warm hatch
    g.lineStyle(1, INK, 0.1);
    for (let x = 0; x < this.stageWidth; x += 30) {
      g.lineBetween(x, 30, x + 16, 100);
    }
    // lantern posts
    g.lineStyle(2, INK, 0.8);
    for (let i = 0; i < 8; i += 1) {
      const x = 160 + i * 170;
      g.lineBetween(x, GROUND_Y, x, GROUND_Y - 90);
      g.strokeRect(x - 8, GROUND_Y - 110, 16, 20);
    }
    // service gate (matches soft-wall progress)
    const gate = this.worldXForProgress(0.68);
    g.lineStyle(3, INK, crossingOpen ? 0.25 : 1);
    g.strokeRect(gate - 36, GROUND_Y - 90, 72, 90);
    g.lineStyle(2, INK, crossingOpen ? 0.2 : 0.7);
    g.lineBetween(gate - 20, GROUND_Y - 70, gate + 20, GROUND_Y - 70);
    g.lineBetween(gate - 20, GROUND_Y - 50, gate + 20, GROUND_Y - 50);
    if (crossingOpen) {
      g.lineStyle(2, INK, 0.4);
      g.lineBetween(gate + 36, GROUND_Y - 90, gate + 80, GROUND_Y - 40);
    }
    // dance floor edge near teacher
    g.lineStyle(2, INK, 0.35);
    g.strokeEllipse(this.worldXForProgress(0.4), GROUND_Y - 20, 100, 28);
  }

  private drawRelaySet(
    g: Phaser.GameObjects.Graphics,
    beat: RidgeVisualViewModel['beat']
  ): void {
    // sunset arcs
    g.lineStyle(2, INK, 0.35);
    for (let i = 0; i < 5; i += 1) {
      g.strokeCircle(this.stageWidth * 0.7, 180, 40 + i * 28);
    }
    // overlook ledge
    g.lineStyle(3, INK, 1);
    g.lineBetween(this.worldXForProgress(0.15), GROUND_Y, this.worldXForProgress(0.9), GROUND_Y);
    g.lineBetween(
      this.worldXForProgress(0.85),
      GROUND_Y,
      this.worldXForProgress(0.95),
      GROUND_Y + 40
    );
    // warm threshold seam
    const tx = this.worldXForProgress(0.85);
    g.lineStyle(2, INK, beat === 'relay_complete' ? 0.2 : 0.7);
    g.strokeCircle(tx, GROUND_Y - 70, 34);
    g.lineBetween(tx - 20, GROUND_Y - 70, tx + 20, GROUND_Y - 70);
  }
}
