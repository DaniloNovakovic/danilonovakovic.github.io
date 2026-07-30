import * as Phaser from 'phaser';
import type { OverlayId } from '@/game/overlays/overlayIds';
import {
  BASEMENT_COMPUTER,
  BASEMENT_EXIT,
  BASEMENT_FLOOR_Y,
  BASEMENT_PLAYER_START,
  GLASSES_PICKUP
} from '../roomLayout';
import { getMessages } from '@/shared/i18n';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH,
  HOBBIES_GROUND_ZONE,
  SIDE_VIEW_JUMP_VELOCITY_Y,
  SIDE_VIEW_SPRINT_SPEED,
  SIDE_VIEW_WALK_SPEED
} from '@/game/sharedSceneRuntime/config';
import {
  bridgeStore,
  isItemEquipped,
  isItemOwned,
  type OpenOverlayOptions
} from '@/game/bridge/store';
import { GameConsoleSession, type GameCommandResult } from '@/game/core/console';
import { loadBridgeDialogueCatalog } from '@/game/scenes/ridge/content/bridgeCatalog';
import { applyGameConsoleEvents } from '@/game/scenes/shared/applyGameConsoleEvents';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import { PlayerThoughtText } from '@/game/sharedSceneRuntime/text/PlayerThoughtText';
import {
  createSideViewPlayerRuntime,
  type SideViewPlayerRuntime
} from '@/game/sharedSceneRuntime/player/SideViewPlayerRuntime';

export class BasementScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  interactPrompt!: Phaser.GameObjects.Text;
  statusText!: Phaser.GameObjects.Text;
  glasses!: Phaser.GameObjects.Container;
  glassesLabel?: Phaser.GameObjects.Text;
  playerThought!: PlayerThoughtText;

  private playerRuntime?: SideViewPlayerRuntime;
  private session?: GameConsoleSession;
  private onClose?: () => void;
  private onOpenOverlay?: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  private isPaused: boolean = false;
  private resumePosition?: { x: number; y: number };

  constructor() {
    super({ key: 'basement' });
  }

  init(data: {
    onClose: () => void;
    onOpenOverlay?: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
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
    const bridge = bridgeStore.getState();
    this.session = new GameConsoleSession({
      dialogue: loadBridgeDialogueCatalog(),
      sceneId: 'basement',
      ownedItemIds: bridge.inventory.ownedItemIds,
      equippedItemIds: bridge.equipment.equippedItemIds,
      discoveredSecretIds: bridge.progress.discoveredSecretIds
    });

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

    this.interactPrompt = createUiText(this, 0, 0, messages.navigation.interact, {
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

    this.refreshGlassesVisibility();
    this.setPaused(this.isPaused);
    this.playerRuntime.syncAppearance();
  }

  update() {
    this.refreshGlassesVisibility();

    const playerUpdate = this.playerRuntime?.update();
    if (!playerUpdate || playerUpdate.paused || !this.session) {
      this.interactPrompt.setVisible(false);
      return;
    }

    const { commands, step } = playerUpdate;
    this.session.syncPlayerPosition(this.player.x);

    if (commands.exitContext) {
      this.onClose?.();
      return;
    }

    this.playerThought.update();

    if (step.interactRequested) {
      this.applySessionResult(this.session.exec('interact'));
    }

    const nearby = this.session.observe().nearby[0];
    if (!nearby || nearby.promptX == null || nearby.promptY == null) {
      this.interactPrompt.setVisible(false);
      return;
    }

    this.interactPrompt
      .setText(getMessages().navigation.interact)
      .setPosition(nearby.promptX, nearby.promptY)
      .setVisible(true);
  }

  private applySessionResult(result: GameCommandResult): void {
    const messages = getMessages();
    applyGameConsoleEvents(result.events, {
      onReturnToOverworld: () => this.onClose?.(),
      onOpenOverlay: (overlayId) => {
        this.onOpenOverlay?.(overlayId);
        this.session?.restoreExploreAfterOverlay();
      },
      onThought: (id) => {
        if (id === 'basement_cannot_see') {
          this.playerThought.show(messages.scenes.basement.cannotSeeThought);
        }
      }
    });

    if (result.events.some((event) => event.type === 'item_collected' && event.itemId === 'glasses')) {
      this.statusText.setText(messages.scenes.basement.glassesAcquired);
      this.refreshGlassesVisibility();
    }
  }

  private buildRoom(): void {
    const messages = getMessages();
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

    createUiText(this, GAME_DESIGN_WIDTH / 2, 34, messages.scenes.basement.title, {
      fontSize: '24px',
      color: '#66ff99',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    createUiText(this, BASEMENT_EXIT.x, BASEMENT_EXIT.y - 92, messages.scenes.basement.ladderUp, {
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
    this.glassesLabel = createUiText(this, GLASSES_PICKUP.x, GLASSES_PICKUP.y + 42, messages.scenes.basement.glasses, {
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
    const visible = !isItemOwned('glasses');
    this.glasses?.setVisible(visible);
    this.glassesLabel?.setVisible(visible);
  }
}
