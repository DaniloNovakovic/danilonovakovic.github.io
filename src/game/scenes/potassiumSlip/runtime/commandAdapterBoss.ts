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
  const { ports } = internals;

  switch (command.type) {
    case 'setBossPhase':
      if (boss) setPotassiumData(boss, POTASSIUM_DATA_KEYS.bossPhase, command.phase);
      return;
    case 'setBossVelocity':
      if (boss) {
        if (command.x !== undefined) boss.setX(command.x);
        if (command.velocityX !== undefined) boss.setVelocityX(command.velocityX);
        boss.setVelocityY(command.velocityY);
      }
      return;
    case 'startStone':
      if (boss) setPotassiumData(boss, POTASSIUM_DATA_KEYS.stoneUntil, command.stoneUntil);
      return;
    case 'endStone':
      if (boss) setPotassiumData(boss, POTASSIUM_DATA_KEYS.stoneUntil, undefined);
      return;
    case 'setBossHint':
      ports.setHint(command.text);
      return;
    case 'shakeCamera':
      ports.shakeCamera(command.durationMs, command.intensity);
      return;
    case 'setStoneVisual':
      if (boss) ports.setBossStoneVisual(boss, command.active);
      return;
    case 'clearOrbitBlockers':
      ports.clearOrbitBlockers();
      return;
    case 'spawnOrbitBlockers':
      if (boss) ports.spawnBossOrbitBlockers(boss);
      return;
    case 'updateOrbitBlockers':
      if (boss) ports.updateBossOrbitBlockers(boss, command.now);
      return;
    case 'spawnSummons':
      ports.spawnBossSummons(command.summons);
      return;
    default:
      break;
  }
}
