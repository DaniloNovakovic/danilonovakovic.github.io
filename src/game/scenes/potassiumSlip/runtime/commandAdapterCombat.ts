import {
  POTASSIUM_POISON_DURATION_MS,
  POTASSIUM_POISON_TICK_INTERVAL_MS,
  resolvePotassiumDamage,
  resolvePotassiumExplosion,
  resolvePotassiumGhostBeam,
  type PotassiumApplyPoisonCommand,
  type PotassiumCombatCommand,
  type PotassiumDamageSource,
  type PotassiumGhostBeamDirection
} from './combat';
import { getPotassiumEnemyConfig } from './enemyFactory';
import { resolvePotassiumEnemyKilled } from './session';
import { clamp, linear } from '@/shared/math';
import {
  getPotassiumExplosionRadius,
  type PotassiumSkillRank
} from './waves';
import {
  getPotassiumData,
  getPotassiumEnemyKind,
  isPotassiumEnemyDying,
  POTASSIUM_DATA_KEYS,
  setPotassiumData,
  setPotassiumEnemyDying,
  setPotassiumEnemyHealth
} from './phaserData';
import type { PotassiumCommandAdapterInternals } from './commandAdapterInternals';
import type { PotassiumCombatContext, PotassiumCommandObject } from './commandAdapterTypes';

export function applyCombatCommands(
  internals: PotassiumCommandAdapterInternals,
  commands: readonly PotassiumCombatCommand[],
  context = internals.createCombatContext()
): void {
  commands.forEach((command) => applyCombatCommand(internals, command, context));
}

export function damageEnemy(
  internals: PotassiumCommandAdapterInternals,
  enemy: PotassiumCommandObject,
  amount: number,
  source: PotassiumDamageSource
): void {
  applyCombatCommands(internals, resolvePotassiumDamage({
    now: internals.ports.getNow(),
    enemy: internals.getEnemyCombatFacts(enemy),
    amount,
    source,
    skillRanks: internals.ports.getSession().skillRanks,
    genericRanks: internals.ports.getSession().genericRanks
  }), internals.createCombatContext());
}

function applyCombatCommand(
  internals: PotassiumCommandAdapterInternals,
  command: PotassiumCombatCommand,
  context: PotassiumCombatContext
): void {
  const enemy = 'enemyId' in command ? context.enemies.get(command.enemyId) : undefined;
  const projectile = 'projectileId' in command
    ? context.projectiles.get(command.projectileId)
    : undefined;

  if (applyCombatEnemyCommand(internals, command, enemy)) return;
  if (applyCombatProjectileCommand(internals, command, projectile, enemy)) return;
  applyCombatWorldCommand(internals, command, context, enemy);
}

function applyCombatEnemyCommand(
  internals: PotassiumCommandAdapterInternals,
  command: PotassiumCombatCommand,
  enemy: PotassiumCommandObject | undefined
): boolean {
  if (applyCombatEnemyDamageCommand(internals, command, enemy)) return true;
  if (applyCombatEnemyStatusCommand(internals, command, enemy)) return true;
  return applyCombatEnemyLifecycleCommand(internals, command, enemy);
}

function applyCombatEnemyDamageCommand(
  internals: PotassiumCommandAdapterInternals,
  command: PotassiumCombatCommand,
  enemy: PotassiumCommandObject | undefined
): boolean {
  switch (command.type) {
    case 'damageEnemy':
      if (enemy) damageEnemy(internals, enemy, command.amount, command.source);
      return true;
    case 'setEnemyHp':
      if (enemy) setPotassiumEnemyHealth(enemy, command.hp, command.damageState);
      return true;
    case 'showDamageCue':
      if (enemy) internals.ports.showDamageCue(enemy, command.source);
      return true;
    default:
      return false;
  }
}

