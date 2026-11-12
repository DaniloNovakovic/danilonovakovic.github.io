import * as Phaser from 'phaser';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import { STAMPEDE_WORLD, clampStampedePosition } from './movement';
import {
  getStampedeSwarmMotion,
  resolveStampedeSwarmTarget,
  type StampedeSwarmMotion
} from './swarmMotion';
import type { StampedeClearedMarkPoint } from './progression';
import { pickStampedeBark, stampedeBarkReadyAt } from './barks';
import {
  createBeerShot,
  stepBeerShots,
  STAMPEDE_BARTENDER_THROW_MS,
  type StampedeBeerShot
} from './beer';
import {
  getStampedeFlockProfile,
  pickStampedeSpawnKind,
  resolveStampedeMendTarget,
  type StampedeFlockKind
} from './flock';
import {
  pickStampedeSpawnPoint,
  stampedeFlockTarget,
  stampedeOvertimeToughness,
  stampedeSpawnGapMs,
  STAMPEDE_FLOCK_POOL_SIZE,
  type StampedeOvertimeToughness,
  type StampedeViewRect
} from './flockDirector';
import {
  EX_CHARGE,
  ROOSTER_CHARGE,
  STAMPEDE_CHARGE_STALK,
  stepStampedeCharge,
  type StampedeChargeState,
  type StampedeChargeTuning
} from './charge';
import {
  drawBeerMug,
  drawFeather,
  drawInkHeart,
  drawResistMark,
  drawStampedeBird,
  stampedeBirdPoseKey,
  stampedeFeatherColor,
  type StampedeBirdMood,
  type StampedeBirdPose
} from './flockArt';

export type StampedeSwarmMode = 'calm' | 'build' | 'surge' | 'recover';

export interface StampedeSwarmUpdateOptions {
  mode?: StampedeSwarmMode;
  pressure?: number;
  elapsedMs?: number;
  durationMs?: number;
  playerHurting?: boolean;
  lastCall?: boolean;
  /** Camera view in world space. Without it the swarm does not spawn. */
  view?: StampedeViewRect;
  /** Spawning stops after the run ends; birds still move. */
  spawning?: boolean;
}

export interface StampedeSwarmContactCandidate {
  id: string;
  x: number;
  y: number;
  radius: number;
  kind?: StampedeFlockKind;
}

export interface StampedeSwarmBeacon {
  x: number;
  y: number;
  kind: 'bartender' | 'ex';
}

interface StampedeSwarmRuntimeOptions {
  scene: Phaser.Scene;
}

export interface StampedeSwarmRuntime {
  update(target: { x: number; y: number }, delta: number, options?: StampedeSwarmUpdateOptions): void;
  getContactCandidates(): readonly StampedeSwarmContactCandidate[];
  getSpellCandidates(): readonly StampedeSwarmContactCandidate[];
  clearMarks(
    ids: readonly string[],
    ailment?: 'poison' | 'daze',
    dazeMs?: number
  ): readonly StampedeClearedMarkPoint[];
  dazeMarks(ids: readonly string[], dazeMs?: number): void;
  showResisted(ids: readonly string[]): void;
  /** Knocks a bird back after it pecks, so one bird cannot sit on the player. */
  bouncePecker(id: string, from: { x: number; y: number }): void;
  /** Every bird on the field runs away for a moment and cannot peck. */
  scatter(from: { x: number; y: number }, durationMs: number): void;
  spawnEx(view: StampedeViewRect, player: { x: number; y: number }, bonusHp?: number): void;
  getBeacons(): readonly StampedeSwarmBeacon[];
  consumeBeerHit(): boolean;
  reset(): void;
}

type BirdState = 'idle' | 'active' | 'dying';

interface FlockBird {
  id: string;
  body: Phaser.GameObjects.Graphics;
  shadow: Phaser.GameObjects.Ellipse;
  state: BirdState;
  kind: StampedeFlockKind;
  hp: number;
  maxHp: number;
  radius: number;
  speed: number;
  scrapValue: number;
  x: number;
  y: number;
  phase: number;
  facing: 1 | -1;
  mood: StampedeBirdMood;
  poseKey: string;
  spawnedAtMs: number;
  popIn: boolean;
  harmlessUntilMs: number;
  dyingUntilMs: number;
  flashUntilMs: number;
  poisonUntilMs: number;
  stunnedUntilMs: number;
  fleeUntilMs: number;
  fleeVx: number;
  fleeVy: number;
  knockVx: number;
  knockVy: number;
  nextHeartAtMs: number;
  nextTrickAtMs: number;
  nextBarkAtMs: number;
  charge: StampedeChargeState;
  throwAtMs: number | null;
}

interface FlockStep {
  target: { x: number; y: number };
  deltaSeconds: number;
  nowMs: number;
  mode: StampedeSwarmMode;
  pressure: number;
  motion: StampedeSwarmMotion;
  playerHurting: boolean;
}

