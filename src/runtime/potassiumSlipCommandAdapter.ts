import {
  POTASSIUM_POISON_DURATION_MS,
  POTASSIUM_POISON_TICK_INTERVAL_MS,
  resolvePotassiumDamage,
  resolvePotassiumExplosion,
  resolvePotassiumGhostBeam,
  type PotassiumApplyPoisonCommand,
  type PotassiumCombatCommand,
  type PotassiumDamageSource,
  type PotassiumEnemyCombatFacts,
  type PotassiumGhostBeamDirection,
  type PotassiumProjectileCombatFacts
} from './potassiumSlipCombat';
import { getPotassiumEnemyConfig } from './potassiumSlipEnemyFactory';
import type {
  PotassiumRunRecord,
  PotassiumRunOutcome
} from './potassiumSlipLeaderboard';
import {
  resolvePotassiumEnemyKilled,
  type PotassiumSessionCommand,
  type PotassiumSessionResult,
  type PotassiumSessionState
} from './potassiumSlipSession';
import type {
  PotassiumBossCommand,
  PotassiumBossFacts,
  PotassiumBossSummonFacts
} from './potassiumSlipBoss';
import type {
  PotassiumDraftChoiceView,
  PotassiumHudFacts
} from './potassiumSlipSession';
import {
  getPotassiumExplosionRadius,
  type PotassiumEnemyKind,
  type PotassiumGenericUpgradeKind,
  type PotassiumScheduledWaveRow,
  type PotassiumSkillRank,
  type PotassiumUpgradeKind
} from './potassiumSlipWaves';
import {
  canPotassiumProjectileApplyHitProcs,
  canPotassiumProjectileDuplicate,
  getPotassiumCombatId,
  getPotassiumData,
  getPotassiumEnemyHp,
  getPotassiumEnemyKind,
  getPotassiumEnemyMaxHp,
  getPotassiumProjectileEffectMultiplier,
  getPotassiumShieldSide,
  isPotassiumEnemyDying,
  isPotassiumProjectileRecallVisual,
  POTASSIUM_DATA_KEYS,
  setPotassiumCombatId,
  setPotassiumData,
  setPotassiumEnemyDying,
  setPotassiumEnemyHealth
} from './potassiumSlipPhaserData';

export interface PotassiumCommandBody {
  velocity: { x: number; y: number };
  enable?: boolean;
  setAllowGravity?: (allow: boolean) => unknown;
  setImmovable?: (immovable: boolean) => unknown;
  setSize?: (width: number, height: number, center?: boolean) => unknown;
}

export interface PotassiumCommandObject {
  x: number;
  y: number;
  angle: number;
  active: boolean;
  body: PotassiumCommandBody;
  getData(key: string): unknown;
  setData(key: string, value: unknown): unknown;
  setTint(color: number): unknown;
  clearTint(): unknown;
  setVelocity(x: number, y: number): unknown;
  setVelocityX(x: number): unknown;
  setVelocityY(y: number): unknown;
  setAngularVelocity?(velocity: number): unknown;
  setPosition(x: number, y: number): unknown;
  setX(x: number): unknown;
  setAngle(angle: number): unknown;
  setScale(scale: number): unknown;
  destroy(): unknown;
}

export interface PotassiumCombatContext {
  enemies: Map<string, PotassiumCommandObject>;
  projectiles: Map<string, PotassiumCommandObject>;
}

export interface PotassiumCommandAdapterRuntimePorts {
  getNow(): number;
  getSession(): PotassiumSessionState;
  applySessionResult(result: PotassiumSessionResult): void;
  getSkillRank(upgrade: PotassiumUpgradeKind): number;
  getGenericRank(upgrade: PotassiumGenericUpgradeKind): number;
  setHint(text: string | null): void;
  collectCircuit(): void;
  saveRunRecord(record: PotassiumRunRecord): void;
  closeScene(): void;
}

