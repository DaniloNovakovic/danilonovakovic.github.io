// Phaser drawing and a small per-frame state machine; verified in the browser.
// fallow-ignore-file complexity
/**
 * The evil chick (#163): the street chick that always ran away, 2.4× its
 * size now, hackles up, a scribble of rage over its head and an alert-red eye
 * under a hard ink brow. It waits through its confrontation, then stalks
 * Danilo, taunting, and pecks: a red `!` (the tell), then a lunge, beak first,
 * that lands if he's still close. A parried peck leaves it dizzy. The first
 * hammer swing that connects folds it flat.
 */
import type * as Phaser from 'phaser';
import { ALERT_RED } from '@/game/sharedSceneRuntime/escapeAlert';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import { createTell, FEET_Y, INK, PAPER, type FightAttack } from './fightKit';

const SCALE = 2.4;
const DEPTH = 26;
const STOP_PX = 74;
const SPEED = 95;
/** The tell before a peck, how far the lunge reaches, the lunge itself, and the rest after it. */
const WINDUP_MS = 620;
const PECK_REACH_PX = 108;
const LUNGE_MS = 160;
const RECOIL_MS = 900;
const DAZED_MS = 1500;

type ChickState = 'waiting' | 'stalking' | 'windup' | 'recoil' | 'dazed' | 'flattened' | 'gone';

export class EvilChick {
  private readonly scene: Phaser.Scene;
  private readonly motion: boolean;
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly bubble: Phaser.GameObjects.Text;
  private readonly tell: Phaser.GameObjects.Text;
  private chickX: number;
  private state: ChickState;
  private timerMs = 0;
  private frame = -1;

  constructor(scene: Phaser.Scene, x: number, motion: boolean, standing: boolean) {
    this.scene = scene;
    this.motion = motion;
    this.chickX = x;
    this.state = standing ? 'waiting' : 'gone';
    this.g = scene.add.graphics().setDepth(DEPTH).setPosition(x, FEET_Y).setVisible(standing);
    this.bubble = createUiText(scene, x, FEET_Y - 82, '', {
      fontSize: '15px',
      color: '#1a1a1a',
      backgroundColor: '#fbfbf9',
      padding: { x: 5, y: 2 },
      fontStyle: 'bold'
    })
      .setOrigin(0.5, 1)
      .setDepth(DEPTH + 1)
      .setVisible(false);
    this.tell = createTell(scene, DEPTH + 2);
  }

  get x(): number {
    return this.chickX;
  }

  /** Still up and can be hit. */
  get standing(): boolean {
    return this.state !== 'flattened' && this.state !== 'gone';
  }

  /** After the confrontation: it comes for Danilo. */
  startAttack(): void {
    if (this.state === 'waiting') this.state = 'stalking';
  }

  /** Moves, taunts and pecks; returns the peck the frame it lands. */
  update(timeMs: number, dt: number, playerX: number): FightAttack | null {
    if (this.state === 'gone') return null;
    this.timerMs -= dt * 1000;
    let attack: FightAttack | null = null;
    if (this.state === 'stalking') this.stalk(dt, playerX);
    else if (this.state === 'windup') attack = this.peck(playerX);
    else if ((this.state === 'recoil' || this.state === 'dazed') && this.timerMs <= 0) this.state = 'stalking';
    this.tell.setPosition(this.chickX, FEET_Y - 70).setVisible(this.state === 'windup');
    const facing = playerX >= this.chickX ? 1 : -1;
    const frame = this.frameAt(timeMs);
    this.g.setPosition(this.chickX, FEET_Y);
    if (frame !== this.frame || this.g.scaleX !== facing * SCALE) {
      this.frame = frame;
      this.draw(frame, facing);
    }
    this.bubble.setPosition(this.chickX + facing * 20, FEET_Y - 82);
    return attack;
  }

  /** Its peck met a parry: dizzy, standing still, wide open. */
  daze(): void {
    if (!this.standing) return;
    this.state = 'dazed';
    this.timerMs = DAZED_MS;
    this.bubble.setVisible(false);
  }

  /** BONK: folded flat, it skids off and is gone. */
  flatten(playerX: number): void {
    this.state = 'flattened';
    this.bubble.setVisible(false);
    this.tell.setVisible(false);
    this.frame = -1;
    const away = this.chickX >= playerX ? 1 : -1;
    this.scene.tweens.add({
      targets: this.g,
      x: this.chickX + away * 260,
      alpha: 0,
      delay: 650,
      duration: this.motion ? 700 : 0,
      ease: 'Quad.easeIn',
      onUpdate: () => (this.chickX = this.g.x),
      onComplete: () => {
        this.state = 'gone';
        this.g.setVisible(false);
      }
    });
  }

  /** Closes in, taunting, and winds up a peck once it's close enough. */
  private stalk(dt: number, playerX: number): void {
    const gap = playerX - this.chickX;
    const closing = Math.abs(gap) - STOP_PX;
    if (closing > 0) this.chickX += Math.sign(gap) * (this.motion ? Math.min(closing, SPEED * dt) : closing);
    const close = Math.abs(gap) <= STOP_PX + 4;
    // Taunts on the way in; quiet while it winds up, so the tell reads on its own.
    if (this.bubble.text !== 'run, little doodle.') this.bubble.setText('run, little doodle.');
    this.bubble.setVisible(!close);
    if (close) {
      this.state = 'windup';
      this.timerMs = WINDUP_MS;
    }
  }

