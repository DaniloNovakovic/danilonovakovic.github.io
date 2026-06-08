import * as Phaser from 'phaser';
import type { InputCommandFrame } from '../../core/input/commands';
import { createInputCommandFrame } from '../../core/input/commands';
import {
  PlayerController,
  type PlayerControllerConfig,
  type PlayerStepResult
} from '../../core/player/PlayerController';
import type { ResumeSnapshot } from '../../sceneLifecycle/types';
import { bindSideViewKeyboard } from '../input/noOpKeyboard';
import type { SceneInputKeys } from '../input/readSceneInputCommands';
import { readPlayerSceneStep } from '../input/scenePlayerInput';
import { setSceneKeyboardPaused } from '../sceneKeyboardPause';
import {
  createSideViewCameraRuntime,
  type SideViewCameraDesignSize,
  type SideViewCameraProfile,
  type SideViewCameraRuntime,
  type SideViewCameraViewportSize,
  type SideViewCameraWorldBounds
} from '../camera/sideViewCameraRuntime';

export interface SideViewPlayerResumeClamp {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Shared lifecycle config for side-view Phaser scenes. Scenes still own layout,
 * colliders, room props, and interaction effects; this runtime owns player spawn,
 * input, optional camera follow, pause propagation, controller updates, appearance sync, and resume capture.
 */
export interface SideViewPlayerRuntimeOptions {
  scene: Phaser.Scene;
  start: ResumeSnapshot;
  /** Optional restored position; clamped before sprite creation when resumeClamp is set. */
  resumePosition?: ResumeSnapshot;
  resumeClamp?: SideViewPlayerResumeClamp;
  sprite?: {
    textureKey?: string;
    depth?: number;
    collideWorldBounds?: boolean;
    gravityY: number;
  };
  movement: PlayerControllerConfig;
  input: {
    allowJump: boolean;
    allowSprint: boolean;
    includeEscapeKey?: boolean;
  };
  appearance?: {
    isGlassesEquipped: () => boolean;
    idleTextureKey: string;
    glassesTextureKey: string;
  };
  camera?: {
    worldBounds: SideViewCameraWorldBounds;
    designSize: SideViewCameraDesignSize;
    resolveProfile?: (viewport: SideViewCameraViewportSize) => SideViewCameraProfile;
    profile?: SideViewCameraProfile;
  };
}

export type SideViewPlayerRuntimeUpdate =
  | { paused: true }
  | { paused: false; commands: InputCommandFrame; step: PlayerStepResult };

export interface SideViewPlayerRuntime {
  readonly player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  readonly controller: PlayerController;
  readonly cameraRuntime?: SideViewCameraRuntime;
  setPaused(paused: boolean): void;
  captureResume(): ResumeSnapshot | null;
  update(): SideViewPlayerRuntimeUpdate;
  syncAppearance(): void;
}

const DEFAULT_TEXTURE_KEY = 'player_idle';
const WALK_BOB_PERIOD_MS = 100;
const WALK_BOB_ANGLE_DEGREES = 5;

function resolveStartPosition(options: SideViewPlayerRuntimeOptions): ResumeSnapshot {
  const raw = options.resumePosition ?? options.start;
  if (!options.resumeClamp) return raw;
  return {
    x: Phaser.Math.Clamp(raw.x, options.resumeClamp.minX, options.resumeClamp.maxX),
    y: Phaser.Math.Clamp(raw.y, options.resumeClamp.minY, options.resumeClamp.maxY)
  };
}

class PhaserSideViewPlayerRuntime implements SideViewPlayerRuntime {
  readonly player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  readonly controller: PlayerController;
  readonly cameraRuntime?: SideViewCameraRuntime;

  private readonly options: SideViewPlayerRuntimeOptions;
  private readonly inputFrame = createInputCommandFrame();
  private readonly inputKeys: SceneInputKeys;
  private isPaused = false;
  private hasGlassesSprite: boolean | null = null;

  constructor(options: SideViewPlayerRuntimeOptions) {
    this.options = options;
    const { scene } = options;
    const start = resolveStartPosition(options);
    const textureKey = options.sprite?.textureKey ?? DEFAULT_TEXTURE_KEY;

    this.player = scene.physics.add.sprite(start.x, start.y, textureKey);
    if (options.sprite?.depth !== undefined) {
      this.player.setDepth(options.sprite.depth);
    }
    this.player.setCollideWorldBounds(options.sprite?.collideWorldBounds ?? true);
    this.player.setGravityY(options.sprite?.gravityY ?? 1000);

    this.controller = new PlayerController(options.movement);
    this.controller.mount(this.player);
    this.cameraRuntime = createPlayerCameraRuntime(options, this.player);

    this.inputKeys = bindSideViewKeyboard(scene.input.keyboard, {
      includeEscapeKey: options.input.includeEscapeKey
    });
  }

  setPaused(paused: boolean): void {
    this.isPaused = paused;
    if (paused) this.controller.pause();
    else this.controller.resume();
    setSceneKeyboardPaused(this.options.scene, paused, {
      pausePhysicsWorld: true,
      zeroHorizontalVelocity: () => this.controller.zeroVelocity()
    });
  }

  captureResume(): ResumeSnapshot | null {
    if (!this.player?.body) return null;
    return { x: this.player.x, y: this.player.y };
  }

  update(): SideViewPlayerRuntimeUpdate {
    this.syncAppearance();
    if (this.isPaused) {
      this.controller.zeroVelocity();
      return { paused: true };
    }

    const { commands, step } = readPlayerSceneStep({
      frame: this.inputFrame,
      controller: this.controller,
      ...this.inputKeys,
      allowJump: this.options.input.allowJump,
      allowSprint: this.options.input.allowSprint
    });

    this.player.setFlipX(step.facingLeft);
    this.player.setAngle(
      step.moving
        ? Math.sin(this.options.scene.time.now / WALK_BOB_PERIOD_MS) * WALK_BOB_ANGLE_DEGREES
        : 0
    );

    return { paused: false, commands, step };
  }

  syncAppearance(): void {
    if (!this.options.appearance) return;
    const hasGlasses = this.options.appearance.isGlassesEquipped();
    if (hasGlasses === this.hasGlassesSprite) return;
    this.hasGlassesSprite = hasGlasses;
    this.player.setTexture(
      hasGlasses
        ? this.options.appearance.glassesTextureKey
        : this.options.appearance.idleTextureKey
    );
  }
}

function createPlayerCameraRuntime(
  options: SideViewPlayerRuntimeOptions,
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
): SideViewCameraRuntime | undefined {
  if (!options.camera) return undefined;
  const profile = options.camera.profile ?? { zoom: 1, followOffsetY: 0 };

  return createSideViewCameraRuntime({
    scene: options.scene,
    followTarget: player,
    worldBounds: options.camera.worldBounds,
    designSize: options.camera.designSize,
    resolveProfile: options.camera.resolveProfile ?? (() => profile)
  });
}

/**
 * Creates the shared side-view player runtime. Scenes must create physics colliders
 * after this returns so they can attach colliders to `runtime.player`.
 */
export function createSideViewPlayerRuntime(
  options: SideViewPlayerRuntimeOptions
): SideViewPlayerRuntime {
  return new PhaserSideViewPlayerRuntime(options);
}