export interface PotassiumCommandAdapterObjectPorts {
  getEnemies(): PotassiumCommandObject[];
  getProjectiles(): PotassiumCommandObject[];
  getMainProjectile(): PotassiumCommandObject;
  isMainProjectile(projectile: PotassiumCommandObject): boolean;
  isMainProjectileRecalling(): boolean;
  getProjectileExplosionRadiusMultiplier(projectile: PotassiumCommandObject): number;
  getMaxMainProjectileSpeed(): number;
  getExplosionRadiusMultiplier(): number;
  getExplosionHits(x: number, y: number): Array<{ enemy: PotassiumCommandObject; distance: number }>;
  getGhostBeamHits(
    x: number,
    y: number,
    direction: PotassiumGhostBeamDirection
  ): Array<{ enemy: PotassiumCommandObject; inBeam: boolean }>;
}

export interface PotassiumCommandAdapterBoardPorts {
  resetBoardObjects(): void;
  spawnWave(wave: number): void;
  spawnBossDelayed(): void;
  scheduleWaveRows(schedule: readonly PotassiumScheduledWaveRow[]): void;
  scheduleUpgradeChoices(): void;
  advanceWaveAfterDelay(wave: number): void;
  stopMainProjectile(): void;
  clearBoardForOutcome(): void;
  spawnFirePatch(x: number, y: number, effectMultiplier: number, lifetimeMs: number, scale: number): void;
  spawnBananaClones(count: number, lifetimeMs: number): void;
  spawnSplitterChildren(enemy: PotassiumCommandObject): void;
  spawnBossOrbitBlockers(boss: PotassiumCommandObject): void;
  updateBossOrbitBlockers(boss: PotassiumCommandObject, time: number): void;
  setBossStoneVisual(boss: PotassiumCommandObject, active: boolean): void;
  spawnBossSummons(summons: readonly PotassiumBossSummonFacts[]): void;
  clearOrbitBlockers(): void;
}

export interface PotassiumCommandAdapterRendererPorts {
  hideMainOverlay(): void;
  clearTerminalOverlay(): void;
  clearUpgradeChoiceOverlay(): void;
  showUpgradeChoices(choices: readonly PotassiumDraftChoiceView[]): void;
  refreshAllProjectileVisuals(): void;
  updateHud(hud: PotassiumHudFacts): void;
  showOutcomeOverlay(input: { title: string; score: number; titleFontSize: number }): void;
  showTerminal(outcome: PotassiumRunOutcome): void;
  showDamageCue(enemy: PotassiumCommandObject, source: PotassiumDamageSource): void;
  showExplosionVisual(x: number, y: number, radius: number): void;
  shakeCamera(durationMs: number, intensity: number): void;
  showGhostBeam(input: {
    x: number;
    y: number;
    direction: PotassiumGhostBeamDirection;
    durationMs: number;
  }): void;
  showGhostStatusField(input: {
    x: number;
    y: number;
    direction: PotassiumGhostBeamDirection;
    poisonActive: boolean;
    durationMs: number;
  }): void;
  animateEnemyDeath(enemy: PotassiumCommandObject, onComplete: () => void): void;
}

export interface PotassiumCommandAdapterPorts {
  runtime: PotassiumCommandAdapterRuntimePorts;
  objects: PotassiumCommandAdapterObjectPorts;
  board: PotassiumCommandAdapterBoardPorts;
  renderer: PotassiumCommandAdapterRendererPorts;
}

interface PotassiumCommandAdapterFlatPorts
  extends PotassiumCommandAdapterRuntimePorts,
    PotassiumCommandAdapterObjectPorts,
    PotassiumCommandAdapterBoardPorts,
    PotassiumCommandAdapterRendererPorts {}

export interface PotassiumCommandAdapterOptions {
  arena: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  poisonTint: number;
  cloneRicochetMaxSpeed: number;
  bananaRicochetMinSpeed: number;
  bananaRicochetBoost: number;
  poisonDeathSpreadRadius: number;
  ghostStatusFieldLifetimeMs: number;
  ghostBeamLifetimeMs: number;
}

export class PotassiumCommandAdapter {
  private readonly ports: PotassiumCommandAdapterFlatPorts;
  private readonly options: PotassiumCommandAdapterOptions;
  private combatIdCounter = 0;

  constructor(ports: PotassiumCommandAdapterPorts, options: PotassiumCommandAdapterOptions) {
    this.ports = {
      ...ports.runtime,
      ...ports.objects,
      ...ports.board,
      ...ports.renderer
    };
    this.options = options;
  }

