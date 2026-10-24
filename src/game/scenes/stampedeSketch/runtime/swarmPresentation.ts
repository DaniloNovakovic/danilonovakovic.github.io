import * as Phaser from 'phaser';
import {
  STAMPEDE_ARENA,
  clampStampedePosition
} from './movement';
import { STAMPEDE_CONTACT_RADIUS_PADDING } from './pressure';
import {
  getStampedeSwarmMotion,
  resolveStampedeSwarmTarget
} from './swarmMotion';
import type { StampedeClearedMarkPoint } from './progression';
import { createBeerShot, stepBeerShots, STAMPEDE_BARTENDER_THROW_MS, type StampedeBeerShot } from './beer';
import {
  getStampedeFlockProfile,
  resolveStampedeFlockKind,
  resolveStampedeMendTarget,
  type StampedeFlockKind
} from './flock';

interface StampedeSwarmDot {
  id: string;
  shape: Phaser.GameObjects.Arc;
  chick: Phaser.GameObjects.Graphics;
  halo: Phaser.GameObjects.Arc;
  telegraph: Phaser.GameObjects.Arc;
  homeX: number;
  homeY: number;
  homeRadius: number;
  homeAlpha: number;
  speed: number;
  slot: number;
  kind: StampedeFlockKind;
  hp: number;
  maxHp: number;
  scrapValue: number;
  respawnMs: number;
  phase: number;
  facing: 1 | -1;
  mood: 'chase' | 'smitten' | 'gag';
  coat: ChickCoat;
  flapStep: number;
  nextHeartAtMs: number;
  clearedUntilMs: number | null;
  fleeUntilMs: number;
  fleeVx: number;
  fleeVy: number;
  hitFlapUntilMs: number;
  nextTrickAtMs: number;
}

export type StampedeSwarmMode = 'calm' | 'build' | 'surge' | 'recover';

export interface StampedeSwarmUpdateOptions {
  mode?: StampedeSwarmMode;
  pressure?: number;
  elapsedMs?: number;
  playerHurting?: boolean;
}

export interface StampedeSwarmContactCandidate {
  id: string;
  x: number;
  y: number;
  radius: number;
  kind?: StampedeFlockKind;
}

interface StampedeSwarmRuntimeOptions {
  scene: Phaser.Scene;
}

export interface StampedeSwarmRuntime {
  update(target: { x: number; y: number }, delta: number, options?: StampedeSwarmUpdateOptions): void;
  getContactCandidates(): readonly StampedeSwarmContactCandidate[];
  getSpellCandidates(): readonly StampedeSwarmContactCandidate[];
  applyShove(
    nowMs: number,
    impulses: readonly { id: string; vx: number; vy: number; fleeMs: number }[]
  ): void;
  clearMarks(ids: readonly string[]): readonly StampedeClearedMarkPoint[];
  showResisted(ids: readonly string[]): void;
  consumeBeerHit(): boolean;
  reset(): void;
}

const STAMPEDE_SWARM_BOUNDS = {
  safeLeft: STAMPEDE_ARENA.left + 12,
  safeRight: STAMPEDE_ARENA.right - 12,
  safeTop: STAMPEDE_ARENA.top + 24,
  safeBottom: STAMPEDE_ARENA.bottom - 24
} as const;
const STAMPEDE_RESPAWN_DELAY_MS = 3_200;
const STAMPEDE_RESPAWN_TELEGRAPH_MS = 1_100;

export function createStampedeSwarmRuntime(
  options: StampedeSwarmRuntimeOptions
): StampedeSwarmRuntime {
  const spawnPoints = createStampedeSwarmSpawnPoints();
  const dots = spawnPoints.map((point, index) => {
    const homeRadius = index % 3 === 0 ? 7 : 5;
    const coat = CHICK_COATS[index % CHICK_COATS.length]!;
    const chick = options.scene.add.graphics().setPosition(point.x, point.y).setDepth(21);
    drawSwarmChick(chick, { mood: 'chase', flap: 0, coat });
    return {
      id: `mark-${index + 1}`,
      shape: options.scene.add.circle(point.x, point.y, homeRadius, 0x1a1a1a, 0).setDepth(20),
      chick,
      halo: options.scene.add.circle(
        point.x,
        point.y,
        homeRadius + STAMPEDE_CONTACT_RADIUS_PADDING,
        0xffffff,
        0
      ).setDepth(19).setVisible(false),
      telegraph: options.scene.add.circle(
        point.x,
        point.y,
        homeRadius + STAMPEDE_CONTACT_RADIUS_PADDING + 5,
        0xffffff,
        0
      ).setStrokeStyle(3, 0xb4533d, 0.84).setDepth(18).setVisible(false).setAlpha(0),
      homeX: point.x,
      homeY: point.y,
      homeRadius,
      homeAlpha: 0.68,
      speed: 18 + index * 2,
      slot: index,
      kind: 'chick' as const,
      hp: 1,
      maxHp: 1,
      scrapValue: 1,
      respawnMs: STAMPEDE_RESPAWN_DELAY_MS,
      phase: index * 0.7,
      facing: 1 as const,
      mood: 'chase' as const,
      coat,
      flapStep: 0,
      nextHeartAtMs: 0,
      clearedUntilMs: null,
      fleeUntilMs: 0,
      fleeVx: 0,
      fleeVy: 0,
      hitFlapUntilMs: 0,
      nextTrickAtMs: 0
    };
  });

  return new PhaserStampedeSwarmRuntime(options.scene, dots);
}

