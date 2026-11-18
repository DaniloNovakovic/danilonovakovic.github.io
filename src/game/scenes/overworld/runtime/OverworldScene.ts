/**
 * OverworldScene — thin orchestrator.
 * Delegates environment/buildings/particles to street view modules,
 * and player logic to PlayerController.
 */
import * as Phaser from 'phaser';
import { TextureGenerator } from '@/game/sharedSceneRuntime/textures/TextureGenerator';
import {
  BASEMENT_SCENE_ID,
  HOBBIES_SCENE_ID,
  POTASSIUM_SCENE_ID,
  type SceneId
} from '@/game/scenes/sceneIds';
import type { OverlayId } from '@/game/overlays/overlayIds';
import {
  BANANA_PEEL_CLUE_ID,
  OVERWORLD_BASEMENT_HOLE,
  OVERWORLD_BILLBOARD_X,
  OVERWORLD_BUILDING_TRIGGERS,
  OVERWORLD_CHICK,
  OVERWORLD_CIRCUIT_SLOT,
  OVERWORLD_GLASSES_SECRET_SLOTS,
  OVERWORLD_INTERACT_PROMPT_OFFSET_Y,
  OVERWORLD_PLAYER_RESUME_Y_CLAMP,
  OVERWORLD_PLAYER_SPAWN_MARGIN_X,
  OVERWORLD_PLAYER_START,
  OVERWORLD_SIGNPOST_X,
  OVERWORLD_WIDTH
} from '../worldLayout';
import { getMessages } from '@/shared/i18n';
import {
  GAME_DESIGN_HEIGHT,
  SIDE_VIEW_JUMP_VELOCITY_Y,
  SIDE_VIEW_PLAYER_GRAVITY_Y,
  SIDE_VIEW_SPRINT_SPEED,
  SIDE_VIEW_WALK_SPEED
} from '@/game/sharedSceneRuntime/config';
import {
  bridgeStore,
  isItemEquipped,
  isItemOwned,
  isSecretDiscovered,
  type OpenOverlayOptions
} from '@/game/bridge/store';
import {
  GameConsoleSession,
  getOverworldProgress,
  getSketchDetailLevel,
  type GameCommandResult,
  type NearbyThing
} from '@/game/core/console';
import { loadRidgeRouteDialogueCatalog } from '@/game/scenes/ridge/content/routeCatalog';
import { applyGameConsoleEvents } from '@/game/scenes/shared/applyGameConsoleEvents';
import {
  buildStreetEnvironment,
  buildStreetForeground,
  setupStreetCamera
} from './street/StreetEnvironment';
import { buildStreetBuildings, type StreetBuildingLayers } from './street/StreetBuildings';
import { updateStreetParticles } from './street/StreetParticles';
import { StreetBirds, StreetFootsteps } from './street/StreetLife';
import { StreetCrt } from './street/StreetCrt';
import { StreetSignpost } from './street/StreetSignpost';
import { StreetHatch } from './street/StreetHatch';
import { StreetDetail } from './street/StreetDetail';
import { StreetBillboard } from './street/StreetBillboard';
import { StreetChick } from './street/StreetChick';
import { prefersReducedMotion, sketchTick } from '@/game/sharedSceneRuntime/motion/sketchMotion';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import { startTypewriterEffect, type TypewriterEffectHandle } from '@/game/sharedSceneRuntime/text/typewriterEffect';
import type { OverworldBuildingSlot } from '@/game/core/ecs/systems/overworldInteractSystems';
import { DistanceHazeVision } from '@/game/sharedSceneRuntime/vision/DistanceHazeVision';
import {
  createSideViewPlayerRuntime,
  type SideViewPlayerRuntime
} from '@/game/sharedSceneRuntime/player/SideViewPlayerRuntime';

