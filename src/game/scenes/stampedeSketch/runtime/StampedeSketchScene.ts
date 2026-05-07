import * as Phaser from 'phaser';
import { PHASER_SCENE_KEYS } from '@/game/scenes/sceneIds';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH
} from '@/game/sharedSceneRuntime/config';
import { setSceneKeyboardPaused } from '@/game/sharedSceneRuntime/sceneKeyboardPause';
import { TextureGenerator } from '@/game/sharedSceneRuntime/textures/TextureGenerator';
import {
  STAMPEDE_BACK_BOUNDS,
  drawStampedeArena
} from './arenaPresentation';
import {
  createStampedeFeedbackRuntime,
  type StampedeFeedbackRuntime
} from './feedbackPresentation';
import {
  createStampedeHudRuntime,
  createStampedeHudSnapshot,
  type StampedeHudRuntime
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
  resolveStampedePressure,
  type StampedePressureSnapshot
} from './pressure';
import {
  advanceStampedeSession,
  createStampedeSession,
  readStampedeSessionSnapshot,
  resolveStampedeContact,
  type StampedeSession
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
  private hudRuntime?: StampedeHudRuntime;
  private feedbackRuntime?: StampedeFeedbackRuntime;
  private session: StampedeSession = createStampedeSession();
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

    this.cameras.main.setBackgroundColor('#fbfbf9');
    this.physics.world.setBounds(0, 0, GAME_DESIGN_WIDTH, GAME_DESIGN_HEIGHT);
    this.physics.world.gravity.set(0, 0);

    drawStampedeArena(this, () => this.closeToRidge());
    this.createPlayer();
    this.inputRuntime = createStampedeInputRuntime({
      scene: this,
      backBounds: STAMPEDE_BACK_BOUNDS
    });
    this.swarmRuntime = createStampedeSwarmRuntime({ scene: this });
    this.hudRuntime = createStampedeHudRuntime({ scene: this });
    this.feedbackRuntime = createStampedeFeedbackRuntime({ scene: this });
    this.session = createStampedeSession();
    this.updateHud();
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

    if (this.inputRuntime.closeRequested()) {
      this.closeToRidge();
      return;
    }

    this.session = advanceStampedeSession(this.session, delta);
    if (this.session.phase !== 'playing') {
      this.player.setVelocity(0, 0);
      this.swarmRuntime.update(this.player, delta, {
        mode: 'recover',
        pressure: this.session.phase === 'failed' ? 1 : 0.08
      });
      this.inputRuntime.updateStickVisuals();
      this.updateHud();
      this.announceTerminalPhase();
      return;
    }

    const velocity = this.inputRuntime.readVelocity();
    this.player.setVelocity(velocity.x, velocity.y);
    this.clampPlayer();
    this.updatePlayerInkTilt(time, velocity);

    const pressure = this.resolvePressureSnapshot();
    if (pressure.canContact) {
      this.session = resolveStampedeContact(this.session, this.session.elapsedMs);
      this.feedbackRuntime?.showContact(this.player, pressure.nearestContactCandidate);
    }

    this.swarmRuntime.update(this.player, delta, {
      mode: pressure.band,
      pressure: pressure.pressure
    });
    this.updateHud(pressure);
    this.announceTerminalPhase();
    this.inputRuntime.updateStickVisuals();
  }

  private createPlayer(): void {
    const start = clampStampedePosition({ x: GAME_DESIGN_WIDTH / 2, y: GAME_DESIGN_HEIGHT / 2 + 36 });
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
    this.onClose();
  }

  private resolvePressureSnapshot(): StampedePressureSnapshot {
    const player = this.player;
    const swarm = this.swarmRuntime;
    if (!player || !swarm) {
      return resolveStampedePressure({
        elapsedMs: this.session.elapsedMs,
        durationMs: this.session.durationMs,
        player: { x: 0, y: 0 },
        candidates: [],
        lastContactAtMs: this.session.lastContactAtMs
      });
    }

    return resolveStampedePressure({
      elapsedMs: this.session.elapsedMs,
      durationMs: this.session.durationMs,
      player: {
        x: player.x,
        y: player.y,
        radius: 24
      },
      candidates: swarm.getContactCandidates(),
      lastContactAtMs: this.session.lastContactAtMs
    });
  }

  private updateHud(pressure?: StampedePressureSnapshot): void {
    this.hudRuntime?.update(
      createStampedeHudSnapshot(readStampedeSessionSnapshot(this.session), pressure)
    );
  }

  private announceTerminalPhase(): void {
    this.feedbackRuntime?.announceTerminal(this.session.phase, this.player);
  }

  private clampPlayer(): void {
    if (!this.player) return;
    const clamped = clampStampedePosition({ x: this.player.x, y: this.player.y });
    this.player.setPosition(clamped.x, clamped.y);
  }

  private updatePlayerInkTilt(time: number, velocity: StampedeVelocity): void {
    if (!this.player) return;
    const speed = Math.hypot(velocity.x, velocity.y);
    this.player.setAngle(speed > 0 ? Math.sin(time / 95) * 6 : 0);
    if (velocity.x !== 0) {
      this.player.setFlipX(velocity.x < 0);
    }
  }
}
