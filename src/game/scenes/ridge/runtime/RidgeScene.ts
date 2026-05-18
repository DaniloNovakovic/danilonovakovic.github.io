import * as Phaser from 'phaser';
import { PHASER_SCENE_KEYS } from '@/game/scenes/sceneIds';
import {
  bridgeStore,
  isItemEquipped,
  type OpenOverlayOptions
} from '@/game/bridge/store';
import { TRAIL_CARD_OVERLAY_ID, type OverlayId } from '@/game/overlays/overlayIds';
import { getMessages } from '@/shared/i18n';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH,
  SIDE_VIEW_JUMP_VELOCITY_Y,
  SIDE_VIEW_PLAYER_GRAVITY_Y,
  SIDE_VIEW_SPRINT_SPEED,
  SIDE_VIEW_WALK_SPEED
} from '@/game/sharedSceneRuntime/config';
import {
  createSideViewPlayerRuntime,
  type SideViewPlayerRuntime
} from '@/game/sharedSceneRuntime/player/SideViewPlayerRuntime';
import { TextureGenerator } from '@/game/sharedSceneRuntime/textures/TextureGenerator';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import {
  createInteriorInteractionRuntime,
  type InteriorInteractionRuntime
} from '@/game/sharedSceneRuntime/interactions/InteriorInteractionRuntime';
import {
  RIDGE_BLOCKOUT,
  compileRidgeBlockoutFacts,
  deriveRidgeBlockoutGeometry,
  type RidgeBlockoutGeometry,
  type RidgeBlockoutFacts
} from '../blockout';
import { getRidgeWorldMemories } from '../worldMemory';
import {
  shouldShowCickaInteractionPrompt
} from '../cicka/interaction';
import {
  createCickaAnimations,
  preloadCickaAssets
} from '../cicka/assets';
import type { CickaPerch } from '../cicka/CickaPerch';
import { resolveCickaHomeMutations } from '../cicka/homeMutations';
import {
  createRidgeTraversalRuntime,
  type RidgeTraversalRuntime
} from './ridgeTraversalRuntime';
import {
  applyRidgeDevTeleportToPlayer,
  RIDGE_DEFAULT_CAMERA_ZOOM,
  RIDGE_PLAYER_SPAWN_OFFSET_Y,
  resolveRidgeDevDebugSettings,
  resolveRidgeDevCameraZoom,
  type RidgeDevControls
} from './ridgeDevControls';
import { createRidgeBlockoutPresentation } from './ridgeBlockoutPresentation';
import { createRidgeLandmarkPresentation } from './ridgeLandmarkPresentation';
import {
  createRidgeDebugOverlay,
  type RidgeDebugOverlay
} from './ridgeDebugOverlay';
import {
  createRidgeInteractionTargets,
  type RidgeInteractionEffect,
  type RidgeInteractionTarget,
  type RidgeInteractionTargetId
} from './ridgeInteractionTargets';

interface RidgeSceneStartData {
  onClose?: () => void;
  onOpenOverlay?: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  isPaused?: boolean;
  resumePosition?: { x: number; y: number };
  ridgeDevControls?: RidgeDevControls;
}

const RIDGE_PLAYER_EDGE_PADDING = 48;
const RIDGE_COYOTE_TIME_MS = 120;
const RIDGE_JUMP_BUFFER_MS = 120;

export class RidgeScene extends Phaser.Scene {
  player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  interactPrompt?: Phaser.GameObjects.Text;

  private playerRuntime?: SideViewPlayerRuntime;
  private traversalRuntime?: RidgeTraversalRuntime;
  private interactionRuntime?: InteriorInteractionRuntime<RidgeInteractionTargetId, RidgeInteractionEffect>;
  private cickaPerch?: CickaPerch;
  private onClose: () => void = () => {};
  private onOpenOverlay?: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  private isPaused = false;
  private resumePosition?: { x: number; y: number };
  private ridgeDevControls?: RidgeDevControls;
  private currentGeometry?: RidgeBlockoutGeometry;
  private ridgeInteractionTargets: RidgeInteractionTarget[] = [];
  private ridgeDebugOverlay?: RidgeDebugOverlay;
  private ridgeSpawnPosition?: { x: number; y: number };
  private lastCameraZoom = RIDGE_DEFAULT_CAMERA_ZOOM;

