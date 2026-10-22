// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { bridgeActions, bridgeStore } from '@/game/bridge/store';
import DancingOverlay from './DancingOverlay';
import { DANCE_REWARD_ROUND } from './danceRound';

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

    for (let round = 1; round <= DANCE_REWARD_ROUND; round++) {
      waitForTurn();
      expect(bridgeStore.getState().inventory.ownedItemIds).not.toContain('clock-crystal');
      for (let move = 0; move < round; move++) pressKey(move % 2 === 0 ? 'ArrowUp' : 'w');
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
