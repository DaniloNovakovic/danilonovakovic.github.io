// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { bridgeActions, bridgeStore } from '@/game/bridge/store';
import MuayThaiOverlay from './MuayThaiOverlay';
import { COMBO_LENGTH, strikeZone, sweepPeriodMs } from './strikeCombo';

let clock = 0;

function strikeAtZoneCenter(step: number) {
  clock += strikeZone(step).center * (sweepPeriodMs(step) / 2);
  act(() => {
    fireEvent.keyDown(window, { key: ' ' });
  });
}

beforeEach(() => {
  clock = 1000;
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  bridgeActions.resetProgress();
});

describe('MuayThaiOverlay', () => {
  it('awards the battery cell for a full six-strike combo', () => {
    render(<MuayThaiOverlay close={vi.fn()} enterScene={vi.fn()} openOverlay={vi.fn()} titleId="t" descriptionId="d" />);
    for (let step = 0; step < COMBO_LENGTH; step++) {
      expect(bridgeStore.getState().inventory.ownedItemIds).not.toContain('battery-cell');
      strikeAtZoneCenter(step);
    }
    expect(bridgeStore.getState().inventory.ownedItemIds).toContain('battery-cell');
    expect(screen.getByText('FULL COMBO!')).toBeDefined();
    expect(screen.getByText('Spare part found!')).toBeDefined();
  });

  it('resets the combo on a mistimed strike', () => {
    render(<MuayThaiOverlay close={vi.fn()} enterScene={vi.fn()} openOverlay={vi.fn()} titleId="t" descriptionId="d" />);
    strikeAtZoneCenter(0);
    expect(screen.getByText(`Combo 1/${COMBO_LENGTH}`)).toBeDefined();
    clock += sweepPeriodMs(1) / 2 - 1;
    act(() => {
      fireEvent.keyDown(window, { key: ' ' });
    });
    expect(screen.getByText('WHIFF!')).toBeDefined();
    expect(screen.getByText(`Combo 0/${COMBO_LENGTH}`)).toBeDefined();
  });
});
