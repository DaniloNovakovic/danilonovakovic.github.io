// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InteractiveApp from './InteractiveApp';
import { bridgeActions, bridgeStore } from '../shared/bridge/store';
import { TEXTS } from '../config/content';

vi.mock('./Game', () => ({
  default: () => <div data-testid="game-surface" />
}));

let resizeObserverCallback: ResizeObserverCallback | undefined;
let resizeObserverInstance: ResizeObserver | undefined;
const originalResizeObserver = globalThis.ResizeObserver;

class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    resizeObserverCallback = callback;
    resizeObserverInstance = this as unknown as ResizeObserver;
  }
}

function resetBridge() {
  bridgeActions.closeActiveMode();
  bridgeActions.closeUiDialog();
  bridgeActions.resetProgress();
  bridgeActions.resetTouch();
  bridgeActions.setSceneLoading(null);
}

describe('InteractiveApp', () => {
  beforeEach(() => {
    resizeObserverCallback = undefined;
    resizeObserverInstance = undefined;
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
    resetBridge();
  });

  afterEach(() => {
    cleanup();
    resetBridge();
    document.body.style.overflow = '';
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it('renders interactive controls in normal flow', () => {
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    const header = screen.getByRole('banner');
    const toolbar = screen.getByRole('navigation', { name: /interactive controls/i });
    expect(header.contains(toolbar)).toBe(true);
    expect(header.className).not.toContain('fixed');
    expect(toolbar).toBeDefined();
    expect(toolbar.className).not.toContain('fixed');
    expect(screen.getByRole('button', { name: /open inventory/i }).className).not.toContain('fixed');
    expect(screen.getByRole('button', { name: /switch to static portfolio/i }).className).not.toContain('fixed');
  });

  it('renders navigation hints in a normal-flow footer', () => {
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    const footer = screen.getByRole('contentinfo');
    expect(footer.className).not.toContain('fixed');
    expect(screen.getByText(TEXTS.navigation.hintsCompact)).toBeDefined();
    expect(screen.getByText(TEXTS.navigation.hintsCompact).closest('.fixed')).toBeNull();
  });

  it('caps game shell width from the measured content row height', async () => {
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    await waitFor(() => expect(resizeObserverCallback).toBeDefined());
    act(() => {
      resizeObserverCallback?.(
        [{ contentRect: { height: 320 } } as ResizeObserverEntry],
        resizeObserverInstance!
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('interactive-game-shell').style.getPropertyValue(
        '--mobile-game-shell-height-capped-width'
      )).toBe('min(450px, 240px)');
    });
  });

  it('opens and closes inventory as a dialog that pauses UI state', async () => {
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /open inventory/i }));

    expect(screen.getByRole('dialog', { name: /inventory/i })).toBeDefined();
    expect(bridgeStore.getState().activeUiDialogId).toBe('inventory');
    expect(bridgeStore.getState().isPaused).toBe(true);

    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() => expect(screen.queryByRole('dialog', { name: /inventory/i })).toBeNull());
    expect(bridgeStore.getState().activeUiDialogId).toBeNull();
    expect(bridgeStore.getState().isPaused).toBe(false);
  });

  it('renders the dev switcher only in dev builds and closes after selecting a target', async () => {
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    const devButton = screen.queryByRole('button', { name: /open dev scene switcher/i });
    expect(devButton).not.toBeNull();
    if (!devButton) return;

    await userEvent.click(devButton);
    expect(screen.getByRole('dialog', { name: /dev scene switcher/i })).toBeDefined();
    expect(bridgeStore.getState().activeUiDialogId).toBe('devSwitcher');

    await userEvent.click(screen.getByRole('button', { name: /^city$/i }));

    await waitFor(() => expect(screen.queryByRole('dialog', { name: /dev scene switcher/i })).toBeNull());
    expect(bridgeStore.getState().activeUiDialogId).toBeNull();
  });

  it('switches to static mode directly from the toolbar', async () => {
    const onSwitchToStatic = vi.fn();
    render(<InteractiveApp onSwitchToStatic={onSwitchToStatic} />);

    await userEvent.click(screen.getByRole('button', { name: /switch to static portfolio/i }));

    expect(onSwitchToStatic).toHaveBeenCalledTimes(1);
  });
});