function applyCombatEnemyStatusCommand(
  internals: PotassiumCommandAdapterInternals,
  command: PotassiumCombatCommand,
  enemy: PotassiumCommandObject | undefined
): boolean {
  switch (command.type) {
    case 'setFireTickUntil':
      if (enemy) setPotassiumData(enemy, POTASSIUM_DATA_KEYS.fireTickUntil, command.fireTickUntil);
      return true;
    case 'setPoisonNextTickAt':
      if (enemy) setPotassiumData(enemy, POTASSIUM_DATA_KEYS.poisonNextTickAt, command.poisonNextTickAt);
      return true;
    case 'applyPoison':
      if (enemy) applyPoisonCommand(internals, enemy, command);
      return true;
    case 'clearPoison':
      if (enemy) clearPoison(enemy);
      return true;
    default:
      return false;
  }
}

function applyCombatEnemyLifecycleCommand(
  internals: PotassiumCommandAdapterInternals,
  command: PotassiumCombatCommand,
  enemy: PotassiumCommandObject | undefined
): boolean {
  switch (command.type) {
    case 'spawnSplitterChildren':
      if (enemy) internals.ports.spawnSplitterChildren(enemy);
      return true;
    case 'killEnemy':
      if (enemy) killEnemy(internals, enemy);
      return true;
    default:
      return false;
  }
}

function applyCombatProjectileCommand(
  internals: PotassiumCommandAdapterInternals,
  command: PotassiumCombatCommand,
  projectile: PotassiumCommandObject | undefined,
  enemy: PotassiumCommandObject | undefined
): boolean {
  switch (command.type) {
    case 'ricochetProjectile':
      if (projectile && enemy) ricochetProjectileFromEnemy(internals, projectile, enemy);
      return true;
    case 'boostRecallVelocity':
      projectile?.setVelocity(projectile.body.velocity.x * 1.01, projectile.body.velocity.y * 1.01);
      return true;
    default:
      return false;
  }
}

function applyCombatWorldCommand(
  internals: PotassiumCommandAdapterInternals,
  command: PotassiumCombatCommand,
  context: PotassiumCombatContext,
  sourceEnemy: PotassiumCommandObject | undefined
): void {
  switch (command.type) {
    case 'spawnFirePatch':
      internals.ports.spawnFirePatch(
        command.x,
        command.y,
        command.effectMultiplier,
        command.lifetimeMs,
        command.scale
      );
      break;
    case 'explodeAt':
      explodeAt(internals, command.x, command.y, command.effectMultiplier, command.radiusMultiplier);
      break;
    case 'spawnBananaClones':
      internals.ports.spawnBananaClones(command.count, command.lifetimeMs);
      break;
    case 'spawnGhostBeam':
      spawnGhostBeam(internals, command.x, command.y, command.direction, command.effectMultiplier);
      break;
    case 'spawnGhostStatusField':
      spawnGhostStatusField(internals, command.x, command.y, command.direction, command.effectMultiplier);
      break;
    case 'spreadPoisonFrom':
      spreadPoisonFrom(
        internals,
        command.x,
        command.y,
        command.effectMultiplier,
        sourceEnemy ?? context.enemies.get(command.sourceEnemyId)
      );
      break;
    default:
      break;
  }
}

function ricochetProjectileFromEnemy(
  internals: PotassiumCommandAdapterInternals,
  projectile: PotassiumCommandObject,
  enemy: PotassiumCommandObject
): void {
  if (!projectile.active || !projectile.body) return;

  const { options, ports } = internals;
  const velocity = { x: projectile.body.velocity.x, y: projectile.body.velocity.y };
  const normal = collisionNormal(projectile, enemy, velocity);
  const maxSpeed = ports.isMainProjectile(projectile)
    ? ports.getMaxMainProjectileSpeed()
    : options.cloneRicochetMaxSpeed;
  const ricochet = scaledRicochetVelocity(
    reflectVelocity(velocity, normal),
    vectorLength(velocity),
    maxSpeed,
    options
  );

  projectile.setPosition(
    clamp(projectile.x + normal.x * 8, options.arena.left + 28, options.arena.right - 28),
    clamp(projectile.y + normal.y * 8, options.arena.top + 28, options.arena.bottom - 28)
  );
  projectile.setVelocity(ricochet.x, ricochet.y);
  if ('setAngularVelocity' in projectile && typeof projectile.setAngularVelocity === 'function') {
    projectile.setAngularVelocity(clamp(ricochet.x * 1.4, -720, 720));
  }
}

