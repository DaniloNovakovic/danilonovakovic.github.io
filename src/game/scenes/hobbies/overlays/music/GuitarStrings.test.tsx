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

function press(key: string) {
  act(() => {
    fireEvent.keyDown(window, { key });
  });
}

function playCampfire() {
  press('q');
  press(' ');
  press('w');
  press(' ');
  press('e');
  press(' ');
  press('r');
  press(' ');
}

afterEach(() => {
  cleanup();
  bridgeActions.resetProgress();
});

describe('GuitarStrings', () => {
  it('starts fretted to Em instead of open strings', () => {
    renderGuitar();
    expect(screen.getByRole('button', { name: 'String 5 (B2)' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'String 6 (E2)' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Em chord, key Q' }).getAttribute('aria-checked')).toBe('true');
  });

  it('shows the fretted notes of the latched shape', () => {
    renderGuitar();
    fireEvent.click(screen.getByRole('radio', { name: 'G chord, key W' }));
    expect(screen.getByRole('button', { name: 'String 6 (G2)' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'String 1 (G4)' })).toBeDefined();

    fireEvent.click(screen.getByRole('radio', { name: 'D chord, key E' }));
    expect(screen.getByRole('button', { name: 'String 1 (F#4)' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'String 6, muted' })).toBeDefined();
  });

  it('awards the copper string once when Em G D C is strummed', () => {
    renderGuitar();
    press('5');
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
    press(' ');
    press(' ');
    press('w');
    press(' ');
    press('t');
    press(' ');
    press('r');
    press(' ');
    expect(bridgeStore.getState().inventory.ownedItemIds).not.toContain('copper-string');

    fireEvent.click(screen.getByRole('radio', { name: 'Em chord, key Q' }));
    fireEvent.click(screen.getByRole('button', { name: 'Strum down' }));
    fireEvent.click(screen.getByRole('radio', { name: 'G chord, key W' }));
    fireEvent.click(screen.getByRole('button', { name: 'Strum down' }));
    fireEvent.click(screen.getByRole('radio', { name: 'D chord, key E' }));
    fireEvent.click(screen.getByRole('button', { name: 'Strum down' }));
    fireEvent.click(screen.getByRole('radio', { name: 'C chord, key R' }));
    fireEvent.click(screen.getByRole('button', { name: 'Strum down' }));
    expect(bridgeStore.getState().inventory.ownedItemIds).toContain('copper-string');
  });
});
