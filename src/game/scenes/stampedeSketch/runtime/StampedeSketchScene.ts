import * as Phaser from 'phaser';
import { bridgeActions, type SceneControlPointerEvent } from '@/game/bridge/store';
import { PHASER_SCENE_KEYS, STAMPEDE_SKETCH_SCENE_ID } from '@/game/scenes/sceneIds';
import type { SceneUiActionId } from '@/game/sceneUi/types';
import { setSceneKeyboardPaused } from '@/game/sharedSceneRuntime/sceneKeyboardPause';
import { TextureGenerator } from '@/game/sharedSceneRuntime/textures/TextureGenerator';
import {
  createStampedeAutoAttackState,
  resolveGroupDazeIds,
  type StampedeAutoAttackEvent,
  type StampedeAutoAttackState
} from './autoAttack';
import {
  createStampedeAutoAttackPresentationRuntime,
  type StampedeAutoAttackPresentationRuntime
} from './autoAttackPresentation';
import {
  createBreathHitState,
  createOrbitHitState,
  getBreathBeam,
  getStinkAura,
  pushBreathLinger,
  sampleBreathBubbles,
  stepBreathBeam,
  stepOrbitHits,
  type StampedeBreathPatch,
  type StampedeOrbitHitState,
  type StampedeOrbitPoint
} from './auras';
import { drawStampedeArena } from './arenaPresentation';
import {
  createStampedeJokeBag,
  createStampedeJokeMeter,
  fillStampedeJokeMeter,
  isStampedeJokeReady,
  nextStampedeJokeLine,
  resolveStampedeDadJoke,
  spendStampedeJokeMeter,
  STAMPEDE_JOKE_BIG_CLEAR,
  STAMPEDE_JOKE_RADIUS,
  stepStampedeJokeMeter,
  type StampedeJokeBag,
  type StampedeJokeMeter
} from './dadJoke';
import { createStampedeJokeLook, type StampedeJokeLook } from './jokePresentation';
import {
  createStampedeJealousy,
  stepStampedeJealousy,
  type StampedeJealousy
} from './jealousy';
import { recordStampedeEndlessRun } from './endlessRecord';
import { STAMPEDE_BEER_DISARM_MS } from './beer';
import {
  createStampedeFeedbackRuntime,
  type StampedeFeedbackRuntime
} from './feedbackPresentation';
import {
  createStampedeHudSnapshot,
  type StampedeHudSnapshot
} from './hudPresentation';
import {
  createStampedeInputRuntime,
  type StampedeInputRuntime
} from './input';
import {
  createStampedeEventLook,
  type StampedeEventBeacon,
  type StampedeEventLook
} from './eventPresentation';
import {
  createStampedeKitLook,
  type StampedeKitLook
} from './kitPresentation';
import {
  dueStampedeMapEvents,
  isStampedeLastCall,
  placeStampedeMirror,
  rollStampedeGift,
  stepStampedeMirror,
  type StampedeMapEventKind,
  type StampedeMirror
} from './mapEvents';
import {
  clampStampedePosition,
  STAMPEDE_WORLD,
  type StampedeVelocity
} from './movement';
import {
  createStampedePickupRuntime,
  type StampedePickupRuntime
} from './pickupPresentation';
import type { StampedePressureSnapshot } from './pressure';
import {
  applyStampedeUpgradeChoice,
  attractStampedePickups,
  collectStampedePickups,
  createStampedeProgressionState,
  grantStampedeStartingWeapon,
  offerClutchHeart,
  openStampedeDraftIfReady,
  spawnStampedeGiftPickup,
  spawnStampedeHeartPickup,
  spawnStampedePickupsFromClearedMarks,
  type StampedeClearedMarkPoint,
  type StampedeProgressionState
} from './progression';
import {
  resolveStampedeRunFrame,
  STAMPEDE_PLAYER_CONTACT_RADIUS
} from './runFlow';
import { claimStampedeFirstClearReward } from './rewards';
import {
  createStampedeResultViewModel,
  type StampedeResultViewModel
} from './resultPresentation';
import {
  createStampedeSpellVfx,
  type StampedeSpellVfx
} from './spellPresentation';
import { resolveStampedeSpellCast, type StampedeSpellId } from './spells';
import {
  continueStampedeSessionEndless,
  createStampedeSession,
  readStampedeSessionSnapshot,
  recoverStampedeContact,
  stampedeContactLimit,
  STAMPEDE_SHELL_RECHARGE_MS,
  type StampedeSession,
  type StampedeSessionPhase
} from './session';
import {
  createStampedeSwarmRuntime,
  type StampedeSwarmEvents,
  type StampedeSwarmRuntime
} from './swarmPresentation';
import {
  formatStampedeKitLabel,
  getStampedeStartingWeaponChoices,
  getStampedeUpgradeChoices,
  getStampedeWeaponRank,
  isStampedeUpgradeId,
  isStampedeWeaponId,
  resolveEquippedSpell,
  resolveOwnedSpells,
  resolveStampedeAutoAttackProfile,
  resolveStampedeGuardianSpeed
} from './upgrades';

interface StampedeSketchSceneStartData {
  onClose?: () => void;
  isPaused?: boolean;
}

type StampedeOpenDraft = 'none' | 'scraps' | 'free';

const STAMPEDE_GHOSTING_MS = 3_600;
const STAMPEDE_MAGNET_MS = 1_400;
const STAMPEDE_ROOSTER_GIFT_CHANCE = 0.25;
const STAMPEDE_EX_RETURN_HP = 6;
const STAMPEDE_BRAD_RETURN_HP = 8;
const STAMPEDE_SHOVE_DECAY = 6;

