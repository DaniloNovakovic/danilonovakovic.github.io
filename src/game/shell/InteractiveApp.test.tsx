// @vitest-environment happy-dom
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
import { SCREEN_DESTROYER_TOTAL_HITS, screenHitsBefore } from '@/game/core/console';
import { STAMPEDE_ARENA } from '@/game/scenes/stampedeSketch/runtime/movement';
import { createStampedeResultViewModel } from '@/game/scenes/stampedeSketch/runtime/resultPresentation';
import { getStampedeUpgradeChoices } from '@/game/scenes/stampedeSketch/runtime/upgrades';
import { getMessages } from '@/shared/i18n';

vi.mock('./Game', () => ({
  default: () => <div data-testid="game-surface" />
}));

const realWorld = vi.hoisted(() => ({ boot: vi.fn(() => ({ resume: vi.fn(), dispose: vi.fn() })) }));
vi.mock('@/game/realWorld', () => ({ bootRealWorld: realWorld.boot }));

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

function makeDomRect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    bottom: top + height,
    height,
    left,
    right: left + width,
    top,
    width,
    x: left,
    y: top,
    toJSON: () => ({})
  } as DOMRect;
}

function mockElementRect(element: Element, rect: DOMRect) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(rect);
}

async function expectBackReplacesInventory(sceneId: string, backName: RegExp) {
  bridgeActions.enterScene(sceneId as typeof OVERWORLD_SCENE_ID);
  render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

  expect(screen.getByRole('button', { name: backName })).toBeDefined();
  expect(screen.queryByRole('button', { name: /open inventory/i })).toBeNull();
  expect(screen.queryByRole('button', { name: /open dev scene switcher/i })).toBeNull();

  await userEvent.click(screen.getByRole('button', { name: backName }));

  expect(bridgeStore.getState().activeSceneId).toBe(OVERWORLD_SCENE_ID);
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
    vi.restoreAllMocks();
  });

  it('renders interactive controls in normal flow', () => {
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    const header = screen.getByRole('banner');
    const toolbar = screen.getByRole('navigation', {
      name: /interactive controls/i
    });
    expect(header.contains(toolbar)).toBe(true);
    expect(header.className).not.toContain('fixed');
    expect(toolbar).toBeDefined();
    expect(toolbar.className).not.toContain('fixed');
    expect(screen.queryByRole('button', { name: /open inventory/i })).toBeNull();
    expect(screen.getByRole('button', { name: /open dev scene switcher/i }).className).not.toContain('fixed');
    expect(screen.getByRole('button', { name: /switch to static portfolio/i }).className).not.toContain('fixed');
  });

  it('gives the street the footer row instead of a standing controls hint', () => {
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);
    const messages = getMessages();

    expect(screen.queryByRole('contentinfo')).toBeNull();
    expect(screen.queryByText(messages.navigation.hints)).toBeNull();
  });

  it('caps game shell width from the measured content row height', async () => {
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    await waitFor(() => expect(resizeObserverCallback).toBeDefined());
    act(() => {
      resizeObserverCallback?.([{ contentRect: { height: 320 } } as ResizeObserverEntry], resizeObserverInstance!);
    });

    await waitFor(() => {
      expect(
        screen.getByTestId('interactive-game-shell').style.getPropertyValue('--mobile-game-shell-height-capped-width')
      ).toBe('min(450px, 240px)');
    });
  });

  it('opens and closes the backpack as a dialog that pauses UI state', async () => {
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /open backpack/i })).toBeNull();

    act(() => bridgeActions.collectGlasses());
    const opener = await screen.findByRole('button', {
      name: /open backpack/i
    });
    await userEvent.click(opener);

    expect(await screen.findByRole('dialog', { name: /backpack/i })).toBeDefined();
    expect(bridgeStore.getState().activeOverlayId).toBe('inventory');
    expect(bridgeStore.getState().isPaused).toBe(true);

    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() => expect(screen.queryByRole('dialog', { name: /backpack/i })).toBeNull());
    expect(bridgeStore.getState().activeOverlayId).toBeNull();
    expect(bridgeStore.getState().isPaused).toBe(false);
    // The opener stays mounted while the dialog is up, so focus can return to it.
    expect(opener.isConnected).toBe(true);
    await waitFor(() => expect(document.activeElement).toBe(opener));
  });

  it('renders the dev switcher only in dev builds and closes after selecting a target', async () => {
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    const devButton = screen.queryByRole('button', {
      name: /open dev scene switcher/i
    });
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
    await expectBackReplacesInventory(STAMPEDE_SKETCH_SCENE_ID, /back to the street/i);
  });

  it('replaces inventory and dev controls with Back during Potassium Slip', async () => {
    await expectBackReplacesInventory(POTASSIUM_SCENE_ID, /back to city/i);
  });

  it('renders Potassium inside the Notebook shell with Back and Static Mode chrome', async () => {
    const onSwitchToStatic = vi.fn();
    bridgeActions.enterScene(POTASSIUM_SCENE_ID);
    render(<InteractiveApp onSwitchToStatic={onSwitchToStatic} />);

    expect(screen.getByTestId('notebook-game-shell')).toBeDefined();
    expect(screen.queryByTestId('interactive-game-shell')).toBeNull();
    expect(screen.getByTestId('notebook-game-shell').getAttribute('data-profile')).toBe('ruledBoardPage');
    const pageFrame = screen.getByTestId('potassium-notebook-page-frame');
    expect(pageFrame.getAttribute('data-board-aspect')).toBe('0.75');
    expect(pageFrame.className).toContain('potassium-notebook-page-frame');
    expect(screen.getByTestId('potassium-control-mat').style.bottom).toBe('0.75rem');
    expect(screen.getByRole('button', { name: /back to city/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /switch to static portfolio/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /menu/i })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /switch to static portfolio/i }));

    expect(onSwitchToStatic).toHaveBeenCalledTimes(1);
  });

  it('renders Stampede inside the Notebook shell with Back and Static Mode chrome', async () => {
    const onSwitchToStatic = vi.fn();
    bridgeActions.enterScene(STAMPEDE_SKETCH_SCENE_ID);
    render(<InteractiveApp onSwitchToStatic={onSwitchToStatic} />);

    expect(screen.getByTestId('notebook-game-shell')).toBeDefined();
    expect(screen.queryByTestId('interactive-game-shell')).toBeNull();
    expect(screen.getByTestId('notebook-game-shell').getAttribute('data-profile')).toBe('survivalPage');
    const pageFrame = screen.getByTestId('stampede-notebook-page-frame');
    const arenaAspect = (STAMPEDE_ARENA.right - STAMPEDE_ARENA.left) / (STAMPEDE_ARENA.bottom - STAMPEDE_ARENA.top);
    expect(pageFrame.getAttribute('data-arena-aspect')).toBe(String(arenaAspect));
    expect(pageFrame.className).toContain('stampede-notebook-page-frame');
    expect(screen.getByTestId('stampede-control-mat').style.bottom).toBe('0.75rem');
    expect(screen.getByRole('button', { name: /back to the street/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /switch to static portfolio/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /menu/i })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /switch to static portfolio/i }));

    expect(onSwitchToStatic).toHaveBeenCalledTimes(1);
  });

  it('keeps the Potassium page frame at the board aspect on narrow phones', () => {
    setViewportSize(390, 844);
    bridgeActions.enterScene(POTASSIUM_SCENE_ID);
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    const pageFrame = screen.getByTestId('potassium-notebook-page-frame');

    expect(pageFrame.getAttribute('data-board-aspect')).toBe('0.75');
    expect(pageFrame.getAttribute('data-frame-aspect')).toBe('0.75');
    expect(pageFrame.style.aspectRatio).toBe('0.75 / 1');
    expect(pageFrame.style.width).toBeTruthy();
  });

  it('keeps the Potassium page frame at the board aspect on wider mid-height screens', () => {
    setViewportSize(884, 756);
    bridgeActions.enterScene(POTASSIUM_SCENE_ID);
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    const pageFrame = screen.getByTestId('potassium-notebook-page-frame');

    expect(pageFrame.getAttribute('data-board-aspect')).toBe('0.75');
    expect(pageFrame.getAttribute('data-frame-aspect')).toBe('0.75');
    expect(pageFrame.style.aspectRatio).toBe('0.75 / 1');
    expect(pageFrame.style.width).toBeTruthy();
  });

  it('queues Potassium control-mat pointer events in cropped Phaser design space', () => {
    bridgeActions.enterScene(POTASSIUM_SCENE_ID);
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);
    const frame = screen.getByTestId('potassium-notebook-game-frame');
    const mat = screen.getByTestId('potassium-control-mat');
    mockElementRect(frame, makeDomRect(100, 200, 450, 600));

    fireEvent.pointerDown(mat, {
      clientX: 100,
      clientY: 500,
      pointerId: 11,
      timeStamp: 18
    });
    fireEvent.pointerUp(mat, {
      clientX: 325,
      clientY: 920,
      pointerId: 11,
      timeStamp: 32
    });
    fireEvent.pointerDown(mat, {
      clientX: 550,
      clientY: 500,
      pointerId: 12,
      timeStamp: 40
    });

    expect(bridgeStore.getState().sceneControlPointerEvents).toMatchObject([
      {
        ownerSceneId: POTASSIUM_SCENE_ID,
        kind: 'down',
        pointerId: 11,
        x: 275,
        y: 300
      },
      {
        ownerSceneId: POTASSIUM_SCENE_ID,
        kind: 'up',
        pointerId: 11,
        x: 500,
        y: 720
      },
      {
        ownerSceneId: POTASSIUM_SCENE_ID,
        kind: 'down',
        pointerId: 12,
        x: 725,
        y: 300
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

  it('coalesces Stampede control-mat pointer moves in cropped Phaser design space', () => {
    const rafCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => undefined);
    bridgeActions.enterScene(STAMPEDE_SKETCH_SCENE_ID);
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);
    const frame = screen.getByTestId('stampede-notebook-game-frame');
    const mat = screen.getByTestId('stampede-control-mat');
    mockElementRect(frame, makeDomRect(100, 200, 450, 600));

    fireEvent.pointerDown(mat, {
      clientX: 325,
      clientY: 500,
      pointerId: 21,
      timeStamp: 18
    });
    fireEvent.pointerMove(mat, {
      clientX: 340,
      clientY: 470,
      pointerId: 21,
      timeStamp: 24
    });
    fireEvent.pointerMove(mat, {
      clientX: 360,
      clientY: 440,
      pointerId: 21,
      timeStamp: 30
    });

    expect(bridgeStore.getState().sceneControlPointerEvents).toMatchObject([
      {
        ownerSceneId: STAMPEDE_SKETCH_SCENE_ID,
        kind: 'down',
        pointerId: 21,
        x: 500,
        y: 300
      }
    ]);

    act(() => {
      rafCallbacks[0]?.(64);
    });

    expect(bridgeStore.getState().sceneControlPointerEvents).toMatchObject([
      {
        ownerSceneId: STAMPEDE_SKETCH_SCENE_ID,
        kind: 'down',
        pointerId: 21,
        x: 500,
        y: 300
      },
      {
        ownerSceneId: STAMPEDE_SKETCH_SCENE_ID,
        kind: 'move',
        pointerId: 21,
        x: 535,
        y: 240
      }
    ]);
  });

  it('renders and clears the Stampede shell drag indicator from control-mat input', () => {
    bridgeActions.enterScene(STAMPEDE_SKETCH_SCENE_ID);
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);
    const frame = screen.getByTestId('stampede-notebook-game-frame');
    const mat = screen.getByTestId('stampede-control-mat');
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
    vi.spyOn(mat, 'getBoundingClientRect').mockReturnValue({
      bottom: 640,
      height: 540,
      left: 40,
      right: 840,
      top: 100,
      width: 800,
      x: 40,
      y: 100,
      toJSON: () => ({})
    } as DOMRect);

    fireEvent.pointerDown(mat, {
      clientX: 80,
      clientY: 180,
      pointerId: 23
    });
    fireEvent.pointerMove(mat, {
      clientX: 120,
      clientY: 210,
      pointerId: 23
    });

    const indicator = screen.getByTestId('stampede-control-mat-drag-indicator');
    expect(indicator.getAttribute('data-anchor-x')).toBe('40');
    expect(indicator.getAttribute('data-anchor-y')).toBe('80');
    expect(indicator.getAttribute('data-current-x')).toBe('80');
    expect(indicator.getAttribute('data-current-y')).toBe('110');

    fireEvent.pointerUp(mat, {
      clientX: 120,
      clientY: 210,
      pointerId: 23
    });

    expect(screen.queryByTestId('stampede-control-mat-drag-indicator')).toBeNull();
  });

  it('cancels active Stampede control-mat input when a scene panel opens', () => {
    bridgeActions.enterScene(STAMPEDE_SKETCH_SCENE_ID);
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);
    const frame = screen.getByTestId('stampede-notebook-game-frame');
    const mat = screen.getByTestId('stampede-control-mat');
    mockElementRect(frame, makeDomRect(100, 200, 450, 600));
    mockElementRect(mat, makeDomRect(40, 100, 800, 540));

    fireEvent.pointerDown(mat, {
      clientX: 325,
      clientY: 500,
      pointerId: 25,
      timeStamp: 18
    });

    expect(screen.getByTestId('stampede-control-mat-drag-indicator')).toBeDefined();

    act(() => {
      bridgeActions.setSceneUiPanel(STAMPEDE_SKETCH_SCENE_ID, 'stampedeStartPrompt');
    });

    expect(screen.queryByTestId('stampede-control-mat-drag-indicator')).toBeNull();
    expect(bridgeStore.getState().sceneControlPointerEvents).toMatchObject([
      {
        ownerSceneId: STAMPEDE_SKETCH_SCENE_ID,
        kind: 'down',
        pointerId: 25,
        x: 500,
        y: 300
      },
      {
        ownerSceneId: STAMPEDE_SKETCH_SCENE_ID,
        kind: 'cancel',
        pointerId: 25,
        x: 500,
        y: 300
      }
    ]);
  });

  it('does not render a shell drag indicator for Potassium control-mat input', () => {
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
      pointerId: 24
    });

    expect(screen.queryByTestId('potassium-control-mat-drag-indicator')).toBeNull();
    expect(screen.queryByTestId('stampede-control-mat-drag-indicator')).toBeNull();
  });

  it('does not queue Stampede control-mat events while a scene panel is open', () => {
    bridgeActions.enterScene(STAMPEDE_SKETCH_SCENE_ID);
    bridgeActions.setSceneUiPanel(STAMPEDE_SKETCH_SCENE_ID, 'stampedeStartPrompt');
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);
    const frame = screen.getByTestId('stampede-notebook-game-frame');
    const mat = screen.getByTestId('stampede-control-mat');
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
      pointerId: 22
    });

    expect(bridgeStore.getState().sceneControlPointerEvents).toEqual([]);
    expect(screen.queryByTestId('stampede-control-mat-drag-indicator')).toBeNull();
  });

  it('renders Stampede scene status in the Notebook shell footer', () => {
    bridgeActions.enterScene(STAMPEDE_SKETCH_SCENE_ID);
    bridgeActions.setSceneUiStatus(STAMPEDE_SKETCH_SCENE_ID, 'stampedeStatus', {
      timeRemainingSeconds: 68,
      phaseLabel: 'Breather',
      pageNoise: 0.4,
      healthRemaining: 4,
      contactLimit: 5
    });
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    expect(screen.getByTestId('notebook-game-shell').getAttribute('data-profile')).toBe('survivalPage');
    expect(screen.getByText('1:08')).toBeDefined();
    expect(screen.getByText('4/5')).toBeDefined();
    expect(screen.getByLabelText('HP 4 of 5')).toBeDefined();
    expect(screen.getByText('Breather')).toBeDefined();
    expect(screen.getByRole('progressbar', { name: /page noise/i }).getAttribute('aria-valuenow')).toBe('40');
  });

  it('dispatches Stampede start panel actions through scene UI', async () => {
    bridgeActions.enterScene(STAMPEDE_SKETCH_SCENE_ID);
    bridgeActions.setSceneUiPanel(STAMPEDE_SKETCH_SCENE_ID, 'stampedeStartPrompt');
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /bad selfie/i }));

    expect(bridgeStore.getState().sceneUi.actions.at(-1)).toMatchObject({
      ownerSceneId: STAMPEDE_SKETCH_SCENE_ID,
      action: 'stampedeUpgradeChoice',
      params: { upgradeId: 'badSelfie' }
    });
  });

  it('dispatches Stampede upgrade draft choices through scene UI', async () => {
    bridgeActions.enterScene(STAMPEDE_SKETCH_SCENE_ID);
    bridgeActions.setSceneUiPanel(STAMPEDE_SKETCH_SCENE_ID, 'stampedeUpgradeDraft', {
      choices: getStampedeUpgradeChoices([], [], () => 0.99),
      scrapsCollected: 3,
      scrapGoal: 3
    });
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    expect(screen.getByTestId('scene-ui-panel-overlay')).toBeDefined();
    expect(screen.getByRole('dialog', { name: /pick a weapon/i })).toBeDefined();

    await userEvent.click(screen.getByRole('button', { name: /bad smell/i }));

    expect(bridgeStore.getState().sceneUi.actions.at(-1)).toMatchObject({
      ownerSceneId: STAMPEDE_SKETCH_SCENE_ID,
      action: 'stampedeUpgradeChoice',
      params: { upgradeId: 'badSmell' }
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
    const resultDialog = screen.getByRole('dialog', { name: /pecked/i });

    expect(within(resultDialog).getByRole('button', { name: /^retry$/i })).toBeDefined();
    expect(within(resultDialog).getByRole('button', { name: /back to the street/i })).toBeDefined();

    await userEvent.click(within(resultDialog).getByRole('button', { name: /^retry$/i }));
    expect(bridgeStore.getState().sceneUi.actions.at(-1)).toMatchObject({
      ownerSceneId: STAMPEDE_SKETCH_SCENE_ID,
      action: 'retry'
    });

    await userEvent.click(within(resultDialog).getByRole('button', { name: /back to the street/i }));
    expect(bridgeStore.getState().sceneUi.actions.at(-1)).toMatchObject({
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
    expect(screen.getByRole('dialog', { name: /choose sponge nonsense/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /horizontal ghost/i })).toBeDefined();

    await userEvent.click(screen.getByRole('button', { name: /fire trail/i }));

    expect(bridgeStore.getState().sceneUi.actions.at(-1)).toMatchObject({
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

    const terminalDialog = screen.getByRole('dialog', {
      name: /banana bankruptcy/i
    });
    expect(screen.getByTestId('scene-ui-panel-overlay').contains(terminalDialog)).toBe(true);
    expect(terminalDialog.className).toContain('max-h-[min(78dvh,calc(100dvh-8rem))]');
    expect(within(terminalDialog).getByRole('button', { name: /return to city/i })).toBeDefined();

    await userEvent.click(within(terminalDialog).getByRole('button', { name: /^retry$/i }));

    expect(bridgeStore.getState().sceneUi.actions.at(-1)).toMatchObject({
      ownerSceneId: POTASSIUM_SCENE_ID,
      action: 'potassiumTerminalAction',
      params: { action: 'retry' }
    });
  });

  it('docks the Ridge conversation panel inside the game frame', async () => {
    bridgeActions.enterScene(RIDGE_SCENE_ID);
    bridgeActions.setSceneUiPanel(RIDGE_SCENE_ID, 'ridgeConversation', {
      conversationId: 'cicka-intro',
      speaker: 'Cicka',
      speakerId: 'cicka',
      text: 'Soft footfalls on the page.',
      lineIndex: 0,
      lineCount: 2,
      awaitingChoice: false,
      choices: [],
      portrait: 'cicka',
      speakerSide: 'right'
    });
    render(<InteractiveApp onSwitchToStatic={vi.fn()} />);

    const dialog = screen.getByRole('dialog', { name: /cicka/i });
    const dockedHost = screen.getByTestId('scene-ui-panel-docked');

    // Fixed would escape the frame-sized docked host and its rounded clip.
    expect(dialog.className).not.toMatch(/\bfixed\b/);
    expect(dockedHost.contains(dialog)).toBe(true);
    expect(document.activeElement).toBe(dialog);
    expect(within(dialog).getByRole('button', { name: /continue/i })).toBeDefined();
    expect(within(dialog).getByRole('button', { name: /step back/i })).toBeDefined();

    const description = document.getElementById(dialog.getAttribute('aria-describedby') ?? '');
    expect(description?.textContent?.replaceAll('|', '')).toBe('Soft footfalls on the page.');
    expect(description?.querySelector('.text-transparent')?.textContent?.replaceAll('|', '')).toBe(
      'Soft footfalls on the page.'
    );

    // First click finishes the typewriter; second advances the line.
    await userEvent.click(within(dialog).getByRole('button', { name: /continue/i }));
    await userEvent.click(within(dialog).getByRole('button', { name: /continue/i }));

    expect(bridgeStore.getState().sceneUi.actions.at(-1)).toMatchObject({
      ownerSceneId: RIDGE_SCENE_ID,
      action: 'ridgeConversationAdvance'
    });
  });

  it('switches to static mode directly from the toolbar', async () => {
    const onSwitchToStatic = vi.fn();
    render(<InteractiveApp onSwitchToStatic={onSwitchToStatic} />);

    await userEvent.click(screen.getByRole('button', { name: /switch to static portfolio/i }));

    expect(onSwitchToStatic).toHaveBeenCalledTimes(1);
  });

  describe('screen destroyer (#164)', () => {
    /** The chick, then the whole street: the hammer is on the card next. */
    const STREET_GONE = 1 + screenHitsBefore('card');
    /** The chick, then every layer: the last smash shatters the glass. */
    const EVERY_SMASH = 1 + SCREEN_DESTROYER_TOTAL_HITS;

    function smash(times: number) {
      act(() => {
        for (let i = 0; i < times; i++) bridgeActions.landScreenSmash();
      });
    }

    it('cracks the card and drops it (the header buttons with it), but Static mode hangs on', async () => {
      const onSwitchToStatic = vi.fn();
      render(<InteractiveApp onSwitchToStatic={onSwitchToStatic} />);
      const devButton = screen.getByRole('button', { name: /open dev scene switcher/i });
      smash(STREET_GONE);
      expect(devButton.parentElement?.getAttribute('style') ?? '').not.toContain('rotate');
      expect(screen.queryByTestId('screen-destroyer-card')).toBeNull();

      act(() => {
        bridgeActions.landScreenSmash();
        bridgeActions.crackCard({ x: 0.3, y: 0.4, seed: 1 });
      });
      expect(devButton.parentElement?.getAttribute('style')).toContain('rotate(2deg)');
      // Drawn once the card has a size (no layout here); it never takes a click.
      expect(screen.getByTestId('screen-destroyer-card').className).toContain('pointer-events-none');
      expect(screen.getByTestId('interactive-game-shell').className).toContain('shadow-');

      smash(3);
      expect(screen.queryByRole('button', { name: /open dev scene switcher/i })).toBeNull();
      expect(screen.getByTestId('interactive-game-shell').className).not.toContain('shadow-');
      expect(screen.queryByTestId('unplugged-hand-off')).toBeNull();
      await userEvent.click(screen.getByRole('button', { name: /switch to static portfolio/i }));
      expect(onSwitchToStatic).toHaveBeenCalledTimes(1);
    });

    it('shatters into black once every layer is gone: no way out, only Wake up', async () => {
      const onSwitchToStatic = vi.fn();
      render(<InteractiveApp onSwitchToStatic={onSwitchToStatic} />);
      smash(EVERY_SMASH - 1);
      expect(screen.queryByTestId('unplugged-hand-off')).toBeNull();

      smash(1);
      expect(screen.getByTestId('screen-shards').getAttribute('aria-hidden')).toBe('true');
      const handOff = screen.getByRole('dialog', { name: /unplugged/i });
      expect(handOff.textContent).toMatch(/signal lost/i);
      const wake = within(handOff).getByRole('button', { name: /wake up/i });
      expect(document.activeElement).toBe(wake);
      expect(within(handOff).getAllByRole('button')).toHaveLength(1);
      expect(screen.queryByRole('button', { name: /switch to static portfolio/i })).toBeNull();

      await userEvent.keyboard('{Escape}');
      expect(onSwitchToStatic).not.toHaveBeenCalled();
      expect(screen.getByTestId('unplugged-hand-off')).toBeTruthy();
    });

    it('wakes up into the real world, which takes over the whole page', async () => {
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as never);
      render(<InteractiveApp onSwitchToStatic={vi.fn()} />);
      smash(EVERY_SMASH);

      await userEvent.click(screen.getByRole('button', { name: /wake up/i }));

      expect(screen.queryByTestId('unplugged-hand-off')).toBeNull();
      expect(screen.getByRole('application', { name: /the real world/i })).toBeTruthy();
      await waitFor(() => expect(realWorld.boot).toHaveBeenCalledTimes(1));
    });

    it('turns a click anywhere on the page into a smash once the hammer is on the screen, never on a control', () => {
      const destroyer = {
        hits: 9,
        layers: [],
        breaking: 'card',
        remaining: ['card'],
        onTheScreen: true,
        blackout: false
      };
      const fightPanel = { phase: 'horde', destroyer, onTheScreen: false };
      act(() => bridgeActions.setSceneUiPanel(OVERWORLD_SCENE_ID, 'streetFight', fightPanel));
      render(<InteractiveApp onSwitchToStatic={vi.fn()} />);
      // Still on the street (or before "what if"): a click is just a click.
      expect(document.documentElement.classList.contains('screen-destroyer-active')).toBe(false);
      act(() => bridgeActions.setSceneUiPanel(OVERWORLD_SCENE_ID, 'streetFight', { ...fightPanel, onTheScreen: true }));
      expect(document.documentElement.classList.contains('screen-destroyer-active')).toBe(true);

      fireEvent.pointerDown(screen.getByTestId('game-surface'), { clientX: 512, clientY: 192 });
      expect(bridgeStore.getState().sceneUi.actions.at(-1)).toMatchObject({
        ownerSceneId: OVERWORLD_SCENE_ID,
        action: 'streetFightSmashPage',
        params: { x: 0.5, y: 0.25 }
      });

      const before = bridgeStore.getState().sceneUi.actions.length;
      fireEvent.pointerDown(screen.getByRole('button', { name: /switch to static portfolio/i }));
      fireEvent.pointerDown(screen.getByRole('button', { name: /swing the hammer/i }));
      expect(
        bridgeStore
          .getState()
          .sceneUi.actions.slice(before)
          .filter((a) => a.action === 'streetFightSmashPage')
      ).toEqual([]);

      act(() => bridgeActions.setSceneUiPanel(OVERWORLD_SCENE_ID, 'streetFight', fightPanel));
      expect(document.documentElement.classList.contains('screen-destroyer-active')).toBe(false);
    });
  });
});
