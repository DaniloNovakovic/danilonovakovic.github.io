/**
 * OverworldScene — thin orchestrator.
 * Delegates environment/buildings/particles to street view modules,
 * and player logic to PlayerController.
 */
import * as Phaser from 'phaser';
import { BASEMENT_FEATURE_ID, HOBBIES_FEATURE_ID, POTASSIUM_FEATURE_ID } from '@/game/registry/featureIds';
import { PORTFOLIO_SECTIONS } from '@/game/registry/portfolioRegistry';
import { TextureGenerator } from '@/game/runtime/textures/TextureGenerator';
import { getMessages } from '@/shared/i18n';
import {
  GAME_DESIGN_HEIGHT,
  OVERWORLD_INTERACT_DISTANCE_X,
  OVERWORLD_INTERACT_MIN_PLAYER_Y,
  OVERWORLD_INTERACT_PROMPT_OFFSET_Y,
  OVERWORLD_JUMP_VELOCITY_Y,
  OVERWORLD_PLAYER_GRAVITY_Y,
  OVERWORLD_PLAYER_RESUME_Y_CLAMP,
  OVERWORLD_PLAYER_START,
  OVERWORLD_PLAYER_SPAWN_MARGIN_X,
  OVERWORLD_SPRINT_SPEED,
  OVERWORLD_WALK_SPEED,
  OVERWORLD_WIDTH
} from '@/game/runtime/config';
import {
  bridgeActions,
  isItemEquipped,
  isSecretDiscovered,
  type SecretDiscoveryId
} from '@/game/bridge/store';
import {
  buildStreetEnvironment,
  buildStreetForeground,
  setupStreetCamera
} from './street/StreetEnvironment';
import { buildStreetBuildings, type StreetBuildingLayers } from './street/StreetBuildings';
import { updateStreetParticles } from './street/StreetParticles';
import { createUiText } from '@/game/runtime/text/createUiText';
import { startTypewriterEffect, type TypewriterEffectHandle } from '@/game/runtime/text/typewriterEffect';
import {
  type OverworldBuildingSlot,
  type OverworldSecretSlot
} from '@/game/core/ecs/systems/overworldInteractSystems';
import { DistanceHazeVision } from '@/game/runtime/vision/DistanceHazeVision';
import {
  createOverworldInteractionState,
  decideOverworldInteraction,
  type OverworldInteractionPrompt,
  type OverworldInteractionState
} from './overworld/overworldInteractionState';
import {
  createSideViewPlayerRuntime,
  type SideViewPlayerRuntime
} from '@/game/runtime/player/SideViewPlayerRuntime';

const BASEMENT_HOLE = {
  x: 230,
  y: 535,
  promptY: 485,
  interactDistanceX: 70,
  minPlayerY: 400
} as const;

const BANANA_PEEL_CLUE_ID: SecretDiscoveryId = 'banana-peel-clue';
/** Ms between each character for first-peel clue typewriter. */
const BANANA_PEEL_TYPEWRITER_CHAR_MS = 28;
/** After the full clue line is typed, wait this long (read time) before opening Potassium. */
const BANANA_PEEL_POST_TYPEWRITE_WARP_MS = 2000;
/** How long the clue toast stays visible after typing finishes (ms). */
const BANANA_PEEL_CLUE_VISIBLE_MS = 4500;
/** Cancel pending peel warp only after moving this far past slot radius (avoids 1-frame jitter killing the timer). */
const BANANA_PEEL_WARP_CANCEL_EXTRA_DIST = 36;

const GLASSES_SECRET_SLOTS: readonly OverworldSecretSlot[] = [
  {
    secretId: BANANA_PEEL_CLUE_ID,
    x: 650,
    y: 535,
    radius: 95,
    promptOffsetY: -56
  }
];

