// Phaser drawing and a small per-frame state machine; verified in the browser.
// fallow-ignore-file complexity
/**
 * A street-fight pigeon (#163): harassment, not progress. Crosses the sky left and right, in a low lane
 * (jump and swing) or a high one (out of reach), and lobs an egg (or worse)
 * at Danilo whenever it passes. Parry the egg and it flies back at its sender.
 * Red eye, ink brow, hatched grey belly. Knocked out, it tumbles to the street
 * in a burst of feathers.
 */
import type * as Phaser from 'phaser';
import { ALERT_RED } from '@/game/sharedSceneRuntime/escapeAlert';
import {
  FEET_Y,
  GREY,
  INK,
  PAPER,
  WaveEnemy,
  type FightAttack,
  type FightEnemy,
  type FightFrame,
  type WaveEnemyOptions
} from './fightKit';

const SPEED = 190;
/**
 * Flight heights: a low lane the hammer reaches with a jump, and a high one
 * only a parried egg can reach.
 */
const ALTITUDES = [FEET_Y - 150, FEET_Y - 230] as const;
const DROP_COOLDOWN_MS = 1500;
/** It lets go while still this far ahead of Danilo, so the drop arcs down onto him. */
const DROP_LEAD_MIN_PX = 30;
const DROP_LEAD_MAX_PX = 150;
const BOB_PX = 6;
const GROUND = FEET_Y - 6;

type PigeonState = 'waiting' | 'flying' | 'hit' | 'left';

export class StreetPigeon extends WaveEnemy implements FightEnemy {
  readonly kind = 'pigeon' as const;
  private state: PigeonState = 'waiting';
  private pass: number;
  private px = 0;
  private py: number = ALTITUDES[0];
  private vx = 0;
  private vy = 0;
  private dropReadyAt = 0;
  private retiring = false;
  private frame = -1;

  constructor(scene: Phaser.Scene, options: WaveEnemyOptions) {
    super(scene, options);
    // Every other pigeon starts high, so a wave fills both lanes of the sky.
    this.pass = options.fromLeft ? 0 : 1;
  }

  get x(): number {
    return this.px;
  }

  get y(): number {
    return this.py;
  }

  get hittable(): boolean {
    return this.state === 'flying';
  }

  get down(): boolean {
    return this.state === 'hit' || this.state === 'left';
  }

  /** The fight is over: finish this pass and don't come back. */
  retire(): void {
    this.retiring = true;
    if (this.state === 'waiting') this.leave();
  }

  update(frame: FightFrame): FightAttack | null {
    if (this.state === 'left') return null;
    let attack: FightAttack | null = null;
    if (this.state === 'waiting') this.wait(frame);
    else if (this.state === 'flying') attack = this.fly(frame);
    else this.tumble(frame);
    this.render(frame.timeMs);
    return attack;
  }

  knock(away: 1 | -1): void {
    this.state = 'hit';
    this.vx = away * 160;
    this.vy = -220;
    this.g.setRotation(0);
    this.fadeAway();
  }

  private wait(frame: FightFrame): void {
    this.timerMs -= frame.dt * 1000;
    if (this.timerMs > 0) return;
    // Enter from just past the edge of the view, at this pass's height.
    this.state = 'flying';
    this.px = this.entryX(frame);
    this.vx = this.fromLeft ? SPEED : -SPEED;
    this.py = ALTITUDES[this.pass % ALTITUDES.length];
  }

  private fly(frame: FightFrame): FightAttack | null {
    this.px += this.vx * frame.dt;
    const altitude = ALTITUDES[this.pass % ALTITUDES.length];
    this.py = altitude + (frame.motion ? Math.sin(frame.timeMs / 160) * BOB_PX : 0);
    if (this.pastFarEdge(this.px, this.vx, frame)) {
      if (this.retiring) {
        this.leave();
        return null;
      }
      // Come round again from this side, at the other height.
      this.state = 'waiting';
      this.timerMs = 500 + Math.random() * 900;
      this.fromLeft = this.vx < 0;
      this.pass += 1;
      return null;
    }
    const lead = (frame.playerX - this.px) * Math.sign(this.vx);
    if (!this.retiring && lead >= DROP_LEAD_MIN_PX && lead <= DROP_LEAD_MAX_PX && frame.timeMs >= this.dropReadyAt) {
      this.dropReadyAt = frame.timeMs + DROP_COOLDOWN_MS;
      return { kind: 'drop', x: this.px, y: this.py + 8 };
    }
    return null;
  }

  /** Off the page for good: counts as gone once its drawing is cleared away. */
  private leave(): void {
    this.state = 'left';
    this.g.setVisible(false);
    this.fadeAway();
  }

  /** Knocked out: falls to the street (spinning, unless reduced motion) and lies belly up. */
  private tumble(frame: FightFrame): void {
    if (!frame.motion || this.py >= GROUND) {
      this.py = GROUND;
      this.g.setRotation(Math.PI);
      return;
    }
    this.vy += 900 * frame.dt;
    this.px += this.vx * frame.dt;
    this.py = Math.min(GROUND, this.py + this.vy * frame.dt);
    this.g.rotation += 9 * frame.dt;
  }

  private render(timeMs: number): void {
    if (this.gone) return;
    this.g.setPosition(this.px, this.py).setVisible(this.state !== 'waiting');
    const frame = this.state === 'hit' ? 2 : Math.floor(timeMs / 90) % 2;
    if (frame !== this.frame) {
      this.frame = frame;
      drawPigeon(this.g, frame);
    }
    this.g.scaleX = this.vx < 0 ? -1 : 1;
  }
}

/** Frames: 0 wings up, 1 wings down, 2 knocked out. Faces right. */
function drawPigeon(g: Phaser.GameObjects.Graphics, frame: number): void {
  g.clear();
  g.lineStyle(2, INK, 1);
  g.fillStyle(PAPER, 1);
  g.fillEllipse(0, 0, 30, 16);
  g.strokeEllipse(0, 0, 30, 16);
  // Hatched grey belly so it reads as a pigeon, not a chick.
  g.lineStyle(1, GREY, 0.9);
  for (let i = -10; i <= 6; i += 3.5) g.lineBetween(i, 1, i + 4, 7);
  g.lineStyle(2, INK, 1);
  g.lineBetween(-15, 0, -24, -3);
  g.lineBetween(-15, 2, -24, 4);
  g.fillStyle(PAPER, 1);
  g.fillCircle(15, -6, 7);
  g.strokeCircle(15, -6, 7);
  g.fillStyle(INK, 1);
  g.fillTriangle(21, -7, 28, -4, 21, -3);
  if (frame === 2) {
    g.lineStyle(1.6, INK, 1);
    g.lineBetween(14, -9, 18, -5);
    g.lineBetween(18, -9, 14, -5);
    return;
  }
  g.fillStyle(ALERT_RED, 1);
  g.fillCircle(16, -7, 1.8);
  g.lineStyle(2, INK, 1);
  g.lineBetween(12, -12, 19, -9);
  g.fillStyle(PAPER, 1);
  const tipY = frame === 0 ? -22 : 14;
  g.fillTriangle(-6, -2, 8, -2, -2, tipY);
  g.strokeTriangle(-6, -2, 8, -2, -2, tipY);
  g.lineStyle(1, INK, 0.7);
  g.lineBetween(-3, -2, -2, tipY * 0.7);
  g.lineBetween(2, -2, 0, tipY * 0.7);
}
