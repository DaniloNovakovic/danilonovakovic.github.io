import * as Phaser from 'phaser';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH
} from './config';
import { bridgeActions } from '../shared/bridge/store';
import { TextureGenerator } from './textures/TextureGenerator';
import {
  getPotassiumFireCellKey,
  type PotassiumGenericUpgradeKind as GenericUpgradeKind,
  type PotassiumSkillRank as SkillRank,
  type PotassiumWaveCell as WaveCell,
  type PotassiumEnemyKind as EnemyKind,
  type PotassiumUpgradeKind as UpgradeKind
} from './potassiumSlipWaves';
import {
  POTASSIUM_GHOST_STATUS_FIELD_LIFETIME_MS,
  resolvePotassiumPoisonTick,
  resolvePotassiumProjectileHit
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
import {
  PotassiumCommandAdapter,
  type PotassiumCommandObject
} from './potassiumSlipCommandAdapter';

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
  private commandAdapter: PotassiumCommandAdapter;

  private session: PotassiumSessionState = createPotassiumSession();
  private fireCells = new Set<string>();
  private activeBoss?: EnemySprite;
  private bossState?: PotassiumBossState;
  private rowSpawnTimers: Phaser.Time.TimerEvent[] = [];

  private onClose?: () => void;
  private isPaused: boolean = false;

  constructor() {
    super({ key: 'potassium' });
    this.projectileControl = createPotassiumProjectileControl({
      launchPad: LAUNCH_PAD,
      ...POTASSIUM_PROJECTILE_CONTROL_DEFAULTS
    });
    this.commandAdapter = new PotassiumCommandAdapter({
      getNow: () => this.time.now,
      getSession: () => this.session,
      applySessionResult: (result) => {
        this.session = result.state;
      },
      getEnemies: () => this.enemies.getChildren() as unknown as PotassiumCommandObject[],
      getProjectiles: () => [this.banana, ...(this.clones.getChildren() as ProjectileSprite[])] as PotassiumCommandObject[],
      getMainProjectile: () => this.banana as PotassiumCommandObject,
      isMainProjectile: (projectile) => projectile === this.banana,
      isMainProjectileRecalling: () => this.projectileControl.isRecalling(),
      getProjectileEffectMultiplier: (projectile) => this.getProjectileEffectMultiplier(projectile as ProjectileSprite),
      canProjectileApplyHitProcs: (projectile) => this.canProjectileApplyHitProcs(projectile as ProjectileSprite),
      getProjectileExplosionRadiusMultiplier: (projectile) => this.getProjectileExplosionRadiusMultiplier(projectile as ProjectileSprite),
      getMaxMainProjectileSpeed: () => this.getMaxBananaSpeed(),
      getSkillRank: (upgrade) => this.getSkillRank(upgrade),
      getGenericRank: (upgrade) => this.getGenericRank(upgrade),
      getExplosionRadiusMultiplier: () => this.getExplosionRadiusMultiplier(),
      setHint: (text) => bridgeActions.setSceneHintText(text),
      collectCircuit: () => bridgeActions.collectItem('circuit'),
      saveRunRecord: (record) => savePotassiumRunRecord(record),
      closeScene: () => this.onClose?.(),
      resetBoardObjects: () => this.resetBoardObjects(),
      hideMainOverlay: () => this.potassiumRenderer.hideMainOverlay(),
      clearTerminalOverlay: () => this.clearTerminalOverlay(),
      clearUpgradeChoiceOverlay: () => this.clearUpgradeChoiceOverlay(),
      spawnWave: (wave) => this.spawnWave(wave),
      spawnBossDelayed: () => this.time.delayedCall(350, () => this.spawnEnemy('boss', 0)),
      scheduleWaveRows: (rows) => this.scheduleWaveRows(rows),
      scheduleUpgradeChoices: () => this.time.delayedCall(UPGRADE_CHOICE_DELAY_MS, () => {
        if (this.session.gameState === 'PLAYING') {
          this.showUpgradeChoices();
        }
      }),
      showUpgradeChoices: (choices) => this.potassiumRenderer.showUpgradeChoices([...choices]),
      advanceWaveAfterDelay: (wave) => this.time.delayedCall(WAVE_ADVANCE_DELAY_MS, () => {
        if (this.session.gameState === 'PLAYING') {
          this.spawnWave(wave);
        }
      }),
      refreshAllProjectileVisuals: () => this.refreshAllProjectileVisuals(),
      updateHud: (hud) => this.potassiumRenderer.updateHud(hud),
      showOutcomeOverlay: (input) => this.potassiumRenderer.showOutcomeOverlay(input),
      showTerminal: (outcome) => this.createTerminalOverlay(outcome),
      stopMainProjectile: () => {
        this.banana.setVelocity(0, 0);
        this.banana.setAngularVelocity(0);
      },
      clearBoardForOutcome: () => this.clearBoardForOutcome(),
      showDamageCue: (enemy, source) => this.potassiumRenderer.showDamageCue(enemy as EnemySprite, source),
      spawnFirePatch: (x, y, effectMultiplier, lifetimeMs, scale) => this.spawnFirePatch(x, y, effectMultiplier, lifetimeMs, scale),
      showExplosionVisual: (x, y, radius) => this.showExplosionVisual(x, y, radius),
      shakeCamera: (durationMs, intensity) => this.cameras.main.shake(durationMs, intensity),
      showGhostBeam: (input) => this.potassiumRenderer.showGhostBeam(input),
      showGhostStatusField: (input) => this.potassiumRenderer.showGhostStatusField(input),
      spawnBananaClones: (count, lifetimeMs) => this.spawnBananaClones(count, lifetimeMs),
      spawnSplitterChildren: (enemy) => this.spawnSplitterChildren(enemy as EnemySprite),
      animateEnemyDeath: (enemy, onComplete) => this.animateEnemyDeath(enemy as EnemySprite, onComplete),
      spawnBossOrbitBlockers: (boss) => this.spawnBossOrbitBlockers(boss as EnemySprite),
      updateBossOrbitBlockers: (boss, time) => this.updateBossOrbitBlockers(boss as EnemySprite, time),
      setBossStoneVisual: (boss, active) => this.setBossStoneVisual(boss as EnemySprite, active),
      spawnBossSummons: (summons) => this.spawnBossSummons(summons),
      clearOrbitBlockers: () => this.bossBlockers.getChildren().forEach((gameObject) => gameObject.destroy()),
      getExplosionHits: (x, y) => (this.enemies.getChildren() as EnemySprite[]).map((enemy) => ({
        enemy: enemy as PotassiumCommandObject,
        distance: Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y)
      })),
      getGhostBeamHits: (x, y, direction) => {
        const isHorizontal = direction === 'horizontal';
        return (this.enemies.getChildren() as EnemySprite[]).map((enemy) => ({
          enemy: enemy as PotassiumCommandObject,
          inBeam: isHorizontal
            ? Math.abs(enemy.y - y) <= 28
            : Math.abs(enemy.x - x) <= 28
        }));
      }
    }, {
      arena: ARENA,
      poisonTint: POISON_TINT,
      cloneRicochetMaxSpeed: CLONE_RICOCHET_MAX_SPEED,
      bananaRicochetMinSpeed: BANANA_RICOCHET_MIN_SPEED,
      bananaRicochetBoost: BANANA_RICOCHET_BOOST,
      poisonDeathSpreadRadius: POISON_DEATH_SPREAD_RADIUS,
      ghostStatusFieldLifetimeMs: POTASSIUM_GHOST_STATUS_FIELD_LIFETIME_MS,
      ghostBeamLifetimeMs: GHOST_BEAM_LIFETIME_MS
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
    this.commandAdapter.resetCombatIds();
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
      this.commandAdapter.damageEnemy(
        enemy as EnemySprite,
        this.getProjectileEffectMultiplier(_zone as ProjectileSprite),
        'fire'
      );
    });
    this.physics.add.overlap(this.banana, this.bossBlockers, (_banana, blocker) => {
      const bossBlocker = blocker as EnemySprite;
      const context = this.commandAdapter.createCombatContext([bossBlocker], [this.banana]);
      if (this.projectileControl.isRecalling()) {
        this.commandAdapter.applyCombatCommands([{
          type: 'boostRecallVelocity',
          projectileId: this.banana.getData('combatId') as string
        }], context);
        return;
      }
      this.commandAdapter.applyCombatCommands([{
        type: 'ricochetProjectile',
        projectileId: this.banana.getData('combatId') as string,
        enemyId: bossBlocker.getData('combatId') as string
      }], context);
    });
    this.physics.add.overlap(this.clones, this.bossBlockers, (clone, blocker) => {
      const projectile = clone as ProjectileSprite;
      const bossBlocker = blocker as EnemySprite;
      const context = this.commandAdapter.createCombatContext([bossBlocker], [projectile]);
      this.commandAdapter.applyCombatCommands([{
        type: 'ricochetProjectile',
        projectileId: projectile.getData('combatId') as string,
        enemyId: bossBlocker.getData('combatId') as string
      }], context);
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
    this.commandAdapter.resetCombatIds();
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
    this.commandAdapter.applySessionResult({
      state: result.state,
      commands: [...result.commands]
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

  private scheduleWaveRows(rows: readonly WaveCell[][]): void {
    this.clearScheduledWaveRows();
    rows.forEach((row, rowIndex) => {
      const timer = this.time.delayedCall(rowIndex * this.getRowSpawnDelayMs(), () => {
        this.rowSpawnTimers = this.rowSpawnTimers.filter((entry) => entry !== timer);
        this.spawnEnemyRow(row, rowIndex);
      });
      this.rowSpawnTimers.push(timer);
    });
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

    this.commandAdapter.applyCombatCommands(resolvePotassiumProjectileHit({
      now: this.time.now,
      enemy: this.commandAdapter.getEnemyCombatFacts(enemy),
      projectile: this.commandAdapter.getProjectileCombatFacts(projectile),
      skillRanks: this.session.skillRanks,
      genericRanks: this.session.genericRanks
    }), this.commandAdapter.createCombatContext([enemy], [projectile]));
  }

  private animateEnemyDeath(enemy: EnemySprite, onComplete: () => void): void {
    this.tweens.add({
      targets: enemy,
      angle: enemy.angle + 720,
      scale: 0,
      alpha: 0,
      duration: 260,
      ease: 'Back.easeIn',
      onComplete
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
      this.commandAdapter.applyCombatCommands(resolvePotassiumPoisonTick({
        now: time,
        enemy: this.commandAdapter.getEnemyCombatFacts(enemy),
        poisonUnlocked: this.getSkillRank('poison') > 0
      }), this.commandAdapter.createCombatContext([enemy]));
    });
  }

  private showExplosionVisual(x: number, y: number, radius: number): void {
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
  }

  private updateBossFight(time: number): void {
    const boss = this.activeBoss;
    const result = resolvePotassiumBossFrame({
      now: time,
      state: this.bossState,
      boss: boss ? this.commandAdapter.getBossFacts(boss) : undefined,
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
    this.commandAdapter.applyBossCommands(result.commands, boss);
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