function applyPoisonCommand(
  internals: PotassiumCommandAdapterInternals,
  enemy: PotassiumCommandObject,
  command: PotassiumApplyPoisonCommand
): void {
  setPotassiumData(enemy, POTASSIUM_DATA_KEYS.poisonExpiresAt, command.expiresAt);
  setPotassiumData(enemy, POTASSIUM_DATA_KEYS.poisoned, true);
  setPotassiumData(enemy, POTASSIUM_DATA_KEYS.poisonMultiplier, command.poisonMultiplier);
  enemy.setTint(internals.options.poisonTint);
  if (command.nextTickAt !== undefined) {
    setPotassiumData(enemy, POTASSIUM_DATA_KEYS.poisonNextTickAt, command.nextTickAt);
  }
}

function spreadPoisonFrom(
  internals: PotassiumCommandAdapterInternals,
  x: number,
  y: number,
  effectMultiplier: number,
  sourceEnemy?: PotassiumCommandObject
): void {
  internals.ports.getEnemies().forEach((enemy) => {
    if (enemy === sourceEnemy || !enemy.active || isPotassiumEnemyDying(enemy)) return;
    if (distance({ x, y }, enemy) <= internals.options.poisonDeathSpreadRadius) {
      applyPoisonCommand(internals, enemy, {
        type: 'applyPoison',
        enemyId: internals.getCombatId(enemy, 'enemy'),
        effectMultiplier,
        poisonMultiplier: Math.max(
          getPotassiumData<number>(enemy, POTASSIUM_DATA_KEYS.poisonMultiplier) ?? 0,
          effectMultiplier
        ),
        expiresAt: Math.max(
          getPotassiumData<number>(enemy, POTASSIUM_DATA_KEYS.poisonExpiresAt) ?? 0,
          internals.ports.getNow() + POTASSIUM_POISON_DURATION_MS * effectMultiplier
        ),
        nextTickAt: (getPotassiumData<number>(enemy, POTASSIUM_DATA_KEYS.poisonNextTickAt) ?? 0) < internals.ports.getNow()
          ? internals.ports.getNow() + POTASSIUM_POISON_TICK_INTERVAL_MS
          : undefined
      });
    }
  });
}

