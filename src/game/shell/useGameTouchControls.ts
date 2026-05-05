import { bridgeActions } from '@game/bridge/store';
import { useTouchGestures } from '@shared/hooks/useTouchGestures';

interface UseGameTouchControlsOptions {
  isPaused: boolean;
}

export function useGameTouchControls({ isPaused }: UseGameTouchControlsOptions) {
  return useTouchGestures({
    onSwipeLeft: (intensity) => {
      if (isPaused) return;
      bridgeActions.setTouchDirectional('left', intensity);
      bridgeActions.setTouchDirectional('right', 0);
    },
    onSwipeRight: (intensity) => {
      if (isPaused) return;
      bridgeActions.setTouchDirectional('right', intensity);
      bridgeActions.setTouchDirectional('left', 0);
    },
    onSwipeUp: () => {
      if (isPaused) return;
      bridgeActions.queueJump();
    },
    onSwipeEnd: () => {
      bridgeActions.setTouchDirectional('left', 0);
      bridgeActions.setTouchDirectional('right', 0);
    },
    onTap: () => {
      if (isPaused) return;
      bridgeActions.tapInteract();
    }
  });
}
