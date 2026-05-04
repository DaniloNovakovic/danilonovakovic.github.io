import * as Phaser from 'phaser';
import type { InputCommandFrame } from '../../core/input/commands';
import { createInputCommandFrame } from '../../core/input/commands';
import {
  PlayerController,
  type PlayerControllerConfig,
  type PlayerStepResult
} from '../../core/player/PlayerController';
import type { ResumeSnapshot } from '../../kernel/types';
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

function noOpKey(): Phaser.Input.Keyboard.Key {
  return { isDown: false } as Phaser.Input.Keyboard.Key;
}

function noOpCursors(): Phaser.Types.Input.Keyboard.CursorKeys {
  return {
    left: noOpKey(),
    right: noOpKey(),
    up: noOpKey(),
    shift: noOpKey(),
    down: noOpKey(),
    space: noOpKey()
  } as Phaser.Types.Input.Keyboard.CursorKeys;
}

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
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: { a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
  private readonly interactKey: Phaser.Input.Keyboard.Key;
  private readonly hKey: Phaser.Input.Keyboard.Key;
  private readonly escapeKey?: Phaser.Input.Keyboard.Key;
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

    const keyboard = scene.input.keyboard;
    this.cursors = keyboard?.createCursorKeys() ?? noOpCursors();
    this.wasd = {
      a: keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A) ?? noOpKey(),
      d: keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D) ?? noOpKey()
    };
    this.interactKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E) ?? noOpKey();
    this.hKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.H) ?? noOpKey();
    this.escapeKey = options.input.includeEscapeKey
      ? keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC) ?? noOpKey()
      : undefined;
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
      cursors: this.cursors,
      wasd: this.wasd,
      interactKey: this.interactKey,
      hKey: this.hKey,
      escapeKey: this.escapeKey,
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

export function createSideViewPlayerRuntime(
  options: SideViewPlayerRuntimeOptions
): SideViewPlayerRuntime {
  return new PhaserSideViewPlayerRuntime(options);
}
