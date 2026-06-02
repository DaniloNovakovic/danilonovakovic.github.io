import {
  getPotassiumDuplicateCloneCount,
  getPotassiumEnemyHealthState,
  getPotassiumExplosionDamage,
  getPotassiumGenericUpgradeRank,
  getPotassiumScaledExplosionRadius,
  getPotassiumSkillRank,
  isPotassiumShieldedHit,
  type PotassiumEnemyHealthState,
  type PotassiumEnemyKind,
  type PotassiumGenericUpgradeKind,
  type PotassiumGenericUpgradeRanks,
  type PotassiumShieldSide,
  type PotassiumSkillRanks,
  type PotassiumSkillRank,
  type PotassiumUpgradeKind
} from './waves';

export type PotassiumDamageSource = 'banana' | 'fire' | 'poison' | 'explosion' | 'ghost';
export type PotassiumGhostBeamDirection = 'horizontal' | 'vertical';

export interface PotassiumEnemyCombatFacts {
  id: string;
  kind: PotassiumEnemyKind;
  active: boolean;
  dying: boolean;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  indestructible: boolean;
  splitsOnDeath: boolean;
  poisonExpiresAt?: number;
  poisonMultiplier?: number;
  poisonNextTickAt?: number;
  fireTickUntil?: number;
  shieldSide?: PotassiumShieldSide;
  stoneUntil?: number;
}

export interface PotassiumProjectileCombatFacts {
  id: string;
  isMain: boolean;
  isRecall: boolean;
  x: number;
  y: number;
  effectMultiplier: number;
  canApplyHitProcs: boolean;
  canDuplicate: boolean;
  explosionRadiusMultiplier: number;
}

export interface PotassiumCombatRanks {
  skillRanks: PotassiumSkillRanks;
  genericRanks: PotassiumGenericUpgradeRanks;
}

export interface PotassiumProjectileHitInput extends PotassiumCombatRanks {
  now: number;
  enemy: PotassiumEnemyCombatFacts;
  projectile: PotassiumProjectileCombatFacts;
}

export interface PotassiumDamageInput extends PotassiumCombatRanks {
  now: number;
  enemy: PotassiumEnemyCombatFacts;
  amount: number;
  source: PotassiumDamageSource;
}

export interface PotassiumPoisonTickInput {
  now: number;
  enemy: PotassiumEnemyCombatFacts;
  poisonUnlocked: boolean;
}

export interface PotassiumExplosionHitFacts {
  enemy: PotassiumEnemyCombatFacts;
  distance: number;
}

export interface PotassiumExplosionInput extends PotassiumCombatRanks {
  now: number;
  x: number;
  y: number;
  effectMultiplier: number;
  radiusMultiplier: number;
  hits: readonly PotassiumExplosionHitFacts[];
}

export interface PotassiumGhostBeamHitFacts {
  enemy: PotassiumEnemyCombatFacts;
  inBeam: boolean;
}

export interface PotassiumGhostBeamInput extends PotassiumCombatRanks {
  now: number;
  x: number;
  y: number;
  direction: PotassiumGhostBeamDirection;
  effectMultiplier: number;
  hits: readonly PotassiumGhostBeamHitFacts[];
}

export interface PotassiumApplyPoisonCommand {
  type: 'applyPoison';
  enemyId: string;
  effectMultiplier: number;
  poisonMultiplier: number;
  expiresAt: number;
  nextTickAt?: number;
}

export interface PotassiumSpawnFirePatchCommand {
  type: 'spawnFirePatch';
  x: number;
  y: number;
  effectMultiplier: number;
  lifetimeMs: number;
  scale: number;
}

export type PotassiumCombatCommand =
  | { type: 'damageEnemy'; enemyId: string; amount: number; source: PotassiumDamageSource }
  | { type: 'setEnemyHp'; enemyId: string; hp: number; damageState: PotassiumEnemyHealthState }
  | { type: 'setFireTickUntil'; enemyId: string; fireTickUntil: number }
  | { type: 'setPoisonNextTickAt'; enemyId: string; poisonNextTickAt: number }
  | { type: 'showDamageCue'; enemyId: string; source: PotassiumDamageSource }
  | { type: 'ricochetProjectile'; projectileId: string; enemyId: string }
  | { type: 'boostRecallVelocity'; projectileId: string }
  | PotassiumApplyPoisonCommand
  | { type: 'clearPoison'; enemyId: string }
  | PotassiumSpawnFirePatchCommand
  | { type: 'explodeAt'; x: number; y: number; effectMultiplier: number; radiusMultiplier: number }
  | { type: 'spawnBananaClones'; count: number; lifetimeMs: number }
  | { type: 'spawnGhostBeam'; x: number; y: number; direction: PotassiumGhostBeamDirection; effectMultiplier: number }
  | { type: 'spawnGhostStatusField'; x: number; y: number; direction: PotassiumGhostBeamDirection; effectMultiplier: number }
  | { type: 'spreadPoisonFrom'; x: number; y: number; effectMultiplier: number; sourceEnemyId: string }
  | { type: 'spawnSplitterChildren'; enemyId: string }
  | { type: 'killEnemy'; enemyId: string };