export class OverworldScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  streetBuildings!: StreetBuildingLayers;
  interactPrompt!: Phaser.GameObjects.Text;

  private playerRuntime?: SideViewPlayerRuntime;
  private onInteract?: (area: string) => void;
  private isPaused: boolean = false;
  private resumePosition?: { x: number; y: number };
  private readonly buildingSlots: OverworldBuildingSlot[] = [];
  private lensRevealScratch: boolean[] = [];
  private preGlassesVision?: DistanceHazeVision;
  private bananaFloorIcon?: Phaser.GameObjects.Graphics;
  private glassesSecretHint?: Phaser.GameObjects.Text;
  private glassesSecretMessage?: Phaser.GameObjects.Text;
  private glassesSecretMessageHideTimer?: Phaser.Time.TimerEvent;
  private bananaClueTypewriter?: TypewriterEffectHandle;
  private bananaPeelWarpTimeoutId?: ReturnType<typeof setTimeout>;
  private overworldInteractionState: OverworldInteractionState = createOverworldInteractionState();

  constructor() {
    super({ key: 'MainScene' });
  }

  init(data: {
    onInteract: (area: string) => void;
    isPaused: boolean;
    resumePosition?: { x: number; y: number };
  }) {
    this.onInteract = data.onInteract;
    this.isPaused = data.isPaused;
    this.resumePosition = data.resumePosition;
    this.resetBananaPeelFlow();
  }

  getResumeCapturePosition(): { x: number; y: number } | null {
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
    PORTFOLIO_SECTIONS.forEach((s) => {
      if (s.x !== undefined) {
        TextureGenerator.generateBuilding(this, s.id);
      }
    });
  }

  create() {
    const messages = getMessages();
    this.physics.world.setBounds(0, 0, OVERWORLD_WIDTH, GAME_DESIGN_HEIGHT);

    const { groundZone } = buildStreetEnvironment(this);
    this.streetBuildings = buildStreetBuildings(this);
    this.createBasementHoleTrigger();
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
        gravityY: OVERWORLD_PLAYER_GRAVITY_Y
      },
      movement: {
        walkSpeed: OVERWORLD_WALK_SPEED,
        sprintSpeed: OVERWORLD_SPRINT_SPEED,
        jumpVelocityY: OVERWORLD_JUMP_VELOCITY_Y
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

  update() {
    const playerUpdate = this.playerRuntime?.update();
    this.updateLensReveal();

    if (!playerUpdate || playerUpdate.paused) {
      return;
    }

    const { commands, step } = playerUpdate;
    if (commands.exitContext) {
      this.onInteract?.(HOBBIES_FEATURE_ID);
      return;
    }

    const hasGlassesEquipped = isItemEquipped('glasses');
    this.setBananaFloorVisible(hasGlassesEquipped);

    updateStreetParticles(this);

    this.updateOverworldInteraction(step.interactRequested, hasGlassesEquipped);
  }

  private updateOverworldInteraction(interactRequested: boolean, hasGlassesEquipped: boolean): void {
    const result = decideOverworldInteraction(this.overworldInteractionState, {
      playerX: this.player.x,
      playerY: this.player.y,
      interactRequested,
      hasGlassesEquipped,
      bananaDiscovered: isSecretDiscovered(BANANA_PEEL_CLUE_ID),
      bananaWarpScheduled: this.bananaPeelWarpTimeoutId !== undefined,
      bananaCancelExtraDist: BANANA_PEEL_WARP_CANCEL_EXTRA_DIST,
      basementFeatureId: BASEMENT_FEATURE_ID,
      potassiumFeatureId: POTASSIUM_FEATURE_ID,
      basementHole: BASEMENT_HOLE,
      secretSlots: GLASSES_SECRET_SLOTS,
      buildingSlots: this.buildingSlots,
      buildingPickOptions: {
        maxDistX: OVERWORLD_INTERACT_DISTANCE_X,
        minPlayerY: OVERWORLD_INTERACT_MIN_PLAYER_Y,
        promptOffsetY: OVERWORLD_INTERACT_PROMPT_OFFSET_Y
      },
      texts: {
        basement: getMessages().navigation.interact,
        enter: getMessages().navigation.enter,
        bananaDiscovered: getMessages().scenes.overworld.bananaDiscoveredPrompt,
        bananaUndiscovered: getMessages().scenes.overworld.bananaUndiscoveredPrompt
      }
    });

    this.overworldInteractionState = result.state;
    this.applyOverworldPrompt(result.prompt);
    for (const effect of result.effects) {
      if (effect.type === 'cancelBananaPeel') {
        this.cancelBananaPeelWarpIfAny();
      } else if (effect.type === 'discoverBananaPeel') {
        this.startBananaPeelDiscovery();
      } else {
        this.onInteract?.(effect.targetId);
      }
    }
  }

  private applyOverworldPrompt(prompt: OverworldInteractionPrompt): void {
    if (!prompt.visible) {
      this.interactPrompt.setVisible(false);
      return;
    }
    this.interactPrompt.setText(prompt.text).setPosition(prompt.x, prompt.y).setVisible(true);
  }

  private drawBananaFloorIcon(): void {
    if (!this.bananaFloorIcon) return;
    const g = this.bananaFloorIcon;
    g.clear();
    const ink = 0x1a1a1a;
    const steps = 32;

    // True moon / crescent: two concentric circular arcs + radial segments at the tips (no lens, no fish tail).
    const cx = 0;
    const cy = 19;
    const rOut = 27;
    const rIn = 16.5;
    const a0 = Phaser.Math.DegToRad(208);
    const a1 = Phaser.Math.DegToRad(332);

    const pt = (r: number, a: number) => ({
      x: cx + r * Math.cos(a),
      y: cy + r * Math.sin(a)
    });

    g.lineStyle(3, ink, 0.95);
    g.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = Phaser.Math.Linear(a0, a1, t);
      const p = pt(rOut, a);
      if (i === 0) g.moveTo(p.x, p.y);
      else g.lineTo(p.x, p.y);
    }
    const tipInnerR = pt(rIn, a1);
    g.lineTo(tipInnerR.x, tipInnerR.y);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = Phaser.Math.Linear(a1, a0, t);
      const p = pt(rIn, a);
      g.lineTo(p.x, p.y);
    }
    const tipOutL = pt(rOut, a0);
    g.lineTo(tipOutL.x, tipOutL.y);
    g.strokePath();

    // Stem: one short stroke from the thick crescent tip (no fork).
    g.lineStyle(3, ink, 0.92);
    g.beginPath();
    g.moveTo(tipOutL.x, tipOutL.y);
    g.lineTo(tipOutL.x - 5, tipOutL.y - 6);
    g.strokePath();
  }

  private setBananaFloorVisible(visible: boolean): void {
    if (!this.bananaFloorIcon) return;
    if (!visible) {
      this.bananaFloorIcon.setVisible(false);
      return;
    }
    this.bananaFloorIcon
      .setPosition(GLASSES_SECRET_SLOTS[0].x + 2, GLASSES_SECRET_SLOTS[0].y - 2)
      .setRotation(Phaser.Math.DegToRad(4))
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
    this.glassesSecretHint = createUiText(this, 650, 558, messages.scenes.overworld.glassesSecretHint, {
      fontSize: '12px',
      color: '#1a1a1a',
      backgroundColor: '#fbfbf9',
      padding: { x: 4, y: 2 }
    })
      .setOrigin(0.5)
      .setDepth(18)
      .setVisible(false);
    this.glassesSecretMessage = createUiText(
      this,
      650,
      430,
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
    this.overworldInteractionState = createOverworldInteractionState();
    this.clearBananaClueMessageTimers();
    this.glassesSecretMessage?.setVisible(false);
  }

  /** Abort first peel if the player walks away or uses another exit while typewriter / warp is pending. */
  private cancelBananaPeelWarpIfAny(): void {
    if (
      this.bananaPeelWarpTimeoutId === undefined &&
      !this.overworldInteractionState.bananaFirstPeelPending
    ) return;
    this.resetBananaPeelFlow();
  }

  private startBananaPeelDiscovery(): void {
    const messages = getMessages();
    bridgeActions.discoverSecret(BANANA_PEEL_CLUE_ID);
    this.showBananaClueMessage(
      messages.scenes.overworld.bananaDiscovery,
      BANANA_PEEL_CLUE_VISIBLE_MS,
      {
        typewriter: true,
        onTypewriterComplete: () => {
          this.bananaPeelWarpTimeoutId = globalThis.setTimeout(() => {
            this.bananaPeelWarpTimeoutId = undefined;
            this.overworldInteractionState = createOverworldInteractionState();
            this.onInteract?.(POTASSIUM_FEATURE_ID);
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

  private createBasementHoleTrigger(): void {
    const messages = getMessages();
    const line = 0x1a1a1a;
    const hole = this.add.graphics();
    hole.fillStyle(line, 0.92);
    hole.fillEllipse(BASEMENT_HOLE.x, BASEMENT_HOLE.y, 120, 28);
    hole.lineStyle(3, line, 1);
    hole.strokeEllipse(BASEMENT_HOLE.x, BASEMENT_HOLE.y - 2, 122, 30);
    hole.lineStyle(2, 0xfbfbf9, 0.35);
    for (let offset = -45; offset <= 45; offset += 18) {
      hole.beginPath();
      hole.moveTo(BASEMENT_HOLE.x + offset, BASEMENT_HOLE.y - 10);
      hole.lineTo(BASEMENT_HOLE.x + offset + 12, BASEMENT_HOLE.y + 8);
      hole.strokePath();
    }

    createUiText(this, BASEMENT_HOLE.x, BASEMENT_HOLE.y - 48, messages.scenes.overworld.basementHole, {
      fontSize: '18px',
      color: '#1a1a1a',
      fontStyle: 'bold',
      backgroundColor: '#fbfbf9',
      padding: { x: 6, y: 2 }
    }).setOrigin(0.5);
  }
}