const STAMPEDE_POP_IN_MS = 260;
const STAMPEDE_SPAWN_GRACE_MS = 420;
const STAMPEDE_PECK_RECOIL_MS = 900;
const STAMPEDE_DYING_MS = 200;
const OPENING_ON_PAGE_MS = 9_000;
const OPENING_INSET = 120;
const BARTENDER_RANGE = 440;
const BARTENDER_WINDUP_MS = 560;
const KNOCK_DECAY = 10;
const INK = 0x1a1a1a;
const WARN = 0xc0263b;

export function createStampedeSwarmRuntime(
  options: StampedeSwarmRuntimeOptions
): StampedeSwarmRuntime {
  return new PhaserStampedeSwarmRuntime(options.scene);
}

class PhaserStampedeSwarmRuntime implements StampedeSwarmRuntime {
  private readonly scene: Phaser.Scene;
  private readonly birds: FlockBird[];
  private readonly telegraphs: Phaser.GameObjects.Graphics;
  private readonly hearts: Phaser.GameObjects.Graphics[];
  private readonly feathers: Phaser.GameObjects.Graphics[];
  private readonly poofs: Phaser.GameObjects.Arc[];
  private readonly beerMugs: Phaser.GameObjects.Graphics[];
  private readonly resistMarks: Phaser.GameObjects.Graphics[];
  private readonly bark: Phaser.GameObjects.Text;
  private heartCursor = 0;
  private featherCursor = 0;
  private poofCursor = 0;
  private resistCursor = 0;
  private elapsedMs = 0;
  private lastPlayer = { x: 0, y: 0 };
  private nextSpawnAtMs = 0;
  private spawnCount = 0;
  private introduced = new Set<StampedeFlockKind>();
  private beers: StampedeBeerShot[] = [];
  private beerHit = false;
  private barkSpeakerId: string | null = null;
  private barkUntilMs = 0;
  private nextBarkGlobalAtMs = 0;
  private candidatesDirty = true;
  private contactCandidates: StampedeSwarmContactCandidate[] = [];
  private spellCandidates: StampedeSwarmContactCandidate[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.telegraphs = scene.add.graphics().setDepth(17);
    this.birds = Array.from({ length: STAMPEDE_FLOCK_POOL_SIZE + 1 }, (_, index) => ({
      id: `mark-${index + 1}`,
      body: scene.add.graphics().setVisible(false),
      shadow: scene.add.ellipse(0, 0, 20, 8, INK, 0.13).setDepth(15).setVisible(false),
      state: 'idle' as BirdState,
      kind: 'chick' as StampedeFlockKind,
      hp: 1,
      maxHp: 1,
      radius: 11,
      speed: 50,
      scrapValue: 1,
      x: 0,
      y: 0,
      phase: index * 0.7,
      facing: 1 as const,
      mood: 'chase' as StampedeBirdMood,
      poseKey: '',
      spawnedAtMs: 0,
      popIn: false,
      harmlessUntilMs: 0,
      dyingUntilMs: 0,
      flashUntilMs: 0,
      poisonUntilMs: 0,
      stunnedUntilMs: 0,
      fleeUntilMs: 0,
      fleeVx: 0,
      fleeVy: 0,
      knockVx: 0,
      knockVy: 0,
      nextHeartAtMs: 0,
      nextTrickAtMs: 0,
      nextBarkAtMs: Number.POSITIVE_INFINITY,
      charge: STAMPEDE_CHARGE_STALK,
      throwAtMs: null
    }));
    this.hearts = Array.from({ length: 10 }, () => {
      const heart = scene.add.graphics().setDepth(28).setVisible(false);
      drawInkHeart(heart);
      return heart;
    });
    this.feathers = Array.from({ length: 24 }, () =>
      scene.add.graphics().setDepth(27).setVisible(false)
    );
    this.poofs = Array.from({ length: 8 }, () =>
      scene.add.circle(0, 0, 10, 0xfbfbf9, 0)
        .setStrokeStyle(2.5, INK, 0.8)
        .setDepth(26)
        .setVisible(false)
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
    this.bark = createUiText(scene, 0, 0, '', {
      fontSize: '13px',
      color: '#1a1a1a',
      fontStyle: 'bold',
      backgroundColor: '#fbfbf9',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5, 1).setDepth(33).setVisible(false);
  }

  update(
    target: { x: number; y: number },
    delta: number,
    options: StampedeSwarmUpdateOptions = {}
  ): void {
    const nowMs = this.scene.time.now;
    this.elapsedMs = options.elapsedMs ?? this.elapsedMs;
    this.lastPlayer = target;
    const pressure = Phaser.Math.Clamp(options.pressure ?? 0, 0, 1);
    const mode = options.mode ?? 'calm';
    const step: FlockStep = {
      target,
      deltaSeconds: delta / 1000,
      nowMs,
      mode,
      pressure,
      motion: getStampedeSwarmMotion(mode, pressure),
      playerHurting: options.playerHurting ?? false
    };

    if (options.view && options.spawning !== false) {
      this.directSpawns(options, target, nowMs);
    }
    this.birds.forEach((bird) => this.stepBird(bird, step));
    this.separate();
    this.telegraphs.clear();
    this.birds.forEach((bird) => this.syncBird(bird, nowMs));
    this.stepBeers(delta, nowMs, target);
    this.maybeBark(nowMs, target);
    this.candidatesDirty = true;
  }

  getContactCandidates(): readonly StampedeSwarmContactCandidate[] {
    this.refreshCandidates();
    return this.contactCandidates;
  }

  getSpellCandidates(): readonly StampedeSwarmContactCandidate[] {
    this.refreshCandidates();
    return this.spellCandidates;
  }

  getBeacons(): readonly StampedeSwarmBeacon[] {
    const beacons: StampedeSwarmBeacon[] = [];
    this.birds.forEach((bird) => {
      if (bird.state !== 'active') return;
      if (bird.kind === 'bartender' || bird.kind === 'ex') {
        beacons.push({ x: bird.x, y: bird.y, kind: bird.kind });
      }
    });
    return beacons;
  }

  showResisted(ids: readonly string[]): void {
    const now = this.scene.time.now;
    this.forEachActive(ids, (bird) => {
      bird.flashUntilMs = now + 90;
      this.popResist(bird.x, bird.y - bird.radius - 14);
    });
  }

  consumeBeerHit(): boolean {
    const hit = this.beerHit;
    this.beerHit = false;
    return hit;
  }

  dazeMarks(ids: readonly string[], dazeMs = 880): void {
    const now = this.scene.time.now;
    this.forEachActive(ids, (bird) => {
      bird.stunnedUntilMs = Math.max(bird.stunnedUntilMs, now + dazeMs);
      cancelCharge(bird);
    });
  }

  private forEachActive(ids: readonly string[], visit: (bird: FlockBird) => void): void {
    ids.forEach((id) => {
      const bird = this.findActive(id);
      if (bird) visit(bird);
    });
  }

  bouncePecker(id: string, from: { x: number; y: number }): void {
    const bird = this.findActive(id);
    if (!bird) return;
    const push = awayFrom(bird, from);
    bird.knockVx = push.x * 380;
    bird.knockVy = push.y * 380;
    bird.harmlessUntilMs = this.scene.time.now + STAMPEDE_PECK_RECOIL_MS;
    cancelCharge(bird);
    this.candidatesDirty = true;
  }

  scatter(from: { x: number; y: number }, durationMs: number): void {
    const now = this.scene.time.now;
    this.birds.forEach((bird) => {
      if (bird.state !== 'active') return;
      const push = awayFrom(bird, from);
      bird.fleeUntilMs = now + durationMs;
      bird.fleeVx = push.x * 190;
      bird.fleeVy = push.y * 190;
      cancelCharge(bird);
    });
    this.candidatesDirty = true;
  }

  spawnEx(view: StampedeViewRect, player: { x: number; y: number }, bonusHp = 0): void {
    const bird = this.birds.find((entry) => entry.state === 'idle');
    if (!bird) return;
    const point = pickStampedeSpawnPoint(view, STAMPEDE_WORLD, player);
    this.activate(bird, 'ex', point, false, { speedScale: 1, bonusHp });
  }

  clearMarks(
    ids: readonly string[],
    ailment?: 'poison' | 'daze',
    dazeMs = 880
  ): readonly StampedeClearedMarkPoint[] {
    if (ids.length === 0) return [];
    const cleared: StampedeClearedMarkPoint[] = [];
    ids.forEach((id) => {
      const bird = this.findActive(id);
      if (!bird) return;
      const mark = this.woundBird(bird, ailment, dazeMs);
      if (mark) cleared.push(mark);
    });
    return cleared;
  }

  reset(): void {
    this.elapsedMs = 0;
    this.nextSpawnAtMs = 0;
    this.spawnCount = 0;
    this.introduced = new Set();
    this.birds.forEach((bird) => this.retire(bird));
    this.telegraphs.clear();
    [...this.hearts, ...this.feathers, ...this.resistMarks].forEach((item) => {
      this.scene.tweens.killTweensOf(item);
      item.setVisible(false);
    });
    this.poofs.forEach((poof) => {
      this.scene.tweens.killTweensOf(poof);
      poof.setVisible(false);
    });
    this.beers = [];
    this.beerHit = false;
    this.beerMugs.forEach((mug) => mug.setVisible(false));
    this.bark.setVisible(false);
    this.barkSpeakerId = null;
    this.barkUntilMs = 0;
    this.nextBarkGlobalAtMs = 0;
    this.candidatesDirty = true;
  }

  private directSpawns(
    options: StampedeSwarmUpdateOptions,
    player: { x: number; y: number },
    nowMs: number
  ): void {
    const view = options.view;
    if (!view || nowMs < this.nextSpawnAtMs) return;
    const durationMs = options.durationMs ?? 150_000;
    const surge = options.mode === 'surge';
    const counts: Partial<Record<StampedeFlockKind, number>> = {};
    let active = 0;
    this.birds.forEach((bird) => {
      if (bird.state !== 'active' || bird.kind === 'ex') return;
      counts[bird.kind] = (counts[bird.kind] ?? 0) + 1;
      active += 1;
    });
    const wanted = stampedeFlockTarget({
      elapsedMs: this.elapsedMs,
      durationMs,
      surge,
      lastCall: options.lastCall
    });
    if (active >= wanted) return;
    const bird = this.birds.find((entry) => entry.state === 'idle');
    if (!bird) return;

    const kind = pickStampedeSpawnKind(this.elapsedMs, counts, this.introduced);
    const onPage = this.elapsedMs < OPENING_ON_PAGE_MS;
    const spawnView = onPage ? insetView(view, OPENING_INSET) : view;
    const point = pickStampedeSpawnPoint(spawnView, STAMPEDE_WORLD, player);
    this.activate(bird, kind, point, onPage, stampedeOvertimeToughness(this.elapsedMs, durationMs));
    this.introduced.add(kind);
    this.spawnCount += 1;
    this.nextSpawnAtMs = nowMs + stampedeSpawnGapMs(this.elapsedMs, durationMs, surge);
  }

  private activate(
    bird: FlockBird,
    kind: StampedeFlockKind,
    point: { x: number; y: number },
    popIn: boolean,
    toughness: StampedeOvertimeToughness
  ): void {
    const profile = getStampedeFlockProfile(kind);
    const now = this.scene.time.now;
    bird.state = 'active';
    bird.kind = kind;
    bird.hp = profile.maxHp + toughness.bonusHp;
    bird.maxHp = bird.hp;
    bird.radius = profile.radius;
    bird.speed = profile.speed * toughness.speedScale * (0.85 + Math.random() * 0.3);
    bird.scrapValue = profile.scrapValue;
    bird.x = point.x;
    bird.y = point.y;
    bird.phase = Math.random() * Math.PI * 2;
    bird.mood = 'chase';
    bird.poseKey = '';
    bird.spawnedAtMs = now;
    bird.popIn = popIn;
    bird.harmlessUntilMs = popIn ? now + STAMPEDE_SPAWN_GRACE_MS : 0;
    bird.flashUntilMs = 0;
    bird.poisonUntilMs = 0;
    bird.stunnedUntilMs = 0;
    bird.fleeUntilMs = 0;
    bird.knockVx = 0;
    bird.knockVy = 0;
    bird.nextHeartAtMs = 0;
    bird.nextTrickAtMs = now + 900;
    bird.nextBarkAtMs = stampedeBarkReadyAt(kind, now);
    bird.charge = STAMPEDE_CHARGE_STALK;
    bird.throwAtMs = null;
    bird.body.setVisible(true).setAlpha(1).setAngle(0);
    bird.shadow.setSize(profile.radius * 2.1, profile.radius * 0.7).setVisible(true).setAlpha(1);
    if (popIn) this.poof(point.x, point.y, profile.radius);
    this.candidatesDirty = true;
  }

  private retire(bird: FlockBird): void {
    bird.state = 'idle';
    bird.body.setVisible(false);
    bird.shadow.setVisible(false);
    if (this.barkSpeakerId === bird.id) {
      this.bark.setVisible(false);
      this.barkSpeakerId = null;
    }
  }

  private woundBird(
    bird: FlockBird,
    ailment: 'poison' | 'daze' | undefined,
    dazeMs: number
  ): StampedeClearedMarkPoint | null {
    const now = this.scene.time.now;
    bird.hp -= 1;
    bird.flashUntilMs = now + 110;
    if (ailment === 'poison') bird.poisonUntilMs = now + 900;
    if (ailment === 'daze' && bird.hp > 0) {
      bird.stunnedUntilMs = now + dazeMs;
      cancelCharge(bird);
    }
    if (bird.hp > 0 && bird.kind !== 'ex' && bird.charge.phase !== 'dash') {
      const push = awayFrom(bird, this.lastPlayer);
      bird.knockVx = push.x * 170;
      bird.knockVy = push.y * 170;
    }
    this.burstFeathers(bird.x, bird.y, stampedeFeatherColor(bird.kind), bird.hp > 0 ? 1 : 4);
    if (bird.hp > 0) return null;

    bird.state = 'dying';
    bird.dyingUntilMs = now + STAMPEDE_DYING_MS;
    this.poof(bird.x, bird.y, bird.radius);
    this.popHeart(bird.x, bird.y - bird.radius - 6);
    this.candidatesDirty = true;
    return {
      id: bird.id,
      x: bird.x,
      y: bird.y,
      value: bird.scrapValue,
      kind: bird.kind
    };
  }

  private stepBird(bird: FlockBird, step: FlockStep): void {
    if (bird.state === 'idle') return;
    if (bird.state === 'dying') {
      if (step.nowMs >= bird.dyingUntilMs) this.retire(bird);
      return;
    }

    this.steerBird(bird, step);
    applyKnockback(bird, step.deltaSeconds);
  }

  private steerBird(bird: FlockBird, step: FlockStep): void {
    if (step.nowMs < bird.stunnedUntilMs) {
      bird.mood = 'gag';
      return;
    }
    if (step.nowMs < bird.fleeUntilMs) {
      bird.x += bird.fleeVx * step.deltaSeconds;
      bird.y += bird.fleeVy * step.deltaSeconds;
      bird.mood = 'gag';
      bird.facing = bird.fleeVx >= 0 ? 1 : -1;
      return;
    }
    switch (bird.kind) {
      case 'bartender':
        this.stepBartender(bird, step);
        return;
      case 'rooster':
        this.stepCharger(bird, step, ROOSTER_CHARGE);
        return;
      case 'ex':
        this.stepCharger(bird, step, EX_CHARGE);
        return;
      default:
        this.stepChaser(bird, step);
    }
  }

  private stepChaser(bird: FlockBird, step: FlockStep): void {
    const aim = chaserAim(bird, step);
    const dx = aim.x - bird.x;
    const dy = aim.y - bird.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const toPlayer = Math.hypot(step.target.x - bird.x, step.target.y - bird.y);
    const move = moveVector(bird.kind, dx, dy, distance, toPlayer, step.nowMs, bird.phase);
    const hurry = bird.kind === 'fixer' && step.playerHurting ? 1.45 : 1;
    const pace = bird.speed * hurry * step.motion.speedMultiplier * step.deltaSeconds;
    const wobble = Math.sin(step.nowMs / 300 + bird.phase) * 14 * step.deltaSeconds;
    bird.x += move.x * Math.min(pace, distance) - move.y * wobble;
    bird.y += move.y * Math.min(pace, distance) + move.x * wobble;
    bird.facing = step.target.x - bird.x >= 0 ? 1 : -1;
    this.swoon(bird, toPlayer, step.nowMs);
    if (bird.kind === 'fixer') this.tryMend(bird, step.nowMs);
  }

  private swoon(bird: FlockBird, toPlayer: number, nowMs: number): void {
    const smitten = toPlayer < bird.radius + 60 && heartingKind(bird.kind);
    bird.mood = smitten ? 'smitten' : 'chase';
    if (!smitten || nowMs < bird.nextHeartAtMs) return;
    bird.nextHeartAtMs = nowMs + (bird.kind === 'hen' ? 1_600 : 900) + bird.phase * 60;
    this.popHeart(bird.x, bird.y - bird.radius - 8);
  }

  private stepCharger(bird: FlockBird, step: FlockStep, tuning: StampedeChargeTuning): void {
    const dx = step.target.x - bird.x;
    const dy = step.target.y - bird.y;
    bird.charge = stepStampedeCharge(bird.charge, { nowMs: step.nowMs, dx, dy }, tuning);
    bird.mood = 'chase';
    switch (bird.charge.phase) {
      case 'stalk': {
        const distance = Math.max(1, Math.hypot(dx, dy));
        const pace = bird.speed * step.motion.speedMultiplier * step.deltaSeconds;
        bird.x += (dx / distance) * pace;
        bird.y += (dy / distance) * pace;
        bird.facing = dx >= 0 ? 1 : -1;
        return;
      }
      case 'windup':
        bird.facing = bird.charge.dirX >= 0 ? 1 : -1;
        return;
      case 'dash':
        bird.x += bird.charge.dirX * tuning.dashSpeed * step.deltaSeconds;
        bird.y += bird.charge.dirY * tuning.dashSpeed * step.deltaSeconds;
        bird.facing = bird.charge.dirX >= 0 ? 1 : -1;
        return;
      case 'rest': {
        const distance = Math.max(1, Math.hypot(dx, dy));
        const pace = bird.speed * 0.3 * step.deltaSeconds;
        bird.x += (dx / distance) * pace;
        bird.y += (dy / distance) * pace;
        bird.mood = 'gag';
      }
    }
  }

  private stepBartender(bird: FlockBird, step: FlockStep): void {
    const dx = step.target.x - bird.x;
    const dy = step.target.y - bird.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    bird.facing = dx >= 0 ? 1 : -1;
    bird.mood = 'chase';

    if (bird.throwAtMs !== null) {
      if (step.nowMs < bird.throwAtMs) return;
      bird.throwAtMs = null;
      bird.nextTrickAtMs = step.nowMs + STAMPEDE_BARTENDER_THROW_MS;
      if (this.beers.length < this.beerMugs.length) {
        this.beers.push(createBeerShot({ x: bird.x, y: bird.y - bird.radius }, step.target, step.nowMs));
      }
      return;
    }

    const keep = distance > 300 ? 1 : distance < 200 ? -1 : 0;
    const sway = Math.sin(step.nowMs / 900 + bird.phase);
    const pace = bird.speed * step.deltaSeconds;
    bird.x += ((dx / distance) * keep - (dy / distance) * sway * 0.6) * pace;
    bird.y += ((dy / distance) * keep + (dx / distance) * sway * 0.6) * pace;

    if (step.nowMs >= bird.nextTrickAtMs && distance <= BARTENDER_RANGE) {
      bird.throwAtMs = step.nowMs + BARTENDER_WINDUP_MS;
    }
  }

  private separate(): void {
    const birds = this.birds;
    for (let i = 0; i < birds.length; i += 1) {
      const a = birds[i]!;
      if (a.state !== 'active') continue;
      for (let j = i + 1; j < birds.length; j += 1) {
        const b = birds[j]!;
        if (b.state === 'active') pushApart(a, b);
      }
    }
  }

  private syncBird(bird: FlockBird, nowMs: number): void {
    if (bird.state === 'idle') return;
    if (bird.state === 'dying') {
      syncDyingBird(bird, nowMs);
      return;
    }

    const pose = birdPose(bird, nowMs);
    const key = stampedeBirdPoseKey(pose);
    if (key !== bird.poseKey) {
      bird.poseKey = key;
      drawStampedeBird(bird.body, pose);
    }
    placeBird(bird, nowMs, pose);

    if (bird.charge.phase === 'windup') this.drawChargeLane(bird, nowMs);
    if (bird.throwAtMs !== null) this.drawThrowWarning(bird, nowMs);
  }

  private drawChargeLane(bird: FlockBird, nowMs: number): void {
    if (bird.charge.phase !== 'windup') return;
    const tuning = bird.kind === 'ex' ? EX_CHARGE : ROOSTER_CHARGE;
    const length = tuning.dashSpeed * (tuning.dashMs / 1000);
    const { dirX, dirY } = bird.charge;
    const sideX = -dirY * bird.radius;
    const sideY = dirX * bird.radius;
    const progress = 1 - Math.max(0, (bird.charge.untilMs - nowMs) / tuning.windupMs);
    this.telegraphs.fillStyle(WARN, 0.08 + progress * 0.14);
    this.telegraphs.fillPoints([
      new Phaser.Math.Vector2(bird.x + sideX, bird.y + sideY),
      new Phaser.Math.Vector2(bird.x + dirX * length + sideX, bird.y + dirY * length + sideY),
      new Phaser.Math.Vector2(bird.x + dirX * length - sideX, bird.y + dirY * length - sideY),
      new Phaser.Math.Vector2(bird.x - sideX, bird.y - sideY)
    ], true);
    this.telegraphs.lineStyle(2, WARN, 0.55 + progress * 0.4);
    for (let along = 0; along < length; along += 18) {
      const end = Math.min(length, along + 10);
      [1, -1].forEach((side) => {
        this.telegraphs.lineBetween(
          bird.x + dirX * along + sideX * side,
          bird.y + dirY * along + sideY * side,
          bird.x + dirX * end + sideX * side,
          bird.y + dirY * end + sideY * side
        );
      });
    }
  }

  private drawThrowWarning(bird: FlockBird, nowMs: number): void {
    if (bird.throwAtMs === null) return;
    const progress = 1 - Math.max(0, (bird.throwAtMs - nowMs) / BARTENDER_WINDUP_MS);
    this.telegraphs.lineStyle(2.4, WARN, 0.4 + progress * 0.5);
    this.telegraphs.strokeCircle(bird.x, bird.y, bird.radius + 6 + (1 - progress) * 14);
  }

  private stepBeers(deltaMs: number, nowMs: number, player: { x: number; y: number }): void {
    const stepped = stepBeerShots(this.beers, deltaMs, nowMs, {
      x: player.x,
      y: player.y,
      radius: 16
    });
    this.beers = stepped.shots;
    if (stepped.hit) this.beerHit = true;
    this.beerMugs.forEach((mug, index) => {
      const shot = this.beers[index];
      if (!shot) {
        mug.setVisible(false);
        return;
      }
      mug.setPosition(shot.x, shot.y).setAngle((nowMs / 3) % 360).setVisible(true);
    });
  }

  private tryMend(bird: FlockBird, nowMs: number): void {
    if (nowMs < bird.nextTrickAtMs) return;
    const targetId = resolveStampedeMendTarget(
      { id: bird.id, x: bird.x, y: bird.y },
      this.birds.map((other) => ({
        id: other.id,
        x: other.x,
        y: other.y,
        hp: other.hp,
        maxHp: other.maxHp,
        alive: other.state === 'active' && Math.hypot(other.x - bird.x, other.y - bird.y) < 220
      }))
    );
    bird.nextTrickAtMs = nowMs + (targetId ? 2_400 : 700);
    if (!targetId) return;
    const other = this.findActive(targetId);
    if (!other) return;
    other.hp = Math.min(other.maxHp, other.hp + 1);
    this.popHeart(other.x, other.y - other.radius - 8);
  }

  private refreshCandidates(): void {
    if (!this.candidatesDirty) return;
    this.candidatesDirty = false;
    const now = this.scene.time.now;
    this.contactCandidates = [];
    this.spellCandidates = [];
    this.birds.forEach((bird) => {
      if (bird.state !== 'active') return;
      const candidate = { id: bird.id, x: bird.x, y: bird.y, radius: bird.radius, kind: bird.kind };
      this.spellCandidates.push(candidate);
      if (now >= bird.fleeUntilMs && now >= bird.harmlessUntilMs) {
        this.contactCandidates.push(candidate);
      }
    });
  }

  private findActive(id: string): FlockBird | undefined {
    return this.birds.find((bird) => bird.id === id && bird.state === 'active');
  }

  private poof(x: number, y: number, radius: number): void {
    const poof = this.poofs[this.poofCursor];
    if (!poof) return;
    this.poofCursor = (this.poofCursor + 1) % this.poofs.length;
    this.scene.tweens.killTweensOf(poof);
    poof.setPosition(x, y).setRadius(radius).setScale(0.8).setAlpha(0.9).setVisible(true);
    this.scene.tweens.add({
      targets: poof,
      scale: 2.2,
      alpha: 0,
      duration: 320,
      ease: 'Sine.easeOut',
      onComplete: () => poof.setVisible(false)
    });
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

  private burstFeathers(x: number, y: number, color: number, count: number): void {
    for (let index = 0; index < count; index += 1) {
      const feather = this.feathers[this.featherCursor];
      if (!feather) return;
      this.featherCursor = (this.featherCursor + 1) % this.feathers.length;
      drawFeather(feather, color);
      const angle = (index / Math.max(1, count)) * Math.PI * 2 + Math.random();
      this.scene.tweens.killTweensOf(feather);
      feather.setPosition(x, y).setScale(1.4).setAlpha(1).setAngle(angle * 57).setVisible(true);
      this.scene.tweens.add({
        targets: feather,
        x: x + Math.cos(angle) * 30,
        y: y + Math.sin(angle) * 22 - 14,
        angle: angle * 57 + 160,
        alpha: 0,
        duration: 520,
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
      scale: 1.3,
      duration: 480,
      ease: 'Sine.easeOut',
      onComplete: () => heart.setVisible(false)
    });
  }

  private maybeBark(nowMs: number, focus: { x: number; y: number }): void {
    if (this.barkSpeakerId && nowMs < this.barkUntilMs) {
      const speaker = this.findActive(this.barkSpeakerId);
      if (!speaker) {
        this.bark.setVisible(false);
        this.barkSpeakerId = null;
        return;
      }
      this.bark.setPosition(speaker.x, speaker.y - speaker.radius * 2 - 14);
      return;
    }

    this.bark.setVisible(false);
    const pick = pickStampedeBark(
      this.birds
        .filter((bird) => (
          bird.state === 'active'
          && nowMs >= bird.nextBarkAtMs
          && nowMs >= bird.stunnedUntilMs
          && Math.hypot(bird.x - focus.x, bird.y - focus.y) < 460
        ))
        .map((bird) => ({ id: bird.id, kind: bird.kind, x: bird.x, y: bird.y })),
      nowMs,
      this.nextBarkGlobalAtMs,
      focus
    );
    if (!pick) return;
    const speaker = this.findActive(pick.id);
    if (!speaker) return;
    speaker.nextBarkAtMs = nowMs + 8_000;
    this.nextBarkGlobalAtMs = pick.nextBarkAtMs;
    this.barkSpeakerId = pick.id;
    this.barkUntilMs = nowMs + 1_400;
    this.bark
      .setText(pick.line)
      .setPosition(speaker.x, speaker.y - speaker.radius * 2 - 14)
      .setVisible(true);
  }
}

function cancelCharge(bird: FlockBird): void {
  if (bird.charge.phase === 'windup' || bird.charge.phase === 'dash') {
    bird.charge = STAMPEDE_CHARGE_STALK;
  }
  bird.throwAtMs = null;
}

function awayFrom(bird: { x: number; y: number }, from: { x: number; y: number }): { x: number; y: number } {
  const dx = bird.x - from.x;
  const dy = bird.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.5) return { x: 1, y: 0 };
  return { x: dx / distance, y: dy / distance };
}

function applyKnockback(bird: FlockBird, deltaSeconds: number): void {
  const decay = Math.exp(-KNOCK_DECAY * deltaSeconds);
  bird.x += bird.knockVx * deltaSeconds;
  bird.y += bird.knockVy * deltaSeconds;
  bird.knockVx *= decay;
  bird.knockVy *= decay;
  const clamped = clampStampedePosition(bird);
  bird.x = clamped.x;
  bird.y = clamped.y;
}

/** Perfume circles wide, the fixer beelines, everyone else drifts around the player a little. */
function chaserOrbitWeight(kind: StampedeFlockKind): number {
  if (kind === 'perfume') return 1.4;
  if (kind === 'fixer') return 0;
  return 0.5;
}

function chaserAim(bird: FlockBird, step: FlockStep): { x: number; y: number } {
  const amount = chaserOrbitWeight(bird.kind);
  if (amount === 0) return step.target;
  const orbit = resolveStampedeSwarmTarget({
    target: step.target,
    phase: bird.phase,
    mode: step.mode,
    pressure: step.pressure,
    nowMs: step.nowMs
  });
  return {
    x: step.target.x + (orbit.x - step.target.x) * amount,
    y: step.target.y + (orbit.y - step.target.y) * amount
  };
}

/** Charging birds and the ex shove through the crowd instead of being shoved. */
function isHeavy(bird: FlockBird): boolean {
  return bird.kind === 'ex' || bird.charge.phase === 'dash';
}

function pushApart(a: FlockBird, b: FlockBird): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const min = (a.radius + b.radius) * 1.05;
  const distSq = dx * dx + dy * dy;
  if (distSq >= min * min || distSq < 0.0001) return;
  const dist = Math.sqrt(distSq);
  const push = (min - dist) * 0.5;
  const aHeavy = isHeavy(a);
  const bHeavy = isHeavy(b);
  const aShare = aHeavy === bHeavy ? 1 : aHeavy ? 0 : 2;
  const bShare = 2 - aShare;
  a.x -= (dx / dist) * push * aShare;
  a.y -= (dy / dist) * push * aShare;
  b.x += (dx / dist) * push * bShare;
  b.y += (dy / dist) * push * bShare;
}

function syncDyingBird(bird: FlockBird, nowMs: number): void {
  const left = Math.max(0, (bird.dyingUntilMs - nowMs) / STAMPEDE_DYING_MS);
  bird.body.setScale(bird.facing * left, left).setAlpha(left);
  bird.shadow.setAlpha(left);
}

function birdPose(bird: FlockBird, nowMs: number): StampedeBirdPose {
  const stunned = nowMs < bird.stunnedUntilMs;
  const windup = bird.charge.phase === 'windup' || bird.throwAtMs !== null;
  const poisoned = nowMs < bird.poisonUntilMs;
  const flapStep = isBirdMoving(bird, nowMs)
    ? (Math.floor(nowMs / 90 + bird.phase * 3) % 3) as 0 | 1 | 2
    : 0;
  return {
    kind: bird.kind,
    radius: bird.radius,
    mood: bird.mood,
    flapStep,
    hp: bird.hp,
    maxHp: bird.maxHp,
    poisoned,
    poisonFlash: poisoned && Math.floor(nowMs / 120) % 2 === 0,
    dazed: stunned,
    flash: nowMs < bird.flashUntilMs,
    windup
  };
}

function isBirdMoving(bird: FlockBird, nowMs: number): boolean {
  return nowMs >= bird.stunnedUntilMs
    && bird.throwAtMs === null
    && bird.charge.phase !== 'windup'
    && bird.charge.phase !== 'rest';
}

function placeBird(bird: FlockBird, nowMs: number, pose: StampedeBirdPose): void {
  const moving = isBirdMoving(bird, nowMs);
  const pop = bird.popIn ? Math.min(1, (nowMs - bird.spawnedAtMs) / STAMPEDE_POP_IN_MS) : 1;
  const popScale = pop < 1 ? Phaser.Math.Easing.Back.Out(pop) : 1;
  const hop = moving ? -Math.abs(Math.sin(nowMs / 110 + bird.phase)) * 3 : 0;
  const shake = pose.windup ? Math.sin(nowMs / 24) * 2 : 0;
  bird.body
    .setPosition(bird.x + shake, bird.y + hop)
    .setScale(bird.facing * popScale, popScale)
    .setAngle(birdTilt(bird, nowMs, pose.dazed, moving))
    .setAlpha(nowMs < bird.fleeUntilMs ? 0.55 : 1)
    .setDepth(20 + bird.y / 10_000);
  bird.shadow
    .setPosition(bird.x, bird.y + bird.radius * 1.2)
    .setScale(popScale);
}

function birdTilt(bird: FlockBird, nowMs: number, dazed: boolean, moving: boolean): number {
  if (dazed) return Math.sin(nowMs / 70 + bird.phase) * 14;
  return moving ? Math.sin(nowMs / 140 + bird.phase) * 6 : 0;
}

function insetView(view: StampedeViewRect, inset: number): StampedeViewRect {
  return {
    x: view.x + inset,
    y: view.y + inset,
    width: Math.max(0, view.width - inset * 2),
    height: Math.max(0, view.height - inset * 2)
  };
}

function heartingKind(kind: StampedeFlockKind): boolean {
  return kind === 'chick' || kind === 'hen' || kind === 'nerd' || kind === 'perfume' || kind === 'fixer';
}

function moveVector(
  kind: StampedeFlockKind,
  dx: number,
  dy: number,
  distance: number,
  toPlayer: number,
  nowMs: number,
  phase: number
): { x: number; y: number } {
  if (kind === 'situationship' && toPlayer < 96) {
    return { x: -dx / distance, y: -dy / distance };
  }
  if (kind === 'situationship' && toPlayer < 180) {
    const side = Math.sin(nowMs / 500 + phase) >= 0 ? 1 : -1;
    return { x: (-dy / distance) * side, y: (dx / distance) * side };
  }
  return { x: dx / distance, y: dy / distance };
}
