import * as Phaser from 'phaser';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH
} from './config';
import { createUiText } from './text/createUiText';
import { bridgeActions } from '../shared/bridge/store';
import { TextureGenerator } from './textures/TextureGenerator';
import {
  getPotassiumWave,
  isPotassiumBossWave,
  type PotassiumEnemyKind as EnemyKind,
  type PotassiumUpgradeKind as UpgradeKind
} from './potassiumSlipWaves';

type GameState = 'START' | 'PLAYING' | 'WON' | 'GAME_OVER';
type ControlState = 'idle' | 'aiming' | 'recalling';
type EnemySprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
type ProjectileSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
type PickupSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

interface EnemyConfig {
  label: string;
  hp: number;
  score: number;
  speed: number;
  texture: string;
  scale: number;
}

interface UpgradeConfig {
  label: string;
  texture: string;
  color: string;
}

const ARENA = {
  left: 275,
  right: 725,
  top: 0,
  bottom: GAME_DESIGN_HEIGHT,
  width: 450,
  height: GAME_DESIGN_HEIGHT
} as const;

const SAFE = {
  left: ARENA.left + 36,
  right: ARENA.right - 36,
  top: ARENA.top + 84,
  bottom: ARENA.bottom - 96,
  labelTop: ARENA.top + 78
} as const;

const LAUNCH_PAD = {
  x: GAME_DESIGN_WIDTH / 2,
  y: ARENA.bottom - 62,
  radius: 44
} as const;

const LIVES_INITIAL = 5;
const MAIN_BANANA_MAX_SPEED = 760;
const LAUNCH_POWER = 6.2;
const LAUNCH_MAX_DRAG = 130;
const HIT_COOLDOWN_MS = 180;
const RECALL_SPEED = 720;
const RECALL_DAMAGE = 0.65;
const WAVE_ADVANCE_DELAY_MS = 900;
const SIDE_BOUNCE_MARGIN = 32;

const ENEMY_CONFIGS: Record<EnemyKind, EnemyConfig> = {
  intern: {
    label: 'Intern Bug',
    hp: 1,
    score: 1,
    speed: 74,
    texture: 'potassium_enemy_intern',
    scale: 0.92
  },
  scope: {
    label: 'Scope Blob',
    hp: 2,
    score: 2,
    speed: 54,
    texture: 'potassium_enemy_scope',
    scale: 0.95
  },
  meeting: {
    label: 'Meeting Brick',
    hp: 3,
    score: 3,
    speed: 38,
    texture: 'potassium_enemy_meeting',
    scale: 1
  },
  deadline: {
    label: 'Deadline Drone',
    hp: 1,
    score: 2,
    speed: 104,
    texture: 'potassium_enemy_deadline',
    scale: 0.9
  },
  boss: {
    label: 'Potassium Compliance Officer',
    hp: 16,
    score: 12,
    speed: 42,
    texture: 'potassium_enemy_boss',
    scale: 1.16
  }
};

const UPGRADE_CONFIGS: Record<UpgradeKind, UpgradeConfig> = {
  split: {
    label: 'Banana Split',
    texture: 'potassium_pickup_split',
    color: '#facc15'
  },
  poison: {
    label: 'Bruise Cloud',
    texture: 'potassium_pickup_poison',
    color: '#a855f7'
  },
  bomb: {
    label: 'Peel Bomb',
    texture: 'potassium_pickup_bomb',
    color: '#f97316'
  },
  rubber: {
    label: 'Rubber Rind',
    texture: 'potassium_pickup_rubber',
    color: '#38bdf8'
  },
  magnet: {
    label: 'Lunchbox Magnet',
    texture: 'potassium_pickup_magnet',
    color: '#22d3ee'
  }
};

export class PotassiumSlipScene extends Phaser.Scene {
  private banana!: ProjectileSprite;
  private enemies!: Phaser.Physics.Arcade.Group;
  private clones!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private poisonZones!: Phaser.Physics.Arcade.Group;
  private fieldInk!: Phaser.GameObjects.Graphics;
  private aimLine!: Phaser.GameObjects.Graphics;
  private tetherLine!: Phaser.GameObjects.Graphics;

  private gameState: GameState = 'START';
  private controlState: ControlState = 'idle';
  private score: number = 0;
  private lives: number = LIVES_INITIAL;
  private wave: number = 1;
  private waveAdvancing: boolean = false;
  private aimPointerId: number | null = null;
  private nextPoisonDropAt: number = 0;
  private bombArmed: boolean = false;
  private rubberUntil: number = 0;
  private magnetUntil: number = 0;
  private poisonUntil: number = 0;

  private hudText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private activeText!: Phaser.GameObjects.Text;
  private overlayText!: Phaser.GameObjects.Text;
  private subOverlayText!: Phaser.GameObjects.Text;

  private onClose?: () => void;
  private isPaused: boolean = false;

  constructor() {
    super({ key: 'potassium' });
  }

  preload(): void {
    TextureGenerator.generatePotassiumAssets(this);
  }

  init(data: { onClose: () => void; isPaused?: boolean }): void {
    this.onClose = data.onClose;
    this.isPaused = data.isPaused ?? false;
    this.resetRunState();
  }

