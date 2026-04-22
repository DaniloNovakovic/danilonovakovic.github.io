import { useRef, useCallback } from 'react';

interface GestureCallbacks {
  onSwipeLeft: (intensity: number) => void;
  onSwipeRight: (intensity: number) => void;
  onSwipeUp: () => void;
  onSwipeEnd: () => void;
  onTap: () => void;
}

const THRESHOLD = 15; // px
const MAX_DRAG = 60; // px

/**
 * A custom hook to detect mobile gestures: swipes (L/R/Up) and taps.
 * Architecturally separates gesture recognition from game logic.
 */
export function useTouchGestures({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeEnd,
  onTap,
}: GestureCallbacks) {
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    hasSwiped: false,
    hasJumped: false,
    isActive: false,
  });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      hasSwiped: false,
      hasJumped: false,
      isActive: true,
    };
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const state = dragRef.current;
      if (!state.isActive) return;

      const deltaX = e.clientX - state.startX;
      const deltaY = e.clientY - state.startY;

      // Handle jump gesture independently
      if (deltaY < -30) {
        if (!state.hasJumped) {
          onSwipeUp();
          state.hasJumped = true;
        }
      } else if (deltaY > -15) {
        // Reset jump flag if they bring their finger back down
        state.hasJumped = false;
      }

      // Handle horizontal swipe with dynamic intensity
      if (Math.abs(deltaX) > THRESHOLD) {
        state.hasSwiped = true;
        // Calculate intensity between 0.2 and 1.0
        const rawIntensity = (Math.abs(deltaX) - THRESHOLD) / (MAX_DRAG - THRESHOLD);
        const intensity = Math.min(Math.max(rawIntensity, 0.2), 1);

        if (deltaX > 0) {
          onSwipeRight(intensity);
        } else {
          onSwipeLeft(intensity);
        }
      } else if (state.hasSwiped) {
        // If we were swiping horizontally but moved back to neutral zone
        onSwipeEnd();
      }
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeEnd]
  );

  const onPointerUp = useCallback(() => {
    const state = dragRef.current;
    if (!state.isActive) return;

    if (!state.hasSwiped && !state.hasJumped) {
      onTap();
    }

    state.isActive = false;
    onSwipeEnd();
  }, [onTap, onSwipeEnd]);

  const onPointerCancel = onPointerUp;
  const onPointerLeave = onPointerUp;

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onPointerLeave,
  };
}
