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
  if (applySessionBoardCommand(internals, command)) return;
  if (applySessionWaveCommand(internals, command)) return;
  if (applySessionHudCommand(internals, command)) return;
  applySessionFlowCommand(internals, command);
}

function applySessionBoardCommand(
  internals: PotassiumCommandAdapterInternals,
  command: PotassiumSessionCommand
): boolean {
  const { ports } = internals;
  switch (command.type) {
    case 'resetBoard':
      ports.resetBoardObjects();
      return true;
    case 'hideMainOverlay':
      ports.hideMainOverlay();
      return true;
    case 'clearTerminal':
      ports.clearTerminalOverlay();
      return true;
    case 'clearUpgradeChoices':
      ports.clearUpgradeChoiceOverlay();
      return true;
    case 'stopBanana':
      ports.stopMainProjectile();
      return true;
    case 'clearBoardForOutcome':
      ports.clearBoardForOutcome();
      return true;
    default:
      return false;
  }
}

function applySessionWaveCommand(
  internals: PotassiumCommandAdapterInternals,
  command: PotassiumSessionCommand
): boolean {
  const { ports } = internals;
  switch (command.type) {
    case 'spawnWave':
      ports.spawnWave(command.wave);
      return true;
    case 'spawnBoss':
      ports.spawnBossDelayed();
      return true;
    case 'scheduleWaveRows':
      ports.scheduleWaveRows(command.schedule);
      return true;
    case 'scheduleUpgradeChoices':
      ports.scheduleUpgradeChoices();
      return true;
    case 'advanceWaveAfterDelay':
      ports.advanceWaveAfterDelay(command.wave);
      return true;
    case 'refreshProjectileVisuals':
      ports.refreshAllProjectileVisuals();
      return true;
    default:
      return false;
  }
}

function applySessionHudCommand(
  internals: PotassiumCommandAdapterInternals,
  command: PotassiumSessionCommand
): boolean {
  const { ports } = internals;
  switch (command.type) {
    case 'setHint':
      ports.setHint(command.text);
      return true;
    case 'updateHud':
      ports.updateHud(command.hud);
      return true;
    case 'collectCircuit':
      ports.collectCircuit();
      return true;
    case 'saveRunRecord':
      ports.saveRunRecord(command.record);
      return true;
    default:
      return false;
  }
}

function applySessionFlowCommand(
  internals: PotassiumCommandAdapterInternals,
  command: PotassiumSessionCommand
): void {
  const { ports } = internals;
  switch (command.type) {
    case 'showUpgradeChoices':
      ports.showUpgradeChoices(command.choices);
      break;
    case 'showOutcome':
      ports.showOutcomeOverlay(command);
      break;
    case 'showTerminal':
      ports.showTerminal(command.outcome);
      break;
    case 'closeScene':
      ports.closeScene();
      break;
    default:
      break;
  }
}
