// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrailCardOverlay from './TrailCardOverlay';
import type { TrailCardOverlayParams } from './types';
import { bridgeActions, bridgeStore } from '@/game/bridge/store';

const params: TrailCardOverlayParams = {
  title: 'Stampede Sketch',
  mood: 'Low-input ink swarm',
  timeEstimate: '60-90 seconds',
  rewardPreview: 'Stamp + glide pip',
  unavailableReason: 'Prototype scene not wired yet'
};

afterEach(() => {
  cleanup();
  bridgeActions.returnToOverworld();
  bridgeActions.closeOverlay();
});

describe('TrailCardOverlay', () => {
  it('renders Trail Card params with disabled entry', () => {
    render(
      <TrailCardOverlay
        params={params}
        close={vi.fn()}
        enterScene={vi.fn()}
        openOverlay={vi.fn()}
        titleId="trail-title"
        descriptionId="trail-description"
      />
    );

    expect(screen.getByRole('heading', { name: 'Stampede Sketch' })).toBeDefined();
    expect(screen.getByText('Low-input ink swarm')).toBeDefined();
    expect(screen.getByText('60-90 seconds')).toBeDefined();
    expect(screen.getByText('Stamp + glide pip')).toBeDefined();
    expect(screen.getByText('Prototype scene not wired yet')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Enter' }).hasAttribute('disabled')).toBe(true);
  });

  it('enters the configured scene when the card is available', async () => {
    const enabledParams: TrailCardOverlayParams = {
      title: 'Stampede Sketch',
      mood: 'Kite overexcited ink ideas',
      timeEstimate: '60-90 seconds',
      rewardPreview: 'Stamp + glide pip',
      enterSceneId: 'stampedeSketch'
    };
    const enterScene = vi.fn();
    render(
      <TrailCardOverlay
        params={enabledParams}
        close={vi.fn()}
        enterScene={enterScene}
        openOverlay={vi.fn()}
        titleId="trail-title"
        descriptionId="trail-description"
      />
    );

    const enter = screen.getByRole('button', { name: 'Enter' });
    expect(enter.hasAttribute('disabled')).toBe(false);

    await userEvent.click(enter);

    expect(enterScene).toHaveBeenCalledWith('stampedeSketch');
    expect(bridgeStore.getState().activeSceneId).not.toBe('stampedeSketch');
  });

  it('closes through the back action', async () => {
    const close = vi.fn();
    render(
      <TrailCardOverlay
        params={params}
        close={close}
        enterScene={vi.fn()}
        openOverlay={vi.fn()}
        titleId="trail-title"
        descriptionId="trail-description"
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Back to Ridge' }));

    expect(close).toHaveBeenCalledTimes(1);
  });
});
