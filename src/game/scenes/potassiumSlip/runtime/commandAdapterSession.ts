import type { PotassiumSessionCommand } from './session';
import type { PotassiumCommandAdapterInternals } from './commandAdapterInternals';

export function applySessionCommands(
  internals: PotassiumCommandAdapterInternals,
  commands: readonly PotassiumSessionCommand[]
): void {
  commands.forEach((command) => applySessionCommand(internals, command));
}

function applySessionCommand(
  internals: PotassiumCommandAdapterInternals,
  command: PotassiumSessionCommand
): void {
  const { ports } = internals;

  switch (command.type) {
    case 'resetBoard':
      ports.resetBoardObjects();
      return;
    case 'hideMainOverlay':
      ports.hideMainOverlay();
      return;
    case 'clearTerminal':
      ports.clearTerminalOverlay();
      return;
    case 'clearUpgradeChoices':
      ports.clearUpgradeChoiceOverlay();
      return;
    case 'stopBanana':
      ports.stopMainProjectile();
      return;
    case 'clearBoardForOutcome':
      ports.clearBoardForOutcome();
      return;
    case 'spawnWave':
      ports.spawnWave(command.wave);
      return;
    case 'spawnBoss':
      ports.spawnBossDelayed();
      return;
    case 'scheduleWaveRows':
      ports.scheduleWaveRows(command.schedule);
      return;
    case 'scheduleUpgradeChoices':
      ports.scheduleUpgradeChoices();
      return;
    case 'advanceWaveAfterDelay':
      ports.advanceWaveAfterDelay(command.wave);
      return;
    case 'refreshProjectileVisuals':
      ports.refreshAllProjectileVisuals();
      return;
    case 'setHint':
      ports.setHint(command.text);
      return;
    case 'updateHud':
      ports.updateHud(command.hud);
      return;
    case 'collectCircuit':
      ports.collectCircuit();
      return;
    case 'saveRunRecord':
      ports.saveRunRecord(command.record);
      return;
    case 'showUpgradeChoices':
      ports.showUpgradeChoices(command.choices);
      return;
    case 'showOutcome':
      ports.showOutcomeOverlay(command);
      return;
    case 'showTerminal':
      ports.showTerminal(command.outcome);
      return;
    case 'closeScene':
      ports.closeScene();
      return;
    default:
      break;
  }
}
