import * as Phaser from 'phaser';
import {
  bridgeActions,
  getTouchState,
  isItemEquipped
} from '@/game/bridge/store';
import type { InputCommandFrame } from '@/game/core/input/commands';
import { createInputCommandFrame } from '@/game/core/input/commands';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH,
  SIDE_VIEW_SPRINT_SPEED,
  SIDE_VIEW_WALK_SPEED
} from '@/game/sharedSceneRuntime/config';
import {
  createSideViewCameraRuntime,
  type SideViewCameraRuntime
} from '@/game/sharedSceneRuntime/camera/sideViewCameraRuntime';
import { bindSideViewKeyboard } from '@/game/sharedSceneRuntime/input/sceneKeyboard';
import { readSceneInputCommands } from '@/game/sharedSceneRuntime/input/readSceneInputCommands';
import type { SceneInputKeys } from '@/game/sharedSceneRuntime/input/readSceneInputCommands';
import { setSceneKeyboardPaused } from '@/game/sharedSceneRuntime/sceneKeyboardPause';
import type { ResumeSnapshot } from '@/game/sceneLifecycle/types';
import {
  BRIDGE_STAGE_SOURCE,
  getBridgeWalkRailLength,
  getNearestBridgeStageSpotId,
  projectPointToBridgeWalkRail,
  resolveBridgeStageSpot,
  sampleBridgeWalkRail,
  type BridgeRailSample,
  type BridgeStageCompositionSource,
  type BridgeStageSpotId
} from './stageComposition';

export type BridgeWalkRailPlayerRuntimeUpdate =
  | { paused: true }
  | {
      paused: false;
      commands: InputCommandFrame;
      step: {
        facingLeft: boolean;
        interactRequested: boolean;
        moving: boolean;
      };
    };

export interface BridgeWalkRailProgressRange {
  min: number;
  max: number;
}

export interface BridgeWalkRailPlayerSnapshot {
  progress: number;
  x: number;
  y: number;
  scale: number;
  depth: number;
  nearestSpotId: BridgeStageSpotId;
  sourceSnippet: string;
}

export interface BridgeWalkRailPlayerRuntime {
  readonly player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  readonly cameraRuntime?: SideViewCameraRuntime;
  setPaused(paused: boolean): void;
  setAuthoringFrozen(frozen: boolean): void;
  setCompositionSource(source: BridgeStageCompositionSource): void;
  setProgressRange(range: BridgeWalkRailProgressRange): void;
  captureResume(): ResumeSnapshot | null;
  getRailSnapshot(): BridgeWalkRailPlayerSnapshot;
  moveToWorldPosition(position: ResumeSnapshot): void;
  update(deltaMs?: number): BridgeWalkRailPlayerRuntimeUpdate;
  syncAppearance(): void;
}

export interface BridgeWalkRailPlayerRuntimeOptions {
  scene: Phaser.Scene;
  source?: BridgeStageCompositionSource;
  resumePosition?: ResumeSnapshot;
  resolveCameraZoom: () => number;
}

const DEFAULT_TEXTURE_KEY = 'player_idle_2x';
const GLASSES_TEXTURE_KEY = 'player_glasses_2x';
const WALK_BOB_PERIOD_MS = 100;
const WALK_BOB_ANGLE_DEGREES = 5;
/**
 * Base presentation scale applied on top of rail perspective cues.
 *
 * The Bridge player uses the crisp 2x procedural texture (96x130), so 0.78
 * presents the player at roughly 100px tall - in proportion with the
 * cornfield plate (corn rows ~3x player) and the Bridge cast.
 */
const PLAYER_RAIL_BASE_SCALE = 0.78;

export function createBridgeWalkRailPlayerRuntime(
  options: BridgeWalkRailPlayerRuntimeOptions
): BridgeWalkRailPlayerRuntime {
  return new PhaserBridgeWalkRailPlayerRuntime(options);
}

class PhaserBridgeWalkRailPlayerRuntime implements BridgeWalkRailPlayerRuntime {
  readonly player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  readonly cameraRuntime?: SideViewCameraRuntime;

  private readonly scene: Phaser.Scene;
  private source: BridgeStageCompositionSource;
  private railLength: number;
  private readonly commands = createInputCommandFrame();
  private readonly inputKeys: SceneInputKeys;
  private progressRange: BridgeWalkRailProgressRange = { min: 0, max: 1 };
  private progress: number;
  private facingLeft = false;
  private isPaused = false;
  private authoringFrozen = false;
  private hasGlassesSprite: boolean | null = null;
  private lastSample: BridgeRailSample;

  constructor(options: BridgeWalkRailPlayerRuntimeOptions) {
    this.scene = options.scene;
    this.source = options.source ?? BRIDGE_STAGE_SOURCE;
    this.railLength = getBridgeWalkRailLength(this.source.primaryWalkRail);

    const spawn = resolveBridgeStageSpot(this.source, 'spawn');
    const startSample = options.resumePosition
      ? projectPointToBridgeWalkRail(this.source.primaryWalkRail, options.resumePosition)
      : spawn.railPoint;

    this.progress = startSample.progress;
    this.lastSample = sampleBridgeWalkRail(this.source.primaryWalkRail, this.progress);
    this.player = this.scene.physics.add.sprite(this.lastSample.x, this.lastSample.y, DEFAULT_TEXTURE_KEY);
    this.player
      .setOrigin(0.5, 1)
      .setCollideWorldBounds(true)
      .setGravityY(0);
    this.player.body.setAllowGravity(false);
    this.player.body.setImmovable(true);
    this.applySample(this.lastSample);

    this.inputKeys = bindSideViewKeyboard(this.scene.input.keyboard, { includeEscapeKey: true });

    this.cameraRuntime = createSideViewCameraRuntime({
      scene: this.scene,
      followTarget: this.player,
      worldBounds: this.source.cameraBounds,
      designSize: {
        width: GAME_DESIGN_WIDTH,
        height: GAME_DESIGN_HEIGHT
      },
      resolveProfile: () => ({
        zoom: options.resolveCameraZoom(),
        followOffsetY: this.lastSample.cue.cameraFollowOffsetY
      })
    });
  }

