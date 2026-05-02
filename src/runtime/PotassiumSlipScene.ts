import * as Phaser from 'phaser';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH
} from './config';
import { createUiText, snapUiTextCoordinate } from './text/createUiText';
import { bridgeActions } from '../shared/bridge/store';
import { TextureGenerator } from './textures/TextureGenerator';
import {
  applyPotassiumDraftOption,
  applyPotassiumGenericDraftOption,
  getPotassiumDraftChoices,
  getPotassiumDuplicateCloneCount,
  getPotassiumExplosionDamage,
  getPotassiumGenericUpgradeRank,
  getPotassiumScaledExplosionRadius,
  getPotassiumSkillRank,
  getPotassiumWave,
  getScaledPotassiumEnemyHp,
  isPotassiumBossWave,
  POTASSIUM_COLUMN_COUNT,
  type PotassiumDraftOption as DraftOption,
  type PotassiumGenericDraftOption as GenericDraftOption,
  type PotassiumGenericUpgradeKind as GenericUpgradeKind,
  type PotassiumGenericUpgradeRanks as GenericRanks,
  type PotassiumSkillRanks as SkillRanks,
  type PotassiumSkillRank as SkillRank,
  type PotassiumWaveCell as WaveCell,
  type PotassiumEnemyKind as EnemyKind,
  type PotassiumUpgradeKind as UpgradeKind
} from './potassiumSlipWaves';
import {
  getPotassiumLeaderboardTop,
  savePotassiumRunRecord,
  type PotassiumRunMode as RunMode,
  type PotassiumRunOutcome as RunOutcome
} from './potassiumSlipLeaderboard';

type GameState = 'START' | 'PLAYING' | 'UPGRADE' | 'WON' | 'GAME_OVER';
type ControlState = 'idle' | 'aiming' | 'recalling';
type TerminalAction = 'retry' | 'return' | 'endless';
type EnemySprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
type ProjectileSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

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
  color: string;
  description: string;
}

interface UpgradeChoiceButton {
  option: DraftOption;
  panel: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  description: Phaser.GameObjects.Text;
}

interface TerminalButton {
  action: TerminalAction;
  panel: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
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
const BANANA_RICOCHET_MIN_SPEED = 360;
const BANANA_RICOCHET_BOOST = 1.08;
const CLONE_RICOCHET_MAX_SPEED = 660;
const NON_BOSS_ENEMY_SPEED = 64;
const ROW_SPAWN_DELAY_MS = 900;
const TRAIL_DROP_INTERVAL_MS = 180;
const FIRE_TRAIL_LIFETIME_MS = 1500;
const FIRE_TICK_COOLDOWN_MS = 420;
const POISON_TICK_INTERVAL_MS = 500;
const POISON_DURATION_MS = 2500;
const DUPLICATE_CLONE_LIFETIME_MS = 3000;
const GHOST_BEAM_LIFETIME_MS = 190;
const GHOST_STATUS_FIELD_LIFETIME_MS = 680;
const UPGRADE_CHOICE_DELAY_MS = 450;
const POISON_TINT = 0x65a30d;
const CLONE_EFFECT_MULTIPLIER = 0.5;
const FIRE_HIT_PATCH_LIFETIME_MS = 900;
const POISON_DEATH_SPREAD_RADIUS = 76;
const POISON_UPGRADED_DAMAGE_MULTIPLIER = 1.25;

const GENERIC_UPGRADE_CONFIGS: Record<GenericUpgradeKind, UpgradeConfig> = {
  damage: {
    label: 'Damage +',
    color: '#1a1a1a',
    description: '+12% banana and beam damage.'
  },
  poison: {
    label: 'Poison +',
    color: '#65a30d',
    description: '+10% poison tick strength.'
  },
  explosion: {
    label: 'Explosion +',
    color: '#ef4444',
    description: '+6% blast radius.'
  },
  cloneTime: {
    label: 'Clone Time +',
    color: '#facc15',
    description: '+300ms clone lifetime.'
  },
  bananaSpeed: {
    label: 'Banana Speed +',
    color: '#38bdf8',
    description: '+5% launch speed.'
  },
  bonusLife: {
    label: 'Bonus Life',
    color: '#a855f7',
    description: '+1 life right now.'
  }
};

const ENEMY_CONFIGS: Record<EnemyKind, EnemyConfig> = {
  intern: {
    label: 'Intern Bug',
    hp: 2,
    score: 1,
    speed: 74,
    texture: 'potassium_enemy_intern',
    scale: 0.92
  },
  scope: {
    label: 'Scope Blob',
    hp: 4,
    score: 2,
    speed: 54,
    texture: 'potassium_enemy_scope',
    scale: 0.95
  },
  meeting: {
    label: 'Meeting Brick',
    hp: 6,
    score: 3,
    speed: 38,
    texture: 'potassium_enemy_meeting',
    scale: 1
  },
  deadline: {
    label: 'Deadline Drone',
    hp: 3,
    score: 2,
    speed: 104,
    texture: 'potassium_enemy_deadline',
    scale: 0.9
  },
  wall: {
    label: 'Filing Wall',
    hp: 14,
    score: 4,
    speed: 30,
    texture: 'potassium_enemy_wall',
    scale: 0.78
  },
  boss: {
    label: 'Potassium Compliance Officer',
    hp: 34,
    score: 12,
    speed: 34,
    texture: 'potassium_enemy_boss',
    scale: 0.72
  }
};

const UPGRADE_CONFIGS: Record<UpgradeKind, UpgradeConfig> = {
  fire: {
    label: 'Fire Trail',
    color: '#f97316',
    description: 'Moving bananas leave hot nonsense.'
  },
  poison: {
    label: 'Poison Damage',
    color: '#a855f7',
    description: 'Hits tick for 1 dmg every 500ms.'
  },
  explosion: {
    label: 'Explosion Damage',
    color: '#ef4444',
    description: 'Every hit pops nearby paperwork.'
  },
  duplicate: {
    label: 'Duplicate',
    color: '#facc15',
    description: 'Main hits spawn two tiny bananas.'
  },
  ghostHorizontal: {
    label: 'Horizontal Ghost',
    color: '#38bdf8',
    description: 'Hits sweep a blue row beam.'
  },
  ghostVertical: {
    label: 'Vertical Ghost',
    color: '#60a5fa',
    description: 'Hits sweep a blue column beam.'
  }
};

function isGenericDraftOption(option: DraftOption): option is GenericDraftOption {
  return option.type === 'generic';
}

function getDraftOptionDescription(option: DraftOption): string {
  if (isGenericDraftOption(option)) return GENERIC_UPGRADE_CONFIGS[option.kind].description;
  if (option.kind === 'fire') {
    return option.action === 'unlock'
      ? 'Moving bananas leave fire.'
      : 'Hits drop extra fire patches.';
  }
  if (option.kind === 'poison') {
    return option.action === 'unlock'
      ? 'Hits poison enemies over time.'
      : 'Poisoned enemies spread on death.';
  }
  if (option.kind === 'explosion') {
    return option.action === 'unlock'
      ? 'Hits explode with falloff damage.'
      : 'Bigger blasts apply statuses.';
  }
  if (option.kind === 'duplicate') {
    return option.action === 'unlock'
      ? 'Main hits spawn 2 small bananas.'
      : 'Clones apply half-strength procs and spawn +1.';
  }
  if (option.kind === 'ghostHorizontal') {
    return option.action === 'unlock'
      ? 'Hits fire a blue row beam.'
      : 'Row beams apply statuses.';
  }
  return option.action === 'unlock'
    ? 'Hits fire a blue column beam.'
    : 'Column beams apply statuses.';
}

function getDraftOptionTitle(option: DraftOption): string {
  if (isGenericDraftOption(option)) return GENERIC_UPGRADE_CONFIGS[option.kind].label;
  const label = UPGRADE_CONFIGS[option.kind].label;
  return option.action === 'upgrade' ? `${label} +` : label;
}

export class PotassiumSlipScene extends Phaser.Scene {
  private banana!: ProjectileSprite;
  private enemies!: Phaser.Physics.Arcade.Group;
  private clones!: Phaser.Physics.Arcade.Group;
  private trailZones!: Phaser.Physics.Arcade.Group;
  private fieldInk!: Phaser.GameObjects.Graphics;
  private aimLine!: Phaser.GameObjects.Graphics;
  private tetherLine!: Phaser.GameObjects.Graphics;