  resetCombatIds(): void {
    this.combatIdCounter = 0;
  }

  applySessionResult(result: PotassiumSessionResult): void {
    this.ports.applySessionResult({
      state: result.state,
      commands: []
    });
    this.applySessionCommands(result.commands);
  }

  applySessionCommands(commands: readonly PotassiumSessionCommand[]): void {
    commands.forEach((command) => {
      if (command.type === 'resetBoard') {
        this.ports.resetBoardObjects();
      } else if (command.type === 'hideMainOverlay') {
        this.ports.hideMainOverlay();
      } else if (command.type === 'clearTerminal') {
        this.ports.clearTerminalOverlay();
      } else if (command.type === 'clearUpgradeChoices') {
        this.ports.clearUpgradeChoiceOverlay();
      } else if (command.type === 'setHint') {
        this.ports.setHint(command.text);
      } else if (command.type === 'spawnWave') {
        this.ports.spawnWave(command.wave);
      } else if (command.type === 'spawnBoss') {
        this.ports.spawnBossDelayed();
      } else if (command.type === 'scheduleWaveRows') {
        this.ports.scheduleWaveRows(command.schedule);
      } else if (command.type === 'scheduleUpgradeChoices') {
        this.ports.scheduleUpgradeChoices();
      } else if (command.type === 'showUpgradeChoices') {
        this.ports.showUpgradeChoices(command.choices);
      } else if (command.type === 'advanceWaveAfterDelay') {
        this.ports.advanceWaveAfterDelay(command.wave);
      } else if (command.type === 'refreshProjectileVisuals') {
        this.ports.refreshAllProjectileVisuals();
      } else if (command.type === 'updateHud') {
        this.ports.updateHud(command.hud);
      } else if (command.type === 'collectCircuit') {
        this.ports.collectCircuit();
      } else if (command.type === 'saveRunRecord') {
        this.ports.saveRunRecord(command.record);
      } else if (command.type === 'showOutcome') {
        this.ports.showOutcomeOverlay(command);
      } else if (command.type === 'showTerminal') {
        this.ports.showTerminal(command.outcome);
      } else if (command.type === 'closeScene') {
        this.ports.closeScene();
      } else if (command.type === 'stopBanana') {
        this.ports.stopMainProjectile();
      } else if (command.type === 'clearBoardForOutcome') {
        this.ports.clearBoardForOutcome();
      }
    });
  }

  getEnemyCombatFacts(enemy: PotassiumCommandObject): PotassiumEnemyCombatFacts {
    return {
      id: this.getCombatId(enemy, 'enemy'),
      kind: getPotassiumEnemyKind(enemy),
      active: enemy.active,
      dying: isPotassiumEnemyDying(enemy),
      hp: getPotassiumEnemyHp(enemy),
      maxHp: getPotassiumEnemyMaxHp(enemy),
      x: enemy.x,
      y: enemy.y,
      indestructible: Boolean(getPotassiumData<boolean>(enemy, POTASSIUM_DATA_KEYS.indestructible)),
      splitsOnDeath: Boolean(getPotassiumData<boolean>(enemy, POTASSIUM_DATA_KEYS.splitsOnDeath)),
      poisonExpiresAt: getPotassiumData<number>(enemy, POTASSIUM_DATA_KEYS.poisonExpiresAt),
      poisonMultiplier: getPotassiumData<number>(enemy, POTASSIUM_DATA_KEYS.poisonMultiplier),
      poisonNextTickAt: getPotassiumData<number>(enemy, POTASSIUM_DATA_KEYS.poisonNextTickAt),
      fireTickUntil: getPotassiumData<number>(enemy, POTASSIUM_DATA_KEYS.fireTickUntil),
      shieldSide: getPotassiumShieldSide(enemy),
      stoneUntil: getPotassiumData<number>(enemy, POTASSIUM_DATA_KEYS.stoneUntil)
    };
  }

