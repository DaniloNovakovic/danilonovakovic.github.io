// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InteractiveApp from './InteractiveApp';
import { bridgeActions, bridgeStore } from '@/game/bridge/store';
import {
  OVERWORLD_SCENE_ID,
  POTASSIUM_SCENE_ID,
  RIDGE_SCENE_ID,
  STAMPEDE_SKETCH_SCENE_ID
} from '@/game/scenes/sceneIds';
import { createStampedeResultViewModel } from '@/game/scenes/stampedeSketch/runtime/resultPresentation';
import { getMessages } from '@/shared/i18n';

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
  bridgeActions.returnToOverworld();
  bridgeActions.closeOverlay();
  bridgeActions.resetProgress();
  bridgeActions.resetTouch();
  bridgeActions.setSceneLoading(null);
  bridgeActions.clearSceneUi();
}

function setViewportSize(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: height
  });
}

describe('InteractiveApp', () => {
  beforeEach(() => {
    resizeObserverCallback = undefined;
    resizeObserverInstance = undefined;
    setViewportSize(1024, 768);
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
    const messages = getMessages();

    const footer = screen.getByRole('contentinfo');
    expect(footer.className).not.toContain('fixed');
    expect(screen.getByText(messages.navigation.hintsCompact)).toBeDefined();
    expect(screen.getByText(messages.navigation.hintsCompact).closest('.fixed')).toBeNull();
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

    expect(await screen.findByRole('dialog', { name: /inventory/i })).toBeDefined();
    expect(bridgeStore.getState().activeOverlayId).toBe('inventory');
    expect(bridgeStore.getState().isPaused).toBe(true);

    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() => expect(screen.queryByRole('dialog', { name: /inventory/i })).toBeNull());
    expect(bridgeStore.getState().activeOverlayId).toBeNull();
    expect(bridgeStore.getState().isPaused).toBe(false);
  });

  it('renders the dev switcher only in dev builds and closes after selecting a target', async () => {
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    const devButton = screen.queryByRole('button', { name: /open dev scene switcher/i });
    expect(devButton).not.toBeNull();
    if (!devButton) return;

    await userEvent.click(devButton);
    expect(await screen.findByRole('dialog', { name: /dev scene switcher/i })).toBeDefined();
    expect(bridgeStore.getState().activeOverlayId).toBe('devSwitcher');

    await userEvent.click(screen.getByRole('button', { name: /^city$/i }));

    await waitFor(() => expect(screen.queryByRole('dialog', { name: /dev scene switcher/i })).toBeNull());
    expect(bridgeStore.getState().activeOverlayId).toBeNull();
  });

  it('replaces inventory and dev controls with Back during Stampede Sketch', async () => {
    bridgeActions.enterScene(STAMPEDE_SKETCH_SCENE_ID);
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    expect(screen.getByRole('button', { name: /back to ridge/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /open inventory/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /open dev scene switcher/i })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /back to ridge/i }));

    expect(bridgeStore.getState().activeSceneId).toBe(RIDGE_SCENE_ID);
  });

  it('replaces inventory and dev controls with Back during Potassium Slip', async () => {
    bridgeActions.enterScene(POTASSIUM_SCENE_ID);
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    expect(screen.getByRole('button', { name: /back to city/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /open inventory/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /open dev scene switcher/i })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /back to city/i }));

    expect(bridgeStore.getState().activeSceneId).toBe(OVERWORLD_SCENE_ID);
  });

  it('renders Potassium inside the Notebook shell with Back and Static Mode chrome', async () => {
    const onSwitchToStatic = vi.fn();
    bridgeActions.enterScene(POTASSIUM_SCENE_ID);
    render(<InteractiveApp onSwitchToStatic={onSwitchToStatic} />);

    expect(screen.getByTestId('notebook-game-shell')).toBeDefined();
    expect(screen.queryByTestId('interactive-game-shell')).toBeNull();
    expect(screen.getByTestId('notebook-game-shell').getAttribute('data-profile')).toBe('ruledBoardPage');
    const pageFrame = screen.getByTestId('potassium-notebook-page-frame');
    expect(pageFrame.getAttribute('data-board-safe-aspect')).toBe('0.75');
    expect(pageFrame.className).toContain('potassium-notebook-page-frame');
    expect(screen.getByRole('button', { name: /back to city/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /switch to static portfolio/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /menu/i })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /switch to static portfolio/i }));

    expect(onSwitchToStatic).toHaveBeenCalledTimes(1);
  });

  it('keeps the Potassium page frame at the board-safe aspect on narrow phones', () => {
    setViewportSize(390, 844);
    bridgeActions.enterScene(POTASSIUM_SCENE_ID);
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    const pageFrame = screen.getByTestId('potassium-notebook-page-frame');

    expect(pageFrame.getAttribute('data-board-safe-aspect')).toBe('0.75');
    expect(pageFrame.getAttribute('data-frame-aspect')).toBe('0.75');
    expect(pageFrame.getAttribute('data-frame-width')).toBe('326');
    expect(pageFrame.style.width).toBe('326px');
  });

  it('queues Potassium control-mat pointer events in Phaser design space', () => {
    bridgeActions.enterScene(POTASSIUM_SCENE_ID);
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);
    const frame = screen.getByTestId('potassium-notebook-game-frame');
    const mat = screen.getByTestId('potassium-control-mat');
    vi.spyOn(frame, 'getBoundingClientRect').mockReturnValue({
      bottom: 500,
      height: 300,
      left: 100,
      right: 600,
      top: 200,
      width: 500,
      x: 100,
      y: 200,
      toJSON: () => ({})
    } as DOMRect);

    fireEvent.pointerDown(mat, {
      clientX: 350,
      clientY: 350,
      pointerId: 11,
      timeStamp: 18
    });
    fireEvent.pointerUp(mat, {
      clientX: 350,
      clientY: 560,
      pointerId: 11,
      timeStamp: 32
    });

    expect(bridgeStore.getState().sceneControlPointerEvents).toMatchObject([
      {
        ownerSceneId: POTASSIUM_SCENE_ID,
        kind: 'down',
        pointerId: 11,
        x: 500,
        y: 300
      },
      {
        ownerSceneId: POTASSIUM_SCENE_ID,
        kind: 'up',
        pointerId: 11,
        x: 500,
        y: 720
      }
    ]);
  });

  it('does not queue Potassium control-mat events while a scene panel is open', () => {
    bridgeActions.enterScene(POTASSIUM_SCENE_ID);
    bridgeActions.setSceneUiPanel(POTASSIUM_SCENE_ID, 'potassiumUpgradeChoices', {
      choices: []
    });
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);
    const frame = screen.getByTestId('potassium-notebook-game-frame');
    const mat = screen.getByTestId('potassium-control-mat');
    vi.spyOn(frame, 'getBoundingClientRect').mockReturnValue({
      bottom: 500,
      height: 300,
      left: 100,
      right: 600,
      top: 200,
      width: 500,
      x: 100,
      y: 200,
      toJSON: () => ({})
    } as DOMRect);

    fireEvent.pointerDown(mat, {
      clientX: 350,
      clientY: 350,
      pointerId: 12
    });

    expect(bridgeStore.getState().sceneControlPointerEvents).toEqual([]);
  });

  it('renders Stampede scene status below the game card', () => {
    bridgeActions.enterScene(STAMPEDE_SKETCH_SCENE_ID);
    bridgeActions.setSceneUiStatus(STAMPEDE_SKETCH_SCENE_ID, 'stampedeStatus', {
      timeRemainingSeconds: 68,
      phaseLabel: 'Breather',
      pageNoise: 0.4
    });
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    const footer = screen.getByRole('contentinfo');
    expect(footer.contains(screen.getByText('1:08'))).toBe(true);
    expect(footer.contains(screen.getByText('Breather'))).toBe(true);
    expect(screen.getByRole('progressbar', { name: /page noise/i }).getAttribute('aria-valuenow')).toBe('40');
  });

  it('dispatches Stampede start panel actions through scene UI', async () => {
    bridgeActions.enterScene(STAMPEDE_SKETCH_SCENE_ID);
    bridgeActions.setSceneUiPanel(STAMPEDE_SKETCH_SCENE_ID, 'stampedeStartPrompt');
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /^start$/i }));

    expect(bridgeStore.getState().sceneUi.lastAction).toMatchObject({
      ownerSceneId: STAMPEDE_SKETCH_SCENE_ID,
      action: 'start'
    });
  });

  it('dispatches Stampede result retry and back actions through scene UI', async () => {
    bridgeActions.enterScene(STAMPEDE_SKETCH_SCENE_ID);
    bridgeActions.setSceneUiPanel(
      STAMPEDE_SKETCH_SCENE_ID,
      'stampedeResult',
      createStampedeResultViewModel({
        phase: 'failed',
        elapsedMs: 34_000,
        durationMs: 90_000,
        contacts: 3
      })
    );
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);
    const resultDialog = screen.getByRole('dialog', { name: /page got crowded/i });

    expect(within(resultDialog).getByRole('button', { name: /^retry$/i })).toBeDefined();
    expect(within(resultDialog).getByRole('button', { name: /back to ridge/i })).toBeDefined();

    await userEvent.click(within(resultDialog).getByRole('button', { name: /^retry$/i }));
    expect(bridgeStore.getState().sceneUi.lastAction).toMatchObject({
      ownerSceneId: STAMPEDE_SKETCH_SCENE_ID,
      action: 'retry'
    });

    await userEvent.click(within(resultDialog).getByRole('button', { name: /back to ridge/i }));
    expect(bridgeStore.getState().sceneUi.lastAction).toMatchObject({
      ownerSceneId: STAMPEDE_SKETCH_SCENE_ID,
      action: 'backToRidge'
    });
  });

  it('dispatches Potassium upgrade choice actions through scene UI', async () => {
    const option = { kind: 'fire', action: 'unlock' };
    const secondOption = { kind: 'ghost', axis: 'horizontal' };
    bridgeActions.enterScene(POTASSIUM_SCENE_ID);
    bridgeActions.setSceneUiPanel(POTASSIUM_SCENE_ID, 'potassiumUpgradeChoices', {
      choices: [
        {
          option,
          title: 'Fire Trail',
          description: 'Moving bananas leave fire.',
          color: '#f97316'
        },
        {
          option: secondOption,
          title: 'Horizontal Ghost',
          description: 'Hits fire a blue row beam.',
          color: '#38bdf8'
        }
      ]
    });
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    const overlayHost = screen.getByTestId('scene-ui-panel-overlay');
    expect(overlayHost.className).toContain('w-[min(46rem,calc(100vw-1rem))]');
    expect(overlayHost.className).toContain('overflow-y-auto');
    expect(screen.getByRole('dialog', { name: /choose banana nonsense/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /horizontal ghost/i })).toBeDefined();

    await userEvent.click(screen.getByRole('button', { name: /fire trail/i }));

    expect(bridgeStore.getState().sceneUi.lastAction).toMatchObject({
      ownerSceneId: POTASSIUM_SCENE_ID,
      action: 'potassiumDraftChoice',
      params: { option }
    });
  });

  it('dispatches Potassium terminal actions through scene UI', async () => {
    bridgeActions.enterScene(POTASSIUM_SCENE_ID);
    bridgeActions.setSceneUiPanel(POTASSIUM_SCENE_ID, 'potassiumTerminal', {
      title: 'Banana Bankruptcy',
      score: 3,
      records: 'Records\n1. 3 - W1 - game_over',
      actions: [
        { action: 'retry', label: 'Retry', priority: 'primary' },
        { action: 'return', label: 'Return to City', priority: 'secondary' }
      ]
    });
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    const terminalDialog = screen.getByRole('dialog', { name: /banana bankruptcy/i });
    expect(screen.getByTestId('scene-ui-panel-overlay').contains(terminalDialog)).toBe(true);
    expect(terminalDialog.className).toContain('max-h-[min(78dvh,calc(100dvh-8rem))]');
    expect(within(terminalDialog).getByRole('button', { name: /return to city/i })).toBeDefined();

    await userEvent.click(within(terminalDialog).getByRole('button', { name: /^retry$/i }));

    expect(bridgeStore.getState().sceneUi.lastAction).toMatchObject({
      ownerSceneId: POTASSIUM_SCENE_ID,
      action: 'potassiumTerminalAction',
      params: { action: 'retry' }
    });
  });

  it('switches to static mode directly from the toolbar', async () => {
    const onSwitchToStatic = vi.fn();
    render(<InteractiveApp onSwitchToStatic={onSwitchToStatic} />);

    await userEvent.click(screen.getByRole('button', { name: /switch to static portfolio/i }));

    expect(onSwitchToStatic).toHaveBeenCalledTimes(1);
  });
});
