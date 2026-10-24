// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { bridgeActions, bridgeStore } from '@/game/bridge/store';
import GuitarStrings from './GuitarStrings';

function renderGuitar() {
  return render(
    <GuitarStrings close={vi.fn()} enterScene={vi.fn()} openOverlay={vi.fn()} titleId="t" descriptionId="d" />
  );
}

function press(key: string, shiftKey = false, altKey = false, code?: string) {
  act(() => {
    fireEvent.keyDown(window, { key, shiftKey, altKey, code });
  });
}

function playCampfire() {
  for (const key of ['g', 'd', 'c', 'g']) {
    press(key);
    press(' ');
  }
}

afterEach(() => {
  cleanup();
  bridgeActions.resetProgress();
});

describe('GuitarStrings', () => {
  it('starts on G, with the fingers on J K L and the bass on I O P', () => {
    renderGuitar();
    expect(screen.getByRole('radio', { name: 'G chord, key G' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: 'Am chord, key A' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'F#° chord, key F' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'String L (G4)' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'String J (G3)' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'String I (G2)' })).toBeDefined();
  });

  it('uses shift for the other voicing and option for the other quality', () => {
    renderGuitar();
    press('G', true);
    expect(screen.getByRole('button', { name: 'String L (G4)' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'String I, muted' })).toBeDefined();

    press('a', false, true);
    expect(screen.getByRole('button', { name: 'String K (C#4)' })).toBeDefined();

    press('å', false, true, 'KeyE');
    expect(screen.getByRole('radio', { name: 'E chord, key E' }).getAttribute('aria-checked')).toBe('true');
  });

  it('slides the shape with = and will not count that chord in the song', () => {
    renderGuitar();
    press('=');
    expect(screen.getByRole('button', { name: 'String L (G#4)' })).toBeDefined();
    press(' ');
    press('d');
    press(' ');
    press('c');
    press(' ');
    press('g');
    press(' ');
    expect(bridgeStore.getState().inventory.ownedItemIds).not.toContain('copper-string');
  });

  it('awards the copper string once when G D C G is strummed', () => {
    renderGuitar();
    press('j');
    press('1');
    expect(bridgeStore.getState().inventory.ownedItemIds).not.toContain('copper-string');

    playCampfire();
    expect(bridgeStore.getState().inventory.ownedItemIds).toContain('copper-string');
    expect(screen.getByText('Spare part found!')).toBeDefined();
    expect(screen.getByText('Nailed it!')).toBeDefined();

    playCampfire();
    expect(screen.getByText('Already have it')).toBeDefined();
    expect(bridgeStore.getState().inventory.ownedItemIds.filter((id) => id === 'copper-string')).toHaveLength(1);
  });

  it('keeps the song when a chord is strummed twice and drops it on a wrong chord', () => {
    renderGuitar();
    press('g');
    press(' ');
    press(' ');
    press('d');
    press(' ');
    press('e');
    press(' ');
    expect(bridgeStore.getState().inventory.ownedItemIds).not.toContain('copper-string');

    fireEvent.click(screen.getByRole('radio', { name: 'G chord, key G' }));
    fireEvent.click(screen.getByRole('button', { name: 'Strum down' }));
    fireEvent.click(screen.getByRole('radio', { name: 'D chord, key D' }));
    fireEvent.click(screen.getByRole('button', { name: 'Strum down' }));
    fireEvent.click(screen.getByRole('radio', { name: 'C chord, key C' }));
    fireEvent.click(screen.getByRole('button', { name: 'Strum down' }));
    fireEvent.click(screen.getByRole('radio', { name: 'G chord, key G' }));
    fireEvent.click(screen.getByRole('button', { name: 'Strum down' }));
    expect(bridgeStore.getState().inventory.ownedItemIds).toContain('copper-string');
  });
});