class PhaserStampedeSwarmRuntime implements StampedeSwarmRuntime {
  private readonly scene: Phaser.Scene;
  private readonly dots: StampedeSwarmDot[];
  private readonly hearts: Phaser.GameObjects.Graphics[];
  private readonly feathers: Phaser.GameObjects.Graphics[];
  private heartCursor = 0;
  private featherCursor = 0;
  private elapsedMs = 0;
  private beers: StampedeBeerShot[] = [];
  private readonly beerMugs: Phaser.GameObjects.Graphics[];
  private readonly resistMarks: Phaser.GameObjects.Graphics[];
  private resistCursor = 0;
  private beerHit = false;

  constructor(
    scene: Phaser.Scene,
    dots: StampedeSwarmDot[]
  ) {
    this.scene = scene;
    this.dots = dots;
    this.hearts = Array.from({ length: 8 }, () => {
      const heart = scene.add.graphics().setDepth(28).setVisible(false);
      drawInkHeart(heart);
      return heart;
    });
    this.feathers = Array.from({ length: 18 }, () =>
      scene.add.graphics().setDepth(27).setVisible(false)
    );
    this.beerMugs = Array.from({ length: 4 }, () => {
      const mug = scene.add.graphics().setDepth(26).setVisible(false);
      drawBeerMug(mug);
      return mug;
    });
    this.resistMarks = Array.from({ length: 6 }, () => {
      const mark = scene.add.graphics().setDepth(29).setVisible(false);
      drawResistMark(mark);
      return mark;
    });
  }

  update(target: { x: number; y: number }, delta: number, options: StampedeSwarmUpdateOptions = {}): void {
    const deltaSeconds = delta / 1000;
    const nowMs = this.scene.time.now;
    this.elapsedMs = options.elapsedMs ?? this.elapsedMs;
    const pressure = Phaser.Math.Clamp(options.pressure ?? 0, 0, 1);
    const mode = options.mode ?? 'calm';
    const motion = getStampedeSwarmMotion(mode, pressure);

    this.dots.forEach((dot) => {
      if (dot.clearedUntilMs !== null) {
        if (nowMs < dot.clearedUntilMs) {
          this.syncChick(dot, dot.facing, nowMs, false);
          this.updateRespawnTelegraph(dot, dot.clearedUntilMs - nowMs);
          return;
        }
        this.restoreDot(dot);
      }

      this.maybePromote(dot);

      if (nowMs < dot.fleeUntilMs) {
        const damp = Math.max(0.35, Math.min(1, (dot.fleeUntilMs - nowMs) / 400));
        dot.shape.x += dot.fleeVx * damp * deltaSeconds;
        dot.shape.y += dot.fleeVy * damp * deltaSeconds;
        const fleeing = clampStampedePosition(
          { x: dot.shape.x, y: dot.shape.y },
          STAMPEDE_SWARM_BOUNDS
        );
        dot.shape.setPosition(fleeing.x, fleeing.y);
        dot.shape.setScale(1.15 * motion.scaleMultiplier);
        dot.shape.setAlpha(0.9);
        this.syncChick(dot, dot.fleeVx, nowMs, false, 'gag');
        this.syncHalo(dot, false, motion.alphaMultiplier);
        return;
      }

      if (dot.kind === 'bartender') {
        this.stepBartender(dot, target, nowMs, motion);
        return;
      }

      const chaseTarget = dot.kind === 'rooster' || dot.kind === 'fixer'
        ? target
        : resolveStampedeSwarmTarget({
          target,
          phase: dot.phase,
          mode,
          pressure,
          nowMs
        });
      const dx = chaseTarget.x - dot.shape.x;
      const dy = chaseTarget.y - dot.shape.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const wobbleX = Math.sin(nowMs / 380 + dot.phase) * 8 * motion.wobbleMultiplier;
      const wobbleY = Math.cos(nowMs / 420 + dot.phase) * 6 * motion.wobbleMultiplier;
      const isNear = distance < nearDistance(dot.kind);
      const wobbleScale = wobbleFor(dot.kind);
      const lunge = dot.kind === 'rooster' && distance < 160;
      let stepSpeed = lunge ? dot.speed * 1.75 : dot.speed;
      if (dot.kind === 'fixer' && options.playerHurting) stepSpeed *= 1.45;
      const move = moveVector(dot.kind, dx, dy, distance, nowMs, dot.phase);
      dot.shape.x += move.x * stepSpeed * motion.speedMultiplier * deltaSeconds + wobbleX * wobbleScale * deltaSeconds;
      dot.shape.y += move.y * stepSpeed * motion.speedMultiplier * deltaSeconds + wobbleY * wobbleScale * deltaSeconds;

      const clamped = clampStampedePosition(
        { x: dot.shape.x, y: dot.shape.y },
        STAMPEDE_SWARM_BOUNDS
      );
      dot.shape.setPosition(clamped.x, clamped.y);
      dot.shape.setScale((isNear ? 1.35 : 1) * motion.scaleMultiplier);
      dot.shape.setAlpha(Math.min(isNear ? 0.96 : 0.82, (isNear ? 0.9 : 0.62) * motion.alphaMultiplier));
      this.syncChick(dot, dx, nowMs, heartingKind(dot.kind) ? isNear : false);
      if (heartingKind(dot.kind) && isNear && nowMs >= dot.nextHeartAtMs) {
        dot.nextHeartAtMs = nowMs + heartGap(dot.kind) + dot.phase * 80;
        this.popHeart(dot.shape.x, dot.shape.y - 16);
      }
      if (dot.kind === 'fixer') this.tryMend(dot, nowMs);
      this.syncHalo(dot, isNear, motion.alphaMultiplier);
    });
    this.stepBeers(delta, nowMs, target);
  }

