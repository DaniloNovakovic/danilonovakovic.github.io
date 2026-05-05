import { useCallback, useLayoutEffect, useRef } from 'react';

interface GameBridgeCallbacks {
  onInteract: (area: string) => void;
  onClose: () => void;
  isPaused: boolean;
}

export function useGameBridgeCallbacks({ onInteract, onClose, isPaused }: GameBridgeCallbacks) {
  const bridgeRef = useRef({ onInteract, onClose, isPaused });

  useLayoutEffect(function syncGameBridgeCallbacks() {
    bridgeRef.current = { onInteract, onClose, isPaused };
  }, [onInteract, onClose, isPaused]);

  const stableOnInteract = useCallback((area: string) => {
    bridgeRef.current.onInteract(area);
  }, []);

  const stableOnClose = useCallback(() => {
    bridgeRef.current.onClose();
  }, []);

  return {
    bridgeRef,
    stableOnInteract,
    stableOnClose
  };
}
