// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bridgeActions, bridgeStore } from '@/game/bridge/store';
import { RIDGE_SCENE_ID, STAMPEDE_SKETCH_SCENE_ID } from '@/game/scenes/sceneIds';
import type { RidgeDevControls } from '@/game/scenes/ridge/runtime/ridgeDevControls';
import RidgeBlockoutViewer from './RidgeBlockoutViewer';
import { createRidgeBlockoutViewerModel } from './model';
import { fitRoomToViewport, getWorldTransform } from './modelViewport';

let lastRidgeDevControls: RidgeDevControls | undefined;
let lastReturnToOverworld: (() => void) | undefined;
let lastGameIsPaused: boolean | undefined;
let lastGamePresentationMode: string | undefined;

vi.mock('@/game/shell/Game', () => ({
  default: ({
    activeSceneId,
    isPaused,
    presentationMode,
    ridgeDevControls,
    onReturnToOverworld
  }: {
    activeSceneId: string;
    isPaused: boolean;
    presentationMode: string;
    ridgeDevControls?: RidgeDevControls;
    onReturnToOverworld: () => void;
  }) => {
    lastRidgeDevControls = ridgeDevControls;
    lastReturnToOverworld = onReturnToOverworld;
    lastGameIsPaused = isPaused;
    lastGamePresentationMode = presentationMode;
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
    lastGamePresentationMode = undefined;
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
    lastGamePresentationMode = undefined;
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

  it('renders Trail Card overlays inside the preview instead of leaving a ghost pause', async () => {
    render(<RidgeBlockoutViewer />);

    act(() => {
      bridgeActions.openOverlay('trailCard', {
        params: {
          title: 'Stampede Sketch',
          mood: 'Kite overexcited ink ideas',
          timeEstimate: '60-90 seconds',
          rewardPreview: 'Stamp + glide pip',
          enterSceneId: STAMPEDE_SKETCH_SCENE_ID
        },
        returnToSceneId: RIDGE_SCENE_ID
      });
    });

    expect(lastGameIsPaused).toBe(true);
    expect(screen.getByTestId('ridge-preview-input-status').textContent).toContain('Runtime paused');
    expect(screen.queryByTestId('ridge-preview-paused-overlay')).toBeNull();
    expect(await screen.findByRole('dialog', { name: 'Stampede Sketch' })).toBeDefined();

    await userEvent.click(screen.getByRole('button', { name: 'Back to Ridge' }));

    await waitFor(() => expect(bridgeStore.getState().activeOverlay).toBeNull());
    expect(lastGameIsPaused).toBe(false);
    expect(screen.getByTestId('ridge-preview-input-status').textContent).toContain('Game input');
  });

  it('routes Trail Card scene entry through the preview runtime owner', async () => {
    render(<RidgeBlockoutViewer />);

    act(() => {
      bridgeActions.openOverlay('trailCard', {
        params: {
          title: 'Stampede Sketch',
          mood: 'Kite overexcited ink ideas',
          timeEstimate: '60-90 seconds',
          rewardPreview: 'Stamp + glide pip',
          enterSceneId: STAMPEDE_SKETCH_SCENE_ID
        },
        returnToSceneId: RIDGE_SCENE_ID
      });
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Enter' }));

    await waitFor(() => {
      expect(screen.getByText('Runtime scene: stampedeSketch')).toBeDefined();
    });
    expect(bridgeStore.getState().activeOverlay).toBeNull();
    expect(lastGameIsPaused).toBe(false);
    expect(lastGamePresentationMode).toBe('vertical-board');
    expect(screen.getByRole('button', { name: 'Back to Ridge' })).toBeDefined();

    await userEvent.click(screen.getByRole('button', { name: 'Back to Ridge' }));

    await waitFor(() => {
      expect(screen.getByText('Runtime scene: ridge')).toBeDefined();
    });
  });

  it('hosts Stampede scene UI surfaces inside the preview runtime', () => {
    render(<RidgeBlockoutViewer />);

    act(() => {
      bridgeActions.enterScene(STAMPEDE_SKETCH_SCENE_ID);
      bridgeActions.setSceneUiPanel(STAMPEDE_SKETCH_SCENE_ID, 'stampedeStartPrompt');
      bridgeActions.setSceneUiStatus(STAMPEDE_SKETCH_SCENE_ID, 'stampedeStatus', {
        timeRemainingSeconds: 68,
        phaseLabel: 'Breather',
        pageNoise: 0.4,
        healthRemaining: 4,
        contactLimit: 5
      });
    });

    expect(screen.getByRole('dialog', { name: 'Ready?' })).toBeDefined();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeDefined();
    expect(screen.getByText('1:08')).toBeDefined();
    expect(screen.getByLabelText('HP 4 of 5')).toBeDefined();
    expect(screen.getByRole('progressbar', { name: /page noise/i }).getAttribute('aria-valuenow')).toBe('40');
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

  it('focuses the model view on the room containing the latest preview player snapshot', async () => {
    const model = createRidgeBlockoutViewerModel();
    const cickaHome = getViewerRoom(model, 'cicka_home');
    render(<RidgeBlockoutViewer />);

    act(() => {
      lastRidgeDevControls?.publishPlayerSnapshot?.({
        x: cickaHome.x + cickaHome.width / 2,
        y: cickaHome.y + cickaHome.height / 2
      });
    });
    await userEvent.click(screen.getByRole('button', { name: 'Model' }));

    await waitFor(() => {
      expect(screen.getByTestId('ridge-viewer-world').getAttribute('transform')).toBe(
        getExpectedRoomTransform(cickaHome)
      );
    });
  });

  it('focuses the nearest room when the preview player snapshot is on a connector', async () => {
    const model = createRidgeBlockoutViewerModel();
    const cickaHome = getViewerRoom(model, 'cicka_home');
    render(<RidgeBlockoutViewer />);

    act(() => {
      lastRidgeDevControls?.publishPlayerSnapshot?.({
        x: cickaHome.x - 12,
        y: cickaHome.y + cickaHome.height / 2
      });
    });
    await userEvent.click(screen.getByRole('button', { name: 'Model' }));

    await waitFor(() => {
      expect(screen.getByTestId('ridge-viewer-world').getAttribute('transform')).toBe(
        getExpectedRoomTransform(cickaHome)
      );
    });
  });

  it('keeps the runtime preview mounted and paused while inspecting the model', async () => {
    render(<RidgeBlockoutViewer />);

    expect(await screen.findByText('Runtime scene: ridge')).not.toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Model' }));

    const preview = screen.getByTestId('ridge-runtime-preview');
    expect(bridgeStore.getState().activeSceneId).toBe(RIDGE_SCENE_ID);
    expect(lastGameIsPaused).toBe(true);
    expect(preview.hidden).toBe(false);
    expect(preview.getAttribute('aria-hidden')).toBe('true');
    expect(preview.className).toContain('invisible');
    expect(preview.tabIndex).toBe(-1);

    await userEvent.click(screen.getByRole('button', { name: 'Preview' }));

    expect(screen.getByTestId('mock-ridge-game').textContent).toContain('Runtime scene: ridge');
    expect(bridgeStore.getState().activeSceneId).toBe(RIDGE_SCENE_ID);
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

function getViewerRoom(
  model: ReturnType<typeof createRidgeBlockoutViewerModel>,
  roomId: string
) {
  const room = model.rooms.find((candidate) => candidate.id === roomId);
  if (!room) throw new Error(`Missing Ridge viewer room "${roomId}"`);
  return room;
}

function getExpectedRoomTransform(room: ReturnType<typeof getViewerRoom>): string {
  return getWorldTransform(fitRoomToViewport({
    room,
    viewportHeight: 700,
    viewportWidth: 1000
  }));
}