  getContactCandidates(): readonly StampedeSwarmContactCandidate[] {
    const nowMs = this.scene.time.now;
    return this.dots
      .filter((dot) => dot.clearedUntilMs === null && nowMs >= dot.fleeUntilMs)
      .map((dot) => this.readCandidate(dot));
  }

  getSpellCandidates(): readonly StampedeSwarmContactCandidate[] {
    return this.dots
      .filter((dot) => dot.clearedUntilMs === null)
      .map((dot) => this.readCandidate(dot));
  }

  applyShove(
    nowMs: number,
    impulses: readonly { id: string; vx: number; vy: number; fleeMs: number }[]
  ): void {
    impulses.forEach((impulse) => {
      const dot = this.dots.find((entry) => entry.id === impulse.id);
      if (!dot || dot.clearedUntilMs !== null) return;
      dot.fleeUntilMs = nowMs + impulse.fleeMs;
      dot.fleeVx = impulse.vx;
      dot.fleeVy = impulse.vy;
      dot.mood = 'gag';
      drawSwarmChick(dot.chick, { mood: 'gag', flap: 1, coat: dot.coat });
    });
  }

  private readCandidate(dot: StampedeSwarmDot): StampedeSwarmContactCandidate {
    return {
      id: dot.id,
      x: dot.shape.x,
      y: dot.shape.y,
      radius: dot.shape.radius * dot.shape.scaleX,
      kind: dot.kind
    };
  }

  showResisted(ids: readonly string[]): void {
    if (ids.length === 0) return;
    const now = this.scene.time.now;
    ids.forEach((id) => {
      const dot = this.dots.find((entry) => entry.id === id);
      if (!dot || dot.clearedUntilMs !== null) return;
      dot.hitFlapUntilMs = now + 160;
      dot.flapStep = -1;
      this.popResist(dot.shape.x, dot.shape.y - 18);
    });
  }

  consumeBeerHit(): boolean {
    const hit = this.beerHit;
    this.beerHit = false;
    return hit;
  }

  clearMarks(ids: readonly string[]): readonly StampedeClearedMarkPoint[] {
    if (ids.length === 0) return [];

    const hitIds = new Set(ids);
    const clearedMarks: StampedeClearedMarkPoint[] = [];
    this.dots.forEach((dot) => {
      if (!hitIds.has(dot.id)) return;
      if (dot.clearedUntilMs !== null) return;

      const now = this.scene.time.now;
      dot.hp -= 1;
      dot.hitFlapUntilMs = now + (dot.hp > 0 ? 180 : 280);
      dot.flapStep = -1;
      this.burstFeathers(dot.shape.x, dot.shape.y, dot.coat, dot.hp > 0 ? 1 : 3);
      drawSwarmChick(dot.chick, {
        mood: 'gag',
        flap: 1,
        coat: dot.coat,
        kind: dot.kind,
        hp: Math.max(0, dot.hp),
        maxHp: dot.maxHp
      });
      if (dot.hp > 0) return;

      clearedMarks.push({
        id: dot.id,
        x: dot.shape.x,
        y: dot.shape.y,
        value: dot.scrapValue
      });

      dot.clearedUntilMs = now + dot.respawnMs;
      if (dot.kind !== 'rooster') {
        this.popHeart(dot.shape.x, dot.shape.y - 10);
      }
      this.scene.tweens.killTweensOf(dot.shape);
      this.scene.tweens.killTweensOf(dot.chick);
      this.scene.tweens.killTweensOf(dot.halo);
      this.scene.tweens.killTweensOf(dot.telegraph);
      dot.shape.setVisible(true);
      dot.halo.setVisible(true);
      dot.telegraph.setVisible(false).setAlpha(0);
      this.scene.tweens.add({
        targets: dot.shape,
        alpha: 0.08,
        scale: 1.8,
        duration: 180,
        ease: 'Sine.easeOut',
        onComplete: () => {
          if (dot.clearedUntilMs !== null) {
            dot.shape.setVisible(false);
          }
        }
      });
      this.scene.tweens.add({
        targets: dot.halo,
        alpha: 0.05,
        scale: 1.8,
        duration: 180,
        ease: 'Sine.easeOut',
        onComplete: () => {
          if (dot.clearedUntilMs !== null) {
            dot.halo.setVisible(false);
          }
        }
      });
    });

    return clearedMarks;
  }

