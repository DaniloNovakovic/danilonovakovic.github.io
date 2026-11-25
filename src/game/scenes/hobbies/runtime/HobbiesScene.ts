/**
 * HobbiesScene — thin orchestrator.
 * Delegates room layout to HobbiesRoom, player logic to PlayerController.
 */
import * as Phaser from 'phaser';
import { HOBBIES_EXIT_X, HOBBIES_ROOM_INTERACTABLES } from '../roomLayout';
import { getMessages } from '@/shared/i18n';
import type { HobbiesOverlayId, OverlayId } from '@/game/overlays/overlayIds';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH,
  HOBBIES_FLOOR_Y,
  HOBBIES_GROUND_ZONE,
  HOBBIES_INTERACT_RADIUS,
  HOBBIES_RESUME_CLAMP,
  HOBBIES_ROOM_HEIGHT,
  HOBBIES_ROOM_WIDTH,
  HOBBIES_PLAYER_START_OFFSET_Y,
  SIDE_VIEW_JUMP_VELOCITY_Y,
  SIDE_VIEW_SPRINT_SPEED,
  SIDE_VIEW_WALK_SPEED
} from '@/game/sharedSceneRuntime/config';
import { bridgeActions, bridgeStore, isItemEquipped, isItemOwned, type OpenOverlayOptions } from '@/game/bridge/store';
import { CIRCUIT_PART_HOBBY, CIRCUIT_PART_IDS } from '@/game/core/console/content/circuitParts';
import {
  DEBUGGING_TOOLS_ITEM_ID,
  HOBBIES_LEFT_WALL_X,
  HOBBIES_RIGHT_WALL_X,
  OUT_OF_BOUNDS_CAMERA_LEFT_X,
  OUT_OF_BOUNDS_PEDESTAL_X,
  OUT_OF_BOUNDS_WORLD_LEFT_X
} from '@/game/core/console';
import { prefersReducedMotion, sketchTick } from '@/game/sharedSceneRuntime/motion/sketchMotion';
import { HobbiesRoom } from './HobbiesRoom';
import { HobbiesVoid } from './HobbiesVoid';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import {
  createSideViewPlayerRuntime,
  type SideViewPlayerRuntime
} from '@/game/sharedSceneRuntime/player/SideViewPlayerRuntime';
import {
  createInteriorInteractionRuntime,
  type InteriorInteractionRuntime,
  type InteriorInteractionTarget
} from '@/game/sharedSceneRuntime/interactions/InteriorInteractionRuntime';

const ROOM_CAMERA_BOUNDS = { x: 0, y: 0, width: HOBBIES_ROOM_WIDTH, height: HOBBIES_ROOM_HEIGHT };
const VOID_CAMERA_BOUNDS = {
  x: OUT_OF_BOUNDS_CAMERA_LEFT_X,
  y: 0,
  width: HOBBIES_ROOM_WIDTH - OUT_OF_BOUNDS_CAMERA_LEFT_X,
  height: HOBBIES_ROOM_HEIGHT
};

type HobbiesInteractionEffect =
  | { kind: 'close' }
  | { kind: 'openOverlay'; id: HobbiesOverlayId }
  | { kind: 'collectDebuggingTools' };

type HobbiesInteractionId = 'exit' | 'pedestal' | HobbiesOverlayId;

/** Out of Bounds, Act 2: the Debugging Tools on the pedestal at the end of the void. */
const PEDESTAL_TARGET: InteriorInteractionTarget<HobbiesInteractionId, HobbiesInteractionEffect> = {
  id: 'pedestal',
  kind: 'pedestal',
  x: OUT_OF_BOUNDS_PEDESTAL_X,
  distanceAnchorY: 450,
  // The player stops 40px short of the pedestal; reach it from there.
  interactRadius: 90,
  prompt: { x: OUT_OF_BOUNDS_PEDESTAL_X, y: HOBBIES_FLOOR_Y - 230 },
  enabled: () => !isItemOwned(DEBUGGING_TOOLS_ITEM_ID),
  effect: { kind: 'collectDebuggingTools' }
};