export class StampedeSketchScene extends Phaser.Scene {
  private player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private playerShadow?: Phaser.GameObjects.Ellipse;
  private playerContactRing?: Phaser.GameObjects.Arc;
  private eventLook?: StampedeEventLook;
  private mirror: StampedeMirror | null = null;
  private mirrorCharging = false;
  private magnetUntilMs = 0;
  private inputRuntime?: StampedeInputRuntime;
  private swarmRuntime?: StampedeSwarmRuntime;
  private feedbackRuntime?: StampedeFeedbackRuntime;
  private autoAttackRuntime?: StampedeAutoAttackPresentationRuntime;
  private pickupRuntime?: StampedePickupRuntime;
  private spellVfx?: StampedeSpellVfx;
  private kitLook?: StampedeKitLook;
  private session: StampedeSession = createStampedeSession();
  private autoAttackState: StampedeAutoAttackState = createStampedeAutoAttackState();
  private progression: StampedeProgressionState = createStampedeProgressionState();
  private shownResultPhase?: Exclude<StampedeSessionPhase, 'playing'>;
  private lastPublishedStatusKey = '';
  private hasRunStarted = false;
  private openDraft: StampedeOpenDraft = 'none';
  private isPaused = false;
  private spellCooldownReadyAt: Partial<Record<StampedeSpellId, number>> = {};
  private breathHits: Record<string, number> = createBreathHitState();
  private breathBubbles: StampedeOrbitPoint[] = [];
  private breathLinger: StampedeBreathPatch[] = [];
  private stinkState: StampedeOrbitHitState = createOrbitHitState();
  private stinkPoints: StampedeOrbitPoint[] = [];
  private disarmedUntilMs = 0;
  private shellReadyAtMs = 0;
  private clutchHeartOffered = false;
  private exVisits = 0;
  private jokeLook?: StampedeJokeLook;
  private jokeMeter: StampedeJokeMeter = createStampedeJokeMeter();
  private jokeBag: StampedeJokeBag = createStampedeJokeBag();
  private jokeQueued = false;
  private jokeAnnounced = false;
  private jealousy: StampedeJealousy = createStampedeJealousy();
  private wingmen = 0;
  private shove = { x: 0, y: 0 };
  private lastFacing = { x: 1, y: 0 };
  private onClose: () => void = () => {};

  constructor() {
    super(PHASER_SCENE_KEYS.stampedeSketch);
  }

  init(data: StampedeSketchSceneStartData = {}): void {
    this.onClose = data.onClose ?? (() => {});
    this.isPaused = data.isPaused ?? false;
  }

  preload(): void {
    if (!this.textures.exists('player_idle') || !this.textures.exists('player_glasses')) {
      TextureGenerator.generatePlayer(this);
    }
  }

