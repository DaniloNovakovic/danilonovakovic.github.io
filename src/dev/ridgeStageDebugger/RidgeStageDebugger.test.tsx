// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bridgeActions, bridgeStore } from '@/game/bridge/store';
import { RIDGE_SCENE_ID, STAMPEDE_SKETCH_SCENE_ID } from '@/game/scenes/sceneIds';
import type { RidgeDevControls } from '@/game/scenes/ridge/runtime/ridgeDevControls';
import {
  BRIDGE_STAGE_SOURCE,
  resolveBridgeStageSpot
} from '@/game/scenes/ridge/bridge/stageComposition';
import RidgeStageDebugger from './RidgeStageDebugger';

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

describe('RidgeStageDebugger', () => {
  beforeEach(() => {
    window.history.replaceState(window.history.state, '', '/?mode=ridge-stage-debugger');
    resetBridgeForDebuggerTest();
  });

  afterEach(() => {
    cleanup();
    resetBridgeForDebuggerTest();
  });

  it('boots a Bridge-first runtime debugger without the legacy blockout model UI', async () => {
    render(<RidgeStageDebugger />);

    expect(screen.getByRole('heading', { name: 'Ridge Stage Debugger' })).not.toBeNull();
    expect(screen.getByTestId('ridge-runtime-preview')).not.toBeNull();
    expect(await screen.findByText('Runtime scene: ridge')).not.toBeNull();
    expect(lastGameIsPaused).toBe(false);
    expect(screen.getByText('Live Bridge')).not.toBeNull();
    expect(screen.getByText('Stage Source')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Model' })).toBeNull();
    expect(screen.queryByText(/Folded Desk Ridge/)).toBeNull();
  });

  it('pauses game input while debugger controls own focus', async () => {
    render(<RidgeStageDebugger />);

    await userEvent.click(screen.getByRole('button', { name: 'Reset Player' }));

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Reset Player' }));
    expect(lastGameIsPaused).toBe(true);
    expect(screen.getByTestId('ridge-preview-input-status').textContent).toContain('Panel focus');
    expect(screen.getByTestId('ridge-preview-paused-overlay').textContent).toContain('Paused');

    await userEvent.click(screen.getByRole('button', { name: 'Focus game' }));

    expect(lastGameIsPaused).toBe(false);
    expect(document.activeElement).toBe(screen.getByTestId('ridge-runtime-preview'));
  });

  it('updates preview zoom and Bridge Stage overlay settings', async () => {
    render(<RidgeStageDebugger />);

    expect(lastRidgeDevControls?.resolveCameraZoom?.()).toBe(1);
    expect(lastRidgeDevControls?.resolveDebugSettings?.()).toMatchObject({
      graybox: false,
      showPlayerBody: false,
      showInteractZones: false,
      showTraversalAssists: true
    });

    await userEvent.click(screen.getByRole('button', { name: 'Zoom preview in' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Walk Rail + Spots' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Interaction Zones' }));

    expect(lastRidgeDevControls?.resolveCameraZoom?.()).toBe(1.25);
    expect(screen.getByLabelText('Preview zoom')).toHaveProperty('value', '1.25');
    expect(lastRidgeDevControls?.resolveDebugSettings?.()).toMatchObject({
      graybox: false,
      showPlayerBody: false,
      showInteractZones: true,
      showTraversalAssists: false
    });
  });

  it('dispatches stage spot teleport requests from the Bridge Stage Source', async () => {
    render(<RidgeStageDebugger />);

    await userEvent.click(screen.getByRole('button', {
      name: 'Move player to Stage Spot draftsperson'
    }));

    const draftsperson = resolveBridgeStageSpot(BRIDGE_STAGE_SOURCE, 'draftsperson');
    const request = lastRidgeDevControls?.consumeTeleportRequest?.();
    expect(request).toMatchObject({
      label: 'draftsperson',
      applySpawnOffset: false,
      x: draftsperson.x,
      y: draftsperson.y
    });
    expect(screen.getByText('Sent: spot draftsperson')).not.toBeNull();
  });

  it('dispatches route beat requests without mutating Bridge route state from React', async () => {
    render(<RidgeStageDebugger />);

    await userEvent.click(screen.getByRole('button', { name: /Bridge Complete/ }));

    expect(bridgeStore.getState().progress.ridge.firstPlayableRoute).toEqual({
      activeAreaId: 'bridge',
      bridgeBeat: 'intro'
    });
    expect(lastRidgeDevControls?.consumeRouteBeatRequest?.()).toMatchObject({
      bridgeBeat: 'bridge_complete',
      label: 'bridge_complete'
    });

    await userEvent.click(screen.getByRole('button', { name: /Concert Handoff/ }));

    expect(bridgeStore.getState().progress.ridge.firstPlayableRoute).toEqual({
      activeAreaId: 'bridge',
      bridgeBeat: 'intro'
    });
    expect(lastRidgeDevControls?.consumeRouteBeatRequest?.()).toMatchObject({
      bridgeBeat: 'concert_handoff',
      label: 'concert_handoff'
    });
  });

  it('exposes Stage Authoring controls and draft source wiring', async () => {
    render(<RidgeStageDebugger />);

    expect(screen.getByLabelText('Stage Authoring Mode')).toHaveProperty('checked', false);
    expect(lastRidgeDevControls?.resolveAuthoringState?.()).toEqual({
      active: false,
      selection: null
    });
    expect(lastRidgeDevControls?.resolveCompositionSource?.()).toBeUndefined();

    await userEvent.click(screen.getByLabelText('Stage Authoring Mode'));

    expect(screen.getByLabelText('Stage Authoring Mode')).toHaveProperty('checked', true);
    expect(lastRidgeDevControls?.resolveAuthoringState?.()).toEqual({
      active: true,
      selection: null
    });
    expect(lastRidgeDevControls?.resolveCompositionSource?.()?.id).toBe('bridge');
    expect(lastRidgeDevControls?.resolveDebugSettings?.()).toMatchObject({
      showTraversalAssists: true
    });
  });

  it('updates the authoring draft and snippet from sidebar field edits', async () => {
    render(<RidgeStageDebugger />);

    await userEvent.click(screen.getByLabelText('Stage Authoring Mode'));
    await userEvent.selectOptions(
      screen.getByLabelText('Authoring target'),
      'Spot draftsperson'
    );

    expect(screen.getByText('Stage Spot draftsperson')).not.toBeNull();

    const offsetYInput = screen.getByLabelText('offset.y');
    fireEvent.change(offsetYInput, { target: { value: '-6' } });

    expect(lastRidgeDevControls?.resolveCompositionSource?.()?.spots.find((spot) => spot.id === 'draftsperson')?.offset)
      .toEqual({ x: 0, y: -6 });
    expect(screen.getByLabelText('Copyable Ridge Stage Source replacement snippet').textContent)
      .toContain("id: 'draftsperson'");
    expect(screen.getByLabelText('Copyable Ridge Stage Source replacement snippet').textContent)
      .toContain('offset: { x: 0, y: -6 }');
  });

  it('renders the latest rail snapshot and copyable source snippet', () => {
    render(<RidgeStageDebugger />);

    act(() => {
      lastRidgeDevControls?.publishPlayerSnapshot?.({
        x: 1275,
        y: 500,
        railProgress: 0.48,
        railScale: 1,
        railDepth: 31,
        bridgeBeat: 'needs_toy_car',
        crossingOpen: false,
        playerProgressMax: 0.56,
        nearestStageSpotId: 'draftsperson',
        sourceSnippet: 'railProgress: 0.480'
      });
    });

    expect(screen.getByText('1275, 500')).not.toBeNull();
    expect(screen.getByText('0.480 @ draftsperson')).not.toBeNull();
    expect(screen.getByText('scale 1.00 / depth 31')).not.toBeNull();
    expect(screen.getByText('0.000-0.560')).not.toBeNull();
    expect(screen.getByLabelText('Copyable Ridge Stage Source snippet')).toHaveProperty(
      'value',
      'railProgress: 0.480'
    );
  });

  it('renders Trail Card overlays inside the runtime preview', async () => {
    render(<RidgeStageDebugger />);

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
    expect(await screen.findByRole('dialog', { name: 'Stampede Sketch' })).toBeDefined();

    await userEvent.click(screen.getByRole('button', { name: 'Enter' }));

    await waitFor(() => {
      expect(screen.getByText('Runtime scene: stampedeSketch')).toBeDefined();
    });
    expect(lastGamePresentationMode).toBe('vertical-board');

    await userEvent.click(screen.getByRole('button', { name: 'Back to Ridge' }));

    await waitFor(() => {
      expect(screen.getByText('Runtime scene: ridge')).toBeDefined();
    });
  });

  it('keeps the runtime preview in Ridge when the scene close callback fires', async () => {
    render(<RidgeStageDebugger />);
    expect(await screen.findByText('Runtime scene: ridge')).not.toBeNull();

    act(() => {
      lastReturnToOverworld?.();
    });

    expect(screen.getByText('Runtime scene: ridge')).not.toBeNull();
  });
});

function resetBridgeForDebuggerTest(): void {
  bridgeActions.returnToOverworld();
  bridgeActions.closeOverlay();
  bridgeActions.clearSceneUi();
  bridgeActions.setSceneLoading(null);
  bridgeActions.resetTouch();
  bridgeActions.resetProgress();
  lastRidgeDevControls = undefined;
  lastReturnToOverworld = undefined;
  lastGameIsPaused = undefined;
  lastGamePresentationMode = undefined;
}