  reset(): void {
    this.elapsedMs = 0;
    this.dots.forEach((dot) => {
      this.scene.tweens.killTweensOf(dot.shape);
      this.scene.tweens.killTweensOf(dot.chick);
      this.scene.tweens.killTweensOf(dot.halo);
      this.scene.tweens.killTweensOf(dot.telegraph);
      this.restoreDot(dot);
    });
    this.hearts.forEach((heart) => {
      this.scene.tweens.killTweensOf(heart);
      heart.setVisible(false);
    });
    this.feathers.forEach((feather) => {
      this.scene.tweens.killTweensOf(feather);
      feather.setVisible(false);
    });
    this.beers = [];
    this.beerHit = false;
    this.beerMugs.forEach((mug) => mug.setVisible(false));
    this.resistMarks.forEach((mark) => {
      this.scene.tweens.killTweensOf(mark);
      mark.setVisible(false);
    });
  }

  private restoreDot(dot: StampedeSwarmDot): void {
    dot.clearedUntilMs = null;
    dot.facing = 1;
    dot.mood = 'chase';
    dot.flapStep = -1;
    dot.nextHeartAtMs = 0;
    dot.fleeUntilMs = 0;
    dot.fleeVx = 0;
    dot.fleeVy = 0;
    dot.hitFlapUntilMs = 0;
    this.applyKind(dot, resolveStampedeFlockKind(dot.slot, this.elapsedMs));
    drawSwarmChick(dot.chick, {
      mood: 'chase',
      flap: 0,
      coat: dot.coat,
      kind: dot.kind,
      hp: dot.hp,
      maxHp: dot.maxHp
    });
    dot.shape
      .setVisible(true)
      .setPosition(dot.homeX, dot.homeY)
      .setRadius(dot.homeRadius)
      .setScale(1)
      .setAlpha(dot.homeAlpha);
    this.syncChick(dot, 1, 0, false);
    dot.halo
      .setVisible(true)
      .setPosition(dot.homeX, dot.homeY)
      .setRadius(dot.homeRadius + STAMPEDE_CONTACT_RADIUS_PADDING)
      .setScale(1)
      .setAlpha(1);
    dot.telegraph
      .setVisible(false)
      .setPosition(dot.homeX, dot.homeY)
      .setScale(1)
      .setAlpha(0);
  }

  private syncChick(
    dot: StampedeSwarmDot,
    faceX: number,
    nowMs: number,
    smitten: boolean,
    forced?: 'gag'
  ): void {
    const facing: 1 | -1 = faceX >= 0 ? 1 : -1;
    const mood = forced ?? (smitten ? 'smitten' : 'chase');
    const hit = nowMs < dot.hitFlapUntilMs;
    const flap = wingFlap(nowMs, dot.phase, smitten || forced === 'gag' || hit, hit);
    const flapStep = Math.round(flap * 4);
    if (dot.facing !== facing || dot.mood !== mood || dot.flapStep !== flapStep) {
      dot.facing = facing;
      dot.mood = mood;
      dot.flapStep = flapStep;
      drawSwarmChick(dot.chick, {
        mood,
        flap,
        coat: dot.coat,
        kind: dot.kind,
        hp: dot.hp,
        maxHp: dot.maxHp
      });
    }
    const kindScale = kindScaleFor(dot.kind);
    const size = (dot.homeRadius / 5) * Math.abs(dot.shape.scaleX || 1) * 1.65 * kindScale;
    const waddle = (mood === 'gag'
      ? Math.sin(nowMs / 45 + dot.phase) * 4
      : Math.sin(nowMs / 90 + dot.phase) * 3) * (dot.kind === 'hen' ? 1.7 : 1);
    const hop = flap > 0.45 ? -4 * flap : 0;
    const angle = hit
      ? Math.sin(nowMs / 40 + dot.phase) * 22
      : mood === 'gag'
        ? Math.sin(nowMs / 60 + dot.phase) * 16
        : Math.sin(nowMs / 140 + dot.phase) * 8;
    const punch = hit ? 1.2 : 1;
    dot.chick
      .setPosition(dot.shape.x, dot.shape.y + waddle + hop)
      .setScale(facing * size * punch, size * (hit ? 0.92 : 1))
      .setAngle(angle)
      .setAlpha(dot.shape.alpha)
      .setVisible(dot.shape.visible);
  }

  private maybePromote(dot: StampedeSwarmDot): void {
    const kind = resolveStampedeFlockKind(dot.slot, this.elapsedMs);
    if (kind === dot.kind) return;
    this.applyKind(dot, kind);
    this.burstFeathers(dot.shape.x, dot.shape.y, dot.coat, 3);
  }