  create(data: StampedeSketchSceneStartData = {}): void {
    this.onClose = data.onClose ?? this.onClose;
    this.isPaused = data.isPaused ?? this.isPaused;

    this.cameras.main.setBackgroundColor('#fbfbf9');
    this.physics.world.setBounds(0, 0, STAMPEDE_WORLD.width, STAMPEDE_WORLD.height);
    this.physics.world.gravity.set(0, 0);

    drawStampedeArena(this);
    this.createPlayer();
    this.cameras.main
      .setBounds(0, 0, STAMPEDE_WORLD.width, STAMPEDE_WORLD.height)
      .startFollow(this.player!, true, 0.14, 0.14);
    this.eventLook = createStampedeEventLook(this);
    this.inputRuntime = createStampedeInputRuntime({ scene: this });
    this.swarmRuntime = createStampedeSwarmRuntime({ scene: this });
    this.feedbackRuntime = createStampedeFeedbackRuntime({ scene: this });
    this.autoAttackRuntime = createStampedeAutoAttackPresentationRuntime({ scene: this });
    this.pickupRuntime = createStampedePickupRuntime({ scene: this });
    this.spellVfx = createStampedeSpellVfx({ scene: this });
    this.kitLook = createStampedeKitLook(this);
    this.jokeLook = createStampedeJokeLook(this);
    this.resetRunBookkeeping();
    this.updateHud();
    this.inputRuntime.setPointerControlEnabled(false);
    this.showStartPrompt();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      bridgeActions.clearSceneUi(STAMPEDE_SKETCH_SCENE_ID);
      bridgeActions.clearSceneControlPointerEvents(STAMPEDE_SKETCH_SCENE_ID);
      this.pickupRuntime?.reset();
      this.spellVfx?.reset();
      this.kitLook?.reset();
      this.eventLook?.reset();
      this.jokeLook?.reset();
    });
    this.setPaused(this.isPaused);
  }

  setPaused(paused: boolean): void {
    this.isPaused = paused;
    if (paused) {
      this.player?.setVelocity(0, 0);
      this.inputRuntime?.clearPointerControl();
      this.inputRuntime?.updateStickVisuals();
    }
    setSceneKeyboardPaused(this, paused, {
      pausePhysicsWorld: true,
      zeroHorizontalVelocity: () => this.player?.setVelocity(0, 0)
    });
  }

  update(time: number, delta: number): void {
    if (this.haltUpdate()) return;
    const inputRuntime = this.inputRuntime;
    const swarmRuntime = this.swarmRuntime;
    const player = this.player;
    if (!inputRuntime || !swarmRuntime || !player) return;

    this.consumeSceneControlPointerEvents();

    const closeRequested = inputRuntime.closeRequested();
    if (!this.hasRunStarted) {
      this.updateReadyFrame(closeRequested);
      return;
    }
    if (this.session.phase !== 'playing' && inputRuntime.retryRequested()) {
      this.restartRun();
      return;
    }

    this.commitLiveFrame(inputRuntime, swarmRuntime, player, closeRequested, delta, time);
  }

  private commitLiveFrame(
    inputRuntime: NonNullable<StampedeSketchScene['inputRuntime']>,
    swarmRuntime: NonNullable<StampedeSketchScene['swarmRuntime']>,
    player: NonNullable<StampedeSketchScene['player']>,
    closeRequested: boolean,
    delta: number,
    time: number
  ): void {
    const disarmed = this.time.now < this.disarmedUntilMs;
    const selfieRank = disarmed ? 0 : getStampedeWeaponRank(
      this.progression.appliedUpgradeIds,
      this.progression.upgradedWeaponIds,
      'badSelfie'
    );
    const velocity = this.addShove(inputRuntime.readVelocity({
      speed: resolveStampedeGuardianSpeed(this.progression.appliedUpgradeIds)
        * swarmRuntime.playerSlowFactor(player)
    }), delta);
    if (this.session.phase === 'playing') this.trackFacing(velocity);

    const previousElapsedMs = this.session.elapsedMs;
    const weaponElapsedMs = Math.min(
      this.session.elapsedMs + Math.max(0, delta),
      this.session.endless ? Number.POSITIVE_INFINITY : this.session.durationMs
    );
    const frame = resolveStampedeRunFrame({
      session: this.session,
      autoAttackState: selfieRank > 0 ? this.autoAttackState : undefined,
      autoAttackProfile: resolveStampedeAutoAttackProfile(
        this.progression.appliedUpgradeIds,
        this.progression.upgradedWeaponIds
      ),
      deltaMs: delta,
      closeRequested,
      velocity,
      player: {
        x: player.x,
        y: player.y,
        radius: STAMPEDE_PLAYER_CONTACT_RADIUS
      },
      contactCandidates: swarmRuntime.getContactCandidates(),
      ignoredContactIds: disarmed
        ? []
        : this.peekWeaponHitIds(weaponElapsedMs, delta, time),
      contactLimit: stampedeContactLimit(this.progression.bonusHearts),
      shellOwned: this.progression.appliedUpgradeIds.includes('shell'),
      shellReadyAtMs: this.shellReadyAtMs
    });

    this.session = frame.session;
    this.autoAttackState = frame.autoAttackState ?? this.autoAttackState;
    switch (frame.kind) {
      case 'close':
        this.closeToStreet();
        return;
      case 'terminal':
        this.spellVfx?.aim({
          spellId: resolveEquippedSpell(this.progression.appliedUpgradeIds) ?? 'badBreath',
          origin: { x: player.x, y: player.y },
          direction: this.lastFacing,
          ready: false
        });
        this.showTerminalFrame(frame, delta);
        return;
      case 'playing':
        this.applyPlayingFrame(frame, delta, time, previousElapsedMs);
        return;
    }
  }

  private haltUpdate(): boolean {
    if (!this.player || !this.inputRuntime || !this.swarmRuntime) return true;
    if (this.isPaused) {
      this.player.setVelocity(0, 0);
      return true;
    }

    const sceneUiAction = bridgeActions.consumeSceneUiAction(STAMPEDE_SKETCH_SCENE_ID);
    if (sceneUiAction?.action === 'castSpell') {
      this.jokeQueued = true;
    } else if (sceneUiAction) {
      this.handleSceneUiAction(sceneUiAction.action, sceneUiAction.params);
      return true;
    }

    if (this.openDraft !== 'none') {
      this.player.setVelocity(0, 0);
      this.inputRuntime.updateStickVisuals();
      return true;
    }

    return false;
  }

  private applyPlayingFrame(
    frame: Extract<ReturnType<typeof resolveStampedeRunFrame>, { kind: 'playing' }>,
    delta: number,
    time: number,
    previousElapsedMs: number
  ): void {
    if (!this.player || !this.inputRuntime || !this.swarmRuntime) return;

    this.player.setVelocity(frame.velocity.x, frame.velocity.y);
    this.player.setPosition(frame.player.x, frame.player.y);
    this.tickOwnedWeapons(delta, time);
    this.aimEquippedSpell();
    this.updatePlayerContactRing(frame.pressure);
    this.updatePlayerInkTilt(time, frame.velocity);
    this.applyAutoAttack(frame.attack);
    this.syncKitLook();
    this.runMapEvents(previousElapsedMs, delta);
    this.runDadJoke(delta);
    if (
      this.collectPickups(frame.player, frame.pressure, delta)
      || this.revealPendingDraft()
      || this.openDraft !== 'none'
    ) {
      this.inputRuntime.updateStickVisuals();
      return;
    }
    this.showPlayingContact(frame);
    this.maybeOfferClutchHeart();
    this.swarmRuntime.update(this.player, delta, {
      ...frame.swarm,
      elapsedMs: this.session.elapsedMs,
      durationMs: this.session.durationMs,
      playerHurting: this.session.contacts >= 2,
      lastCall: isStampedeLastCall(this.session.elapsedMs, this.session.durationMs),
      view: this.cameras.main.worldView
    });
    if (this.swarmRuntime.consumeBeerHit()) {
      this.disarmedUntilMs = this.time.now + STAMPEDE_BEER_DISARM_MS;
      this.clearContinuousWeapons();
    }
    this.applySwarmEvents(this.swarmRuntime.consumeEvents());
    this.syncKitLook();
    this.syncBeacons();
    this.updateHud(frame.pressure);
    this.announceTerminalPhase();
    this.inputRuntime.updateStickVisuals();
  }

  private runMapEvents(previousElapsedMs: number, delta: number): void {
    if (!this.player || !this.swarmRuntime) return;
    dueStampedeMapEvents(previousElapsedMs, this.session.elapsedMs, this.session.durationMs)
      .forEach((kind) => this.startMapEvent(kind));

    if (!this.mirror) {
      this.mirrorCharging = false;
      this.eventLook?.syncMirror(null, this.time.now, false);
      return;
    }
    const step = stepStampedeMirror(this.mirror, this.player, delta, this.session.elapsedMs);
    this.mirror = step.mirror;
    this.mirrorCharging = step.status === 'charging';
    this.eventLook?.syncMirror(this.mirror, this.time.now, this.mirrorCharging);
    if (step.status === 'complete') this.showFreeDraft();
  }

  private startMapEvent(kind: StampedeMapEventKind): void {
    if (!this.player || !this.swarmRuntime) return;
    switch (kind) {
      case 'mirror':
        this.mirror = placeStampedeMirror(this.player, STAMPEDE_WORLD, this.session.elapsedMs);
        this.eventLook?.showBanner('A mirror appeared', 'Stand by it for a pep talk and a free twist');
        return;
      case 'ex':
        this.swarmRuntime.spawnEx(this.cameras.main.worldView, this.player, this.exVisits * STAMPEDE_EX_RETURN_HP);
        this.eventLook?.showBanner(
          this.exVisits === 0 ? 'Your ex showed up' : 'Your ex is back',
          this.exVisits === 0 ? 'Watch for the charge. Big gift if you win' : 'Tougher this time. Same big gift'
        );
        this.exVisits += 1;
        return;
      case 'lastCall':
        if (this.session.endless) {
          this.eventLook?.showBanner('Rush hour!', 'Everyone wants a dance. Hold on 15 seconds');
          return;
        }
        this.eventLook?.showBanner('Last call!', 'Everyone wants a dance. Hold on 20 seconds');
    }
  }

  private syncBeacons(): void {
    if (!this.eventLook || !this.swarmRuntime) return;
    const beacons: StampedeEventBeacon[] = [...this.swarmRuntime.getBeacons()];
    if (this.mirror) beacons.push({ x: this.mirror.x, y: this.mirror.y, kind: 'mirror' });
    this.progression.pickups.forEach((pickup) => {
      if (pickup.kind === 'heart' || pickup.kind === 'gift') {
        beacons.push({ x: pickup.x, y: pickup.y, kind: pickup.kind });
      }
    });
    this.eventLook.syncBeacons(beacons, this.cameras.main.worldView);
  }

  private tickOwnedWeapons(delta: number, time: number): void {
    if (this.time.now < this.disarmedUntilMs) {
      this.clearContinuousWeapons();
      return;
    }
    this.tickBreath();
    this.tickStink(delta);
    this.fireOwnedSpells(time);
  }

  private aimEquippedSpell(): void {
    if (!this.player) return;
    const aimedSpell = resolveEquippedSpell(this.progression.appliedUpgradeIds);
    this.spellVfx?.aim({
      spellId: aimedSpell ?? 'badBreath',
      origin: { x: this.player.x, y: this.player.y },
      direction: this.lastFacing,
      ready: aimedSpell === 'fakeGlasses' && this.time.now >= this.disarmedUntilMs
    });
  }

  private showPlayingContact(
    frame: Extract<ReturnType<typeof resolveStampedeRunFrame>, { kind: 'playing' }>
  ): void {
    if (frame.shellBlocked) {
      this.shellReadyAtMs = this.session.elapsedMs + STAMPEDE_SHELL_RECHARGE_MS;
      return;
    }
    if (!frame.contactCandidate || !this.player) return;
    this.feedbackRuntime?.showContact(this.player, frame.contactCandidate);
    if ('id' in frame.contactCandidate && typeof frame.contactCandidate.id === 'string') {
      this.swarmRuntime?.bouncePecker(frame.contactCandidate.id, this.player);
    }
    this.updatePlayerContactRing(frame.pressure);
  }

  private clearContinuousWeapons(): void {
    this.breathHits = createBreathHitState();
    this.breathBubbles = [];
    this.breathLinger = [];
    this.stinkState = createOrbitHitState();
    this.stinkPoints = [];
  }

  private resetRunBookkeeping(): void {
    this.session = createStampedeSession();
    this.autoAttackState = createStampedeAutoAttackState();
    this.progression = createStampedeProgressionState();
    this.shownResultPhase = undefined;
    this.lastPublishedStatusKey = '';
    this.hasRunStarted = false;
    this.openDraft = 'none';
    this.mirror = null;
    this.mirrorCharging = false;
    this.magnetUntilMs = 0;
    this.spellCooldownReadyAt = {};
    this.clearContinuousWeapons();
    this.disarmedUntilMs = 0;
    this.shellReadyAtMs = 0;
    this.clutchHeartOffered = false;
    this.exVisits = 0;
    this.jokeMeter = createStampedeJokeMeter();
    this.jokeBag = createStampedeJokeBag();
    this.jokeQueued = false;
    this.jokeAnnounced = false;
    this.jealousy = createStampedeJealousy();
    this.wingmen = 0;
    this.shove = { x: 0, y: 0 };
    this.lastFacing = { x: 1, y: 0 };
  }

  private addShove(velocity: StampedeVelocity, delta: number): StampedeVelocity {
    if (this.shove.x === 0 && this.shove.y === 0) return velocity;
    const shoved = { x: velocity.x + this.shove.x, y: velocity.y + this.shove.y };
    const decay = Math.exp(-STAMPEDE_SHOVE_DECAY * (delta / 1000));
    this.shove = Math.hypot(this.shove.x, this.shove.y) * decay < 8
      ? { x: 0, y: 0 }
      : { x: this.shove.x * decay, y: this.shove.y * decay };
    return shoved;
  }

  private applySwarmEvents(events: StampedeSwarmEvents): void {
    if (!this.player || !this.swarmRuntime) return;
    this.dropPickups(events.cleared);
    if (events.shove) this.shove = events.shove;
    events.befriended.forEach((at) => {
      this.wingmen += 1;
      this.progression = spawnStampedeGiftPickup(this.progression, at);
      this.progression = spawnStampedeHeartPickup(this.progression, { x: at.x + 30, y: at.y });
      this.pickupRuntime?.sync(this.progression.pickups);
      this.eventLook?.showBanner('Wingman!', "Brad's got your back for a bit");
    });

    const step = stepStampedeJealousy(this.jealousy, {
      elapsedMs: this.session.elapsedMs,
      durationMs: this.session.durationMs,
      heartsAdded: events.swoonHearts,
      exOnField: this.swarmRuntime.isOnField('ex'),
      boyfriendOnField: this.swarmRuntime.isOnField('boyfriend')
    });
    this.jealousy = step.state;
    if (step.event === 'foreshadow') {
      this.eventLook?.showBanner("Someone's boyfriend", 'is asking about you');
    }
    if (step.event === 'arrive') {
      const returning = this.jealousy.visits > 1;
      this.swarmRuntime.spawnBoyfriend(
        this.cameras.main.worldView,
        this.player,
        (this.jealousy.visits - 1) * STAMPEDE_BRAD_RETURN_HP
      );
      this.eventLook?.showBanner(
        returning ? "Brad's back" : 'Her boyfriend just walked in',
        "Wear him down, then tell him a dad joke"
      );
    }
  }

  private runDadJoke(delta: number): void {
    if (!this.player || !this.inputRuntime) return;
    this.jokeMeter = stepStampedeJokeMeter(this.jokeMeter, delta, 0);
    const requested = this.inputRuntime.castRequested() || this.jokeQueued;
    this.jokeQueued = false;
    if (requested) this.tellDadJoke();
    if (isStampedeJokeReady(this.jokeMeter) && !this.jokeAnnounced) {
      this.jokeAnnounced = true;
      this.eventLook?.showBanner('Dad joke ready', 'Press Space or tap the meter to tell it');
    }
    this.jokeLook?.follow(this.player);
  }

  private tellDadJoke(): void {
    if (!this.player || !this.swarmRuntime || !isStampedeJokeReady(this.jokeMeter)) return;
    const origin = { x: this.player.x, y: this.player.y };
    const targets = resolveStampedeDadJoke({
      player: origin,
      candidates: this.swarmRuntime.getSpellCandidates()
    });
    const cleared = this.swarmRuntime.jokeHit(targets.hitIds);
    this.swarmRuntime.jokeBoyfriend(targets.bossIds);
    this.dropPickups(cleared);
    this.jokeMeter = spendStampedeJokeMeter(this.jokeMeter);
    const next = nextStampedeJokeLine(this.jokeBag);
    this.jokeBag = next.bag;
    this.jokeLook?.tell(next.line, origin, STAMPEDE_JOKE_RADIUS);
    if (cleared.length >= STAMPEDE_JOKE_BIG_CLEAR) this.jokeLook?.stamp('ba-dum-tss', origin);
  }

  private createPlayer(): void {
    const start = this.readPlayerStartPosition();
    this.playerShadow = this.add.ellipse(start.x, start.y + 22, 40, 12, 0x1a1a1a, 0.16).setDepth(15);
    this.player = this.physics.add.sprite(start.x, start.y, 'player_idle');
    this.player.setScale(0.82);
    this.player.setDrag(1400, 1400);
    this.player.body.setAllowGravity(false);
    this.player.setCollideWorldBounds(false);
    this.player.body.setCircle(24, 8, 8);
    this.playerContactRing = this.add.circle(
      start.x,
      start.y,
      STAMPEDE_PLAYER_CONTACT_RADIUS,
      0xffffff,
      0
    ).setStrokeStyle(2, 0x1a1a1a, 0.32).setDepth(19);
    this.syncPlayerDepth();
  }

  /** Same y-sort as the flock so the player tucks behind birds lower on the page. */
  private syncPlayerDepth(): void {
    if (!this.player) return;
    this.player.setDepth(20 + this.player.y / 10_000);
    this.playerShadow?.setPosition(this.player.x, this.player.y + 22);
  }

  private closeToStreet(): void {
    this.player?.setVelocity(0, 0);
    this.autoAttackRuntime?.reset();
    this.spellVfx?.reset();
    bridgeActions.clearSceneUi(STAMPEDE_SKETCH_SCENE_ID);
    this.onClose();
  }

  private restartRun(): void {
    this.resetRunBookkeeping();
    this.showStartPrompt();
    this.autoAttackRuntime?.reset();
    this.feedbackRuntime?.reset();
    this.swarmRuntime?.reset();
    this.pickupRuntime?.reset();
    this.spellVfx?.reset();
    this.kitLook?.reset();
    this.eventLook?.reset();
    this.jokeLook?.reset();
    this.inputRuntime?.setPointerControlEnabled(false);
    this.inputRuntime?.clearPointerControl();

    const start = this.readPlayerStartPosition();
    this.player
      ?.setPosition(start.x, start.y)
      .setVelocity(0, 0)
      .setAlpha(1)
      .setScale(0.82)
      .setAngle(0);
    this.cameras.main.centerOn(start.x, start.y);
    this.syncFakeGlassesLook();
    this.updatePlayerContactRing();

    this.updateHud();
    this.inputRuntime?.updateStickVisuals();
  }

  private updateReadyFrame(closeRequested: boolean): void {
    if (!this.player || !this.inputRuntime) return;
    if (closeRequested) {
      this.closeToStreet();
      return;
    }
    this.player.setVelocity(0, 0);
    this.updatePlayerContactRing();
    this.inputRuntime.updateStickVisuals();
  }

  private showTerminalFrame(
    frame: Extract<ReturnType<typeof resolveStampedeRunFrame>, { kind: 'terminal' }>,
    delta: number
  ): void {
    if (!this.player || !this.inputRuntime || !this.swarmRuntime) return;

    if (frame.player) {
      this.player.setPosition(frame.player.x, frame.player.y);
    }
    this.updatePlayerContactRing(frame.pressure);
    if (frame.contactCandidate) {
      this.feedbackRuntime?.showContact(this.player, frame.contactCandidate);
      this.updatePlayerContactRing(frame.pressure);
    }
    this.applyAutoAttack(frame.attack);

    this.player.setVelocity(0, 0);
    this.inputRuntime.setPointerControlEnabled(false);
    this.swarmRuntime.update(this.player, delta, {
      ...frame.swarm,
      elapsedMs: this.session.elapsedMs
    });
    this.inputRuntime.updateStickVisuals();
    this.updateHud(frame.pressure);
    this.announceTerminalPhase();
    this.showResult(frame.phase);
  }

  private showResult(phase: Exclude<StampedeSessionPhase, 'playing'>): void {
    if (this.shownResultPhase === phase) return;
    this.shownResultPhase = phase;

    const view = createStampedeResultViewModel({
      phase,
      elapsedMs: this.session.elapsedMs,
      durationMs: this.session.durationMs,
      contacts: this.session.contacts,
      rewardStatus: phase === 'cleared'
        ? claimStampedeFirstClearReward()
        : 'unavailable',
      endless: this.session.endless ? recordStampedeEndlessRun(this.session.elapsedMs) : undefined,
      wingmen: this.wingmen
    });
    this.showResultPanel(view);
  }

  private updateHud(pressure?: StampedePressureSnapshot): void {
    const snapshot = createStampedeHudSnapshot(
      readStampedeSessionSnapshot(this.session),
      pressure,
      this.progression
    );
    if (this.hasRunStarted && this.session.phase === 'playing') {
      const owned = resolveOwnedSpells(this.progression.appliedUpgradeIds);
      const selfieRank = getStampedeWeaponRank(
        this.progression.appliedUpgradeIds,
        this.progression.upgradedWeaponIds,
        'badSelfie'
      );
      const soakedMs = Math.max(0, this.disarmedUntilMs - this.time.now);
      const spellCoolingMs = soakedMs > 0
        ? soakedMs
        : soonestSpellCooldown(
          owned.filter((spellId) => spellId === 'fakeGlasses'),
          this.spellCooldownReadyAt,
          this.time.now
        );
      const selfieCoolingMs = soakedMs > 0 || selfieRank === 0
        ? Number.POSITIVE_INFINITY
        : Math.max(0, this.autoAttackState.nextFireAtMs - this.session.elapsedMs);
      const coolingMs = Math.min(spellCoolingMs, selfieCoolingMs);
      snapshot.spellLabel = soakedMs > 0
        ? 'Soaked'
        : formatStampedeKitLabel(
          this.progression.appliedUpgradeIds,
          this.progression.upgradedWeaponIds
        );
      snapshot.spellReady = !Number.isFinite(coolingMs) || coolingMs <= 0;
      snapshot.spellCooldownSeconds = Number.isFinite(coolingMs) ? coolingMs / 1000 : 0;
      snapshot.jokeCharge = this.jokeMeter.charge;
      snapshot.jokeReady = isStampedeJokeReady(this.jokeMeter);
    }
    this.publishStatus(snapshot);
  }

  private announceTerminalPhase(): void {
    this.feedbackRuntime?.announceTerminal(this.session.phase, this.player);
  }

  private applyAutoAttack(
    attack: StampedeAutoAttackEvent | null | undefined
  ): void {
    if (!attack) return;

    const dazeMs = this.progression.appliedUpgradeIds.includes('selfiePose') ? 1_700 : 880;
    const clearedMarks = this.swarmRuntime?.clearMarks(attack.hitIds, 'daze', dazeMs) ?? [];
    if (this.progression.appliedUpgradeIds.includes('selfieGroup')) {
      this.swarmRuntime?.dazeMarks(
        resolveGroupDazeIds(attack.hitIds, this.swarmRuntime.getSpellCandidates()),
        dazeMs
      );
    }
    this.dropPickups(clearedMarks);
    this.autoAttackRuntime?.show(attack);
  }

  private collectPickups(
    player: { x: number; y: number; radius?: number },
    pressure: StampedePressureSnapshot | undefined,
    deltaMs: number
  ): boolean {
    const attracted = attractStampedePickups(this.progression, player, deltaMs, {
      pullAll: this.time.now < this.magnetUntilMs
    });
    if (attracted !== this.progression) {
      this.progression = attracted;
      this.pickupRuntime?.sync(this.progression.pickups);
    }
    const frame = collectStampedePickups(this.progression, player, {
      elapsedMs: this.session.elapsedMs
    });
    if (frame.collected.length === 0) return false;

    this.progression = frame.state;
    for (let index = 0; index < frame.heartsCollected; index += 1) {
      this.session = recoverStampedeContact(this.session);
    }
    for (let index = 0; index < frame.giftsCollected; index += 1) {
      this.openGift(player);
    }
    this.pickupRuntime?.sync(this.progression.pickups);
    this.updateHud(pressure);

    if (this.progression.upgradeDraftStatus !== 'pending') return false;
    this.showUpgradeDraft();
    return true;
  }

  private openGift(player: { x: number; y: number }): void {
    switch (rollStampedeGift(this.session.contacts > 0, Math.random, !isStampedeJokeReady(this.jokeMeter))) {
      case 'punchline':
        this.jokeMeter = fillStampedeJokeMeter(this.jokeMeter);
        this.eventLook?.showBanner('Punchline!', 'Your dad joke is ready');
        return;
      case 'magnet':
        this.magnetUntilMs = this.time.now + STAMPEDE_MAGNET_MS;
        this.eventLook?.showBanner('Magnetic personality', 'Every scrap on the page flies to you');
        return;
      case 'ghosting':
        this.swarmRuntime?.scatter(player, STAMPEDE_GHOSTING_MS);
        this.eventLook?.showBanner('Ghosting', 'Everyone backs off for a moment');
        return;
      case 'heal':
        this.session = recoverStampedeContact(this.session);
        this.eventLook?.showBanner('Self care', 'One heart back');
    }
  }

  private revealPendingDraft(): boolean {
    const next = openStampedeDraftIfReady(this.progression, this.session.elapsedMs);
    if (next === this.progression) return false;
    this.progression = next;
    this.showUpgradeDraft();
    return true;
  }

  private updatePlayerInkTilt(time: number, velocity: StampedeVelocity): void {
    if (!this.player) return;
    const speed = Math.hypot(velocity.x, velocity.y);
    this.player.setAngle(speed > 0 ? Math.sin(time / 95) * 6 : 0);
    if (velocity.x !== 0) {
      this.player.setFlipX(velocity.x < 0);
    }
  }

  private updatePlayerContactRing(pressure?: StampedePressureSnapshot): void {
    if (!this.player || !this.playerContactRing) return;

    const nearestDistance = pressure?.nearestContactDistance ?? Number.POSITIVE_INFINITY;
    const danger =
      pressure?.withinContactRadius === true ||
      this.session.recentContact ||
      nearestDistance < 24;

    this.syncPlayerDepth();
    this.playerContactRing
      .setPosition(this.player.x, this.player.y)
      .setRadius(STAMPEDE_PLAYER_CONTACT_RADIUS)
      .setScale(danger ? 1.08 : 1)
      .setStrokeStyle(
        danger ? 3 : 2,
        danger ? 0xb4533d : 0x1a1a1a,
        danger ? 0.82 : 0.32
      );
  }

  private readPlayerStartPosition(): { x: number; y: number } {
    return clampStampedePosition({
      x: STAMPEDE_WORLD.width / 2,
      y: STAMPEDE_WORLD.height / 2 + 70
    });
  }

  private handleSceneUiAction(action: SceneUiActionId, params?: unknown): void {
    switch (action) {
      case 'start':
        return;
      case 'stampedeUpgradeChoice':
        if (!this.hasRunStarted) {
          this.startWithWeapon(params);
          return;
        }
        this.handleUpgradeChoice(params);
        return;
      case 'retry':
        if (this.session.phase !== 'playing') {
          this.restartRun();
        }
        return;
      case 'backToRidge':
        this.closeToStreet();
        return;
      case 'stampedeKeepGoing':
        this.continueEndless();
        return;
    }
  }

  private continueEndless(): void {
    const next = continueStampedeSessionEndless(this.session);
    if (next === this.session) return;
    this.session = next;
    this.shownResultPhase = undefined;
    bridgeActions.clearSceneUiPanel(STAMPEDE_SKETCH_SCENE_ID);
    this.inputRuntime?.setPointerControlEnabled(true);
    this.inputRuntime?.clearPointerControl();
    this.inputRuntime?.updateStickVisuals();
    this.eventLook?.showBanner('Endless mode', 'They never stop coming. How long can you last?');
    this.updateHud();
  }

  private startWithWeapon(params: unknown): void {
    if (this.hasRunStarted) return;
    const weaponId = readUpgradeId(params);
    if (!isStampedeWeaponId(weaponId)) return;
    this.progression = grantStampedeStartingWeapon(this.progression, weaponId);
    this.startRun();
  }

  private startRun(): void {
    this.hasRunStarted = true;
    bridgeActions.clearSceneUiPanel(STAMPEDE_SKETCH_SCENE_ID);
    this.inputRuntime?.setPointerControlEnabled(true);
    this.inputRuntime?.clearPointerControl();
    this.inputRuntime?.updateStickVisuals();
    this.syncFakeGlassesLook();
    this.updateHud();
  }

  private handleUpgradeChoice(params: unknown): void {
    if (this.openDraft === 'none') return;
    const upgradeId = readUpgradeId(params);
    if (!isStampedeUpgradeId(upgradeId)) return;

    this.progression = applyStampedeUpgradeChoice(
      this.progression,
      upgradeId,
      this.session.elapsedMs,
      { free: this.openDraft === 'free' }
    );
    if (upgradeId === 'catchBreath') {
      this.session = recoverStampedeContact(this.session);
    }
    const profile = resolveStampedeAutoAttackProfile(
      this.progression.appliedUpgradeIds,
      this.progression.upgradedWeaponIds
    );
    this.autoAttackState = {
      ...this.autoAttackState,
      nextFireAtMs: Math.min(
        this.autoAttackState.nextFireAtMs,
        this.session.elapsedMs + profile.cooldownMs
      )
    };
    this.openDraft = 'none';
    bridgeActions.clearSceneUiPanel(STAMPEDE_SKETCH_SCENE_ID);
    this.inputRuntime?.setPointerControlEnabled(true);
    this.inputRuntime?.clearPointerControl();
    this.inputRuntime?.updateStickVisuals();
    this.syncFakeGlassesLook();
    this.updateHud();
  }

  private syncFakeGlassesLook(): void {
    if (!this.player) return;
    const wearing = this.progression.appliedUpgradeIds.includes('fakeGlasses');
    const textureKey = wearing ? 'player_glasses' : 'player_idle';
    if (this.player.texture.key !== textureKey && this.textures.exists(textureKey)) {
      this.player.setTexture(textureKey);
    }
  }

  private showFreeDraft(): void {
    this.mirror = null;
    this.mirrorCharging = false;
    this.eventLook?.syncMirror(null, this.time.now, false);
    if (this.showUpgradeDraft('free')) return;
    this.session = recoverStampedeContact(this.session);
    this.eventLook?.showBanner('Looking good', 'The mirror patched you up');
  }

  private showUpgradeDraft(source: Exclude<StampedeOpenDraft, 'none'> = 'scraps'): boolean {
    if (this.openDraft !== 'none') return false;

    const choices = getStampedeUpgradeChoices(
      this.progression.appliedUpgradeIds,
      this.progression.upgradedWeaponIds,
      Math.random,
      this.progression.draftsTaken,
      {
        healthRemaining: stampedeContactLimit(this.progression.bonusHearts) - this.session.contacts,
        contactLimit: stampedeContactLimit(this.progression.bonusHearts),
        bonusHearts: this.progression.bonusHearts,
        shellOwned: this.progression.appliedUpgradeIds.includes('shell')
      }
    );
    if (choices.length === 0) {
      if (source === 'scraps') {
        this.progression = {
          ...this.progression,
          upgradeDraftStatus: 'none',
          scrapGoal: 0
        };
      }
      return false;
    }

    this.openDraft = source;
    this.spellVfx?.aim({
      spellId: resolveEquippedSpell(this.progression.appliedUpgradeIds) ?? 'badBreath',
      origin: { x: this.player?.x ?? 0, y: this.player?.y ?? 0 },
      direction: this.lastFacing,
      ready: false
    });
    this.player?.setVelocity(0, 0);
    this.inputRuntime?.setPointerControlEnabled(false);
    bridgeActions.setSceneUiPanel(
      STAMPEDE_SKETCH_SCENE_ID,
      'stampedeUpgradeDraft',
      {
        choices,
        scrapsCollected: this.progression.scrapsCollected,
        scrapGoal: this.progression.scrapGoal,
        gift: source === 'free'
      }
    );
    return true;
  }

  private showStartPrompt(): void {
    bridgeActions.setSceneUiPanel(
      STAMPEDE_SKETCH_SCENE_ID,
      'stampedeStartPrompt',
      { choices: getStampedeStartingWeaponChoices() }
    );
  }

  private showResultPanel(view: StampedeResultViewModel): void {
    bridgeActions.setSceneUiPanel(
      STAMPEDE_SKETCH_SCENE_ID,
      'stampedeResult',
      view
    );
  }

  private peekWeaponHitIds(elapsedMs: number, deltaMs: number, now: number): readonly string[] {
    return [
      ...this.resolveBreath(elapsedMs)?.hitIds ?? [],
      ...this.resolveStink(elapsedMs, deltaMs)?.hitIds ?? [],
      ...this.resolveGlassesCast(now)?.hitIds ?? []
    ];
  }

  private resolveBreath(elapsedMs: number) {
    if (!this.player || !this.swarmRuntime) return null;
    const owned = this.progression.appliedUpgradeIds.includes('badBreath')
      || this.progression.upgradedWeaponIds.includes('badBreath');
    if (!owned) return null;
    const legacy = this.progression.upgradedWeaponIds.includes('badBreath');
    const beam = getBreathBeam({
      wide: legacy || this.progression.appliedUpgradeIds.includes('breathWide'),
      crosswind: this.progression.appliedUpgradeIds.includes('breathCross')
    });
    const bubbles = sampleBreathBubbles(
      { x: this.player.x, y: this.player.y },
      this.lastFacing,
      beam
    );
    const linger = legacy || this.progression.appliedUpgradeIds.includes('breathLinger')
      ? pushBreathLinger(this.breathLinger, bubbles, elapsedMs)
      : [];
    return {
      bubbles,
      linger,
      ...stepBreathBeam({
        state: this.breathHits,
        beam,
        elapsedMs,
        player: { x: this.player.x, y: this.player.y },
        facing: this.lastFacing,
        candidates: this.swarmRuntime.getSpellCandidates(),
        linger
      })
    };
  }

  private resolveStink(elapsedMs: number, deltaMs: number) {
    if (!this.player || !this.swarmRuntime) return null;
    const owned = this.progression.appliedUpgradeIds.includes('badSmell')
      || this.progression.upgradedWeaponIds.includes('badSmell');
    if (!owned) return null;
    return stepOrbitHits({
      state: this.stinkState,
      aura: this.currentStinkAura(),
      elapsedMs,
      deltaMs,
      player: { x: this.player.x, y: this.player.y },
      candidates: this.swarmRuntime.getSpellCandidates()
    });
  }

  private currentStinkAura() {
    const applied = this.progression.appliedUpgradeIds;
    const legacy = this.progression.upgradedWeaponIds.includes('badSmell');
    return getStinkAura({
      far: applied.includes('smellFar'),
      fast: legacy || applied.includes('smellFast'),
      twin: legacy || applied.includes('smellTwin'),
      fat: applied.includes('smellFat')
    });
  }

  private resolveGlassesCast(now: number) {
    if (!this.player || !this.swarmRuntime) return null;
    const spellId = 'fakeGlasses' as const;
    const owned = this.progression.appliedUpgradeIds.includes(spellId)
      || this.progression.upgradedWeaponIds.includes(spellId);
    if (!owned || now < (this.spellCooldownReadyAt[spellId] ?? 0)) return null;
    return resolveStampedeSpellCast({
      spellId,
      player: { x: this.player.x, y: this.player.y },
      facing: this.lastFacing,
      candidates: this.swarmRuntime.getSpellCandidates(),
      mods: this.progression.appliedUpgradeIds,
      rank: getStampedeWeaponRank(
        this.progression.appliedUpgradeIds,
        this.progression.upgradedWeaponIds,
        spellId
      ) === 2 ? 2 : 1
    });
  }

  private tickBreath(): void {
    const resolved = this.resolveBreath(this.session.elapsedMs);
    if (!resolved) {
      this.breathHits = createBreathHitState();
      this.breathBubbles = [];
      this.breathLinger = [];
      return;
    }
    this.breathBubbles = resolved.bubbles;
    this.breathLinger = resolved.linger;
    this.breathHits = resolved.state;
    this.applyWeaponHits(resolved.hitIds);
  }

  private tickStink(deltaMs: number): void {
    const resolved = this.resolveStink(this.session.elapsedMs, deltaMs);
    if (!resolved) {
      this.stinkState = createOrbitHitState();
      this.stinkPoints = [];
      return;
    }
    this.stinkState = resolved.state;
    this.stinkPoints = resolved.points;
    this.applyWeaponHits(resolved.hitIds);
  }

  private applyWeaponHits(hitIds: readonly string[]): void {
    this.dropPickups(this.swarmRuntime?.clearMarks(hitIds, 'poison') ?? []);
  }

  private dropPickups(clearedMarks: readonly StampedeClearedMarkPoint[]): void {
    if (clearedMarks.length === 0) return;
    this.jokeMeter = stepStampedeJokeMeter(this.jokeMeter, 0, clearedMarks.length);
    this.progression = spawnStampedePickupsFromClearedMarks(this.progression, clearedMarks);
    clearedMarks.forEach((mark) => {
      const dropsGift = mark.kind === 'ex'
        || mark.kind === 'boyfriend'
        || (mark.kind === 'rooster' && Math.random() < STAMPEDE_ROOSTER_GIFT_CHANCE);
      if (dropsGift) this.progression = spawnStampedeGiftPickup(this.progression, mark);
      if (mark.kind === 'boyfriend') this.eventLook?.showBanner("Brad's down", 'Big gift on the floor');
    });
    this.pickupRuntime?.sync(this.progression.pickups);
  }

  private syncKitLook(): void {
    if (!this.player || !this.kitLook) return;
    const rank = (weapon: 'badBreath' | 'badSelfie' | 'fakeGlasses') => getStampedeWeaponRank(
      this.progression.appliedUpgradeIds,
      this.progression.upgradedWeaponIds,
      weapon
    );
    const shellOwned = this.progression.appliedUpgradeIds.includes('shell');
    const shellAngle = this.session.elapsedMs / 280;
    this.kitLook.sync({
      x: this.player.x,
      y: this.player.y,
      nowMs: this.session.elapsedMs,
      disarmed: this.time.now < this.disarmedUntilMs,
      breathBubbles: this.breathBubbles,
      lingerBubbles: this.breathLinger,
      stinkPoints: this.stinkPoints,
      stinkRadius: this.currentStinkAura().hitRadius,
      selfieRank: rank('badSelfie'),
      selfieRear: this.progression.appliedUpgradeIds.includes('selfieRear'),
      glassesRank: rank('fakeGlasses'),
      shell: shellOwned
        ? {
          x: this.player.x + Math.cos(shellAngle) * 50,
          y: this.player.y + Math.sin(shellAngle) * 50,
          ready: this.session.elapsedMs >= this.shellReadyAtMs
        }
        : null
    });
  }

  private maybeOfferClutchHeart(): void {
    if (!this.player || this.session.phase !== 'playing') return;
    const remaining = stampedeContactLimit(this.progression.bonusHearts) - this.session.contacts;
    if (remaining > 1) {
      this.clutchHeartOffered = false;
      return;
    }
    if (remaining !== 1 || this.clutchHeartOffered) return;
    this.clutchHeartOffered = true;
    if (this.progression.pickups.some((pickup) => pickup.kind === 'heart')) return;
    if (!offerClutchHeart()) return;
    this.progression = spawnStampedeHeartPickup(this.progression, this.player);
    this.pickupRuntime?.sync(this.progression.pickups);
  }

  private trackFacing(velocity: StampedeVelocity): void {
    const speed = Math.hypot(velocity.x, velocity.y);
    if (speed > 24) {
      this.lastFacing = { x: velocity.x / speed, y: velocity.y / speed };
    }
  }

  private fireOwnedSpells(now: number): void {
    if (!this.player || !this.swarmRuntime) return;

    const cast = this.resolveGlassesCast(now);
    if (!cast) return;

    this.spellCooldownReadyAt.fakeGlasses = now + cast.cooldownMs;
    this.swarmRuntime.showResisted(cast.resistedIds);
    const glassesFreeze = this.progression.appliedUpgradeIds.includes('glassesStare');
    const clearedMarks = this.swarmRuntime.clearMarks(
      cast.hitIds,
      glassesFreeze ? 'daze' : undefined,
      1_100
    );
    this.dropPickups(clearedMarks);
    this.spellVfx?.show(cast);
  }

  private publishStatus(snapshot: StampedeHudSnapshot): void {
    const statusKey = stampedeStatusKey(snapshot);

    if (statusKey === this.lastPublishedStatusKey) return;
    this.lastPublishedStatusKey = statusKey;
    bridgeActions.setSceneUiStatus(
      STAMPEDE_SKETCH_SCENE_ID,
      'stampedeStatus',
      snapshot
    );
  }

  private consumeSceneControlPointerEvents(): void {
    const events = bridgeActions.consumeSceneControlPointerEvents(STAMPEDE_SKETCH_SCENE_ID);
    events.forEach((event) => this.handleSceneControlPointerEvent(event));
  }

  private handleSceneControlPointerEvent(event: SceneControlPointerEvent): void {
    this.inputRuntime?.handleControlPointerEvent({
      kind: event.kind,
      pointerId: event.pointerId,
      x: event.x,
      y: event.y
    });
  }
}

