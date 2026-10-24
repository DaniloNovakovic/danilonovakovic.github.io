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
    const strikePad = screen.getByRole('button', { name: /timing bar/i });
    const dismiss = screen.getByRole('button', { name: 'Dismiss sticker' });
    expect(strikePad.contains(dismiss)).toBe(false);
    act(() => {
      fireEvent.pointerDown(dismiss, { button: 0 });
    });
    expect(screen.queryByText('WHIFF!')).toBeNull();
  });

  it('strikes from the page around the bag, which also covers the timing bar', () => {
    render(<MuayThaiOverlay close={vi.fn()} enterScene={vi.fn()} openOverlay={vi.fn()} titleId="t" descriptionId="d" />);
    const strikePad = screen.getByRole('button', { name: /timing bar/i });
    const bar = screen.getByRole('img', { name: 'Timing bar' });
    expect(strikePad.className).toContain('inset-0');
    expect(strikePad.parentElement?.contains(bar)).toBe(true);
    clock += strikeZone(0).center * (sweepPeriodMs(0) / 2);
    act(() => {
      fireEvent.pointerDown(strikePad, { button: 0 });
    });
    expect(screen.getByText(`Combo 1/${COMBO_LENGTH}`)).toBeDefined();
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
