import { useCallback, useLayoutEffect, useRef } from 'react';
import type { OverlayId } from '@/game/overlays/overlayIds';
import type { SceneId } from '@/game/scenes/sceneIds';
import type { OpenOverlayOptions } from '@/game/bridge/store';
import type { RidgeDevControls } from '@/game/scenes/ridge/runtime/ridgeDevControls';

interface GameBridgeCallbacks {
  onEnterScene: (sceneId: SceneId) => void;
  onOpenOverlay: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  onReturnToOverworld: () => void;
  isPaused: boolean;
  ridgeDevControls?: RidgeDevControls;
}

export function useGameBridgeCallbacks({
  onEnterScene,
  onOpenOverlay,
  onReturnToOverworld,
  isPaused,
  ridgeDevControls
}: GameBridgeCallbacks) {
  const bridgeRef = useRef({
    onEnterScene,
    onOpenOverlay,
    onReturnToOverworld,
    isPaused,
    ridgeDevControls
  });

  useLayoutEffect(function syncGameBridgeCallbacks() {
    bridgeRef.current = {
      onEnterScene,
      onOpenOverlay,
      onReturnToOverworld,
      isPaused,
      ridgeDevControls
    };
  }, [onEnterScene, onOpenOverlay, onReturnToOverworld, isPaused, ridgeDevControls]);

  const stableOnEnterScene = useCallback((sceneId: SceneId) => {
    bridgeRef.current.onEnterScene(sceneId);
  }, []);

  const stableOnOpenOverlay = useCallback((overlayId: OverlayId, options?: OpenOverlayOptions) => {
    bridgeRef.current.onOpenOverlay(overlayId, options);
  }, []);

  const stableOnReturnToOverworld = useCallback(() => {
    bridgeRef.current.onReturnToOverworld();
  }, []);

  return {
    bridgeRef,
    stableOnEnterScene,
    stableOnOpenOverlay,
    stableOnReturnToOverworld
  };
}
