import { bridgeActions } from '@/game/bridge/store';
import { useTouchGestures } from '@/shared/hooks/useTouchGestures';
import type { PointerEvent } from 'react';

interface UseGameTouchControlsOptions {
  isPaused: boolean;
}

type TouchDirection = 'left' | 'right' | 'up' | 'down';

export function useGameTouchControls({ isPaused }: UseGameTouchControlsOptions) {
  function setDirection(direction: TouchDirection, intensity: number): void {
    if (isPaused && intensity > 0) return;
    bridgeActions.setTouchDirectional(direction, intensity);
  }

  function stopPointer(e: PointerEvent): void {
    e.preventDefault();
    e.stopPropagation();
  }

  const gestureHandlers = useTouchGestures({
    onSwipeLeft: (intensity) => {
      setDirection('left', intensity);
      setDirection('right', 0);
    },
    onSwipeRight: (intensity) => {
      setDirection('right', intensity);
      setDirection('left', 0);
    },
    onSwipeUp: () => {
      if (isPaused) return;
      bridgeActions.queueJump();
    },
    onSwipeEnd: () => {
      setDirection('left', 0);
      setDirection('right', 0);
      setDirection('up', 0);
      setDirection('down', 0);
    },
    onTap: () => {
      if (isPaused) return;
      bridgeActions.tapInteract();
    }
  });

  function getDirectionalButtonHandlers(direction: TouchDirection) {
    return {
      onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
        stopPointer(e);
        e.currentTarget.setPointerCapture(e.pointerId);
        setDirection(direction, 1);
      },
      onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
        stopPointer(e);
        setDirection(direction, 0);
      },
      onPointerCancel: (e: PointerEvent<HTMLButtonElement>) => {
        stopPointer(e);
        setDirection(direction, 0);
      },
      onPointerLeave: (e: PointerEvent<HTMLButtonElement>) => {
        stopPointer(e);
        setDirection(direction, 0);
      }
    };
  }

  const jumpButtonHandlers = {
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      stopPointer(e);
      if (!isPaused) bridgeActions.queueJump();
    }
  };

  const interactButtonHandlers = {
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      stopPointer(e);
      if (!isPaused) bridgeActions.tapInteract();
    }
  };

  return {
    gestureHandlers,
    getDirectionalButtonHandlers,
    jumpButtonHandlers,
    interactButtonHandlers
  };
}