export class HobbiesScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  exitPrompt!: Phaser.GameObjects.Text;

  private playerRuntime?: SideViewPlayerRuntime;
  private interactionRuntime?: InteriorInteractionRuntime<HobbiesInteractionId, HobbiesInteractionEffect>;
  private onClose?: () => void;
  private onOpenOverlay?: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  private isPaused: boolean = false;
  private room?: HobbiesRoom;
  private outOfBounds?: HobbiesVoid;
  private cameraShowsVoid = false;
  private motion = true;
  private readonly claimedScratch = new Set<HobbiesOverlayId>();
  private resumePosition?: { x: number; y: number };

  constructor() {
    super({ key: 'hobbies' });
  }

  init(data: {
    onClose: () => void;
    onOpenOverlay: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
    isPaused?: boolean;
    resumePosition?: { x: number; y: number };
  }) {
    this.onClose = data.onClose;
    this.onOpenOverlay = data.onOpenOverlay;
    this.isPaused = data.isPaused ?? false;
    this.resumePosition = data.resumePosition;
  }

  getResumeCapturePosition(): { x: number; y: number } | null {
    return this.playerRuntime?.captureResume() ?? null;
  }

  setPaused(paused: boolean) {
    this.isPaused = paused;
    this.playerRuntime?.setPaused(paused);
  }

  create() {
    const messages = getMessages();
    const width = HOBBIES_ROOM_WIDTH;
    const height = HOBBIES_ROOM_HEIGHT;
    const floorY = HOBBIES_FLOOR_Y;

    // Right edge is the drawn wall. The left wall is drawn just as solid but has
    // no collision: beyond it runs the Out of Bounds void to the pedestal
    // (docs/game-design/secrets/out-of-bounds.md, Act 1).
    const worldLeft = OUT_OF_BOUNDS_WORLD_LEFT_X;
    this.physics.world.setBounds(worldLeft, 0, HOBBIES_RIGHT_WALL_X - worldLeft, height);

    this.motion = !prefersReducedMotion();
    this.room = new HobbiesRoom(this);

    this.playerRuntime = createSideViewPlayerRuntime({
      scene: this,
      start: { x: width / 2, y: floorY - HOBBIES_PLAYER_START_OFFSET_Y },
      resumePosition: this.resumePosition,
      resumeClamp: HOBBIES_RESUME_CLAMP,
      sprite: {
        depth: 8,
        gravityY: 1000
      },
      movement: {
        walkSpeed: SIDE_VIEW_WALK_SPEED,
        sprintSpeed: SIDE_VIEW_SPRINT_SPEED,
        jumpVelocityY: SIDE_VIEW_JUMP_VELOCITY_Y
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
        // Framed on the room until the player glitches out (see updateCameraWorld).
        worldBounds: ROOM_CAMERA_BOUNDS,
        designSize: {
          width: GAME_DESIGN_WIDTH,
          height: GAME_DESIGN_HEIGHT
        },
        profile: {
          zoom: 1,
          followOffsetY: 0
        }
      }
    });
    this.player = this.playerRuntime.player;
    this.outOfBounds = new HobbiesVoid(this, this.player, () => this.getAudioContext());

    // The floor keeps going under the void even after its ink line stops.
    const ground = this.add.zone(
      (worldLeft + width) / 2,
      floorY + HOBBIES_GROUND_ZONE.centerOffsetY,
      width - worldLeft,
      HOBBIES_GROUND_ZONE.height
    );
    this.physics.add.existing(ground, true);
    this.physics.add.collider(this.player, ground);

    this.exitPrompt = createUiText(this, HOBBIES_EXIT_X, floorY - 150, messages.navigation.interact, {
      fontSize: '16px',
      color: '#1a1a1a',
      backgroundColor: '#ffffff',
      padding: { x: 5, y: 2 }
    })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(100);

    this.interactionRuntime = createInteriorInteractionRuntime<HobbiesInteractionId, HobbiesInteractionEffect>({
      interactRadius: HOBBIES_INTERACT_RADIUS,
      exitEffect: { kind: 'close' },
      targets: [
        ...HOBBIES_ROOM_INTERACTABLES.map((target) => ({
          ...target,
          effect:
            target.kind === 'exit'
              ? ({ kind: 'close' } satisfies HobbiesInteractionEffect)
              : ({ kind: 'openOverlay', id: target.id } satisfies HobbiesInteractionEffect)
        })),
        PEDESTAL_TARGET
      ]
    });

    this.cameras.main.setBackgroundColor('#f4f1ea');

    this.setPaused(this.isPaused);
    this.playerRuntime.syncAppearance();
  }

  update(time: number) {
    const playerUpdate = this.playerRuntime?.update();
    if (!playerUpdate || playerUpdate.paused) {
      this.exitPrompt.setVisible(false);
      return;
    }

    const { commands, step } = playerUpdate;
    const interaction = this.interactionRuntime?.update({
      playerX: this.player.x,
      playerY: this.player.y,
      interactRequested: step.interactRequested,
      exitRequested: commands.exitContext
    });
    const activeId = interaction?.activeTarget?.id ?? null;
    this.updateRoom(activeId === 'pedestal' ? null : activeId, sketchTick(time));
    this.updateOutOfBounds(time);

    if (interaction?.effect?.kind === 'close') {
      this.onClose?.();
      return;
    }

    if (!interaction || !interaction.prompt.visible) {
      this.exitPrompt.setVisible(false);
      return;
    }

    this.exitPrompt.setPosition(interaction.prompt.x, interaction.prompt.y).setVisible(true);
    if (interaction.effect) this.applyInteractionEffect(interaction.effect, time);
  }

  private applyInteractionEffect(effect: HobbiesInteractionEffect, time: number): void {
    switch (effect.kind) {
      case 'openOverlay':
        this.onOpenOverlay?.(effect.id);
        break;
      case 'collectDebuggingTools':
        bridgeActions.collectItem(DEBUGGING_TOOLS_ITEM_ID);
        this.exitPrompt.setVisible(false);
        this.outOfBounds?.pickUpKit({ time, motion: this.motion });
        break;
      case 'close':
        break;
    }
  }

  private updateOutOfBounds(time: number): void {
    this.updateCameraWorld();
    const { body } = this.player;
    this.outOfBounds?.update({
      playerX: this.player.x,
      kitOwned: isItemOwned(DEBUGGING_TOOLS_ITEM_ID),
      walking: body.blocked.down && Math.abs(body.velocity.x) > 1,
      time,
      motion: this.motion
    });
  }

  /**
   * The camera only reveals the void once the player is out in it, so the room
   * never looks like it has anything beside it. Back inside, it re-frames the
   * room once the room fills the view again, so the switch never snaps.
   */
  private updateCameraWorld(): void {
    const camera = this.playerRuntime?.cameraRuntime;
    if (!camera) return;
    const x = this.player.x;
    if (!this.cameraShowsVoid && x < HOBBIES_LEFT_WALL_X) {
      this.cameraShowsVoid = true;
      camera.setWorldBounds(VOID_CAMERA_BOUNDS);
    } else if (this.cameraShowsVoid && x > HOBBIES_ROOM_WIDTH / 2) {
      this.cameraShowsVoid = false;
      camera.setWorldBounds(ROOM_CAMERA_BOUNDS);
    }
  }

  private getAudioContext(): AudioContext | null {
    const sound = this.sound as Partial<Phaser.Sound.WebAudioSoundManager>;
    return sound.context ?? null;
  }

  private updateRoom(activeId: Exclude<HobbiesInteractionId, 'pedestal'> | null, tick: number): void {
    const state = bridgeStore.getState();
    this.claimedScratch.clear();
    for (const partId of CIRCUIT_PART_IDS) {
      if (state.inventory.ownedItemIds.includes(partId)) this.claimedScratch.add(CIRCUIT_PART_HOBBY[partId]);
    }
    if (state.progress.streetDoodle) this.claimedScratch.add('art');
    this.room?.update(
      { claimed: this.claimedScratch, focusId: activeId === 'exit' ? null : activeId },
      tick,
      this.motion
    );
  }
}
