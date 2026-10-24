// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { bridgeActions, bridgeStore } from '@/game/bridge/store';
import DancingOverlay from './DancingOverlay';
import { DANCE_REWARD_ROUND, composePhrase, type DanceMove } from './danceRound';

const KEY_FOR_MOVE: Record<DanceMove, string> = {
  up: 'ArrowUp',
  right: 'ArrowRight',
  down: 'ArrowDown',
  left: 'ArrowLeft'
};

/** Same phrases the overlay composes while `Math.random` is pinned to 0. */
function scriptedRounds(rounds: number): string[][] {
  let previous: DanceMove[] | null = null;
  const keys: string[][] = [];
  for (let length = 1; length <= rounds; length++) {
    const phrase = composePhrase(length, previous, () => 0);
    previous = phrase;
    keys.push(phrase.map((move) => KEY_FOR_MOVE[move]));
  }
  return keys;
}

const ENOUGH_FOR_ANY_DEMO_MS = 20_000;

function pressKey(key: string) {
  act(() => {
    fireEvent.keyDown(window, { key });
  });
}

function waitForTurn() {
  act(() => {
    vi.advanceTimersByTime(ENOUGH_FOR_ANY_DEMO_MS);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  bridgeActions.resetProgress();
});

describe('DancingOverlay', () => {
  it('awards the clock crystal when round 5 is cleared', () => {
    render(<DancingOverlay close={vi.fn()} enterScene={vi.fn()} openOverlay={vi.fn()} titleId="t" descriptionId="d" />);
    pressKey('Enter');
    const rounds = scriptedRounds(DANCE_REWARD_ROUND);

    for (const keys of rounds) {
      waitForTurn();
      expect(bridgeStore.getState().inventory.ownedItemIds).not.toContain('clock-crystal');
      for (const key of keys) pressKey(key);
    }

    expect(bridgeStore.getState().inventory.ownedItemIds).toContain('clock-crystal');
    expect(screen.getByText('Spare part found!')).toBeDefined();
  });

  it('ends the run on a wrong move', () => {
    render(<DancingOverlay close={vi.fn()} enterScene={vi.fn()} openOverlay={vi.fn()} titleId="t" descriptionId="d" />);
    pressKey('Enter');
    waitForTurn();
    pressKey('ArrowLeft');
    expect(screen.getByText('Missed a step! 0 rounds cleared.')).toBeDefined();
  });
});