  constructor() {
    super(PHASER_SCENE_KEYS.ridge);
  }

  init(data: RidgeSceneStartData = {}): void {
    this.onClose = data.onClose ?? (() => {});
    this.onOpenOverlay = data.onOpenOverlay;
    this.isPaused = data.isPaused ?? false;
    this.resumePosition = data.resumePosition;
    this.ridgeDevControls = import.meta.env.DEV ? data.ridgeDevControls : undefined;
  }

  preload(): void {
    if (!this.textures.exists('player_idle')) {
      TextureGenerator.generatePlayer(this);
    }
    preloadCickaAssets(this);
  }

  getResumeCapturePosition(): { x: number; y: number } | null {
    return this.playerRuntime?.captureResume() ?? null;
  }

  setPaused(paused: boolean): void {
    this.isPaused = paused;
    this.playerRuntime?.setPaused(paused);
  }

  create(data: RidgeSceneStartData = {}): void {
    this.onClose = data.onClose ?? this.onClose;
    this.onOpenOverlay = data.onOpenOverlay ?? this.onOpenOverlay;
    this.ridgeDevControls = import.meta.env.DEV
      ? data.ridgeDevControls ?? this.ridgeDevControls
      : undefined;
    const messages = getMessages();
    const ridgeProgress = bridgeStore.getState().progress.ridge;
    const blockout = RIDGE_BLOCKOUT;
    const geometry = deriveRidgeBlockoutGeometry(blockout, {
      stampIds: ridgeProgress.stampIds
    });
    this.currentGeometry = geometry;
    this.ridgeInteractionTargets = [];
    this.ridgeDebugOverlay?.destroy();
    this.ridgeDebugOverlay = undefined;
    const facts = compileRidgeBlockoutFacts(blockout, {
      geometry
    });
    const cickaHomeMutations = resolveCickaHomeMutations(
      facts.homeMutations,
      ridgeProgress
    );
    this.traversalRuntime = undefined;

    this.cameras.main.setBackgroundColor('#f7f1df');
    this.physics.world.setBounds(
      geometry.bounds.x,
      geometry.bounds.y,
      geometry.bounds.width,
      geometry.bounds.height
    );
    createCickaAnimations(this);

    const blockoutPresentation = createRidgeBlockoutPresentation({
      scene: this,
      facts,
      geometry
    });
    const landmarkPresentation = createRidgeLandmarkPresentation({
      scene: this,
      facts,
      copy: {
        title: messages.catalog.ridge.ridge.name,
        stampedeFirstClearLabel: messages.scenes.ridge.memory.stampedeFirstClearLabel,
        cickaWalkByLine: messages.scenes.ridge.memory.cickaWalkByBark
      },
      worldMemories: getRidgeWorldMemories(ridgeProgress),
      cickaHomeMutations: cickaHomeMutations.active
    });
    this.cickaPerch = landmarkPresentation.cickaPerch;
    this.createPlayer(blockoutPresentation.platforms, facts, geometry);
    this.ridgeInteractionTargets = createRidgeInteractionTargets({
      facts,
      cickaPerch: this.cickaPerch,
      cickaInteractionCopy: messages.scenes.ridge.cicka.interaction,
      getWorldMemories: () => getRidgeWorldMemories(bridgeStore.getState().progress.ridge)
    });
    this.createRidgeInteractions(messages.navigation.interact, this.ridgeInteractionTargets);
    this.setPaused(this.isPaused);
    this.playerRuntime?.syncAppearance();
    this.syncDevRuntimeState();
  }

