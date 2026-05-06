import * as Phaser from 'phaser';
import { PHASER_SCENE_KEYS } from '@/game/scenes/sceneIds';
import { isItemEquipped } from '@/game/bridge/store';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH,
  OVERWORLD_JUMP_VELOCITY_Y,
  OVERWORLD_PLAYER_GRAVITY_Y,
  OVERWORLD_SPRINT_SPEED,
  OVERWORLD_WALK_SPEED
} from '@/game/sharedSceneRuntime/config';
import {
  createSideViewPlayerRuntime,
  type SideViewPlayerRuntime
} from '@/game/sharedSceneRuntime/player/SideViewPlayerRuntime';
import { TextureGenerator } from '@/game/sharedSceneRuntime/textures/TextureGenerator';

interface RidgeSceneStartData {
  onClose?: () => void;
  isPaused?: boolean;
  resumePosition?: { x: number; y: number };
}

const RIDGE_WORLD_WIDTH = 1800;
const RIDGE_FLOOR_Y = 520;
const RIDGE_PLAYER_START = { x: 120, y: RIDGE_FLOOR_Y - 80 } as const;
const RIDGE_PLAYER_RESUME_CLAMP = {
  minX: 48,
  maxX: RIDGE_WORLD_WIDTH - 48,
  minY: 120,
  maxY: RIDGE_FLOOR_Y - 20
} as const;

export class RidgeScene extends Phaser.Scene {
  player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

  private playerRuntime?: SideViewPlayerRuntime;
  private onClose: () => void = () => {};
  private isPaused = false;
  private resumePosition?: { x: number; y: number };

  constructor() {
    super(PHASER_SCENE_KEYS.ridge);
  }

  init(data: RidgeSceneStartData = {}): void {
    this.onClose = data.onClose ?? (() => {});
    this.isPaused = data.isPaused ?? false;
    this.resumePosition = data.resumePosition;
  }

  preload(): void {
    if (!this.textures.exists('player_idle')) {
      TextureGenerator.generatePlayer(this);
    }
  }

  getResumeCapturePosition(): { x: number; y: number } | null {
    return this.playerRuntime?.captureResume() ?? null;
  }

  setPaused(paused: boolean): void {
    this.isPaused = paused;
    this.playerRuntime?.setPaused(paused);
  }

  create(data: RidgeSceneStartData = {}): void {
    this.onClose = data.onClose ?? this.onClose;

    this.cameras.main.setBackgroundColor('#f7f1df');
    this.physics.world.setBounds(0, 0, RIDGE_WORLD_WIDTH, GAME_DESIGN_HEIGHT);

    const ground = this.createGround();

    this.addRelaySpire();
    this.addTrailMarkers();
    this.addPlaceholderCopy();
    this.createPlayer(ground);
    this.setPaused(this.isPaused);
    this.playerRuntime?.syncAppearance();
  }

  update(): void {
    const playerUpdate = this.playerRuntime?.update();
    if (!playerUpdate || playerUpdate.paused) return;

    if (playerUpdate.commands.exitContext) {
      this.onClose();
    }
  }

  private createGround(): Phaser.GameObjects.Zone {
    this.add.rectangle(
      RIDGE_WORLD_WIDTH / 2,
      GAME_DESIGN_HEIGHT - 42,
      RIDGE_WORLD_WIDTH,
      84,
      0x2f4736,
      1
    );
    this.add.rectangle(
      RIDGE_WORLD_WIDTH / 2,
      GAME_DESIGN_HEIGHT - 88,
      RIDGE_WORLD_WIDTH,
      44,
      0xd7c78f,
      1
    );

    const ground = this.add.zone(RIDGE_WORLD_WIDTH / 2, RIDGE_FLOOR_Y + 24, RIDGE_WORLD_WIDTH, 48);
    this.physics.add.existing(ground, true);
    return ground;
  }

  private createPlayer(ground: Phaser.GameObjects.Zone): void {
    this.playerRuntime = createSideViewPlayerRuntime({
      scene: this,
      start: RIDGE_PLAYER_START,
      resumePosition: this.resumePosition,
      resumeClamp: RIDGE_PLAYER_RESUME_CLAMP,
      sprite: {
        depth: 30,
        gravityY: OVERWORLD_PLAYER_GRAVITY_Y
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
          width: RIDGE_WORLD_WIDTH,
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
    this.physics.add.collider(this.player, ground);
  }

  private addRelaySpire(): void {
    const x = 1510;
    this.add.triangle(x, 205, 0, 180, 46, 0, 92, 180, 0x1c1a18, 0.82);
    this.add.rectangle(x + 46, 330, 34, 250, 0x1c1a18, 0.82);
    this.add.line(x + 46, 205, -80, 35, 80, 35, 0x1c1a18, 0.5).setLineWidth(3);
  }

  private addTrailMarkers(): void {
    const markers = [
      { x: 170, label: 'Cicka perch' },
      { x: 400, label: 'Trail Card' },
      { x: 760, label: 'NPC placeholder' },
      { x: 1280, label: 'Relay view' }
    ];

    markers.forEach((marker) => {
      this.add.circle(marker.x, GAME_DESIGN_HEIGHT - 132, 18, 0x1f1f1d, 0.92);
      this.add.text(marker.x - 58, GAME_DESIGN_HEIGHT - 108, marker.label, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#1f1f1d'
      });
    });
  }

  private addPlaceholderCopy(): void {
    this.add.text(48, 48, 'Sketchbook Ridge', {
      fontFamily: 'monospace',
      fontSize: '34px',
      color: '#1f1f1d'
    });
    this.add.text(50, 94, 'M1 shell placeholder. The old overworld stays default for now.', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#4b4337'
    });
    this.add.text(50, 122, 'Move with arrows/WASD, sprint with Shift, jump with Up, exit with H or Esc.', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#4b4337'
    });
  }
}
