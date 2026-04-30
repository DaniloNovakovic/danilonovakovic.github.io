/**
 * OverworldScene — thin orchestrator.
 * Delegates environment/buildings/particles to street view modules,
 * and player logic to PlayerController.
 */
import * as Phaser from 'phaser';
import { BASEMENT_FEATURE_ID, HOBBIES_FEATURE_ID } from '../config/featureIds';
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
import { bridgeActions, bridgeStore } from '../shared/bridge/store';
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
  pickOverworldInteractTarget,
  type OverworldBuildingSlot
} from '../core/ecs/systems/overworldInteractSystems';
import {
  commandFrameToPlayerStepInput,
  createInputCommandFrame
} from '../core/input/commands';
import { readSceneInputCommands } from './input/readSceneInputCommands';

const BASEMENT_HOLE = {
  x: 230,
  y: 535,
  promptY: 485,
  interactDistanceX: 70,
  minPlayerY: 400
} as const;

const PRE_GLASSES_CLEAR_RADIUS = 180;

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
  private lensFog?: Phaser.GameObjects.Graphics;
  private hasGlassesSprite = false;

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
  }

  getResumeCapturePosition(): { x: number; y: number } | null {
    if (!this.player?.body) return null;
    return { x: this.player.x, y: this.player.y };
  }

  updateInteractCallback(callback: (area: string) => void) {
    this.onInteract = callback;
  }

  setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) this.controller?.pause();
    else this.controller?.resume();
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

    this.lensFog = this.add.graphics().setDepth(15);
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

    this.player.setFlipX(step.facingLeft);
    this.player.setAngle(step.moving ? Math.sin(this.time.now / 100) * 5 : 0);

    updateStreetParticles(this);

    const isNearBasementHole =
      Math.abs(this.player.x - BASEMENT_HOLE.x) < BASEMENT_HOLE.interactDistanceX &&
      this.player.y > BASEMENT_HOLE.minPlayerY;
    if (isNearBasementHole) {
      this.interactPrompt.setPosition(BASEMENT_HOLE.x, BASEMENT_HOLE.promptY).setVisible(true);
      if (step.interactRequested) {
        this.onInteract?.(BASEMENT_FEATURE_ID);
      }
      return;
    }

    const interact = pickOverworldInteractTarget(this.player.x, this.player.y, this.buildingSlots, {
      maxDistX: OVERWORLD_INTERACT_DISTANCE_X,
      minPlayerY: OVERWORLD_INTERACT_MIN_PLAYER_Y,
      promptOffsetY: OVERWORLD_INTERACT_PROMPT_OFFSET_Y
    });

    if (interact.buildingId != null && interact.promptX != null && interact.promptY != null) {
      this.interactPrompt.setPosition(interact.promptX, interact.promptY).setVisible(true);
      if (step.interactRequested) {
        this.onInteract?.(interact.buildingId);
      }
    } else {
      this.interactPrompt.setVisible(false);
    }
  }

  private updateLensReveal(): void {
    if (!this.streetBuildings?.faces.length) return;
    const hasGlasses = bridgeStore.getState().progress.hasGlasses;
    for (let i = 0; i < this.lensRevealScratch.length; i++) {
      this.lensRevealScratch[i] = hasGlasses;
    }
    this.streetBuildings.applyLensProximityReveal(this.lensRevealScratch);
    this.updateLensFog(hasGlasses);
  }

  private updateLensFog(hasGlasses: boolean): void {
    if (!this.lensFog) return;
    this.lensFog.clear();
    if (hasGlasses) return;

    this.lensFog.fillStyle(0x111111, 0.52);
    this.lensFog.fillRect(0, 0, OVERWORLD_WIDTH, GAME_DESIGN_HEIGHT);
    this.lensFog.setBlendMode(Phaser.BlendModes.ERASE);
    this.lensFog.fillStyle(0xffffff, 1);
    this.lensFog.fillCircle(this.player.x, this.player.y - 45, PRE_GLASSES_CLEAR_RADIUS);
    this.lensFog.setBlendMode(Phaser.BlendModes.NORMAL);
  }

  private updatePlayerGlassesAppearance(): void {
    const hasGlasses = bridgeStore.getState().progress.hasGlasses;
    if (hasGlasses === this.hasGlassesSprite) return;
    this.hasGlassesSprite = hasGlasses;
    this.player.setTexture(hasGlasses ? 'player_glasses' : 'player_idle');
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