  create(): void {
    this.createPotassiumTextures();
    this.physics.world.setBounds(ARENA.left, ARENA.top, ARENA.width, ARENA.height);
    this.physics.world.gravity.set(0, 0);
    this.cameras.main.setBackgroundColor('#fbfbf9');

    this.drawField();
    this.createBanana();
    this.enemies = this.physics.add.group();
    this.clones = this.physics.add.group();
    this.pickups = this.physics.add.group();
    this.poisonZones = this.physics.add.group();
    this.aimLine = this.add.graphics().setDepth(950);
    this.tetherLine = this.add.graphics().setDepth(949);
    this.createHud();
    this.createOverlays();
    this.registerCollisions();
    this.registerInput();
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;

    if (this.gameState !== 'PLAYING') {
      this.banana.setVelocity(0, 0);
      return;
    }

    this.updateControlState();
    this.updateBananaDrag(delta);
    this.updateEnemyLabels();
    this.updatePickupLabels();
    this.updateMagnet(time);
    this.updatePoisonTrail(time);
    this.enforceSideWalls();
    this.checkEnemyEscapes();
    this.checkWaveClear();
    this.updateHud();
  }

  private resetRunState(): void {
    this.gameState = 'START';
    this.controlState = 'idle';
    this.score = 0;
    this.lives = LIVES_INITIAL;
    this.wave = 1;
    this.waveAdvancing = false;
    this.aimPointerId = null;
    this.nextPoisonDropAt = 0;
    this.bombArmed = false;
    this.rubberUntil = 0;
    this.magnetUntil = 0;
    this.poisonUntil = 0;
  }

  private createPotassiumTextures(): void {
    if (this.textures.exists('potassium_enemy_intern')) return;

    this.createInternTexture();
    this.createScopeTexture();
    this.createMeetingTexture();
    this.createDeadlineTexture();
    this.createBossTexture();
    this.createPickupTextures();
    this.createPoisonTexture();
  }

  private drawField(): void {
    this.fieldInk = this.add.graphics().setDepth(1);
    this.fieldInk.fillStyle(0xfbfbf9, 1);
    this.fieldInk.fillRect(ARENA.left, ARENA.top, ARENA.width, ARENA.height);
    this.fieldInk.lineStyle(2, 0x1a1a1a, 0.2);
    for (let y = 72; y < ARENA.bottom - 70; y += 48) {
      this.fieldInk.beginPath();
      this.fieldInk.moveTo(ARENA.left + 14, y);
      this.fieldInk.lineTo(ARENA.right - 14, y + Phaser.Math.Between(-2, 2));
      this.fieldInk.strokePath();
    }

    this.fieldInk.lineStyle(4, 0x1a1a1a, 0.85);
    this.fieldInk.beginPath();
    this.fieldInk.moveTo(ARENA.left + 8, ARENA.top);
    this.fieldInk.lineTo(ARENA.left + 8, ARENA.bottom);
    this.fieldInk.moveTo(ARENA.right - 8, ARENA.top);
    this.fieldInk.lineTo(ARENA.right - 8, ARENA.bottom);
    this.fieldInk.strokePath();

    this.fieldInk.fillStyle(0x1a1a1a, 0.04);
    this.fieldInk.fillRect(ARENA.left + 12, ARENA.top, ARENA.width - 24, 78);
    this.fieldInk.fillRect(ARENA.left + 12, ARENA.bottom - 82, ARENA.width - 24, 82);
    this.fieldInk.lineStyle(3, 0x1a1a1a, 0.32);
    this.fieldInk.strokeCircle(LAUNCH_PAD.x, LAUNCH_PAD.y, LAUNCH_PAD.radius);

    createUiText(this, ARENA.left + 22, ARENA.top + 60, 'PANIC LINE', {
      fontSize: '12px',
      color: '#1a1a1a',
      fontStyle: 'bold'
    }).setDepth(20);
  }

  private createBanana(): void {
    this.banana = this.physics.add.sprite(LAUNCH_PAD.x, LAUNCH_PAD.y, 'banana_peel_yellow');
    this.banana.setDepth(100);
    this.banana.setScale(0.9);
    this.banana.setCollideWorldBounds(true);
    this.banana.setBounce(1, 1);
    this.banana.setDrag(12, 12);
    this.banana.body.setAllowGravity(false);
    this.banana.body.setCircle(25, 7, 7);
  }

