import * as Phaser from 'phaser';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH
} from './config';
import { bridgeActions } from '../shared/bridge/store';
import { TextureGenerator } from './textures/TextureGenerator';
import {
  getPotassiumExplosionRadius,
  getPotassiumFireCellKey,
  type PotassiumShieldSide as ShieldSide,
  type PotassiumGenericUpgradeKind as GenericUpgradeKind,
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
  type PotassiumRunOutcome
} from './potassiumSlipLeaderboard';
import {
  PotassiumSlipRenderer
} from './potassiumSlipRenderer';
import {
  createPotassiumBossState,
  POTASSIUM_BOSS_PHASE_1_DRIFT,
  POTASSIUM_BOSS_PATROL_SPEED,
  resolvePotassiumBossFrame,
  type PotassiumBossCommand,
  type PotassiumBossFacts,
  type PotassiumBossState,
  type PotassiumBossSummonFacts
} from './potassiumSlipBoss';
import {
  createPotassiumSession,
  getPotassiumSessionGenericRank,
  getPotassiumSessionHud,
  getPotassiumSessionSkillRank,
  markPotassiumRowSpawned,
  resolvePotassiumDraftChoice,
  resolvePotassiumDevSkipWave,
  resolvePotassiumEnemyEscaped,
  resolvePotassiumEnemyKilled,
  resolvePotassiumTerminalAction,
  resolvePotassiumWaveClear,
  showPotassiumDraftChoices,
  spawnPotassiumWave,
  startPotassiumCampaign,
  startPotassiumEndless,
  type PotassiumSessionCommand,
  type PotassiumSessionState
} from './potassiumSlipSession';
import {
  getPotassiumEnemyConfig,
  POTASSIUM_NON_BOSS_ENEMY_SPEED,
  resolvePotassiumEnemySetupFacts,
  resolvePotassiumEnemySpawnFacts,
  resolvePotassiumSplitterChildFacts
} from './potassiumSlipEnemyFactory';
import {
  createPotassiumProjectileControl,
  POTASSIUM_PROJECTILE_CONTROL_DEFAULTS,
  type PotassiumProjectileControl,
  type PotassiumProjectileControlCommand
} from './potassiumSlipProjectileControl';

type EnemySprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
type ProjectileSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

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

const LAUNCH_MAX_DRAG = POTASSIUM_PROJECTILE_CONTROL_DEFAULTS.launchMaxDrag;
const HIT_COOLDOWN_MS = 180;
const WAVE_ADVANCE_DELAY_MS = 900;
const SIDE_BOUNCE_MARGIN = 32;
const BANANA_RICOCHET_MIN_SPEED = 360;
const BANANA_RICOCHET_BOOST = 1.08;
const CLONE_RICOCHET_MAX_SPEED = 660;
const ROW_SPAWN_DELAY_MS = 900;
const MID_GAME_ROW_SPAWN_DELAY_MS = 1050;
const TRAIL_DROP_INTERVAL_MS = 180;
const FIRE_TRAIL_LIFETIME_MS = 1500;
const GHOST_BEAM_LIFETIME_MS = 190;
const UPGRADE_CHOICE_DELAY_MS = 450;
const POISON_TINT = 0x65a30d;
const CLONE_EFFECT_MULTIPLIER = 0.5;
const POISON_DEATH_SPREAD_RADIUS = 76;
const CELL_FIRE_ROW_HEIGHT = 48;
const BOSS_ORBIT_RADIUS = 78;
const BOSS_ORBIT_SPEED = 0.0017;

export class PotassiumSlipScene extends Phaser.Scene {
  private banana!: ProjectileSprite;
  private enemies!: Phaser.Physics.Arcade.Group;
  private clones!: Phaser.Physics.Arcade.Group;
  private trailZones!: Phaser.Physics.Arcade.Group;
  private bossBlockers!: Phaser.Physics.Arcade.Group;
  private aimLine!: Phaser.GameObjects.Graphics;
  private tetherLine!: Phaser.GameObjects.Graphics;
  private potassiumRenderer!: PotassiumSlipRenderer;
  private projectileControl: PotassiumProjectileControl;

