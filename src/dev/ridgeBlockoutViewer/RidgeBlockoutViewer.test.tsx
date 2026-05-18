// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import RidgeBlockoutViewer from './RidgeBlockoutViewer';

describe('RidgeBlockoutViewer', () => {
  afterEach(cleanup);

  it('renders generated blockout summary and inspection layers', () => {
    render(<RidgeBlockoutViewer />);

    expect(screen.getByRole('heading', { name: 'Ridge Blockout Viewer' })).not.toBeNull();
    expect(screen.getByText('Folded Desk Ridge')).not.toBeNull();
    expect(screen.getByTestId('ridge-viewer-validation-status').textContent).toContain('Validation clean');
    expect(screen.getByLabelText('Room Cicka Home')).not.toBeNull();
    expect(screen.getByLabelText(/Anchor C in Cicka Home: npc/)).not.toBeNull();
    expect(screen.getByText('Route: first_walk')).not.toBeNull();
    expect(screen.getByText(/stampede_sketch: locked \/ unlocked with Stampede/)).not.toBeNull();
    expect(screen.getByTestId('ridge-layer-colliders')).not.toBeNull();
  });

  it('toggles SVG layers from the sidebar', async () => {
    render(<RidgeBlockoutViewer />);

    expect(screen.getByTestId('ridge-layer-anchors')).not.toBeNull();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Anchors' }));

    expect(screen.queryByTestId('ridge-layer-anchors')).toBeNull();
  });

  it('updates viewport transform through zoom and drag pan controls', async () => {
    render(<RidgeBlockoutViewer />);

    const world = screen.getByTestId('ridge-viewer-world');
    const canvas = screen.getByLabelText('Ridge blockout map canvas');
    const initialTransform = world.getAttribute('transform');

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(world.getAttribute('transform')).not.toBe(initialTransform);

    const zoomedTransform = world.getAttribute('transform');
    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 130, clientY: 118, pointerId: 1 });

    expect(world.getAttribute('transform')).not.toBe(zoomedTransform);
  });

  it('shows selected details after clicking an anchor', async () => {
    render(<RidgeBlockoutViewer />);

    await userEvent.click(screen.getByLabelText(/Anchor C in Cicka Home: npc/));

    const selected = screen.getByTestId('ridge-viewer-selection');
    expect(selected.textContent).toContain('anchor');
    expect(selected.textContent).toContain('npc');
    expect(selected.textContent).toContain('cicka');
  });
});
