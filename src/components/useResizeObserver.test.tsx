// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useResizeObserver } from './useResizeObserver';

let resizeObserverCallback: ResizeObserverCallback | undefined;
let resizeObserverInstance: ResizeObserver | undefined;
const originalResizeObserver = globalThis.ResizeObserver;

class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    resizeObserverCallback = callback;
    resizeObserverInstance = this as unknown as ResizeObserver;
  }
}

function createElement(width: number, height: number): HTMLDivElement {
  const element = document.createElement('div');
  element.getBoundingClientRect = vi.fn(() => ({
    width,
    height,
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    toJSON: () => undefined
  }));
  return element;
}

describe('useResizeObserver', () => {
  beforeEach(() => {
    resizeObserverCallback = undefined;
    resizeObserverInstance = undefined;
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    cleanup();
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it('returns undefined size before an element is assigned', () => {
    const { result } = renderHook(() => useResizeObserver<HTMLDivElement>());

    expect(result.current.width).toBeUndefined();
    expect(result.current.height).toBeUndefined();
  });

  it('measures the initial element size and observes it', async () => {
    const { result, rerender } = renderHook(() => useResizeObserver<HTMLDivElement>());
    const element = createElement(120, 80);

    act(() => {
      result.current.ref(element);
    });
    rerender();

    await waitFor(() => {
      expect(result.current.width).toBe(120);
      expect(result.current.height).toBe(80);
    });
    expect(resizeObserverInstance?.observe).toHaveBeenCalledWith(element);
  });

  it('updates width and height from ResizeObserver entries', async () => {
    const { result, rerender } = renderHook(() => useResizeObserver<HTMLDivElement>());

    act(() => {
      result.current.ref(createElement(120, 80));
    });
    rerender();
    await waitFor(() => expect(resizeObserverCallback).toBeDefined());

    act(() => {
      resizeObserverCallback?.(
        [{ contentRect: { width: 200, height: 140 } } as ResizeObserverEntry],
        resizeObserverInstance!
      );
    });

    await waitFor(() => {
      expect(result.current.width).toBe(200);
      expect(result.current.height).toBe(140);
    });
  });

  it('ignores sub-pixel size changes below the threshold', async () => {
    const { result, rerender } = renderHook(() => useResizeObserver<HTMLDivElement>());

    act(() => {
      result.current.ref(createElement(120, 80));
    });
    rerender();
    await waitFor(() => expect(result.current.height).toBe(80));

    act(() => {
      resizeObserverCallback?.(
        [{ contentRect: { width: 120.2, height: 80.2 } } as ResizeObserverEntry],
        resizeObserverInstance!
      );
    });

    expect(result.current.width).toBe(120);
    expect(result.current.height).toBe(80);
  });

  it('does not crash when ResizeObserver is unavailable', async () => {
    globalThis.ResizeObserver = undefined as unknown as typeof ResizeObserver;
    const { result, rerender } = renderHook(() => useResizeObserver<HTMLDivElement>());

    act(() => {
      result.current.ref(createElement(90, 60));
    });
    rerender();

    await waitFor(() => {
      expect(result.current.width).toBe(90);
      expect(result.current.height).toBe(60);
    });
  });
});