  private session: PotassiumSessionState = createPotassiumSession();
  private fireCells = new Set<string>();
  private activeBoss?: EnemySprite;
  private bossState?: PotassiumBossState;
  private rowSpawnTimers: Phaser.Time.TimerEvent[] = [];
  private combatIdCounter: number = 0;

  private onClose?: () => void;
  private isPaused: boolean = false;

  constructor() {
    super({ key: 'potassium' });
    this.projectileControl = createPotassiumProjectileControl({
      launchPad: LAUNCH_PAD,
      ...POTASSIUM_PROJECTILE_CONTROL_DEFAULTS
    });
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
    this.potassiumRenderer = new PotassiumSlipRenderer(this, {
      arena: ARENA,
      safe: SAFE,
      launchPad: LAUNCH_PAD
    });
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

    if (this.session.gameState !== 'PLAYING') {
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
    this.session = createPotassiumSession();
    this.projectileControl.reset();
    this.combatIdCounter = 0;
    this.bossState = undefined;
    this.fireCells.clear();
  }

  private createPotassiumTextures(): void {
    this.potassiumRenderer.ensureTextures();
  }

  private drawField(): void {
    this.potassiumRenderer.drawField();
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
    this.potassiumRenderer.createHud();
    this.updateHud();
  }

  private createOverlays(): void {
    this.potassiumRenderer.createStartOverlay();
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
      if (this.projectileControl.isRecalling()) {
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
      if (this.session.gameState === 'UPGRADE') {
        this.handleUpgradeChoicePointer(pointer);
        return;
      }
      if (this.session.gameState === 'START') {
        this.startGame();
        return;
      }
      if (this.session.gameState === 'WON' || this.session.gameState === 'GAME_OVER') {
        this.handleTerminalPointer(pointer);
        return;
      }
      if (this.session.gameState !== 'PLAYING') return;
      if (this.isBananaInLaunchZone()) {
        this.beginAiming(pointer);
      } else {
        this.beginRecall(pointer);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.projectileControl.getSnapshot().pointerId !== pointer.id) return;
      if (this.projectileControl.isAiming()) {
        this.releaseBanana(pointer);
      } else if (this.projectileControl.isRecalling()) {
        this.cancelControl();
        this.setBananaRecallVisual(false);
      }
    });

    this.input.keyboard?.on('keydown-E', () => {
      if (this.session.gameState === 'WON' || this.session.gameState === 'GAME_OVER') {
        this.onClose?.();
      }
    });

    this.input.keyboard?.on('keydown-R', () => {
      if (this.session.gameState === 'WON' || this.session.gameState === 'GAME_OVER') {
        this.startGame();
      }
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.session.gameState === 'WON') {
        this.startEndlessMode();
      }
    });

    if (import.meta.env.DEV) {
      this.input.keyboard?.on('keydown-N', () => {
        this.skipCurrentWaveForDev();
      });
    }