  private applyKind(dot: StampedeSwarmDot, kind: StampedeFlockKind): void {
    const profile = getStampedeFlockProfile(kind);
    dot.kind = kind;
    dot.maxHp = profile.maxHp;
    dot.hp = profile.maxHp;
    dot.scrapValue = profile.scrapValue;
    dot.respawnMs = profile.respawnMs;
    dot.homeRadius = kind === 'chick' && dot.slot % 3 === 0 ? 7 : profile.radius;
    dot.speed = kind === 'chick' ? 18 + dot.slot * 2 : profile.speed;
    dot.coat = kind === 'chick'
      ? CHICK_COATS[dot.slot % CHICK_COATS.length]!
      : KIND_COATS[kind];
    dot.flapStep = -1;
    dot.nextTrickAtMs = kind === 'bartender' || kind === 'fixer'
      ? this.scene.time.now + 900
      : 0;
    dot.shape.setRadius(dot.homeRadius);
  }

  private stepBartender(
    dot: StampedeSwarmDot,
    target: { x: number; y: number },
    nowMs: number,
    motion: { scaleMultiplier: number; alphaMultiplier: number }
  ): void {
    const sway = Math.sin(nowMs / 700 + dot.phase) * 70;
    const x = Phaser.Math.Clamp(
      dot.homeX + sway,
      STAMPEDE_SWARM_BOUNDS.safeLeft,
      STAMPEDE_SWARM_BOUNDS.safeRight
    );
    dot.shape.setPosition(x, dot.homeY);
    dot.shape.setScale(motion.scaleMultiplier);
    dot.shape.setAlpha(0.9 * motion.alphaMultiplier);
    this.syncChick(dot, target.x - x, nowMs, false);
    this.syncHalo(dot, false, motion.alphaMultiplier);
    if (nowMs < dot.nextTrickAtMs || this.beers.length >= this.beerMugs.length) return;
    this.beers.push(createBeerShot(
      { x: dot.shape.x, y: dot.shape.y },
      target,
      nowMs
    ));
    dot.nextTrickAtMs = nowMs + STAMPEDE_BARTENDER_THROW_MS;
  }

  private stepBeers(
    deltaMs: number,
    nowMs: number,
    player: { x: number; y: number }
  ): void {
    const stepped = stepBeerShots(this.beers, deltaMs, nowMs, {
      x: player.x,
      y: player.y,
      radius: 22
    });
    this.beers = stepped.shots;
    if (stepped.hit) this.beerHit = true;
    this.beerMugs.forEach((mug, index) => {
      const shot = this.beers[index];
      if (!shot) {
        mug.setVisible(false);
        return;
      }
      mug.setPosition(shot.x, shot.y).setVisible(true);
    });
  }

  private tryMend(dot: StampedeSwarmDot, nowMs: number): void {
    if (nowMs < dot.nextTrickAtMs) return;
    const targetId = resolveStampedeMendTarget(
      { id: dot.id, x: dot.shape.x, y: dot.shape.y },
      this.dots.map((other) => ({
        id: other.id,
        x: other.shape.x,
        y: other.shape.y,
        hp: other.hp,
        maxHp: other.maxHp,
        alive: other.clearedUntilMs === null
      }))
    );
    dot.nextTrickAtMs = nowMs + (targetId ? 2_400 : 700);
    if (!targetId) return;
    const other = this.dots.find((entry) => entry.id === targetId);
    if (!other) return;
    other.hp = Math.min(other.maxHp, other.hp + 1);
    other.flapStep = -1;
    drawSwarmChick(other.chick, {
      mood: other.mood,
      flap: 0,
      coat: other.coat,
      kind: other.kind,
      hp: other.hp,
      maxHp: other.maxHp
    });
    this.popHeart(other.shape.x, other.shape.y - 14);
  }

  private popResist(x: number, y: number): void {
    const mark = this.resistMarks[this.resistCursor];
    if (!mark) return;
    this.resistCursor = (this.resistCursor + 1) % this.resistMarks.length;
    this.scene.tweens.killTweensOf(mark);
    mark.setPosition(x, y).setScale(1).setAlpha(1).setVisible(true);
    this.scene.tweens.add({
      targets: mark,
      y: y - 16,
      alpha: 0,
      duration: 420,
      ease: 'Sine.easeOut',
      onComplete: () => mark.setVisible(false)
    });
  }

  private burstFeathers(x: number, y: number, coat: ChickCoat, count = 3): void {
    for (let index = 0; index < count; index += 1) {
      const feather = this.feathers[this.featherCursor];
      if (!feather) return;
      this.featherCursor = (this.featherCursor + 1) % this.feathers.length;
      drawFeather(feather, index === 0 ? coat.comb : coat.wing);
      const spread = (index - 1) * 16;
      this.scene.tweens.killTweensOf(feather);
      feather.setPosition(x, y - 6).setScale(1.8).setAlpha(1).setAngle(spread).setVisible(true);
      this.scene.tweens.add({
        targets: feather,
        x: x + spread * 1.4,
        y: y - 26 - index * 8,
        angle: spread * 5,
        alpha: 0,
        duration: 460,
        ease: 'Sine.easeOut',
        onComplete: () => feather.setVisible(false)
      });
    }
  }

