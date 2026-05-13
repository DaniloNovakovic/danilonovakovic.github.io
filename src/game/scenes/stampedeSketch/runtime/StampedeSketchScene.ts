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
import { drawStampedeArena } from './arenaPresentation';
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
  spawnStampedePickupsFromClearedMarks,
  type StampedeProgressionState
} from './progression';
import {
  resolveStampedeRunFrame,
  STAMPEDE_PLAYER_CONTACT_RADIUS
} from './runFlow';
import {
  createStampedeResultViewModel,
  type StampedeResultViewModel
} from './resultPresentation';
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
  getStampedeUpgradeChoices,
  isStampedeUpgradeId,
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
  private session: StampedeSession = createStampedeSession();
  private autoAttackState: StampedeAutoAttackState = createStampedeAutoAttackState();
  private progression: StampedeProgressionState = createStampedeProgressionState();
  private shownResultPhase?: Exclude<StampedeSessionPhase, 'playing'>;
  private lastPublishedStatusKey = '';
  private hasRunStarted = false;
  private isUpgradeDraftOpen = false;
  private isPaused = false;
  private onClose: () => void = () => {};

  constructor() {
    super(PHASER_SCENE_KEYS.stampedeSketch);
  }

  init(data: StampedeSketchSceneStartData = {}): void {
    this.onClose = data.onClose ?? (() => {});
    this.isPaused = data.isPaused ?? false;
  }

  preload(): void {
    if (!this.textures.exists('player_idle')) {
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
    this.session = createStampedeSession();
    this.autoAttackState = createStampedeAutoAttackState();
    this.progression = createStampedeProgressionState();
    this.shownResultPhase = undefined;
    this.lastPublishedStatusKey = '';
    this.hasRunStarted = false;
    this.isUpgradeDraftOpen = false;
    this.updateHud();
    this.showStartPrompt();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      bridgeActions.clearSceneUi(STAMPEDE_SKETCH_SCENE_ID);
      bridgeActions.clearSceneControlPointerEvents(STAMPEDE_SKETCH_SCENE_ID);
      this.pickupRuntime?.reset();
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
    if (sceneUiAction) {
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

    const frame = resolveStampedeRunFrame({
      session: this.session,
      autoAttackState: this.autoAttackState,
      autoAttackProfile: resolveStampedeAutoAttackProfile(this.progression.appliedUpgradeIds),
      deltaMs: delta,
      closeRequested,
      velocity: this.inputRuntime.readVelocity({
        speed: resolveStampedeGuardianSpeed(this.progression.appliedUpgradeIds)
      }),
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
        this.closeToRidge();
        return;
      case 'terminal':
        this.showTerminalFrame(frame, delta);
        return;
      case 'playing':
        this.player.setVelocity(frame.velocity.x, frame.velocity.y);
        this.player.setPosition(frame.player.x, frame.player.y);
        this.updatePlayerContactRing(frame.pressure);
        this.updatePlayerInkTilt(time, frame.velocity);
        this.applyAutoAttack(frame.attack);
        if (this.collectPickups(frame.player, frame.pressure)) {
          this.inputRuntime.updateStickVisuals();
          return;
        }
        if (frame.contactCandidate) {
          this.feedbackRuntime?.showContact(this.player, frame.contactCandidate);
          this.updatePlayerContactRing(frame.pressure);
        }
        this.swarmRuntime.update(this.player, delta, frame.swarm);
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

  private closeToRidge(): void {
    this.player?.setVelocity(0, 0);
    this.autoAttackRuntime?.reset();
    bridgeActions.clearSceneUi(STAMPEDE_SKETCH_SCENE_ID);
    this.onClose();
  }

  private restartRun(): void {
    this.session = createStampedeSession();
    this.autoAttackState = createStampedeAutoAttackState();
    this.progression = createStampedeProgressionState();
    this.shownResultPhase = undefined;
    this.lastPublishedStatusKey = '';
    this.hasRunStarted = true;
    this.isUpgradeDraftOpen = false;
    bridgeActions.clearSceneUiPanel(STAMPEDE_SKETCH_SCENE_ID);
    this.autoAttackRuntime?.reset();
    this.feedbackRuntime?.reset();
    this.swarmRuntime?.reset();
    this.pickupRuntime?.reset();
    this.inputRuntime?.setPointerControlEnabled(true);
    this.inputRuntime?.clearPointerControl();

    const start = this.readPlayerStartPosition();
    this.player
      ?.setPosition(start.x, start.y)
      .setVelocity(0, 0)
      .setAlpha(1)
      .setScale(0.82)
      .setAngle(0);
    this.updatePlayerContactRing();

    this.updateHud();
    this.inputRuntime?.updateStickVisuals();
  }

  private updateReadyFrame(closeRequested: boolean): void {
    if (!this.player || !this.inputRuntime) return;
    if (closeRequested) {
      this.closeToRidge();
      return;
    }
    if (this.inputRuntime.startRequested()) {
      this.startRun();
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
    this.swarmRuntime.update(this.player, delta, frame.swarm);
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
      contacts: this.session.contacts
    });
    this.showResultPanel(view);
  }

  private updateHud(pressure?: StampedePressureSnapshot): void {
    const snapshot = createStampedeHudSnapshot(
      readStampedeSessionSnapshot(this.session),
      pressure,
      this.progression
    );
    this.publishStatus(snapshot);
  }

  private announceTerminalPhase(): void {
    this.feedbackRuntime?.announceTerminal(this.session.phase, this.player);
  }

  private applyAutoAttack(
    attack: StampedeAutoAttackEvent | null | undefined
  ): void {
    if (!attack) return;

    const clearedMarks = this.swarmRuntime?.clearMarks(attack.hitIds) ?? [];
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
    const frame = collectStampedePickups(this.progression, player);
    if (frame.collected.length === 0) return false;

    this.progression = frame.state;
    this.pickupRuntime?.sync(this.progression.pickups);
    this.updateHud(pressure);

    if (this.progression.upgradeDraftStatus !== 'pending') return false;
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
        if (!this.hasRunStarted) {
          this.startRun();
        }
        return;
      case 'stampedeUpgradeChoice':
        this.handleUpgradeChoice(params);
        return;
      case 'retry':
        if (this.session.phase !== 'playing') {
          this.restartRun();
        }
        return;
      case 'backToRidge':
        this.closeToRidge();
        return;
    }
  }

  private startRun(): void {
    this.hasRunStarted = true;
    bridgeActions.clearSceneUiPanel(STAMPEDE_SKETCH_SCENE_ID);
    this.inputRuntime?.setPointerControlEnabled(true);
    this.inputRuntime?.clearPointerControl();
    this.inputRuntime?.updateStickVisuals();
  }

  private handleUpgradeChoice(params: unknown): void {
    if (!this.isUpgradeDraftOpen) return;
    const upgradeId = readUpgradeId(params);
    if (!isStampedeUpgradeId(upgradeId)) return;

    this.progression = applyStampedeUpgradeChoice(this.progression, upgradeId);
    const profile = resolveStampedeAutoAttackProfile(this.progression.appliedUpgradeIds);
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
    this.updateHud();
  }

  private showUpgradeDraft(): void {
    if (this.isUpgradeDraftOpen) return;

    this.isUpgradeDraftOpen = true;
    this.player?.setVelocity(0, 0);
    this.inputRuntime?.setPointerControlEnabled(false);
    bridgeActions.setSceneUiPanel(
      STAMPEDE_SKETCH_SCENE_ID,
      'stampedeUpgradeDraft',
      {
        choices: getStampedeUpgradeChoices(),
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
      snapshot.scrapGoal ?? ''
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
