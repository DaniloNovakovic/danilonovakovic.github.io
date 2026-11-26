// Per-frame Phaser state machine (enemies, droppings, stun, guard); the rules it
// applies live in fight/fightRules.ts, tested. Verified in the browser.
// fallow-ignore-file complexity
/**
 * The Out of Bounds street fight (#163), on the Phaser side: the evil chick,
 * then waves of pigeons (crossing the sky, lobbing eggs) and raccoons
 * (rushing in along the ground to swipe), and Danilo's hammer. The console
 * owns progress (how many smashes have landed); this module draws it, moves
 * the enemies, decides what connects, and lands their attacks.
 *
 * Two moves: **swing** (the hammer, in front of Danilo) and **parry** (a short
 * guard). A parried egg flies back and knocks out the pigeon that dropped it;
 * a parried swipe leaves the raccoon dizzy and open. Getting hit knocks Danilo
 * back and stuns him for a moment; there is no game over. Nothing flashes,
 * and every hit, tell and splat reads with sound off.
 */
import type * as Phaser from 'phaser';
import {
  streetFightWaveEnemies,
  type StreetFightEnemy,
  type StreetFightProgress,
  type StreetFightTarget
} from '@/game/core/console';
import { EvilChick } from './fight/EvilChick';
import { StreetPigeon } from './fight/StreetPigeon';
import { StreetRaccoon } from './fight/StreetRaccoon';
import { ENEMY_DEPTH, FEET_Y, FightFx, INK, PAPER, type FightEnemy, type FightFrame } from './fight/fightKit';
import { inHammerReach, lobVelocityX } from './fight/fightRules';

const HAMMER_DEPTH = 26.5;
const SWING_COOLDOWN_MS = 300;
const SWING_STRIKE_MS = 70;
const SWING_RECOVER_MS = 220;
const CHICK_START_OFFSET_PX = 170;

/** The guard: open this long, then a rest before the next one. */
const PARRY_OPEN_MS = 280;
const PARRY_COOLDOWN_MS = 650;
/** An egg this close to Danilo's head while the guard is up gets batted back. */
const PARRY_RADIUS_PX = 70;

const STUN_MS = 520;
/** After a hit, a moment where nothing else lands, so hits never chain. */
const SAFE_MS = 1100;
const KNOCKBACK_SPEED = 260;
const DROP_GRAVITY = 700;
const DROP_START_VY = 60;
const DROP_HIT_HALF_WIDTH = 20;
const RETURN_SPEED = 560;

export type StreetFightHurt = 'swipe' | 'dropping';

export interface StreetFightHit {
  target: StreetFightTarget;
  /** World point where it was knocked out. */
  x: number;
  y: number;
}

interface Dropping {
  g: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  from: FightEnemy;
  /** Batted back by a parry: it hunts its sender (or the nearest pigeon). */
  returning: boolean;
}

export class StreetFight {
  private readonly scene: Phaser.Scene;
  private readonly player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private readonly motion: boolean;
  private readonly holdPlayer: (held: boolean) => void;
  private readonly onHurt: (kind: StreetFightHurt) => void;
  private readonly onSmash: (hit: StreetFightHit) => void;
  private readonly fx: FightFx;
  private readonly chick: EvilChick;
  private readonly hammer: Phaser.GameObjects.Graphics;
  private readonly guard: Phaser.GameObjects.Graphics;
  private enemies: FightEnemy[] = [];
  private droppings: Dropping[] = [];
  private progress: StreetFightProgress;
  private wave = 0;
  private dropCount = 0;
  private swingStartedAt = -Infinity;
  private parryStartedAt = -Infinity;
  private stunnedUntil = -Infinity;
  private safeUntil = -Infinity;
  private knockDir: 1 | -1 = 1;
  private held = false;
  private nowMs = 0;

