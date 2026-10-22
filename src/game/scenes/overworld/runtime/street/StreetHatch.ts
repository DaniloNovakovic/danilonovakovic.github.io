/**
 * StreetHatch — the TODO? trapdoor into the Developer Basement.
 * Before the glasses it leaks scribbled "?" marks; afterwards it leaks code.
 * Gameplay (when to enter) stays in the Game Console; this only draws.
 */
import * as Phaser from 'phaser';
import { getMessages } from '@/shared/i18n';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';

const INK = 0x1a1a1a;
const PAPER = 0xfbfbf9;
const HOLE_W = 120;
const HOLE_H = 28;
const GLYPH_COUNT = 6;
const GLYPH_RISE_PX = 92;
const NEAR_PX = 150;
const BLURRY_GLYPHS = ['?', '?', '~', '?', '¿', '?'];
const CODE_GLYPHS = ['{', '}', ';', '</>', '01', '=>', '()', '//'];
const DROP_MS = 420;
const TAG_W = 86;
const TAG_H = 32;
/** Tag top edge, measured up from the hole center (keeps it clear of the interact prompt). */
const TAG_TOP = 122;

export interface StreetHatchState {
  hasGlasses: boolean;
  hasCircuit: boolean;
}

export class StreetHatch {
  private readonly scene: Phaser.Scene;
  private readonly x: number;
  private readonly y: number;
  private readonly lid: Phaser.GameObjects.Graphics;
  private readonly glyphs: Phaser.GameObjects.Text[] = [];
  private readonly glyphCycle: number[] = [];
  private readonly tagStrike: Phaser.GameObjects.Graphics;
  private readonly tagDone: Phaser.GameObjects.Text;
  private readonly beam: Phaser.GameObjects.Graphics;
  private codeMode: boolean | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.beam = scene.add.graphics().setDepth(4);
    this.drawHole();
    this.lid = scene.add.graphics({ x: x + HOLE_W / 2 - 14, y: y - 2 }).setDepth(6);
    this.drawLid();

    for (let i = 0; i < GLYPH_COUNT; i += 1) {
      this.glyphs.push(
        createUiText(scene, x, y, '?', { fontSize: '18px', color: '#1a1a1a', fontStyle: 'bold' })
          .setOrigin(0.5)
          .setDepth(5)
          .setVisible(false)
      );
      this.glyphCycle.push(-1);
    }

