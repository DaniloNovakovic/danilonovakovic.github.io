// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManualPageOverlay from './ManualPageOverlay';
import type { ManualPageOverlayParams } from './types';

const params: ManualPageOverlayParams = {
  title: 'Relay Sign, Smudged',
  cluePanel: 'Three bright marks can speak louder than one perfect route.',
  marginNote: 'The spire listens for proof, not perfection.'
};

afterEach(() => {
  cleanup();
});

describe('ManualPageOverlay', () => {
  it('renders the passed title, clue panel, and margin note', () => {
    render(
      <ManualPageOverlay
        params={params}
        close={vi.fn()}
        enterScene={vi.fn()}
        openOverlay={vi.fn()}
        titleId="manual-title"
        descriptionId="manual-description"
      />
    );

    expect(screen.getByRole('heading', { name: 'Relay Sign, Smudged' })).toBeDefined();
    expect(screen.getByText('Three bright marks can speak louder than one perfect route.')).toBeDefined();
    expect(screen.getByText('The spire listens for proof, not perfection.')).toBeDefined();
  });

  it('closes through the close action', async () => {
    const close = vi.fn();
    render(
      <ManualPageOverlay
        params={params}
        close={close}
        enterScene={vi.fn()}
        openOverlay={vi.fn()}
        titleId="manual-title"
        descriptionId="manual-description"
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Close page' }));

    expect(close).toHaveBeenCalledTimes(1);
  });
});