const POTASSIUM_RECALL_DAMAGE = 0.65;
const POTASSIUM_FIRE_TICK_COOLDOWN_MS = 420;
export const POTASSIUM_POISON_TICK_INTERVAL_MS = 500;
export const POTASSIUM_POISON_DURATION_MS = 2500;
const POTASSIUM_DUPLICATE_CLONE_LIFETIME_MS = 3000;
export const POTASSIUM_FIRE_HIT_PATCH_LIFETIME_MS = 900;
export const POTASSIUM_GHOST_STATUS_FIELD_LIFETIME_MS = 680;

const POISON_UPGRADED_DAMAGE_MULTIPLIER = 1.25;

export function resolvePotassiumProjectileHit(input: PotassiumProjectileHitInput): PotassiumCombatCommand[] {
  const { enemy, projectile } = input;
  if (!enemy.active) return [];

  const commands: PotassiumCombatCommand[] = [];
  const protectedHit = isStoneProtected(enemy, input.now) || isShieldProtectedHit(enemy, projectile);

  if (protectedHit) {
    commands.push({ type: 'showDamageCue', enemyId: enemy.id, source: 'ghost' });
    commands.push(projectile.isRecall
      ? { type: 'boostRecallVelocity', projectileId: projectile.id }
      : { type: 'ricochetProjectile', projectileId: projectile.id, enemyId: enemy.id });
    return commands;
  }

  commands.push({
    type: 'damageEnemy',
    enemyId: enemy.id,
    amount: (projectile.isRecall ? POTASSIUM_RECALL_DAMAGE : 1) * projectile.effectMultiplier * getDamageMultiplier(input.genericRanks),
    source: 'banana'
  });
  commands.push(projectile.isRecall
    ? { type: 'boostRecallVelocity', projectileId: projectile.id }
    : { type: 'ricochetProjectile', projectileId: projectile.id, enemyId: enemy.id });
  commands.push(...resolveUnlockedHitEffects(input));
  return commands;
}

export function resolvePotassiumDamage(input: PotassiumDamageInput): PotassiumCombatCommand[] {
  const { enemy } = input;
  if (!enemy.active || enemy.dying) return [];

  const commands: PotassiumCombatCommand[] = [];
  if (input.source === 'fire') {
    if (enemy.fireTickUntil !== undefined && enemy.fireTickUntil > input.now) return [];
    commands.push({ type: 'setFireTickUntil', enemyId: enemy.id, fireTickUntil: input.now + POTASSIUM_FIRE_TICK_COOLDOWN_MS });
  }

  if (enemy.indestructible) {
    commands.push({ type: 'showDamageCue', enemyId: enemy.id, source: input.source });
    return commands;
  }

  const hp = Math.max(0, enemy.hp - input.amount);
  commands.push({
    type: 'setEnemyHp',
    enemyId: enemy.id,
    hp,
    damageState: getPotassiumEnemyHealthState(hp, enemy.maxHp)
  });
  commands.push({ type: 'showDamageCue', enemyId: enemy.id, source: input.source });

  if (hp <= 0) {
    commands.push(...resolveDeathCommands(input));
  }
  return commands;
}

export function resolvePotassiumPoisonTick(input: PotassiumPoisonTickInput): PotassiumCombatCommand[] {
  const { enemy } = input;
  if (!input.poisonUnlocked || !enemy.active || enemy.poisonExpiresAt === undefined) return [];
  if (enemy.poisonExpiresAt <= input.now) {
    return [{ type: 'clearPoison', enemyId: enemy.id }];
  }
  const nextTickAt = enemy.poisonNextTickAt ?? input.now;
  if (nextTickAt > input.now) return [];
  return [
    { type: 'setPoisonNextTickAt', enemyId: enemy.id, poisonNextTickAt: input.now + POTASSIUM_POISON_TICK_INTERVAL_MS },
    { type: 'damageEnemy', enemyId: enemy.id, amount: enemy.poisonMultiplier ?? 1, source: 'poison' }
  ];
}