  getProjectileCombatFacts(projectile: PotassiumCommandObject): PotassiumProjectileCombatFacts {
    return {
      id: this.getCombatId(projectile, this.ports.isMainProjectile(projectile) ? 'main' : 'projectile'),
      isMain: this.ports.isMainProjectile(projectile),
      isRecall: this.ports.isMainProjectile(projectile)
        && (this.ports.isMainProjectileRecalling() || isPotassiumProjectileRecallVisual(projectile)),
      x: projectile.x,
      y: projectile.y,
      effectMultiplier: getPotassiumProjectileEffectMultiplier(projectile),
      canApplyHitProcs: canPotassiumProjectileApplyHitProcs(projectile),
      canDuplicate: canPotassiumProjectileDuplicate(projectile),
      explosionRadiusMultiplier: this.ports.getProjectileExplosionRadiusMultiplier(projectile)
    };
  }

  getBossFacts(boss: PotassiumCommandObject): PotassiumBossFacts {
    return {
      active: boss.active,
      dying: isPotassiumEnemyDying(boss),
      hp: getPotassiumEnemyHp(boss),
      maxHp: getPotassiumEnemyMaxHp(boss),
      x: boss.x,
      y: boss.y,
      velocityX: boss.body.velocity.x
    };
  }

  createCombatContext(
    enemies: PotassiumCommandObject[] = this.ports.getEnemies(),
    projectiles: PotassiumCommandObject[] = this.ports.getProjectiles()
  ): PotassiumCombatContext {
    return {
      enemies: new Map(enemies.map((enemy) => [this.getCombatId(enemy, 'enemy'), enemy])),
      projectiles: new Map(projectiles.map((projectile) => [
        this.getCombatId(projectile, this.ports.isMainProjectile(projectile) ? 'main' : 'projectile'),
        projectile
      ]))
    };
  }

  applyCombatCommands(
    commands: readonly PotassiumCombatCommand[],
    context = this.createCombatContext()
  ): void {
    commands.forEach((command) => {
      const enemy = 'enemyId' in command ? context.enemies.get(command.enemyId) : undefined;
      const projectile = 'projectileId' in command ? context.projectiles.get(command.projectileId) : undefined;
      if (command.type === 'damageEnemy') {
        if (enemy) this.damageEnemy(enemy, command.amount, command.source);
      } else if (command.type === 'setEnemyHp') {
        if (enemy) setPotassiumEnemyHealth(enemy, command.hp, command.damageState);
      } else if (command.type === 'setFireTickUntil') {
        if (enemy) setPotassiumData(enemy, POTASSIUM_DATA_KEYS.fireTickUntil, command.fireTickUntil);
      } else if (command.type === 'setPoisonNextTickAt') {
        if (enemy) setPotassiumData(enemy, POTASSIUM_DATA_KEYS.poisonNextTickAt, command.poisonNextTickAt);
      } else if (command.type === 'showDamageCue') {
        if (enemy) this.ports.showDamageCue(enemy, command.source);
      } else if (command.type === 'ricochetProjectile') {
        if (projectile && enemy) this.ricochetProjectileFromEnemy(projectile, enemy);
      } else if (command.type === 'boostRecallVelocity') {
        projectile?.setVelocity(projectile.body.velocity.x * 1.01, projectile.body.velocity.y * 1.01);
      } else if (command.type === 'applyPoison') {
        if (enemy) this.applyPoisonCommand(enemy, command);
      } else if (command.type === 'clearPoison') {
        if (enemy) this.clearPoison(enemy);
      } else if (command.type === 'spawnFirePatch') {
        this.ports.spawnFirePatch(command.x, command.y, command.effectMultiplier, command.lifetimeMs, command.scale);
      } else if (command.type === 'explodeAt') {
        this.explodeAt(command.x, command.y, command.effectMultiplier, command.radiusMultiplier);
      } else if (command.type === 'spawnBananaClones') {
        this.ports.spawnBananaClones(command.count, command.lifetimeMs);
      } else if (command.type === 'spawnGhostBeam') {
        this.spawnGhostBeam(command.x, command.y, command.direction, command.effectMultiplier);
      } else if (command.type === 'spawnGhostStatusField') {
        this.spawnGhostStatusField(command.x, command.y, command.direction, command.effectMultiplier);
      } else if (command.type === 'spreadPoisonFrom') {
        this.spreadPoisonFrom(command.x, command.y, command.effectMultiplier, context.enemies.get(command.sourceEnemyId));
      } else if (command.type === 'spawnSplitterChildren') {
        if (enemy) this.ports.spawnSplitterChildren(enemy);
      } else if (command.type === 'killEnemy') {
        if (enemy) this.killEnemy(enemy);
      }
    });
  }

