// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { lazyOverlay } from './lazyOverlay';
import type { OverlayControllerProps } from './types';

afterEach(cleanup);

const controllerProps: OverlayControllerProps = {
  close: vi.fn(),
  openOverlay: vi.fn(),
  titleId: 'title',
  descriptionId: 'description'
};

describe('lazyOverlay', () => {
  it('renders the fallback while loading the overlay component', () => {
    const Overlay = lazyOverlay(
      () => new Promise(() => undefined),
      <div>Loading overlay</div>
    );

    render(<Overlay {...controllerProps} />);

    expect(screen.getByText('Loading overlay')).toBeDefined();
  });

  it('loads once and reuses the resolved overlay component across remounts', async () => {
    const load = vi.fn(async () => ({
      default: function LoadedOverlay({ params }: OverlayControllerProps) {
        return <div>Loaded {String(params)}</div>;
      }
    }));
    const Overlay = lazyOverlay(load);

    const { unmount } = render(<Overlay {...controllerProps} params="first" />);
    expect(await screen.findByText('Loaded first')).toBeDefined();
    expect(load).toHaveBeenCalledTimes(1);

    unmount();
    render(<Overlay {...controllerProps} params="second" />);
    expect(await screen.findByText('Loaded second')).toBeDefined();
    expect(load).toHaveBeenCalledTimes(1);
  });
});