export function resolvePotassiumExplosion(input: PotassiumExplosionInput): PotassiumCombatCommand[] {
  const rank = getSkillRank(input.skillRanks, 'explosion');
  const radius = getPotassiumScaledExplosionRadius(rank, input.radiusMultiplier * getExplosionRadiusMultiplier(input.genericRanks));
  return input.hits.flatMap(({ enemy, distance }) => {
    const damage = getPotassiumExplosionDamage(distance, radius, input.effectMultiplier * getDamageMultiplier(input.genericRanks));
    if (damage <= 0) return [];
    const commands: PotassiumCombatCommand[] = [
      { type: 'damageEnemy', enemyId: enemy.id, amount: damage, source: 'explosion' }
    ];
    if (rank >= 2) {
      commands.push(...resolveStatusEffects({
        enemy,
        x: enemy.x,
        y: enemy.y,
        effectMultiplier: input.effectMultiplier,
        allowExplosionStatus: true,
        now: input.now,
        skillRanks: input.skillRanks,
        genericRanks: input.genericRanks
      }));
    }
    return commands;
  });
}

export function resolvePotassiumGhostBeam(input: PotassiumGhostBeamInput): PotassiumCombatCommand[] {
  const rank = getSkillRank(input.skillRanks, input.direction === 'horizontal' ? 'ghostHorizontal' : 'ghostVertical');
  const commands = input.hits.flatMap(({ enemy, inBeam }): PotassiumCombatCommand[] => {
    if (!inBeam) return [];
    const hitCommands: PotassiumCombatCommand[] = [
      {
        type: 'damageEnemy',
        enemyId: enemy.id,
        amount: input.effectMultiplier * getDamageMultiplier(input.genericRanks),
        source: 'ghost'
      }
    ];
    if (rank >= 2) {
      hitCommands.push(...resolveStatusEffects({
        enemy,
        x: enemy.x,
        y: enemy.y,
        effectMultiplier: input.effectMultiplier,
        allowExplosionStatus: false,
        now: input.now,
        skillRanks: input.skillRanks,
        genericRanks: input.genericRanks
      }));
    }
    return hitCommands;
  });
  if (rank >= 2) {
    commands.push({
      type: 'spawnGhostStatusField',
      x: input.x,
      y: input.y,
      direction: input.direction,
      effectMultiplier: input.effectMultiplier
    });
  }
  return commands;
}

function resolveUnlockedHitEffects(input: PotassiumProjectileHitInput): PotassiumCombatCommand[] {
  const { enemy, projectile } = input;
  const commands: PotassiumCombatCommand[] = [];
  if (projectile.canApplyHitProcs) {
    commands.push(...resolveStatusEffects({
      enemy,
      x: enemy.x,
      y: enemy.y,
      effectMultiplier: projectile.effectMultiplier,
      allowExplosionStatus: false,
      now: input.now,
      skillRanks: input.skillRanks,
      genericRanks: input.genericRanks
    }));
  }

  if (projectile.canApplyHitProcs && getSkillRank(input.skillRanks, 'fire') >= 2) {
    commands.push({
      type: 'spawnFirePatch',
      x: enemy.x,
      y: enemy.y,
      effectMultiplier: projectile.effectMultiplier,
      lifetimeMs: POTASSIUM_FIRE_HIT_PATCH_LIFETIME_MS,
      scale: projectile.isMain ? 0.7 : 0.5
    });
  }
  if (projectile.canApplyHitProcs && !projectile.isRecall && getSkillRank(input.skillRanks, 'explosion') > 0) {
    commands.push({
      type: 'explodeAt',
      x: enemy.x,
      y: enemy.y,
      effectMultiplier: projectile.effectMultiplier,
      radiusMultiplier: projectile.explosionRadiusMultiplier
    });
  }
  if (!projectile.isRecall && projectile.canDuplicate && getSkillRank(input.skillRanks, 'duplicate') > 0) {
    commands.push({
      type: 'spawnBananaClones',
      count: getPotassiumDuplicateCloneCount(getSkillRank(input.skillRanks, 'duplicate')),
      lifetimeMs: POTASSIUM_DUPLICATE_CLONE_LIFETIME_MS + getGenericRank(input.genericRanks, 'cloneTime') * 300
    });
  }
  if (!projectile.isRecall && getSkillRank(input.skillRanks, 'ghostHorizontal') > 0) {
    commands.push({ type: 'spawnGhostBeam', x: enemy.x, y: enemy.y, direction: 'horizontal', effectMultiplier: projectile.effectMultiplier });
  }
  if (!projectile.isRecall && getSkillRank(input.skillRanks, 'ghostVertical') > 0) {
    commands.push({ type: 'spawnGhostBeam', x: enemy.x, y: enemy.y, direction: 'vertical', effectMultiplier: projectile.effectMultiplier });
  }
  return commands;
}

