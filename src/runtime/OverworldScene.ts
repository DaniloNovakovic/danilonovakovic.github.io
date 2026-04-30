/**
 * OverworldScene — thin orchestrator.
 * Delegates environment/buildings/particles to street view modules,
 * and player logic to PlayerController.
 */
import * as Phaser from 'phaser';
import { BASEMENT_FEATURE_ID, HOBBIES_FEATURE_ID, POTASSIUM_FEATURE_ID } from '../config/featureIds';
import { PORTFOLIO_SECTIONS } from '../config/portfolioRegistry';
import { TextureGenerator } from './textures/TextureGenerator';
import { TEXTS } from '../config/content';
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
} from './config';
import { setSceneKeyboardPaused } from './sceneKeyboardPause';
import { bridgeActions, bridgeStore, type SecretDiscoveryId } from '../shared/bridge/store';
import { PlayerController } from '../core/player/PlayerController';
import {
  buildStreetEnvironment,
  buildStreetForeground,
  setupStreetCamera
} from './street/StreetEnvironment';
import { buildStreetBuildings, type StreetBuildingLayers } from './street/StreetBuildings';
import { updateStreetParticles } from './street/StreetParticles';
import { createUiText } from './text/createUiText';
import {
  pickGlassesSecretTarget,
  pickOverworldInteractTarget,
  type OverworldBuildingSlot,
  type OverworldSecretSlot
} from '../core/ecs/systems/overworldInteractSystems';
import {
  commandFrameToPlayerStepInput,
  createInputCommandFrame
} from '../core/input/commands';
import { readSceneInputCommands } from './input/readSceneInputCommands';
import { DistanceHazeVision } from './vision/DistanceHazeVision';

const BASEMENT_HOLE = {
  x: 230,
  y: 535,
  promptY: 485,
  interactDistanceX: 70,
  minPlayerY: 400
} as const;

