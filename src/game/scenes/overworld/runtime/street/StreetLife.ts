/**
 * StreetLife — ambient residents of the overworld street: telephone wires,
 * doodle birds that scatter when the player gets close, and ink puffs under
 * the player's feet. Presentation only; no gameplay decisions live here.
 */
import * as Phaser from 'phaser';
import { sketchTick } from '@/game/sharedSceneRuntime/motion/sketchMotion';

const INK = 0x1a1a1a;
const PAPER = 0xfbfbf9;
const GROUND_Y = 550;

const POLE_XS = [150, 650, 1150, 2150, 2650] as const;
const POLE_TOP_Y = 200;
const WIRE_Y = 214;
const WIRE_SAG_PER_PX = 0.06;

const BIRD_PERCH_XS = [560, 610, 735, 1090, 1215, 2090, 2240, 2600, 2720] as const;
const BIRD_SCARE_PX = 130;
const BIRD_SPRINT_SCARE_PX = 230;
const BIRD_RETURN_CLEARANCE_PX = 340;
const BIRD_RETURN_SPEED = 170;
const BIRD_DEPTH = 12;

const PUFF_DEPTH = 24;
const SPRINT_PUFF_INTERVAL_MS = 110;

interface WireSpan {
  x0: number;
  x1: number;
}

const WIRE_SPANS: readonly WireSpan[] = POLE_XS.slice(1).map((x1, i) => ({ x0: POLE_XS[i], x1 }));

function wireYAt(x: number): number {
  const span = WIRE_SPANS.find((s) => x >= s.x0 && x <= s.x1);
  if (!span) return WIRE_Y;
  const t = (x - span.x0) / (span.x1 - span.x0);
  return WIRE_Y + (span.x1 - span.x0) * WIRE_SAG_PER_PX * 4 * t * (1 - t);
}

/** Poles and sagging wire, drawn behind the buildings. */
export function buildStreetWires(scene: Phaser.Scene): void {
  const g = scene.add.graphics();

  for (const x of POLE_XS) {
    g.lineStyle(4, INK, 0.85);
    g.lineBetween(x, GROUND_Y, x + 2, POLE_TOP_Y);
    g.lineStyle(3, INK, 0.85);
    g.lineBetween(x - 22, POLE_TOP_Y + 12, x + 24, POLE_TOP_Y + 11);
    // Hatching on the shadow side of the pole.
    g.lineStyle(1, INK, 0.35);
    for (let y = POLE_TOP_Y + 30; y < GROUND_Y - 10; y += 14) {
      g.lineBetween(x + 3, y, x + 8, y + 6);
    }
  }

  g.lineStyle(2, INK, 0.7);
  for (const span of WIRE_SPANS) {
    g.beginPath();
    g.moveTo(span.x0, WIRE_Y);
    const steps = 24;
    for (let i = 1; i <= steps; i++) {
      const x = Phaser.Math.Linear(span.x0, span.x1, i / steps);
      g.lineTo(x, wireYAt(x));
    }
    g.strokePath();
  }
}

type BirdFrame = 'perch' | 'peck' | 'flapUp' | 'flapDown';
type BirdMode = 'perched' | 'flying' | 'away' | 'returning';

interface Bird {
  g: Phaser.GameObjects.Graphics;
  perchX: number;
  perchY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mode: BirdMode;
  frame: BirdFrame | null;
  facing: 1 | -1;
  awayUntilMs: number;
  peckUntilMs: number;
  nextPeckAtMs: number;
}

interface BirdFrameContext {
  timeMs: number;
  dt: number;
  playerX: number;
  scareRadius: number;
  flapFrame: BirdFrame;
  motion: boolean;
}

function drawBird(g: Phaser.GameObjects.Graphics, frame: BirdFrame): void {
  g.clear();
  g.lineStyle(2, INK, 1);
  if (frame === 'flapUp' || frame === 'flapDown') {
    drawFlyingBird(g, frame === 'flapUp');
  } else {
    drawPerchedBird(g, frame === 'peck');
  }
}