  damageEnemy(enemy: PotassiumCommandObject, amount: number, source: PotassiumDamageSource): void {
    this.applyCombatCommands(resolvePotassiumDamage({
      now: this.ports.getNow(),
      enemy: this.getEnemyCombatFacts(enemy),
      amount,
      source,
      skillRanks: this.ports.getSession().skillRanks,
      genericRanks: this.ports.getSession().genericRanks
    }), this.createCombatContext());
  }

  applyBossCommands(commands: readonly PotassiumBossCommand[], boss?: PotassiumCommandObject): void {
    commands.forEach((command) => {
      if (command.type === 'setBossPhase') {
        if (boss) setPotassiumData(boss, POTASSIUM_DATA_KEYS.bossPhase, command.phase);
      } else if (command.type === 'setBossVelocity') {
        if (!boss) return;
        if (command.x !== undefined) boss.setX(command.x);
        if (command.velocityX !== undefined) boss.setVelocityX(command.velocityX);
        boss.setVelocityY(command.velocityY);
      } else if (command.type === 'setBossHint') {
        this.ports.setHint(command.text);
      } else if (command.type === 'shakeCamera') {
        this.ports.shakeCamera(command.durationMs, command.intensity);
      } else if (command.type === 'spawnOrbitBlockers') {
        if (boss) this.ports.spawnBossOrbitBlockers(boss);
      } else if (command.type === 'updateOrbitBlockers') {
        if (boss) this.ports.updateBossOrbitBlockers(boss, command.now);
      } else if (command.type === 'startStone') {
        if (boss) setPotassiumData(boss, POTASSIUM_DATA_KEYS.stoneUntil, command.stoneUntil);
      } else if (command.type === 'endStone') {
        if (boss) setPotassiumData(boss, POTASSIUM_DATA_KEYS.stoneUntil, undefined);
      } else if (command.type === 'setStoneVisual') {
        if (boss) this.ports.setBossStoneVisual(boss, command.active);
      } else if (command.type === 'spawnSummons') {
        this.ports.spawnBossSummons(command.summons);
      } else if (command.type === 'clearOrbitBlockers') {
        this.ports.clearOrbitBlockers();
      }
    });
  }

  private getCombatId(object: PotassiumCommandObject, prefix: string): string {
    const existingId = getPotassiumCombatId(object);
    if (existingId) return existingId;
    const id = `${prefix}-${this.combatIdCounter}`;
    this.combatIdCounter += 1;
    setPotassiumCombatId(object, id);
    return id;
  }

  private ricochetProjectileFromEnemy(projectile: PotassiumCommandObject, enemy: PotassiumCommandObject): void {
    if (!projectile.active || !projectile.body) return;

    const velocity = { x: projectile.body.velocity.x, y: projectile.body.velocity.y };
    const currentSpeed = vectorLength(velocity);
    let normal = { x: projectile.x - enemy.x, y: projectile.y - enemy.y };
    if (vectorLengthSquared(normal) <= 0.001) {
      normal = vectorLengthSquared(velocity) > 0.001 ? velocity : { x: 0, y: 1 };
    }
    normal = normalize(normal);

    let ricochet = { ...velocity };
    const dot = dotProduct(ricochet, normal);
    if (dot < 0) {
      ricochet = {
        x: ricochet.x - normal.x * (2 * dot),
        y: ricochet.y - normal.y * (2 * dot)
      };
    } else {
      ricochet = { ...normal };
    }
    if (vectorLengthSquared(ricochet) <= 0.001) {
      ricochet = { ...normal };
    }

    const maxSpeed = this.ports.isMainProjectile(projectile)
      ? this.ports.getMaxMainProjectileSpeed()
      : this.options.cloneRicochetMaxSpeed;
    const speed = clamp(
      Math.max(currentSpeed * this.options.bananaRicochetBoost, this.options.bananaRicochetMinSpeed),
      this.options.bananaRicochetMinSpeed,
      maxSpeed
    );
    const ricochetNormal = normalize(ricochet);
    ricochet = {
      x: ricochetNormal.x * speed,
      y: ricochetNormal.y * speed
    };

    projectile.setPosition(
      clamp(projectile.x + normal.x * 8, this.options.arena.left + 28, this.options.arena.right - 28),
      clamp(projectile.y + normal.y * 8, this.options.arena.top + 28, this.options.arena.bottom - 28)
    );
    projectile.setVelocity(ricochet.x, ricochet.y);
    setPotassiumData(projectile, POTASSIUM_DATA_KEYS.angularVelocity, clamp(ricochet.x * 1.4, -720, 720));
    if ('setAngularVelocity' in projectile && typeof projectile.setAngularVelocity === 'function') {
      projectile.setAngularVelocity(clamp(ricochet.x * 1.4, -720, 720));
    }
  }