  constructor(options: {
    scene: Phaser.Scene;
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    progress: StreetFightProgress;
    motion: boolean;
    getAudioContext: () => AudioContext | null;
    /** Stops (or gives back) the player's own movement while stunned. */
    holdPlayer: (held: boolean) => void;
    onHurt: (kind: StreetFightHurt) => void;
    /** Something was knocked out (by the hammer or a returned egg): one smash. */
    onSmash: (hit: StreetFightHit) => void;
  }) {
    this.scene = options.scene;
    this.player = options.player;
    this.motion = options.motion;
    this.holdPlayer = options.holdPlayer;
    this.onHurt = options.onHurt;
    this.onSmash = options.onSmash;
    this.progress = options.progress;
    this.fx = new FightFx(this.scene, this.motion, options.getAudioContext);
    this.chick = new EvilChick(
      this.scene,
      this.player.x + CHICK_START_OFFSET_PX,
      this.motion,
      this.progress.phase === 'chick'
    );
    this.hammer = this.scene.add.graphics().setDepth(HAMMER_DEPTH);
    drawHammer(this.hammer);
    this.guard = this.scene.add.graphics().setDepth(HAMMER_DEPTH).setVisible(false);
    drawGuard(this.guard);
    this.syncWave();
  }

  /** World x of the evil chick, for framing its confrontation. */
  get evilChickX(): number {
    return this.chick.x;
  }

  /** After the confrontation: the chick comes for Danilo. */
  startChickAttack(): void {
    this.chick.startAttack();
  }

  /** Progress moved on (a smash landed): bring in the next wave. */
  setProgress(progress: StreetFightProgress): void {
    this.progress = progress;
    this.syncWave();
  }

  update(timeMs: number, deltaMs: number): void {
    this.nowMs = timeMs;
    const view = this.scene.cameras.main.worldView;
    const frame: FightFrame = {
      timeMs,
      dt: Math.min(deltaMs, 50) / 1000,
      playerX: this.player.x,
      playerY: this.player.y,
      viewLeft: view.x,
      viewRight: view.right,
      motion: this.motion
    };
    this.chick.update(timeMs, frame.dt, this.player.x);
    this.updateEnemies(frame);
    this.updateDroppings(frame);
    this.updateStun();
    this.placeHammer(timeMs);
  }

  /** Swing the hammer at the nearest enemy in reach in front of Danilo. */
  swing(): void {
    if (this.nowMs < this.stunnedUntil || this.nowMs - this.swingStartedAt < SWING_COOLDOWN_MS) return;
    this.swingStartedAt = this.nowMs;
    const hit = this.findHit();
    if (!hit) {
      this.fx.whiffSound();
      return;
    }
    if (hit.enemy) hit.enemy.knock(hit.x >= this.player.x ? 1 : -1);
    else this.chick.flatten(this.player.x);
    this.knockedOut({ target: hit.target, x: hit.x, y: hit.y }, HIT_WORDS[hit.target]);
  }

  /** Raise the guard for a moment: eggs bounce back, swipes glance off. */
  parry(): void {
    if (this.nowMs < this.stunnedUntil || this.nowMs - this.parryStartedAt < PARRY_COOLDOWN_MS) return;
    this.parryStartedAt = this.nowMs;
    this.fx.whiffSound();
  }

  private get guarding(): boolean {
    return this.nowMs - this.parryStartedAt < PARRY_OPEN_MS;
  }

  private knockedOut(hit: StreetFightHit, word: string): void {
    if (hit.target === 'pigeon') this.fx.feathers(hit.x, hit.y);
    this.fx.word(word, hit.x, hit.y);
    this.fx.smashSound();
    this.onSmash(hit);
  }

  // --- Hitting ---------------------------------------------------------------

  private findHit(): (StreetFightHit & { enemy?: FightEnemy }) | null {
    if (this.progress.phase === 'chick') return this.findChickHit();
    const enemy = this.nearest(
      this.enemies.filter((e) => e.hittable && this.inReach(e.x, e.y)),
      this.player.x
    );
    return enemy ? { target: enemy.kind, x: enemy.x, y: enemy.y, enemy } : null;
  }

  private findChickHit(): StreetFightHit | null {
    const y = FEET_Y - 22;
    return this.chick.standing && this.inReach(this.chick.x, y) ? { target: 'chick', x: this.chick.x, y } : null;
  }

  private nearest(candidates: readonly FightEnemy[], x: number): FightEnemy | null {
    let best: FightEnemy | null = null;
    for (const enemy of candidates) {
      if (!best || Math.abs(enemy.x - x) < Math.abs(best.x - x)) best = enemy;
    }
    return best;
  }

  /** In front of Danilo (the way he last walked), or just behind, within reach. */
  private inReach(x: number, y: number): boolean {
    return inHammerReach(this.player, this.player.flipX, { x, y });
  }

  // --- Waves -----------------------------------------------------------------

