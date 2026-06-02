import type { PotassiumBossCommand } from './boss';
import { POTASSIUM_DATA_KEYS, setPotassiumData } from './phaserData';
import type { PotassiumCommandAdapterInternals } from './commandAdapterInternals';
import type { PotassiumCommandObject } from './commandAdapterTypes';

export function applyBossCommands(
  internals: PotassiumCommandAdapterInternals,
  commands: readonly PotassiumBossCommand[],
  boss?: PotassiumCommandObject
): void {
  commands.forEach((command) => applyBossCommand(internals, command, boss));
}

function applyBossCommand(
  internals: PotassiumCommandAdapterInternals,
  command: PotassiumBossCommand,
  boss?: PotassiumCommandObject
): void {
  if (applyBossMotionCommand(command, boss)) return;
  if (applyBossPresentationCommand(internals, command, boss)) return;
  applyBossSpawnCommand(internals, command, boss);
}

function applyBossMotionCommand(command: PotassiumBossCommand, boss?: PotassiumCommandObject): boolean {
  switch (command.type) {
    case 'setBossPhase':
      if (boss) setPotassiumData(boss, POTASSIUM_DATA_KEYS.bossPhase, command.phase);
      return true;
    case 'setBossVelocity':
      if (boss) applyBossVelocity(boss, command);
      return true;
    case 'startStone':
      if (boss) setPotassiumData(boss, POTASSIUM_DATA_KEYS.stoneUntil, command.stoneUntil);
      return true;
    case 'endStone':
      if (boss) setPotassiumData(boss, POTASSIUM_DATA_KEYS.stoneUntil, undefined);
      return true;
    default:
      return false;
  }
}

function applyBossVelocity(
  boss: PotassiumCommandObject,
  command: Extract<PotassiumBossCommand, { type: 'setBossVelocity' }>
): void {
  if (command.x !== undefined) boss.setX(command.x);
  if (command.velocityX !== undefined) boss.setVelocityX(command.velocityX);
  boss.setVelocityY(command.velocityY);
}

function applyBossPresentationCommand(
  internals: PotassiumCommandAdapterInternals,
  command: PotassiumBossCommand,
  boss?: PotassiumCommandObject
): boolean {
  const { ports } = internals;
  switch (command.type) {
    case 'setBossHint':
      ports.setHint(command.text);
      return true;
    case 'shakeCamera':
      ports.shakeCamera(command.durationMs, command.intensity);
      return true;
    case 'setStoneVisual':
      if (boss) ports.setBossStoneVisual(boss, command.active);
      return true;
    case 'clearOrbitBlockers':
      ports.clearOrbitBlockers();
      return true;
    default:
      return false;
  }
}

function applyBossSpawnCommand(
  internals: PotassiumCommandAdapterInternals,
  command: PotassiumBossCommand,
  boss?: PotassiumCommandObject
): void {
  const { ports } = internals;
  switch (command.type) {
    case 'spawnOrbitBlockers':
      if (boss) ports.spawnBossOrbitBlockers(boss);
      break;
    case 'updateOrbitBlockers':
      if (boss) ports.updateBossOrbitBlockers(boss, command.now);
      break;
    case 'spawnSummons':
      ports.spawnBossSummons(command.summons);
      break;
    default:
      break;
  }
}