    const tagX = x - 68;
    const tagMidY = y - TAG_TOP + TAG_H / 2;
    this.drawTag(tagX);
    createUiText(scene, tagX, tagMidY, getMessages().scenes.overworld.basementHole, {
      fontSize: '18px',
      color: '#1a1a1a',
      fontStyle: 'bold'
    })
      .setOrigin(0.5)
      .setRotation(-0.05)
      .setDepth(7);
    this.tagStrike = scene.add.graphics().setDepth(8);
    this.tagStrike.lineStyle(3, INK, 0.9);
    this.tagStrike.lineBetween(tagX - 32, tagMidY + 3, tagX + 32, tagMidY - 4);
    this.tagDone = createUiText(scene, tagX + 30, y - TAG_TOP - 4, getMessages().scenes.overworld.hatchDone, {
      fontSize: '14px',
      color: '#1a1a1a',
      fontStyle: 'bold italic'
    })
      .setOrigin(0.5)
      .setRotation(0.12)
      .setDepth(8);
  }

  update(state: StreetHatchState, playerX: number, tick: number, motion: boolean): void {
    if (this.codeMode !== state.hasGlasses) {
      this.codeMode = state.hasGlasses;
      this.glyphCycle.fill(-1);
      this.tagStrike.setVisible(state.hasGlasses);
      this.tagDone.setVisible(state.hasGlasses);
      this.drawBeam(state.hasGlasses);
    }

    const near = Math.abs(playerX - this.x) < NEAR_PX;
    this.lid.setRotation(0.12 + (near && motion ? (tick % 2 === 0 ? 0.06 : -0.03) : 0));
    this.updateGlyphs(tick, near ? GLYPH_COUNT : 3, motion);
  }

  /** Squash-and-drop the player into the hole, then hand off to the basement. */
  dropIn(player: Phaser.GameObjects.Sprite, motion: boolean, onDone: () => void): void {
    if (!motion) {
      onDone();
      return;
    }
    const body = player.body as Phaser.Physics.Arcade.Body | null;
    body?.setVelocity(0, 0);
    body?.setAllowGravity(false);
    if (body) body.enable = false;
    this.scene.tweens.add({
      targets: player,
      x: this.x,
      y: this.y - 20,
      scaleY: 0.8,
      scaleX: 1.15,
      duration: DROP_MS * 0.35,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: player,
          y: this.y + 40,
          scaleX: 0.7,
          scaleY: 1.2,
          alpha: 0,
          duration: DROP_MS * 0.65,
          ease: 'Quad.easeIn',
          onComplete: onDone
        });
      }
    });
  }

  private updateGlyphs(tick: number, activeCount: number, motion: boolean): void {
    const pool = this.codeMode ? CODE_GLYPHS : BLURRY_GLYPHS;
    for (let i = 0; i < this.glyphs.length; i += 1) {
      const glyph = this.glyphs[i];
      if (i >= activeCount || !motion) {
        glyph.setVisible(!motion && i < 2);
        if (!motion) glyph.setPosition(this.x - 20 + i * 40, this.y - 40).setAlpha(0.6);
        continue;
      }
      const travel = tick * 6 + i * 31;
      const cycle = Math.floor(travel / GLYPH_RISE_PX);
      const progress = (travel % GLYPH_RISE_PX) / GLYPH_RISE_PX;
      if (this.glyphCycle[i] !== cycle) {
        this.glyphCycle[i] = cycle;
        glyph.setText(pool[(cycle + i * 3) % pool.length]);
      }
      const sway = ((cycle + i) % 3 - 1) * 10 * progress;
      glyph
        .setPosition(this.x - 36 + ((i * 29) % 72) + sway, this.y - 6 - progress * GLYPH_RISE_PX)
        .setAlpha(0.85 * (1 - progress))
        .setVisible(true);
    }
  }

  private drawHole(): void {
    const g = this.scene.add.graphics().setDepth(5);
    g.fillStyle(INK, 0.94);
    g.fillEllipse(this.x, this.y, HOLE_W, HOLE_H);
    g.lineStyle(3, INK, 1);
    g.strokeEllipse(this.x, this.y - 2, HOLE_W + 2, HOLE_H + 2);
    g.lineStyle(2, PAPER, 0.3);
    for (let offset = -42; offset <= 42; offset += 14) {
      g.lineBetween(this.x + offset, this.y - 8, this.x + offset + 8, this.y + 7);
    }
    // Ladder rails peeking out of the hole.
    g.lineStyle(3, PAPER, 0.75);
    g.lineBetween(this.x - 14, this.y + 10, this.x - 10, this.y - 16);
    g.lineBetween(this.x + 14, this.y + 10, this.x + 10, this.y - 16);
    g.lineStyle(2, PAPER, 0.6);
    g.lineBetween(this.x - 12, this.y - 4, this.x + 12, this.y - 4);
    g.lineBetween(this.x - 11, this.y - 12, this.x + 11, this.y - 12);
  }

  /** Trapdoor lid propped open on its hinge, seen at an angle: a plank panel with a ring pull. */
  private drawLid(): void {
    const g = this.lid;
    const corners: [number, number][] = [
      [0, 0],
      [30, -6],
      [34, -58],
      [4, -52]
    ];
    const points = corners.map(([px, py]) => new Phaser.Math.Vector2(px, py));
    const shadow = corners.map(([px, py]) => new Phaser.Math.Vector2(px + 4, py + 3));
    g.fillStyle(INK, 1);
    g.fillPoints(shadow, true);
    g.fillStyle(PAPER, 1);
    g.fillPoints(points, true);
    g.lineStyle(3, INK, 1);
    g.strokePoints(points, true);
    g.lineStyle(1.5, INK, 0.6);
    g.lineBetween(10, -2, 13, -54);
    g.lineBetween(20, -4, 23, -56);
    g.lineStyle(2, INK, 0.9);
    g.strokeCircle(18, -30, 5);
  }

  private drawTag(tagX: number): void {
    const g = this.scene.add.graphics().setDepth(6);
    g.lineStyle(3, INK, 1);
    g.lineBetween(tagX, this.y - TAG_TOP + TAG_H, tagX + 2, this.y + 8);
    g.fillStyle(INK, 1);
    g.fillRect(tagX - TAG_W / 2 + 4, this.y - TAG_TOP + 4, TAG_W, TAG_H);
    g.fillStyle(PAPER, 1);
    g.fillRect(tagX - TAG_W / 2, this.y - TAG_TOP, TAG_W, TAG_H);
    g.lineStyle(2, INK, 1);
    g.strokeRect(tagX - TAG_W / 2, this.y - TAG_TOP, TAG_W, TAG_H);
  }

  private drawBeam(lit: boolean): void {
    const g = this.beam;
    g.clear();
    if (!lit) return;
    g.lineStyle(1.5, INK, 0.16);
    for (let i = -4; i <= 4; i += 1) {
      g.lineBetween(this.x + i * 9, this.y - 6, this.x + i * 20, this.y - 120);
    }
  }
}
