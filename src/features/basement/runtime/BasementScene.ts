import * as Phaser from 'phaser';
import {
  BASEMENT_COMPUTER,
  BASEMENT_EXIT,
  BASEMENT_FLOOR_Y,
  BASEMENT_PLAYER_START,
  createBasementInteractionTargets,
  GLASSES_PICKUP,
  type BasementInteractionEffect,
  type BasementRoomInteractableId
} from '../roomLayout';
import { TEXTS } from '../../../config/content';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH,
  HOBBIES_GROUND_ZONE,
  OVERWORLD_JUMP_VELOCITY_Y,
  OVERWORLD_SPRINT_SPEED,
  OVERWORLD_WALK_SPEED
} from '../../../runtime/config';
import { bridgeActions, isItemEquipped, isItemOwned } from '../../../shared/bridge/store';
import { createUiText } from '../../../runtime/text/createUiText';
import { PlayerThoughtText } from '../../../runtime/text/PlayerThoughtText';
import {
  createSideViewPlayerRuntime,
  type SideViewPlayerRuntime
} from '../../../runtime/player/SideViewPlayerRuntime';
import {
  createInteriorInteractionRuntime,
  type InteriorInteractionRuntime
} from '../../../runtime/interactions/InteriorInteractionRuntime';

export class BasementScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  interactPrompt!: Phaser.GameObjects.Text;
  statusText!: Phaser.GameObjects.Text;
  glasses!: Phaser.GameObjects.Container;
  playerThought!: PlayerThoughtText;

  private playerRuntime?: SideViewPlayerRuntime;
  private interactionRuntime?: InteriorInteractionRuntime<
    BasementRoomInteractableId,
    BasementInteractionEffect
  >;
  private onClose?: () => void;
  private onInteract?: (id: string) => void;
  private isPaused: boolean = false;
  private resumePosition?: { x: number; y: number };

  constructor() {
    super({ key: 'basement' });
  }

  init(data: {
    onClose: () => void;
    onInteract?: (id: string) => void;
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
    this.physics.world.setBounds(0, 0, GAME_DESIGN_WIDTH, GAME_DESIGN_HEIGHT);
    this.buildRoom();

    this.playerRuntime = createSideViewPlayerRuntime({
      scene: this,
      start: BASEMENT_PLAYER_START,
      resumePosition: this.resumePosition,
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
          width: GAME_DESIGN_WIDTH,
          height: GAME_DESIGN_HEIGHT
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
    this.playerThought = new PlayerThoughtText(this, { target: this.player });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.playerThought?.destroy());

    const ground = this.add.zone(
      GAME_DESIGN_WIDTH / 2,
      BASEMENT_FLOOR_Y + HOBBIES_GROUND_ZONE.centerOffsetY,
      GAME_DESIGN_WIDTH,
      HOBBIES_GROUND_ZONE.height
    );
    this.physics.add.existing(ground, true);
    this.physics.add.collider(this.player, ground);

    this.interactPrompt = createUiText(this, 0, 0, TEXTS.navigation.interact, {
      fontSize: '16px',
      color: '#fbfbf9',
      backgroundColor: '#1a1a1a',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setVisible(false).setDepth(100);

    this.statusText = createUiText(
      this,
      GAME_DESIGN_WIDTH / 2,
      78,
      isItemOwned('glasses')
        ? 'Lens acquired. The city can be seen differently now.'
        : 'A forgotten dev room hums under the sketch city.',
      {
        fontSize: '18px',
        color: '#fbfbf9',
        backgroundColor: '#1a1a1a',
        padding: { x: 8, y: 4 }
      }
    ).setOrigin(0.5).setDepth(100);

    this.interactionRuntime = createInteriorInteractionRuntime({
      interactRadius: 0,
      exitEffect: { kind: 'close' },
      targets: createBasementInteractionTargets({ isGlassesOwned: () => isItemOwned('glasses') }).map((target) => ({
        ...target,
        interactRadius: target.radius
      }))
    });

    this.refreshGlassesVisibility();
    this.setPaused(this.isPaused);
    this.playerRuntime.syncAppearance();
  }

  update() {
    this.refreshGlassesVisibility();

    const playerUpdate = this.playerRuntime?.update();
    if (!playerUpdate || playerUpdate.paused) {
      this.interactPrompt.setVisible(false);
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
      this.applyBasementInteractionEffect(interaction.effect);
      return;
    }

    this.playerThought.update();

    if (!interaction || !interaction.prompt.visible) {
      this.interactPrompt.setVisible(false);
      return;
    }

    this.interactPrompt.setPosition(interaction.prompt.x, interaction.prompt.y).setVisible(true);
    if (interaction.effect) {
      this.applyBasementInteractionEffect(interaction.effect);
    }
  }

  private buildRoom(): void {
    this.cameras.main.setBackgroundColor('#151515');

    const g = this.add.graphics();
    g.fillStyle(0x151515, 1);
    g.fillRect(0, 0, GAME_DESIGN_WIDTH, GAME_DESIGN_HEIGHT);
    g.fillStyle(0x242424, 1);
    g.fillRect(0, BASEMENT_FLOOR_Y, GAME_DESIGN_WIDTH, GAME_DESIGN_HEIGHT - BASEMENT_FLOOR_Y);
    g.lineStyle(3, 0xfbfbf9, 0.7);
    g.beginPath();
    g.moveTo(0, BASEMENT_FLOOR_Y);
    g.lineTo(GAME_DESIGN_WIDTH, BASEMENT_FLOOR_Y);
    g.strokePath();

    for (let x = 20; x < GAME_DESIGN_WIDTH; x += 90) {
      g.lineStyle(1, 0x66ff99, 0.22);
      g.beginPath();
      g.moveTo(x, 120);
      g.lineTo(x + 50, 120);
      g.moveTo(x + 10, 152);
      g.lineTo(x + 72, 152);
      g.moveTo(x - 8, 184);
      g.lineTo(x + 42, 184);
      g.strokePath();
    }

    this.buildComputer(g);

    createUiText(this, GAME_DESIGN_WIDTH / 2, 34, 'DEVELOPER BASEMENT', {
      fontSize: '24px',
      color: '#66ff99',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    createUiText(this, BASEMENT_EXIT.x, BASEMENT_EXIT.y - 92, 'LADDER UP', {
      fontSize: '15px',
      color: '#fbfbf9',
      backgroundColor: '#1a1a1a',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5);
    g.lineStyle(4, 0xfbfbf9, 0.85);
    g.strokeRect(BASEMENT_EXIT.x - 18, BASEMENT_EXIT.y - 30, 36, 92);
    for (let y = BASEMENT_EXIT.y - 14; y <= BASEMENT_EXIT.y + 42; y += 18) {
      g.beginPath();
      g.moveTo(BASEMENT_EXIT.x - 18, y);
      g.lineTo(BASEMENT_EXIT.x + 18, y);
      g.strokePath();
    }

    this.glasses = this.add.container(GLASSES_PICKUP.x, GLASSES_PICKUP.y);
    const leftLens = this.add.ellipse(-18, 0, 30, 24, 0xfbfbf9, 0.08).setStrokeStyle(4, 0x66ff99, 1);
    const rightLens = this.add.ellipse(18, 0, 30, 24, 0xfbfbf9, 0.08).setStrokeStyle(4, 0x66ff99, 1);
    const bridge = this.add.rectangle(0, 0, 12, 4, 0x66ff99, 1);
    const glow = this.add.ellipse(0, 0, 104, 56, 0x66ff99, 0.08);
    this.glasses.add([glow, leftLens, rightLens, bridge]);
    createUiText(this, GLASSES_PICKUP.x, GLASSES_PICKUP.y + 42, 'GLASSES', {
      fontSize: '14px',
      color: '#66ff99',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  private buildComputer(g: Phaser.GameObjects.Graphics): void {
    const { x, y } = BASEMENT_COMPUTER;

    g.fillStyle(0x101010, 1);
    g.fillRect(x - 88, y + 46, 176, 16);
    g.lineStyle(3, 0xfbfbf9, 0.78);
    g.strokeRect(x - 88, y + 46, 176, 16);

    g.fillStyle(0x0b0b0b, 1);
    g.fillRect(x - 54, y - 44, 108, 72);
    g.lineStyle(4, 0x66ff99, 0.92);
    g.strokeRect(x - 54, y - 44, 108, 72);

    g.fillStyle(0x66ff99, 0.1);
    g.fillRect(x - 47, y - 37, 94, 58);
    g.lineStyle(2, 0x66ff99, 0.55);
    for (let i = 0; i < 5; i += 1) {
      const lineY = y - 25 + i * 10;
      g.beginPath();
      g.moveTo(x - 35, lineY);
      g.lineTo(x + (i % 2 === 0 ? 30 : 18), lineY);
      g.strokePath();
    }

    g.lineStyle(3, 0xfbfbf9, 0.7);
    g.beginPath();
    g.moveTo(x, y + 28);
    g.lineTo(x, y + 46);
    g.moveTo(x - 30, y + 46);
    g.lineTo(x + 30, y + 46);
    g.strokePath();

    g.fillStyle(0xfbfbf9, 0.82);
    g.fillRect(x - 52, y + 68, 104, 14);
    g.lineStyle(2, 0x1a1a1a, 0.85);
    g.strokeRect(x - 52, y + 68, 104, 14);
    for (let keyX = x - 43; keyX <= x + 40; keyX += 14) {
      g.beginPath();
      g.moveTo(keyX, y + 70);
      g.lineTo(keyX + 7, y + 70);
      g.strokePath();
    }

    g.lineStyle(2, 0x66ff99, 0.3);
    g.beginPath();
    g.moveTo(x + 58, y + 28);
    g.lineTo(x + 82, y + 50);
    g.lineTo(x + 72, y + 86);
    g.strokePath();
  }

  private refreshGlassesVisibility(): void {
    this.glasses?.setVisible(!isItemOwned('glasses'));
  }

  private applyBasementInteractionEffect(effect: BasementInteractionEffect): void {
    switch (effect.kind) {
      case 'close':
        this.onClose?.();
        break;
      case 'openOverlay':
        this.onInteract?.(effect.id);
        break;
      case 'collectGlasses':
        bridgeActions.collectGlasses();
        this.statusText.setText('Glasses acquired. The sketch city flickers into focus.');
        this.refreshGlassesVisibility();
        break;
      case 'showThought':
        this.playerThought.show(effect.text);
        break;
    }
  }
}
