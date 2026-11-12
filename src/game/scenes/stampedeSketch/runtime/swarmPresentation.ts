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
  resolveBoyfriendJokeOutcome,
  STAMPEDE_JOKE_DAMAGE,
  STAMPEDE_JOKE_BUBBLE_MS,
  STAMPEDE_JOKE_DAZE_MS,
  STAMPEDE_JOKE_EX_DAZE_MS
} from './dadJoke';
import {
  befriendBrad,
  bradComboTuning,
  confuseBrad,
  createBradBrain,
  isBradFriendly,
  stepBradBrain,
  type BradAction,
  type BradBrain,
  type BradLane
} from './boyfriend';
import {
  createShakerShot,
  puddleSlowFactor,
  shakerPosition,
  STAMPEDE_PUDDLE_RADIUS,
  stepShakers,
  type StampedePuddle,
  type StampedeShakerShot
} from './shaker';
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
  drawProteinShaker,
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
  kind: 'bartender' | 'ex' | 'boyfriend';
}

/** Things the scene reacts to, collected during a swarm update. */
export interface StampedeSwarmEvents {
  /** Hearts popped by birds swooning over the player; they make Brad jealous. */
  swoonHearts: number;
  /** Birds cleared by the swarm itself (Brad as a wingman). */
  cleared: StampedeClearedMarkPoint[];
  /** A one-off push on the player (Brad's flex). */
  shove: { x: number; y: number } | null;
  befriended: { x: number; y: number }[];
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
  /** Dad joke: heavy hit on each bird, survivors left dazed. */
  jokeHit(ids: readonly string[]): readonly StampedeClearedMarkPoint[];
  /** Dad joke on Brad: confused while fresh, a wingman once worn down. */
  jokeBoyfriend(ids: readonly string[]): void;
  spawnEx(view: StampedeViewRect, player: { x: number; y: number }, bonusHp?: number): void;
  spawnBoyfriend(view: StampedeViewRect, player: { x: number; y: number }, bonusHp?: number): void;
  isOnField(kind: 'ex' | 'boyfriend'): boolean;
  /** 1 normally, lower while the player stands in a shaker puddle. */
  playerSlowFactor(player: { x: number; y: number }): number;
  getBeacons(): readonly StampedeSwarmBeacon[];
  consumeBeerHit(): boolean;
  consumeEvents(): StampedeSwarmEvents;
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
  /** Only Brad has one. */
  brad: BradBrain | null;
  /** Id of the Brad this bird shields, with its spot on the ring. */
  escortOf: string | null;
  escortSlot: number;
  /** Out of the fight: following a friendly Brad, or walking off the page. */
  calm: 'none' | 'tagalong' | 'leaving';
  leaveUntilMs: number;
  nextAllyHitAtMs: number;
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
const BRAD_ESCORTS = 3;
const BRAD_FLEX_REACH = 260;
const BRAD_FLEX_SHOVE = 560;
const BRAD_WINGMAN_REACH = 240;
const BRAD_WINGMAN_SPEED = 260;
const BRAD_WINGMAN_EVERY_MS = 1_200;
const BRAD_LEAVE_MS = 5_000;
const LEAVE_FADE_MS = 1_000;
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
  private readonly shakerSprites: Phaser.GameObjects.Graphics[];
  private shakers: StampedeShakerShot[] = [];
  private puddles: StampedePuddle[] = [];
  private events: StampedeSwarmEvents = EMPTY_EVENTS;
  private barkSpeakerId: string | null = null;
  private barkUntilMs = 0;
  private pendingLine: { birdId: string; line: string; durationMs: number; atMs: number } | null = null;
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
      throwAtMs: null,
      brad: null,
      escortOf: null,
      escortSlot: 0,
      calm: 'none' as const,
      leaveUntilMs: 0,
      nextAllyHitAtMs: 0
    }));
    this.shakerSprites = Array.from({ length: 3 }, () => {
      const shaker = scene.add.graphics().setDepth(26).setVisible(false);
      drawProteinShaker(shaker);
      return shaker;
    });
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
    this.syncShakers(nowMs);
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
      if (bird.state !== 'active' || isOutOfFight(bird)) return;
      if (bird.kind === 'bartender' || bird.kind === 'ex' || bird.kind === 'boyfriend') {
        beacons.push({ x: bird.x, y: bird.y, kind: bird.kind });
      }
    });
    return beacons;
  }

  isOnField(kind: 'ex' | 'boyfriend'): boolean {
    return this.birds.some((bird) => bird.state === 'active' && bird.kind === kind);
  }

  playerSlowFactor(player: { x: number; y: number }): number {
    return puddleSlowFactor(this.puddles, player);
  }

  consumeEvents(): StampedeSwarmEvents {
    const events = this.events;
    if (events !== EMPTY_EVENTS) this.events = EMPTY_EVENTS;
    return events;
  }

  spawnBoyfriend(view: StampedeViewRect, player: { x: number; y: number }, bonusHp = 0): void {
    const bird = this.spawnBoss('boyfriend', view, player, bonusHp);
    if (bird) this.say(bird, "Who's this guy?", 2_000);
  }

  jokeBoyfriend(ids: readonly string[]): void {
    const now = this.scene.time.now;
    this.forEachActive(ids, (bird) => {
      if (!bird.brad || isBradFriendly(bird.brad)) return;
      if (resolveBoyfriendJokeOutcome(bird.hp, bird.maxHp) === 'confused') {
        bird.brad = confuseBrad(bird.brad, now);
        this.sayAfterJoke(bird, "...I don't get it.", 2_000);
        return;
      }
      bird.brad = befriendBrad(bird.brad, now);
      bird.stunnedUntilMs = 0;
      bird.fleeUntilMs = 0;
      bird.nextAllyHitAtMs = now + 900;
      this.birds.forEach((other) => {
        if (other.state === 'active' && other.escortOf === bird.id) other.calm = 'tagalong';
      });
      this.sayAfterJoke(bird, "HAH! Okay, okay. You're alright.", 2_400);
      this.popHeart(bird.x, bird.y - bird.radius - 10);
      this.pushEvent((events) => events.befriended.push({ x: bird.x, y: bird.y }));
      this.candidatesDirty = true;
    });
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
    this.spawnBoss('ex', view, player, bonusHp);
  }

  private spawnBoss(
    kind: 'ex' | 'boyfriend',
    view: StampedeViewRect,
    player: { x: number; y: number },
    bonusHp: number
  ): FlockBird | undefined {
    const bird = this.birds.find((entry) => entry.state === 'idle');
    if (!bird) return undefined;
    const point = pickStampedeSpawnPoint(view, STAMPEDE_WORLD, player);
    this.activate(bird, kind, point, false, { speedScale: 1, bonusHp });
    return bird;
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

  jokeHit(ids: readonly string[]): readonly StampedeClearedMarkPoint[] {
    const cleared: StampedeClearedMarkPoint[] = [];
    this.forEachActive(ids, (bird) => {
      const dazeMs = bird.kind === 'ex' ? STAMPEDE_JOKE_EX_DAZE_MS : STAMPEDE_JOKE_DAZE_MS;
      const mark = this.woundBird(bird, 'daze', dazeMs, STAMPEDE_JOKE_DAMAGE);
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
    this.shakers = [];
    this.puddles = [];
    this.shakerSprites.forEach((shaker) => shaker.setVisible(false));
    this.events = EMPTY_EVENTS;
    this.bark.setVisible(false);
    this.barkSpeakerId = null;
    this.barkUntilMs = 0;
    this.pendingLine = null;
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
      if (bird.state !== 'active' || isBoss(bird) || isOutOfFight(bird)) return;
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
    bird.brad = kind === 'boyfriend' ? createBradBrain(now) : null;
    bird.escortOf = null;
    bird.calm = 'none';
    bird.leaveUntilMs = 0;
    bird.nextAllyHitAtMs = 0;
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
    dazeMs: number,
    damage = 1
  ): StampedeClearedMarkPoint | null {
    const now = this.scene.time.now;
    if (this.isShielded(bird)) {
      bird.flashUntilMs = now + 90;
      this.popResist(bird.x, bird.y - bird.radius - 14);
      return null;
    }
    this.chipBird(bird, ailment, dazeMs, damage, now);
    return bird.hp > 0 ? null : this.downBird(bird, now);
  }

  private chipBird(
    bird: FlockBird,
    ailment: 'poison' | 'daze' | undefined,
    dazeMs: number,
    damage: number,
    now: number
  ): void {
    bird.hp -= damage;
    bird.flashUntilMs = now + 110;
    if (ailment === 'poison') bird.poisonUntilMs = now + 900;
    if (ailment === 'daze' && bird.hp > 0) {
      bird.stunnedUntilMs = now + dazeMs;
      cancelCharge(bird);
    }
    this.shoveWounded(bird);
    this.burstFeathers(bird.x, bird.y, stampedeFeatherColor(bird.kind), bird.hp > 0 ? 1 : 4);
  }

  private shoveWounded(bird: FlockBird): void {
    if (bird.hp <= 0 || isBoss(bird) || bird.charge.phase === 'dash') return;
    const push = awayFrom(bird, this.lastPlayer);
    bird.knockVx = push.x * 170;
    bird.knockVy = push.y * 170;
  }

  private downBird(bird: FlockBird, now: number): StampedeClearedMarkPoint {
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
    if (this.steerAside(bird, step)) return;
    if (bird.escortOf && this.stepEscort(bird, step)) return;
    if (bird.brad) {
      this.stepBoyfriend(bird, bird.brad, step);
      return;
    }
    this.steerKind(bird, step);
  }

  /** Calm, friendly, stunned, or fleeing birds skip the chase. */
  private steerAside(bird: FlockBird, step: FlockStep): boolean {
    if (bird.calm !== 'none') {
      this.stepCalm(bird, step);
      return true;
    }
    if (bird.brad && isBradFriendly(bird.brad)) {
      this.stepBoyfriend(bird, bird.brad, step);
      return true;
    }
    if (step.nowMs < bird.stunnedUntilMs) {
      bird.mood = 'gag';
      return true;
    }
    if (step.nowMs >= bird.fleeUntilMs) return false;
    bird.x += bird.fleeVx * step.deltaSeconds;
    bird.y += bird.fleeVy * step.deltaSeconds;
    bird.mood = 'gag';
    bird.facing = bird.fleeVx >= 0 ? 1 : -1;
    return true;
  }

  private steerKind(bird: FlockBird, step: FlockStep): void {
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
    this.pushEvent((events) => { events.swoonHearts += 1; });
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

  private stepBoyfriend(bird: FlockBird, brain: BradBrain, step: FlockStep): void {
    const result = stepBradBrain(brain, {
      nowMs: step.nowMs,
      self: bird,
      player: step.target,
      hp: bird.hp,
      maxHp: bird.maxHp,
      escorts: this.countEscorts(bird.id)
    });
    bird.brad = result.brain;
    this.applyBradAction(bird, result.action, step);
    if (bird.calm !== 'none') return;
    this.moveBrad(bird, result.brain, step);
  }

  private moveBrad(bird: FlockBird, brain: BradBrain, step: FlockStep): void {
    const dx = step.target.x - bird.x;
    const dy = step.target.y - bird.y;
    bird.mood = brain.mode.kind === 'confused' ? 'confused' : 'chase';
    if (brain.mode.kind === 'stalk') {
      this.stepBradStalk(bird, dx, dy, step);
      return;
    }
    if (brain.mode.kind === 'comboDash') {
      this.stepBradDash(bird, brain, step);
      return;
    }
    if (brain.mode.kind === 'ally') {
      this.stepWingman(bird, step);
      return;
    }
    bird.facing = dx >= 0 ? 1 : -1;
  }

  private stepBradStalk(bird: FlockBird, dx: number, dy: number, step: FlockStep): void {
    const distance = Math.max(1, Math.hypot(dx, dy));
    const pace = bird.speed * step.motion.speedMultiplier * step.deltaSeconds;
    const travel = Math.min(pace, distance);
    bird.x += (dx / distance) * travel;
    bird.y += (dy / distance) * travel;
    bird.facing = dx >= 0 ? 1 : -1;
  }

  private stepBradDash(bird: FlockBird, brain: BradBrain, step: FlockStep): void {
    if (brain.mode.kind !== 'comboDash') return;
    const lane = brain.mode.lanes[brain.mode.lane];
    if (!lane) return;
    const speed = bradComboTuning(brain.enraged).dashSpeed * step.deltaSeconds;
    bird.x += lane.dirX * speed;
    bird.y += lane.dirY * speed;
    bird.facing = lane.dirX >= 0 ? 1 : -1;
  }

  private applyBradAction(bird: FlockBird, action: BradAction, step: FlockStep): void {
    if (!action) return;
    switch (action.kind) {
      case 'whistle':
        this.say(bird, 'Babe, come here.', 1_600);
        this.callEscorts(bird);
        return;
      case 'throwShaker':
        if (this.shakers.length < this.shakerSprites.length) {
          this.shakers.push(createShakerShot({ x: bird.x, y: bird.y - bird.radius }, action.target, step.nowMs));
        }
        return;
      case 'flex': {
        this.say(bird, 'Do you even lift?', 1_800);
        this.poof(bird.x, bird.y, bird.radius * 1.6);
        const toPlayer = Math.hypot(step.target.x - bird.x, step.target.y - bird.y);
        if (toPlayer < BRAD_FLEX_REACH) {
          const push = awayFrom(step.target, bird);
          this.pushEvent((events) => {
            events.shove = { x: push.x * BRAD_FLEX_SHOVE, y: push.y * BRAD_FLEX_SHOVE };
          });
        }
        return;
      }
      case 'allyDone':
        this.say(bird, 'Later, bro.', 1_600);
        this.sendOff(bird, step.nowMs);
        this.birds.forEach((other) => {
          if (other.state === 'active' && other.escortOf === bird.id) this.sendOff(other, step.nowMs);
        });
    }
  }

  /** The three nearest chicks or hens run to Brad and circle him as a shield. */
  private callEscorts(brad: FlockBird): void {
    const picks = this.birds
      .filter((bird) => (
        bird.state === 'active'
        && (bird.kind === 'chick' || bird.kind === 'hen')
        && bird.escortOf === null
        && !isOutOfFight(bird)
      ))
      .sort((left, right) => (
        Math.hypot(left.x - brad.x, left.y - brad.y) - Math.hypot(right.x - brad.x, right.y - brad.y)
      ))
      .slice(0, BRAD_ESCORTS);
    picks.forEach((bird, slot) => {
      bird.escortOf = brad.id;
      bird.escortSlot = slot;
      this.popHeart(bird.x, bird.y - bird.radius - 8);
    });
  }

  private stepEscort(bird: FlockBird, step: FlockStep): boolean {
    const brad = bird.escortOf ? this.findActive(bird.escortOf) : undefined;
    if (!brad || isOutOfFight(brad)) {
      bird.escortOf = null;
      return false;
    }
    this.orbitBrad(bird, brad, step);
    return true;
  }

  private orbitBrad(bird: FlockBird, brad: FlockBird, step: FlockStep): void {
    const angle = step.nowMs / 650 + (bird.escortSlot * Math.PI * 2) / BRAD_ESCORTS;
    const ring = brad.radius + bird.radius + 14;
    const goalX = brad.x + Math.cos(angle) * ring;
    const goalY = brad.y + Math.sin(angle) * ring;
    const dx = goalX - bird.x;
    const dy = goalY - bird.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const pace = Math.max(bird.speed * 1.8, 140) * step.deltaSeconds;
    bird.x += (dx / distance) * Math.min(pace, distance);
    bird.y += (dy / distance) * Math.min(pace, distance);
    bird.facing = brad.x - bird.x >= 0 ? 1 : -1;
    bird.mood = 'smitten';
  }

  /** Brad on your side: stays near you and shoulder-checks the nearest bird. */
  private stepWingman(bird: FlockBird, step: FlockStep): void {
    bird.mood = 'smitten';
    const foe = this.nearestFoe(step.target, BRAD_WINGMAN_REACH, bird.id);
    const goal = foe ?? { x: step.target.x - 60, y: step.target.y + 12 };
    this.approach(bird, goal, foe ? bird.radius + foe.radius : 0, BRAD_WINGMAN_SPEED, step);
    if (foe) this.shoulderCheck(bird, foe, step);
  }

  private approach(
    bird: FlockBird,
    goal: { x: number; y: number },
    stopAt: number,
    speed: number,
    step: FlockStep
  ): void {
    const dx = goal.x - bird.x;
    const dy = goal.y - bird.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const travel = Math.min(speed * step.deltaSeconds, Math.max(0, distance - stopAt));
    bird.x += (dx / distance) * travel;
    bird.y += (dy / distance) * travel;
    bird.facing = dx >= 0 ? 1 : -1;
  }

  private shoulderCheck(bird: FlockBird, foe: FlockBird, step: FlockStep): void {
    const distance = Math.hypot(foe.x - bird.x, foe.y - bird.y);
    if (distance > bird.radius + foe.radius + 8 || step.nowMs < bird.nextAllyHitAtMs) return;
    bird.nextAllyHitAtMs = step.nowMs + BRAD_WINGMAN_EVERY_MS;
    const mark = this.woundBird(foe, 'daze', 600);
    if (foe.state === 'active') {
      const push = awayFrom(foe, bird);
      foe.knockVx = push.x * 420;
      foe.knockVy = push.y * 420;
    }
    if (mark) this.pushEvent((events) => events.cleared.push(mark));
    if (step.nowMs >= bird.nextBarkAtMs) this.say(bird, 'I got you, bro.', 1_400);
  }

  private nearestFoe(around: { x: number; y: number }, reach: number, exceptId: string): FlockBird | undefined {
    let best: FlockBird | undefined;
    let bestDistance = reach;
    this.birds.forEach((bird) => {
      if (bird.state !== 'active' || bird.id === exceptId || isOutOfFight(bird)) return;
      const distance = Math.hypot(bird.x - around.x, bird.y - around.y);
      if (distance < bestDistance) {
        best = bird;
        bestDistance = distance;
      }
    });
    return best;
  }

  private stepCalm(bird: FlockBird, step: FlockStep): void {
    bird.mood = 'smitten';
    if (bird.calm === 'tagalong') {
      const brad = bird.escortOf ? this.findActive(bird.escortOf) : undefined;
      if (brad) {
        this.orbitBrad(bird, brad, step);
        return;
      }
      this.sendOff(bird, step.nowMs);
    }
    if (step.nowMs >= bird.leaveUntilMs) {
      this.retire(bird);
      this.candidatesDirty = true;
      return;
    }
    const away = awayFrom(bird, step.target);
    const pace = Math.max(bird.speed, 60) * 1.4 * step.deltaSeconds;
    bird.x += away.x * pace;
    bird.y += away.y * pace;
    bird.facing = away.x >= 0 ? 1 : -1;
  }

  private sendOff(bird: FlockBird, nowMs: number): void {
    bird.calm = 'leaving';
    bird.leaveUntilMs = nowMs + BRAD_LEAVE_MS;
    cancelCharge(bird);
    this.candidatesDirty = true;
  }

  private countEscorts(bradId: string): number {
    let count = 0;
    this.birds.forEach((bird) => {
      if (bird.state === 'active' && bird.escortOf === bradId && bird.calm === 'none') count += 1;
    });
    return count;
  }

  private isShielded(bird: FlockBird): boolean {
    return bird.kind === 'boyfriend' && this.countEscorts(bird.id) > 0;
  }

  private syncShakers(nowMs: number): void {
    const stepped = stepShakers(this.shakers, this.puddles, nowMs);
    this.shakers = stepped.shots;
    this.puddles = stepped.puddles;
    this.puddles.forEach((puddle) => {
      const fade = Math.min(1, (puddle.untilMs - nowMs) / 600);
      this.telegraphs.fillStyle(0xf29ac0, 0.42 * fade);
      this.telegraphs.fillEllipse(puddle.x, puddle.y, STAMPEDE_PUDDLE_RADIUS * 2.1, STAMPEDE_PUDDLE_RADIUS * 1.5);
      this.telegraphs.lineStyle(2, INK, 0.45 * fade);
      this.telegraphs.strokeEllipse(puddle.x, puddle.y, STAMPEDE_PUDDLE_RADIUS * 2.1, STAMPEDE_PUDDLE_RADIUS * 1.5);
    });
    this.shakerSprites.forEach((sprite, index) => {
      const shot = this.shakers[index];
      if (!shot) {
        sprite.setVisible(false);
        return;
      }
      this.telegraphs.lineStyle(2, WARN, 0.6);
      this.telegraphs.strokeEllipse(shot.toX, shot.toY, STAMPEDE_PUDDLE_RADIUS * 2.1, STAMPEDE_PUDDLE_RADIUS * 1.5);
      const at = shakerPosition(shot, nowMs);
      sprite.setPosition(at.x, at.y).setAngle((nowMs / 2) % 360).setVisible(true);
    });
  }

  private drawBradTelegraph(bird: FlockBird, brain: BradBrain, nowMs: number): void {
    const mode = brain.mode;
    if (mode.kind === 'comboWindup') {
      const windupMs = bradComboTuning(brain.enraged).windupMs;
      const progress = 1 - Math.max(0, (mode.untilMs - nowMs) / windupMs);
      mode.lanes.forEach((lane) => this.drawLane(lane, bird.radius, progress));
      return;
    }
    if (mode.kind === 'comboDash') {
      mode.lanes.slice(mode.lane + 1).forEach((lane) => this.drawLane(lane, bird.radius, 0.6));
      return;
    }
    if (mode.kind === 'shakerWindup') {
      this.telegraphs.lineStyle(2.4, WARN, 0.8);
      this.telegraphs.strokeEllipse(
        mode.target.x,
        mode.target.y,
        STAMPEDE_PUDDLE_RADIUS * 2.1,
        STAMPEDE_PUDDLE_RADIUS * 1.5
      );
    }
  }

  private drawLane(lane: BradLane, halfWidth: number, progress: number): void {
    const sideX = -lane.dirY * halfWidth;
    const sideY = lane.dirX * halfWidth;
    const endX = lane.x + lane.dirX * lane.length;
    const endY = lane.y + lane.dirY * lane.length;
    this.telegraphs.fillStyle(WARN, 0.08 + progress * 0.14);
    this.telegraphs.fillPoints([
      new Phaser.Math.Vector2(lane.x + sideX, lane.y + sideY),
      new Phaser.Math.Vector2(endX + sideX, endY + sideY),
      new Phaser.Math.Vector2(endX - sideX, endY - sideY),
      new Phaser.Math.Vector2(lane.x - sideX, lane.y - sideY)
    ], true);
    this.telegraphs.lineStyle(2, WARN, 0.55 + progress * 0.4);
    this.telegraphs.lineBetween(lane.x, lane.y, endX, endY);
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
    if (bird.brad && !isOutOfFight(bird) && nowMs >= bird.stunnedUntilMs) {
      this.drawBradTelegraph(bird, bird.brad, nowMs);
    }
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
      if (bird.state !== 'active' || isOutOfFight(bird)) return;
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

  private pushEvent(record: (events: StampedeSwarmEvents) => void): void {
    if (this.events === EMPTY_EVENTS) this.events = emptySwarmEvents();
    record(this.events);
  }

  /** A scripted line that takes over the bark bubble right away. */
  private say(bird: FlockBird, line: string, durationMs: number): void {
    const now = this.scene.time.now;
    this.barkSpeakerId = bird.id;
    this.barkUntilMs = now + durationMs;
    this.nextBarkGlobalAtMs = Math.max(this.nextBarkGlobalAtMs, now + durationMs + 600);
    bird.nextBarkAtMs = now + 8_000;
    this.bark
      .setText(line)
      .setPosition(bird.x, bird.y - bird.radius * 2 - 14)
      .setVisible(true);
  }

  private sayAfterJoke(bird: FlockBird, line: string, durationMs: number): void {
    const atMs = this.scene.time.now + STAMPEDE_JOKE_BUBBLE_MS;
    this.pendingLine = { birdId: bird.id, line, durationMs, atMs };
    this.nextBarkGlobalAtMs = Math.max(this.nextBarkGlobalAtMs, atMs);
  }

  private maybeBark(nowMs: number, focus: { x: number; y: number }): void {
    if (this.pendingLine && nowMs >= this.pendingLine.atMs) {
      const { birdId, line, durationMs } = this.pendingLine;
      this.pendingLine = null;
      const speaker = this.findActive(birdId);
      if (speaker) {
        this.say(speaker, line, durationMs);
        return;
      }
    }
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
          && !isOutOfFight(bird)
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
  if (bird.brad && isBradMidTrick(bird.brad)) {
    bird.brad = { ...bird.brad, mode: { kind: 'stalk' } };
  }
}

function isBradMidTrick(brain: BradBrain): boolean {
  const kind = brain.mode.kind;
  return kind === 'comboWindup' || kind === 'comboDash' || kind === 'shakerWindup' || kind === 'whistle';
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
  return isBoss(bird) || bird.charge.phase === 'dash';
}

function isBoss(bird: FlockBird): boolean {
  return bird.kind === 'ex' || bird.kind === 'boyfriend';
}

/** Friendly Brad and anyone tagging along or walking off: not hittable, not pecking, not counted. */
function isOutOfFight(bird: FlockBird): boolean {
  return bird.calm !== 'none' || (bird.brad !== null && isBradFriendly(bird.brad));
}

function emptySwarmEvents(): StampedeSwarmEvents {
  return { swoonHearts: 0, cleared: [], shove: null, befriended: [] };
}

const EMPTY_EVENTS: StampedeSwarmEvents = emptySwarmEvents();

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
  const bradMode = bird.brad?.mode.kind;
  const windup = bird.charge.phase === 'windup' || bird.throwAtMs !== null || bradMode === 'comboWindup';
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
    windup,
    raised: bradMode === 'shakerWindup',
    enraged: bird.brad?.enraged ?? false,
    ally: bradMode === 'ally' || (bird.kind === 'boyfriend' && bird.calm !== 'none')
  };
}

function isBirdMoving(bird: FlockBird, nowMs: number): boolean {
  if (bird.brad && !isOutOfFight(bird)) {
    const kind = bird.brad.mode.kind;
    if (kind !== 'stalk' && kind !== 'comboDash') return false;
  }
  return nowMs >= bird.stunnedUntilMs
    && bird.throwAtMs === null
    && bird.charge.phase !== 'windup'
    && bird.charge.phase !== 'rest';
}

function birdAlpha(bird: FlockBird, nowMs: number): number {
  if (bird.calm === 'leaving') return Math.max(0, Math.min(1, (bird.leaveUntilMs - nowMs) / LEAVE_FADE_MS));
  return nowMs < bird.fleeUntilMs ? 0.55 : 1;
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
    .setAlpha(birdAlpha(bird, nowMs))
    .setDepth(20 + bird.y / 10_000);
  bird.shadow
    .setPosition(bird.x, bird.y + bird.radius * 1.2)
    .setScale(popScale)
    .setAlpha(Math.min(1, birdAlpha(bird, nowMs)));
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