  setPaused(paused: boolean): void {
    this.isPaused = paused;
    setSceneKeyboardPaused(this.scene, paused, {
      pausePhysicsWorld: true,
      zeroHorizontalVelocity: () => {
        this.player.setVelocityX(0);
        this.player.setVelocityY(0);
      }
    });
  }

  setAuthoringFrozen(frozen: boolean): void {
    this.authoringFrozen = frozen;
    if (frozen) {
      this.player.setVelocity(0, 0);
    }
  }

  setCompositionSource(source: BridgeStageCompositionSource): void {
    this.source = source;
    this.railLength = getBridgeWalkRailLength(this.source.primaryWalkRail);
    this.applySample(sampleBridgeWalkRail(this.source.primaryWalkRail, this.progress));
    this.cameraRuntime?.refresh();
  }

  setProgressRange(range: BridgeWalkRailProgressRange): void {
    this.progressRange = {
      min: clamp01(Math.min(range.min, range.max)),
      max: clamp01(Math.max(range.min, range.max))
    };
    this.progress = clamp(this.progress, this.progressRange.min, this.progressRange.max);
    this.applySample(sampleBridgeWalkRail(this.source.primaryWalkRail, this.progress));
  }

  captureResume(): ResumeSnapshot | null {
    return { x: this.player.x, y: this.player.y };
  }

  getRailSnapshot(): BridgeWalkRailPlayerSnapshot {
    const roundedProgress = Math.round(this.progress * 1000) / 1000;
    const nearestSpotId = getNearestBridgeStageSpotId(this.source, this.progress);
    return {
      progress: roundedProgress,
      x: Math.round(this.player.x),
      y: Math.round(this.player.y),
      scale: Math.round(this.lastSample.cue.scale * 100) / 100,
      depth: Math.round(this.lastSample.cue.depth),
      nearestSpotId,
      sourceSnippet: `railProgress: ${roundedProgress.toFixed(3)}`
    };
  }

  moveToWorldPosition(position: ResumeSnapshot): void {
    const projected = projectPointToBridgeWalkRail(this.source.primaryWalkRail, position);
    this.progress = clamp(projected.progress, this.progressRange.min, this.progressRange.max);
    this.applySample(sampleBridgeWalkRail(this.source.primaryWalkRail, this.progress));
    this.cameraRuntime?.refresh();
  }

  update(deltaMs: number = 16.67): BridgeWalkRailPlayerRuntimeUpdate {
    this.syncAppearance();
    if (this.isPaused || this.authoringFrozen) {
      this.player.setVelocity(0, 0);
      return { paused: true };
    }

    const commands = readSceneInputCommands({
      frame: this.commands,
      ...this.inputKeys,
      touch: getTouchState(),
      oneShots: bridgeActions.consumeTouchOneShots(),
      allowJump: false,
      allowSprint: true
    });

    const moveAxis = Math.abs(commands.moveAxis) < 0.01 ? 0 : commands.moveAxis;
    const moving = moveAxis !== 0;
    if (moving) {
      const speed = commands.sprint ? SIDE_VIEW_SPRINT_SPEED : SIDE_VIEW_WALK_SPEED;
      const deltaProgress = (moveAxis * speed * (deltaMs / 1000)) / this.railLength;
      this.progress = clamp(
        this.progress + deltaProgress,
        this.progressRange.min,
        this.progressRange.max
      );
      this.facingLeft = moveAxis < 0;
    }

    this.applySample(sampleBridgeWalkRail(this.source.primaryWalkRail, this.progress));
    this.player.setFlipX(this.facingLeft);
    this.player.setAngle(
      moving
        ? Math.sin(this.scene.time.now / WALK_BOB_PERIOD_MS) * WALK_BOB_ANGLE_DEGREES
        : 0
    );
    this.player.setVelocity(0, 0);

    return {
      paused: false,
      commands,
      step: {
        facingLeft: this.facingLeft,
        interactRequested: commands.interact,
        moving
      }
    };
  }

  syncAppearance(): void {
    const hasGlasses = isItemEquipped('glasses');
    if (hasGlasses === this.hasGlassesSprite) return;
    this.hasGlassesSprite = hasGlasses;
    this.player.setTexture(hasGlasses ? GLASSES_TEXTURE_KEY : DEFAULT_TEXTURE_KEY);
  }

  private applySample(sample: BridgeRailSample): void {
    this.lastSample = sample;
    this.player
      .setPosition(sample.x, sample.y)
      .setScale(PLAYER_RAIL_BASE_SCALE * sample.cue.scale)
      .setDepth(sample.cue.depth);
    this.scene.cameras.main.setFollowOffset(0, sample.cue.cameraFollowOffsetY);
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
