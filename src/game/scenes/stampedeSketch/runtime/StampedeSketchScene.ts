import * as Phaser from 'phaser';
import { bridgeActions } from '@/game/bridge/store';
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
import type { StampedePressureSnapshot } from './pressure';
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

interface StampedeSketchSceneStartData {
  onClose?: () => void;
  isPaused?: boolean;
}

export class StampedeSketchScene extends Phaser.Scene {
  private player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private inputRuntime?: StampedeInputRuntime;
  private swarmRuntime?: StampedeSwarmRuntime;
  private feedbackRuntime?: StampedeFeedbackRuntime;
  private autoAttackRuntime?: StampedeAutoAttackPresentationRuntime;
  private session: StampedeSession = createStampedeSession();
  private autoAttackState: StampedeAutoAttackState = createStampedeAutoAttackState();
  private shownResultPhase?: Exclude<StampedeSessionPhase, 'playing'>;
  private lastPublishedStatusKey = '';
  private hasRunStarted = false;
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
    this.session = createStampedeSession();
    this.autoAttackState = createStampedeAutoAttackState();
    this.shownResultPhase = undefined;
    this.lastPublishedStatusKey = '';
    this.hasRunStarted = false;
    this.updateHud();
    this.showStartPrompt();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      bridgeActions.clearSceneUi(STAMPEDE_SKETCH_SCENE_ID);
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
      this.handleSceneUiAction(sceneUiAction.action);
      return;
    }

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
      deltaMs: delta,
      closeRequested,
      velocity: this.inputRuntime.readVelocity(),
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
        this.updatePlayerInkTilt(time, frame.velocity);
        this.applyAutoAttack(frame.attack);
        if (frame.contactCandidate) {
          this.feedbackRuntime?.showContact(this.player, frame.contactCandidate);
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
    this.shownResultPhase = undefined;
    this.lastPublishedStatusKey = '';
    this.hasRunStarted = true;
    bridgeActions.clearSceneUiPanel(STAMPEDE_SKETCH_SCENE_ID);
    this.autoAttackRuntime?.reset();
    this.feedbackRuntime?.reset();
    this.swarmRuntime?.reset();
    this.inputRuntime?.setPointerControlEnabled(true);
    this.inputRuntime?.clearPointerControl();

    const start = this.readPlayerStartPosition();
    this.player
      ?.setPosition(start.x, start.y)
      .setVelocity(0, 0)
      .setAlpha(1)
      .setScale(0.82)
      .setAngle(0);

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
    if (frame.contactCandidate) {
      this.feedbackRuntime?.showContact(this.player, frame.contactCandidate);
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
      pressure
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

    this.swarmRuntime?.clearMarks(attack.hitIds);
    this.autoAttackRuntime?.show(attack);
  }

  private updatePlayerInkTilt(time: number, velocity: StampedeVelocity): void {
    if (!this.player) return;
    const speed = Math.hypot(velocity.x, velocity.y);
    this.player.setAngle(speed > 0 ? Math.sin(time / 95) * 6 : 0);
    if (velocity.x !== 0) {
      this.player.setFlipX(velocity.x < 0);
    }
  }

  private readPlayerStartPosition(): { x: number; y: number } {
    return clampStampedePosition({
      x: GAME_DESIGN_WIDTH / 2,
      y: GAME_DESIGN_HEIGHT / 2 + 36
    });
  }

  private handleSceneUiAction(action: SceneUiActionId): void {
    switch (action) {
      case 'start':
        if (!this.hasRunStarted) {
          this.startRun();
        }
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
    this.inputRuntime?.clearPointerControl();
    this.inputRuntime?.updateStickVisuals();
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
      snapshot.feedback ?? ''
    ].join('|');

    if (statusKey === this.lastPublishedStatusKey) return;
    this.lastPublishedStatusKey = statusKey;
    bridgeActions.setSceneUiStatus(
      STAMPEDE_SKETCH_SCENE_ID,
      'stampedeStatus',
      snapshot
    );
  }
}
