// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bridgeActions } from '@/game/bridge/store';
import type { RidgeDevControls } from '@/game/scenes/ridge/runtime/ridgeDevControls';
import RidgeBlockoutViewer from './RidgeBlockoutViewer';

let lastRidgeDevControls: RidgeDevControls | undefined;
let lastReturnToOverworld: (() => void) | undefined;
let lastGameIsPaused: boolean | undefined;

vi.mock('@/game/shell/Game', () => ({
  default: ({
    activeSceneId,
    isPaused,
    ridgeDevControls,
    onReturnToOverworld
  }: {
    activeSceneId: string;
    isPaused: boolean;
    ridgeDevControls?: RidgeDevControls;
    onReturnToOverworld: () => void;
  }) => {
    lastRidgeDevControls = ridgeDevControls;
    lastReturnToOverworld = onReturnToOverworld;
    lastGameIsPaused = isPaused;
    return <div data-testid="mock-ridge-game">Runtime scene: {activeSceneId}</div>;
  }
}));

describe('RidgeBlockoutViewer', () => {
  beforeEach(() => {
    window.history.replaceState(window.history.state, '', '/?mode=ridge-blockout');
    bridgeActions.returnToOverworld();
    bridgeActions.closeOverlay();
    bridgeActions.clearSceneUi();
    bridgeActions.setSceneLoading(null);
    bridgeActions.resetTouch();
    lastRidgeDevControls = undefined;
    lastReturnToOverworld = undefined;
    lastGameIsPaused = undefined;
  });

  afterEach(() => {
    cleanup();
    bridgeActions.returnToOverworld();
    bridgeActions.closeOverlay();
    bridgeActions.clearSceneUi();
    bridgeActions.setSceneLoading(null);
    bridgeActions.resetTouch();
    lastRidgeDevControls = undefined;
    lastReturnToOverworld = undefined;
    lastGameIsPaused = undefined;
  });

  it('defaults to the runtime preview tab and boots Ridge through the game shell', async () => {
    render(<RidgeBlockoutViewer />);

    expect(screen.getByRole('button', { name: 'Preview' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Model' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByTestId('ridge-runtime-preview')).not.toBeNull();
    expect(await screen.findByText('Runtime scene: ridge')).not.toBeNull();
    expect(lastGameIsPaused).toBe(false);
    expect(screen.queryByTestId('ridge-blockout-svg')).toBeNull();
  });

  it('pauses game input while preview panel controls own focus', async () => {
    render(<RidgeBlockoutViewer />);

    await userEvent.click(screen.getByRole('button', { name: 'Reset player' }));

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Reset player' }));
    expect(lastGameIsPaused).toBe(true);
    expect(screen.getByTestId('ridge-preview-input-status').textContent).toContain('Panel focus');
    expect(screen.getByTestId('ridge-preview-paused-overlay').textContent).toContain('Paused');
    expect(screen.getByTestId('ridge-preview-paused-overlay').textContent).toContain('Panel focus');
  });

  it('keeps native Space activation on focused panel buttons without resuming game input', async () => {
    render(<RidgeBlockoutViewer />);
    await userEvent.click(screen.getByRole('button', { name: 'Reset player' }));
    lastRidgeDevControls?.consumeResetRequest?.();

    await userEvent.keyboard('[Space]');

    expect(lastGameIsPaused).toBe(true);
    expect(lastRidgeDevControls?.consumeResetRequest?.()).toMatchObject({ label: 'start' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Reset player' }));
  });

  it('resumes game input when the runtime preview owns focus again', async () => {
    render(<RidgeBlockoutViewer />);
    const preview = screen.getByTestId('ridge-runtime-preview');

    await userEvent.click(screen.getByRole('button', { name: 'Reset player' }));
    expect(lastGameIsPaused).toBe(true);

    await userEvent.click(preview);

    expect(lastGameIsPaused).toBe(false);
    expect(document.activeElement).toBe(preview);
    expect(screen.getByTestId('ridge-preview-input-status').textContent).toContain('Game input');
    expect(screen.queryByTestId('ridge-preview-paused-overlay')).toBeNull();
  });

  it('resumes game input from the preview focus control', async () => {
    render(<RidgeBlockoutViewer />);
    const preview = screen.getByTestId('ridge-runtime-preview');

    await userEvent.click(screen.getByRole('button', { name: 'Reset player' }));
    expect(lastGameIsPaused).toBe(true);

    await userEvent.click(screen.getByRole('button', { name: 'Focus game' }));

    expect(lastGameIsPaused).toBe(false);
    expect(document.activeElement).toBe(preview);
    expect(screen.queryByTestId('ridge-preview-paused-overlay')).toBeNull();
  });

  it('keeps the runtime preview in Ridge when the scene close callback fires', async () => {
    render(<RidgeBlockoutViewer />);
    expect(await screen.findByText('Runtime scene: ridge')).not.toBeNull();

    act(() => {
      lastReturnToOverworld?.();
    });

    expect(screen.getByText('Runtime scene: ridge')).not.toBeNull();
  });

  it('keeps the compact header controls and validation status visible', () => {
    render(<RidgeBlockoutViewer />);

    expect(screen.getByRole('heading', { name: 'Ridge Blockout Viewer' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Preview' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Model' })).not.toBeNull();
    expect(screen.getByTestId('ridge-viewer-header-validation-status').textContent).toContain('Map valid');
  });

  it('uses clear runtime preview labels for zoom and input state', () => {
    render(<RidgeBlockoutViewer />);

    expect(screen.getByText('Live Ridge')).not.toBeNull();
    expect(screen.getByText('Camera zoom 100%')).not.toBeNull();
    expect(screen.queryByText(/Actual Ridge runtime/)).toBeNull();
  });

  it('updates the runtime preview camera zoom control', async () => {
    render(<RidgeBlockoutViewer />);

    expect(lastRidgeDevControls?.resolveCameraZoom?.()).toBe(1);

    await userEvent.click(screen.getByRole('button', { name: 'Zoom preview in' }));

    expect(lastRidgeDevControls?.resolveCameraZoom?.()).toBe(1.25);
    expect(screen.getByLabelText('Preview zoom')).toHaveProperty('value', '1.25');
  });

  it('updates the runtime preview debug overlay settings', async () => {
    render(<RidgeBlockoutViewer />);

    expect(lastRidgeDevControls?.resolveDebugSettings?.()).toMatchObject({
      graybox: false,
      showColliders: false,
      showPlayerBody: false,
      showInteractZones: false,
      showTraversalAssists: false
    });

    await userEvent.click(screen.getByRole('checkbox', { name: 'Colliders' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Interact zones' }));

    expect(lastRidgeDevControls?.resolveDebugSettings?.()).toMatchObject({
      graybox: false,
      showColliders: true,
      showPlayerBody: false,
      showInteractZones: true,
      showTraversalAssists: false
    });
  });

  it('dispatches preview teleport requests from source-backed anchors', async () => {
    render(<RidgeBlockoutViewer />);

    await userEvent.click(screen.getByRole('button', { name: /Teleport to Outskirts start/ }));

    const request = lastRidgeDevControls?.consumeTeleportRequest?.();
    expect(request).toMatchObject({
      label: 'start',
      applySpawnOffset: true
    });
    expect(request?.x).toBeGreaterThan(0);
    expect(request?.y).toBeGreaterThan(0);
  });

  it('dispatches a preview reset request back to the Ridge spawn', async () => {
    render(<RidgeBlockoutViewer />);

    await userEvent.click(screen.getByRole('button', { name: 'Reset player' }));

    const request = lastRidgeDevControls?.consumeResetRequest?.();
    expect(request).toMatchObject({
      label: 'start'
    });
    expect(screen.getByText('Sent: reset start')).not.toBeNull();
    expect(lastRidgeDevControls?.consumeResetRequest?.()).toBeNull();
  });

  it('switches to the source-backed model inspector tab', async () => {
    render(<RidgeBlockoutViewer />);

    await userEvent.click(screen.getByRole('button', { name: 'Model' }));

    expect(screen.getByRole('button', { name: 'Model' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('ridge-blockout-svg')).not.toBeNull();
    expect(window.location.search).toContain('view=model');
  });

  it('renders generated blockout summary and inspection layers', () => {
    render(<RidgeBlockoutViewer />);
    fireEvent.click(screen.getByRole('button', { name: 'Model' }));

    expect(screen.getByRole('heading', { name: 'Ridge Blockout Viewer' })).not.toBeNull();
    expect(screen.getByText('Folded Desk Ridge')).not.toBeNull();
    expect(screen.getByTestId('ridge-viewer-validation-status').textContent).toContain('Map valid');
    expect(screen.getByLabelText('Room Cicka Home')).not.toBeNull();
    expect(screen.getByLabelText(/Anchor C in Cicka Home: npc/)).not.toBeNull();
    expect(screen.getByText('Route: first_walk')).not.toBeNull();
    expect(screen.getByText(/stampede_sketch: locked \/ unlocked with Stampede/)).not.toBeNull();
    expect(screen.getByTestId('ridge-layer-colliders')).not.toBeNull();
  });

  it('focuses a room in the model view by double-clicking the room outline', async () => {
    render(<RidgeBlockoutViewer />);
    await userEvent.click(screen.getByRole('button', { name: 'Model' }));

    const world = screen.getByTestId('ridge-viewer-world');
    const initialTransform = world.getAttribute('transform');

    fireEvent.doubleClick(screen.getByLabelText('Room Cicka Home'));

    expect(world.getAttribute('transform')).not.toBe(initialTransform);
  });

  it('toggles SVG layers from the sidebar', async () => {
    render(<RidgeBlockoutViewer />);
    await userEvent.click(screen.getByRole('button', { name: 'Model' }));

    expect(screen.getByTestId('ridge-layer-anchors')).not.toBeNull();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Anchors' }));

    expect(screen.queryByTestId('ridge-layer-anchors')).toBeNull();
  });

  it('updates viewport transform through zoom and drag pan controls', async () => {
    render(<RidgeBlockoutViewer />);
    await userEvent.click(screen.getByRole('button', { name: 'Model' }));

    const world = screen.getByTestId('ridge-viewer-world');
    const canvas = screen.getByLabelText('Ridge blockout model canvas');
    const initialTransform = world.getAttribute('transform');

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(world.getAttribute('transform')).not.toBe(initialTransform);

    const zoomedTransform = world.getAttribute('transform');
    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 130, clientY: 118, pointerId: 1 });

    expect(world.getAttribute('transform')).not.toBe(zoomedTransform);
  });

  it('shows the last known runtime player position in the model view', async () => {
    render(<RidgeBlockoutViewer />);

    act(() => {
      lastRidgeDevControls?.publishPlayerSnapshot?.({ x: 320, y: 640 });
    });
    await userEvent.click(screen.getByRole('button', { name: 'Model' }));

    expect(screen.getByTestId('ridge-layer-player-snapshot')).not.toBeNull();
  });

  it('shows selected details after clicking an anchor', async () => {
    render(<RidgeBlockoutViewer />);
    await userEvent.click(screen.getByRole('button', { name: 'Model' }));

    await userEvent.click(screen.getByLabelText(/Anchor C in Cicka Home: npc/));

    const selected = screen.getByTestId('ridge-viewer-selection');
    expect(selected.textContent).toContain('anchor');
    expect(selected.textContent).toContain('npc');
    expect(selected.textContent).toContain('cicka');
  });
});