  /** One enemy per one still to smash in this wave, from alternating sides, staggered. */
  private syncWave(): void {
    const { phase, wave, leftInWave } = this.progress;
    if (phase !== 'waves' || wave === this.wave) return;
    this.wave = wave;
    // The first wave waits for the chick to skid off.
    const startMs = wave === 1 ? 1200 : 500;
    streetFightWaveEnemies(wave, leftInWave).forEach((kind, i) => {
      this.enemies.push(this.spawn(kind, startMs + i * 1100, i % 2 === 0));
    });
  }

  private spawn(kind: StreetFightEnemy, delayMs: number, fromLeft: boolean): FightEnemy {
    const options = {
      delayMs,
      fromLeft,
      onKnockedOut: (g: Phaser.GameObjects.Graphics) => this.fx.fadeOut(g, {}, 1400)
    };
    return kind === 'raccoon' ? new StreetRaccoon(this.scene, options) : new StreetPigeon(this.scene, options);
  }

  private updateEnemies(frame: FightFrame): void {
    for (const enemy of this.enemies) {
      const attack = enemy.update(frame);
      if (attack?.kind === 'swipe') this.takeSwipe(enemy, attack.fromX);
      else if (attack?.kind === 'drop') this.drop(enemy, attack.x, attack.y);
    }
    this.enemies = this.enemies.filter((enemy) => !enemy.gone);
  }

  private takeSwipe(raccoon: FightEnemy, fromX: number): void {
    if (!this.guarding) {
      this.hurt('swipe', fromX);
      return;
    }
    raccoon.daze?.();
    this.fx.word('PARRY!', this.player.x, this.player.y - 60);
    this.fx.smashSound();
  }

  // --- Droppings ---------------------------------------------------------------

  /** Eggs and worse, in turn, lobbed to land where Danilo is standing right now. */
  private drop(from: FightEnemy, x: number, y: number): void {
    const g = this.scene.add.graphics().setDepth(ENEMY_DEPTH).setPosition(x, y);
    drawDropping(g, this.dropCount++ % 2 === 0 ? 'egg' : 'poop');
    const vx = lobVelocityX({ x, y }, { x: this.player.x, y: this.player.y - 20 }, DROP_GRAVITY, DROP_START_VY);
    this.droppings.push({ g, x, y, vx, vy: DROP_START_VY, from, returning: false });
  }

  private updateDroppings(frame: FightFrame): void {
    this.droppings = this.droppings.filter((d) => {
      const keep = d.returning ? this.flyBack(d, frame.dt) : this.fall(d, frame.dt);
      if (keep) d.g.setPosition(d.x, d.y);
      else d.g.destroy();
      return keep;
    });
  }

  /** Falling: batted back by a guard, onto Danilo, or onto the street. Returns whether it's still in the air. */
  private fall(d: Dropping, dt: number): boolean {
    d.vy += DROP_GRAVITY * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    const headY = this.player.y - 40;
    if (this.guarding && Math.hypot(d.x - this.player.x, d.y - headY) <= PARRY_RADIUS_PX) {
      d.returning = true;
      this.fx.word('RETURN!', this.player.x, this.player.y - 60);
      return true;
    }
    const onDanilo =
      Math.abs(d.x - this.player.x) <= DROP_HIT_HALF_WIDTH && d.y >= this.player.y - 50 && d.y <= this.player.y + 30;
    if (onDanilo) {
      this.hurt('dropping', d.x);
      return false;
    }
    if (d.y < FEET_Y - 2) return true;
    this.fx.splat(d.x, FEET_Y - 2);
    return false;
  }