  private createHud(): void {
    this.hudText = createUiText(this, ARENA.left + 24, ARENA.top + 11, '', {
      fontSize: '12px',
      color: '#1a1a1a',
      fontStyle: 'bold'
    }).setDepth(1000);
    this.scoreText = createUiText(this, GAME_DESIGN_WIDTH / 2, ARENA.top + 11, '', {
      fontSize: '12px',
      color: '#1a1a1a',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(1000);
    this.livesText = createUiText(this, ARENA.right - 24, ARENA.top + 11, '', {
      fontSize: '12px',
      color: '#1a1a1a',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(1000);
    this.activeText = createUiText(this, GAME_DESIGN_WIDTH / 2, ARENA.top + 35, '', {
      fontSize: '11px',
      color: '#1a1a1a',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(1000);
    this.updateHud();
  }

  private createOverlays(): void {
    this.overlayText = createUiText(this, GAME_DESIGN_WIDTH / 2, 245, 'POTASSIUM SLIP', {
      fontSize: '34px',
      color: '#1a1a1a',
      fontStyle: 'bold',
      wordWrap: { width: ARENA.width - 64, useAdvancedWrap: true }
    }).setOrigin(0.5).setDepth(1010);

    this.subOverlayText = createUiText(
      this,
      GAME_DESIGN_WIDTH / 2,
      320,
      'DRAG TOWARD A TARGET. RELEASE BANANA.\nHOLD ANYWHERE TO YO-YO IT HOME.\nCLEAR WAVES. STEAL THE CIRCUIT.',
      {
        fontSize: '14px',
        color: '#1a1a1a',
        align: 'center',
        fontStyle: 'bold',
        wordWrap: { width: ARENA.width - 70, useAdvancedWrap: true }
      }
    ).setOrigin(0.5).setDepth(1010);
  }

  private registerCollisions(): void {
    this.physics.add.overlap(this.banana, this.enemies, (_banana, enemy) => {
      this.hitEnemy(enemy as EnemySprite, this.banana, 'main');
    });
    this.physics.add.overlap(this.clones, this.enemies, (clone, enemy) => {
      const projectile = clone as ProjectileSprite;
      this.hitEnemy(enemy as EnemySprite, projectile, `clone-${projectile.name}`);
    });
    this.physics.add.overlap(this.banana, this.pickups, (_banana, pickup) => {
      this.collectUpgrade(pickup as PickupSprite);
    });
    this.physics.add.overlap(this.poisonZones, this.enemies, (_zone, enemy) => {
      this.damageEnemy(enemy as EnemySprite, 1, 'poison');
    });
  }

  private registerInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gameState === 'START') {
        this.startGame();
        return;
      }
      if (this.gameState === 'WON' || this.gameState === 'GAME_OVER') {
        this.onClose?.();
        return;
      }
      if (this.gameState !== 'PLAYING') return;
      if (this.isBananaInLaunchZone()) {
        this.beginAiming(pointer);
      } else {
        this.beginRecall(pointer);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.aimPointerId !== pointer.id) return;
      if (this.controlState === 'aiming') {
        this.releaseBanana(pointer);
      } else if (this.controlState === 'recalling') {
        this.cancelControl();
      }
    });

    this.input.keyboard?.on('keydown-E', () => {
      if (this.gameState === 'WON' || this.gameState === 'GAME_OVER') {
        this.onClose?.();
      }
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.onClose?.();
    });
  }

  private startGame(): void {
    this.resetRunState();
    this.gameState = 'PLAYING';
    this.overlayText.setVisible(false);
    this.subOverlayText.setVisible(false);
    this.resetBoardObjects();
    bridgeActions.setSceneHintText('Drag toward a target • Hold to recall');
    this.spawnWave(1);
    this.updateHud();
  }

  private resetBoardObjects(): void {
    this.enemies?.clear(true, true);
    this.clones?.clear(true, true);
    this.pickups?.clear(true, true);
    this.poisonZones?.clear(true, true);
    this.banana.setPosition(LAUNCH_PAD.x, LAUNCH_PAD.y);
    this.banana.setVelocity(0, 0);
    this.banana.setAngularVelocity(0);
    this.banana.setTexture('banana_peel_yellow');
    this.banana.setScale(0.9);
    this.aimLine?.clear();
    this.tetherLine?.clear();
  }

  private beginAiming(pointer: Phaser.Input.Pointer): void {
    this.controlState = 'aiming';
    this.aimPointerId = pointer.id;
    this.banana.setPosition(LAUNCH_PAD.x, LAUNCH_PAD.y);
    this.banana.setVelocity(0, 0);
    this.banana.setAngularVelocity(0);
  }

  private beginRecall(pointer: Phaser.Input.Pointer): void {
    this.controlState = 'recalling';
    this.aimPointerId = pointer.id;
  }

  private releaseBanana(pointer: Phaser.Input.Pointer): void {
    const dragVector = new Phaser.Math.Vector2(pointer.x - this.banana.x, pointer.y - this.banana.y);
    const dragLength = Phaser.Math.Clamp(dragVector.length(), 20, LAUNCH_MAX_DRAG);
    if (dragVector.length() < 18) {
      this.cancelControl();
      return;
    }
    const speed = Phaser.Math.Clamp(dragLength * LAUNCH_POWER, 210, this.getMaxBananaSpeed());
    dragVector.normalize();
    this.banana.setVelocity(dragVector.x * speed, dragVector.y * speed);
    this.banana.setAngularVelocity(Phaser.Math.Between(-520, 520));
    this.cancelControl();
  }

  private cancelControl(): void {
    this.controlState = 'idle';
    this.aimPointerId = null;
    this.aimLine.clear();
    this.tetherLine.clear();
  }

  private updateControlState(): void {
    if (this.controlState === 'recalling') {
      this.physics.moveTo(this.banana, LAUNCH_PAD.x, LAUNCH_PAD.y, RECALL_SPEED);
      this.banana.setAngularVelocity(Phaser.Math.Clamp(this.banana.body.velocity.x * 2, -520, 520));
      this.drawRecallTether();
      if (this.isBananaInLaunchZone(34)) {
        this.beginAiming(this.input.activePointer);
      }
      return;
    }

    this.tetherLine.clear();
    this.updateAimingLine();
  }

  private updateAimingLine(): void {
    if (this.controlState !== 'aiming') return;
    const pointer = this.input.activePointer;
    this.aimLine.clear();
    this.drawAimArrow(this.banana.x, this.banana.y, pointer.x, pointer.y);
  }

  private drawAimArrow(fromX: number, fromY: number, toX: number, toY: number): void {
    const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY);
    const distance = Phaser.Math.Distance.Between(fromX, fromY, toX, toY);
    const arrowLength = Phaser.Math.Clamp(distance, 24, LAUNCH_MAX_DRAG);
    const endX = fromX + Math.cos(angle) * arrowLength;
    const endY = fromY + Math.sin(angle) * arrowLength;
    const headLength = 18;
    const wingA = angle + Math.PI * 0.78;
    const wingB = angle - Math.PI * 0.78;

    this.aimLine.lineStyle(7, 0x1a1a1a, 0.9);
    this.aimLine.beginPath();
    this.aimLine.moveTo(fromX, fromY);
    this.aimLine.lineTo(endX, endY);
    this.aimLine.strokePath();

    this.aimLine.lineStyle(4, 0xfacc15, 0.95);
    this.aimLine.beginPath();
    this.aimLine.moveTo(fromX, fromY);
    this.aimLine.lineTo(endX, endY);
    this.aimLine.strokePath();

    this.aimLine.fillStyle(0xfacc15, 0.95);
    this.aimLine.lineStyle(4, 0x1a1a1a, 0.95);
    this.aimLine.beginPath();
    this.aimLine.moveTo(endX, endY);
    this.aimLine.lineTo(endX + Math.cos(wingA) * headLength, endY + Math.sin(wingA) * headLength);
    this.aimLine.lineTo(endX + Math.cos(wingB) * headLength, endY + Math.sin(wingB) * headLength);
    this.aimLine.closePath();
    this.aimLine.fillPath();
    this.aimLine.strokePath();
  }

  private drawRecallTether(): void {
    this.aimLine.clear();
    this.tetherLine.clear();
    this.tetherLine.lineStyle(3, 0x1a1a1a, 0.75);
    this.tetherLine.beginPath();
    this.tetherLine.moveTo(this.banana.x, this.banana.y);
    this.tetherLine.lineTo(LAUNCH_PAD.x, LAUNCH_PAD.y);
    this.tetherLine.strokePath();
  }

  private updateBananaDrag(delta: number): void {
    if (this.controlState === 'aiming' || this.controlState === 'recalling') return;
    const velocity = this.banana.body.velocity;
    const speed = velocity.length();
    if (speed <= 45) {
      this.banana.setVelocity(0, 0);
      this.banana.setAngularVelocity(0);
      return;
    }
    const dragFactor = this.rubberUntil > this.time.now ? 0.9992 : 0.9975;
    const frameFactor = Math.pow(dragFactor, delta / 16.67);
    this.banana.setVelocity(velocity.x * frameFactor, velocity.y * frameFactor);
  }

  private isBananaInLaunchZone(radius: number = LAUNCH_PAD.radius): boolean {
    return Phaser.Math.Distance.Between(this.banana.x, this.banana.y, LAUNCH_PAD.x, LAUNCH_PAD.y) <= radius;
  }

  private getMaxBananaSpeed(): number {
    return this.rubberUntil > this.time.now ? 980 : MAIN_BANANA_MAX_SPEED;
  }

  private spawnWave(waveNumber: number): void {
    this.wave = waveNumber;
    this.waveAdvancing = false;
    this.cancelControl();

    const wave = getPotassiumWave(waveNumber);
    if (isPotassiumBossWave(waveNumber)) {
      this.time.delayedCall(350, () => this.spawnEnemy('boss', 0));
      bridgeActions.setSceneHintText('Boss wave • Stop the audit before it lands');
      return;
    }

    wave.enemies.forEach((kind, index) => {
      this.time.delayedCall(index * 520, () => this.spawnEnemy(kind, index));
    });

    const guaranteedUpgrade = wave.guaranteedUpgrade;
    if (guaranteedUpgrade) {
      this.time.delayedCall(Math.max(650, wave.enemies.length * 420), () => {
        this.spawnUpgrade(LAUNCH_PAD.x, LAUNCH_PAD.y - 122, guaranteedUpgrade);
      });
    }

    bridgeActions.setSceneHintText(`${wave.title}: ${this.getWaveHint(waveNumber)}`);
  }

  private spawnEnemy(kind: EnemyKind, index: number): void {
    if (this.gameState !== 'PLAYING') return;
    const config = ENEMY_CONFIGS[kind];
    const x = Phaser.Math.Linear(ARENA.left + 64, ARENA.right - 64, ((index % 5) + 0.5) / 5);
    const y = kind === 'deadline' ? ARENA.bottom + 34 : SAFE.top + 12;
    const enemy = this.enemies.create(x, y, config.texture) as EnemySprite;
    this.configureEnemy(enemy, kind);

    if (kind === 'deadline') {
      enemy.setVelocity(Phaser.Math.Between(-16, 16), -config.speed);
    } else if (kind === 'boss') {
      enemy.setPosition(LAUNCH_PAD.x, SAFE.top + 60);
      enemy.setVelocity(64, config.speed);
      enemy.setBounce(1, 1);
      this.cameras.main.shake(250, 0.008);
    } else {
      enemy.setVelocity(Phaser.Math.Between(-24, 24), config.speed);
    }
  }

  private configureEnemy(enemy: EnemySprite, kind: EnemyKind): void {
    const config = ENEMY_CONFIGS[kind];
    enemy.setDepth(kind === 'boss' ? 80 : 60);
    enemy.setScale(config.scale);
    enemy.body.setAllowGravity(false);
    enemy.setBounce(1, 1);
    enemy.setData('kind', kind);
    enemy.setData('hp', config.hp);
    enemy.setData('maxHp', config.hp);
    enemy.setData('labelText', this.createEnemyLabel(enemy, config));

    if (kind === 'scope') {
      enemy.setAngularVelocity(Phaser.Math.Between(-70, 70));
    }
    if (kind === 'meeting') {
      enemy.setImmovable(true);
    }
  }

  private createEnemyLabel(enemy: EnemySprite, config: EnemyConfig): Phaser.GameObjects.Text {
    const label = createUiText(this, enemy.x, enemy.y - 34, `${config.label} ${config.hp}/${config.hp}`, {
      fontSize: '9px',
      color: '#1a1a1a',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5).setDepth(900);
    enemy.once(Phaser.GameObjects.Events.DESTROY, () => label.destroy());
    return label;
  }

  private hitEnemy(enemy: EnemySprite, projectile: ProjectileSprite, hitKey: string): void {
    if (this.gameState !== 'PLAYING' || !enemy.active) return;
    const cooldownKey = `hitUntil:${hitKey}`;
    const hitUntil = enemy.getData(cooldownKey) as number | undefined;
    if (hitUntil !== undefined && hitUntil > this.time.now) return;
    enemy.setData(cooldownKey, this.time.now + HIT_COOLDOWN_MS);

    const isMainRecall = projectile === this.banana && this.controlState === 'recalling';
    this.damageEnemy(enemy, isMainRecall ? RECALL_DAMAGE : 1, 'banana');
    projectile.setVelocity(projectile.body.velocity.x * 1.03, projectile.body.velocity.y * 1.03);

    if (this.bombArmed && projectile === this.banana && !isMainRecall) {
      this.bombArmed = false;
      this.explodeAt(enemy.x, enemy.y);
    }
  }

  private damageEnemy(enemy: EnemySprite, amount: number, source: 'banana' | 'poison' | 'explosion'): void {
    if (!enemy.active || enemy.getData('dying')) return;
    if (source === 'poison') {
      const poisonUntil = enemy.getData('poisonTickUntil') as number | undefined;
      if (poisonUntil !== undefined && poisonUntil > this.time.now) return;
      enemy.setData('poisonTickUntil', this.time.now + 620);
    }

    const hp = Math.max(0, (enemy.getData('hp') as number) - amount);
    enemy.setData('hp', hp);
    this.flashEnemy(enemy);
    if (hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  private flashEnemy(enemy: EnemySprite): void {
    this.tweens.add({
      targets: enemy,
      alpha: 0.35,
      duration: 45,
      yoyo: true,
      repeat: 1
    });
  }

  private killEnemy(enemy: EnemySprite): void {
    const kind = enemy.getData('kind') as EnemyKind;
    const config = ENEMY_CONFIGS[kind];
    enemy.setData('dying', true);
    enemy.body.enable = false;
    this.score += config.score;

    this.tweens.add({
      targets: enemy,
      angle: enemy.angle + 720,
      scale: 0,
      alpha: 0,
      duration: 260,
      ease: 'Back.easeIn',
      onComplete: () => {
        enemy.destroy();
        if (kind === 'boss') {
          this.winGame();
        }
      }
    });
  }

  private spawnUpgrade(x: number, y: number, kind: UpgradeKind): void {
    const config = UPGRADE_CONFIGS[kind];
    const pickup = this.pickups.create(x, y, config.texture) as PickupSprite;
    pickup.setDepth(70);
    pickup.setData('kind', kind);
    pickup.body.setAllowGravity(false);
    pickup.setVelocity(Phaser.Math.Between(-35, 35), Phaser.Math.Between(-24, 24));
    pickup.setBounce(1, 1);
    const label = createUiText(this, x, y - 30, config.label, {
      fontSize: '9px',
      color: config.color,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(920);
    pickup.setData('labelText', label);
    pickup.once(Phaser.GameObjects.Events.DESTROY, () => label.destroy());
  }

  private collectUpgrade(pickup: PickupSprite): void {
    if (!pickup.active) return;
    const kind = pickup.getData('kind') as UpgradeKind;
    pickup.destroy();

    if (kind === 'split') {
      this.spawnBananaClones();
    } else if (kind === 'poison') {
      this.poisonUntil = this.time.now + 7600;
      this.nextPoisonDropAt = 0;
    } else if (kind === 'bomb') {
      this.bombArmed = true;
    } else if (kind === 'rubber') {
      this.rubberUntil = this.time.now + 7600;
      this.banana.setVelocity(this.banana.body.velocity.x * 1.2, this.banana.body.velocity.y * 1.2);
    } else if (kind === 'magnet') {
      this.magnetUntil = this.time.now + 7600;
    }
    this.updateHud();
  }

  private spawnBananaClones(): void {
    for (let i = 0; i < 4; i += 1) {
      const clone = this.clones.create(this.banana.x, this.banana.y, 'banana_peel_yellow') as ProjectileSprite;
      clone.name = `${this.time.now}-${i}`;
      clone.setDepth(90);
      clone.setScale(0.48);
      clone.setAlpha(0.82);
      clone.setBounce(1, 1);
      clone.body.setAllowGravity(false);
      clone.body.setCircle(16, 16, 16);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      clone.setVelocity(Math.cos(angle) * 430, Math.sin(angle) * 430);
      clone.setAngularVelocity(Phaser.Math.Between(-600, 600));
      this.time.delayedCall(5200, () => {
        if (!clone.active) return;
        this.tweens.add({
          targets: clone,
          alpha: 0,
          scale: 0,
          duration: 240,
          onComplete: () => clone.destroy()
        });
      });
    }
  }

  private updatePoisonTrail(time: number): void {
    if (this.poisonUntil <= time || time < this.nextPoisonDropAt || this.banana.body.velocity.length() < 120) return;
    this.nextPoisonDropAt = time + 320;
    const zone = this.poisonZones.create(this.banana.x, this.banana.y, 'potassium_poison') as ProjectileSprite;
    zone.setDepth(30);
    zone.setAlpha(0.55);
    zone.setScale(0.72);
    zone.body.setAllowGravity(false);
    zone.body.setImmovable(true);
    zone.setVelocity(0, 0);
    this.time.delayedCall(2200, () => {
      if (!zone.active) return;
      this.tweens.add({
        targets: zone,
        alpha: 0,
        duration: 220,
        onComplete: () => zone.destroy()
      });
    });
  }

  private explodeAt(x: number, y: number): void {
    const blast = this.add.circle(x, y, 18, 0xf97316, 0.22)
      .setStrokeStyle(5, 0x1a1a1a, 1)
      .setDepth(940);
    this.tweens.add({
      targets: blast,
      radius: 88,
      alpha: 0,
      duration: 240,
      onComplete: () => blast.destroy()
    });
    this.enemies.getChildren().forEach((gameObject) => {
      const enemy = gameObject as EnemySprite;
      if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= 92) {
        this.damageEnemy(enemy, 2, 'explosion');
      }
    });
    this.cameras.main.shake(130, 0.006);
  }

  private updateMagnet(time: number): void {
    if (this.magnetUntil <= time) return;
    this.pickups.getChildren().forEach((gameObject) => {
      const pickup = gameObject as PickupSprite;
      const dist = Phaser.Math.Distance.Between(pickup.x, pickup.y, this.banana.x, this.banana.y);
      if (dist < 260) {
        this.physics.moveToObject(pickup, this.banana, 165);
      }
    });
  }

  private enforceSideWalls(): void {
    this.enemies.getChildren().forEach((gameObject) => {
      this.bounceObjectInsideArena(gameObject as ProjectileSprite, SIDE_BOUNCE_MARGIN);
    });
    this.pickups.getChildren().forEach((gameObject) => {
      this.bounceObjectInsideArena(gameObject as ProjectileSprite, SIDE_BOUNCE_MARGIN);
    });
    this.clones.getChildren().forEach((gameObject) => {
      this.bounceObjectInsideArena(gameObject as ProjectileSprite, SIDE_BOUNCE_MARGIN);
    });
  }

  private bounceObjectInsideArena(object: ProjectileSprite, margin: number): void {
    if (!object.active || !object.body) return;
    const minX = ARENA.left + margin;
    const maxX = ARENA.right - margin;
    const velocity = object.body.velocity;
    if (object.x < minX) {
      object.setX(minX);
      object.setVelocityX(Math.abs(velocity.x) || 40);
    } else if (object.x > maxX) {
      object.setX(maxX);
      object.setVelocityX(-Math.abs(velocity.x) || -40);
    }
  }

  private checkEnemyEscapes(): void {
    this.enemies.getChildren().forEach((gameObject) => {
      const enemy = gameObject as EnemySprite;
      const kind = enemy.getData('kind') as EnemyKind;
      if (kind === 'boss') {
        if (enemy.y > ARENA.bottom + 45) {
          this.handleBossEscape(enemy);
        }
        return;
      }
      const escaped = kind === 'deadline'
        ? enemy.y < ARENA.top - 45
        : enemy.y > ARENA.bottom + 45;
      if (escaped) {
        this.handleEnemyEscape(enemy);
      }
    });
  }

  private handleBossEscape(enemy: EnemySprite): void {
    enemy.destroy();
    this.lives = 0;
    this.cameras.main.shake(320, 0.014);
    this.gameOver();
  }

  private handleEnemyEscape(enemy: EnemySprite): void {
    enemy.destroy();
    this.lives -= 1;
    this.cameras.main.shake(180, 0.008);
    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  private checkWaveClear(): void {
    if (this.waveAdvancing || this.gameState !== 'PLAYING' || isPotassiumBossWave(this.wave)) return;
    const hasLivingEnemies = this.enemies.getChildren().some((gameObject) => {
      const enemy = gameObject as EnemySprite;
      return enemy.active && !enemy.getData('dying');
    });
    if (hasLivingEnemies) return;
    this.waveAdvancing = true;
    bridgeActions.setSceneHintText('Wave clear • Banana paperwork reloads');
    this.time.delayedCall(WAVE_ADVANCE_DELAY_MS, () => {
      if (this.gameState === 'PLAYING') {
        this.spawnWave(this.wave + 1);
      }
    });
  }

  private updateEnemyLabels(): void {
    this.enemies.getChildren().forEach((gameObject) => {
      const enemy = gameObject as EnemySprite;
      const label = enemy.getData('labelText') as Phaser.GameObjects.Text | undefined;
      if (!label) return;
      const kind = enemy.getData('kind') as EnemyKind;
      const hp = Math.ceil(enemy.getData('hp') as number);
      const maxHp = enemy.getData('maxHp') as number;
      label.setText(kind === 'boss' ? `${hp}/${maxHp}` : this.getShortEnemyLabel(kind, hp, maxHp));
      this.positionFloatingLabel(label, enemy.x, enemy.y - 34 * enemy.scale);
    });
  }

  private updatePickupLabels(): void {
    this.pickups.getChildren().forEach((gameObject) => {
      const pickup = gameObject as PickupSprite;
      const label = pickup.getData('labelText') as Phaser.GameObjects.Text | undefined;
      if (label) {
        this.positionFloatingLabel(label, pickup.x, pickup.y - 30);
      }
    });
  }

  private updateHud(): void {
    const wave = getPotassiumWave(this.wave);
    this.hudText?.setText(`W${this.wave} ${wave.title}`);
    this.scoreText?.setText(`Score ${this.score}`);
    this.livesText?.setText(`Lives ${this.lives}`);
    this.activeText?.setText(this.getActiveUpgradeText());
  }

  private getShortEnemyLabel(kind: EnemyKind, hp: number, maxHp: number): string {
    if (kind === 'intern') return `${hp}/${maxHp}`;
    if (kind === 'scope') return `Blob ${hp}/${maxHp}`;
    if (kind === 'meeting') return `Brick ${hp}/${maxHp}`;
    if (kind === 'deadline') return `Due ${hp}/${maxHp}`;
    return `${hp}/${maxHp}`;
  }

  private positionFloatingLabel(label: Phaser.GameObjects.Text, x: number, y: number): void {
    label.setPosition(
      Phaser.Math.Clamp(x, SAFE.left, SAFE.right),
      Phaser.Math.Clamp(y, SAFE.labelTop, SAFE.bottom)
    );
  }

  private getActiveUpgradeText(): string {
    const active: string[] = [];
    if (this.bombArmed) active.push('bomb');
    if (this.poisonUntil > this.time.now) active.push('bruise');
    if (this.rubberUntil > this.time.now) active.push('rubber');
    if (this.magnetUntil > this.time.now) active.push('magnet');
    return active.length > 0 ? active.join(' + ') : 'yo-yo ready';
  }

  private getWaveHint(wave: number): string {
    if (wave === 1) return 'launch and bounce';
    if (wave === 2) return 'multi-hit blobs';
    if (wave === 3) return 'grab split';
    if (wave === 4) return 'bomb bricks';
    if (wave === 5) return 'poison deadlines';
    if (wave === 6) return 'rubber chaos';
    if (wave === 7) return 'magnet pickups';
    return 'boss time';
  }

  private winGame(): void {
    this.gameState = 'WON';
    this.banana.setVelocity(0, 0);
    this.enemies.clear(true, true);
    this.clones.clear(true, true);
    this.pickups.clear(true, true);
    this.poisonZones.clear(true, true);
    bridgeActions.collectItem('circuit');
    bridgeActions.setSceneHintText(null);
    this.overlayText.setFontSize(28).setText('CIRCUIT ACQUIRED').setPosition(GAME_DESIGN_WIDTH / 2, 255).setVisible(true);
    this.subOverlayText.setFontSize(15).setText(`Final Score: ${this.score}\n[E] RETURN TO CITY`).setPosition(GAME_DESIGN_WIDTH / 2, 320).setVisible(true);
  }

  private gameOver(): void {
    this.gameState = 'GAME_OVER';
    this.enemies.clear(true, true);
    this.clones.clear(true, true);
    this.pickups.clear(true, true);
    this.poisonZones.clear(true, true);
    this.banana.setVelocity(0, 0);
    bridgeActions.setSceneHintText(null);
    this.overlayText.setFontSize(26).setText('BANANA BANKRUPTCY').setPosition(GAME_DESIGN_WIDTH / 2, 255).setVisible(true);
    this.subOverlayText.setFontSize(15).setText(`Final Score: ${this.score}\n[E] RETURN TO CITY`).setPosition(GAME_DESIGN_WIDTH / 2, 320).setVisible(true);
  }

  private createInternTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.lineStyle(3, 0x1a1a1a, 1);
    g.fillStyle(0xfacc15, 0.95);
    g.fillEllipse(24, 24, 30, 24);
    g.strokeEllipse(24, 24, 30, 24);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(18, 20, 2);
    g.fillCircle(30, 20, 2);
    for (let i = 0; i < 3; i += 1) {
      g.beginPath();
      g.moveTo(13 + i * 9, 32);
      g.lineTo(8 + i * 9, 40);
      g.moveTo(18 + i * 9, 32);
      g.lineTo(22 + i * 9, 40);
      g.strokePath();
    }
    g.generateTexture('potassium_enemy_intern', 48, 46);
    g.destroy();
  }

  private createScopeTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xa855f7, 0.85);
    g.lineStyle(4, 0x1a1a1a, 1);
    g.beginPath();
    g.moveTo(34, 8);
    g.lineTo(54, 14);
    g.lineTo(61, 34);
    g.lineTo(50, 56);
    g.lineTo(28, 58);
    g.lineTo(8, 46);
    g.lineTo(10, 24);
    g.lineTo(22, 10);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(28, 30, 8);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(30, 30, 3);
    g.generateTexture('potassium_enemy_scope', 68, 64);
    g.destroy();
  }

  private createMeetingTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xe5e7eb, 1);
    g.lineStyle(5, 0x1a1a1a, 1);
    g.fillRoundedRect(4, 8, 70, 44, 4);
    g.strokeRoundedRect(4, 8, 70, 44, 4);
    g.lineStyle(2, 0x1a1a1a, 0.55);
    g.beginPath();
    g.moveTo(14, 22);
    g.lineTo(64, 22);
    g.moveTo(14, 34);
    g.lineTo(52, 34);
    g.strokePath();
    g.generateTexture('potassium_enemy_meeting', 78, 60);
    g.destroy();
  }

  private createDeadlineTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xf97316, 0.9);
    g.lineStyle(4, 0x1a1a1a, 1);
    g.beginPath();
    g.moveTo(28, 4);
    g.lineTo(54, 46);
    g.lineTo(28, 34);
    g.lineTo(2, 46);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.lineStyle(3, 0x1a1a1a, 0.8);
    g.beginPath();
    g.moveTo(28, 34);
    g.lineTo(28, 58);
    g.strokePath();
    g.generateTexture('potassium_enemy_deadline', 56, 62);
    g.destroy();
  }

  private createBossTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 1);
    g.lineStyle(6, 0x1a1a1a, 1);
    g.fillRoundedRect(4, 10, 116, 70, 10);
    g.strokeRoundedRect(4, 10, 116, 70, 10);
    g.lineStyle(3, 0x1a1a1a, 0.55);
    g.strokeCircle(34, 44, 14);
    g.strokeCircle(88, 44, 14);
    g.beginPath();
    g.moveTo(45, 62);
    g.lineTo(80, 62);
    g.strokePath();
    g.fillStyle(0xfacc15, 0.5);
    g.fillRect(12, 16, 100, 12);
    g.generateTexture('potassium_enemy_boss', 124, 90);
    g.destroy();
  }

  private createPickupTextures(): void {
    this.createPickupTexture('potassium_pickup_split', 0xfacc15, 'split');
    this.createPickupTexture('potassium_pickup_poison', 0xa855f7, 'poison');
    this.createPickupTexture('potassium_pickup_bomb', 0xf97316, 'bomb');
    this.createPickupTexture('potassium_pickup_rubber', 0x38bdf8, 'rubber');
    this.createPickupTexture('potassium_pickup_magnet', 0x22d3ee, 'magnet');
  }

  private createPickupTexture(key: string, color: number, kind: UpgradeKind): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(color, 0.9);
    g.lineStyle(4, 0x1a1a1a, 1);
    if (kind === 'rubber') {
      g.strokeCircle(24, 24, 18);
      g.strokeCircle(24, 24, 9);
    } else if (kind === 'magnet') {
      g.strokeRoundedRect(10, 8, 28, 32, 12);
      g.fillRect(8, 30, 12, 10);
      g.fillRect(30, 30, 12, 10);
    } else if (kind === 'bomb') {
      g.fillCircle(24, 26, 16);
      g.strokeCircle(24, 26, 16);
      g.beginPath();
      g.moveTo(32, 12);
      g.lineTo(40, 4);
      g.strokePath();
    } else if (kind === 'poison') {
      g.fillEllipse(24, 28, 34, 20);
      g.strokeEllipse(24, 28, 34, 20);
      g.fillCircle(17, 18, 5);
      g.fillCircle(31, 16, 4);
    } else {
      g.fillCircle(18, 24, 9);
      g.fillCircle(30, 18, 8);
      g.fillCircle(31, 31, 7);
      g.strokeCircle(18, 24, 9);
      g.strokeCircle(30, 18, 8);
      g.strokeCircle(31, 31, 7);
    }
    g.generateTexture(key, 48, 48);
    g.destroy();
  }

  private createPoisonTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xa855f7, 0.38);
    g.lineStyle(3, 0x1a1a1a, 0.45);
    g.fillEllipse(30, 18, 56, 24);
    g.strokeEllipse(30, 18, 56, 24);
    g.generateTexture('potassium_poison', 60, 36);
    g.destroy();
  }

  setPaused(paused: boolean): void {
    this.isPaused = paused;
    if (paused) {
      this.physics.world.pause();
      this.time.paused = true;
      this.tweens.pauseAll();
    } else {
      this.physics.world.resume();
      this.time.paused = false;
      this.tweens.resumeAll();
    }
  }

  getResumeCapturePosition(): { x: number; y: number } | null {
    return null;
  }
}
