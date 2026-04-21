import { useRef, useCallback } from 'react';

interface GestureCallbacks {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
  onSwipeEnd: () => void;
  onTap: () => void;
}

const THRESHOLD = 15; // px

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
    isActive: false,
  });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      hasSwiped: false,
      isActive: true,
    };
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const state = dragRef.current;
      if (!state.isActive) return;

      const deltaX = e.clientX - state.startX;
      const deltaY = e.clientY - state.startY;

      // Prioritize swipe up for jumping
      if (deltaY < -THRESHOLD && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (!state.hasSwiped) {
          onSwipeUp();
          state.hasSwiped = true;
        }
        // Even after swipe up, we don't necessarily want to cancel L/R movement
        // but for this specific gesture, we mark it as "swiped".
      } else if (Math.abs(deltaX) > THRESHOLD) {
        state.hasSwiped = true;
        if (deltaX > 0) {
          onSwipeRight();
        } else {
          onSwipeLeft();
        }
      } else if (state.hasSwiped) {
        // If we were swiping but moved back to neutral zone
        onSwipeEnd();
      }
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeEnd]
  );

  const onPointerUp = useCallback(() => {
    const state = dragRef.current;
    if (!state.isActive) return;

    if (!state.hasSwiped) {
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
