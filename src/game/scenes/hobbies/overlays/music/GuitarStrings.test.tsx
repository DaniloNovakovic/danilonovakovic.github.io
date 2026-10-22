// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { bridgeActions, bridgeStore } from '@/game/bridge/store';
import GuitarStrings from './GuitarStrings';
import { MARGIN_RIFF } from './riff';

function renderGuitar() {
  return render(
    <GuitarStrings close={vi.fn()} enterScene={vi.fn()} openOverlay={vi.fn()} titleId="t" descriptionId="d" />
  );
}

function playRiff() {
  for (const note of MARGIN_RIFF) {
    act(() => {
      fireEvent.keyDown(window, { key: String(note) });
    });
  }
}

afterEach(() => {
  cleanup();
  bridgeActions.resetProgress();
});

describe('GuitarStrings', () => {
  it('awards the copper string once when the margin riff is picked', () => {
    renderGuitar();
    fireEvent.keyDown(window, { key: '5' });
    playRiff();

    expect(bridgeStore.getState().inventory.ownedItemIds).toContain('copper-string');
    expect(screen.getByText('Spare part found!')).toBeDefined();

    playRiff();
    expect(screen.getByText('Already have it')).toBeDefined();
    expect(bridgeStore.getState().inventory.ownedItemIds.filter((id) => id === 'copper-string')).toHaveLength(1);
  });

  it('needs the whole riff before awarding', () => {
    renderGuitar();
    for (const note of MARGIN_RIFF.slice(0, 7)) {
      act(() => {
        fireEvent.keyDown(window, { key: String(note) });
      });
    }
    expect(bridgeStore.getState().inventory.ownedItemIds).not.toContain('copper-string');
  });
});