function drawFlyingBird(g: Phaser.GameObjects.Graphics, wingsUp: boolean): void {
  const tipY = wingsUp ? -2 : -9;
  const elbowY = wingsUp ? -10 : -3;
  g.beginPath();
  g.moveTo(-10, tipY);
  g.lineTo(-4, elbowY);
  g.lineTo(0, -5);
  g.lineTo(4, elbowY);
  g.lineTo(10, tipY);
  g.strokePath();
  g.fillStyle(INK, 1);
  g.fillCircle(0, -5, 2);
}

function drawPerchedBird(g: Phaser.GameObjects.Graphics, peck: boolean): void {
  g.fillStyle(PAPER, 1);
  g.fillEllipse(0, -6, 14, 9);
  g.strokeEllipse(0, -6, 14, 9);
  const headX = peck ? 7 : 5;
  const headY = peck ? -6 : -12;
  g.fillCircle(headX, headY, 3.5);
  g.strokeCircle(headX, headY, 3.5);
  g.lineBetween(headX + 3, headY, headX + 7, headY + (peck ? 3 : 1));
  g.lineBetween(-7, -6, -11, -10);
  g.lineStyle(1.5, INK, 1);
  g.lineBetween(-1, -2, -1, 1);
  g.lineBetween(2, -2, 2, 1);
}

export class StreetBirds {
  private readonly birds: Bird[];
  private readonly frame: BirdFrameContext = {
    timeMs: 0,
    dt: 0,
    playerX: 0,
    scareRadius: BIRD_SCARE_PX,
    flapFrame: 'flapUp',
    motion: true
  };

  constructor(scene: Phaser.Scene) {
    this.birds = BIRD_PERCH_XS.map((perchX, i) => {
      const perchY = wireYAt(perchX) + 1;
      const g = scene.add.graphics().setDepth(BIRD_DEPTH).setPosition(perchX, perchY);
      return {
        g,
        perchX,
        perchY,
        x: perchX,
        y: perchY,
        vx: 0,
        vy: 0,
        mode: 'perched' as const,
        frame: null,
        facing: i % 2 === 0 ? 1 : -1,
        awayUntilMs: 0,
        peckUntilMs: 0,
        nextPeckAtMs: Phaser.Math.Between(1500, 6000)
      };
    });
  }

  update(timeMs: number, deltaMs: number, playerX: number, sprinting: boolean, motion: boolean): void {
    const f = this.frame;
    f.timeMs = timeMs;
    f.dt = Math.min(deltaMs, 50) / 1000;
    f.playerX = playerX;
    f.scareRadius = sprinting ? BIRD_SPRINT_SCARE_PX : BIRD_SCARE_PX;
    f.flapFrame = sketchTick(timeMs) % 2 === 0 ? 'flapUp' : 'flapDown';
    f.motion = motion;

    for (const bird of this.birds) {
      switch (bird.mode) {
        case 'perched':
          this.updatePerched(bird, f);
          break;
        case 'flying':
          this.updateFlying(bird, f);
          break;
        case 'away':
          this.updateAway(bird, f);
          break;
        case 'returning':
          this.updateReturning(bird, f);
          break;
      }
    }
  }

  private updatePerched(bird: Bird, f: BirdFrameContext): void {
    if (Math.abs(f.playerX - bird.x) < f.scareRadius) {
      this.scare(bird, f);
      return;
    }
    if (f.motion && f.timeMs >= bird.nextPeckAtMs) {
      bird.peckUntilMs = f.timeMs + 360;
      bird.nextPeckAtMs = f.timeMs + Phaser.Math.Between(2500, 7000);
    }
    this.setFrame(bird, f.timeMs < bird.peckUntilMs ? 'peck' : 'perch');
  }

  private updateFlying(bird: Bird, f: BirdFrameContext): void {
    bird.vy -= 90 * f.dt;
    bird.x += bird.vx * f.dt;
    bird.y += bird.vy * f.dt;
    bird.g.setPosition(bird.x, bird.y);
    this.setFrame(bird, f.flapFrame);
    if (bird.y < -60) {
      this.sendAway(bird, f.timeMs);
    }
  }