  private popHeart(x: number, y: number): void {
    const heart = this.hearts[this.heartCursor];
    if (!heart) return;
    this.heartCursor = (this.heartCursor + 1) % this.hearts.length;
    this.scene.tweens.killTweensOf(heart);
    heart.setPosition(x, y).setScale(0.7).setAlpha(1).setVisible(true);
    this.scene.tweens.add({
      targets: heart,
      y: y - 22,
      alpha: 0,
      scale: 1.35,
      duration: 480,
      ease: 'Sine.easeOut',
      onComplete: () => heart.setVisible(false)
    });
  }

  private syncHalo(
    dot: StampedeSwarmDot,
    isNear: boolean,
    alphaMultiplier: number
  ): void {
    dot.halo
      .setVisible(true)
      .setPosition(dot.shape.x, dot.shape.y)
      .setScale(dot.shape.scaleX)
      .setAlpha(Math.min(isNear ? 0.56 : 0.28, (isNear ? 0.44 : 0.22) * alphaMultiplier));
  }

  private updateRespawnTelegraph(
    dot: StampedeSwarmDot,
    remainingMs: number
  ): void {
    if (remainingMs > STAMPEDE_RESPAWN_TELEGRAPH_MS) {
      dot.telegraph.setVisible(false).setAlpha(0);
      return;
    }

    const progress = 1 - remainingMs / STAMPEDE_RESPAWN_TELEGRAPH_MS;
    const pulse = 0.5 + Math.sin(this.scene.time.now / 85) * 0.5;
    dot.telegraph
      .setVisible(true)
      .setPosition(dot.homeX, dot.homeY)
      .setRadius(dot.homeRadius + STAMPEDE_CONTACT_RADIUS_PADDING + 8)
      .setScale(0.82 + progress * 0.34 + pulse * 0.06)
      .setAlpha(0.3 + progress * 0.55);
  }
}

function createStampedeSwarmSpawnPoints(): Array<{ x: number; y: number }> {
  const left = STAMPEDE_ARENA.safeLeft + 20;
  const right = STAMPEDE_ARENA.safeRight - 20;
  const top = STAMPEDE_ARENA.safeTop + 16;
  const bottom = STAMPEDE_ARENA.safeBottom - 16;
  const centerX = (STAMPEDE_ARENA.left + STAMPEDE_ARENA.right) / 2;
  const centerY = (STAMPEDE_ARENA.top + STAMPEDE_ARENA.bottom) / 2;

  return [
    { x: left, y: centerY - 130 },
    { x: centerX - 260, y: top },
    { x: centerX - 90, y: top + 12 },
    { x: centerX + 110, y: top },
    { x: centerX + 280, y: top + 24 },
    { x: right, y: centerY - 85 },
    { x: right, y: centerY + 90 },
    { x: centerX + 260, y: bottom },
    { x: centerX + 70, y: bottom - 8 },
    { x: centerX - 130, y: bottom },
    { x: centerX - 300, y: bottom - 28 },
    { x: left, y: centerY + 110 }
  ];
}

const CHICK_INK = 0x1a1a1a;

interface ChickCoat {
  body: number;
  wing: number;
  beak: number;
  comb: number;
}

const CHICK_COATS: readonly ChickCoat[] = [
  { body: 0xf6d36b, wing: 0xf0b429, beak: 0xe07a2f, comb: 0xd64545 },
  { body: 0xffe08a, wing: 0xf6c453, beak: 0xef8b3a, comb: 0xc24141 },
  { body: 0xfff3c4, wing: 0xf8d48a, beak: 0xe8923a, comb: 0xb4533d },
  { body: 0xf8c94a, wing: 0xe8a317, beak: 0xd86a22, comb: 0xb91c1c }
];

const KIND_COATS: Record<Exclude<StampedeFlockKind, 'chick'>, ChickCoat> = {
  hen: { body: 0xf4e2b8, wing: 0xe2c07a, beak: 0xd9893b, comb: 0xc45c4a },
  rooster: { body: 0xf0a202, wing: 0xd35400, beak: 0xe85d04, comb: 0xc1121f },
  nerd: { body: 0xd9e2ef, wing: 0xb7c4d6, beak: 0xe07a2f, comb: 0xc45c4a },
  perfume: { body: 0xf7c5d8, wing: 0xf4a7c5, beak: 0xe07a2f, comb: 0xd64545 },
  fixer: { body: 0xf2b8a0, wing: 0xe08b74, beak: 0xd9893b, comb: 0xc24141 },
  situationship: { body: 0xe4d4f5, wing: 0xc4b0e0, beak: 0xe07a2f, comb: 0xb4533d },
  bartender: { body: 0xf6d36b, wing: 0x4b4337, beak: 0xe07a2f, comb: 0xb91c1c }
};

