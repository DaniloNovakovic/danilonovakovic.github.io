import * as Phaser from 'phaser';
import { bridgeActions, type SceneControlPointerEvent } from '@/game/bridge/store';
import { PHASER_SCENE_KEYS, STAMPEDE_SKETCH_SCENE_ID } from '@/game/scenes/sceneIds';
import type { SceneUiActionId } from '@/game/sceneUi/types';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH
} from '@/game/sharedSceneRuntime/config';
import { setSceneKeyboardPaused } from '@/game/sharedSceneRuntime/sceneKeyboardPause';
import { TextureGenerator } from '@/game/sharedSceneRuntime/textures/TextureGenerator';
import {
  createStampedeAutoAttackState,
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
  stepBreathBeam,
  stepOrbitHits,
  type StampedeOrbitHitState,
  type StampedeOrbitPoint
} from './auras';
import { drawStampedeArena } from './arenaPresentation';
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
  createStampedeKitLook,
  type StampedeKitLook
} from './kitPresentation';
import {
  clampStampedePosition,
  type StampedeVelocity
} from './movement';
import {
  createStampedePickupRuntime,
  type StampedePickupRuntime
} from './pickupPresentation';
import type { StampedePressureSnapshot } from './pressure';
import {
  applyStampedeUpgradeChoice,
  collectStampedePickups,
  createStampedeProgressionState,
  grantStampedeStartingWeapon,
  openStampedeDraftIfReady,
  spawnStampedePickupsFromClearedMarks,
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
  createStampedeSession,
  readStampedeSessionSnapshot,
  type StampedeSession,
  type StampedeSessionPhase
} from './session';
import {
  createStampedeSwarmRuntime,
  type StampedeSwarmRuntime
} from './swarmPresentation';
import {
  formatStampedeKitLabel,
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

export class StampedeSketchScene extends Phaser.Scene {
  private player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private playerContactRing?: Phaser.GameObjects.Arc;
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
  private isUpgradeDraftOpen = false;
  private isPaused = false;
  private spellCooldownReadyAt: Partial<Record<StampedeSpellId, number>> = {};
  private breathHits: Record<string, number> = createBreathHitState();
  private stinkState: StampedeOrbitHitState = createOrbitHitState();
  private stinkPoints: StampedeOrbitPoint[] = [];
  private disarmedUntilMs = 0;
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

    this.cameras.main.setBackgroundColor('#ffffff');
    this.physics.world.setBounds(0, 0, GAME_DESIGN_WIDTH, GAME_DESIGN_HEIGHT);
    this.physics.world.gravity.set(0, 0);

    drawStampedeArena(this);
    this.createPlayer();
    this.inputRuntime = createStampedeInputRuntime({ scene: this });
    this.swarmRuntime = createStampedeSwarmRuntime({ scene: this });
    this.feedbackRuntime = createStampedeFeedbackRuntime({ scene: this });
    this.autoAttackRuntime = createStampedeAutoAttackPresentationRuntime({ scene: this });
    this.pickupRuntime = createStampedePickupRuntime({ scene: this });
    this.spellVfx = createStampedeSpellVfx({ scene: this });
    this.kitLook = createStampedeKitLook(this);
    this.session = createStampedeSession();
    this.autoAttackState = createStampedeAutoAttackState();
    this.progression = createStampedeProgressionState();
    this.shownResultPhase = undefined;
    this.lastPublishedStatusKey = '';
    this.hasRunStarted = false;
    this.isUpgradeDraftOpen = false;
    this.spellCooldownReadyAt = {};
    this.breathHits = createBreathHitState();
    this.stinkState = createOrbitHitState();
    this.stinkPoints = [];
    this.disarmedUntilMs = 0;
    this.lastFacing = { x: 1, y: 0 };
    this.updateHud();
    this.inputRuntime.setPointerControlEnabled(false);
    this.showStartPrompt();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      bridgeActions.clearSceneUi(STAMPEDE_SKETCH_SCENE_ID);
      bridgeActions.clearSceneControlPointerEvents(STAMPEDE_SKETCH_SCENE_ID);
      this.pickupRuntime?.reset();
      this.spellVfx?.reset();
      this.kitLook?.reset();
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
    if (!this.player || !this.inputRuntime || !this.swarmRuntime) return;
    if (this.isPaused) {
      this.player.setVelocity(0, 0);
      return;
    }

    const sceneUiAction = bridgeActions.consumeSceneUiAction(STAMPEDE_SKETCH_SCENE_ID);
    if (sceneUiAction && sceneUiAction.action !== 'castSpell') {
      this.handleSceneUiAction(sceneUiAction.action, sceneUiAction.params);
      return;
    }

    if (this.isUpgradeDraftOpen) {
      this.player.setVelocity(0, 0);
      this.inputRuntime.updateStickVisuals();
      return;
    }

    this.consumeSceneControlPointerEvents();

    const closeRequested = this.inputRuntime.closeRequested();
    if (!this.hasRunStarted) {
      this.updateReadyFrame(closeRequested);
      return;
    }
    if (this.session.phase !== 'playing' && this.inputRuntime.retryRequested()) {
      this.restartRun();
      return;
    }

    const disarmed = this.time.now < this.disarmedUntilMs;
    const selfieRank = disarmed ? 0 : getStampedeWeaponRank(
      this.progression.appliedUpgradeIds,
      this.progression.upgradedWeaponIds,
      'badSelfie'
    );
    const velocity = this.inputRuntime.readVelocity({
      speed: resolveStampedeGuardianSpeed(this.progression.appliedUpgradeIds)
    });
    if (this.session.phase === 'playing') {
      this.trackFacing(velocity);
    }

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
        x: this.player.x,
        y: this.player.y,
        radius: STAMPEDE_PLAYER_CONTACT_RADIUS
      },
      contactCandidates: this.swarmRuntime.getContactCandidates()
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
          origin: { x: this.player.x, y: this.player.y },
          direction: this.lastFacing,
          ready: false
        });
        this.showTerminalFrame(frame, delta);
        return;
      case 'playing':
        this.player.setVelocity(frame.velocity.x, frame.velocity.y);
        this.player.setPosition(frame.player.x, frame.player.y);
        if (this.time.now < this.disarmedUntilMs) {
          this.breathHits = createBreathHitState();
          this.stinkState = createOrbitHitState();
          this.stinkPoints = [];
        } else {
          this.tickBreath();
          this.tickStink(delta);
          this.fireOwnedSpells(time);
        }
        const aimedSpell = resolveEquippedSpell(this.progression.appliedUpgradeIds);
        this.spellVfx?.aim({
          spellId: aimedSpell ?? 'badBreath',
          origin: { x: frame.player.x, y: frame.player.y },
          direction: this.lastFacing,
          ready: aimedSpell === 'fakeGlasses' && this.time.now >= this.disarmedUntilMs
        });
        this.updatePlayerContactRing(frame.pressure);
        this.updatePlayerInkTilt(time, frame.velocity);
        this.applyAutoAttack(frame.attack);
        this.syncKitLook();
        if (this.collectPickups(frame.player, frame.pressure)) {
          this.inputRuntime.updateStickVisuals();
          return;
        }
        if (this.revealPendingDraft()) {
          this.inputRuntime.updateStickVisuals();
          return;
        }
        if (frame.contactCandidate) {
          this.feedbackRuntime?.showContact(this.player, frame.contactCandidate);
          this.updatePlayerContactRing(frame.pressure);
        }
        this.swarmRuntime.update(this.player, delta, {
          ...frame.swarm,
          elapsedMs: this.session.elapsedMs,
          playerHurting: this.session.contacts >= 2
        });
        if (this.swarmRuntime.consumeBeerHit()) {
          this.disarmedUntilMs = this.time.now + STAMPEDE_BEER_DISARM_MS;
          this.breathHits = createBreathHitState();
          this.stinkState = createOrbitHitState();
          this.stinkPoints = [];
        }
        this.syncKitLook();
        this.updateHud(frame.pressure);
        this.announceTerminalPhase();
        this.inputRuntime.updateStickVisuals();
        return;
    }
  }

  private createPlayer(): void {
    const start = this.readPlayerStartPosition();
    this.player = this.physics.add.sprite(start.x, start.y, 'player_idle');
    this.player.setDepth(30);
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
    ).setStrokeStyle(2, 0x1a1a1a, 0.32).setDepth(29);
  }

  private closeToStreet(): void {
    this.player?.setVelocity(0, 0);
    this.autoAttackRuntime?.reset();
    this.spellVfx?.reset();
    bridgeActions.clearSceneUi(STAMPEDE_SKETCH_SCENE_ID);
    this.onClose();
  }

  private restartRun(): void {
    this.session = createStampedeSession();
    this.autoAttackState = createStampedeAutoAttackState();
    this.progression = createStampedeProgressionState();
    this.shownResultPhase = undefined;
    this.lastPublishedStatusKey = '';
    this.hasRunStarted = false;
    this.isUpgradeDraftOpen = false;
    this.showStartPrompt();
    this.autoAttackRuntime?.reset();
    this.feedbackRuntime?.reset();
    this.swarmRuntime?.reset();
    this.pickupRuntime?.reset();
    this.spellVfx?.reset();
    this.kitLook?.reset();
    this.spellCooldownReadyAt = {};
    this.breathHits = createBreathHitState();
    this.stinkState = createOrbitHitState();
    this.stinkPoints = [];
    this.disarmedUntilMs = 0;
    this.lastFacing = { x: 1, y: 0 };
    this.inputRuntime?.setPointerControlEnabled(false);
    this.inputRuntime?.clearPointerControl();

    const start = this.readPlayerStartPosition();
    this.player
      ?.setPosition(start.x, start.y)
      .setVelocity(0, 0)
      .setAlpha(1)
      .setScale(0.82)
      .setAngle(0);
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
        : 'unavailable'
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

    const clearedMarks = this.swarmRuntime?.clearMarks(attack.hitIds, 'daze') ?? [];
    this.progression = spawnStampedePickupsFromClearedMarks(
      this.progression,
      clearedMarks
    );
    this.pickupRuntime?.sync(this.progression.pickups);
    this.autoAttackRuntime?.show(attack);
  }

  private collectPickups(
    player: { x: number; y: number; radius?: number },
    pressure?: StampedePressureSnapshot
  ): boolean {
    const frame = collectStampedePickups(this.progression, player, {
      elapsedMs: this.session.elapsedMs
    });
    if (frame.collected.length === 0) return false;

    this.progression = frame.state;
    this.pickupRuntime?.sync(this.progression.pickups);
    this.updateHud(pressure);

    if (this.progression.upgradeDraftStatus !== 'pending') return false;
    this.showUpgradeDraft();
    return true;
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
      x: GAME_DESIGN_WIDTH / 2,
      y: GAME_DESIGN_HEIGHT / 2 + 36
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
    }
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
    if (!this.isUpgradeDraftOpen) return;
    const upgradeId = readUpgradeId(params);
    if (!isStampedeUpgradeId(upgradeId)) return;

    this.progression = applyStampedeUpgradeChoice(
      this.progression,
      upgradeId,
      this.session.elapsedMs
    );
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
    this.isUpgradeDraftOpen = false;
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

  private showUpgradeDraft(): void {
    if (this.isUpgradeDraftOpen) return;

    const choices = getStampedeUpgradeChoices(
      this.progression.appliedUpgradeIds,
      this.progression.upgradedWeaponIds
    );
    if (choices.length === 0) {
      this.progression = {
        ...this.progression,
        upgradeDraftStatus: 'none',
        scrapGoal: 0
      };
      return;
    }

    this.isUpgradeDraftOpen = true;
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
        scrapGoal: this.progression.scrapGoal
      }
    );
  }

  private showStartPrompt(): void {
    bridgeActions.setSceneUiPanel(
      STAMPEDE_SKETCH_SCENE_ID,
      'stampedeStartPrompt'
    );
  }

  private showResultPanel(view: StampedeResultViewModel): void {
    bridgeActions.setSceneUiPanel(
      STAMPEDE_SKETCH_SCENE_ID,
      'stampedeResult',
      view
    );
  }

  private tickBreath(): void {
    if (!this.player || !this.swarmRuntime) return;
    const rank = getStampedeWeaponRank(
      this.progression.appliedUpgradeIds,
      this.progression.upgradedWeaponIds,
      'badBreath'
    );
    if (rank === 0) {
      this.breathHits = createBreathHitState();
      return;
    }
    const stepped = stepBreathBeam({
      state: this.breathHits,
      beam: getBreathBeam(rank === 2 ? 2 : 1),
      elapsedMs: this.session.elapsedMs,
      player: { x: this.player.x, y: this.player.y },
      facing: this.lastFacing,
      candidates: this.swarmRuntime.getSpellCandidates()
    });
    this.breathHits = stepped.state;
    this.applyWeaponHits(stepped.hitIds);
  }

  private tickStink(deltaMs: number): void {
    if (!this.player || !this.swarmRuntime) return;
    const rank = getStampedeWeaponRank(
      this.progression.appliedUpgradeIds,
      this.progression.upgradedWeaponIds,
      'badSmell'
    );
    if (rank === 0) {
      this.stinkState = createOrbitHitState();
      this.stinkPoints = [];
      return;
    }
    const stepped = stepOrbitHits({
      state: this.stinkState,
      aura: getStinkAura(rank === 2 ? 2 : 1),
      elapsedMs: this.session.elapsedMs,
      deltaMs,
      player: { x: this.player.x, y: this.player.y },
      candidates: this.swarmRuntime.getSpellCandidates()
    });
    this.stinkState = stepped.state;
    this.stinkPoints = stepped.points;
    this.applyWeaponHits(stepped.hitIds);
  }

  private applyWeaponHits(hitIds: readonly string[]): void {
    const clearedMarks = this.swarmRuntime?.clearMarks(hitIds, 'poison') ?? [];
    this.progression = spawnStampedePickupsFromClearedMarks(this.progression, clearedMarks);
    this.pickupRuntime?.sync(this.progression.pickups);
  }

  private syncKitLook(): void {
    if (!this.player || !this.kitLook) return;
    const rank = (weapon: 'badBreath' | 'badSelfie' | 'fakeGlasses') => getStampedeWeaponRank(
      this.progression.appliedUpgradeIds,
      this.progression.upgradedWeaponIds,
      weapon
    );
    this.kitLook.sync({
      x: this.player.x,
      y: this.player.y,
      facingX: this.lastFacing.x,
      facingY: this.lastFacing.y,
      disarmed: this.time.now < this.disarmedUntilMs,
      breathRank: rank('badBreath'),
      stinkPoints: this.stinkPoints,
      selfieRank: rank('badSelfie'),
      glassesRank: rank('fakeGlasses')
    });
  }

  private trackFacing(velocity: StampedeVelocity): void {
    const speed = Math.hypot(velocity.x, velocity.y);
    if (speed > 24) {
      this.lastFacing = { x: velocity.x / speed, y: velocity.y / speed };
    }
  }

  private fireOwnedSpells(now: number): void {
    if (!this.player || !this.swarmRuntime) return;

    resolveOwnedSpells(this.progression.appliedUpgradeIds)
      .filter((spellId) => spellId === 'fakeGlasses')
      .forEach((spellId) => {
      const readyAt = this.spellCooldownReadyAt[spellId] ?? 0;
      if (now < readyAt) return;

      const cast = resolveStampedeSpellCast({
        spellId,
        player: { x: this.player!.x, y: this.player!.y },
        facing: this.lastFacing,
        candidates: this.swarmRuntime!.getSpellCandidates(),
        rank: getStampedeWeaponRank(
          this.progression.appliedUpgradeIds,
          this.progression.upgradedWeaponIds,
          spellId
        ) === 2 ? 2 : 1
      });
      this.spellCooldownReadyAt[spellId] = now + cast.cooldownMs;
      this.swarmRuntime?.showResisted(cast.resistedIds);
      const clearedMarks = this.swarmRuntime?.clearMarks(cast.hitIds) ?? [];
      this.progression = spawnStampedePickupsFromClearedMarks(this.progression, clearedMarks);
      this.pickupRuntime?.sync(this.progression.pickups);
      this.spellVfx?.show(cast);
    });
  }

  private publishStatus(snapshot: StampedeHudSnapshot): void {
    const statusKey = [
      Math.ceil(snapshot.timeRemainingSeconds ?? snapshot.timerSeconds ?? 0),
      Math.round((snapshot.pageNoise ?? 0) * 100),
      snapshot.phaseLabel ?? '',
      snapshot.feedback ?? '',
      snapshot.contacts ?? '',
      snapshot.contactLimit ?? '',
      snapshot.healthRemaining ?? '',
      snapshot.scrapsCollected ?? '',
      snapshot.scrapGoal ?? '',
      snapshot.spellLabel ?? '',
      snapshot.spellReady ? 1 : 0,
      Math.ceil(snapshot.spellCooldownSeconds ?? 0)
    ].join('|');

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

function soonestSpellCooldown(
  spellIds: readonly StampedeSpellId[],
  readyAt: Partial<Record<StampedeSpellId, number>>,
  now: number
): number {
  if (spellIds.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...spellIds.map((spellId) => Math.max(0, (readyAt[spellId] ?? 0) - now)));
}
