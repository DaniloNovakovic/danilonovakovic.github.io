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
  for (const key of ['g', 'd', 'e', 'c', 'g']) {
    press(key);
    press(' ');
  }
}

afterEach(() => {
  cleanup();
  bridgeActions.resetProgress();
});

describe('GuitarStrings', () => {
  it('starts on G, with I 9 0 on the treble and N M J on the bass', () => {
    renderGuitar();
    expect(screen.getByRole('radio', { name: 'G chord, key G' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: 'Am chord, key A' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'F#° chord, key F' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'String 0 (G4)' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'String I (G3)' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'String N (G2)' })).toBeDefined();
  });

  it('uses shift for the other voicing and option for the other quality', () => {
    renderGuitar();
    press('G', true);
    expect(screen.getByRole('button', { name: 'String 0 (G4)' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'String N, muted' })).toBeDefined();

    press('a', false, true);
    expect(screen.getByRole('button', { name: 'String 9 (C#4)' })).toBeDefined();

    press('å', false, true, 'KeyE');
    expect(screen.getByRole('radio', { name: 'E chord, key E' }).getAttribute('aria-checked')).toBe('true');
  });

  it('moves the whole key up with = and keeps it there', () => {
    renderGuitar();
    press('=');
    expect(screen.getByRole('radio', { name: 'G# chord, key G' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('button', { name: 'String 0 (G#4)' })).toBeDefined();
    press('=');
    expect(screen.getByRole('radio', { name: 'A chord, key A' }).getAttribute('aria-checked')).toBe('true');
    press('-');
    expect(screen.getByRole('radio', { name: 'G# chord, key G' }).getAttribute('aria-checked')).toBe('true');
  });

  it('awards the copper string once when G D Em C G is strummed', () => {
    renderGuitar();
    press('j');
    press('1');
    expect(bridgeStore.getState().inventory.ownedItemIds).not.toContain('copper-string');

    playCampfire();
    expect(bridgeStore.getState().inventory.ownedItemIds).toContain('copper-string');
    expect(screen.getByText('Spare part found!')).toBeDefined();
    expect(screen.getByText('Nailed it!')).toBeDefined();

    playCampfire();
    expect(screen.queryByText('Already have it')).toBeNull();
    expect(screen.queryByText('Spare part found!')).toBeNull();
    expect(bridgeStore.getState().inventory.ownedItemIds.filter((id) => id === 'copper-string')).toHaveLength(1);
  });

  it('moves the scale to the next CAGED position on P', () => {
    renderGuitar();
    expect(screen.getByRole('button', { name: 'Position G' })).toBeDefined();
    press('p');
    expect(screen.getByRole('button', { name: 'String 9 (D4)' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Position E' })).toBeDefined();
    press('a');
    expect(screen.getByRole('button', { name: 'String 0 (A4)' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'String N, muted' })).toBeNull();
    expect(screen.getByText('0/5')).toBeDefined();
  });

  it('puts the six string keys on one row', () => {
    renderGuitar();
    const low = screen.getByRole('button', { name: 'String N (G2)' });
    const high = screen.getByRole('button', { name: 'String 0 (G4)' });
    expect(low.parentElement).toBe(high.parentElement);
    expect(low.parentElement?.querySelectorAll('button')).toHaveLength(6);
  });

  it('colors the chord with 7 and clears it on the second press', () => {
    renderGuitar();
    press('7');
    expect(screen.getByRole('radio', { name: 'G7 chord, key G' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('button', { name: 'String 0 (F4)' })).toBeDefined();
    press('7');
    expect(screen.getByRole('radio', { name: 'G chord, key G' }).getAttribute('aria-checked')).toBe('true');
  });

  it('offers pencil sketches that do not award a spare string', () => {
    renderGuitar();
    press(']');
    expect(screen.getByText('Porch swing')).toBeDefined();
    expect(screen.getByText('I–IV–I–V–IV–I')).toBeDefined();
    for (const key of ['g', 'c', 'g', 'd', 'c', 'g']) {
      press(key);
      press(' ');
    }
    expect(screen.getByText('Sketched!')).toBeDefined();
    expect(bridgeStore.getState().inventory.ownedItemIds).not.toContain('copper-string');

    press('[');
    expect(screen.getByText('Campfire')).toBeDefined();
    playCampfire();
    expect(bridgeStore.getState().inventory.ownedItemIds).toContain('copper-string');
  });

  it('strums up on V', () => {
    renderGuitar();
    expect(screen.getByRole('button', { name: 'Upstroke' }).textContent).toContain('V');
    press('v');
    expect(screen.getByText('1/5')).toBeDefined();
  });

  it('toggles palm on X and a short strum on S', () => {
    renderGuitar();
    const palmButton = () => screen.getByRole('button', { name: /Palm mute/ });
    const shortButton = () => screen.getByRole('button', { name: /Short strum/ });
    expect(palmButton().textContent).toContain('X');
    expect(palmButton().getAttribute('aria-pressed')).toBe('false');
    expect(shortButton().textContent).toContain('S');

    press('x');
    expect(palmButton().getAttribute('aria-pressed')).toBe('true');
    press('k');
    expect(palmButton().getAttribute('aria-pressed')).toBe('true');

    press('s');
    expect(shortButton().getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('img', { name: 'G shape, palm muted, short strum' })).toBeDefined();
    press('s');
    expect(shortButton().getAttribute('aria-pressed')).toBe('false');
  });

  it('lets a picked note ring and chucks only the strum', () => {
    renderGuitar();
    press('s');
    fireEvent.click(screen.getByRole('button', { name: 'String N (G2)' }));
    expect(document.querySelectorAll('.hobby-string-vibrate')).toHaveLength(1);
    expect(document.querySelectorAll('.hobby-string-chuck')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Strum down' }));
    expect(document.querySelectorAll('.hobby-string-vibrate')).toHaveLength(0);
    expect(document.querySelectorAll('.hobby-string-chuck')).toHaveLength(6);
  });

  it('lets the home key rename the chords and starts with the bass note on', () => {
    renderGuitar();
    fireEvent.click(screen.getByRole('button', { name: 'Guitar settings' }));
    expect((screen.getByRole('checkbox', { name: 'Bass note' }) as HTMLInputElement).checked).toBe(true);

    expect(screen.getByRole('radio', { name: 'Key E' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Key F#' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Key G#' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Key A#' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Key C#' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Key D#' })).toBeDefined();

    fireEvent.click(screen.getByRole('radio', { name: 'Key A' }));
    expect(screen.queryByRole('radio', { name: 'Key A' })).toBeNull();
    expect(screen.getByRole('radio', { name: 'A chord, key A' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('Strum A, E, F#m, D, A. Strumming the same chord twice is fine.')).toBeDefined();
    press('d');
    expect(screen.getByRole('radio', { name: 'D chord, key D' }).getAttribute('aria-checked')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Guitar settings' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Key C' }));
    press('d');
    expect(screen.getByRole('radio', { name: 'Dm chord, key D' }).getAttribute('aria-checked')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Guitar settings' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Key F' }));
    press('b');
    expect(screen.getByRole('radio', { name: 'Bb chord, key B' }).getAttribute('aria-checked')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Guitar settings' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Key F#' }));
    expect(screen.getByText('Strum F#, C#, D#m, B, F#. Strumming the same chord twice is fine.')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Guitar settings' }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('radio', { name: 'Key G' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Guitar settings' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Bass note' }));
    expect((screen.getByRole('checkbox', { name: 'Bass note' }) as HTMLInputElement).checked).toBe(false);
  });

  it('keeps the song when a chord is strummed twice and drops it on a wrong chord', () => {
    renderGuitar();
    press('g');
    press(' ');
    press(' ');
    press('d');
    press(' ');
    press('a');
    press(' ');
    expect(bridgeStore.getState().inventory.ownedItemIds).not.toContain('copper-string');

    fireEvent.click(screen.getByRole('radio', { name: 'G chord, key G' }));
    fireEvent.click(screen.getByRole('button', { name: 'Strum down' }));
    fireEvent.click(screen.getByRole('radio', { name: 'D chord, key D' }));
    fireEvent.click(screen.getByRole('button', { name: 'Strum down' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Em chord, key E' }));
    fireEvent.click(screen.getByRole('button', { name: 'Strum down' }));
    fireEvent.click(screen.getByRole('radio', { name: 'C chord, key C' }));
    fireEvent.click(screen.getByRole('button', { name: 'Strum down' }));
    fireEvent.click(screen.getByRole('radio', { name: 'G chord, key G' }));
    fireEvent.click(screen.getByRole('button', { name: 'Strum down' }));
    expect(bridgeStore.getState().inventory.ownedItemIds).toContain('copper-string');
  });
});