/** Ms between each character for first-peel clue typewriter. */
const BANANA_PEEL_TYPEWRITER_CHAR_MS = 28;
/** After the full clue line is typed, wait this long (read time) before opening Potassium. */
const BANANA_PEEL_POST_TYPEWRITE_WARP_MS = 2000;
/** How long the clue toast stays visible after typing finishes (ms). */
const BANANA_PEEL_CLUE_VISIBLE_MS = 4500;
export class OverworldScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  streetBuildings!: StreetBuildingLayers;
  interactPrompt!: Phaser.GameObjects.Text;

  private playerRuntime?: SideViewPlayerRuntime;
  private onEnterScene?: (sceneId: SceneId) => void;
  private onOpenOverlay?: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  private isPaused: boolean = false;
  private resumePosition?: { x: number; y: number };
  private readonly buildingSlots: OverworldBuildingSlot[] = [];
  private lensRevealScratch: boolean[] = [];
  private preGlassesVision?: DistanceHazeVision;
  private bananaFloorIcon?: Phaser.GameObjects.Graphics;
  private circuitCrt?: StreetCrt;
  private signpost?: StreetSignpost;
  private hatch?: StreetHatch;
  private streetDetail?: StreetDetail;
  private droppingIntoHatch = false;
  /** Where the player stood before the hatch tween, so the return isn't inside the ground. */
  private preDropPosition?: { x: number; y: number };
  private birds?: StreetBirds;
  private chick?: StreetChick;
  private footsteps?: StreetFootsteps;
  private motion = true;
  private glassesSecretHint?: Phaser.GameObjects.Text;
  private glassesSecretMessage?: Phaser.GameObjects.Text;
  private glassesSecretMessageHideTimer?: Phaser.Time.TimerEvent;
  private bananaClueTypewriter?: TypewriterEffectHandle;
  private bananaPeelWarpTimeoutId?: ReturnType<typeof setTimeout>;
  private session?: GameConsoleSession;

  constructor() {
    super({ key: 'MainScene' });
  }

  init(data: {
    onEnterScene: (sceneId: SceneId) => void;
    onOpenOverlay: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
    isPaused: boolean;
    resumePosition?: { x: number; y: number };
  }) {
    this.onEnterScene = data.onEnterScene;
    this.onOpenOverlay = data.onOpenOverlay;
    this.isPaused = data.isPaused;
    this.resumePosition = data.resumePosition;
    this.resetBananaPeelFlow();
  }

  getResumeCapturePosition(): { x: number; y: number } | null {
    if (this.droppingIntoHatch && this.preDropPosition) return this.preDropPosition;
    return this.playerRuntime?.captureResume() ?? null;
  }

  shutdown(): void {
    this.resetBananaPeelFlow();
  }

  setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      this.resetBananaPeelFlow();
    }
    this.playerRuntime?.setPaused(paused);
  }

  preload() {
    TextureGenerator.generatePlayer(this);
    OVERWORLD_BUILDING_TRIGGERS.forEach((trigger) => {
      TextureGenerator.generateBuilding(this, trigger.id);
    });
  }

  create() {
    const messages = getMessages();
    const bridge = bridgeStore.getState();
    this.session = new GameConsoleSession({
      dialogue: loadRidgeRouteDialogueCatalog(),
      sceneId: 'overworld',
      ownedItemIds: bridge.inventory.ownedItemIds,
      equippedItemIds: bridge.equipment.equippedItemIds,
      discoveredSecretIds: bridge.progress.discoveredSecretIds
    });

    this.physics.world.setBounds(0, 0, OVERWORLD_WIDTH, GAME_DESIGN_HEIGHT);

    this.motion = !prefersReducedMotion();
    const { groundZone } = buildStreetEnvironment(this);
    this.streetDetail = new StreetDetail(this);
    new StreetBillboard(this, OVERWORLD_BILLBOARD_X, bridge.progress.streetDoodle);
    this.streetBuildings = buildStreetBuildings(this);
    this.signpost = new StreetSignpost(this, OVERWORLD_SIGNPOST_X);
    this.droppingIntoHatch = false;
    this.hatch = new StreetHatch(this, OVERWORLD_BASEMENT_HOLE.x, OVERWORLD_BASEMENT_HOLE.y);
    this.buildingSlots.length = 0;
    for (const bldg of this.streetBuildings.interactables.getChildren() as Phaser.GameObjects.Sprite[]) {
      this.buildingSlots.push({
        buildingId: bldg.getData('name') as string,
        x: bldg.x,
        y: bldg.y
      });
    }
    this.lensRevealScratch = this.streetBuildings.faces.map(() => false);

    this.playerRuntime = createSideViewPlayerRuntime({
      scene: this,
      start: OVERWORLD_PLAYER_START,
      resumePosition: this.resumePosition,
      resumeClamp: {
        minX: OVERWORLD_PLAYER_SPAWN_MARGIN_X,
        maxX: OVERWORLD_WIDTH - OVERWORLD_PLAYER_SPAWN_MARGIN_X,
        minY: OVERWORLD_PLAYER_RESUME_Y_CLAMP.min,
        maxY: OVERWORLD_PLAYER_RESUME_Y_CLAMP.max
      },
      sprite: {
        depth: 25,
        gravityY: SIDE_VIEW_PLAYER_GRAVITY_Y
      },
      movement: {
        walkSpeed: SIDE_VIEW_WALK_SPEED,
        sprintSpeed: SIDE_VIEW_SPRINT_SPEED,
        jumpVelocityY: SIDE_VIEW_JUMP_VELOCITY_Y
      },
      input: {
        allowJump: true,
        allowSprint: true
      },
      appearance: {
        isGlassesEquipped: () => isItemEquipped('glasses'),
        idleTextureKey: 'player_idle',
        glassesTextureKey: 'player_glasses'
      }
    });
    this.player = this.playerRuntime.player;
    this.physics.add.collider(this.player, groundZone);

    buildStreetForeground(this);
    setupStreetCamera(this, this.player);

    // --- UI ---
    this.interactPrompt = createUiText(this, 0, 0, messages.navigation.enter, {
      fontSize: '18px',
      color: '#1a1a1a',
      backgroundColor: '#ffffff',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setVisible(false).setDepth(20);
    this.bananaFloorIcon = this.add.graphics().setDepth(21).setVisible(false);
    this.drawBananaFloorIcon();
    this.circuitCrt = new StreetCrt(this, OVERWORLD_CIRCUIT_SLOT.x, OVERWORLD_CIRCUIT_SLOT.y, 18);
    this.circuitCrt.update(isItemOwned('circuit'), 0, this.motion);
    this.birds = new StreetBirds(this);
    this.chick = new StreetChick(this, OVERWORLD_CHICK.x);
    this.footsteps = new StreetFootsteps(this);

    this.preGlassesVision = new DistanceHazeVision(this, {
      depth: 15,
      color: 0xfbfbf9,
      tileSize: 30,
      clearRadius: 120,
      maxRadius: 560,
      minAlpha: 0.24,
      maxAlpha: 0.88
    });
    this.createGlassesSecret();
    this.setPaused(this.isPaused);
    this.playerRuntime.syncAppearance();
    this.updateLensReveal();
  }

  update(time: number, delta: number) {
    if (this.droppingIntoHatch) return;
    const playerUpdate = this.playerRuntime?.update();
    this.updateLensReveal();

    if (!playerUpdate || playerUpdate.paused) {
      return;
    }

    const { commands, step } = playerUpdate;
    if (commands.exitContext) {
      this.onEnterScene?.(HOBBIES_SCENE_ID);
      return;
    }

    const tick = sketchTick(time);
    this.updateStreetProps(time, delta, tick);
    updateStreetParticles(this);

    const nearby = this.updateOverworldInteraction(step.interactRequested);
    this.streetBuildings.applyFocus(
      nearby?.kind === 'building' ? nearby.id : null,
      tick,
      this.motion
    );
    this.updateProgressProps(tick, nearby?.kind === 'prop');
  }

  private updateStreetProps(time: number, delta: number, tick: number): void {
    const hasCircuit = isItemOwned('circuit');
    const sprinting = Math.abs(this.player.body.velocity.x) > SIDE_VIEW_WALK_SPEED + 1;
    const glassesOn = isItemEquipped('glasses');
    this.setBananaFloorVisible(glassesOn);
    this.chick?.update(time, delta, this.player.x, glassesOn, this.motion);
    this.circuitCrt?.update(hasCircuit, tick, this.motion);
    this.hatch?.update({ hasGlasses: isItemOwned('glasses'), hasCircuit }, this.player.x, tick, this.motion);
    this.birds?.update(time, delta, this.player.x, sprinting, this.motion);
    this.footsteps?.update(this.player, time, sprinting, this.motion);
  }

  private updateProgressProps(tick: number, nearProp: boolean): void {
    if (!this.session) return;
    const state = this.session.getState();
    const { stage } = getOverworldProgress(state);
    this.signpost?.update(stage, tick, this.player.x, nearProp, this.motion);
    this.streetDetail?.update(getSketchDetailLevel(state), tick, this.motion);
  }


  private updateOverworldInteraction(interactRequested: boolean): NearbyThing | undefined {
    if (!this.session) return undefined;

    const bridge = bridgeStore.getState();
    this.session.syncInventory(bridge.inventory.ownedItemIds, bridge.equipment.equippedItemIds);
    const sync = this.session.syncPlayerPosition(this.player.x, this.player.y);
    this.applySessionResult(sync);

    if (this.bananaPeelWarpTimeoutId !== undefined) {
      this.interactPrompt.setVisible(false);
      return undefined;
    }

    if (interactRequested) {
      this.applySessionResult(this.session.exec('interact'));
    }

    const nearby = this.session.observe().nearby[0];
    this.applyOverworldNearbyPrompt(nearby);
    return nearby;
  }

  private applySessionResult(result: GameCommandResult): void {
    if (!this.session) return;
    applyGameConsoleEvents(result.events, {
      onEnterScene: (sceneId) => this.enterSceneFromStreet(sceneId),
      onOpenOverlay: (overlayId) => {
        this.onOpenOverlay?.(overlayId);
        this.session?.restoreExploreAfterOverlay();
      },
      onBananaPeelDiscovered: () => this.startBananaPeelDiscovery(),
      onBananaPeelCancelled: () => this.cancelBananaPeelWarpIfAny(),
      onSignpostRead: ({ stage, found, total }) => this.signpost?.read(stage, found, total)
    });
  }

  private applyOverworldNearbyPrompt(nearby: NearbyThing | undefined): void {
    if (!nearby || this.session?.getState().overworld.bananaFirstPeelPending) {
      this.interactPrompt.setVisible(false);
      return;
    }

    const text = this.localizedPromptForNearby(nearby);
    const building = this.buildingSlots.find((slot) => slot.buildingId === nearby.id);
    const promptX =
      nearby.promptX ??
      (building?.x ?? (nearby.id === 'banana-peel' ? OVERWORLD_GLASSES_SECRET_SLOTS[0].x : this.player.x));
    const promptY = building
      ? building.y + OVERWORLD_INTERACT_PROMPT_OFFSET_Y
      : (nearby.promptY ?? this.player.y - 40);

    this.interactPrompt.setText(text).setPosition(promptX, promptY).setVisible(true);
  }

  private localizedPromptForNearby(nearby: NearbyThing): string {
    const nav = getMessages().navigation;
    const overworld = getMessages().scenes.overworld;
    switch (nearby.kind) {
      case 'hatch':
        return nav.interact;
      case 'prop':
        return overworld.signpostPrompt;
      case 'secret':
        return isSecretDiscovered(BANANA_PEEL_CLUE_ID)
          ? overworld.bananaDiscoveredPrompt
          : overworld.bananaUndiscoveredPrompt;
      case 'npc':
        return overworld.chickPrompt;
      case 'crt':
        return isItemOwned('circuit')
          ? overworld.circuitCrtReadyPrompt
          : overworld.circuitCrtLockedPrompt;
      default:
        return nav.enter;
    }
  }

  /**
   * Glasses secret: a little litter pile (crumpled paper + a tipped soda can)
   * with raccoon paw prints trotting off toward the dumpster. Ids still say
   * banana for save compatibility.
   */
  private drawBananaFloorIcon(): void {
    if (!this.bananaFloorIcon) return;
    const g = this.bananaFloorIcon;
    g.clear();
    const ink = 0x1a1a1a;
    const paper = 0xfbfbf9;

    // Crumpled paper ball.
    g.fillStyle(paper, 1);
    g.lineStyle(3, ink, 0.95);
    g.beginPath();
    const ball = [[-24, 10], [-19, 2], [-11, 1], [-5, 7], [-6, 16], [-13, 21], [-22, 19]];
    ball.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.lineStyle(2, ink, 0.7);
    g.beginPath();
    g.moveTo(-19, 6); g.lineTo(-14, 11); g.lineTo(-17, 16);
    g.moveTo(-14, 11); g.lineTo(-8, 10);
    g.strokePath();

    // Soda can tipped on its side.
    g.fillStyle(paper, 1);
    g.lineStyle(3, ink, 0.95);
    g.fillRoundedRect(-3, 10, 22, 11, 3);
    g.strokeRoundedRect(-3, 10, 22, 11, 3);
    g.strokeEllipse(19, 15.5, 4, 11);
    g.lineStyle(2, ink, 0.7);
    g.beginPath();
    g.moveTo(4, 13); g.lineTo(12, 13);
    g.strokePath();

    // Raccoon paw prints trotting away.
    g.fillStyle(ink, 0.85);
    [[30, 18], [40, 12], [50, 18]].forEach(([x, y]) => {
      g.fillEllipse(x, y, 6, 5);
      g.fillCircle(x - 3.5, y - 4, 1.3);
      g.fillCircle(x, y - 5, 1.3);
      g.fillCircle(x + 3.5, y - 4, 1.3);
    });
  }

  private setBananaFloorVisible(visible: boolean): void {
    if (!this.bananaFloorIcon) return;
    if (!visible) {
      this.bananaFloorIcon.setVisible(false);
      return;
    }
    this.bananaFloorIcon
      .setPosition(
        OVERWORLD_GLASSES_SECRET_SLOTS[0].x - 12,
        OVERWORLD_GLASSES_SECRET_SLOTS[0].y - 12
      )
      .setRotation(0)
      .setVisible(true);
  }

  private updateLensReveal(): void {
    if (!this.streetBuildings?.faces.length) return;
    const hasGlasses = isItemEquipped('glasses');
    for (let i = 0; i < this.lensRevealScratch.length; i++) {
      // Keep monochrome sketch style for now.
      this.lensRevealScratch[i] = false;
    }
    this.streetBuildings.applyLensProximityReveal(this.lensRevealScratch);
    this.updateLensFog(hasGlasses);
    this.updateGlassesSecrets(hasGlasses);
  }

  private updateLensFog(hasGlasses: boolean): void {
    if (!this.preGlassesVision) return;
    const centerScreenX = this.player.x - this.cameras.main.scrollX;
    const centerScreenY = this.player.y - this.cameras.main.scrollY - 45;
    this.preGlassesVision.render(!hasGlasses, centerScreenX, centerScreenY);
  }

  private createGlassesSecret(): void {
    const messages = getMessages();
    const bananaSecret = OVERWORLD_GLASSES_SECRET_SLOTS[0];
    this.glassesSecretHint = createUiText(
      this,
      bananaSecret.x,
      bananaSecret.y + 23,
      messages.scenes.overworld.glassesSecretHint,
      {
        fontSize: '12px',
        color: '#1a1a1a',
        backgroundColor: '#fbfbf9',
        padding: { x: 4, y: 2 }
      }
    )
      .setOrigin(0.5)
      .setDepth(18)
      .setVisible(false);
    this.glassesSecretMessage = createUiText(
      this,
      bananaSecret.x,
      bananaSecret.y - 105,
      '',
      {
        fontSize: '13px',
        color: '#1a1a1a',
        backgroundColor: '#fbfbf9',
        padding: { x: 6, y: 3 },
        wordWrap: { width: 260 }
      }
    )
      .setOrigin(0.5)
      .setDepth(30)
      .setVisible(false);
  }

  private updateGlassesSecrets(hasGlasses: boolean): void {
    const discovered = isSecretDiscovered(BANANA_PEEL_CLUE_ID);
    this.glassesSecretHint?.setVisible(hasGlasses && !discovered);
    if (!hasGlasses) {
      this.resetBananaPeelFlow();
    }
  }

  private clearBananaClueMessageTimers(): void {
    this.bananaClueTypewriter?.cancel();
    this.bananaClueTypewriter = undefined;
    this.glassesSecretMessageHideTimer?.destroy();
    this.glassesSecretMessageHideTimer = undefined;
  }

  /** Clears first-peel timers, typewriter, and clue UI (safe on every overworld init / shutdown). */
  private resetBananaPeelFlow(): void {
    if (this.bananaPeelWarpTimeoutId !== undefined) {
      globalThis.clearTimeout(this.bananaPeelWarpTimeoutId);
      this.bananaPeelWarpTimeoutId = undefined;
    }
    if (this.session) {
      this.session.getState().overworld.bananaFirstPeelPending = false;
    }
    this.clearBananaClueMessageTimers();
    this.glassesSecretMessage?.setVisible(false);
  }

  /** Abort first peel if the player walks away or uses another exit while typewriter / warp is pending. */
  private cancelBananaPeelWarpIfAny(): void {
    const pending = this.session?.getState().overworld.bananaFirstPeelPending ?? false;
    if (this.bananaPeelWarpTimeoutId === undefined && !pending) return;
    this.resetBananaPeelFlow();
  }

  private startBananaPeelDiscovery(): void {
    const messages = getMessages();
    this.showBananaClueMessage(
      messages.scenes.overworld.bananaDiscovery,
      BANANA_PEEL_CLUE_VISIBLE_MS,
      {
        typewriter: true,
        onTypewriterComplete: () => {
          this.bananaPeelWarpTimeoutId = globalThis.setTimeout(() => {
            this.bananaPeelWarpTimeoutId = undefined;
            if (this.session) {
              this.applySessionResult(this.session.commitBananaPeelWarp());
            } else {
              this.onEnterScene?.(POTASSIUM_SCENE_ID);
            }
          }, BANANA_PEEL_POST_TYPEWRITE_WARP_MS);
        }
      }
    );
  }

  private showBananaClueMessage(
    message: string,
    visibleMs: number = 2600,
    opts?: { typewriter?: boolean; onTypewriterComplete?: () => void }
  ): void {
    this.clearBananaClueMessageTimers();
    if (!this.glassesSecretMessage) return;

    const scheduleHide = (): void => {
      this.glassesSecretMessageHideTimer = this.time.delayedCall(visibleMs, () => {
        this.glassesSecretMessage?.setVisible(false);
        this.glassesSecretMessageHideTimer = undefined;
      });
    };

    if (opts?.typewriter && message.length > 0) {
      this.bananaClueTypewriter = startTypewriterEffect(this, this.glassesSecretMessage, message, {
        charDelayMs: BANANA_PEEL_TYPEWRITER_CHAR_MS,
        onComplete: () => {
          this.bananaClueTypewriter = undefined;
          scheduleHide();
          opts.onTypewriterComplete?.();
        }
      });
    } else {
      this.glassesSecretMessage.setText(message);
      this.glassesSecretMessage.setVisible(true);
      scheduleHide();
    }
  }

  private enterSceneFromStreet(sceneId: SceneId): void {
    if (sceneId !== BASEMENT_SCENE_ID || !this.hatch || this.droppingIntoHatch) {
      this.onEnterScene?.(sceneId);
      return;
    }
    this.preDropPosition = { x: this.player.x, y: this.player.y };
    this.droppingIntoHatch = true;
    this.interactPrompt.setVisible(false);
    this.hatch.dropIn(this.player, this.motion, () => this.onEnterScene?.(sceneId));
  }
}