  update(_time: number, delta: number): void {
    this.applyDevControls();

    if (this.player) {
      this.traversalRuntime?.primeGrounding(this.player);
    }
    const playerUpdate = this.playerRuntime?.update();
    if (!playerUpdate || playerUpdate.paused) {
      this.syncDevRuntimeState();
      return;
    }

    if (playerUpdate.commands.exitContext) {
      this.syncDevRuntimeState();
      this.onClose();
      return;
    }

    if (this.player) {
      this.traversalRuntime?.update({
        player: this.player,
        commands: playerUpdate.commands,
        deltaMs: delta
      });
    }

    this.cickaPerch?.update({
      playerX: this.player?.x ?? 0,
      playerY: this.player?.y ?? 0,
      nowMs: this.time.now
    });

    const interaction = this.interactionRuntime?.update({
      playerX: this.player?.x ?? 0,
      playerY: this.player?.y ?? 0,
      interactRequested: playerUpdate.step.interactRequested,
      exitRequested: playerUpdate.commands.exitContext
    });

    if (!interaction) {
      this.interactPrompt?.setVisible(false);
      this.syncDevRuntimeState();
      return;
    }

    if (interaction.effect?.kind === 'openTrailCard') {
      this.onOpenOverlay?.(TRAIL_CARD_OVERLAY_ID, {
        params: interaction.effect.params,
        returnToSceneId: PHASER_SCENE_KEYS.ridge
      });
    } else if (interaction.effect?.kind === 'showCickaResponse') {
      this.cickaPerch?.showLine(interaction.effect.response.line, this.time.now);
    }

    if (
      !interaction.prompt.visible ||
      !shouldShowCickaInteractionPrompt({
        activeTargetId: interaction.activeTarget?.id ?? null,
        responseVisible: this.cickaPerch?.isSpeechVisible(this.time.now) ?? false
      })
    ) {
      this.interactPrompt?.setVisible(false);
      this.syncDevRuntimeState();
      return;
    }

    this.interactPrompt?.setPosition(interaction.prompt.x, interaction.prompt.y).setVisible(true);
    this.syncDevRuntimeState();
  }

  private createPlayer(
    platforms: readonly Phaser.GameObjects.Zone[],
    facts: RidgeBlockoutFacts,
    geometry: RidgeBlockoutGeometry
  ): void {
    const spawn = facts.spawn;
    this.ridgeSpawnPosition = {
      x: spawn.x,
      y: spawn.y + RIDGE_PLAYER_SPAWN_OFFSET_Y
    };
    const playerRuntime = createSideViewPlayerRuntime({
      scene: this,
      start: this.ridgeSpawnPosition,
      resumePosition: this.resumePosition,
      resumeClamp: {
        minX: geometry.bounds.x + RIDGE_PLAYER_EDGE_PADDING,
        maxX: geometry.bounds.x + geometry.bounds.width - RIDGE_PLAYER_EDGE_PADDING,
        minY: geometry.bounds.y + RIDGE_PLAYER_EDGE_PADDING,
        maxY: geometry.bounds.y + geometry.bounds.height - RIDGE_PLAYER_EDGE_PADDING
      },
      sprite: {
        depth: 30,
        gravityY: SIDE_VIEW_PLAYER_GRAVITY_Y
      },
      movement: {
        walkSpeed: SIDE_VIEW_WALK_SPEED,
        sprintSpeed: SIDE_VIEW_SPRINT_SPEED,
        jumpVelocityY: SIDE_VIEW_JUMP_VELOCITY_Y,
        coyoteTimeMs: RIDGE_COYOTE_TIME_MS,
        jumpBufferMs: RIDGE_JUMP_BUFFER_MS
      },
      input: {
        allowJump: true,
        allowSprint: true,
        includeEscapeKey: true
      },
      appearance: {
        isGlassesEquipped: () => isItemEquipped('glasses'),
        idleTextureKey: 'player_idle',
        glassesTextureKey: 'player_glasses'
      },
      camera: {
        worldBounds: geometry.bounds,
        designSize: {
          width: GAME_DESIGN_WIDTH,
          height: GAME_DESIGN_HEIGHT
        },
        resolveProfile: () => ({
          zoom: this.resolveCameraZoom(),
          followOffsetY: 0
        })
      }
    });
    this.playerRuntime = playerRuntime;
    const player = playerRuntime.player;
    this.player = player;
    platforms.forEach((platform) => {
      this.physics.add.collider(player, platform);
    });
    this.traversalRuntime = createRidgeTraversalRuntime({
      geometry,
      initialSafePosition: { x: player.x, y: player.y }
    });
  }