  private applyPoisonCommand(enemy: PotassiumCommandObject, command: PotassiumApplyPoisonCommand): void {
    setPotassiumData(enemy, POTASSIUM_DATA_KEYS.poisonExpiresAt, command.expiresAt);
    setPotassiumData(enemy, POTASSIUM_DATA_KEYS.poisoned, true);
    setPotassiumData(enemy, POTASSIUM_DATA_KEYS.poisonMultiplier, command.poisonMultiplier);
    enemy.setTint(this.options.poisonTint);
    if (command.nextTickAt !== undefined) {
      setPotassiumData(enemy, POTASSIUM_DATA_KEYS.poisonNextTickAt, command.nextTickAt);
    }
  }

  private spreadPoisonFrom(
    x: number,
    y: number,
    effectMultiplier: number,
    sourceEnemy?: PotassiumCommandObject
  ): void {
    this.ports.getEnemies().forEach((enemy) => {
      if (enemy === sourceEnemy || !enemy.active || isPotassiumEnemyDying(enemy)) return;
      if (distance({ x, y }, enemy) <= this.options.poisonDeathSpreadRadius) {
        this.applyPoisonCommand(enemy, {
          type: 'applyPoison',
          enemyId: this.getCombatId(enemy, 'enemy'),
          effectMultiplier,
          poisonMultiplier: Math.max(
            getPotassiumData<number>(enemy, POTASSIUM_DATA_KEYS.poisonMultiplier) ?? 0,
            effectMultiplier
          ),
          expiresAt: Math.max(
            getPotassiumData<number>(enemy, POTASSIUM_DATA_KEYS.poisonExpiresAt) ?? 0,
            this.ports.getNow() + POTASSIUM_POISON_DURATION_MS * effectMultiplier
          ),
          nextTickAt: (getPotassiumData<number>(enemy, POTASSIUM_DATA_KEYS.poisonNextTickAt) ?? 0) < this.ports.getNow()
            ? this.ports.getNow() + POTASSIUM_POISON_TICK_INTERVAL_MS
            : undefined
        });
      }
    });
  }

  private clearPoison(enemy: PotassiumCommandObject): void {
    if (!enemy.active) return;
    setPotassiumData(enemy, POTASSIUM_DATA_KEYS.poisonExpiresAt, undefined);
    setPotassiumData(enemy, POTASSIUM_DATA_KEYS.poisonNextTickAt, undefined);
    setPotassiumData(enemy, POTASSIUM_DATA_KEYS.poisonMultiplier, undefined);
    setPotassiumData(enemy, POTASSIUM_DATA_KEYS.poisoned, false);
    if (getPotassiumData<boolean>(enemy, POTASSIUM_DATA_KEYS.stoneActive)) {
      enemy.setTint(0x78716c);
    } else {
      enemy.clearTint();
    }
  }