const BANANA_PEEL_CLUE_ID: SecretDiscoveryId = 'banana-peel-clue';
/** Delay after first-time peel message before opening Potassium (ms). */
const BANANA_PEEL_WARP_DELAY_MS = 1100;
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
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!: { a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
  interactKey!: Phaser.Input.Keyboard.Key;
  hKey!: Phaser.Input.Keyboard.Key;
  streetBuildings!: StreetBuildingLayers;
  interactPrompt!: Phaser.GameObjects.Text;

  private controller!: PlayerController;
  private onInteract?: (area: string) => void;
  private isPaused: boolean = false;
  private resumePosition?: { x: number; y: number };
  private readonly inputFrame = createInputCommandFrame();
  private readonly buildingSlots: OverworldBuildingSlot[] = [];
  private lensRevealScratch: boolean[] = [];
  private preGlassesVision?: DistanceHazeVision;
  private hasGlassesSprite: boolean | null = null;
  private bananaFloorIcon?: Phaser.GameObjects.Graphics;
  private glassesSecretHint?: Phaser.GameObjects.Text;
  private glassesSecretMessage?: Phaser.GameObjects.Text;
  private glassesSecretMessageHideTimer?: Phaser.Time.TimerEvent;
  private bananaPeelWarpTimeoutId?: ReturnType<typeof setTimeout>;

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
    // Scene instances are reused; force texture sync on each enter.
    this.hasGlassesSprite = null;
    this.cancelBananaPeelWarpIfAny();
  }

  getResumeCapturePosition(): { x: number; y: number } | null {
    if (!this.player?.body) return null;
    return { x: this.player.x, y: this.player.y };
  }

  updateInteractCallback(callback: (area: string) => void) {
    this.onInteract = callback;
  }

  shutdown(): void {
    this.cancelBananaPeelWarpIfAny();
  }

  setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      this.cancelBananaPeelWarpIfAny();
      this.controller?.pause();
    } else this.controller?.resume();
    setSceneKeyboardPaused(this, paused, {
      pausePhysicsWorld: true,
      zeroHorizontalVelocity: () => this.controller?.zeroVelocity()
    });
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

    // --- PLAYER ---
    const startX = this.resumePosition
      ? Phaser.Math.Clamp(
          this.resumePosition.x,
          OVERWORLD_PLAYER_SPAWN_MARGIN_X,
          OVERWORLD_WIDTH - OVERWORLD_PLAYER_SPAWN_MARGIN_X
        )
      : OVERWORLD_PLAYER_START.x;
    const startY = this.resumePosition
      ? Phaser.Math.Clamp(
          this.resumePosition.y,
          OVERWORLD_PLAYER_RESUME_Y_CLAMP.min,
          OVERWORLD_PLAYER_RESUME_Y_CLAMP.max
        )
      : OVERWORLD_PLAYER_START.y;

    this.player = this.physics.add.sprite(startX, startY, 'player_idle');
    this.player.setDepth(25);
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(OVERWORLD_PLAYER_GRAVITY_Y);
    this.physics.add.collider(this.player, groundZone);

    this.controller = new PlayerController({
      walkSpeed: OVERWORLD_WALK_SPEED,
      sprintSpeed: OVERWORLD_SPRINT_SPEED,
      jumpVelocityY: OVERWORLD_JUMP_VELOCITY_Y
    });
    this.controller.mount(this.player);

    buildStreetForeground(this);
    setupStreetCamera(this, this.player);

    // --- INPUT ---
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      };
      this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.hKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    }

    // --- UI ---
    this.interactPrompt = createUiText(this, 0, 0, TEXTS.navigation.enter, {
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
    this.updatePlayerGlassesAppearance();
    this.updateLensReveal();
  }

  update() {
    this.updatePlayerGlassesAppearance();
    this.updateLensReveal();

    if (this.isPaused) {
      this.controller.zeroVelocity();
      return;
    }

    const touchState = bridgeStore.getState().touch;
    const oneShots = bridgeActions.consumeTouchOneShots();
    const commands = readSceneInputCommands({
      frame: this.inputFrame,
      cursors: this.cursors,
      wasd: this.wasd,
      interactKey: this.interactKey,
      hKey: this.hKey,
      touch: touchState,
      oneShots,
      allowJump: true,
      allowSprint: true
    });
    if (commands.exitContext) {
      this.onInteract?.(HOBBIES_FEATURE_ID);
      return;
    }

    const step = this.controller.step(commandFrameToPlayerStepInput(commands));
    const hasGlassesEquipped = bridgeStore.getState().equipment.equippedItemIds.includes('glasses');
    this.setBananaFloorVisible(hasGlassesEquipped);

    this.player.setFlipX(step.facingLeft);
    this.player.setAngle(step.moving ? Math.sin(this.time.now / 100) * 5 : 0);

    updateStreetParticles(this);

    const secret = pickGlassesSecretTarget(
      this.player.x,
      this.player.y,
      hasGlassesEquipped,
      GLASSES_SECRET_SLOTS
    );
    const nearPeel =
      secret.secretId != null && secret.promptX != null && secret.promptY != null;
    const peelSlot = GLASSES_SECRET_SLOTS[0];
    const distToPeel = Math.hypot(this.player.x - peelSlot.x, this.player.y - peelSlot.y);
    if (
      this.bananaPeelWarpTimeoutId !== undefined &&
      distToPeel > peelSlot.radius + BANANA_PEEL_WARP_CANCEL_EXTRA_DIST
    ) {
      this.cancelBananaPeelWarpIfAny();
    }

    const isNearBasementHole =
      Math.abs(this.player.x - BASEMENT_HOLE.x) < BASEMENT_HOLE.interactDistanceX &&
      this.player.y > BASEMENT_HOLE.minPlayerY;
    if (isNearBasementHole) {
      if (this.bananaPeelWarpTimeoutId !== undefined) {
        this.cancelBananaPeelWarpIfAny();
      }
      this.interactPrompt
        .setText(TEXTS.navigation.interact)
        .setPosition(BASEMENT_HOLE.x, BASEMENT_HOLE.promptY)
        .setVisible(true);
      if (step.interactRequested) {
        this.onInteract?.(BASEMENT_FEATURE_ID);
      }
      return;
    }

    if (nearPeel && secret.promptX != null && secret.promptY != null) {
      const bananaDiscovered = bridgeStore
        .getState()
        .progress.discoveredSecretIds.includes(BANANA_PEEL_CLUE_ID);
      this.interactPrompt
        .setText(bananaDiscovered ? '[E] Peel banana' : '[E] Peel?')
        .setPosition(secret.promptX, secret.promptY)
        .setVisible(true);
      if (step.interactRequested && this.bananaPeelWarpTimeoutId === undefined) {
        if (bananaDiscovered) {
          this.onInteract?.(POTASSIUM_FEATURE_ID);
        } else {
          bridgeActions.discoverSecret(BANANA_PEEL_CLUE_ID);
          this.showBananaClueMessage(
            'A tiny banana sticker points east. This city has stranger shortcuts than doors.'
          );
          // Use real timers so a one-frame "outside radius" flicker does not cancel the warp,
          // and the warp still fires if Phaser scene time is finicky during transitions.
          this.bananaPeelWarpTimeoutId = globalThis.setTimeout(() => {
            this.bananaPeelWarpTimeoutId = undefined;
            this.onInteract?.(POTASSIUM_FEATURE_ID);
          }, BANANA_PEEL_WARP_DELAY_MS);
        }
      }
      return;
    }

    const interact = pickOverworldInteractTarget(this.player.x, this.player.y, this.buildingSlots, {
      maxDistX: OVERWORLD_INTERACT_DISTANCE_X,
      minPlayerY: OVERWORLD_INTERACT_MIN_PLAYER_Y,
      promptOffsetY: OVERWORLD_INTERACT_PROMPT_OFFSET_Y
    });

    if (interact.buildingId != null && interact.promptX != null && interact.promptY != null) {
      this.interactPrompt
        .setText(TEXTS.navigation.enter)
        .setPosition(interact.promptX, interact.promptY)
        .setVisible(true);
      if (step.interactRequested) {
        this.onInteract?.(interact.buildingId);
      }
    } else {
      this.interactPrompt.setVisible(false);
    }
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
    const tipR = pt(rOut, a1);
    const tipInnerR = pt(rIn, a1);
    g.lineTo(tipInnerR.x, tipInnerR.y);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = Phaser.Math.Linear(a1, a0, t);
      const p = pt(rIn, a);
      g.lineTo(p.x, p.y);
    }
    const tipInnerL = pt(rIn, a0);
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
    const hasGlasses = bridgeStore.getState().equipment.equippedItemIds.includes('glasses');
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

  private updatePlayerGlassesAppearance(): void {
    const hasGlasses = bridgeStore.getState().equipment.equippedItemIds.includes('glasses');
    if (hasGlasses === this.hasGlassesSprite) return;
    this.hasGlassesSprite = hasGlasses;
    this.player.setTexture(hasGlasses ? 'player_glasses' : 'player_idle');
  }

  private createGlassesSecret(): void {
    this.glassesSecretHint = createUiText(this, 650, 558, 'Something appears in plain sight.', {
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
    const discovered = bridgeStore.getState().progress.discoveredSecretIds.includes(BANANA_PEEL_CLUE_ID);
    this.glassesSecretHint?.setVisible(hasGlasses && !discovered);
    if (!hasGlasses) {
      this.cancelBananaPeelWarpIfAny();
      this.glassesSecretMessageHideTimer?.destroy();
      this.glassesSecretMessageHideTimer = undefined;
      this.glassesSecretMessage?.setVisible(false);
    }
  }

  private cancelBananaPeelWarpIfAny(): void {
    if (this.bananaPeelWarpTimeoutId !== undefined) {
      globalThis.clearTimeout(this.bananaPeelWarpTimeoutId);
      this.bananaPeelWarpTimeoutId = undefined;
    }
  }

  private showBananaClueMessage(message: string): void {
    this.glassesSecretMessage?.setText(message);
    this.glassesSecretMessage?.setVisible(true);
    this.glassesSecretMessageHideTimer?.destroy();
    this.glassesSecretMessageHideTimer = this.time.delayedCall(2600, () => {
      this.glassesSecretMessage?.setVisible(false);
      this.glassesSecretMessageHideTimer = undefined;
    });
  }

  private createBasementHoleTrigger(): void {
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

    createUiText(this, BASEMENT_HOLE.x, BASEMENT_HOLE.y - 48, 'TODO?', {
      fontSize: '18px',
      color: '#1a1a1a',
      fontStyle: 'bold',
      backgroundColor: '#fbfbf9',
      padding: { x: 6, y: 2 }
    }).setOrigin(0.5);
  }
}