function clearPoison(enemy: PotassiumCommandObject): void {
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

function killEnemy(internals: PotassiumCommandAdapterInternals, enemy: PotassiumCommandObject): void {
  const kind = getPotassiumEnemyKind(enemy);
  const config = getPotassiumEnemyConfig(kind);
  setPotassiumEnemyDying(enemy, true);
  const damageCueTween = getPotassiumData<{ stop?: () => void }>(enemy, POTASSIUM_DATA_KEYS.damageCueTween);
  damageCueTween?.stop?.();
  enemy.body.enable = false;
  const killResult = resolvePotassiumEnemyKilled(internals.ports.getSession(), config.score, kind);
  if (kind !== 'boss') {
    internals.delegates.applySessionResult(killResult);
  }

  internals.ports.animateEnemyDeath(enemy, () => {
    enemy.destroy();
    if (kind === 'boss') {
      internals.delegates.applySessionResult(killResult);
    }
  });
}

function explodeAt(
  internals: PotassiumCommandAdapterInternals,
  x: number,
  y: number,
  effectMultiplier: number,
  radiusMultiplier: number
): void {
  const rank = internals.ports.getSkillRank('explosion');
  const radius = getPotassiumExplosionRadius(rank as PotassiumSkillRank)
    * radiusMultiplier
    * internals.ports.getExplosionRadiusMultiplier();
  internals.ports.showExplosionVisual(x, y, radius);
  const hits = internals.ports.getExplosionHits(x, y);
  applyCombatCommands(internals, resolvePotassiumExplosion({
    now: internals.ports.getNow(),
    x,
    y,
    effectMultiplier,
    radiusMultiplier,
    hits: hits.map((hit) => ({
      enemy: internals.getEnemyCombatFacts(hit.enemy),
      distance: hit.distance
    })),
    skillRanks: internals.ports.getSession().skillRanks,
    genericRanks: internals.ports.getSession().genericRanks
  }), internals.createCombatContext(hits.map((hit) => hit.enemy)));
  internals.ports.shakeCamera(130, 0.006);
}

function spawnGhostBeam(
  internals: PotassiumCommandAdapterInternals,
  x: number,
  y: number,
  direction: PotassiumGhostBeamDirection,
  effectMultiplier: number
): void {
  internals.ports.showGhostBeam({ x, y, direction, durationMs: internals.options.ghostBeamLifetimeMs });
  const hits = internals.ports.getGhostBeamHits(x, y, direction);
  applyCombatCommands(internals, resolvePotassiumGhostBeam({
    now: internals.ports.getNow(),
    x,
    y,
    direction,
    effectMultiplier,
    hits: hits.map((hit) => ({
      enemy: internals.getEnemyCombatFacts(hit.enemy),
      inBeam: hit.inBeam
    })),
    skillRanks: internals.ports.getSession().skillRanks,
    genericRanks: internals.ports.getSession().genericRanks
  }), internals.createCombatContext(hits.map((hit) => hit.enemy)));
}

function spawnGhostStatusField(
  internals: PotassiumCommandAdapterInternals,
  x: number,
  y: number,
  direction: PotassiumGhostBeamDirection,
  effectMultiplier: number
): void {
  const { options, ports } = internals;
  const isHorizontal = direction === 'horizontal';
  if (ports.getSkillRank('fire') > 0) {
    const patchCount = isHorizontal ? 5 : 7;
    for (let index = 0; index < patchCount; index += 1) {
      const t = patchCount <= 1 ? 0.5 : index / (patchCount - 1);
      const patchX = isHorizontal
        ? linear(options.arena.left + 46, options.arena.right - 46, t)
        : x;
      const patchY = isHorizontal
        ? y
        : linear(options.arena.top + 112, options.arena.bottom - 92, t);
      ports.spawnFirePatch(patchX, patchY, effectMultiplier, options.ghostStatusFieldLifetimeMs, 0.46);
    }
  }
  if (ports.getSkillRank('poison') > 0) {
    ports.showGhostStatusField({
      x,
      y,
      direction,
      poisonActive: true,
      durationMs: options.ghostStatusFieldLifetimeMs
    });
  }
}

function collisionNormal(
  projectile: PotassiumCommandObject,
  enemy: PotassiumCommandObject,
  velocity: { x: number; y: number }
): { x: number; y: number } {
  let normal = { x: projectile.x - enemy.x, y: projectile.y - enemy.y };
  if (vectorLengthSquared(normal) <= 0.001) {
    normal = vectorLengthSquared(velocity) > 0.001 ? velocity : { x: 0, y: 1 };
  }
  return normalize(normal);
}

function reflectVelocity(
  velocity: { x: number; y: number },
  normal: { x: number; y: number }
): { x: number; y: number } {
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
    return { ...normal };
  }
  return ricochet;
}

function scaledRicochetVelocity(
  ricochet: { x: number; y: number },
  currentSpeed: number,
  maxSpeed: number,
  options: PotassiumCommandAdapterInternals['options']
): { x: number; y: number } {
  const speed = clamp(
    Math.max(currentSpeed * options.bananaRicochetBoost, options.bananaRicochetMinSpeed),
    options.bananaRicochetMinSpeed,
    maxSpeed
  );
  const ricochetNormal = normalize(ricochet);
  return {
    x: ricochetNormal.x * speed,
    y: ricochetNormal.y * speed
  };
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
