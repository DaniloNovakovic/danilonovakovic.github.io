import type { PotassiumEnemyCombatFacts, PotassiumProjectileCombatFacts } from './combat';
import type { PotassiumBossFacts } from './boss';
import type { PotassiumCombatCommand } from './combat';
import type { PotassiumSessionResult } from './session';
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
  setPotassiumCombatId
} from './phaserData';
import type {
  PotassiumCombatContext,
  PotassiumCommandAdapterFlatPorts,
  PotassiumCommandAdapterOptions,
  PotassiumCommandAdapterPorts,
  PotassiumCommandObject
} from './commandAdapterTypes';

export interface CommandAdapterDelegates {
  applySessionResult(result: PotassiumSessionResult): void;
  applyCombatCommands(
    commands: readonly PotassiumCombatCommand[],
    context?: PotassiumCombatContext
  ): void;
}

export class PotassiumCommandAdapterInternals {
  combatIdCounter = 0;
  delegates!: CommandAdapterDelegates;

  readonly ports: PotassiumCommandAdapterFlatPorts;
  readonly options: PotassiumCommandAdapterOptions;

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

  getCombatId(object: PotassiumCommandObject, prefix: string): string {
    const existingId = getPotassiumCombatId(object);
    if (existingId) return existingId;
    const id = `${prefix}-${this.combatIdCounter}`;
    this.combatIdCounter += 1;
    setPotassiumCombatId(object, id);
    return id;
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
      velocityX: boss.body?.velocity?.x ?? 0
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
}
