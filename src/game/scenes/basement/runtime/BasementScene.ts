// Thin adapter update loop; branching mirrors input + console event application.
// fallow-ignore-file complexity
import * as Phaser from 'phaser';
import type { OverlayId } from '@/game/overlays/overlayIds';
import { BASEMENT_FLOOR_Y, BASEMENT_PLAYER_START } from '../roomLayout';
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
import {
  CIRCUIT_PART_IDS,
  GameConsoleSession,
  countCircuitParts,
  type GameCommandResult,
  type GameThoughtId
} from '@/game/core/console';
import { loadRidgeRouteDialogueCatalog } from '@/game/scenes/ridge/content/routeCatalog';
import { applyGameConsoleEvents } from '@/game/scenes/shared/applyGameConsoleEvents';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import { PlayerThoughtText } from '@/game/sharedSceneRuntime/text/PlayerThoughtText';
import { prefersReducedMotion, sketchTick } from '@/game/sharedSceneRuntime/motion/sketchMotion';
import {
  createSideViewPlayerRuntime,
  type SideViewPlayerRuntime
} from '@/game/sharedSceneRuntime/player/SideViewPlayerRuntime';
import { BasementDen } from './BasementDen';

const THOUGHT_VISIBLE_MS = 3200;
const STATUS_VISIBLE_MS = 4500;

export class BasementScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  interactPrompt!: Phaser.GameObjects.Text;
  statusText!: Phaser.GameObjects.Text;
  playerThought!: PlayerThoughtText;

  private playerRuntime?: SideViewPlayerRuntime;
  private session?: GameConsoleSession;
  private den?: BasementDen;
  private motion = true;
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
      dialogue: loadRidgeRouteDialogueCatalog(),
      sceneId: 'basement',
      ownedItemIds: bridge.inventory.ownedItemIds,
      equippedItemIds: bridge.equipment.equippedItemIds,
      discoveredSecretIds: bridge.progress.discoveredSecretIds
    });

    this.physics.world.setBounds(0, 0, GAME_DESIGN_WIDTH, GAME_DESIGN_HEIGHT);
    this.motion = !prefersReducedMotion();
    this.den = new BasementDen(this);

    this.playerRuntime = createSideViewPlayerRuntime({
      scene: this,
      start: BASEMENT_PLAYER_START,
      resumePosition: this.resumePosition,
      sprite: {
        depth: 10,
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
    this.playerThought = new PlayerThoughtText(this, {
      target: this.player,
      visibleMs: THOUGHT_VISIBLE_MS,
      charDelayMs: 22
    });
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
      74,
      isItemOwned('glasses') ? messages.scenes.basement.litStatus : messages.scenes.basement.darkStatus,
      {
        fontSize: '16px',
        color: '#fbfbf9',
        backgroundColor: '#1a1a1a',
        padding: { x: 8, y: 4 }
      }
    ).setOrigin(0.5).setDepth(100);
    this.fadeStatusSoon();

    this.updateDen(0);
    this.setPaused(this.isPaused);
    this.playerRuntime.syncAppearance();
  }

  update(time: number) {
    this.updateDen(sketchTick(time));

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

  private fadeStatusSoon(): void {
    this.tweens.killTweensOf(this.statusText);
    this.statusText.setAlpha(1);
    this.tweens.add({ targets: this.statusText, alpha: 0, delay: STATUS_VISIBLE_MS, duration: 600 });
  }

  private updateDen(tick: number): void {
    const state = bridgeStore.getState();
    this.den?.update(
      {
        lit: state.inventory.ownedItemIds.includes('glasses'),
        ownedItemIds: state.inventory.ownedItemIds
      },
      tick,
      this.motion
    );
  }

  private applySessionResult(result: GameCommandResult): void {
    const messages = getMessages();
    applyGameConsoleEvents(result.events, {
      onReturnToOverworld: () => this.onClose?.(),
      onOpenOverlay: (overlayId) => {
        this.onOpenOverlay?.(overlayId);
        this.session?.restoreExploreAfterOverlay();
      },
      onThought: (id, variant) => this.showThought(id, variant)
    });

    if (result.events.some((event) => event.type === 'item_collected' && event.itemId === 'glasses')) {
      this.statusText.setText(messages.scenes.basement.glassesAcquired);
      this.fadeStatusSoon();
    }
    if (result.events.some((event) => event.type === 'item_collected' && event.itemId === 'circuit')) {
      this.den?.celebrateSolder();
      this.cameras.main.flash(this.motion ? 180 : 0, 102, 255, 153);
    }
  }

  private showThought(id: GameThoughtId, variant: number): void {
    const copy = getMessages().scenes.basement;
    const owned = bridgeStore.getState().inventory.ownedItemIds;
    const text: Record<GameThoughtId, () => string> = {
      basement_cannot_see: () => copy.cannotSeeThought,
      basement_corkboard: () => copy.corkboardNotes[variant % copy.corkboardNotes.length],
      basement_shelf: () => copy.shelfThought,
      workbench_missing_parts: () => copy.workbenchMissing(countCircuitParts(owned), CIRCUIT_PART_IDS.length),
      workbench_soldered: () => (variant === 0 ? copy.workbenchSoldered : copy.workbenchDone)
    };
    if (id === 'basement_corkboard') this.den?.markNoteRead(variant);
    this.playerThought.show(text[id]());
  }
}