    this.input.keyboard?.on('keydown-ESC', () => {
      this.onClose?.();
    });
  }

  private startGame(): void {
    this.projectileControl.reset();
    this.combatIdCounter = 0;
    this.applySessionResult(startPotassiumCampaign(this.session));
  }

  private startEndlessMode(): void {
    this.applySessionResult(startPotassiumEndless(this.session));
  }

  private skipCurrentWaveForDev(): void {
    if (this.session.gameState !== 'PLAYING') return;
    const result = resolvePotassiumDevSkipWave(this.session);
    if (result.commands.length === 0) return;
    this.cancelControl();
    this.clearScheduledWaveRows();
    this.enemies.clear(true, true);
    this.bossBlockers.clear(true, true);
    this.activeBoss = undefined;
    this.bossState = undefined;
    this.applySessionResult(result);
  }

  private applySessionResult(result: { state: PotassiumSessionState; commands: readonly PotassiumSessionCommand[] }): void {
    this.session = result.state;
    this.applySessionCommands(result.commands);
  }

  private applySessionCommands(commands: readonly PotassiumSessionCommand[]): void {
    commands.forEach((command) => {
      if (command.type === 'resetBoard') {
        this.resetBoardObjects();
      } else if (command.type === 'hideMainOverlay') {
        this.potassiumRenderer.hideMainOverlay();
      } else if (command.type === 'clearTerminal') {
        this.clearTerminalOverlay();
      } else if (command.type === 'clearUpgradeChoices') {
        this.clearUpgradeChoiceOverlay();
      } else if (command.type === 'setHint') {
        bridgeActions.setSceneHintText(command.text);
      } else if (command.type === 'spawnWave') {
        this.spawnWave(command.wave);
      } else if (command.type === 'spawnBoss') {
        this.time.delayedCall(350, () => this.spawnEnemy('boss', 0));
      } else if (command.type === 'scheduleWaveRows') {
        this.clearScheduledWaveRows();
        command.rows.forEach((row, rowIndex) => {
          const timer = this.time.delayedCall(rowIndex * this.getRowSpawnDelayMs(), () => {
            this.rowSpawnTimers = this.rowSpawnTimers.filter((entry) => entry !== timer);
            this.spawnEnemyRow(row, rowIndex);
          });
          this.rowSpawnTimers.push(timer);
        });
      } else if (command.type === 'scheduleUpgradeChoices') {
        this.time.delayedCall(UPGRADE_CHOICE_DELAY_MS, () => {
          if (this.session.gameState === 'PLAYING') {
            this.showUpgradeChoices();
          }
        });
      } else if (command.type === 'showUpgradeChoices') {
        this.potassiumRenderer.showUpgradeChoices([...command.choices]);
      } else if (command.type === 'advanceWaveAfterDelay') {
        this.time.delayedCall(WAVE_ADVANCE_DELAY_MS, () => {
          if (this.session.gameState === 'PLAYING') {
            this.spawnWave(command.wave);
          }
        });
      } else if (command.type === 'refreshProjectileVisuals') {
        this.refreshAllProjectileVisuals();
      } else if (command.type === 'updateHud') {
        this.potassiumRenderer.updateHud(command.hud);
      } else if (command.type === 'collectCircuit') {
        bridgeActions.collectItem('circuit');
      } else if (command.type === 'saveRunRecord') {
        savePotassiumRunRecord(command.record);
      } else if (command.type === 'showOutcome') {
        this.potassiumRenderer.showOutcomeOverlay({
          title: command.title,
          score: command.score,
          titleFontSize: command.titleFontSize
        });
      } else if (command.type === 'showTerminal') {
        this.createTerminalOverlay(command.outcome);
      } else if (command.type === 'closeScene') {
        this.onClose?.();
      } else if (command.type === 'stopBanana') {
        this.banana.setVelocity(0, 0);
        this.banana.setAngularVelocity(0);
      } else if (command.type === 'clearBoardForOutcome') {
        this.clearBoardForOutcome();
      }
    });
  }

  private resetBoardObjects(): void {
    this.clearScheduledWaveRows();
    this.destroyProjectileVisuals(this.banana);
    this.destroyAllCloneVisuals();
    this.enemies?.clear(true, true);
    this.clones?.clear(true, true);
    this.trailZones?.clear(true, true);
    this.bossBlockers?.clear(true, true);
    this.activeBoss = undefined;
    this.bossState = undefined;
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

  private clearBoardForOutcome(): void {
    this.setBananaRecallVisual(false);
    this.clearScheduledWaveRows();
    this.destroyAllCloneVisuals();
    this.enemies.clear(true, true);
    this.clones.clear(true, true);
    this.trailZones.clear(true, true);
    this.bossBlockers.clear(true, true);
    this.bossState = undefined;
    this.banana.setVelocity(0, 0);
  }

  private beginAiming(pointer: Phaser.Input.Pointer, pointerId: number = pointer.id): void {
    void pointer;
    this.applyProjectileControlCommands(this.projectileControl.beginAiming(pointerId));
  }

  private beginRecall(pointer: Phaser.Input.Pointer): void {
    this.applyProjectileControlCommands(this.projectileControl.beginRecall(pointer.id));
  }

  private releaseBanana(pointer: Phaser.Input.Pointer): void {
    this.applyProjectileControlCommands(this.projectileControl.release({
      pointer: { x: pointer.x, y: pointer.y },
      banana: { x: this.banana.x, y: this.banana.y },
      maxSpeed: this.getMaxBananaSpeed()
    }));
  }

  private cancelControl(): void {
    this.applyProjectileControlCommands(this.projectileControl.cancel());
  }

  private setBananaRecallVisual(active: boolean): void {
    this.banana.setData('recallVisual', active);
    this.banana.setBounce(active ? 0.15 : 1, active ? 0.15 : 1);
    this.refreshBananaUpgradeVisuals(this.banana);
  }

  private applyProjectileControlCommands(commands: readonly PotassiumProjectileControlCommand[]): void {
    commands.forEach((command) => {
      if (command.type === 'clearAim') {
        this.aimLine.clear();
      } else if (command.type === 'clearTether') {
        this.tetherLine.clear();
      } else if (command.type === 'drawAim') {
        this.drawAimArrow(command.from.x, command.from.y, command.to.x, command.to.y);
      } else if (command.type === 'drawRecallTether') {
        this.drawRecallTether();
      } else if (command.type === 'setRecallVisual') {
        this.setBananaRecallVisual(command.active);
      } else if (command.type === 'resetBananaForAim') {
        this.banana.setPosition(LAUNCH_PAD.x, LAUNCH_PAD.y);
        this.banana.setVelocity(0, 0);
        this.banana.setAngularVelocity(0);
        this.banana.setData('canDuplicate', true);
        this.banana.setData('nextTrailDropAt', 0);
        this.banana.setData('effectMultiplier', 1);
        this.banana.setData('canApplyHitProcs', true);
      } else if (command.type === 'setBananaPosition') {
        this.banana.setPosition(command.x, command.y);
      } else if (command.type === 'setBananaVelocity') {
        this.banana.setVelocity(command.x, command.y);
      } else if (command.type === 'setBananaAngularVelocity') {
        this.banana.setAngularVelocity(command.value);
      } else if (command.type === 'setBananaAngularVelocityFromX') {
        this.banana.setAngularVelocity(Phaser.Math.Clamp(
          this.banana.body.velocity.x * command.multiplier,
          command.min,
          command.max
        ));
      } else if (command.type === 'setBananaAngularVelocityRandom') {
        this.banana.setAngularVelocity(Phaser.Math.Between(command.min, command.max));
      } else if (command.type === 'moveBananaToLaunchPad') {
        this.physics.moveTo(this.banana, LAUNCH_PAD.x, LAUNCH_PAD.y, command.speed);
      }
    });
  }

  private updateControlState(): void {
    const pointer = this.input.activePointer;
    this.applyProjectileControlCommands(this.projectileControl.update({
      banana: { x: this.banana.x, y: this.banana.y },
      velocity: { x: this.banana.body.velocity.x, y: this.banana.body.velocity.y },
      activePointer: { id: pointer.id, x: pointer.x, y: pointer.y }
    }));
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
    this.applyProjectileControlCommands(this.projectileControl.applyIdleDrag({
      velocity: { x: this.banana.body.velocity.x, y: this.banana.body.velocity.y },
      deltaMs: delta
    }));
  }

  private isBananaInLaunchZone(radius: number = LAUNCH_PAD.radius): boolean {
    return this.projectileControl.isInLaunchZone(this.banana, radius);
  }

  private getMaxBananaSpeed(): number {
    return POTASSIUM_PROJECTILE_CONTROL_DEFAULTS.mainMaxSpeed * (1 + this.getGenericRank('bananaSpeed') * 0.05);
  }

  private getSkillRank(upgrade: UpgradeKind): SkillRank {
    return getPotassiumSessionSkillRank(this.session, upgrade);
  }

  private getGenericRank(upgrade: GenericUpgradeKind): number {
    return getPotassiumSessionGenericRank(this.session, upgrade);
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
    this.potassiumRenderer.refreshProjectileVisuals(projectile, this.session.skillRanks, {
      isClone: options.isClone,
      isMain: projectile === this.banana,
      isRecall: projectile === this.banana && ((projectile.getData('recallVisual') as boolean | undefined) ?? false)
    });
  }

  private updateBananaUpgradeVisualPositions(): void {
    this.potassiumRenderer.positionProjectileVisuals(this.banana);
    this.clones.getChildren().forEach((gameObject) => {
      this.potassiumRenderer.positionProjectileVisuals(gameObject as ProjectileSprite);
    });
  }

  private destroyProjectileVisuals(projectile?: ProjectileSprite): void {
    this.potassiumRenderer.destroyProjectileVisuals(projectile);
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
    this.cancelControl();
    this.clearScheduledWaveRows();
    this.applySessionResult(spawnPotassiumWave(this.session, waveNumber));
  }

  private clearScheduledWaveRows(): void {
    this.rowSpawnTimers.forEach((timer) => timer.remove(false));
    this.rowSpawnTimers = [];
  }

  private getRowSpawnDelayMs(): number {
    return this.session.wave >= 5 && this.session.wave <= 6
      ? MID_GAME_ROW_SPAWN_DELAY_MS
      : ROW_SPAWN_DELAY_MS;
  }

  private spawnEnemyRow(row: readonly WaveCell[], rowIndex: number = 0): void {
    if (this.session.gameState !== 'PLAYING') return;
    this.applySessionResult(markPotassiumRowSpawned(this.session));
    row.forEach((kind, columnIndex) => {
      if (kind === null) return;
      this.spawnEnemy(kind, columnIndex, rowIndex);
    });
  }

  private spawnEnemy(kind: EnemyKind, columnIndex: number = 0, rowIndex: number = 0, yOverride?: number): EnemySprite | undefined {
    if (this.session.gameState !== 'PLAYING') return;
    const spawn = resolvePotassiumEnemySpawnFacts({
      layout: {
        arenaLeft: ARENA.left,
        arenaRight: ARENA.right,
        safeTop: SAFE.top
      },
      kind,
      columnIndex,
      yOverride
    });
    const enemy = this.enemies.create(spawn.x, spawn.y, spawn.texture) as EnemySprite;
    this.configureEnemy(enemy, kind, this.session.wave, columnIndex, rowIndex);

    if (kind === 'boss') {
      this.activeBoss = enemy;
      this.bossState = createPotassiumBossState(this.time.now);
      enemy.once(Phaser.GameObjects.Events.DESTROY, () => {
        if (this.activeBoss === enemy) {
          this.activeBoss = undefined;
          this.bossState = undefined;
        }
      });
      enemy.setPosition(LAUNCH_PAD.x, SAFE.top + 132);
      enemy.setVelocity(POTASSIUM_BOSS_PATROL_SPEED, POTASSIUM_BOSS_PHASE_1_DRIFT);
      enemy.setBounce(1, 1);
      this.cameras.main.shake(250, 0.008);
    } else {
      enemy.setVelocity(0, POTASSIUM_NON_BOSS_ENEMY_SPEED);
    }
    return enemy;
  }

  private configureEnemy(enemy: EnemySprite, kind: EnemyKind, wave: number, columnIndex: number, rowIndex: number): void {
    const setup = resolvePotassiumEnemySetupFacts({ kind, wave, columnIndex, rowIndex });
    enemy.setDepth(setup.depth);
    enemy.setScale(setup.scale);
    enemy.body.setAllowGravity(false);
    enemy.setBounce(1, 1);
    Object.entries(setup.data).forEach(([key, value]) => {
      enemy.setData(key, value);
    });
    this.potassiumRenderer.createEnemyAttachments(enemy, setup.attachment);
    if (setup.angularVelocityRange) {
      enemy.setAngularVelocity(
        Phaser.Math.Between(setup.angularVelocityRange.min, setup.angularVelocityRange.max)
      );
    }
    if (setup.immovable) {
      enemy.setImmovable(true);
    }
    if (setup.bodyProfile && enemy.body) {
      enemy.body.setSize(setup.bodyProfile.width, setup.bodyProfile.height, true);
    }
  }

  private hitEnemy(enemy: EnemySprite, projectile: ProjectileSprite, hitKey: string): void {
    if (this.session.gameState !== 'PLAYING' || !enemy.active) return;
    const cooldownKey = `hitUntil:${hitKey}`;
    const hitUntil = enemy.getData(cooldownKey) as number | undefined;
    if (hitUntil !== undefined && hitUntil > this.time.now) return;
    enemy.setData(cooldownKey, this.time.now + HIT_COOLDOWN_MS);

    this.applyCombatCommands(resolvePotassiumProjectileHit({
      now: this.time.now,
      enemy: this.getEnemyCombatFacts(enemy),
      projectile: this.getProjectileCombatFacts(projectile),
      skillRanks: this.session.skillRanks,
      genericRanks: this.session.genericRanks
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
      isRecall: projectile === this.banana && this.projectileControl.isRecalling(),
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
      skillRanks: this.session.skillRanks,
      genericRanks: this.session.genericRanks
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
    this.potassiumRenderer.showDamageCue(enemy, source);
  }

  private killEnemy(enemy: EnemySprite): void {
    const kind = enemy.getData('kind') as EnemyKind;
    const config = getPotassiumEnemyConfig(kind);
    enemy.setData('dying', true);
    const damageCueTween = enemy.getData('damageCueTween') as Phaser.Tweens.Tween | undefined;
    damageCueTween?.stop();
    enemy.body.enable = false;
    const killResult = resolvePotassiumEnemyKilled(this.session, config.score, kind);
    if (kind !== 'boss') {
      this.applySessionResult(killResult);
    }

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
          this.applySessionResult(killResult);
        }
      }
    });
  }

  private spawnSplitterChildren(enemy: EnemySprite): void {
    if (!enemy.getData('splitsOnDeath')) return;
    const columnIndex = (enemy.getData('columnIndex') as number | undefined) ?? 2;
    const rowIndex = ((enemy.getData('rowIndex') as number | undefined) ?? 0) + 1;
    const occupiedColumns = (enemy.getData('occupiedColumns') as number[] | undefined) ?? [columnIndex];
    occupiedColumns
      .forEach((column) => {
        const child = this.spawnEnemy('intern', column, rowIndex, enemy.y + 26);
        if (!child) return;
        const childFacts = resolvePotassiumSplitterChildFacts({
          hp: (child.getData('hp') as number | undefined) ?? 1
        });
        child.setScale(childFacts.scale);
        child.setData('hp', childFacts.hp);
        child.setData('maxHp', childFacts.hp);
        child.setVelocity(0, childFacts.speed);
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
        const visuals = clone.getData('bananaVisuals') as {
          behind?: Phaser.GameObjects.Graphics;
          front?: Phaser.GameObjects.Graphics;
        } | undefined;
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
      skillRanks: this.session.skillRanks,
      genericRanks: this.session.genericRanks
    }), this.createCombatContext(enemies));
    this.cameras.main.shake(130, 0.006);
  }

  private spawnGhostBeam(x: number, y: number, direction: 'horizontal' | 'vertical', effectMultiplier: number): void {
    const isHorizontal = direction === 'horizontal';
    this.potassiumRenderer.showGhostBeam({ x, y, direction, durationMs: GHOST_BEAM_LIFETIME_MS });
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
      skillRanks: this.session.skillRanks,
      genericRanks: this.session.genericRanks
    }), this.createCombatContext(enemies));
  }

  private spawnGhostStatusField(
    x: number,
    y: number,
    direction: PotassiumGhostBeamDirection,
    effectMultiplier: number
  ): void {
    const isHorizontal = direction === 'horizontal';
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
      this.potassiumRenderer.showGhostStatusField({
        x,
        y,
        direction,
        poisonActive: true,
        durationMs: POTASSIUM_GHOST_STATUS_FIELD_LIFETIME_MS
      });
    }
  }

  private updateBossFight(time: number): void {
    const boss = this.activeBoss;
    const result = resolvePotassiumBossFrame({
      now: time,
      state: this.bossState,
      boss: boss ? this.getBossFacts(boss) : undefined,
      patrolBounds: {
        left: SAFE.left + 42,
        right: SAFE.right - 42
      },
      summonLayout: {
        arenaLeft: ARENA.left,
        arenaWidth: ARENA.width,
        safeTop: SAFE.top,
        safeBottom: SAFE.bottom
      }
    });
    this.bossState = result.state;
    this.applyBossCommands(result.commands, boss);
  }

  private getBossFacts(boss: EnemySprite): PotassiumBossFacts {
    return {
      active: boss.active,
      dying: Boolean(boss.getData('dying')),
      hp: (boss.getData('hp') as number | undefined) ?? 0,
      maxHp: (boss.getData('maxHp') as number | undefined) ?? 0,
      x: boss.x,
      y: boss.y,
      velocityX: boss.body.velocity.x
    };
  }

  private applyBossCommands(commands: readonly PotassiumBossCommand[], boss?: EnemySprite): void {
    commands.forEach((command) => {
      if (command.type === 'setBossPhase') {
        boss?.setData('bossPhase', command.phase);
      } else if (command.type === 'setBossVelocity') {
        if (!boss) return;
        if (command.x !== undefined) boss.setX(command.x);
        if (command.velocityX !== undefined) boss.setVelocityX(command.velocityX);
        boss.setVelocityY(command.velocityY);
      } else if (command.type === 'setBossHint') {
        bridgeActions.setSceneHintText(command.text);
      } else if (command.type === 'shakeCamera') {
        this.cameras.main.shake(command.durationMs, command.intensity);
      } else if (command.type === 'spawnOrbitBlockers') {
        if (boss) this.spawnBossOrbitBlockers(boss);
      } else if (command.type === 'updateOrbitBlockers') {
        if (boss) this.updateBossOrbitBlockers(boss, command.now);
      } else if (command.type === 'startStone') {
        boss?.setData('stoneUntil', command.stoneUntil);
      } else if (command.type === 'endStone') {
        boss?.setData('stoneUntil', undefined);
      } else if (command.type === 'setStoneVisual') {
        if (boss) this.setBossStoneVisual(boss, command.active);
      } else if (command.type === 'spawnSummons') {
        this.spawnBossSummons(command.summons);
      } else if (command.type === 'clearOrbitBlockers') {
        this.bossBlockers.getChildren().forEach((gameObject) => gameObject.destroy());
      }
    });
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

  private spawnBossSummons(summons: readonly PotassiumBossSummonFacts[]): void {
    summons.forEach((summon) => {
      const enemy = this.spawnEnemy(summon.kind, summon.column, 0, summon.y);
      enemy?.setVelocity(0, summon.velocityY);
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
    this.cameras.main.shake(320, 0.014);
    this.applySessionResult(resolvePotassiumEnemyEscaped(this.session, 'boss'));
  }

  private handleEnemyEscape(enemy: EnemySprite): void {
    const kind = enemy.getData('kind') as EnemyKind;
    enemy.destroy();
    this.cameras.main.shake(180, 0.008);
    this.applySessionResult(resolvePotassiumEnemyEscaped(this.session, kind));
  }

  private checkWaveClear(): void {
    const hasLivingEnemies = this.enemies.getChildren().some((gameObject) => {
      const enemy = gameObject as EnemySprite;
      return enemy.active && !enemy.getData('dying');
    });
    this.applySessionResult(resolvePotassiumWaveClear({
      state: this.session,
      hasLivingEnemies
    }));
  }

  private showUpgradeChoices(): void {
    this.applySessionResult(showPotassiumDraftChoices(this.session));
  }

  private handleUpgradeChoicePointer(pointer: Phaser.Input.Pointer): void {
    const choice = this.potassiumRenderer.getUpgradeChoiceAt(pointer.x, pointer.y);
    if (!choice) return;
    this.applySessionResult(resolvePotassiumDraftChoice(this.session, choice));
  }

  private clearUpgradeChoiceOverlay(): void {
    this.potassiumRenderer.clearUpgradeChoices();
  }

  private updateEnemyVisuals(): void {
    this.enemies.getChildren().forEach((gameObject) => {
      this.potassiumRenderer.positionEnemyAttachments(gameObject as EnemySprite);
    });
  }

  private updateHud(): void {
    this.potassiumRenderer.updateHud(getPotassiumSessionHud(this.session));
  }

  private createTerminalOverlay(outcome: PotassiumRunOutcome): void {
    this.potassiumRenderer.showTerminal(outcome, this.getRecordsOverlayText());
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
    const action = this.potassiumRenderer.getTerminalActionAt(pointer.x, pointer.y);
    if (!action) return;
    this.applySessionResult(resolvePotassiumTerminalAction(this.session, action));
  }

  private clearTerminalOverlay(): void {
    this.potassiumRenderer.clearTerminal();
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
