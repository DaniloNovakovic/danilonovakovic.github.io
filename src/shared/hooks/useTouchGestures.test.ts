/**
 * @vitest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useTouchGestures } from './useTouchGestures';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('useTouchGestures', () => {
  const callbacks = {
    onSwipeLeft: vi.fn(),
    onSwipeRight: vi.fn(),
    onSwipeUp: vi.fn(),
    onSwipeEnd: vi.fn(),
    onTap: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = () => {
    const { result } = renderHook(() => useTouchGestures(callbacks));
    return { ...callbacks, result };
  };

  it('triggers swipe left with intensity when moving horizontally', () => {
    const { onSwipeLeft, result } = setup();

    act(() => {
      result.current.onPointerDown({ clientX: 100, clientY: 100 } as any);
      result.current.onPointerMove({ clientX: 50, clientY: 100 } as any); // deltaX: -50
    });

    expect(onSwipeLeft).toHaveBeenCalledWith(expect.any(Number));
    const intensity = onSwipeLeft.mock.calls[0][0];
    expect(intensity).toBeGreaterThan(0.2);
    expect(intensity).toBeLessThan(1.0);
  });

  it('triggers swipe up when moving vertically', () => {
    const { onSwipeUp, result } = setup();

    act(() => {
      result.current.onPointerDown({ clientX: 100, clientY: 100 } as any);
      result.current.onPointerMove({ clientX: 100, clientY: 50 } as any); // deltaY: -50
    });

    expect(onSwipeUp).toHaveBeenCalled();
  });

  it('allows simultaneous swipe up and swipe left with intensity (running jump)', () => {
    const { onSwipeUp, onSwipeLeft, result } = setup();

    act(() => {
      result.current.onPointerDown({ clientX: 100, clientY: 100 } as any);
    });

    // Move diagonally: deltaX = -50, deltaY = -35
    // Previously: abs(deltaY) (35) <= abs(deltaX) (50) would NOT trigger jump.
    // Now: deltaY (-35) < -30 triggers jump.
    act(() => {
      result.current.onPointerMove({ clientX: 50, clientY: 65 } as any);
    });

    expect(onSwipeUp).toHaveBeenCalled();
    expect(onSwipeLeft).toHaveBeenCalledWith(expect.any(Number));
  });

  it('allows multiple jumps during a single drag by resetting hasJumped', () => {
    const { onSwipeUp, result } = setup();

    act(() => {
      result.current.onPointerDown({ clientX: 100, clientY: 100 } as any);
    });

    // Jump 1
    act(() => {
      result.current.onPointerMove({ clientX: 100, clientY: 65 } as any); // deltaY: -35
    });
    expect(onSwipeUp).toHaveBeenCalledTimes(1);

    // Reset jump by moving finger back down
    act(() => {
      result.current.onPointerMove({ clientX: 100, clientY: 90 } as any); // deltaY: -10 (> -15)
    });

    // Jump 2
    act(() => {
      result.current.onPointerMove({ clientX: 100, clientY: 65 } as any); // deltaY: -35
    });
    expect(onSwipeUp).toHaveBeenCalledTimes(2);
  });

  it('does not trigger tap if a jump occurred', () => {
    const { onSwipeUp, onTap, result } = setup();

    act(() => {
      result.current.onPointerDown({ clientX: 100, clientY: 100 } as any);
      result.current.onPointerMove({ clientX: 100, clientY: 50 } as any); // deltaY: -50
    });

    expect(onSwipeUp).toHaveBeenCalled();

    act(() => {
      result.current.onPointerUp();
    });

    expect(onTap).not.toHaveBeenCalled();
  });

  it('triggers tap if no swipe or jump occurred', () => {
    const { onTap, result } = setup();

    act(() => {
      result.current.onPointerDown({ clientX: 100, clientY: 100 } as any);
      result.current.onPointerUp();
    });

    expect(onTap).toHaveBeenCalled();
  });

  it('triggers swipe end on pointer up', () => {
    const { onSwipeEnd, result } = setup();

    act(() => {
      result.current.onPointerDown({ clientX: 100, clientY: 100 } as any);
      result.current.onPointerUp();
    });

    expect(onSwipeEnd).toHaveBeenCalled();
  });
});
