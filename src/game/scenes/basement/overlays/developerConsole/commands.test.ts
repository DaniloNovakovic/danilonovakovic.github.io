import { describe, expect, it, vi } from 'vitest';
import { executeDeveloperConsoleCommand, type DeveloperConsoleCopy } from './commands';

const copy: DeveloperConsoleCopy = {
  helpResponse: "Available commands: whoami, skills, enter <scene-name>, clear\nTry 'enter -h' to list scenes.",
  whoamiResponse: 'whoami',
  skillsResponse: 'skills',
  enterUsage: "Usage: enter <scene-name> or 'enter -h'",
  enterAvailableScenesLabel: 'Available scene names:',
  enterUnknownScene: (sceneName) => `Unknown scene: ${sceneName}`,
  enteringScene: (sceneName) => `Entering ${sceneName}...`,
  commandNotFound: (command) => `Command not found: ${command}`
};

describe('executeDeveloperConsoleCommand', () => {
  it('lists available scene names for enter help', () => {
    const enterScene = vi.fn();
    const result = executeDeveloperConsoleCommand('enter -h', copy, { enterScene });

    expect(result.responseLines).toContain(copy.enterUsage);
    expect(result.responseLines).toContain(copy.enterAvailableScenesLabel);
    expect(result.responseLines).toContain('- ridge (Sketchbook Ridge)');
    expect(enterScene).not.toHaveBeenCalled();
  });

  it('enters scenes by scene id aliases', () => {
    const enterScene = vi.fn();
    const result = executeDeveloperConsoleCommand('enter ridge', copy, { enterScene });

    expect(enterScene).toHaveBeenCalledWith('ridge');
    expect(result.responseLines).toEqual(['Entering ridge...']);
  });

  it('supports loose stampede sketch aliases', () => {
    const enterScene = vi.fn();
    executeDeveloperConsoleCommand('enter stampede sketch', copy, { enterScene });

    expect(enterScene).toHaveBeenCalledWith('stampedeSketch');
  });

  it('shows usage when the scene name is unknown', () => {
    const enterScene = vi.fn();
    const result = executeDeveloperConsoleCommand('enter moon', copy, { enterScene });

    expect(result.responseLines).toEqual([
      'Unknown scene: moon',
      "Usage: enter <scene-name> or 'enter -h'"
    ]);
    expect(enterScene).not.toHaveBeenCalled();
  });

  it('clears history through a command result flag', () => {
    const result = executeDeveloperConsoleCommand('clear', copy, {
      enterScene: () => undefined
    });

    expect(result).toEqual({ clearHistory: true });
  });
});
