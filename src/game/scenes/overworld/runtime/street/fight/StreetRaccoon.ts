// Phaser drawing and a small per-frame state machine; verified in the browser.
// fallow-ignore-file complexity
/**
 * A street-fight raccoon (#163): the dumpster raccoons whose paw prints were
 * always on the street, coming in packs. One rushes in along the ground from the edge of the
 * view, stops beside Danilo, raises a claw (a `!` over its head: the tell,
 * readable with sound off), swipes, backs off, and comes again. A parried
 * swipe leaves it dizzy for a moment (stars over its head), wide open. Ink
 * mask with a red eye, striped tail. Knocked out, it spins off into the gutter.
 */
import type * as Phaser from 'phaser';
import { ALERT_RED } from '@/game/sharedSceneRuntime/escapeAlert';
import {
  createTell,
  ENEMY_DEPTH,
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

const SCALE = 1.3;
const RUN_SPEED = 185;
const BACK_OFF_SPEED = 120;
const STRIKE_RANGE_PX = 48;
const STRIKE_SPREAD_PX = 26;
/** A swipe still lands this far away: step back during the tell to dodge it. */
const SWIPE_REACH_PX = 80;
const WINDUP_MS = 560;
const BACK_OFF_MS = 750;
const DAZED_MS = 1500;

type RaccoonState = 'waiting' | 'running' | 'windup' | 'backoff' | 'dazed' | 'hit';

export class StreetRaccoon extends WaveEnemy implements FightEnemy {
  readonly kind = 'raccoon' as const;
  private readonly tell: Phaser.GameObjects.Text;
  private readonly strikeRange: number;
  private state: RaccoonState = 'waiting';
  private px = 0;
  private vx = 0;
  private vy = 0;
  private py = FEET_Y;
  private facing: 1 | -1 = 1;
  private frame = -1;

  constructor(scene: Phaser.Scene, options: WaveEnemyOptions) {
    super(scene, options);
    // Alert red: it's danger, and the raised claw carries the same tell in greyscale.
    this.tell = createTell(scene, ENEMY_DEPTH + 1);
    // A horde doesn't stack on one spot: each stops at its own distance (still inside its swipe).
    this.strikeRange = STRIKE_RANGE_PX + Math.random() * STRIKE_SPREAD_PX;
  }

  get x(): number {
    return this.px;
  }

  /** Middle of the body, for reach checks. */
  get y(): number {
    return this.py - 20;
  }

  get hittable(): boolean {
    return this.state !== 'waiting' && this.state !== 'hit';
  }

  get down(): boolean {
    return this.state === 'hit';
  }

  update(frame: FightFrame): FightAttack | null {
    this.timerMs -= frame.dt * 1000;
    let attack: FightAttack | null = null;
    if (this.state === 'waiting') this.enter(frame);
    else if (this.state === 'running') this.run(frame);
    else if (this.state === 'windup') attack = this.strike(frame);
    else if (this.state === 'backoff') this.backOff(frame);
    else if (this.state === 'dazed') this.recover();
    else this.tumble(frame);
    this.render(frame.timeMs);
    return attack;
  }

  knock(away: 1 | -1): void {
    this.state = 'hit';
    this.tell.setVisible(false);
    this.vx = away * 220;
    this.vy = -260;
    this.fadeAway(() => this.tell.destroy());
  }

  /** Its swipe met a parry: dizzy, standing still, wide open. */
  daze(): void {
    if (this.state === 'hit') return;
    this.state = 'dazed';
    this.timerMs = DAZED_MS;
  }

  private recover(): void {
    if (this.timerMs <= 0) this.state = 'running';
  }

  private enter(frame: FightFrame): void {
    if (this.timerMs > 0) return;
    this.state = 'running';
    this.px = this.entryX(frame);
  }

  private run(frame: FightFrame): void {
    const gap = frame.playerX - this.px;
    this.facing = gap >= 0 ? 1 : -1;
    if (Math.abs(gap) <= this.strikeRange) {
      this.state = 'windup';
      this.timerMs = WINDUP_MS;
      return;
    }
    this.px += this.facing * Math.min(Math.abs(gap) - this.strikeRange, RUN_SPEED * frame.dt);
  }

  /** The tell, then the swipe: it lands only if Danilo is still close. */
  private strike(frame: FightFrame): FightAttack | null {
    this.facing = frame.playerX >= this.px ? 1 : -1;
    if (this.timerMs > 0) return null;
    this.state = 'backoff';
    this.timerMs = BACK_OFF_MS;
    return Math.abs(frame.playerX - this.px) <= SWIPE_REACH_PX ? { kind: 'swipe', fromX: this.px } : null;
  }

  private backOff(frame: FightFrame): void {
    this.px -= this.facing * BACK_OFF_SPEED * frame.dt;
    if (this.timerMs <= 0) this.state = 'running';
  }

  private tumble(frame: FightFrame): void {
    if (!frame.motion || (this.py >= FEET_Y && this.vy > 0)) {
      this.py = FEET_Y;
      this.g.setRotation(0);
      return;
    }
    this.vy += 900 * frame.dt;
    this.px += this.vx * frame.dt;
    this.py = Math.min(FEET_Y, this.py + this.vy * frame.dt);
    this.g.rotation += 10 * frame.dt;
  }

  private render(timeMs: number): void {
    if (this.gone) return;
    this.g.setPosition(this.px, this.py).setVisible(this.state !== 'waiting');
    this.tell.setPosition(this.px, this.py - 58).setVisible(this.state === 'windup');
    const frame = this.frameAt(timeMs);
    if (frame !== this.frame || this.g.scaleX !== this.facing * SCALE) {
      this.frame = frame;
      this.g.setScale(this.facing * SCALE, SCALE);
      drawRaccoon(this.g, frame);
    }
  }

  /** 0/1 running strides (stepped), 2 claw raised, 3 knocked out, 4 dizzy. */
  private frameAt(timeMs: number): number {
    if (this.state === 'hit') return 3;
    if (this.state === 'dazed') return 4;
    if (this.state === 'windup') return 2;
    return Math.floor(timeMs / 110) % 2;
  }
}

/** Faces right, feet at 0. */
function drawRaccoon(g: Phaser.GameObjects.Graphics, frame: number): void {
  g.clear();
  // Striped tail.
  g.lineStyle(2, INK, 1);
  g.fillStyle(PAPER, 1);
  g.fillEllipse(-24, -16, 20, 9);
  g.strokeEllipse(-24, -16, 20, 9);
  g.lineStyle(3, INK, 1);
  for (const tx of [-30, -24, -18]) g.lineBetween(tx, -20, tx + 1, -12);
  // Hunched body with grey hatching.
  g.lineStyle(2, INK, 1);
  g.fillStyle(PAPER, 1);
  g.fillEllipse(0, -14, 30, 20);
  g.strokeEllipse(0, -14, 30, 20);
  g.lineStyle(1, GREY, 0.9);
  for (let i = -10; i <= 6; i += 4) g.lineBetween(i, -20, i + 5, -9);
  // Head, ears, the ink mask with a red eye.
  g.lineStyle(2, INK, 1);
  g.fillStyle(PAPER, 1);
  g.fillCircle(15, -24, 8);
  g.strokeCircle(15, -24, 8);
  g.fillTriangle(9, -30, 11, -37, 15, -31);
  g.strokeTriangle(9, -30, 11, -37, 15, -31);
  g.fillStyle(INK, 1);
  g.fillRect(9, -27, 13, 4);
  g.fillTriangle(22, -24, 27, -22, 22, -20);
  if (frame === 3 || frame === 4) {
    g.lineStyle(1.6, PAPER, 1);
    g.lineBetween(16, -27, 19, -23);
    g.lineBetween(19, -27, 16, -23);
  } else {
    g.fillStyle(ALERT_RED, 1);
    g.fillCircle(18, -25, 1.6);
  }
  drawRaccoonLimbs(g, frame);
}

function drawRaccoonLimbs(g: Phaser.GameObjects.Graphics, frame: number): void {
  if (frame === 4) {
    // Dizzy: ink stars over its head.
    g.lineStyle(1.5, INK, 1);
    for (const [sx, sy] of [
      [6, -44],
      [16, -48],
      [26, -43]
    ] as const) {
      g.lineBetween(sx - 3, sy, sx + 3, sy);
      g.lineBetween(sx, sy - 3, sx, sy + 3);
      g.lineBetween(sx - 2, sy - 2, sx + 2, sy + 2);
    }
  }
  g.lineStyle(2, INK, 1);
  const stride = frame === 1 ? 4 : 0;
  g.lineBetween(-8, -6, -10 + stride, 0);
  g.lineBetween(8, -6, 10 - stride, 0);
  if (frame !== 2) return;
  // Claw up: the arm raised over its head, three claws out.
  g.lineBetween(6, -18, 12, -42);
  g.lineBetween(12, -42, 9, -48);
  g.lineBetween(12, -42, 13, -49);
  g.lineBetween(12, -42, 17, -47);
}
