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
  getPotassiumExplosionRadius,
  getPotassiumFireCellKey,
  getPotassiumGenericUpgradeRank,
  getPotassiumShieldSide,
  getPotassiumSkillRank,
  getPotassiumWave,
  getPotassiumSplitterSpawnColumns,
  getScaledPotassiumEnemyHp,
  isPotassiumBossWave,
  POTASSIUM_COLUMN_COUNT,
  type PotassiumDraftOption as DraftOption,
  type PotassiumEnemyHealthState as EnemyHealthState,
  type PotassiumGenericDraftOption as GenericDraftOption,
  type PotassiumGenericUpgradeKind as GenericUpgradeKind,
  type PotassiumGenericUpgradeRanks as GenericRanks,
  type PotassiumShieldSide as ShieldSide,
  type PotassiumSkillRanks as SkillRanks,
  type PotassiumSkillRank as SkillRank,
  type PotassiumWaveCell as WaveCell,
  type PotassiumEnemyKind as EnemyKind,
  type PotassiumUpgradeKind as UpgradeKind
} from './potassiumSlipWaves';
import {
  POTASSIUM_GHOST_STATUS_FIELD_LIFETIME_MS,
  POTASSIUM_POISON_DURATION_MS,
  POTASSIUM_POISON_TICK_INTERVAL_MS,
  resolvePotassiumDamage,
  resolvePotassiumExplosion,
  resolvePotassiumGhostBeam,
  resolvePotassiumPoisonTick,
  resolvePotassiumProjectileHit,
  type PotassiumCombatCommand,
  type PotassiumDamageSource,
  type PotassiumEnemyCombatFacts,
  type PotassiumGhostBeamDirection,
  type PotassiumApplyPoisonCommand,
  type PotassiumProjectileCombatFacts
} from './potassiumSlipCombat';
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
  indestructible?: boolean;
  splitsOnDeath?: boolean;
  shielded?: boolean;
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

interface BananaVisuals {
  behind: Phaser.GameObjects.Graphics;
  front: Phaser.GameObjects.Graphics;
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
  top: ARENA.top + 58,
  bottom: ARENA.bottom - 96,
  labelTop: ARENA.top + 52
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
const RECALL_MODE: 'direct' | 'elastic' = 'direct';
const RECALL_ELASTIC_PULL = 980;
const RECALL_ELASTIC_MAX_SPEED = 780;
const WAVE_ADVANCE_DELAY_MS = 900;
const SIDE_BOUNCE_MARGIN = 32;
const BANANA_RICOCHET_MIN_SPEED = 360;
const BANANA_RICOCHET_BOOST = 1.08;
const CLONE_RICOCHET_MAX_SPEED = 660;
const NON_BOSS_ENEMY_SPEED = 64;
const ROW_SPAWN_DELAY_MS = 900;
const TRAIL_DROP_INTERVAL_MS = 180;
const FIRE_TRAIL_LIFETIME_MS = 1500;
const GHOST_BEAM_LIFETIME_MS = 190;
const UPGRADE_CHOICE_DELAY_MS = 450;
const POISON_TINT = 0x65a30d;
const CLONE_EFFECT_MULTIPLIER = 0.5;
const POISON_DEATH_SPREAD_RADIUS = 76;
const CELL_FIRE_ROW_HEIGHT = 48;
const BOSS_PATROL_SPEED = 54;
const BOSS_PHASE_1_DRIFT = 4;
const BOSS_PHASE_2_DRIFT = 6;
const BOSS_PHASE_3_DRIFT = 3;
const BOSS_STONE_DURATION_MS = 1350;
const BOSS_STONE_INTERVAL_MS = 4300;
const BOSS_SUMMON_INTERVAL_MS = 3600;
const BOSS_ORBIT_RADIUS = 78;
const BOSS_ORBIT_SPEED = 0.0017;

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
  hardWall: {
    label: 'Hard Filing Wall',
    hp: 999,
    score: 0,
    speed: 30,
    texture: 'potassium_enemy_hard_wall',
    scale: 0.78,
    indestructible: true
  },
  splitter: {
    label: 'Splitter Memo',
    hp: 5,
    score: 3,
    speed: 54,
    texture: 'potassium_enemy_splitter',
    scale: 0.9,
    splitsOnDeath: true
  },
  shield: {
    label: 'Shielded Form',
    hp: 7,
    score: 4,
    speed: 46,
    texture: 'potassium_enemy_shield',
    scale: 0.92,
    shielded: true
  },
  boss: {
    label: 'Potassium Compliance Officer',
    hp: 92,
    score: 12,
    speed: 8,
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
    color: '#65a30d',
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
  private bossBlockers!: Phaser.Physics.Arcade.Group;
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
  private fireCells = new Set<string>();
  private upgradeChoiceButtons: UpgradeChoiceButton[] = [];
  private upgradeChoiceBackdrop?: Phaser.GameObjects.Rectangle;
  private upgradeChoiceTitle?: Phaser.GameObjects.Text;
  private terminalButtons: TerminalButton[] = [];
  private recordsText?: Phaser.GameObjects.Text;
  private activeBoss?: EnemySprite;
  private combatIdCounter: number = 0;

  private hudText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
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
    this.bossBlockers = this.physics.add.group();
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
    this.updateBananaUpgradeVisualPositions();
    this.updateBananaDrag(delta);
    this.updateEnemyVisuals();
    this.updatePoisonStatuses(time);
    this.updateFireTrail(time);
    this.updateBossFight(time);
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
    this.combatIdCounter = 0;
    this.fireCells.clear();
  }