  private createRidgeInteractions(
    promptText: string,
    targets: RidgeInteractionTarget[]
  ): void {
    this.interactPrompt?.destroy();

    this.interactPrompt = createUiText(this, 0, 0, promptText, {
      fontSize: '16px',
      color: '#1a1a1a',
      backgroundColor: '#ffffff',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setDepth(100).setVisible(false);

    this.interactionRuntime = createInteriorInteractionRuntime<
      RidgeInteractionTargetId,
      RidgeInteractionEffect
    >({
      interactRadius: 72,
      exitEffect: { kind: 'close' },
      targets
    });
  }

  private resolveCameraZoom(): number {
    return resolveRidgeDevCameraZoom(this.ridgeDevControls?.resolveCameraZoom?.());
  }

  private applyDevControls(): void {
    if (!import.meta.env.DEV || !this.ridgeDevControls) return;

    const nextCameraZoom = this.resolveCameraZoom();
    if (nextCameraZoom !== this.lastCameraZoom) {
      this.lastCameraZoom = nextCameraZoom;
      this.playerRuntime?.cameraRuntime?.refresh();
    }

    const resetRequest = this.ridgeDevControls.consumeResetRequest?.();
    if (!this.player) return;

    if (resetRequest && this.ridgeSpawnPosition) {
      this.movePlayerForDev({
        x: this.ridgeSpawnPosition.x,
        y: this.ridgeSpawnPosition.y
      });
      return;
    }

    const request = this.ridgeDevControls.consumeTeleportRequest?.();
    if (!request) return;

    const position = applyRidgeDevTeleportToPlayer(this.player, request);
    this.refreshTraversalRuntimeSafePosition(position);
    this.playerRuntime?.cameraRuntime?.refresh();
  }

  private movePlayerForDev(position: { x: number; y: number }): void {
    if (!this.player) return;
    this.player.setPosition(position.x, position.y);
    this.player.setVelocityX(0);
    this.player.setVelocityY(0);
    this.player.body.setAllowGravity(true);
    this.refreshTraversalRuntimeSafePosition(position);
    this.playerRuntime?.cameraRuntime?.refresh();
  }

  private refreshTraversalRuntimeSafePosition(position: { x: number; y: number }): void {
    if (this.currentGeometry) {
      this.traversalRuntime = createRidgeTraversalRuntime({
        geometry: this.currentGeometry,
        initialSafePosition: position
      });
    }
  }

  private syncDevRuntimeState(): void {
    if (!import.meta.env.DEV || !this.ridgeDevControls) return;
    if (this.player) {
      this.ridgeDevControls.publishPlayerSnapshot?.({
        x: this.player.x,
        y: this.player.y
      });
    }
    this.renderDevDebugOverlay();
  }

  private renderDevDebugOverlay(): void {
    if (!import.meta.env.DEV || !this.ridgeDevControls || !this.currentGeometry) return;
    this.ridgeDebugOverlay ??= createRidgeDebugOverlay(this);
    this.ridgeDebugOverlay.render({
      geometry: this.currentGeometry,
      interactionTargets: this.ridgeInteractionTargets,
      player: this.player,
      settings: resolveRidgeDevDebugSettings(
        this.ridgeDevControls.resolveDebugSettings?.()
      ),
      traversalState: this.traversalRuntime?.getState()
    });
  }
}
