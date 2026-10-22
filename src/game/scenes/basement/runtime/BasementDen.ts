/**
 * BasementDen — draws the Developer Basement as a cozy, slightly messy dev den.
 * Dark and scribbly until the glasses are picked up; then the bulb comes on
 * and the line work firms up. Positions come from core basement spots.
 */
import * as Phaser from 'phaser';
import { getBasementSpot } from '@/game/core/console/content/basementSpots';
import { CIRCUIT_PART_IDS, type CircuitPartId } from '@/game/core/console/content/circuitParts';
import { getMessages } from '@/shared/i18n';
import { GAME_DESIGN_HEIGHT, GAME_DESIGN_WIDTH } from '@/game/sharedSceneRuntime/config';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';

const BG = 0x151515;
const FLOOR = 0x202020;
const CHALK = 0xfbfbf9;
const PHOSPHOR = 0x66ff99;
const FLOOR_Y = 500;
const BULB_X = 520;
const BULB_Y = 150;
const CODE_ROWS = 5;
const MOTE_COUNT = 10;

export interface BasementDenState {
  lit: boolean;
  ownedItemIds: readonly string[];
}

export class BasementDen {
  private readonly scene: Phaser.Scene;
  private readonly lightCone: Phaser.GameObjects.Graphics;
  private readonly bulb: Phaser.GameObjects.Graphics;
  private readonly screen: Phaser.GameObjects.Graphics;
  private readonly steam: Phaser.GameObjects.Graphics;
  private readonly blueprint: Phaser.GameObjects.Graphics;
  private readonly benchBoard: Phaser.GameObjects.Graphics;
  private readonly glassesStand: Phaser.GameObjects.Container;
  private readonly glassesLabel: Phaser.GameObjects.Text;
  private readonly motes: Phaser.GameObjects.Arc[] = [];
  private readonly dimmable: Phaser.GameObjects.Graphics[] = [];
  private readonly noteCards: Phaser.GameObjects.Rectangle[] = [];
  private lastTick = -1;
  private lastLit: boolean | null = null;
  private lastPartsMask = -1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    scene.cameras.main.setBackgroundColor('#151515');
    this.drawShell();
    this.lightCone = scene.add.graphics().setDepth(1);
    this.drawLadder();
    this.drawCorkboard();
    this.drawDesk();
    this.screen = scene.add.graphics().setDepth(4);
    this.steam = scene.add.graphics().setDepth(4);
    this.bulb = scene.add.graphics().setDepth(6);
    this.glassesStand = this.drawGlassesStand();
    this.glassesLabel = this.addLabel(getBasementSpot('glasses').x, FLOOR_Y + 30, getMessages().scenes.basement.glasses, '#66ff99');
    this.blueprint = scene.add.graphics().setDepth(3);
    this.benchBoard = scene.add.graphics().setDepth(5);
    this.drawWorkbench();
    this.drawShelf();
    this.createMotes();

