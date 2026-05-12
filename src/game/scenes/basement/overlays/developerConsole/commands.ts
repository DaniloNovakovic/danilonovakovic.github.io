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
}

export interface DeveloperConsoleCommandDeps {
  enterScene: (sceneId: SceneId) => void;
}

export interface DeveloperConsoleCommandResult {
  clearHistory?: boolean;
  responseLines?: string[];
}

interface SceneCommandTarget {
  id: SceneId;
  title: string;
}

const ENTER_HELP_ALIASES = new Set(['-h', '--help', 'help']);

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
  if (!commandArgs || ENTER_HELP_ALIASES.has(commandArgs)) {
    return { responseLines: getEnterHelpLines(copy) };
  }

  const sceneId = getSceneAliasMap().get(normalizeSceneToken(commandArgs));
  if (!sceneId) {
    return {
      responseLines: [
        copy.enterUnknownScene(commandArgs),
        copy.enterUsage
      ]
    };
  }

  deps.enterScene(sceneId);
  return {
    responseLines: [copy.enteringScene(sceneId)]
  };
}

export function executeDeveloperConsoleCommand(
  command: string,
  copy: DeveloperConsoleCopy,
  deps: DeveloperConsoleCommandDeps
): DeveloperConsoleCommandResult {
  const trimmed = command.trim();
  const normalized = trimmed.toLowerCase();

  if (!normalized) {
    return {};
  }

  if (normalized === 'clear') {
    return { clearHistory: true };
  }

  if (normalized === 'help') {
    return { responseLines: copy.helpResponse.split('\n') };
  }

  if (normalized === 'whoami') {
    return { responseLines: copy.whoamiResponse.split('\n') };
  }

  if (normalized === 'skills') {
    return { responseLines: copy.skillsResponse.split('\n') };
  }

  if (normalized.startsWith('enter')) {
    const commandArgs = trimmed.slice('enter'.length).trim().toLowerCase();
    return handleEnterCommand(commandArgs, copy, deps);
  }

  return { responseLines: [copy.commandNotFound(normalized)] };
}
