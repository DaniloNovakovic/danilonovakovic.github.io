import { describe, expect, it } from 'vitest';
import {
  EXPLORING_MODE,
  GameState,
  closeRuntimeMode,
  createRuntimeModeForInteraction,
  deriveGameState,
  derivePause,
  modesEqual
} from './gameState';

describe('runtime mode helpers', () => {
  it('creates overlay and Phaser scene modes from feature ids', () => {
    expect(createRuntimeModeForInteraction('profile')).toEqual({
      kind: 'reactOverlay',
      miniGameId: 'profile'
    });
    expect(createRuntimeModeForInteraction('hobbies')).toEqual({
      kind: 'phaserScene',
      miniGameId: 'hobbies'
    });
  });

  it('derives legacy bridge state projections from runtime mode', () => {
    expect(deriveGameState(EXPLORING_MODE)).toEqual({
      status: GameState.EXPLORING,
      activeMiniGameId: null
    });
    expect(deriveGameState({ kind: 'reactOverlay', miniGameId: 'projects' })).toEqual({
      status: GameState.IN_MINIGAME,
      activeMiniGameId: 'projects'
    });
  });

  it('pauses only for React overlays', () => {
    expect(derivePause(EXPLORING_MODE)).toBe(false);
    expect(derivePause({ kind: 'phaserScene', miniGameId: 'hobbies' })).toBe(false);
    expect(derivePause({ kind: 'reactOverlay', miniGameId: 'profile' })).toBe(true);
  });

  it('closes overlays to a parent mode when one is provided', () => {
    const mode = closeRuntimeMode({ kind: 'reactOverlay', miniGameId: 'games' }, () => 'hobbies');

    expect(mode).toEqual({
      kind: 'phaserScene',
      miniGameId: 'hobbies'
    });
  });

  it('closes overlays without parents and Phaser scenes to exploring', () => {
    expect(closeRuntimeMode({ kind: 'reactOverlay', miniGameId: 'profile' })).toBe(EXPLORING_MODE);
    expect(closeRuntimeMode({ kind: 'phaserScene', miniGameId: 'hobbies' })).toBe(EXPLORING_MODE);
  });

  it('compares modes by kind and mini-game id', () => {
    expect(modesEqual(EXPLORING_MODE, { kind: 'exploring' })).toBe(true);
    expect(
      modesEqual(
        { kind: 'reactOverlay', miniGameId: 'profile' },
        { kind: 'reactOverlay', miniGameId: 'profile' }
      )
    ).toBe(true);
    expect(
      modesEqual(
        { kind: 'reactOverlay', miniGameId: 'profile' },
        { kind: 'reactOverlay', miniGameId: 'projects' }
      )
    ).toBe(false);
    expect(modesEqual({ kind: 'reactOverlay', miniGameId: 'profile' }, EXPLORING_MODE)).toBe(false);
  });
});
