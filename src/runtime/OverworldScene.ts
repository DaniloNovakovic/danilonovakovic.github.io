/**
 * OverworldScene — thin orchestrator.
 * Delegates environment/buildings/particles to street view modules,
 * and player logic to PlayerController.
 */
import * as Phaser from 'phaser';
import { HOBBIES_FEATURE_ID } from '../config/featureIds';
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
import { PlayerController } from '../core/player/PlayerController';
import { InputMapper } from './input/InputMapper';
import {
  buildStreetEnvironment,
  buildStreetForeground,
  setupStreetCamera
} from './street/StreetEnvironment';
import { buildStreetBuildings } from './street/StreetBuildings';
import { updateStreetParticles } from './street/StreetParticles';
import { createUiText } from './text/createUiText';
import { pickOverworldInteractTarget } from '../core/ecs/systems/overworldInteractSystems';

export class OverworldScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!: { a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
  interactKey!: Phaser.Input.Keyboard.Key;
  buildings!: Phaser.GameObjects.Group;
  interactPrompt!: Phaser.GameObjects.Text;

  private controller!: PlayerController;
  private inputMapper!: InputMapper;
  private onInteract?: (area: string) => void;
  private isPaused: boolean = false;
  private resumePosition?: { x: number; y: number };

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
    this.buildings = buildStreetBuildings(this);

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

      this.inputMapper = new InputMapper({
        cursors: this.cursors,
        wasd: this.wasd,
        interactKey: this.interactKey
      });

      const onH = () => { if (!this.isPaused) this.onInteract?.(HOBBIES_FEATURE_ID); };
      this.input.keyboard.on('keydown-H', onH);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.input.keyboard?.off('keydown-H', onH);
      });
    }

    // --- UI ---
    this.interactPrompt = createUiText(this, 0, 0, TEXTS.navigation.enter, {
      fontSize: '18px',
      color: '#1a1a1a',
      backgroundColor: '#ffffff',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setVisible(false).setDepth(20);

    this.setPaused(this.isPaused);
  }

  update() {
    if (this.isPaused) {
      this.controller.zeroVelocity();
      return;
    }

    const commands = this.inputMapper?.getCommands(true, true) ?? [];
    const step = this.controller.step(commands);

    this.player.setFlipX(step.facingLeft);
    this.player.setAngle(step.moving ? Math.sin(this.time.now / 100) * 5 : 0);

    updateStreetParticles(this);

    const bldgs = this.buildings.getChildren() as Phaser.GameObjects.Sprite[];
    const slots = bldgs.map((bldg) => ({
      buildingId: bldg.getData('name') as string,
      x: bldg.x,
      y: bldg.y
    }));
    const interact = pickOverworldInteractTarget(this.player.x, this.player.y, slots, {
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
}
