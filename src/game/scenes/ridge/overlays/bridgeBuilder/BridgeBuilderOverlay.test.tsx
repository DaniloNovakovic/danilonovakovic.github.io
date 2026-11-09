// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { bridgeActions, bridgeStore } from '@/game/bridge/store';
import {
  BRIDGE_GUIDE_EDGES,
  bridgeNodeById,
  type BridgeDesign
} from '@/game/core/ridge';
import BridgeBuilderOverlay from './BridgeBuilderOverlay';

function renderOverlay(close = vi.fn()) {
  render(
    <BridgeBuilderOverlay
      close={close}
      enterScene={vi.fn()}
      openOverlay={vi.fn()}
      titleId="bridge-title"
      descriptionId="bridge-description"
    />
  );
  return close;
}

function joint(label: string) {
  return screen.getByRole('button', { name: `Bridge joint ${label}` });
}

function connect(a: string, b: string) {
  fireEvent.keyDown(joint(bridgeNodeById(a as Parameters<typeof bridgeNodeById>[0]).label), {
    key: 'Enter'
  });
  fireEvent.keyDown(joint(bridgeNodeById(b as Parameters<typeof bridgeNodeById>[0]).label), {
    key: 'Enter'
  });
}

function traceCanonicalDesign() {
  for (const edge of BRIDGE_GUIDE_EDGES) connect(edge.a, edge.b);
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  bridgeActions.resetProgress();
  bridgeActions.clearSceneUi();
  bridgeActions.closeOverlay();
});

describe('Blueprint Bridge workbench', () => {
  it('lets a player trace a design, pass both vehicles, and return the design to Ridge', () => {
    const close = renderOverlay();
    traceCanonicalDesign();

    expect(screen.getByText('Ink 14/16')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Test with toy car' }));
    advance(2400);
    expect(screen.getByText('CAR PASSED')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Send the delivery truck' }));
    advance(3000);
    expect(screen.getByText('BRIDGE APPROVED')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Roll into Ridge' }));
    const action = bridgeStore.getState().sceneUi.lastAction;
    expect(close).toHaveBeenCalledOnce();
    expect(action?.action).toBe('ridgeBridgeBuilderComplete');
    expect((action?.params as BridgeDesign).edges).toHaveLength(14);
  });

  it('shows a recoverable failure instead of unlocking the route for a weak design', () => {
    renderOverlay();
    connect('west-bank', 'west-deck');
    fireEvent.click(screen.getByRole('button', { name: 'Test with toy car' }));
    advance(2400);

    expect(screen.getByText('WOBBLE DETECTED')).toBeDefined();
    expect(bridgeStore.getState().sceneUi.lastAction).toBeNull();
    advance(1400);
    expect(screen.getByRole('button', { name: 'Test with toy car' })).toBeDefined();
  });

  it('can close without spending the test car or completing the bridge', () => {
    const close = renderOverlay();
    connect('west-bank', 'west-deck');
    fireEvent.click(screen.getByRole('button', { name: 'Close workbench' }));

    expect(close).toHaveBeenCalledOnce();
    expect(bridgeStore.getState().sceneUi.lastAction).toBeNull();
    expect(bridgeStore.getState().progress.ridge.firstPlayableRoute.beat).toBe('intro');
  });
});