  private createPotassiumTextures(): void {
    if (!this.textures.exists('potassium_enemy_intern')) this.createInternTexture();
    if (!this.textures.exists('potassium_enemy_scope')) this.createScopeTexture();
    if (!this.textures.exists('potassium_enemy_meeting')) this.createMeetingTexture();
    if (!this.textures.exists('potassium_enemy_deadline')) this.createDeadlineTexture();
    if (!this.textures.exists('potassium_enemy_wall')) this.createWallTexture();
    if (!this.textures.exists('potassium_enemy_hard_wall')) this.createHardWallTexture();
    if (!this.textures.exists('potassium_enemy_splitter')) this.createSplitterTexture();
    if (!this.textures.exists('potassium_enemy_shield')) this.createShieldTexture();
    if (!this.textures.exists('potassium_damage_cracked') || !this.textures.exists('potassium_damage_critical')) {
      if (this.textures.exists('potassium_damage_cracked')) this.textures.remove('potassium_damage_cracked');
      if (this.textures.exists('potassium_damage_critical')) this.textures.remove('potassium_damage_critical');
      this.createDamageOverlayTextures();
    }
    if (!this.textures.exists('potassium_wall_damage_cracked') || !this.textures.exists('potassium_wall_damage_critical')) {
      if (this.textures.exists('potassium_wall_damage_cracked')) this.textures.remove('potassium_wall_damage_cracked');
      if (this.textures.exists('potassium_wall_damage_critical')) this.textures.remove('potassium_wall_damage_critical');
      this.createWallDamageOverlayTextures();
    }
    if (!this.textures.exists('potassium_enemy_boss')) this.createBossTexture();
    if (!this.textures.exists('potassium_fire')) this.createFireTexture();
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
    this.fieldInk.fillRect(ARENA.left + 12, ARENA.top, ARENA.width - 24, 52);
    this.fieldInk.fillRect(ARENA.left + 12, ARENA.bottom - 82, ARENA.width - 24, 82);
    this.fieldInk.lineStyle(3, 0x1a1a1a, 0.32);
    this.fieldInk.strokeCircle(LAUNCH_PAD.x, LAUNCH_PAD.y, LAUNCH_PAD.radius);
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
    this.refreshBananaUpgradeVisuals(this.banana);
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
    this.physics.add.overlap(this.banana, this.bossBlockers, (_banana, blocker) => {
      if (this.controlState === 'recalling') {
        this.banana.setVelocity(this.banana.body.velocity.x * 1.01, this.banana.body.velocity.y * 1.01);
        return;
      }
      this.ricochetProjectileFromEnemy(this.banana, blocker as EnemySprite);
    });
    this.physics.add.overlap(this.clones, this.bossBlockers, (clone, blocker) => {
      this.ricochetProjectileFromEnemy(clone as ProjectileSprite, blocker as EnemySprite);
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
        this.setBananaRecallVisual(false);
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
    this.destroyProjectileVisuals(this.banana);
    this.destroyAllCloneVisuals();
    this.enemies?.clear(true, true);
    this.clones?.clear(true, true);
    this.trailZones?.clear(true, true);
    this.bossBlockers?.clear(true, true);
    this.activeBoss = undefined;
    this.fireCells.clear();
    this.banana.setPosition(LAUNCH_PAD.x, LAUNCH_PAD.y);
    this.banana.setVelocity(0, 0);
    this.banana.setAngularVelocity(0);
    this.banana.setBounce(1, 1);
    this.banana.setScale(0.9);
    this.banana.setData('canDuplicate', true);
    this.banana.setData('nextTrailDropAt', 0);
    this.banana.setData('effectMultiplier', 1);
    this.banana.setData('canApplyHitProcs', true);
    this.banana.setData('recallVisual', false);
    this.refreshBananaUpgradeVisuals(this.banana);
    this.aimLine?.clear();
    this.tetherLine?.clear();
    this.clearUpgradeChoiceOverlay();
    this.clearTerminalOverlay();
  }

  private beginAiming(pointer: Phaser.Input.Pointer): void {
    this.controlState = 'aiming';
    this.aimPointerId = pointer.id;
    this.setBananaRecallVisual(false);
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
    this.setBananaRecallVisual(true);
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
    this.setBananaRecallVisual(false);
  }

  private cancelControl(): void {
    this.controlState = 'idle';
    this.aimPointerId = null;
    this.aimLine.clear();
    this.tetherLine.clear();
  }

  private setBananaRecallVisual(active: boolean): void {
    this.banana.setData('recallVisual', active);
    this.banana.setBounce(active ? 0.15 : 1, active ? 0.15 : 1);
    this.refreshBananaUpgradeVisuals(this.banana);
  }

  private updateControlState(): void {
    if (this.controlState === 'recalling') {
      if (RECALL_MODE === 'direct') {
        this.physics.moveTo(this.banana, LAUNCH_PAD.x, LAUNCH_PAD.y, RECALL_SPEED);
      } else {
        this.applyElasticRecall();
      }
      this.banana.setAngularVelocity(Phaser.Math.Clamp(this.banana.body.velocity.x * 2, -520, 520));
      this.drawRecallTether();
      if (this.banana.y >= LAUNCH_PAD.y - 4 && Phaser.Math.Distance.Between(this.banana.x, this.banana.y, LAUNCH_PAD.x, LAUNCH_PAD.y) <= 52) {
        this.banana.setPosition(LAUNCH_PAD.x, LAUNCH_PAD.y);
        this.banana.setVelocity(0, 0);
      }
      if (this.isBananaInLaunchZone(34)) {
        this.beginAiming(this.input.activePointer);
      }
      return;
    }

    this.tetherLine.clear();
    this.updateAimingLine();
  }

  private applyElasticRecall(): void {
    const toPad = new Phaser.Math.Vector2(LAUNCH_PAD.x - this.banana.x, LAUNCH_PAD.y - this.banana.y);
    if (toPad.lengthSq() <= 1) {
      this.banana.setVelocity(0, 0);
      return;
    }
    toPad.normalize();
    const velocity = this.banana.body.velocity.clone();
    velocity.x += toPad.x * RECALL_ELASTIC_PULL * (1 / 60);
    velocity.y += toPad.y * RECALL_ELASTIC_PULL * (1 / 60);
    if (velocity.length() > RECALL_ELASTIC_MAX_SPEED) {
      velocity.normalize().scale(RECALL_ELASTIC_MAX_SPEED);
    }
    this.banana.setVelocity(velocity.x, velocity.y);
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

  private getExplosionRadiusMultiplier(): number {
    return 1 + this.getGenericRank('explosion') * 0.06;
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

  private refreshBananaUpgradeVisuals(projectile: ProjectileSprite, options: { isClone?: boolean } = {}): void {
    if (!projectile.active) return;
    const isClone = options.isClone ?? projectile !== this.banana;
    const isRecall = projectile === this.banana && ((projectile.getData('recallVisual') as boolean | undefined) ?? false);
    projectile.setTexture(this.getSkillRank('poison') > 0 ? 'banana_peel_green' : 'banana_peel_yellow');
    projectile.clearTint();
    projectile.setAlpha(isClone ? 0.82 : isRecall ? 0.68 : 1);
    this.destroyProjectileVisuals(projectile);

    const behind = this.add.graphics().setDepth(projectile.depth - 1);
    const front = this.add.graphics().setDepth(projectile.depth + 1);
    this.drawBananaUpgradeAccents(behind, front, isClone);
    projectile.setData('bananaVisuals', { behind, front } satisfies BananaVisuals);
    this.positionBananaVisuals(projectile);
  }

  private drawBananaUpgradeAccents(
    behind: Phaser.GameObjects.Graphics,
    front: Phaser.GameObjects.Graphics,
    isClone: boolean
  ): void {
    const scale = isClone ? 0.58 : 1;
    const alphaScale = isClone ? 0.62 : 1;
    const fireRank = this.getSkillRank('fire');
    const explosionRank = this.getSkillRank('explosion');
    const duplicateRank = this.getSkillRank('duplicate');
    const ghostHorizontalRank = this.getSkillRank('ghostHorizontal');
    const ghostVerticalRank = this.getSkillRank('ghostVertical');

    if (duplicateRank > 0) {
      behind.lineStyle((duplicateRank >= 2 ? 4 : 3) * scale, 0xfacc15, 0.28 * alphaScale);
      behind.strokeEllipse(-16 * scale, 8 * scale, 26 * scale, 15 * scale);
      behind.strokeEllipse(16 * scale, -7 * scale, 22 * scale, 13 * scale);
    }

    if (fireRank > 0) {
      behind.lineStyle((fireRank >= 2 ? 6 : 4) * scale, 0xf97316, 0.55 * alphaScale);
      behind.strokeCircle(0, 0, (fireRank >= 2 ? 36 : 32) * scale);
      behind.lineStyle(2 * scale, 0xfacc15, 0.42 * alphaScale);
      behind.strokeCircle(0, 0, 25 * scale);
    }

    if (ghostHorizontalRank > 0) {
      front.lineStyle((ghostHorizontalRank >= 2 ? 5 : 3) * scale, 0x38bdf8, 0.56 * alphaScale);
      front.beginPath();
      front.moveTo(-34 * scale, 0);
      front.lineTo(34 * scale, 0);
      front.strokePath();
    }

    if (ghostVerticalRank > 0) {
      front.lineStyle((ghostVerticalRank >= 2 ? 5 : 3) * scale, 0x60a5fa, 0.5 * alphaScale);
      front.beginPath();
      front.moveTo(0, -34 * scale);
      front.lineTo(0, 34 * scale);
      front.strokePath();
    }

    if (explosionRank > 0) {
      const sparkScale = explosionRank >= 2 ? 1.12 : 1;
      front.fillStyle(0xef4444, 0.86 * alphaScale);
      front.lineStyle(2 * scale, 0x1a1a1a, 0.72 * alphaScale);
      front.beginPath();
      front.moveTo(22 * scale, -28 * scale);
      front.lineTo(27 * scale * sparkScale, -14 * scale);
      front.lineTo(38 * scale, -13 * scale);
      front.lineTo(29 * scale, -6 * scale * sparkScale);
      front.lineTo(33 * scale, 6 * scale);
      front.lineTo(21 * scale, -2 * scale);
      front.lineTo(11 * scale, 6 * scale);
      front.lineTo(14 * scale, -8 * scale);
      front.lineTo(4 * scale, -16 * scale);
      front.lineTo(18 * scale, -17 * scale);
      front.closePath();
      front.fillPath();
      front.strokePath();
    }
  }

  private updateBananaUpgradeVisualPositions(): void {
    this.positionBananaVisuals(this.banana);
    this.clones.getChildren().forEach((gameObject) => {
      this.positionBananaVisuals(gameObject as ProjectileSprite);
    });
  }

  private positionBananaVisuals(projectile: ProjectileSprite): void {
    const visuals = projectile.getData('bananaVisuals') as BananaVisuals | undefined;
    if (!visuals) return;
    visuals.behind.setPosition(projectile.x, projectile.y).setRotation(projectile.rotation).setVisible(projectile.active);
    visuals.front.setPosition(projectile.x, projectile.y).setRotation(projectile.rotation).setVisible(projectile.active);
  }

  private destroyProjectileVisuals(projectile?: ProjectileSprite): void {
    if (!projectile) return;
    const visuals = projectile.getData('bananaVisuals') as BananaVisuals | undefined;
    visuals?.behind.destroy();
    visuals?.front.destroy();
    projectile.setData('bananaVisuals', undefined);
  }

  private destroyAllCloneVisuals(): void {
    this.clones?.getChildren().forEach((gameObject) => {
      this.destroyProjectileVisuals(gameObject as ProjectileSprite);
    });
  }

  private refreshAllProjectileVisuals(): void {
    this.refreshBananaUpgradeVisuals(this.banana);
    this.clones?.getChildren().forEach((gameObject) => {
      this.refreshBananaUpgradeVisuals(gameObject as ProjectileSprite, { isClone: true });
    });
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
      this.time.delayedCall(rowIndex * ROW_SPAWN_DELAY_MS, () => this.spawnEnemyRow(row, rowIndex));
    });
    bridgeActions.setSceneHintText(`${wave.title}: ${this.getWaveHint(waveNumber)}`);
  }

  private spawnEnemyRow(row: readonly WaveCell[], rowIndex: number = 0): void {
    if (this.gameState !== 'PLAYING') return;
    this.pendingRows = Math.max(0, this.pendingRows - 1);
    row.forEach((kind, columnIndex) => {
      if (kind === null) return;
      this.spawnEnemy(kind, columnIndex, rowIndex);
    });
  }

  private spawnEnemy(kind: EnemyKind, columnIndex: number = 0, rowIndex: number = 0, yOverride?: number): EnemySprite | undefined {
    if (this.gameState !== 'PLAYING') return;
    const config = ENEMY_CONFIGS[kind];
    const x = this.getEnemySpawnX(kind, columnIndex);
    const y = yOverride ?? (kind === 'boss' ? SAFE.top + 60 : SAFE.top + 12);
    const enemy = this.enemies.create(x, y, config.texture) as EnemySprite;
    this.configureEnemy(enemy, kind, this.wave, columnIndex, rowIndex);

    if (kind === 'boss') {
      this.activeBoss = enemy;
      enemy.once(Phaser.GameObjects.Events.DESTROY, () => {
        if (this.activeBoss === enemy) {
          this.activeBoss = undefined;
        }
      });
      enemy.setPosition(LAUNCH_PAD.x, SAFE.top + 132);
      enemy.setVelocity(BOSS_PATROL_SPEED, BOSS_PHASE_1_DRIFT);
      enemy.setBounce(1, 1);
      this.cameras.main.shake(250, 0.008);
    } else {
      enemy.setVelocity(0, NON_BOSS_ENEMY_SPEED);
    }
    return enemy;
  }

  private getEnemySpawnX(kind: EnemyKind, columnIndex: number): number {
    const clampedColumn = Phaser.Math.Clamp(columnIndex, 0, POTASSIUM_COLUMN_COUNT - 1);
    if (kind === 'splitter') {
      return (this.getLaneCenterX(clampedColumn) + this.getLaneCenterX(Math.min(POTASSIUM_COLUMN_COUNT - 1, clampedColumn + 1))) / 2;
    }
    return this.getLaneCenterX(clampedColumn);
  }

  private getLaneCenterX(columnIndex: number): number {
    return Phaser.Math.Linear(ARENA.left + 64, ARENA.right - 64, (columnIndex + 0.5) / POTASSIUM_COLUMN_COUNT);
  }

  private configureEnemy(enemy: EnemySprite, kind: EnemyKind, wave: number, columnIndex: number, rowIndex: number): void {
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
    enemy.setData('columnIndex', columnIndex);
    enemy.setData('rowIndex', rowIndex);
    enemy.setData('columnSpan', kind === 'splitter' ? 2 : 1);
    enemy.setData('occupiedColumns', kind === 'splitter' ? getPotassiumSplitterSpawnColumns(columnIndex) : [columnIndex]);
    enemy.setData('indestructible', config.indestructible ?? false);
    enemy.setData('splitsOnDeath', config.splitsOnDeath ?? false);
    enemy.setData('damageState', 'healthy' satisfies EnemyHealthState);
    enemy.setData('damageOverlay', this.createDamageOverlay(enemy));
    if (config.shielded) {
      const shieldSide = getPotassiumShieldSide(wave, rowIndex, columnIndex);
      enemy.setData('shieldSide', shieldSide);
      enemy.setData('shieldPlate', this.createShieldPlate(enemy, shieldSide));
    }
    if (kind === 'boss') {
      enemy.setData('labelText', this.createEnemyLabel(enemy, config));
      enemy.setData('bossPhase', 1);
      enemy.setData('nextStoneAt', this.time.now + BOSS_STONE_INTERVAL_MS);
      enemy.setData('nextSummonAt', this.time.now + BOSS_SUMMON_INTERVAL_MS);
      enemy.setData('orbitStarted', false);
    }

    if (kind === 'scope') {
      enemy.setAngularVelocity(Phaser.Math.Between(-70, 70));
    }
    if (kind === 'meeting' || kind === 'wall' || kind === 'hardWall') {
      enemy.setImmovable(true);
    }
    this.fitEnemyBodyToOneCell(enemy, kind);
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

  private createDamageOverlay(enemy: EnemySprite): Phaser.GameObjects.Sprite {
    const kind = enemy.getData('kind') as EnemyKind;
    const overlay = this.add.sprite(enemy.x, enemy.y, kind === 'wall' ? 'potassium_wall_damage_cracked' : 'potassium_damage_cracked')
      .setDepth(enemy.depth + 1)
      .setOrigin(0.5)
      .setVisible(false);
    enemy.once(Phaser.GameObjects.Events.DESTROY, () => overlay.destroy());
    return overlay;
  }

  private createShieldPlate(enemy: EnemySprite, side: ShieldSide): Phaser.GameObjects.Rectangle {
    const plate = this.add.rectangle(enemy.x, enemy.y, 12, 12, 0x38bdf8, 0.4)
      .setStrokeStyle(4, 0x1a1a1a, 0.9)
      .setDepth(enemy.depth + 2);
    enemy.once(Phaser.GameObjects.Events.DESTROY, () => plate.destroy());
    this.positionShieldPlate(enemy, plate, side);
    return plate;
  }

  private fitEnemyBodyToOneCell(enemy: EnemySprite, kind: EnemyKind): void {
    if (!enemy.body) return;
    if (kind === 'wall' || kind === 'hardWall') {
      enemy.body.setSize(68, 52, true);
      return;
    }
    if (kind === 'splitter') {
      enemy.body.setSize(118, 52, true);
      return;
    }
    if (kind === 'shield') {
      enemy.body.setSize(54, 54, true);
    }
  }

  private hitEnemy(enemy: EnemySprite, projectile: ProjectileSprite, hitKey: string): void {
    if (this.gameState !== 'PLAYING' || !enemy.active) return;
    const cooldownKey = `hitUntil:${hitKey}`;
    const hitUntil = enemy.getData(cooldownKey) as number | undefined;
    if (hitUntil !== undefined && hitUntil > this.time.now) return;
    enemy.setData(cooldownKey, this.time.now + HIT_COOLDOWN_MS);

    this.applyCombatCommands(resolvePotassiumProjectileHit({
      now: this.time.now,
      enemy: this.getEnemyCombatFacts(enemy),
      projectile: this.getProjectileCombatFacts(projectile),
      skillRanks: this.skillRanks,
      genericRanks: this.genericRanks
    }), this.createCombatContext([enemy], [projectile]));
  }

  private getEnemyCombatFacts(enemy: EnemySprite): PotassiumEnemyCombatFacts {
    return {
      id: this.getCombatId(enemy, 'enemy'),
      kind: enemy.getData('kind') as EnemyKind,
      active: enemy.active,
      dying: Boolean(enemy.getData('dying')),
      hp: (enemy.getData('hp') as number | undefined) ?? 0,
      maxHp: (enemy.getData('maxHp') as number | undefined) ?? 0,
      x: enemy.x,
      y: enemy.y,
      indestructible: Boolean(enemy.getData('indestructible')),
      splitsOnDeath: Boolean(enemy.getData('splitsOnDeath')),
      poisonExpiresAt: enemy.getData('poisonExpiresAt') as number | undefined,
      poisonMultiplier: enemy.getData('poisonMultiplier') as number | undefined,
      poisonNextTickAt: enemy.getData('poisonNextTickAt') as number | undefined,
      fireTickUntil: enemy.getData('fireTickUntil') as number | undefined,
      shieldSide: enemy.getData('shieldSide') as ShieldSide | undefined,
      stoneUntil: enemy.getData('stoneUntil') as number | undefined
    };
  }

  private getProjectileCombatFacts(projectile: ProjectileSprite): PotassiumProjectileCombatFacts {
    return {
      id: this.getCombatId(projectile, projectile === this.banana ? 'main' : 'projectile'),
      isMain: projectile === this.banana,
      isRecall: projectile === this.banana && this.controlState === 'recalling',
      x: projectile.x,
      y: projectile.y,
      effectMultiplier: this.getProjectileEffectMultiplier(projectile),
      canApplyHitProcs: this.canProjectileApplyHitProcs(projectile),
      canDuplicate: Boolean(projectile.getData('canDuplicate')),
      explosionRadiusMultiplier: this.getProjectileExplosionRadiusMultiplier(projectile)
    };
  }

  private getCombatId(object: Phaser.GameObjects.GameObject, prefix: string): string {
    const existingId = object.getData('combatId') as string | undefined;
    if (existingId) return existingId;
    const id = `${prefix}-${this.combatIdCounter}`;
    this.combatIdCounter += 1;
    object.setData('combatId', id);
    return id;
  }

  private createCombatContext(
    enemies: EnemySprite[] = this.enemies.getChildren() as EnemySprite[],
    projectiles: ProjectileSprite[] = [this.banana, ...(this.clones.getChildren() as ProjectileSprite[])]
  ): {
    enemies: Map<string, EnemySprite>;
    projectiles: Map<string, ProjectileSprite>;
  } {
    return {
      enemies: new Map(enemies.map((enemy) => [this.getCombatId(enemy, 'enemy'), enemy])),
      projectiles: new Map(projectiles.map((projectile) => [this.getCombatId(projectile, projectile === this.banana ? 'main' : 'projectile'), projectile]))
    };
  }

  private applyCombatCommands(
    commands: readonly PotassiumCombatCommand[],
    context = this.createCombatContext()
  ): void {
    commands.forEach((command) => {
      const enemy = 'enemyId' in command ? context.enemies.get(command.enemyId) : undefined;
      const projectile = 'projectileId' in command ? context.projectiles.get(command.projectileId) : undefined;
      if (command.type === 'damageEnemy') {
        if (enemy) this.damageEnemy(enemy, command.amount, command.source);
      } else if (command.type === 'setEnemyHp') {
        enemy?.setData('hp', command.hp);
        enemy?.setData('damageState', command.damageState);
      } else if (command.type === 'setFireTickUntil') {
        enemy?.setData('fireTickUntil', command.fireTickUntil);
      } else if (command.type === 'setPoisonNextTickAt') {
        enemy?.setData('poisonNextTickAt', command.poisonNextTickAt);
      } else if (command.type === 'showDamageCue') {
        if (enemy) this.showDamageCue(enemy, command.source);
      } else if (command.type === 'ricochetProjectile') {
        if (projectile && enemy) this.ricochetProjectileFromEnemy(projectile, enemy);
      } else if (command.type === 'boostRecallVelocity') {
        projectile?.setVelocity(projectile.body.velocity.x * 1.01, projectile.body.velocity.y * 1.01);
      } else if (command.type === 'applyPoison') {
        if (enemy) this.applyPoisonCommand(enemy, command);
      } else if (command.type === 'clearPoison') {
        if (enemy) this.clearPoison(enemy);
      } else if (command.type === 'spawnFirePatch') {
        this.spawnFirePatch(command.x, command.y, command.effectMultiplier, command.lifetimeMs, command.scale);
      } else if (command.type === 'explodeAt') {
        this.explodeAt(command.x, command.y, command.effectMultiplier, command.radiusMultiplier);
      } else if (command.type === 'spawnBananaClones') {
        this.spawnBananaClones(command.count, command.lifetimeMs);
      } else if (command.type === 'spawnGhostBeam') {
        this.spawnGhostBeam(command.x, command.y, command.direction, command.effectMultiplier);
      } else if (command.type === 'spawnGhostStatusField') {
        this.spawnGhostStatusField(command.x, command.y, command.direction, command.effectMultiplier);
      } else if (command.type === 'spreadPoisonFrom') {
        this.spreadPoisonFrom(command.x, command.y, command.effectMultiplier, context.enemies.get(command.sourceEnemyId));
      } else if (command.type === 'spawnSplitterChildren') {
        if (enemy) this.spawnSplitterChildren(enemy);
      } else if (command.type === 'killEnemy') {
        if (enemy) this.killEnemy(enemy);
      }
    });
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

  private damageEnemy(enemy: EnemySprite, amount: number, source: PotassiumDamageSource): void {
    this.applyCombatCommands(resolvePotassiumDamage({
      now: this.time.now,
      enemy: this.getEnemyCombatFacts(enemy),
      amount,
      source,
      skillRanks: this.skillRanks,
      genericRanks: this.genericRanks
    }), this.createCombatContext());
  }

  private applyPoisonCommand(enemy: EnemySprite, command: PotassiumApplyPoisonCommand): void {
    enemy.setData('poisonExpiresAt', command.expiresAt);
    enemy.setData('poisoned', true);
    enemy.setData('poisonMultiplier', command.poisonMultiplier);
    enemy.setTint(POISON_TINT);
    if (command.nextTickAt !== undefined) {
      enemy.setData('poisonNextTickAt', command.nextTickAt);
    }
  }

  private spreadPoisonFrom(x: number, y: number, effectMultiplier: number, sourceEnemy?: EnemySprite): void {
    this.enemies.getChildren().forEach((gameObject) => {
      const enemy = gameObject as EnemySprite;
      if (enemy === sourceEnemy || !enemy.active || enemy.getData('dying')) return;
      if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= POISON_DEATH_SPREAD_RADIUS) {
        this.applyPoisonCommand(enemy, {
          type: 'applyPoison',
          enemyId: this.getCombatId(enemy, 'enemy'),
          effectMultiplier,
          poisonMultiplier: Math.max((enemy.getData('poisonMultiplier') as number | undefined) ?? 0, effectMultiplier),
          expiresAt: Math.max(
            (enemy.getData('poisonExpiresAt') as number | undefined) ?? 0,
            this.time.now + POTASSIUM_POISON_DURATION_MS * effectMultiplier
          ),
          nextTickAt: ((enemy.getData('poisonNextTickAt') as number | undefined) ?? 0) < this.time.now
            ? this.time.now + POTASSIUM_POISON_TICK_INTERVAL_MS
            : undefined
        });
      }
    });
  }

  private showDamageCue(enemy: EnemySprite, source: 'banana' | 'fire' | 'poison' | 'explosion' | 'ghost'): void {
    this.showDamageRing(enemy, source);
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
    this.spawnSplitterChildren(enemy);
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

  private spawnSplitterChildren(enemy: EnemySprite): void {
    if (!enemy.getData('splitsOnDeath')) return;
    const columnIndex = (enemy.getData('columnIndex') as number | undefined) ?? 2;
    const rowIndex = ((enemy.getData('rowIndex') as number | undefined) ?? 0) + 1;
    const occupiedColumns = (enemy.getData('occupiedColumns') as number[] | undefined) ?? getPotassiumSplitterSpawnColumns(columnIndex);
    occupiedColumns
      .forEach((column) => {
        const child = this.spawnEnemy('intern', column, rowIndex, enemy.y + 26);
        if (!child) return;
        child.setScale(0.62);
        child.setData('hp', Math.max(1, Math.ceil(((child.getData('hp') as number) || 1) * 0.55)));
        child.setData('maxHp', child.getData('hp') as number);
        child.setVelocity(0, NON_BOSS_ENEMY_SPEED + 18);
        this.fitEnemyBodyToOneCell(child, 'intern');
      });
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
      this.refreshBananaUpgradeVisuals(clone, { isClone: true });
      this.time.delayedCall(lifetimeMs, () => {
        if (!clone.active) return;
        const visuals = clone.getData('bananaVisuals') as BananaVisuals | undefined;
        this.tweens.add({
          targets: [clone, visuals?.behind, visuals?.front].filter(Boolean),
          alpha: 0,
          scale: 0,
          duration: 240,
          onComplete: () => {
            this.destroyProjectileVisuals(clone);
            clone.destroy();
          }
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
    const cellKey = this.getFireCellKey(x, y);
    if (this.fireCells.has(cellKey)) return;
    this.fireCells.add(cellKey);
    const zone = this.trailZones.create(x, y, 'potassium_fire') as ProjectileSprite;
    zone.setDepth(30);
    zone.setAlpha(0.62);
    zone.setScale(scale);
    zone.body.setAllowGravity(false);
    zone.body.setImmovable(true);
    zone.setData('effectMultiplier', effectMultiplier);
    zone.setVelocity(0, 0);
    this.time.delayedCall(lifetimeMs, () => {
      this.fireCells.delete(cellKey);
      if (!zone.active) return;
      this.tweens.add({
        targets: zone,
        alpha: 0,
        duration: 220,
        onComplete: () => zone.destroy()
      });
    });
  }

  private getFireCellKey(x: number, y: number): string {
    return getPotassiumFireCellKey(x, y, {
      left: SAFE.left,
      width: SAFE.right - SAFE.left,
      top: SAFE.top,
      bottom: SAFE.bottom
    }, CELL_FIRE_ROW_HEIGHT);
  }

  private updatePoisonStatuses(time: number): void {
    if (this.getSkillRank('poison') <= 0) return;
    this.enemies.getChildren().forEach((gameObject) => {
      const enemy = gameObject as EnemySprite;
      this.applyCombatCommands(resolvePotassiumPoisonTick({
        now: time,
        enemy: this.getEnemyCombatFacts(enemy),
        poisonUnlocked: this.getSkillRank('poison') > 0
      }), this.createCombatContext([enemy]));
    });
  }

  private clearPoison(enemy: EnemySprite): void {
    if (!enemy.active) return;
    enemy.setData('poisonExpiresAt', undefined);
    enemy.setData('poisonNextTickAt', undefined);
    enemy.setData('poisonMultiplier', undefined);
    enemy.setData('poisoned', false);
    if (enemy.getData('stoneActive')) {
      enemy.setTint(0x78716c);
    } else {
      enemy.clearTint();
    }
  }

  private explodeAt(x: number, y: number, effectMultiplier: number, radiusMultiplier: number): void {
    const rank = this.getSkillRank('explosion');
    const radius = getPotassiumExplosionRadius(rank) * radiusMultiplier * this.getExplosionRadiusMultiplier();
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
    const enemies = this.enemies.getChildren() as EnemySprite[];
    this.applyCombatCommands(resolvePotassiumExplosion({
      now: this.time.now,
      x,
      y,
      effectMultiplier,
      radiusMultiplier,
      hits: enemies.map((enemy) => ({
        enemy: this.getEnemyCombatFacts(enemy),
        distance: Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y)
      })),
      skillRanks: this.skillRanks,
      genericRanks: this.genericRanks
    }), this.createCombatContext(enemies));
    this.cameras.main.shake(130, 0.006);
  }

  private spawnGhostBeam(x: number, y: number, direction: 'horizontal' | 'vertical', effectMultiplier: number): void {
    const isHorizontal = direction === 'horizontal';
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
    const enemies = this.enemies.getChildren() as EnemySprite[];
    this.applyCombatCommands(resolvePotassiumGhostBeam({
      now: this.time.now,
      x,
      y,
      direction,
      effectMultiplier,
      hits: enemies.map((enemy) => ({
        enemy: this.getEnemyCombatFacts(enemy),
        inBeam: isHorizontal
          ? Math.abs(enemy.y - y) <= 28
          : Math.abs(enemy.x - x) <= 28
      })),
      skillRanks: this.skillRanks,
      genericRanks: this.genericRanks
    }), this.createCombatContext(enemies));
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
    direction: PotassiumGhostBeamDirection,
    effectMultiplier: number
  ): void {
    const isHorizontal = direction === 'horizontal';
    const width = isHorizontal ? ARENA.width - 42 : 24;
    const height = isHorizontal ? 24 : ARENA.height - 128;
    if (this.getSkillRank('fire') > 0) {
      const patchCount = isHorizontal ? 5 : 7;
      for (let index = 0; index < patchCount; index += 1) {
        const t = patchCount <= 1 ? 0.5 : index / (patchCount - 1);
        const patchX = isHorizontal ? Phaser.Math.Linear(ARENA.left + 46, ARENA.right - 46, t) : x;
        const patchY = isHorizontal ? y : Phaser.Math.Linear(ARENA.top + 112, ARENA.bottom - 92, t);
        this.spawnFirePatch(patchX, patchY, effectMultiplier, POTASSIUM_GHOST_STATUS_FIELD_LIFETIME_MS, 0.46);
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
        duration: POTASSIUM_GHOST_STATUS_FIELD_LIFETIME_MS,
        onComplete: () => field.destroy()
      });
    }
  }

  private updateBossFight(time: number): void {
    const boss = this.activeBoss;
    if (!boss || boss.getData('dying')) {
      this.bossBlockers.getChildren().forEach((gameObject) => gameObject.destroy());
      return;
    }

    const phase = this.getBossPhase(boss);
    const previousPhase = (boss.getData('bossPhase') as number | undefined) ?? 1;
    if (phase !== previousPhase) {
      boss.setData('bossPhase', phase);
      this.cameras.main.shake(220, 0.007);
      bridgeActions.setSceneHintText(phase === 2
        ? 'Boss phase 2 • Orbiting walls hate angles'
        : 'Boss phase 3 • Stone audits summon witnesses');
    }

    this.updateBossPatrol(boss, phase);
    if (phase >= 2 && !boss.getData('orbitStarted')) {
      this.spawnBossOrbitBlockers(boss);
      boss.setData('orbitStarted', true);
    }
    if (phase >= 2) {
      this.updateBossOrbitBlockers(boss, time);
    }
    if (phase >= 3) {
      this.updateBossStoneAndSummons(boss, time);
    } else {
      this.setBossStoneVisual(boss, false);
    }
  }

  private getBossPhase(boss: EnemySprite): number {
    const hp = boss.getData('hp') as number;
    const maxHp = boss.getData('maxHp') as number;
    const ratio = maxHp > 0 ? hp / maxHp : 1;
    if (ratio <= 0.3) return 3;
    if (ratio <= 0.6) return 2;
    return 1;
  }

  private updateBossPatrol(boss: EnemySprite, phase: number): void {
    const left = SAFE.left + 42;
    const right = SAFE.right - 42;
    if (boss.x <= left) {
      boss.setX(left);
      boss.setVelocityX(BOSS_PATROL_SPEED);
    } else if (boss.x >= right) {
      boss.setX(right);
      boss.setVelocityX(-BOSS_PATROL_SPEED);
    } else if (Math.abs(boss.body.velocity.x) < 10) {
      boss.setVelocityX(BOSS_PATROL_SPEED);
    }
    const drift = phase === 1 ? BOSS_PHASE_1_DRIFT : phase === 2 ? BOSS_PHASE_2_DRIFT : BOSS_PHASE_3_DRIFT;
    boss.setVelocityY(drift);
  }

  private spawnBossOrbitBlockers(boss: EnemySprite): void {
    this.bossBlockers.clear(true, true);
    for (let index = 0; index < 3; index += 1) {
      const blocker = this.bossBlockers.create(boss.x, boss.y, 'potassium_enemy_hard_wall') as EnemySprite;
      blocker.setDepth(84);
      blocker.setScale(0.54);
      blocker.body.setAllowGravity(false);
      blocker.body.setImmovable(true);
      blocker.body.setSize(58, 42, true);
      blocker.setData('orbitIndex', index);
    }
  }

  private updateBossOrbitBlockers(boss: EnemySprite, time: number): void {
    this.bossBlockers.getChildren().forEach((gameObject) => {
      const blocker = gameObject as EnemySprite;
      const index = (blocker.getData('orbitIndex') as number | undefined) ?? 0;
      const angle = time * BOSS_ORBIT_SPEED + index * ((Math.PI * 2) / 3);
      blocker.setPosition(
        boss.x + Math.cos(angle) * BOSS_ORBIT_RADIUS,
        boss.y + Math.sin(angle) * (BOSS_ORBIT_RADIUS * 0.68)
      );
      blocker.setAngle(Phaser.Math.RadToDeg(angle));
      blocker.setVelocity(0, 0);
    });
  }

  private updateBossStoneAndSummons(boss: EnemySprite, time: number): void {
    const stoneUntil = boss.getData('stoneUntil') as number | undefined;
    if (stoneUntil !== undefined && stoneUntil > time) {
      this.setBossStoneVisual(boss, true);
    } else {
      this.setBossStoneVisual(boss, false);
      const nextStoneAt = (boss.getData('nextStoneAt') as number | undefined) ?? 0;
      if (time >= nextStoneAt) {
        boss.setData('stoneUntil', time + BOSS_STONE_DURATION_MS);
        boss.setData('nextStoneAt', time + BOSS_STONE_INTERVAL_MS);
      }
    }

    const nextSummonAt = (boss.getData('nextSummonAt') as number | undefined) ?? 0;
    if (time >= nextSummonAt) {
      this.spawnBossSummons(boss);
      boss.setData('nextSummonAt', time + BOSS_SUMMON_INTERVAL_MS);
    }
  }

  private setBossStoneVisual(boss: EnemySprite, active: boolean): void {
    if (active) {
      boss.setTint(0x78716c);
      boss.setData('stoneActive', true);
      return;
    }
    if (!boss.getData('stoneActive')) return;
    boss.setData('stoneActive', false);
    if (boss.getData('poisoned')) {
      boss.setTint(POISON_TINT);
    } else {
      boss.clearTint();
    }
  }

  private spawnBossSummons(boss: EnemySprite): void {
    const centerColumn = Phaser.Math.Clamp(
      Math.round(((boss.x - ARENA.left) / ARENA.width) * POTASSIUM_COLUMN_COUNT - 0.5),
      0,
      POTASSIUM_COLUMN_COUNT - 1
    );
    const columns = getPotassiumSplitterSpawnColumns(centerColumn);
    const y = Phaser.Math.Clamp(boss.y + 76, SAFE.top + 24, SAFE.bottom - 120);
    columns.forEach((column, index) => {
      const kind: EnemyKind = index % 2 === 0 ? 'scope' : 'deadline';
      const enemy = this.spawnEnemy(kind, column, 0, y);
      enemy?.setVelocity(0, NON_BOSS_ENEMY_SPEED + 10);
    });
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
    [...this.enemies.getChildren()].forEach((gameObject) => {
      const enemy = gameObject as EnemySprite;
      const kind = enemy.getData('kind') as EnemyKind;
      if (kind === 'boss') {
        if (enemy.y > ARENA.bottom + 45) {
          this.handleBossEscape(enemy);
        }
        return;
      }
      if (enemy.y > ARENA.bottom + 45) {
        if (kind === 'wall' || kind === 'hardWall') {
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
    this.refreshAllProjectileVisuals();
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

  private updateEnemyVisuals(): void {
    this.enemies.getChildren().forEach((gameObject) => {
      const enemy = gameObject as EnemySprite;
      this.positionEnemyAttachments(enemy);
      const label = enemy.getData('labelText') as Phaser.GameObjects.Text | undefined;
      if (!label) return;
      const hp = Math.ceil(enemy.getData('hp') as number);
      const maxHp = enemy.getData('maxHp') as number;
      label.setText(`${hp}/${maxHp}`);
      this.positionFloatingLabel(label, enemy.x, enemy.y - 34 * enemy.scale);
    });
  }

  private updateHud(): void {
    const wave = getPotassiumWave(this.wave);
    this.hudText?.setText(`W${this.wave} ${wave.title}`);
    this.scoreText?.setText(`Score ${this.score}`);
    this.livesText?.setText(`Lives ${this.lives}`);
  }

  private positionEnemyAttachments(enemy: EnemySprite): void {
    const overlay = enemy.getData('damageOverlay') as Phaser.GameObjects.Sprite | undefined;
    if (overlay) {
      const state = enemy.getData('damageState') as EnemyHealthState | undefined;
      const kind = enemy.getData('kind') as EnemyKind;
      const isWall = kind === 'wall';
      overlay.setPosition(enemy.x, enemy.y)
        .setScale(enemy.displayWidth / (isWall ? 80 : 76), enemy.displayHeight / 62)
        .setRotation(enemy.rotation)
        .setVisible(state === 'cracked' || state === 'critical');
      overlay.setTexture(isWall
        ? state === 'critical' ? 'potassium_wall_damage_critical' : 'potassium_wall_damage_cracked'
        : state === 'critical' ? 'potassium_damage_critical' : 'potassium_damage_cracked');
    }
    const shieldPlate = enemy.getData('shieldPlate') as Phaser.GameObjects.Rectangle | undefined;
    const shieldSide = enemy.getData('shieldSide') as ShieldSide | undefined;
    if (shieldPlate && shieldSide) {
      this.positionShieldPlate(enemy, shieldPlate, shieldSide);
    }
  }

  private positionShieldPlate(enemy: EnemySprite, plate: Phaser.GameObjects.Rectangle, side: ShieldSide): void {
    const width = Math.max(20, enemy.displayWidth * (side === 'bottom' ? 0.72 : 0.22));
    const height = Math.max(12, enemy.displayHeight * (side === 'bottom' ? 0.2 : 0.72));
    const offsetX = side === 'left' ? -enemy.displayWidth * 0.42 : side === 'right' ? enemy.displayWidth * 0.42 : 0;
    const offsetY = side === 'bottom' ? enemy.displayHeight * 0.42 : 0;
    plate.setPosition(enemy.x + offsetX, enemy.y + offsetY);
    plate.setSize(width, height);
  }

  private positionFloatingLabel(label: Phaser.GameObjects.Text, x: number, y: number): void {
    label.setPosition(
      snapUiTextCoordinate(Phaser.Math.Clamp(x, SAFE.left, SAFE.right)),
      snapUiTextCoordinate(Phaser.Math.Clamp(y, SAFE.labelTop, SAFE.bottom))
    );
  }

  private getWaveHint(wave: number): string {
    if (wave > 11) return 'endless paperwork escalation';
    if (wave === 1) return 'launch and bounce';
    if (wave === 2) return 'multi-hit blobs';
    if (wave === 3) return 'walls block angles';
    if (wave === 4) return 'walls block angles';
    if (wave === 5) return 'splitter memos make smaller problems';
    if (wave === 6) return 'stack your choices';
    if (wave === 7) return 'shield plates reject bad angles';
    if (wave >= 8 && wave <= 10) return 'hard walls ignore banana law';
    return 'boss time';
  }

  private winGame(): void {
    this.gameState = 'WON';
    this.banana.setVelocity(0, 0);
    this.setBananaRecallVisual(false);
    this.destroyAllCloneVisuals();
    this.enemies.clear(true, true);
    this.clones.clear(true, true);
    this.trailZones.clear(true, true);
    this.bossBlockers.clear(true, true);
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
    this.setBananaRecallVisual(false);
    this.destroyAllCloneVisuals();
    this.enemies.clear(true, true);
    this.clones.clear(true, true);
    this.trailZones.clear(true, true);
    this.bossBlockers.clear(true, true);
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
    g.fillStyle(0x8b5a2b, 0.96);
    g.lineStyle(5, 0x1a1a1a, 1);
    g.fillRoundedRect(5, 7, 70, 48, 4);
    g.strokeRoundedRect(5, 7, 70, 48, 4);
    g.fillStyle(0xb7793b, 0.96);
    g.fillRect(10, 12, 60, 10);
    g.fillRect(10, 26, 60, 10);
    g.fillRect(10, 40, 60, 10);
    g.lineStyle(2, 0x1a1a1a, 0.48);
    g.beginPath();
    g.moveTo(18, 13);
    g.lineTo(12, 21);
    g.moveTo(48, 26);
    g.lineTo(60, 35);
    g.moveTo(26, 42);
    g.lineTo(18, 50);
    g.strokePath();
    g.fillStyle(0xfbfbf9, 0.5);
    g.fillRect(14, 16, 18, 3);
    g.fillRect(42, 44, 16, 3);
    g.lineStyle(3, 0x1a1a1a, 0.75);
    g.beginPath();
    g.moveTo(12, 31);
    g.lineTo(68, 31);
    g.strokePath();
    g.generateTexture('potassium_enemy_wall', 80, 62);
    g.destroy();
  }

  private createHardWallTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x1a1a1a, 0.08);
    g.fillRoundedRect(7, 5, 66, 52, 5);
    g.fillStyle(0xa8a29e, 1);
    g.lineStyle(5, 0x1a1a1a, 1);
    g.fillRoundedRect(5, 7, 70, 48, 5);
    g.strokeRoundedRect(5, 7, 70, 48, 5);
    g.lineStyle(3, 0x1a1a1a, 0.75);
    g.beginPath();
    g.moveTo(18, 17);
    g.lineTo(62, 45);
    g.moveTo(62, 17);
    g.lineTo(18, 45);
    g.strokePath();
    g.fillStyle(0xfbfbf9, 0.68);
    g.fillRect(22, 25, 36, 12);
    g.generateTexture('potassium_enemy_hard_wall', 80, 62);
    g.destroy();
  }

  private createSplitterTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xfde68a, 0.96);
    g.lineStyle(4, 0x1a1a1a, 1);
    g.fillRoundedRect(7, 8, 112, 42, 6);
    g.strokeRoundedRect(7, 8, 112, 42, 6);
    g.fillStyle(0xfacc15, 0.82);
    g.fillRoundedRect(12, 13, 48, 32, 4);
    g.fillRoundedRect(66, 13, 48, 32, 4);
    g.lineStyle(3, 0x1a1a1a, 0.85);
    g.beginPath();
    g.moveTo(63, 10);
    g.lineTo(63, 50);
    g.moveTo(24, 24);
    g.lineTo(50, 24);
    g.moveTo(76, 34);
    g.lineTo(104, 34);
    g.strokePath();
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(29, 31, 3);
    g.fillCircle(93, 27, 3);
    g.generateTexture('potassium_enemy_splitter', 126, 58);
    g.destroy();
  }

  private createShieldTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xdbeafe, 0.96);
    g.lineStyle(4, 0x1a1a1a, 1);
    g.beginPath();
    g.moveTo(34, 5);
    g.lineTo(58, 18);
    g.lineTo(52, 50);
    g.lineTo(34, 60);
    g.lineTo(16, 50);
    g.lineTo(10, 18);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.fillStyle(0x38bdf8, 0.45);
    g.fillRoundedRect(18, 38, 32, 10, 4);
    g.lineStyle(2, 0x1a1a1a, 0.75);
    g.strokeRoundedRect(18, 38, 32, 10, 4);
    g.generateTexture('potassium_enemy_shield', 68, 66);
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

  private createDamageOverlayTextures(): void {
    const cracked = this.make.graphics({ x: 0, y: 0 });
    cracked.lineStyle(4, 0x1a1a1a, 0.9);
    cracked.beginPath();
    cracked.moveTo(22, 10);
    cracked.lineTo(32, 22);
    cracked.lineTo(27, 34);
    cracked.moveTo(50, 18);
    cracked.lineTo(42, 30);
    cracked.lineTo(50, 42);
    cracked.strokePath();
    cracked.fillStyle(0xfbfbf9, 0.74);
    cracked.fillRoundedRect(13, 43, 24, 8, 3);
    cracked.lineStyle(2, 0x1a1a1a, 0.7);
    cracked.strokeRoundedRect(13, 43, 24, 8, 3);
    cracked.generateTexture('potassium_damage_cracked', 76, 62);
    cracked.destroy();

    const critical = this.make.graphics({ x: 0, y: 0 });
    critical.lineStyle(4, 0x1a1a1a, 0.95);
    critical.beginPath();
    critical.moveTo(18, 8);
    critical.lineTo(30, 20);
    critical.lineTo(22, 34);
    critical.lineTo(36, 48);
    critical.moveTo(56, 12);
    critical.lineTo(44, 24);
    critical.lineTo(56, 38);
    critical.moveTo(42, 8);
    critical.lineTo(38, 18);
    critical.lineTo(46, 27);
    critical.strokePath();
    critical.fillStyle(0xfbfbf9, 0.82);
    critical.fillRoundedRect(10, 40, 28, 9, 3);
    critical.fillRoundedRect(41, 31, 23, 9, 3);
    critical.lineStyle(2, 0x1a1a1a, 0.75);
    critical.strokeRoundedRect(10, 40, 28, 9, 3);
    critical.strokeRoundedRect(41, 31, 23, 9, 3);
    critical.generateTexture('potassium_damage_critical', 76, 62);
    critical.destroy();
  }

  private createWallDamageOverlayTextures(): void {
    const cracked = this.make.graphics({ x: 0, y: 0 });
    cracked.lineStyle(4, 0x1a1a1a, 0.9);
    cracked.beginPath();
    cracked.moveTo(18, 11);
    cracked.lineTo(29, 23);
    cracked.lineTo(21, 34);
    cracked.moveTo(55, 15);
    cracked.lineTo(45, 27);
    cracked.lineTo(57, 39);
    cracked.strokePath();
    cracked.lineStyle(3, 0xfbfbf9, 0.48);
    cracked.beginPath();
    cracked.moveTo(13, 47);
    cracked.lineTo(28, 39);
    cracked.moveTo(49, 48);
    cracked.lineTo(68, 42);
    cracked.strokePath();
    cracked.generateTexture('potassium_wall_damage_cracked', 80, 62);
    cracked.destroy();

    const critical = this.make.graphics({ x: 0, y: 0 });
    critical.lineStyle(4, 0x1a1a1a, 0.96);
    critical.beginPath();
    critical.moveTo(14, 8);
    critical.lineTo(29, 21);
    critical.lineTo(19, 32);
    critical.lineTo(34, 47);
    critical.moveTo(62, 8);
    critical.lineTo(48, 22);
    critical.lineTo(62, 37);
    critical.moveTo(42, 12);
    critical.lineTo(38, 27);
    critical.lineTo(48, 43);
    critical.strokePath();
    critical.lineStyle(3, 0xfbfbf9, 0.55);
    critical.beginPath();
    critical.moveTo(9, 50);
    critical.lineTo(25, 40);
    critical.moveTo(29, 13);
    critical.lineTo(42, 7);
    critical.moveTo(51, 52);
    critical.lineTo(73, 43);
    critical.strokePath();
    critical.generateTexture('potassium_wall_damage_critical', 80, 62);
    critical.destroy();
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