    createUiText(scene, GAME_DESIGN_WIDTH / 2, 34, getMessages().scenes.basement.title, {
      fontSize: '24px',
      color: '#66ff99',
      fontStyle: 'bold'
    })
      .setOrigin(0.5)
      .setDepth(20);
  }

  update(state: BasementDenState, tick: number, motion: boolean): void {
    if (state.lit !== this.lastLit) this.applyLit(state.lit);
    this.applyParts(state.ownedItemIds);
    this.glassesStand.setVisible(!state.ownedItemIds.includes('glasses'));
    this.glassesLabel.setVisible(!state.ownedItemIds.includes('glasses'));
    if (tick === this.lastTick) return;
    this.lastTick = tick;
    const frame = motion ? tick : 0;
    this.drawScreen(frame, state.lit);
    this.drawBulb(frame, state.lit);
    this.drawSteam(frame, motion);
    this.glassesStand.setY(getBasementSpot('glasses').y - (motion && frame % 4 < 2 ? 4 : 0));
    this.updateMotes(frame, motion && state.lit);
  }

  /** Flip the card that was just read so repeat reads feel like browsing the board. */
  markNoteRead(variant: number): void {
    this.noteCards.forEach((card, index) => card.setFillStyle(CHALK, index === variant % this.noteCards.length ? 1 : 0.82));
  }

  /** Little sparkle burst when the Circuit is soldered. */
  celebrateSolder(): void {
    const { x } = getBasementSpot('workbench');
    for (let i = 0; i < 8; i += 1) {
      const spark = createUiText(this.scene, x, FLOOR_Y - 92, i % 2 === 0 ? '*' : '+', {
        fontSize: '18px',
        color: '#66ff99'
      })
        .setOrigin(0.5)
        .setDepth(30);
      const angle = (Math.PI * 2 * i) / 8;
      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 60,
        y: FLOOR_Y - 92 + Math.sin(angle) * 40,
        alpha: 0,
        duration: 700,
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy()
      });
    }
  }

  private applyLit(lit: boolean): void {
    this.lastLit = lit;
    for (const g of this.dimmable) g.setAlpha(lit ? 1 : 0.45);
    this.lightCone.clear();
    if (!lit) return;
    this.lightCone.fillStyle(CHALK, 0.045);
    this.lightCone.fillTriangle(BULB_X, BULB_Y + 10, BULB_X - 260, FLOOR_Y, BULB_X + 260, FLOOR_Y);
    this.lightCone.lineStyle(1, CHALK, 0.08);
    for (let i = -6; i <= 6; i += 1) {
      this.lightCone.lineBetween(BULB_X + i * 3, BULB_Y + 14, BULB_X + i * 40, FLOOR_Y);
    }
  }

  private applyParts(ownedItemIds: readonly string[]): void {
    let mask = ownedItemIds.includes('circuit') ? 1 : 0;
    for (let i = 0; i < CIRCUIT_PART_IDS.length; i += 1) {
      if (ownedItemIds.includes(CIRCUIT_PART_IDS[i])) mask |= 2 << i;
    }
    if (mask === this.lastPartsMask) return;
    this.lastPartsMask = mask;
    this.drawBlueprint(ownedItemIds);
  }

  private dimmableGraphics(depth: number): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics().setDepth(depth);
    this.dimmable.push(g);
    return g;
  }

  private addLabel(x: number, y: number, text: string, color = '#fbfbf9'): Phaser.GameObjects.Text {
    return createUiText(this.scene, x, y, text, {
      fontSize: '14px',
      color,
      fontStyle: 'bold'
    })
      .setOrigin(0.5)
      .setDepth(8);
  }

  private drawShell(): void {
    const g = this.scene.add.graphics().setDepth(0);
    g.fillStyle(BG, 1);
    g.fillRect(0, 0, GAME_DESIGN_WIDTH, GAME_DESIGN_HEIGHT);
    g.fillStyle(FLOOR, 1);
    g.fillRect(0, FLOOR_Y, GAME_DESIGN_WIDTH, GAME_DESIGN_HEIGHT - FLOOR_Y);

    const bricks = this.dimmableGraphics(0);
    bricks.lineStyle(1, CHALK, 0.07);
    for (let row = 0; row * 26 + 70 < FLOOR_Y; row += 1) {
      const y = 70 + row * 26;
      bricks.lineBetween(0, y, GAME_DESIGN_WIDTH, y);
      for (let x = (row % 2) * 40; x < GAME_DESIGN_WIDTH; x += 80) {
        bricks.lineBetween(x, y, x, y + 26);
      }
    }
    // Pipes along the ceiling.
    bricks.lineStyle(6, CHALK, 0.18);
    bricks.lineBetween(0, 64, GAME_DESIGN_WIDTH, 64);
    bricks.lineStyle(2, CHALK, 0.3);
    for (let x = 140; x < GAME_DESIGN_WIDTH; x += 220) bricks.strokeRect(x, 58, 10, 12);

    const floor = this.dimmableGraphics(1);
    floor.lineStyle(3, CHALK, 0.7);
    floor.lineBetween(0, FLOOR_Y, GAME_DESIGN_WIDTH, FLOOR_Y);
    floor.lineStyle(1, CHALK, 0.12);
    for (let x = -40; x < GAME_DESIGN_WIDTH; x += 60) floor.lineBetween(x, FLOOR_Y + 4, x + 40, GAME_DESIGN_HEIGHT);
    // Rug under the desk.
    floor.lineStyle(2, CHALK, 0.35);
    floor.strokeEllipse(430, FLOOR_Y + 30, 260, 34);
    floor.strokeEllipse(430, FLOOR_Y + 30, 220, 22);
  }

  private drawLadder(): void {
    const { x } = getBasementSpot('exit');
    const g = this.dimmableGraphics(2);
    // Square of street daylight at the top.
    g.fillStyle(CHALK, 0.9);
    g.fillRect(x - 34, 0, 68, 22);
    g.lineStyle(1, CHALK, 0.12);
    for (let i = -3; i <= 3; i += 1) g.lineBetween(x + i * 10, 22, x + i * 16, 160);
    g.lineStyle(4, CHALK, 0.85);
    g.lineBetween(x - 18, 22, x - 18, FLOOR_Y);
    g.lineBetween(x + 18, 22, x + 18, FLOOR_Y);
    for (let y = 50; y < FLOOR_Y; y += 30) g.lineBetween(x - 18, y, x + 18, y);
    this.addLabel(x, FLOOR_Y - 172, getMessages().scenes.basement.ladderUp).setBackgroundColor('#1a1a1a');
  }

  private drawCorkboard(): void {
    const { x } = getBasementSpot('corkboard');
    const top = 270;
    const g = this.dimmableGraphics(2);
    g.fillStyle(0x2a2a2a, 1);
    g.fillRect(x - 64, top, 128, 92);
    g.lineStyle(3, CHALK, 0.85);
    g.strokeRect(x - 64, top, 128, 92);
    g.fillStyle(CHALK, 0.08);
    for (let i = 0; i < 40; i += 1) g.fillRect(x - 60 + ((i * 37) % 120), top + 4 + ((i * 23) % 84), 2, 2);
    const cards = [
      { dx: -38, dy: 24, r: -0.12 },
      { dx: 0, dy: 20, r: 0.08 },
      { dx: 38, dy: 26, r: -0.05 },
      { dx: -20, dy: 62, r: 0.1 },
      { dx: 26, dy: 64, r: -0.1 }
    ];
    for (const card of cards) {
      const rect = this.scene.add
        .rectangle(x + card.dx, top + card.dy, 30, 24, CHALK, 0.82)
        .setRotation(card.r)
        .setDepth(3);
      this.noteCards.push(rect);
      g.fillStyle(PHOSPHOR, 0.9);
      g.fillCircle(x + card.dx, top + card.dy - 10, 2.5);
    }
    g.lineStyle(1, PHOSPHOR, 0.5);
    g.lineBetween(x - 38, top + 24, x + 26, top + 64);
    this.addLabel(x, top - 14, getMessages().scenes.basement.corkboard);
  }

  private drawDesk(): void {
    const { x, y } = getBasementSpot('computer');
    const g = this.dimmableGraphics(3);
    // Desk top + legs.
    g.fillStyle(0x101010, 1);
    g.fillRect(x - 110, y + 46, 220, 14);
    g.lineStyle(3, CHALK, 0.8);
    g.strokeRect(x - 110, y + 46, 220, 14);
    g.lineBetween(x - 100, y + 60, x - 100, FLOOR_Y);
    g.lineBetween(x + 100, y + 60, x + 100, FLOOR_Y);
    // Monitor frame + stand.
    g.fillStyle(0x0b0b0b, 1);
    g.fillRect(x - 56, y - 46, 112, 76);
    g.lineStyle(4, PHOSPHOR, 0.92);
    g.strokeRect(x - 56, y - 46, 112, 76);
    g.lineStyle(3, CHALK, 0.7);
    g.lineBetween(x, y + 30, x, y + 46);
    // Keyboard.
    g.fillStyle(CHALK, 0.85);
    g.fillRect(x - 46, y + 38, 70, 7);
    // Rubber duck (debugging partner).
    const duckX = x + 72;
    const duckY = y + 34;
    g.lineStyle(2, CHALK, 0.95);
    g.strokeEllipse(duckX, duckY, 26, 16);
    g.strokeCircle(duckX + 9, duckY - 12, 7);
    g.fillStyle(CHALK, 1);
    g.fillTriangle(duckX + 15, duckY - 13, duckX + 22, duckY - 10, duckX + 15, duckY - 9);
    g.fillCircle(duckX + 10, duckY - 14, 1.5);
    // Coffee mug.
    const mugX = x - 82;
    g.lineStyle(2, CHALK, 0.9);
    g.strokeRect(mugX - 8, y + 28, 16, 18);
    g.strokeCircle(mugX + 11, y + 37, 5);
    // Cable to the floor.
    g.lineStyle(2, PHOSPHOR, 0.3);
    g.beginPath();
    g.moveTo(x + 56, y + 20);
    g.lineTo(x + 84, y + 54);
    g.lineTo(x + 70, FLOOR_Y);
    g.strokePath();
  }

  private drawScreen(frame: number, lit: boolean): void {
    const { x, y } = getBasementSpot('computer');
    const g = this.screen;
    g.clear();
    g.fillStyle(PHOSPHOR, lit ? 0.12 : 0.05);
    g.fillRect(x - 49, y - 39, 98, 62);
    g.lineStyle(2, PHOSPHOR, lit ? 0.7 : 0.3);
    for (let i = 0; i < CODE_ROWS; i += 1) {
      const row = (i + frame) % 9;
      const indent = (row % 3) * 8;
      const length = 18 + ((row * 13) % 44);
      const lineY = y - 30 + i * 11;
      g.lineBetween(x - 40 + indent, lineY, x - 40 + indent + length, lineY);
    }
    if (frame % 2 === 0) {
      g.fillStyle(PHOSPHOR, 0.9);
      g.fillRect(x - 40, y - 30 + CODE_ROWS * 11 - 4, 7, 8);
    }
  }

  private drawSteam(frame: number, motion: boolean): void {
    const { x, y } = getBasementSpot('computer');
    const mugX = x - 82;
    const g = this.steam;
    g.clear();
    g.lineStyle(1.5, CHALK, 0.45);
    const sway = motion ? (frame % 3) - 1 : 0;
    for (let i = 0; i < 2; i += 1) {
      const sx = mugX - 3 + i * 6;
      g.beginPath();
      g.moveTo(sx, y + 24);
      g.lineTo(sx + 3 + sway, y + 16);
      g.lineTo(sx - 1 - sway, y + 8);
      g.lineTo(sx + 2, y);
      g.strokePath();
    }
  }

  private drawBulb(frame: number, lit: boolean): void {
    const g = this.bulb;
    g.clear();
    const swing = [0, 2, 3, 2, 0, -2, -3, -2][frame % 8];
    g.lineStyle(2, CHALK, 0.6);
    g.lineBetween(BULB_X, 64, BULB_X + swing, BULB_Y - 10);
    g.fillStyle(CHALK, lit ? 0.95 : 0.12);
    g.fillCircle(BULB_X + swing, BULB_Y, 10);
    g.lineStyle(2, CHALK, 0.9);
    g.strokeCircle(BULB_X + swing, BULB_Y, 10);
    g.strokeRect(BULB_X + swing - 5, BULB_Y - 16, 10, 6);
    this.lightCone.setX(swing * 2);
  }

  private drawGlassesStand(): Phaser.GameObjects.Container {
    const { x, y } = getBasementSpot('glasses');
    const plinth = this.dimmableGraphics(3);
    plinth.fillStyle(0x1d1d1d, 1);
    plinth.fillRect(x - 34, y + 20, 68, FLOOR_Y - y - 20);
    plinth.lineStyle(3, CHALK, 0.75);
    plinth.strokeRect(x - 34, y + 20, 68, FLOOR_Y - y - 20);
    plinth.lineStyle(1, CHALK, 0.25);
    for (let i = 0; i < 4; i += 1) plinth.lineBetween(x - 30, y + 34 + i * 12, x + 30, y + 28 + i * 12);

    const container = this.scene.add.container(x, y).setDepth(5);
    const glow = this.scene.add.ellipse(0, 0, 104, 56, PHOSPHOR, 0.08);
    const leftLens = this.scene.add.ellipse(-18, 0, 30, 24, CHALK, 0.08).setStrokeStyle(4, PHOSPHOR, 1);
    const rightLens = this.scene.add.ellipse(18, 0, 30, 24, CHALK, 0.08).setStrokeStyle(4, PHOSPHOR, 1);
    const bridge = this.scene.add.rectangle(0, 0, 12, 4, PHOSPHOR, 1);
    container.add([glow, leftLens, rightLens, bridge]);
    return container;
  }

  private drawWorkbench(): void {
    const { x } = getBasementSpot('workbench');
    const top = FLOOR_Y - 70;
    const g = this.dimmableGraphics(3);
    g.fillStyle(0x1b1b1b, 1);
    g.fillRect(x - 78, top, 156, 14);
    g.lineStyle(3, CHALK, 0.85);
    g.strokeRect(x - 78, top, 156, 14);
    g.lineBetween(x - 70, top + 14, x - 74, FLOOR_Y);
    g.lineBetween(x + 70, top + 14, x + 74, FLOOR_Y);
    g.lineBetween(x - 72, top + 50, x + 72, top + 50);
    // Vise.
    g.strokeRect(x - 70, top - 16, 22, 16);
    g.lineBetween(x - 59, top - 16, x - 59, top - 26);
    // Soldering iron on its stand.
    g.lineStyle(2, CHALK, 0.9);
    g.strokeCircle(x + 54, top - 10, 9);
    g.lineStyle(3, CHALK, 0.9);
    g.lineBetween(x + 30, top - 30, x + 62, top - 6);
    g.lineStyle(1.5, PHOSPHOR, 0.7);
    g.lineBetween(x + 30, top - 30, x + 24, top - 36);
    this.addLabel(x, FLOOR_Y - 236, getMessages().scenes.basement.workbench);
  }

  private drawBlueprint(ownedItemIds: readonly string[]): void {
    const { x } = getBasementSpot('workbench');
    const top = FLOOR_Y - 220;
    const hasCircuit = ownedItemIds.includes('circuit');
    const g = this.blueprint;
    g.clear();
    g.fillStyle(0x1f2a24, 1);
    g.fillRect(x - 70, top, 140, 96);
    g.lineStyle(2, PHOSPHOR, 0.8);
    g.strokeRect(x - 70, top, 140, 96);
    g.lineStyle(1, PHOSPHOR, 0.35);
    g.strokeRect(x - 30, top + 22, 60, 36);
    g.lineBetween(x - 30, top + 40, x - 56, top + 40);
    g.lineBetween(x + 30, top + 40, x + 56, top + 40);
    g.lineBetween(x, top + 58, x, top + 76);

    CIRCUIT_PART_IDS.forEach((partId, index) => {
      const slotX = x - 46 + index * 46;
      const owned = ownedItemIds.includes(partId);
      this.drawPartSlot(g, partId, slotX, top + 80, owned || hasCircuit);
    });

    this.benchBoard.clear();
    if (!hasCircuit) return;
    const boardY = FLOOR_Y - 82;
    this.benchBoard.fillStyle(0x0f2a1b, 1);
    this.benchBoard.fillRect(x - 22, boardY, 44, 12);
    this.benchBoard.lineStyle(2, PHOSPHOR, 1);
    this.benchBoard.strokeRect(x - 22, boardY, 44, 12);
    this.benchBoard.lineStyle(3, PHOSPHOR, 0.9);
    this.benchBoard.lineBetween(x - 70, top + 10, x + 70, top + 86);
  }

  private drawPartSlot(
    g: Phaser.GameObjects.Graphics,
    partId: CircuitPartId,
    slotX: number,
    slotY: number,
    filled: boolean
  ): void {
    g.lineStyle(2, PHOSPHOR, filled ? 1 : 0.35);
    g.strokeCircle(slotX, slotY, 9);
    if (!filled) return;
    g.fillStyle(PHOSPHOR, 0.9);
    if (partId === 'copper-string') {
      g.lineBetween(slotX - 6, slotY + 5, slotX + 6, slotY - 5);
    } else if (partId === 'clock-crystal') {
      g.fillTriangle(slotX, slotY - 6, slotX + 5, slotY, slotX - 5, slotY);
      g.fillTriangle(slotX, slotY + 6, slotX + 5, slotY, slotX - 5, slotY);
    } else {
      g.fillRect(slotX - 3, slotY - 6, 6, 12);
    }
  }

  private drawShelf(): void {
    const { x } = getBasementSpot('shelf');
    const g = this.dimmableGraphics(2);
    const left = x - 46;
    g.lineStyle(3, CHALK, 0.8);
    g.strokeRect(left, 230, 92, FLOOR_Y - 230);
    for (let y = 300; y < FLOOR_Y; y += 70) g.lineBetween(left, y, left + 92, y);
    // Boxes, a uc32 board, and a chess knight glued to a Tetris block.
    g.lineStyle(2, CHALK, 0.7);
    g.strokeRect(left + 8, 252, 30, 46);
    g.strokeRect(left + 44, 268, 38, 30);
    g.lineStyle(2, PHOSPHOR, 0.75);
    g.strokeRect(left + 10, 344, 42, 24);
    for (let i = 0; i < 5; i += 1) g.fillRect(left + 14 + i * 7, 346, 3, 4);
    g.lineStyle(2, CHALK, 0.8);
    g.strokeRect(left + 56, 352, 12, 16);
    g.strokeRect(left + 68, 352, 12, 16);
    g.strokeRect(left + 68, 340, 12, 12);
    g.strokeRect(left + 64, 420, 22, 18);
    g.strokeCircle(left + 75, 412, 7);
    g.strokeRect(left + 10, 410, 40, 28);
    g.lineBetween(left + 10, 420, left + 50, 420);
  }

  private createMotes(): void {
    for (let i = 0; i < MOTE_COUNT; i += 1) {
      this.motes.push(this.scene.add.circle(0, 0, 1.6, CHALK, 0.4).setDepth(7).setVisible(false));
    }
  }

  private updateMotes(frame: number, visible: boolean): void {
    for (let i = 0; i < this.motes.length; i += 1) {
      const mote = this.motes[i];
      mote.setVisible(visible);
      if (!visible) continue;
      const drift = (frame * 2 + i * 37) % 300;
      mote.setPosition(BULB_X - 200 + ((i * 47) % 400) + (drift % 20), BULB_Y + 40 + drift);
    }
  }
}