  /** The tell runs out: lunge, beak first. It lands only if Danilo is still close. */
  private peck(playerX: number): FightAttack | null {
    if (this.timerMs > 0) return null;
    this.state = 'recoil';
    this.timerMs = RECOIL_MS;
    this.bubble.setText('bring it.').setVisible(true);
    return Math.abs(playerX - this.chickX) <= PECK_REACH_PX ? { kind: 'swipe', fromX: this.chickX } : null;
  }

  /** 0 glaring, 1 stomping (stepped, motion only), 2 flattened, 3 lunging, 4 dizzy. */
  private frameAt(timeMs: number): number {
    if (this.state === 'flattened') return 2;
    if (this.state === 'recoil' && this.timerMs > RECOIL_MS - LUNGE_MS) return 3;
    if (this.state === 'dazed') return 4;
    return this.motion && Math.floor(timeMs / 120) % 4 === 0 ? 1 : 0;
  }

  /** Drawn at chick scale, feet at 0. */
  private draw(frame: number, facing: number): void {
    const g = this.g.clear();
    g.setScale(facing * SCALE, SCALE);
    if (frame === 2) {
      drawFlattened(g);
      return;
    }
    const bob = frame === 1 ? 1.5 : 0;
    if (frame === 4) drawDizzy(g);
    else drawRage(g);
    // Body, hackles up.
    g.lineStyle(1.6, INK, 1);
    g.fillStyle(PAPER, 1);
    g.fillEllipse(0, -9 + bob, 18, 15);
    g.strokeEllipse(0, -9 + bob, 18, 15);
    g.lineStyle(1, INK, 0.7);
    for (let i = -6; i <= 2; i += 2.5) g.lineBetween(i, -13 + bob, i - 3, -6 + bob);
    g.lineStyle(1.6, INK, 1);
    g.lineBetween(-10, -12 + bob, -16, -17 + bob);
    g.lineBetween(-10, -9 + bob, -17, -11 + bob);
    // Head (thrust forward and down in the lunge).
    const hx = frame === 3 ? 11 : 6;
    const hy = (frame === 3 ? -13 : -18) + bob;
    g.fillStyle(PAPER, 1);
    g.fillCircle(hx, hy, 5.6);
    g.strokeCircle(hx, hy, 5.6);
    g.fillStyle(INK, 1);
    g.fillTriangle(hx + 1, hy - 6, hx + 3, hy - 9, hx + 4, hy - 5.5);
    g.fillTriangle(hx + 4.5, hy - 1, hx + 11, hy + 1, hx + 4.5, hy + 2.5);
    // Red eye under a hard ink brow: danger, readable without colour.
    g.fillStyle(ALERT_RED, 1);
    g.fillCircle(hx + 1.8, hy - 0.6, 1.4);
    g.lineStyle(1.6, INK, 1);
    g.lineBetween(hx - 1.5, hy - 4.5, hx + 4, hy - 2);
    // Legs, planted.
    g.lineStyle(1.4, INK, 1);
    g.lineBetween(-3, -2, -4, 0);
    g.lineBetween(3, -2, 4, 0);
    g.lineBetween(-7, 0, -1, 0);
    g.lineBetween(1, 0, 7, 0);
  }
}

/** Scribbled storm of rage above its head. */
function drawRage(g: Phaser.GameObjects.Graphics): void {
  g.lineStyle(1, INK, 0.75);
  g.beginPath();
  g.moveTo(-4, -30);
  for (let i = 0; i < 8; i++) g.lineTo(-4 + i * 1.6, -30 - (i % 2 === 0 ? 3 : 0));
  g.strokePath();
}

/** Parried: ink stars circling its head. */
function drawDizzy(g: Phaser.GameObjects.Graphics): void {
  g.lineStyle(0.8, INK, 1);
  for (const [sx, sy] of [
    [0, -31],
    [6, -34],
    [12, -31]
  ] as const) {
    g.lineBetween(sx - 1.5, sy, sx + 1.5, sy);
    g.lineBetween(sx, sy - 1.5, sx, sy + 1.5);
  }
}

/** Folded flat: a pancake of a chick with crossed-out eyes and stars. */
function drawFlattened(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(PAPER, 1);
  g.lineStyle(1.5, INK, 1);
  g.fillEllipse(0, -2.5, 26, 5);
  g.strokeEllipse(0, -2.5, 26, 5);
  g.lineBetween(7, -4.5, 10, -1.5);
  g.lineBetween(10, -4.5, 7, -1.5);
  g.lineStyle(1, INK, 0.9);
  for (const sx of [-6, 0, 6]) {
    g.lineBetween(sx - 2, -11, sx + 2, -7);
    g.lineBetween(sx + 2, -11, sx - 2, -7);
  }
}
