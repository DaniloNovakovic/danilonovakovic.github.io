/**
 * HobbiesScene — thin orchestrator.
 * Delegates room layout to HobbiesRoom, player logic to PlayerController.
 */
import * as Phaser from 'phaser';
import { HOBBIES_EXIT_X, HOBBIES_ROOM_INTERACTABLES } from '../roomLayout';
import { TEXTS } from '../../../config/content';
import type { HobbyReactOverlayId } from '../../../config/featureIds';
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
  OVERWORLD_JUMP_VELOCITY_Y,
  OVERWORLD_SPRINT_SPEED,
  OVERWORLD_WALK_SPEED
} from '../../../runtime/config';
import { isItemEquipped } from '../../../shared/bridge/store';
import { buildHobbiesRoom } from './HobbiesRoom';
import { createUiText } from '../../../runtime/text/createUiText';
import {
  createSideViewPlayerRuntime,
  type SideViewPlayerRuntime
} from '../../../runtime/player/SideViewPlayerRuntime';
import {
  createInteriorInteractionRuntime,
  type InteriorInteractionRuntime
} from '../../../runtime/interactions/InteriorInteractionRuntime';

type HobbiesInteractionEffect =
  | { kind: 'close' }
  | { kind: 'openOverlay'; id: HobbyReactOverlayId };

type HobbiesInteractionId = 'exit' | HobbyReactOverlayId;

export class HobbiesScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  exitPrompt!: Phaser.GameObjects.Text;

  private playerRuntime?: SideViewPlayerRuntime;
  private interactionRuntime?: InteriorInteractionRuntime<HobbiesInteractionId, HobbiesInteractionEffect>;
  private onClose?: () => void;
  private onInteract?: (id: string) => void;
  private isPaused: boolean = false;
  private resumePosition?: { x: number; y: number };

  constructor() {
    super({ key: 'hobbies' });
  }

  init(data: {
    onClose: () => void;
    onInteract: (id: string) => void;
    isPaused?: boolean;
    resumePosition?: { x: number; y: number };
  }) {
    this.onClose = data.onClose;
    this.onInteract = data.onInteract;
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
    const width = HOBBIES_ROOM_WIDTH;
    const height = HOBBIES_ROOM_HEIGHT;
    const floorY = HOBBIES_FLOOR_Y;

    this.physics.world.setBounds(0, 0, width, height);

    buildHobbiesRoom(this);

    this.playerRuntime = createSideViewPlayerRuntime({
      scene: this,
      start: { x: width / 2, y: floorY - HOBBIES_PLAYER_START_OFFSET_Y },
      resumePosition: this.resumePosition,
      resumeClamp: HOBBIES_RESUME_CLAMP,
      sprite: {
        gravityY: 1000
      },
      movement: {
        walkSpeed: OVERWORLD_WALK_SPEED,
        sprintSpeed: OVERWORLD_SPRINT_SPEED,
        jumpVelocityY: OVERWORLD_JUMP_VELOCITY_Y
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
        worldBounds: {
          x: 0,
          y: 0,
          width,
          height
        },
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

    const ground = this.add.zone(
      width / 2,
      floorY + HOBBIES_GROUND_ZONE.centerOffsetY,
      HOBBIES_GROUND_ZONE.width,
      HOBBIES_GROUND_ZONE.height
    );
    this.physics.add.existing(ground, true);
    this.physics.add.collider(this.player, ground);

    this.exitPrompt = createUiText(this, HOBBIES_EXIT_X, floorY - 150, TEXTS.navigation.interact, {
      fontSize: '16px',
      color: '#1a1a1a',
      backgroundColor: '#ffffff',
      padding: { x: 5, y: 2 }
    })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(100);

    this.interactionRuntime = createInteriorInteractionRuntime({
      interactRadius: HOBBIES_INTERACT_RADIUS,
      exitEffect: { kind: 'close' },
      targets: HOBBIES_ROOM_INTERACTABLES.map((target) => ({
        ...target,
        effect:
          target.kind === 'exit'
            ? ({ kind: 'close' } satisfies HobbiesInteractionEffect)
            : ({ kind: 'openOverlay', id: target.id } satisfies HobbiesInteractionEffect)
      }))
    });

    this.cameras.main.setBackgroundColor('#f4f1ea');

    this.setPaused(this.isPaused);
    this.playerRuntime.syncAppearance();
  }

  update() {
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

    if (interaction?.effect?.kind === 'close') {
      this.onClose?.();
      return;
    }

    if (!interaction || !interaction.prompt.visible) {
      this.exitPrompt.setVisible(false);
      return;
    }

    this.exitPrompt.setPosition(interaction.prompt.x, interaction.prompt.y).setVisible(true);
    if (interaction.effect) {
      switch (interaction.effect.kind) {
        case 'openOverlay':
          this.onInteract?.(interaction.effect.id);
          break;
      }
    }
  }
}
