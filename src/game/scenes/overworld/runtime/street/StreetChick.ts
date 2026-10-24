/**
 * Street chick just past Experiences.
 * Presentation only: the console decides when the chick can be talked to.
 * Glasses on, it bolts. Glasses off, it walks home and pecks.
 */
import * as Phaser from 'phaser';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';

const INK = 0x1a1a1a;
const PAPER = 0xfbfbf9;
const FEET_Y = 548;
const SCARE_PX = 220;
const FLEE_CLEARANCE_PX = 340;
const FLEE_SPEED = 260;
const RETURN_SPEED = 110;
const STREET_MIN_X = 80;
const STREET_MAX_X = 2920;

type ChickFrame = 'idle' | 'peck' | 'run';

export class StreetChick {
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly bubble: Phaser.GameObjects.Text;
  private x: number;
  private readonly homeX: number;
  private frame: ChickFrame | null = null;
  private facing: 1 | -1 = 1;
  private nextPeckAtMs = 1200;
  private peckUntilMs = 0;

  constructor(scene: Phaser.Scene, homeX: number) {
    this.homeX = homeX;
    this.x = homeX;
    this.g = scene.add.graphics().setDepth(22).setPosition(homeX, FEET_Y);
    this.bubble = createUiText(scene, homeX, FEET_Y - 42, '', {
      fontSize: '13px',
      color: '#1a1a1a',
      backgroundColor: '#fbfbf9',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5, 1).setDepth(23).setVisible(false);
    this.draw('idle');
  }

  update(
    timeMs: number,
    deltaMs: number,
    playerX: number,
    glassesOn: boolean,
    motion: boolean
  ): void {
    const dt = Math.min(deltaMs, 50) / 1000;
    const away = playerX >= this.x ? -1 : 1;

    if (glassesOn && Math.abs(playerX - this.x) < SCARE_PX) {
      this.facing = away;
      if (!motion) {
        this.x = clamp(this.x + away * FLEE_CLEARANCE_PX, STREET_MIN_X, STREET_MAX_X);
      } else {
        this.x = clamp(this.x + away * FLEE_SPEED * dt, STREET_MIN_X, STREET_MAX_X);
      }
      this.place('run');
      this.say('nope!');
      return;
    }

    if (!glassesOn && Math.abs(this.x - this.homeX) > 4) {
      const dir = this.homeX > this.x ? 1 : -1;
      this.facing = dir;
      const step = motion ? RETURN_SPEED * dt : Math.abs(this.homeX - this.x);
      const next = this.x + dir * step;
      this.x = dir > 0 ? Math.min(next, this.homeX) : Math.max(next, this.homeX);
      this.place('run');
      this.hush();
      return;
    }

    if (!glassesOn && motion && timeMs >= this.nextPeckAtMs) {
      this.peckUntilMs = timeMs + 320;
      this.nextPeckAtMs = timeMs + 2800;
    }
    this.facing = playerX >= this.x ? -1 : 1;
    this.place(!glassesOn && timeMs < this.peckUntilMs ? 'peck' : 'idle');
    const distance = Math.abs(playerX - this.x);
    if (!glassesOn && distance < 90) this.say('hey. hey.');
    else if (!glassesOn && distance < 170) this.say('ooh...');
    else this.hush();
  }

  private place(frame: ChickFrame): void {
    this.g.setPosition(this.x, FEET_Y);
    this.bubble.setPosition(this.x + this.facing * 18, FEET_Y - 40);
    this.draw(frame);
  }

  private say(line: string): void {
    if (this.bubble.text !== line) this.bubble.setText(line);
    this.bubble.setVisible(true);
  }

  private hush(): void {
    this.bubble.setVisible(false);
  }

  private draw(frame: ChickFrame): void {
    if (this.frame === frame && this.g.scaleX === this.facing) return;
    this.frame = frame;
    const g = this.g;
    g.clear();
    g.setScale(this.facing, 1);
    g.lineStyle(2, INK, 1);
    g.fillStyle(PAPER, 1);
    g.lineBetween(-10, -8, -16, -12);
    g.lineBetween(-10, -6, -17, -6);
    g.fillEllipse(0, -8, 16, 13);
    g.strokeEllipse(0, -8, 16, 13);
    g.strokeEllipse(-1, -7, 7, 5);

    const peck = frame === 'peck';
    const headX = peck ? 7 : 6;
    const headY = peck ? -8 : -16;
    g.fillCircle(headX, headY, 5.4);
    g.strokeCircle(headX, headY, 5.4);
    g.fillStyle(0xb4533d, 1);
    g.fillCircle(headX - 1.6, headY - 5, 1.6);
    g.fillCircle(headX + 0.4, headY - 6.2, 1.8);
    g.fillCircle(headX + 2.2, headY - 4.8, 1.4);
    g.fillStyle(INK, 1);
    if (peck) {
      g.fillTriangle(headX + 4, headY + 1, headX + 10, headY + 5, headX + 3, headY + 4);
    } else {
      g.fillTriangle(headX + 4, headY - 1, headX + 10, headY, headX + 4, headY + 2);
    }
    g.fillCircle(headX + 1.4, headY - 0.6, 0.9);

    g.lineStyle(1.5, INK, 1);
    if (frame === 'run') {
      g.lineBetween(-3, -2, -6, 2);
      g.lineBetween(-6, 2, -8, 3);
      g.lineBetween(3, -2, 6, 2);
      g.lineBetween(6, 2, 8, 1);
    } else {
      g.lineBetween(-2, -2, -3, 2);
      g.lineBetween(-3, 2, -6, 3);
      g.lineBetween(-3, 2, -1, 3);
      g.lineBetween(3, -2, 4, 2);
      g.lineBetween(4, 2, 2, 3);
      g.lineBetween(4, 2, 7, 3);
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