  private killEnemy(enemy: PotassiumCommandObject): void {
    const kind = getPotassiumEnemyKind(enemy);
    const config = getPotassiumEnemyConfig(kind);
    setPotassiumEnemyDying(enemy, true);
    const damageCueTween = getPotassiumData<{ stop?: () => void }>(enemy, POTASSIUM_DATA_KEYS.damageCueTween);
    damageCueTween?.stop?.();
    enemy.body.enable = false;
    const killResult = resolvePotassiumEnemyKilled(this.ports.getSession(), config.score, kind);
    if (kind !== 'boss') {
      this.applySessionResult(killResult);
    }

    this.ports.animateEnemyDeath(enemy, () => {
      enemy.destroy();
      if (kind === 'boss') {
        this.applySessionResult(killResult);
      }
    });
  }

  private explodeAt(x: number, y: number, effectMultiplier: number, radiusMultiplier: number): void {
    const rank = this.ports.getSkillRank('explosion');
    const radius = getPotassiumExplosionRadius(rank as PotassiumSkillRank) * radiusMultiplier * this.ports.getExplosionRadiusMultiplier();
    this.ports.showExplosionVisual(x, y, radius);
    const hits = this.ports.getExplosionHits(x, y);
    this.applyCombatCommands(resolvePotassiumExplosion({
      now: this.ports.getNow(),
      x,
      y,
      effectMultiplier,
      radiusMultiplier,
      hits: hits.map((hit) => ({
        enemy: this.getEnemyCombatFacts(hit.enemy),
        distance: hit.distance
      })),
      skillRanks: this.ports.getSession().skillRanks,
      genericRanks: this.ports.getSession().genericRanks
    }), this.createCombatContext(hits.map((hit) => hit.enemy)));
    this.ports.shakeCamera(130, 0.006);
  }

  private spawnGhostBeam(
    x: number,
    y: number,
    direction: PotassiumGhostBeamDirection,
    effectMultiplier: number
  ): void {
    this.ports.showGhostBeam({ x, y, direction, durationMs: this.options.ghostBeamLifetimeMs });
    const hits = this.ports.getGhostBeamHits(x, y, direction);
    this.applyCombatCommands(resolvePotassiumGhostBeam({
      now: this.ports.getNow(),
      x,
      y,
      direction,
      effectMultiplier,
      hits: hits.map((hit) => ({
        enemy: this.getEnemyCombatFacts(hit.enemy),
        inBeam: hit.inBeam
      })),
      skillRanks: this.ports.getSession().skillRanks,
      genericRanks: this.ports.getSession().genericRanks
    }), this.createCombatContext(hits.map((hit) => hit.enemy)));
  }

  private spawnGhostStatusField(
    x: number,
    y: number,
    direction: PotassiumGhostBeamDirection,
    effectMultiplier: number
  ): void {
    const isHorizontal = direction === 'horizontal';
    if (this.ports.getSkillRank('fire') > 0) {
      const patchCount = isHorizontal ? 5 : 7;
      for (let index = 0; index < patchCount; index += 1) {
        const t = patchCount <= 1 ? 0.5 : index / (patchCount - 1);
        const patchX = isHorizontal
          ? linear(this.options.arena.left + 46, this.options.arena.right - 46, t)
          : x;
        const patchY = isHorizontal
          ? y
          : linear(this.options.arena.top + 112, this.options.arena.bottom - 92, t);
        this.ports.spawnFirePatch(patchX, patchY, effectMultiplier, this.options.ghostStatusFieldLifetimeMs, 0.46);
      }
    }
    if (this.ports.getSkillRank('poison') > 0) {
      this.ports.showGhostStatusField({
        x,
        y,
        direction,
        poisonActive: true,
        durationMs: this.options.ghostStatusFieldLifetimeMs
      });
    }
  }
}

function vectorLength(point: { x: number; y: number }): number {
  return Math.sqrt(vectorLengthSquared(point));
}

function vectorLengthSquared(point: { x: number; y: number }): number {
  return point.x * point.x + point.y * point.y;
}

function normalize(point: { x: number; y: number }): { x: number; y: number } {
  const length = vectorLength(point);
  if (length <= 0) return { x: 0, y: 0 };
  return { x: point.x / length, y: point.y / length };
}

function dotProduct(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return a.x * b.x + a.y * b.y;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return vectorLength({ x: a.x - b.x, y: a.y - b.y });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function linear(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}