function wingFlap(nowMs: number, phase: number, hurried: boolean, hit: boolean): number {
  if (hit) return 1;
  const wave = Math.sin(nowMs / (hurried ? 120 : 210) + phase * 5);
  if (wave < 0.42) return 0;
  return (wave - 0.42) / 0.58;
}

function drawSwarmChick(
  g: Phaser.GameObjects.Graphics,
  pose: {
    mood: 'chase' | 'smitten' | 'gag';
    flap: number;
    coat: ChickCoat;
    kind?: StampedeFlockKind;
    hp?: number;
    maxHp?: number;
  }
): void {
  const { mood, flap, coat } = pose;
  const kind = pose.kind ?? 'chick';
  const maxHp = pose.maxHp ?? 1;
  const hp = pose.hp ?? maxHp;
  g.clear();
  g.lineStyle(1.5, coat.wing, 1);
  g.lineBetween(-8, 0, -14, -5);
  g.lineBetween(-8, 2, -15, 1);
  g.lineBetween(-7, 4, -13, 6);
  g.lineStyle(1, CHICK_INK, 0.55);
  g.lineBetween(-8, 0, -13, -4);
  g.lineBetween(-8, 2, -14, 1);
  g.lineBetween(-7, 4, -12, 5);

  g.fillStyle(coat.body, 1);
  g.fillEllipse(0, 3, 15, 13);

  g.fillStyle(coat.wing, 1);
  g.lineStyle(1.25, CHICK_INK, 1);
  if (flap < 0.2) {
    g.fillEllipse(-5, 2, 6.2, 3.2);
    g.strokeEllipse(-5, 2, 6.2, 3.2);
  } else {
    const lift = flap * 12;
    g.fillStyle(coat.beak, 1);
    g.fillEllipse(-6.5, 5 - lift, 3.3, 11 + flap * 4);
    g.strokeEllipse(-6.5, 5 - lift, 3.3, 11 + flap * 4);
    g.fillStyle(coat.wing, 1);
    g.fillEllipse(-3.2, 6 - lift * 0.78, 2.6, 8 + flap * 3);
    g.strokeEllipse(-3.2, 6 - lift * 0.78, 2.6, 8 + flap * 3);
  }

  g.lineStyle(2, CHICK_INK, 1);
  g.strokeEllipse(0, 3, 15, 13);

  g.fillStyle(coat.body, 1);
  g.fillCircle(6, -5, 5.6);
  g.strokeCircle(6, -5, 5.6);
  g.fillStyle(coat.comb, 1);
  const comb = kind === 'rooster' ? 1.45 : kind === 'hen' ? 0.75 : 1;
  g.fillCircle(4.2, -10.2 - (kind === 'rooster' ? 1.4 : 0), 1.7 * comb);
  g.fillCircle(6.4, -11.4 - (kind === 'rooster' ? 2 : 0), 1.9 * comb);
  g.fillCircle(8.4, -10 - (kind === 'rooster' ? 1 : 0), 1.5 * comb);
  g.fillStyle(coat.beak, 1);
  g.fillEllipse(7.2, -1.2, 2.2, 2.6);

  g.fillStyle(CHICK_INK, 1);
  if (mood === 'gag') {
    g.fillTriangle(10, -4, 15, -1, 10, 1);
    g.lineStyle(2, CHICK_INK, 1);
    g.lineBetween(4.4, -6, 7.4, -6);
  } else {
    g.fillStyle(coat.beak, 1);
    g.fillTriangle(10.2, -6.2, 16, -5, 10.2, -3.4);
    g.lineStyle(1.5, CHICK_INK, 1);
    g.strokeTriangle(10.2, -6.2, 16, -5, 10.2, -3.4);
    g.fillStyle(CHICK_INK, 1);
    g.fillCircle(7.4, -5.6, mood === 'smitten' ? 1.15 : 0.95);
  }

  if (mood === 'smitten') {
    g.fillStyle(0xf0a0b0, 0.9);
    g.fillEllipse(3.2, -3, 2.6, 1.6);
    g.fillEllipse(9.2, -2.4, 2.4, 1.5);
  }

  g.lineStyle(1.5, CHICK_INK, 1);
  g.lineBetween(-2, 9, -3, 14);
  g.lineBetween(-3, 14, -6, 15);
  g.lineBetween(-3, 14, -1, 15);
  g.lineBetween(3, 9, 4, 14);
  g.lineBetween(4, 14, 2, 15);
  g.lineBetween(4, 14, 7, 15);

  if (kind === 'rooster') {
    g.lineStyle(1.4, coat.comb, 1);
    g.lineBetween(-9, 1, -16, -6);
    g.lineBetween(-9, 3, -17, 2);
    g.lineStyle(1.4, CHICK_INK, 1);
    g.lineBetween(5, 14, 8, 16);
    if (mood !== 'gag') {
      g.lineBetween(6.1, -7.2, 8.4, -6.3);
    }
  }
  drawKindTell(g, kind, mood);

  if (maxHp > 1) {
    for (let index = 0; index < maxHp; index += 1) {
      g.fillStyle(index < hp ? 0xb91c1c : 0xd9d3c7, 1);
      g.fillCircle(-((maxHp - 1) * 1.15) + index * 2.3, -15.5, 0.55);
    }
  }
}

