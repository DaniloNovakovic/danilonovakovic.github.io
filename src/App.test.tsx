// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { bridgeActions } from '@/game/bridge/store';
import { getMessages } from '@/shared/i18n';

describe('App screen damage (#164)', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/?mode=static');
    bridgeActions.resetProgress();
  });

  afterEach(() => {
    cleanup();
    bridgeActions.resetProgress();
    window.history.replaceState({}, '', '/');
  });

  it('keeps the cracks over the static portfolio, without taking clicks or focus', async () => {
    render(<App />);
    expect(screen.queryByTestId('screen-damage-layer')).toBeNull();

    act(() => {
      bridgeActions.crackScreen({ x: 0.9, y: 0.05, seed: 3 });
      bridgeActions.crackScreen({ x: 0.2, y: 0.5, seed: 4 });
    });

    const layer = screen.getByTestId('screen-damage-layer');
    expect(layer.getAttribute('aria-hidden')).toBe('true');
    expect(layer.getAttribute('class')).toContain('pointer-events-none');
    expect(layer.getAttribute('class')).toContain('fixed');
    expect(layer.querySelectorAll('g')).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: getMessages().staticPortfolio.switchToInteractive }));
    expect(window.location.search).toBe('?mode=interactive');
    expect(screen.getByTestId('screen-damage-layer')).toBeDefined();
  });

  it('keeps the card cracks with the card, off the static portfolio', () => {
    render(<App />);
    act(() => bridgeActions.crackCard({ x: 0.5, y: 0.5, seed: 5 }));
    expect(screen.queryByTestId('screen-damage-layer')).toBeNull();
    expect(screen.queryByTestId('screen-destroyer-card')).toBeNull();
  });
});
