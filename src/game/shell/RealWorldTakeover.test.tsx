// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RealWorldCallbacks } from '@/game/realWorld';
import { RealWorldTakeover } from './RealWorldTakeover';

const realWorld = vi.hoisted(() => {
  const handle = { resume: vi.fn(), dispose: vi.fn() };
  let callbacks: RealWorldCallbacks | undefined;
  return {
    handle,
    callbacks: () => callbacks!,
    boot: vi.fn((_host: HTMLElement, given: RealWorldCallbacks) => {
      callbacks = given;
      return handle;
    })
  };
});
vi.mock('@/game/realWorld', () => ({ bootRealWorld: realWorld.boot }));

function withWebGL(available: boolean) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue((available ? {} : null) as never);
}

describe('RealWorldTakeover', () => {
  beforeEach(() => {
    realWorld.boot.mockClear();
    realWorld.handle.resume.mockClear();
    realWorld.handle.dispose.mockClear();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads the real world into the page and frees it on unmount', async () => {
    withWebGL(true);
    const { unmount } = render(<RealWorldTakeover onGiveUp={vi.fn()} />);
    expect(screen.getByText(/opening your eyes/i)).toBeTruthy();

    await waitFor(() => expect(realWorld.boot).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('real-world').contains(realWorld.boot.mock.calls[0][0])).toBe(true);
    await waitFor(() => expect(screen.queryByText(/opening your eyes/i)).toBeNull());
    expect(screen.getByText(/wasd to walk/i)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();

    unmount();
    expect(realWorld.handle.dispose).toHaveBeenCalledTimes(1);
  });

  it('pauses behind a card, and the click keeps going', async () => {
    withWebGL(true);
    render(<RealWorldTakeover onGiveUp={vi.fn()} />);
    await waitFor(() => expect(realWorld.boot).toHaveBeenCalled());

    act(() => realWorld.callbacks().onPausedChange(true));
    const keepGoing = screen.getByRole('button', { name: /click to keep going/i });
    expect(document.activeElement).toBe(keepGoing);

    await userEvent.click(keepGoing);
    expect(realWorld.handle.resume).toHaveBeenCalledTimes(1);
    act(() => realWorld.callbacks().onPausedChange(false));
    expect(screen.queryByRole('button', { name: /click to keep going/i })).toBeNull();
  });

  it('without WebGL, says so and offers the only way back', async () => {
    withWebGL(false);
    const onGiveUp = vi.fn();
    render(<RealWorldTakeover onGiveUp={onGiveUp} />);

    expect(screen.getByRole('alert').textContent).toMatch(/webgl/i);
    expect(realWorld.boot).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: /back to the portfolio/i }));
    expect(onGiveUp).toHaveBeenCalledTimes(1);
  });
});
