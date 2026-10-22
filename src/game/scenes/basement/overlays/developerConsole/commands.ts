import { getDevSwitcherScenes } from '@/game/scenes/sceneRegistry';
import type { SceneId } from '@/game/scenes/sceneIds';

export interface DeveloperConsoleCopy {
  helpResponse: string;
  whoamiResponse: string;
  skillsResponse: string;
  enterUsage: string;
  enterAvailableScenesLabel: string;
  enterUnknownScene: (sceneName: string) => string;
  enteringScene: (sceneName: string) => string;
  commandNotFound: (command: string) => string;
  lsResponse: string;
  files: Readonly<Record<string, string>>;
  catUsage: string;
  catMissing: (fileName: string) => string;
  partsStatus: (owned: number, total: number, hasCircuit: boolean) => string;
  duckResponse: string;
  sudoResponse: string;
}

export interface CircuitStatus {
  ownedParts: number;
  totalParts: number;
  hasCircuit: boolean;
}

export interface DeveloperConsoleCommandDeps {
  enterScene: (sceneId: SceneId) => void;
  getCircuitStatus?: () => CircuitStatus;
}

export interface DeveloperConsoleCommandResult {
  clearHistory?: boolean;
  responseLines?: string[];
}

interface SceneCommandTarget {
  id: SceneId;
  title: string;
}

type ArgCommandHandler = (
  commandArgs: string,
  copy: DeveloperConsoleCopy,
  deps: DeveloperConsoleCommandDeps
) => DeveloperConsoleCommandResult;

const ENTER_HELP_ALIASES = new Set(['-h', '--help', 'help']);

function lines(text: string): DeveloperConsoleCommandResult {
  return { responseLines: text.split('\n') };
}

function normalizeSceneToken(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function getSceneCommandTargets(): readonly SceneCommandTarget[] {
  return getDevSwitcherScenes().map((scene) => ({
    id: scene.id,
    title: scene.title
  }));
}

function getSceneAliasMap(): ReadonlyMap<string, SceneId> {
  const aliases = new Map<string, SceneId>();

  for (const scene of getSceneCommandTargets()) {
    aliases.set(normalizeSceneToken(scene.id), scene.id);
    aliases.set(normalizeSceneToken(scene.title), scene.id);
  }

  aliases.set('stampede', 'stampedeSketch');

  return aliases;
}

function getEnterHelpLines(copy: DeveloperConsoleCopy): string[] {
  return [
    copy.enterUsage,
    copy.enterAvailableScenesLabel,
    ...getSceneCommandTargets().map((scene) => `- ${scene.id} (${scene.title})`)
  ];
}

function handleEnterCommand(
  commandArgs: string,
  copy: DeveloperConsoleCopy,
  deps: DeveloperConsoleCommandDeps
): DeveloperConsoleCommandResult {
  const sceneArgs = commandArgs.toLowerCase();
  if (!sceneArgs || ENTER_HELP_ALIASES.has(sceneArgs)) {
    return { responseLines: getEnterHelpLines(copy) };
  }

  const sceneId = getSceneAliasMap().get(normalizeSceneToken(sceneArgs));
  if (!sceneId) {
    return {
      responseLines: [
        copy.enterUnknownScene(sceneArgs),
        copy.enterUsage
      ]
    };
  }

  deps.enterScene(sceneId);
  return {
    responseLines: [copy.enteringScene(sceneId)]
  };
}

function handleCatCommand(
  commandArgs: string,
  copy: DeveloperConsoleCopy
): DeveloperConsoleCommandResult {
  const fileName = commandArgs.toLowerCase();
  if (!fileName) return { responseLines: [copy.catUsage] };
  return Object.hasOwn(copy.files, fileName)
    ? lines(copy.files[fileName])
    : { responseLines: [copy.catMissing(fileName)] };
}

function handlePartsCommand(
  _commandArgs: string,
  copy: DeveloperConsoleCopy,
  deps: DeveloperConsoleCommandDeps
): DeveloperConsoleCommandResult {
  const status = deps.getCircuitStatus?.() ?? { ownedParts: 0, totalParts: 3, hasCircuit: false };
  return lines(copy.partsStatus(status.ownedParts, status.totalParts, status.hasCircuit));
}

const TEXT_COMMANDS = new Map<string, (copy: DeveloperConsoleCopy) => string>([
  ['help', (copy) => copy.helpResponse],
  ['whoami', (copy) => copy.whoamiResponse],
  ['skills', (copy) => copy.skillsResponse],
  ['ls', (copy) => copy.lsResponse],
  ['duck', (copy) => copy.duckResponse],
  ['sudo', (copy) => copy.sudoResponse]
]);

const ARG_COMMANDS = new Map<string, ArgCommandHandler>([
  ['enter', handleEnterCommand],
  ['cat', (args, copy) => handleCatCommand(args, copy)],
  ['parts', handlePartsCommand]
]);

export function executeDeveloperConsoleCommand(
  command: string,
  copy: DeveloperConsoleCopy,
  deps: DeveloperConsoleCommandDeps
): DeveloperConsoleCommandResult {
  const trimmed = command.trim();
  if (!trimmed) return {};

  const [rawName = '', ...rest] = trimmed.split(/\s+/);
  const name = rawName.toLowerCase();
  const commandArgs = rest.join(' ');

  if (name === 'clear') return { clearHistory: true };

  const text = TEXT_COMMANDS.get(name);
  if (text) return lines(text(copy));

  const handler = ARG_COMMANDS.get(name);
  if (handler) return handler(commandArgs, copy, deps);

  return { responseLines: [copy.commandNotFound(trimmed.toLowerCase())] };
}