  private gameState: GameState = 'START';
  private controlState: ControlState = 'idle';
  private score: number = 0;
  private lives: number = LIVES_INITIAL;
  private wave: number = 1;
  private waveAdvancing: boolean = false;
  private pendingRows: number = 0;
  private aimPointerId: number | null = null;
  private skillRanks: SkillRanks = {};
  private genericRanks: GenericRanks = {};
  private runMode: RunMode = 'campaign';
  private runRecordCompletedAt?: string;
  private upgradeChoiceButtons: UpgradeChoiceButton[] = [];
  private upgradeChoiceBackdrop?: Phaser.GameObjects.Rectangle;
  private upgradeChoiceTitle?: Phaser.GameObjects.Text;
  private terminalButtons: TerminalButton[] = [];
  private recordsText?: Phaser.GameObjects.Text;

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
    this.trailZones = this.physics.add.group();
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
    this.updatePoisonStatuses(time);
    this.updateFireTrail(time);
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
    this.pendingRows = 0;
    this.aimPointerId = null;
    this.skillRanks = {};
    this.genericRanks = {};
    this.runMode = 'campaign';
    this.runRecordCompletedAt = undefined;
  }

  private createPotassiumTextures(): void {
    if (this.textures.exists('potassium_enemy_intern')) return;

    this.createInternTexture();
    this.createScopeTexture();
    this.createMeetingTexture();
    this.createDeadlineTexture();
    this.createWallTexture();
    this.createBossTexture();
    this.createFireTexture();
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

    createUiText(this, ARENA.left + 22, ARENA.top + 68, 'PANIC LINE', {
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
    this.banana.setData('canDuplicate', true);
    this.banana.setData('effectMultiplier', 1);
    this.banana.setData('canApplyHitProcs', true);
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
      fontSize: '32px',
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
    this.physics.add.overlap(this.trailZones, this.enemies, (_zone, enemy) => {
      this.damageEnemy(enemy as EnemySprite, this.getProjectileEffectMultiplier(_zone as ProjectileSprite), 'fire');
    });
  }

  private registerInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gameState === 'UPGRADE') {
        this.handleUpgradeChoicePointer(pointer);
        return;
      }
      if (this.gameState === 'START') {
        this.startGame();
        return;
      }
      if (this.gameState === 'WON' || this.gameState === 'GAME_OVER') {
        this.handleTerminalPointer(pointer);
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

    this.input.keyboard?.on('keydown-R', () => {
      if (this.gameState === 'WON' || this.gameState === 'GAME_OVER') {
        this.startGame();
      }
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.gameState === 'WON') {
        this.startEndlessMode();
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
    this.clearTerminalOverlay();
    this.resetBoardObjects();
    bridgeActions.setSceneHintText('Drag toward a target • Hold to recall');
    this.spawnWave(1);
    this.updateHud();
  }

  private startEndlessMode(): void {
    if (this.gameState !== 'WON') return;
    this.runMode = 'endless';
    this.gameState = 'PLAYING';
    this.waveAdvancing = false;
    this.pendingRows = 0;
    this.overlayText.setVisible(false);
    this.subOverlayText.setVisible(false);
    this.clearTerminalOverlay();
    this.resetBoardObjects();
    bridgeActions.setSceneHintText('Endless audit • The nonsense keeps filing');
    this.spawnWave(12);
    this.updateHud();
  }

  private resetBoardObjects(): void {
    this.enemies?.clear(true, true);
    this.clones?.clear(true, true);
    this.trailZones?.clear(true, true);
    this.banana.setPosition(LAUNCH_PAD.x, LAUNCH_PAD.y);
    this.banana.setVelocity(0, 0);
    this.banana.setAngularVelocity(0);
    this.banana.setTexture('banana_peel_yellow');
    this.banana.clearTint();
    this.banana.setScale(0.9);
    this.banana.setData('canDuplicate', true);
    this.banana.setData('nextTrailDropAt', 0);
    this.banana.setData('effectMultiplier', 1);
    this.banana.setData('canApplyHitProcs', true);
    this.aimLine?.clear();
    this.tetherLine?.clear();
    this.clearUpgradeChoiceOverlay();
    this.clearTerminalOverlay();
  }

  private beginAiming(pointer: Phaser.Input.Pointer): void {
    this.controlState = 'aiming';
    this.aimPointerId = pointer.id;
    this.banana.setPosition(LAUNCH_PAD.x, LAUNCH_PAD.y);
    this.banana.setVelocity(0, 0);
    this.banana.setAngularVelocity(0);
    this.banana.setData('canDuplicate', true);
    this.banana.setData('nextTrailDropAt', 0);
    this.banana.setData('effectMultiplier', 1);
    this.banana.setData('canApplyHitProcs', true);
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
    const dragFactor = 0.9975;
    const frameFactor = Math.pow(dragFactor, delta / 16.67);
    this.banana.setVelocity(velocity.x * frameFactor, velocity.y * frameFactor);
  }

  private isBananaInLaunchZone(radius: number = LAUNCH_PAD.radius): boolean {
    return Phaser.Math.Distance.Between(this.banana.x, this.banana.y, LAUNCH_PAD.x, LAUNCH_PAD.y) <= radius;
  }

  private getMaxBananaSpeed(): number {
    return MAIN_BANANA_MAX_SPEED * (1 + this.getGenericRank('bananaSpeed') * 0.05);
  }

  private getSkillRank(upgrade: UpgradeKind): SkillRank {
    return getPotassiumSkillRank(this.skillRanks, upgrade);
  }

  private getGenericRank(upgrade: GenericUpgradeKind): number {
    return getPotassiumGenericUpgradeRank(this.genericRanks, upgrade);
  }

  private getDamageMultiplier(): number {
    return 1 + this.getGenericRank('damage') * 0.12;
  }

  private getPoisonGenericMultiplier(): number {
    return 1 + this.getGenericRank('poison') * 0.1;
  }

  private getExplosionRadiusMultiplier(): number {
    return 1 + this.getGenericRank('explosion') * 0.06;
  }

  private getCloneLifetimeMs(): number {
    return DUPLICATE_CLONE_LIFETIME_MS + this.getGenericRank('cloneTime') * 300;
  }

  private getProjectileEffectMultiplier(projectile: ProjectileSprite): number {
    return (projectile.getData('effectMultiplier') as number | undefined) ?? 1;
  }

  private canProjectileApplyHitProcs(projectile: ProjectileSprite): boolean {
    return (projectile.getData('canApplyHitProcs') as boolean | undefined) ?? false;
  }

  private getProjectileExplosionRadiusMultiplier(projectile: ProjectileSprite): number {
    return projectile === this.banana ? 1 : CLONE_EFFECT_MULTIPLIER;
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

    this.pendingRows = wave.rows.length;
    wave.rows.forEach((row, rowIndex) => {
      this.time.delayedCall(rowIndex * ROW_SPAWN_DELAY_MS, () => this.spawnEnemyRow(row));
    });
    bridgeActions.setSceneHintText(`${wave.title}: ${this.getWaveHint(waveNumber)}`);
  }

  private spawnEnemyRow(row: readonly WaveCell[]): void {
    if (this.gameState !== 'PLAYING') return;
    this.pendingRows = Math.max(0, this.pendingRows - 1);
    row.forEach((kind, columnIndex) => {
      if (kind === null) return;
      this.spawnEnemy(kind, columnIndex);
    });
  }

  private spawnEnemy(kind: EnemyKind, columnIndex: number = 0): void {
    if (this.gameState !== 'PLAYING') return;
    const config = ENEMY_CONFIGS[kind];
    const x = Phaser.Math.Linear(ARENA.left + 64, ARENA.right - 64, (columnIndex + 0.5) / POTASSIUM_COLUMN_COUNT);
    const y = kind === 'boss' ? SAFE.top + 60 : SAFE.top + 12;
    const enemy = this.enemies.create(x, y, config.texture) as EnemySprite;
    this.configureEnemy(enemy, kind, this.wave);

    if (kind === 'boss') {
      enemy.setPosition(LAUNCH_PAD.x, SAFE.top + 60);
      enemy.setVelocity(64, config.speed);
      enemy.setBounce(1, 1);
      this.cameras.main.shake(250, 0.008);
    } else {
      enemy.setVelocity(0, NON_BOSS_ENEMY_SPEED);
    }
  }

  private configureEnemy(enemy: EnemySprite, kind: EnemyKind, wave: number): void {
    const config = ENEMY_CONFIGS[kind];
    const hp = kind === 'boss' ? config.hp : getScaledPotassiumEnemyHp(config.hp, wave);
    enemy.setDepth(kind === 'boss' ? 80 : 60);
    enemy.setScale(config.scale);
    enemy.body.setAllowGravity(false);
    enemy.setBounce(1, 1);
    enemy.setData('kind', kind);
    enemy.setData('hp', hp);
    enemy.setData('maxHp', hp);
    enemy.setData('poisoned', false);
    enemy.setData('labelText', this.createEnemyLabel(enemy, config));

    if (kind === 'scope') {
      enemy.setAngularVelocity(Phaser.Math.Between(-70, 70));
    }
    if (kind === 'meeting' || kind === 'wall') {
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
    const effectMultiplier = this.getProjectileEffectMultiplier(projectile);
    this.damageEnemy(enemy, (isMainRecall ? RECALL_DAMAGE : 1) * effectMultiplier * this.getDamageMultiplier(), 'banana');
    if (isMainRecall) {
      projectile.setVelocity(projectile.body.velocity.x * 1.01, projectile.body.velocity.y * 1.01);
    } else {
      this.ricochetProjectileFromEnemy(projectile, enemy);
    }

    this.applyUnlockedHitEffects(projectile, enemy, isMainRecall, effectMultiplier);
  }

  private applyUnlockedHitEffects(
    projectile: ProjectileSprite,
    enemy: EnemySprite,
    isMainRecall: boolean,
    effectMultiplier: number
  ): void {
    const canApplyHitProcs = this.canProjectileApplyHitProcs(projectile);
    if (canApplyHitProcs) {
      this.applyStatusEffects(enemy, effectMultiplier, false);
    }

    if (canApplyHitProcs && this.getSkillRank('fire') >= 2) {
      this.spawnFirePatch(enemy.x, enemy.y, effectMultiplier, FIRE_HIT_PATCH_LIFETIME_MS, projectile === this.banana ? 0.7 : 0.5);
    }
    if (canApplyHitProcs && !isMainRecall && this.getSkillRank('explosion') > 0) {
      this.explodeAt(enemy.x, enemy.y, effectMultiplier, this.getProjectileExplosionRadiusMultiplier(projectile));
    }
    if (!isMainRecall && projectile.getData('canDuplicate') && this.getSkillRank('duplicate') > 0) {
      this.spawnBananaClones(getPotassiumDuplicateCloneCount(this.getSkillRank('duplicate')), this.getCloneLifetimeMs());
    }
    if (!isMainRecall && this.getSkillRank('ghostHorizontal') > 0) {
      this.spawnGhostBeam(enemy.x, enemy.y, 'horizontal', effectMultiplier);
    }
    if (!isMainRecall && this.getSkillRank('ghostVertical') > 0) {
      this.spawnGhostBeam(enemy.x, enemy.y, 'vertical', effectMultiplier);
    }
  }

  private applyStatusEffects(
    enemy: EnemySprite,
    effectMultiplier: number,
    allowExplosionStatus: boolean
  ): void {
    if (this.getSkillRank('poison') > 0) {
      this.applyPoison(enemy, effectMultiplier);
    }
    if (allowExplosionStatus && this.getSkillRank('fire') > 0) {
      this.spawnFirePatch(enemy.x, enemy.y, effectMultiplier, FIRE_HIT_PATCH_LIFETIME_MS, 0.58);
    }
  }

  private ricochetProjectileFromEnemy(projectile: ProjectileSprite, enemy: EnemySprite): void {
    if (!projectile.active || !projectile.body) return;

    const velocity = projectile.body.velocity.clone();
    const currentSpeed = velocity.length();
    const normal = new Phaser.Math.Vector2(projectile.x - enemy.x, projectile.y - enemy.y);
    if (normal.lengthSq() <= 0.001) {
      normal.copy(velocity.lengthSq() > 0.001 ? velocity : new Phaser.Math.Vector2(0, 1));
    }
    normal.normalize();

    const ricochet = velocity.clone();
    const dot = ricochet.dot(normal);
    if (dot < 0) {
      ricochet.subtract(normal.clone().scale(2 * dot));
    } else {
      ricochet.copy(normal);
    }
    if (ricochet.lengthSq() <= 0.001) {
      ricochet.copy(normal);
    }

    const maxSpeed = projectile === this.banana ? this.getMaxBananaSpeed() : CLONE_RICOCHET_MAX_SPEED;
    const speed = Phaser.Math.Clamp(
      Math.max(currentSpeed * BANANA_RICOCHET_BOOST, BANANA_RICOCHET_MIN_SPEED),
      BANANA_RICOCHET_MIN_SPEED,
      maxSpeed
    );
    ricochet.normalize().scale(speed);

    projectile.setPosition(
      Phaser.Math.Clamp(projectile.x + normal.x * 8, ARENA.left + 28, ARENA.right - 28),
      Phaser.Math.Clamp(projectile.y + normal.y * 8, ARENA.top + 28, ARENA.bottom - 28)
    );
    projectile.setVelocity(ricochet.x, ricochet.y);
    projectile.setAngularVelocity(Phaser.Math.Clamp(ricochet.x * 1.4, -720, 720));
  }

  private damageEnemy(enemy: EnemySprite, amount: number, source: 'banana' | 'fire' | 'poison' | 'explosion' | 'ghost'): void {
    if (!enemy.active || enemy.getData('dying')) return;
    if (source === 'fire') {
      const fireUntil = enemy.getData('fireTickUntil') as number | undefined;
      if (fireUntil !== undefined && fireUntil > this.time.now) return;
      enemy.setData('fireTickUntil', this.time.now + FIRE_TICK_COOLDOWN_MS);
    }

    const hp = Math.max(0, (enemy.getData('hp') as number) - amount);
    enemy.setData('hp', hp);
    this.showDamageCue(enemy, source);
    if (hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  private applyPoison(enemy: EnemySprite, effectMultiplier: number = 1, applyRankBonus = true): void {
    const poisonMultiplier = applyRankBonus && this.getSkillRank('poison') >= 2
      ? effectMultiplier * POISON_UPGRADED_DAMAGE_MULTIPLIER * this.getPoisonGenericMultiplier()
      : effectMultiplier;
    const currentExpiresAt = (enemy.getData('poisonExpiresAt') as number | undefined) ?? 0;
    enemy.setData('poisonExpiresAt', Math.max(currentExpiresAt, this.time.now + POISON_DURATION_MS * poisonMultiplier));
    enemy.setData('poisoned', true);
    enemy.setData('poisonMultiplier', Math.max((enemy.getData('poisonMultiplier') as number | undefined) ?? 0, poisonMultiplier));
    enemy.setTint(POISON_TINT);
    const nextTickAt = enemy.getData('poisonNextTickAt') as number | undefined;
    if (nextTickAt === undefined || nextTickAt < this.time.now) {
      enemy.setData('poisonNextTickAt', this.time.now + POISON_TICK_INTERVAL_MS);
    }
  }

  private spreadPoisonFrom(x: number, y: number, effectMultiplier: number, sourceEnemy?: EnemySprite): void {
    this.enemies.getChildren().forEach((gameObject) => {
      const enemy = gameObject as EnemySprite;
      if (enemy === sourceEnemy || !enemy.active || enemy.getData('dying')) return;
      if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= POISON_DEATH_SPREAD_RADIUS) {
        this.applyPoison(enemy, effectMultiplier, false);
      }
    });
  }

  private showDamageCue(enemy: EnemySprite, source: 'banana' | 'fire' | 'poison' | 'explosion' | 'ghost'): void {
    this.flashEnemy(enemy);
    this.showDamageRing(enemy, source);
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

  private showDamageRing(enemy: EnemySprite, source: 'banana' | 'fire' | 'poison' | 'explosion' | 'ghost'): void {
    const color = source === 'poison'
      ? POISON_TINT
      : source === 'fire'
        ? 0xf97316
        : source === 'explosion'
          ? 0xef4444
          : source === 'ghost'
            ? 0x38bdf8
            : 0x1a1a1a;
    const radius = Math.max(18, enemy.displayWidth * 0.42);
    const ring = this.add.circle(enemy.x, enemy.y, radius, color, 0.08)
      .setStrokeStyle(3, color, 0.58)
      .setDepth(930);
    this.tweens.add({
      targets: ring,
      radius: radius + 10,
      alpha: 0,
      duration: 180,
      ease: 'Sine.easeOut',
      onComplete: () => ring.destroy()
    });
    this.tweens.add({
      targets: enemy,
      scaleX: enemy.scaleX * 1.06,
      scaleY: enemy.scaleY * 1.06,
      duration: 55,
      yoyo: true,
      ease: 'Sine.easeOut'
    });
  }

  private killEnemy(enemy: EnemySprite): void {
    const kind = enemy.getData('kind') as EnemyKind;
    const config = ENEMY_CONFIGS[kind];
    this.spreadPoisonOnDeath(enemy);
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

  private spreadPoisonOnDeath(enemy: EnemySprite): void {
    const poisonExpiresAt = enemy.getData('poisonExpiresAt') as number | undefined;
    if (this.getSkillRank('poison') < 2 || poisonExpiresAt === undefined || poisonExpiresAt <= this.time.now) return;
    const effectMultiplier = (enemy.getData('poisonMultiplier') as number | undefined) ?? 1;
    this.spreadPoisonFrom(enemy.x, enemy.y, effectMultiplier, enemy);
  }

  private spawnBananaClones(count: number, lifetimeMs: number): void {
    for (let i = 0; i < count; i += 1) {
      const clone = this.clones.create(this.banana.x, this.banana.y, 'banana_peel_yellow') as ProjectileSprite;
      clone.name = `${this.time.now}-${i}`;
      clone.setDepth(90);
      clone.setScale(0.48);
      clone.setAlpha(0.82);
      clone.setBounce(1, 1);
      clone.body.setAllowGravity(false);
      clone.body.setCircle(16, 16, 16);
      clone.setData('canDuplicate', false);
      clone.setData('effectMultiplier', CLONE_EFFECT_MULTIPLIER);
      clone.setData('canApplyHitProcs', this.getSkillRank('duplicate') >= 2);
      clone.setData('nextTrailDropAt', 0);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      clone.setVelocity(Math.cos(angle) * 430, Math.sin(angle) * 430);
      clone.setAngularVelocity(Phaser.Math.Between(-600, 600));
      this.time.delayedCall(lifetimeMs, () => {
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

  private updateFireTrail(time: number): void {
    if (this.getSkillRank('fire') <= 0) return;
    this.dropFireTrailForProjectile(this.banana, time);
    this.clones.getChildren().forEach((gameObject) => {
      this.dropFireTrailForProjectile(gameObject as ProjectileSprite, time);
    });
  }

  private dropFireTrailForProjectile(projectile: ProjectileSprite, time: number): void {
    if (!projectile.active || !projectile.body) return;
    const nextDropAt = (projectile.getData('nextTrailDropAt') as number | undefined) ?? 0;
    if (time < nextDropAt || projectile.body.velocity.length() < 120) return;
    projectile.setData('nextTrailDropAt', time + TRAIL_DROP_INTERVAL_MS);
    this.spawnFirePatch(
      projectile.x,
      projectile.y,
      this.getProjectileEffectMultiplier(projectile),
      FIRE_TRAIL_LIFETIME_MS,
      projectile === this.banana ? 0.86 : 0.56
    );
  }

  private spawnFirePatch(
    x: number,
    y: number,
    effectMultiplier: number,
    lifetimeMs: number,
    scale: number
  ): void {
    const zone = this.trailZones.create(x, y, 'potassium_fire') as ProjectileSprite;
    zone.setDepth(30);
    zone.setAlpha(0.62);
    zone.setScale(scale);
    zone.body.setAllowGravity(false);
    zone.body.setImmovable(true);
    zone.setData('effectMultiplier', effectMultiplier);
    zone.setVelocity(0, 0);
    this.time.delayedCall(lifetimeMs, () => {
      if (!zone.active) return;
      this.tweens.add({
        targets: zone,
        alpha: 0,
        duration: 220,
        onComplete: () => zone.destroy()
      });
    });
  }

  private updatePoisonStatuses(time: number): void {
    if (this.getSkillRank('poison') <= 0) return;
    this.enemies.getChildren().forEach((gameObject) => {
      const enemy = gameObject as EnemySprite;
      const expiresAt = enemy.getData('poisonExpiresAt') as number | undefined;
      if (!enemy.active || expiresAt === undefined) return;
      if (expiresAt <= time) {
        this.clearPoison(enemy);
        return;
      }
      const nextTickAt = (enemy.getData('poisonNextTickAt') as number | undefined) ?? time;
      if (nextTickAt > time) return;
      enemy.setData('poisonNextTickAt', time + POISON_TICK_INTERVAL_MS);
      this.damageEnemy(enemy, (enemy.getData('poisonMultiplier') as number | undefined) ?? 1, 'poison');
    });
  }

  private clearPoison(enemy: EnemySprite): void {
    if (!enemy.active) return;
    enemy.setData('poisonExpiresAt', undefined);
    enemy.setData('poisonNextTickAt', undefined);
    enemy.setData('poisonMultiplier', undefined);
    enemy.setData('poisoned', false);
    enemy.clearTint();
  }

  private explodeAt(x: number, y: number, effectMultiplier: number, radiusMultiplier: number): void {
    const rank = this.getSkillRank('explosion');
    const radius = getPotassiumScaledExplosionRadius(rank, radiusMultiplier * this.getExplosionRadiusMultiplier());
    const blast = this.add.circle(x, y, 18, 0xf97316, 0.22)
      .setStrokeStyle(5, 0x1a1a1a, 1)
      .setDepth(940);
    this.tweens.add({
      targets: blast,
      radius,
      alpha: 0,
      duration: 240,
      onComplete: () => blast.destroy()
    });
    this.enemies.getChildren().forEach((gameObject) => {
      const enemy = gameObject as EnemySprite;
      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      const damage = getPotassiumExplosionDamage(distance, radius, effectMultiplier * this.getDamageMultiplier());
      if (damage > 0) {
        this.damageEnemy(enemy, damage, 'explosion');
        if (rank >= 2) {
          this.applyStatusEffects(enemy, effectMultiplier, true);
        }
      }
    });
    this.cameras.main.shake(130, 0.006);
  }

  private spawnGhostBeam(x: number, y: number, direction: 'horizontal' | 'vertical', effectMultiplier: number): void {
    const isHorizontal = direction === 'horizontal';
    const rank = this.getSkillRank(isHorizontal ? 'ghostHorizontal' : 'ghostVertical');
    const width = isHorizontal ? ARENA.width - 42 : 24;
    const height = isHorizontal ? 24 : ARENA.height - 128;
    const beam = this.add.rectangle(
      isHorizontal ? GAME_DESIGN_WIDTH / 2 : x,
      isHorizontal ? y : ARENA.top + 92 + height / 2,
      width,
      height,
      0x38bdf8,
      0.24
    ).setStrokeStyle(4, 0x1a1a1a, 0.82).setDepth(935);
    this.enemies.getChildren().forEach((gameObject) => {
      const enemy = gameObject as EnemySprite;
      const inBeam = isHorizontal
        ? Math.abs(enemy.y - y) <= 28
        : Math.abs(enemy.x - x) <= 28;
      if (inBeam) {
        this.damageEnemy(enemy, 1 * effectMultiplier * this.getDamageMultiplier(), 'ghost');
        if (rank >= 2) {
          this.applyStatusEffects(enemy, effectMultiplier, false);
        }
      }
    });
    if (rank >= 2) {
      this.spawnGhostStatusField(x, y, direction, effectMultiplier, width, height);
    }
    this.tweens.add({
      targets: beam,
      alpha: 0,
      duration: GHOST_BEAM_LIFETIME_MS,
      onComplete: () => beam.destroy()
    });
  }

  private spawnGhostStatusField(
    x: number,
    y: number,
    direction: 'horizontal' | 'vertical',
    effectMultiplier: number,
    width: number,
    height: number
  ): void {
    if (this.getSkillRank('fire') > 0) {
      const isHorizontal = direction === 'horizontal';
      const patchCount = isHorizontal ? 5 : 7;
      for (let index = 0; index < patchCount; index += 1) {
        const t = patchCount <= 1 ? 0.5 : index / (patchCount - 1);
        const patchX = isHorizontal ? Phaser.Math.Linear(ARENA.left + 46, ARENA.right - 46, t) : x;
        const patchY = isHorizontal ? y : Phaser.Math.Linear(ARENA.top + 112, ARENA.bottom - 92, t);
        this.spawnFirePatch(patchX, patchY, effectMultiplier, GHOST_STATUS_FIELD_LIFETIME_MS, 0.46);
      }
    }
    if (this.getSkillRank('poison') > 0) {
      const field = this.add.rectangle(
        direction === 'horizontal' ? GAME_DESIGN_WIDTH / 2 : x,
        direction === 'horizontal' ? y : ARENA.top + 92 + height / 2,
        width,
        height,
        POISON_TINT,
        0.12
      ).setStrokeStyle(2, POISON_TINT, 0.42).setDepth(934);
      this.tweens.add({
        targets: field,
        alpha: 0,
        duration: GHOST_STATUS_FIELD_LIFETIME_MS,
        onComplete: () => field.destroy()
      });
    }
  }

  private enforceSideWalls(): void {
    this.enemies.getChildren().forEach((gameObject) => {
      const enemy = gameObject as EnemySprite;
      const kind = enemy.getData('kind') as EnemyKind;
      if (kind === 'boss') {
        this.bounceObjectInsideArena(enemy, SIDE_BOUNCE_MARGIN);
      } else {
        this.clampEnemyInsideArena(enemy, SIDE_BOUNCE_MARGIN);
      }
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

  private clampEnemyInsideArena(enemy: EnemySprite, margin: number): void {
    if (!enemy.active || !enemy.body) return;
    enemy.setX(Phaser.Math.Clamp(enemy.x, ARENA.left + margin, ARENA.right - margin));
    enemy.setVelocityX(0);
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
      if (enemy.y > ARENA.bottom + 45) {
        if (kind === 'wall') {
          enemy.destroy();
        } else {
          this.handleEnemyEscape(enemy);
        }
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
    if (this.pendingRows > 0) return;
    const hasLivingEnemies = this.enemies.getChildren().some((gameObject) => {
      const enemy = gameObject as EnemySprite;
      return enemy.active && !enemy.getData('dying');
    });
    if (hasLivingEnemies) return;
    this.waveAdvancing = true;
    bridgeActions.setSceneHintText('Wave clear • Choose fresh banana nonsense');
    this.time.delayedCall(UPGRADE_CHOICE_DELAY_MS, () => {
      if (this.gameState === 'PLAYING') {
        this.showUpgradeChoices();
      }
    });
  }

  private showUpgradeChoices(): void {
    const choices = getPotassiumDraftChoices(this.skillRanks, this.genericRanks, this.wave);
    if (choices.length === 0) {
      this.advanceToNextWave();
      return;
    }

    this.gameState = 'UPGRADE';
    this.banana.setVelocity(0, 0);
    this.banana.setAngularVelocity(0);
    this.clearUpgradeChoiceOverlay();

    this.upgradeChoiceBackdrop = this.add.rectangle(GAME_DESIGN_WIDTH / 2, 305, ARENA.width - 76, 176, 0xfbfbf9, 0.96)
      .setStrokeStyle(5, 0x1a1a1a, 0.9)
      .setDepth(1200);
    this.upgradeChoiceTitle = createUiText(this, GAME_DESIGN_WIDTH / 2, 238, 'CHOOSE BANANA NONSENSE', {
      fontSize: '15px',
      color: '#1a1a1a',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5).setDepth(1201);

    const buttonWidth = 164;
    const buttonHeight = 82;
    const startX = choices.length === 1 ? GAME_DESIGN_WIDTH / 2 : GAME_DESIGN_WIDTH / 2 - 88;
    this.upgradeChoiceButtons = choices.map((option, index) => {
      const config = isGenericDraftOption(option) ? GENERIC_UPGRADE_CONFIGS[option.kind] : UPGRADE_CONFIGS[option.kind];
      const x = startX + index * 176;
      const panel = this.add.rectangle(x, 312, buttonWidth, buttonHeight, 0xffffff, 0.92)
        .setStrokeStyle(3, 0x1a1a1a, 0.75)
        .setDepth(1201);
      const label = createUiText(this, x, 286, getDraftOptionTitle(option), {
        fontSize: '11px',
        color: config.color,
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: buttonWidth - 16, useAdvancedWrap: true }
      }).setOrigin(0.5).setDepth(1202);
      const description = createUiText(this, x, 326, getDraftOptionDescription(option), {
        fontSize: '8px',
        color: '#1a1a1a',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: buttonWidth - 18, useAdvancedWrap: true }
      }).setOrigin(0.5).setDepth(1202);
      return { option, panel, label, description };
    });
  }

  private handleUpgradeChoicePointer(pointer: Phaser.Input.Pointer): void {
    const choice = this.upgradeChoiceButtons.find((button) => {
      const bounds = button.panel.getBounds();
      return bounds.contains(pointer.x, pointer.y);
    });
    if (!choice) return;
    this.applyDraftChoice(choice.option);
    this.clearUpgradeChoiceOverlay();
    this.advanceToNextWave();
  }

  private applyDraftChoice(option: DraftOption): void {
    if (isGenericDraftOption(option)) {
      this.genericRanks = applyPotassiumGenericDraftOption(this.genericRanks, option);
      if (option.kind === 'bonusLife') {
        this.lives += 1;
      }
      bridgeActions.setSceneHintText(`${GENERIC_UPGRADE_CONFIGS[option.kind].label} stacked • Endless paperwork trembles`);
      this.updateHud();
      return;
    }

    this.skillRanks = applyPotassiumDraftOption(this.skillRanks, option);
    const actionLabel = option.action === 'unlock' ? 'unlocked' : 'upgraded';
    bridgeActions.setSceneHintText(`${UPGRADE_CONFIGS[option.kind].label} ${actionLabel} • It stacks forever`);
    this.updateHud();
  }

  private clearUpgradeChoiceOverlay(): void {
    this.upgradeChoiceBackdrop?.destroy();
    this.upgradeChoiceTitle?.destroy();
    this.upgradeChoiceBackdrop = undefined;
    this.upgradeChoiceTitle = undefined;
    this.upgradeChoiceButtons.forEach((button) => {
      button.panel.destroy();
      button.label.destroy();
      button.description.destroy();
    });
    this.upgradeChoiceButtons = [];
  }

  private advanceToNextWave(): void {
    this.gameState = 'PLAYING';
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
    if (kind === 'wall') return `Wall ${hp}/${maxHp}`;
    return `${hp}/${maxHp}`;
  }

  private positionFloatingLabel(label: Phaser.GameObjects.Text, x: number, y: number): void {
    label.setPosition(
      snapUiTextCoordinate(Phaser.Math.Clamp(x, SAFE.left, SAFE.right)),
      snapUiTextCoordinate(Phaser.Math.Clamp(y, SAFE.labelTop, SAFE.bottom))
    );
  }

  private getActiveUpgradeText(): string {
    const unlocked = Object.entries(this.skillRanks)
      .filter(([, rank]) => rank !== undefined && rank > 0) as Array<[UpgradeKind, SkillRank]>;
    const skillText = unlocked
      .map(([upgrade, rank]) => `${UPGRADE_CONFIGS[upgrade].label.replace(' Damage', '').replace(' Trail', '').toLowerCase()}${rank >= 2 ? '+' : ''}`)
      .join(' + ');
    const genericText = Object.entries(this.genericRanks)
      .filter(([, rank]) => rank !== undefined && rank > 0)
      .map(([upgrade, rank]) => `${GENERIC_UPGRADE_CONFIGS[upgrade as GenericUpgradeKind].label.toLowerCase()}x${rank}`)
      .join(' + ');
    return [skillText, genericText].filter(Boolean).join(' + ') || 'no nonsense yet';
  }

  private getWaveHint(wave: number): string {
    if (wave > 11) return 'endless paperwork escalation';
    if (wave === 1) return 'launch and bounce';
    if (wave === 2) return 'multi-hit blobs';
    if (wave === 3) return 'walls block angles';
    if (wave === 4) return 'walls block angles';
    if (wave === 5) return 'stack your choices';
    if (wave === 6) return 'final paperwork rain';
    return 'boss time';
  }

  private winGame(): void {
    this.gameState = 'WON';
    this.banana.setVelocity(0, 0);
    this.enemies.clear(true, true);
    this.clones.clear(true, true);
    this.trailZones.clear(true, true);
    this.clearUpgradeChoiceOverlay();
    if (this.runMode === 'campaign') {
      bridgeActions.collectItem('circuit');
    }
    this.saveRunRecord('won');
    bridgeActions.setSceneHintText(null);
    this.overlayText.setFontSize(26).setText('CIRCUIT ACQUIRED').setPosition(GAME_DESIGN_WIDTH / 2, 255).setVisible(true);
    this.subOverlayText.setFontSize(15).setText(`Final Score: ${this.score}`).setPosition(GAME_DESIGN_WIDTH / 2, 308).setVisible(true);
    this.createTerminalOverlay('won');
  }

  private gameOver(): void {
    this.gameState = 'GAME_OVER';
    this.enemies.clear(true, true);
    this.clones.clear(true, true);
    this.trailZones.clear(true, true);
    this.banana.setVelocity(0, 0);
    this.clearUpgradeChoiceOverlay();
    this.saveRunRecord('game_over');
    bridgeActions.setSceneHintText(null);
    this.overlayText.setFontSize(24).setText('BANANA BANKRUPTCY').setPosition(GAME_DESIGN_WIDTH / 2, 255).setVisible(true);
    this.subOverlayText.setFontSize(15).setText(`Final Score: ${this.score}`).setPosition(GAME_DESIGN_WIDTH / 2, 308).setVisible(true);
    this.createTerminalOverlay('game_over');
  }

  private saveRunRecord(outcome: RunOutcome): void {
    this.runRecordCompletedAt ??= new Date().toISOString();
    savePotassiumRunRecord({
      score: this.score,
      wave: this.wave,
      mode: this.runMode,
      outcome,
      completedAt: this.runRecordCompletedAt
    });
  }

  private createTerminalOverlay(outcome: RunOutcome): void {
    this.clearTerminalOverlay();
    const buttons: Array<{ action: TerminalAction; label: string }> = outcome === 'won'
      ? [
        { action: 'endless', label: 'ENDLESS MODE' },
        { action: 'return', label: 'RETURN TO CITY' }
      ]
      : [
        { action: 'retry', label: 'RETRY' },
        { action: 'return', label: 'RETURN TO CITY' }
      ];
    const startX = GAME_DESIGN_WIDTH / 2 - 88;
    this.terminalButtons = buttons.map((button, index) => {
      const x = startX + index * 176;
      const panel = this.add.rectangle(x, 360, 156, 36, 0xffffff, 0.96)
        .setStrokeStyle(3, 0x1a1a1a, 0.88)
        .setDepth(1210);
      const label = createUiText(this, x, 360, button.label, {
        fontSize: '10px',
        color: '#1a1a1a',
        fontStyle: 'bold',
        align: 'center'
      }).setOrigin(0.5).setDepth(1211);
      return { action: button.action, panel, label };
    });

    this.recordsText = createUiText(this, GAME_DESIGN_WIDTH / 2, 424, this.getRecordsOverlayText(), {
      fontSize: '9px',
      color: '#1a1a1a',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: ARENA.width - 72, useAdvancedWrap: true }
    }).setOrigin(0.5, 0).setDepth(1210);
  }

  private getRecordsOverlayText(): string {
    const records = getPotassiumLeaderboardTop(3);
    if (records.length === 0) return 'RECORDS\nNo banana paperwork filed yet.';
    return [
      'RECORDS',
      ...records.map((record, index) => (
        `${index + 1}. ${record.score} • W${record.wave} • ${record.mode === 'endless' ? 'endless' : record.outcome}`
      ))
    ].join('\n');
  }

  private handleTerminalPointer(pointer: Phaser.Input.Pointer): void {
    const button = this.terminalButtons.find((candidate) => candidate.panel.getBounds().contains(pointer.x, pointer.y));
    if (!button) return;
    if (button.action === 'return') {
      this.onClose?.();
    } else if (button.action === 'retry') {
      this.startGame();
    } else {
      this.startEndlessMode();
    }
  }

  private clearTerminalOverlay(): void {
    this.terminalButtons.forEach((button) => {
      button.panel.destroy();
      button.label.destroy();
    });
    this.terminalButtons = [];
    this.recordsText?.destroy();
    this.recordsText = undefined;
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

  private createWallTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xd6d3d1, 1);
    g.lineStyle(5, 0x1a1a1a, 1);
    g.fillRoundedRect(4, 6, 102, 54, 5);
    g.strokeRoundedRect(4, 6, 102, 54, 5);
    g.fillStyle(0xfbfbf9, 0.72);
    g.fillRect(14, 15, 82, 11);
    g.fillRect(14, 35, 82, 11);
    g.lineStyle(2, 0x1a1a1a, 0.45);
    g.beginPath();
    g.moveTo(22, 20);
    g.lineTo(88, 20);
    g.moveTo(22, 40);
    g.lineTo(88, 40);
    g.strokePath();
    g.lineStyle(4, 0x1a1a1a, 0.85);
    g.beginPath();
    g.moveTo(8, 60);
    g.lineTo(102, 60);
    g.strokePath();
    g.generateTexture('potassium_enemy_wall', 110, 68);
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

  private createFireTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xf97316, 0.34);
    g.lineStyle(3, 0x1a1a1a, 0.42);
    g.fillEllipse(30, 18, 56, 24);
    g.strokeEllipse(30, 18, 56, 24);
    g.fillStyle(0xfacc15, 0.38);
    g.fillEllipse(30, 16, 34, 14);
    g.generateTexture('potassium_fire', 60, 36);
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