function resolveStatusEffects(input: {
  enemy: PotassiumEnemyCombatFacts;
  x: number;
  y: number;
  effectMultiplier: number;
  allowExplosionStatus: boolean;
  now: number;
} & PotassiumCombatRanks): PotassiumCombatCommand[] {
  const commands: PotassiumCombatCommand[] = [];
  if (getSkillRank(input.skillRanks, 'poison') > 0) {
    commands.push(resolveApplyPoison(input.enemy, input.now, input.effectMultiplier, true, input.skillRanks, input.genericRanks));
  }
  if (input.allowExplosionStatus && getSkillRank(input.skillRanks, 'fire') > 0) {
    commands.push({
      type: 'spawnFirePatch',
      x: input.x,
      y: input.y,
      effectMultiplier: input.effectMultiplier,
      lifetimeMs: POTASSIUM_FIRE_HIT_PATCH_LIFETIME_MS,
      scale: 0.58
    });
  }
  return commands;
}

function resolveApplyPoison(
  enemy: PotassiumEnemyCombatFacts,
  now: number,
  effectMultiplier: number,
  applyRankBonus: boolean,
  skillRanks: PotassiumSkillRanks,
  genericRanks: PotassiumGenericUpgradeRanks
): PotassiumApplyPoisonCommand {
  const poisonMultiplier = applyRankBonus && getSkillRank(skillRanks, 'poison') >= 2
    ? effectMultiplier * POISON_UPGRADED_DAMAGE_MULTIPLIER * getPoisonGenericMultiplier(genericRanks)
    : effectMultiplier;
  const nextTickAt = enemy.poisonNextTickAt === undefined || enemy.poisonNextTickAt < now
    ? now + POTASSIUM_POISON_TICK_INTERVAL_MS
    : undefined;
  return {
    type: 'applyPoison',
    enemyId: enemy.id,
    effectMultiplier,
    poisonMultiplier: Math.max(enemy.poisonMultiplier ?? 0, poisonMultiplier),
    expiresAt: Math.max(enemy.poisonExpiresAt ?? 0, now + POTASSIUM_POISON_DURATION_MS * poisonMultiplier),
    nextTickAt
  };
}

function resolveDeathCommands(input: PotassiumDamageInput): PotassiumCombatCommand[] {
  const commands: PotassiumCombatCommand[] = [];
  if (getSkillRank(input.skillRanks, 'poison') >= 2 && input.enemy.poisonExpiresAt !== undefined && input.enemy.poisonExpiresAt > input.now) {
    commands.push({
      type: 'spreadPoisonFrom',
      x: input.enemy.x,
      y: input.enemy.y,
      effectMultiplier: input.enemy.poisonMultiplier ?? 1,
      sourceEnemyId: input.enemy.id
    });
  }
  if (input.enemy.splitsOnDeath) {
    commands.push({ type: 'spawnSplitterChildren', enemyId: input.enemy.id });
  }
  commands.push({ type: 'killEnemy', enemyId: input.enemy.id });
  return commands;
}

function isStoneProtected(enemy: PotassiumEnemyCombatFacts, now: number): boolean {
  return enemy.kind === 'boss' && enemy.stoneUntil !== undefined && enemy.stoneUntil > now;
}

function isShieldProtectedHit(enemy: PotassiumEnemyCombatFacts, projectile: PotassiumProjectileCombatFacts): boolean {
  if (!enemy.shieldSide) return false;
  return isPotassiumShieldedHit(enemy.shieldSide, projectile.x - enemy.x, projectile.y - enemy.y);
}

function getSkillRank(skillRanks: PotassiumSkillRanks, upgrade: PotassiumUpgradeKind): PotassiumSkillRank {
  return getPotassiumSkillRank(skillRanks, upgrade);
}

function getGenericRank(genericRanks: PotassiumGenericUpgradeRanks, upgrade: PotassiumGenericUpgradeKind): number {
  return getPotassiumGenericUpgradeRank(genericRanks, upgrade);
}

function getDamageMultiplier(genericRanks: PotassiumGenericUpgradeRanks): number {
  return 1 + getGenericRank(genericRanks, 'damage') * 0.12;
}

function getPoisonGenericMultiplier(genericRanks: PotassiumGenericUpgradeRanks): number {
  return 1 + getGenericRank(genericRanks, 'poison') * 0.1;
}

function getExplosionRadiusMultiplier(genericRanks: PotassiumGenericUpgradeRanks): number {
  return 1 + getGenericRank(genericRanks, 'explosion') * 0.06;
}
