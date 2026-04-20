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
import { bridgeActions, bridgeStore } from '../shared/bridge/store';
import { PlayerController } from '../core/player/PlayerController';
import {
  buildStreetEnvironment,
  buildStreetForeground,
  setupStreetCamera
} from './street/StreetEnvironment';
import { buildStreetBuildings } from './street/StreetBuildings';
import { updateStreetParticles } from './street/StreetParticles';

export class OverworldScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!: { a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
  interactKey!: Phaser.Input.Keyboard.Key;
  buildings!: Phaser.GameObjects.Group;
  interactPrompt!: Phaser.GameObjects.Text;

  private controller!: PlayerController;
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

      const onH = () => { if (!this.isPaused) this.onInteract?.(HOBBIES_FEATURE_ID); };
      this.input.keyboard.on('keydown-H', onH);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.input.keyboard?.off('keydown-H', onH);
      });
    }

    // --- UI ---
    this.interactPrompt = this.add.text(0, 0, TEXTS.navigation.enter, {
      fontFamily: '"Comic Sans MS", cursive, sans-serif',
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

    const touchState = bridgeStore.getState().touch;
    const oneShots = bridgeActions.consumeTouchOneShots();

    const step = this.controller.step({
      left: this.cursors.left.isDown || this.wasd.a.isDown || touchState.left,
      right: this.cursors.right.isDown || this.wasd.d.isDown || touchState.right,
      sprint: this.cursors.shift.isDown,
      jump: this.cursors.up.isDown || oneShots.jumpQueued,
      interact: Phaser.Input.Keyboard.JustDown(this.interactKey) || oneShots.interactTap
    });

    this.player.setFlipX(step.facingLeft);
    this.player.setAngle(step.moving ? Math.sin(this.time.now / 100) * 5 : 0);

    updateStreetParticles(this);

    // Interaction check
    let canInteractWith: string | null = null;
    let interactPos: { x: number; y: number } | null = null;

    const bldgs = this.buildings.getChildren() as Phaser.GameObjects.Sprite[];
    for (const bldg of bldgs) {
      const dist = Math.abs(this.player.x - bldg.x);
      if (dist < OVERWORLD_INTERACT_DISTANCE_X && this.player.y > OVERWORLD_INTERACT_MIN_PLAYER_Y) {
        canInteractWith = bldg.getData('name');
        interactPos = { x: bldg.x, y: bldg.y + OVERWORLD_INTERACT_PROMPT_OFFSET_Y };
        break;
      }
    }

    if (canInteractWith && interactPos) {
      this.interactPrompt.setPosition(interactPos.x, interactPos.y).setVisible(true);
      if (step.interactRequested) {
        this.onInteract?.(canInteractWith);
      }
    } else {
      this.interactPrompt.setVisible(false);
    }
  }
}