  /** Back to sender (or the nearest pigeon still up); off the page if none are left. */
  private flyBack(d: Dropping, dt: number): boolean {
    const target = d.from.hittable ? d.from : this.nearestFlyingPigeon(d.x);
    if (!target) {
      d.y -= RETURN_SPEED * dt;
      return d.y > -80;
    }
    const dx = target.x - d.x;
    const dy = target.y - d.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 18) {
      target.knock(dx >= 0 ? 1 : -1);
      this.knockedOut({ target: target.kind, x: target.x, y: target.y }, 'BOINK!');
      return false;
    }
    const step = Math.min(distance, RETURN_SPEED * dt);
    d.x += (dx / distance) * step;
    d.y += (dy / distance) * step;
    return true;
  }

  private nearestFlyingPigeon(x: number): FightEnemy | null {
    return this.nearest(
      this.enemies.filter((e) => e.kind === 'pigeon' && e.hittable),
      x
    );
  }

  // --- Getting hurt ------------------------------------------------------------

  private hurt(kind: StreetFightHurt, fromX: number): void {
    if (this.nowMs < this.safeUntil) return;
    this.stunnedUntil = this.nowMs + STUN_MS;
    this.safeUntil = this.nowMs + SAFE_MS;
    this.knockDir = this.player.x >= fromX ? 1 : -1;
    this.held = true;
    this.holdPlayer(true);
    this.player.setVelocityY(-180);
    this.fx.word(kind === 'swipe' ? 'SWIPE!' : 'SPLAT!', this.player.x, this.player.y + 12);
    if (kind === 'dropping') this.fx.splat(this.player.x, this.player.y - 46);
    this.fx.hurtSound();
    this.onHurt(kind);
  }

  /** Knocked back while stunned, easing off; then Danilo has his legs back. */
  private updateStun(): void {
    if (!this.held) return;
    const left = this.stunnedUntil - this.nowMs;
    if (left > 0) {
      this.player.setVelocityX(this.knockDir * KNOCKBACK_SPEED * (left / STUN_MS));
      return;
    }
    this.held = false;
    this.player.setVelocityX(0);
    this.holdPlayer(false);
  }

  // --- The hammer and the guard -----------------------------------------------

  private placeHammer(timeMs: number): void {
    const facing = this.player.flipX ? -1 : 1;
    const since = timeMs - this.swingStartedAt;
    const guarding = this.guarding;
    // Rest by his side, wind up, smash, recover: stepped, no easing. Held across
    // him while guarding, dropped low while stunned.
    let angle = 0.5;
    if (timeMs < this.stunnedUntil) angle = 2.2;
    else if (guarding) angle = -0.2;
    else if (since < SWING_STRIKE_MS) angle = -2.1;
    else if (since < SWING_RECOVER_MS) angle = 1.35;
    this.hammer.setPosition(this.player.x + facing * 12, this.player.y + 6);
    this.hammer.setScale(facing, 1);
    this.hammer.setRotation(facing * angle);
    this.guard
      .setPosition(this.player.x + facing * 22, this.player.y - 30)
      .setScale(facing, 1)
      .setVisible(guarding);
  }
}

const HIT_WORDS: Record<StreetFightTarget, string> = {
  chick: 'BONK!',
  pigeon: 'THWACK!',
  raccoon: 'WHACK!'
};

/** Handle pointing down-forward from the grip at 0,0. */
function drawHammer(g: Phaser.GameObjects.Graphics): void {
  g.lineStyle(4, INK, 1);
  g.lineBetween(0, 0, 0, -38);
  g.fillStyle(PAPER, 1);
  g.lineStyle(2.5, INK, 1);
  g.fillRect(-12, -50, 24, 13);
  g.strokeRect(-12, -50, 24, 13);
  g.lineStyle(1, INK, 0.7);
  for (let i = -9; i <= 9; i += 4) g.lineBetween(i, -49, i + 2, -38);
}

/** The guard: an ink arc of speed lines in front of him, like a bat being squared up. */
function drawGuard(g: Phaser.GameObjects.Graphics): void {
  g.lineStyle(3, INK, 0.9);
  g.beginPath();
  g.arc(0, 0, 34, -1.1, 1.1);
  g.strokePath();
  g.lineStyle(1.5, INK, 0.6);
  for (const a of [-0.8, -0.3, 0.2, 0.7]) {
    g.lineBetween(Math.cos(a) * 40, Math.sin(a) * 40, Math.cos(a) * 50, Math.sin(a) * 50);
  }
}

/** An egg (speckled oval) or a dropping (a squiggled blob): ink on paper, greyscale-safe. */
function drawDropping(g: Phaser.GameObjects.Graphics, kind: 'egg' | 'poop'): void {
  g.fillStyle(PAPER, 1);
  g.lineStyle(2, INK, 1);
  if (kind === 'egg') {
    g.fillEllipse(0, 0, 10, 13);
    g.strokeEllipse(0, 0, 10, 13);
    g.fillStyle(INK, 0.8);
    g.fillCircle(-1.5, -2, 1);
    g.fillCircle(2, 1.5, 1);
    return;
  }
  g.fillCircle(0, 0, 5.5);
  g.strokeCircle(0, 0, 5.5);
  g.lineStyle(1.5, INK, 0.9);
  g.lineBetween(-3, -1, 3, 1);
  g.lineBetween(0, -6, 0, -10);
}