  private updateAway(bird: Bird, f: BirdFrameContext): void {
    const clear = Math.abs(f.playerX - bird.perchX) > BIRD_RETURN_CLEARANCE_PX;
    if (clear && f.timeMs >= bird.awayUntilMs) {
      this.startReturn(bird, f.motion);
    }
  }

  private updateReturning(bird: Bird, f: BirdFrameContext): void {
    if (Math.abs(f.playerX - bird.perchX) < f.scareRadius) {
      this.scare(bird, f);
      return;
    }
    const dx = bird.perchX - bird.x;
    const dy = bird.perchY - bird.y;
    const dist = Math.hypot(dx, dy);
    const step = BIRD_RETURN_SPEED * f.dt;
    if (dist <= step) {
      this.land(bird);
      return;
    }
    bird.x += (dx / dist) * step;
    bird.y += (dy / dist) * step;
    bird.g.setPosition(bird.x, bird.y);
    this.setFrame(bird, f.flapFrame);
  }

  private scare(bird: Bird, f: BirdFrameContext): void {
    if (!f.motion) {
      this.sendAway(bird, f.timeMs);
      return;
    }
    const away = bird.x >= f.playerX ? 1 : -1;
    bird.mode = 'flying';
    bird.vx = away * Phaser.Math.Between(110, 200);
    bird.vy = -Phaser.Math.Between(170, 250);
    bird.facing = away;
    bird.g.setScale(bird.facing, 1);
  }

  private sendAway(bird: Bird, timeMs: number): void {
    bird.mode = 'away';
    bird.awayUntilMs = timeMs + Phaser.Math.Between(3500, 7000);
    bird.g.setVisible(false);
  }

  private startReturn(bird: Bird, motion: boolean): void {
    if (!motion) {
      this.land(bird);
      return;
    }
    const fromSide = Math.random() < 0.5 ? -1 : 1;
    bird.mode = 'returning';
    bird.x = bird.perchX + fromSide * Phaser.Math.Between(280, 420);
    bird.y = -40;
    bird.facing = fromSide === 1 ? -1 : 1;
    bird.g.setScale(bird.facing, 1).setPosition(bird.x, bird.y).setVisible(true);
  }

  private land(bird: Bird): void {
    bird.mode = 'perched';
    bird.x = bird.perchX;
    bird.y = bird.perchY;
    bird.g.setPosition(bird.x, bird.y).setVisible(true);
  }

  private setFrame(bird: Bird, frame: BirdFrame): void {
    if (bird.frame === frame) return;
    bird.frame = frame;
    drawBird(bird.g, frame);
  }
}

/** Ink puffs when the player lands or sprints along the street. */
export class StreetFootsteps {
  private wasGrounded = true;
  private nextSprintPuffAtMs = 0;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  update(
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    timeMs: number,
    sprinting: boolean,
    motion: boolean
  ): void {
    const body = player.body;
    const grounded = body.blocked.down || body.touching.down;
    const landed = grounded && !this.wasGrounded;
    this.wasGrounded = grounded;
    if (!motion || !grounded) return;

    if (landed) {
      this.puff(player.x - 12, body.bottom, -1);
      this.puff(player.x + 12, body.bottom, 1);
    } else if (sprinting && timeMs >= this.nextSprintPuffAtMs) {
      const behind = body.velocity.x > 0 ? -1 : 1;
      this.puff(player.x + behind * 10, body.bottom, behind);
      this.nextSprintPuffAtMs = timeMs + SPRINT_PUFF_INTERVAL_MS;
    }
  }

  private puff(x: number, y: number, drift: -1 | 1): void {
    const p = this.scene.add
      .circle(x, y - 3, Phaser.Math.Between(3, 5))
      .setStrokeStyle(2, INK, 0.55)
      .setDepth(PUFF_DEPTH);
    this.scene.tweens.add({
      targets: p,
      x: x + drift * Phaser.Math.Between(10, 18),
      y: y - Phaser.Math.Between(6, 12),
      scale: 2,
      alpha: 0,
      duration: 380,
      onComplete: () => p.destroy()
    });
  }
}
