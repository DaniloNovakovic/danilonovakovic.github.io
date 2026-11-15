import type * as Phaser from 'phaser';
import type { CickaStrikeResult } from '@/game/core/ridge';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import { DUEL_TARGET_RADIUS, type DuelFrame } from '../art/duelStaging';
import { headTopFor } from '../art/stick/actorSprites';
import { DEPTH, GROUND_Y, INK, INK_CSS, PAPER_CSS } from '../art/stick/palette';

/** Frames a landing word and its marks stay on the page. */
const MARK_FRAMES = 34;
const DASHES = 20;

/** Words penciled beside the player when a paw lands. */
const RESULT_WORD: Record<CickaStrikeResult, string> = {
  perfect: 'whiff!',
  dodged: 'close!',
  hit: 'thwap!',
  feinted: 'fake!'
};

export interface DuelAnchors {
  playerX: number;
  cickaX: number;
}

/**
 * Ink marks over Cicka's Standoff: the closing ring that times each dodge,
 * claw scratches where a paw lands, and a penciled word for how it went.
 * Bodies move through the stick figures; this only draws on top of them.
 */
export class CickaDuelView {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly word: Phaser.GameObjects.Text;
  private wordKey = '';

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(DEPTH.presence - 1);
    this.word = createUiText(scene, 0, 0, '', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: INK_CSS,
      stroke: PAPER_CSS,
      strokeThickness: 4
    })
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.presence)
      .setVisible(false);
  }

  sync(frame: DuelFrame, anchors: DuelAnchors): void {
    const g = this.graphics;
    g.clear();
    // Around the head and shoulders, where the paw is aimed.
    const chestY = GROUND_Y + headTopFor('player') * 0.55;

    if (frame.ring) this.drawRing(frame.ring, anchors.playerX, chestY);

    const landing = frame.landing;
    if (!landing || landing.age >= MARK_FRAMES) {
      this.word.setVisible(false);
      return;
    }
    const fade = 1 - landing.age / MARK_FRAMES;
    if (landing.result === 'hit') this.drawScratches(anchors.playerX, chestY, fade, 1);
    // A dodged paw rakes the air between you instead.
    else if (landing.result !== 'feinted') {
      const between = anchors.playerX - (anchors.playerX - anchors.cickaX) * 0.35;
      this.drawScratches(between, chestY + 6, fade, 0.6);
    }

    const overCicka = landing.result === 'feinted';
    const x = overCicka ? anchors.cickaX : anchors.playerX;
    const y = GROUND_Y + headTopFor(overCicka ? 'cicka' : 'player') * 0.8 - landing.age * 0.3;
    this.showWord(RESULT_WORD[landing.result], x, y, fade);
  }

  destroy(): void {
    this.graphics.destroy();
    this.word.destroy();
  }

  /** Real wind-ups close a solid ring; feints wobble in on a dashed one. */
  private drawRing(ring: NonNullable<DuelFrame['ring']>, x: number, y: number): void {
    const g = this.graphics;
    g.lineStyle(ring.meets ? 3 : 1.5, INK, ring.meets ? 0.9 : 0.45);
    g.strokeCircle(x, y, DUEL_TARGET_RADIUS);
    if (ring.meets) {
      g.fillStyle(INK, 0.12);
      g.fillCircle(x, y, DUEL_TARGET_RADIUS);
    }

    const alpha = 0.35 + 0.6 * (1 - (ring.radius - DUEL_TARGET_RADIUS) / 70);
    if (ring.kind === 'feint') {
      g.lineStyle(2, INK, alpha);
      for (let i = 0; i < DASHES; i += 2) {
        const a0 = (i / DASHES) * Math.PI * 2;
        const a1 = ((i + 1) / DASHES) * Math.PI * 2;
        g.beginPath();
        g.arc(x, y, ring.radius, a0, a1);
        g.strokePath();
      }
      return;
    }
    g.lineStyle(ring.kind === 'pounce' ? 4 : 3, INK, alpha);
    g.strokeCircle(x, y, ring.radius);
  }

  /** Three quick claw rakes, slanted like a swipe. */
  private drawScratches(x: number, y: number, fade: number, weight: number): void {
    const g = this.graphics;
    g.lineStyle(3 * weight, INK, 0.85 * fade);
    for (let i = -1; i <= 1; i += 1) {
      g.beginPath();
      g.moveTo(x - 14 + i * 7, y - 16);
      g.lineTo(x + 10 + i * 7, y + 14);
      g.strokePath();
    }
  }

  private showWord(text: string, x: number, y: number, fade: number): void {
    if (text !== this.wordKey) {
      this.wordKey = text;
      this.word.setText(text);
    }
    this.word.setPosition(Math.round(x), Math.round(y)).setAlpha(fade).setVisible(true);
  }
}