function drawKindTell(
  g: Phaser.GameObjects.Graphics,
  kind: StampedeFlockKind,
  mood: 'chase' | 'smitten' | 'gag'
): void {
  if (kind === 'nerd' && mood !== 'gag') {
    g.lineStyle(1.2, CHICK_INK, 1);
    g.strokeCircle(6.1, -5.5, 2.2);
    g.strokeCircle(8.8, -5.3, 2.2);
    g.lineBetween(8.2, -5.4, 6.7, -5.4);
    g.fillStyle(0x4b4337, 1);
    g.fillRect(-1.5, 5, 4.2, 2.6);
  }
  if (kind === 'perfume') {
    g.fillStyle(0xf4a7c5, 0.9);
    g.fillCircle(13, -8, 1.4);
    g.fillCircle(15, -4, 1.1);
    g.lineStyle(1.2, 0xc45c8a, 1);
    g.strokeRect(11.2, 1, 2.4, 4.2);
  }
  if (kind === 'fixer') {
    g.lineStyle(1.4, 0xfbfbf9, 1);
    g.lineBetween(-1, 2, 2.2, 2);
    g.lineBetween(0.6, 0.4, 0.6, 3.6);
  }
  if (kind === 'situationship') {
    g.lineStyle(1.1, CHICK_INK, 0.75);
    g.strokeCircle(0, 2, 11);
    g.fillStyle(CHICK_INK, 1);
    g.fillCircle(5.5, -15.4, 0.7);
    g.lineBetween(5.5, -14.2, 5.5, -13.2);
  }
  if (kind === 'bartender') {
    g.lineStyle(1.5, CHICK_INK, 1);
    g.strokeRect(-3, 3, 6, 5);
    g.fillStyle(0xf0a202, 1);
    g.fillEllipse(-9, 1, 4.2, 3.2);
    g.strokeEllipse(-9, 1, 4.2, 3.2);
  }
}

function nearDistance(kind: StampedeFlockKind): number {
  if (kind === 'rooster') return 78;
  if (kind === 'perfume') return 56;
  if (kind === 'bartender') return 34;
  return 38;
}

function wobbleFor(kind: StampedeFlockKind): number {
  if (kind === 'rooster' || kind === 'bartender') return 0.15;
  if (kind === 'hen') return 1.45;
  if (kind === 'situationship') return 0.45;
  if (kind === 'nerd') return 0.6;
  return 1;
}

function kindScaleFor(kind: StampedeFlockKind): number {
  if (kind === 'rooster') return 1.12;
  if (kind === 'bartender') return 1.16;
  if (kind === 'hen') return 1.05;
  if (kind === 'fixer') return 1.04;
  return 1;
}

function heartingKind(kind: StampedeFlockKind): boolean {
  return kind !== 'rooster' && kind !== 'bartender' && kind !== 'situationship';
}

function heartGap(kind: StampedeFlockKind): number {
  if (kind === 'hen') return 1_600;
  if (kind === 'nerd') return 2_200;
  return 700;
}

function moveVector(
  kind: StampedeFlockKind,
  dx: number,
  dy: number,
  distance: number,
  nowMs: number,
  phase: number
): { x: number; y: number } {
  if (kind === 'situationship' && distance < 108) {
    return { x: -dx / distance, y: -dy / distance };
  }
  if (kind === 'situationship' && distance < 190) {
    const side = Math.sin(nowMs / 500 + phase) >= 0 ? 1 : -1;
    return { x: (-dy / distance) * side, y: (dx / distance) * side };
  }
  return { x: dx / distance, y: dy / distance };
}

function drawBeerMug(g: Phaser.GameObjects.Graphics): void {
  g.clear();
  g.fillStyle(0xf0a202, 1);
  g.fillEllipse(0, 0, 12, 9);
  g.lineStyle(1.8, CHICK_INK, 1);
  g.strokeEllipse(0, 0, 12, 9);
  g.fillStyle(0xfbfbf9, 0.95);
  g.fillEllipse(0, -2, 7, 3);
}

function drawResistMark(g: Phaser.GameObjects.Graphics): void {
  g.clear();
  g.lineStyle(2.2, CHICK_INK, 1);
  g.lineBetween(-5, -5, 5, 5);
  g.lineBetween(-5, 5, 5, -5);
}

function drawFeather(g: Phaser.GameObjects.Graphics, color: number): void {
  g.clear();
  g.fillStyle(color, 1);
  g.lineStyle(1.5, CHICK_INK, 0.8);
  g.fillEllipse(0, 0, 7, 13);
  g.strokeEllipse(0, 0, 7, 13);
  g.lineBetween(0, -5, 0, 5);
}

function drawInkHeart(g: Phaser.GameObjects.Graphics): void {
  g.clear();
  g.fillStyle(0xb4533d, 0.9);
  g.fillCircle(-3.2, -1, 3.1);
  g.fillCircle(3.2, -1, 3.1);
  g.fillTriangle(-6, 0, 6, 0, 0, 7);
}