function readUpgradeId(params: unknown): unknown {
  if (!params || typeof params !== 'object') return undefined;
  return (params as { upgradeId?: unknown }).upgradeId;
}

function stampedeStatusKey(snapshot: StampedeHudSnapshot): string {
  return [timerKey(snapshot), copyKey(snapshot), kitKey(snapshot)].join('|');
}

function timerKey(snapshot: StampedeHudSnapshot): string {
  const seconds = snapshot.timeRemainingSeconds ?? snapshot.timerSeconds ?? 0;
  return [Math.ceil(seconds), Math.round((snapshot.pageNoise ?? 0) * 100)].join('|');
}

function copyKey(snapshot: StampedeHudSnapshot): string {
  return [
    snapshot.phaseLabel ?? '',
    snapshot.feedback ?? '',
    snapshot.contacts ?? '',
    snapshot.contactLimit ?? '',
    snapshot.healthRemaining ?? ''
  ].join('|');
}

function kitKey(snapshot: StampedeHudSnapshot): string {
  return [
    snapshot.scrapsCollected ?? '',
    snapshot.scrapGoal ?? '',
    snapshot.spellLabel ?? '',
    snapshot.spellReady ? 1 : 0,
    Math.ceil(snapshot.spellCooldownSeconds ?? 0),
    Math.floor((snapshot.jokeCharge ?? 0) * 20),
    snapshot.jokeReady ? 1 : 0
  ].join('|');
}

function soonestSpellCooldown(
  spellIds: readonly StampedeSpellId[],
  readyAt: Partial<Record<StampedeSpellId, number>>,
  now: number
): number {
  if (spellIds.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...spellIds.map((spellId) => Math.max(0, (readyAt[spellId] ?? 0) - now)));
}
