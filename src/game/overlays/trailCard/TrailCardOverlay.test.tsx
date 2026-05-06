// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrailCardOverlay from './TrailCardOverlay';
import type { TrailCardOverlayParams } from './types';

const params: TrailCardOverlayParams = {
  title: 'Stampede Sketch',
  mood: 'Low-input ink swarm',
  timeEstimate: '60-90 seconds',
  rewardPreview: 'Stamp + glide pip',
  unavailableReason: 'Prototype scene not wired yet'
};

afterEach(() => {
  cleanup();
});

describe('TrailCardOverlay', () => {
  it('renders Trail Card params with disabled entry', () => {
    render(
      <TrailCardOverlay
        params={params}
        close={vi.fn()}
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

  it('closes through the back action', async () => {
    const close = vi.fn();
    render(
      <TrailCardOverlay
        params={params}
        close={close}
        openOverlay={vi.fn()}
        titleId="trail-title"
        descriptionId="trail-description"
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Back to Ridge' }));

    expect(close).toHaveBeenCalledTimes(1);
  });
});
