import { useCallback, useLayoutEffect, useRef } from 'react';
import type { OverlayId } from '@/game/overlays/overlayIds';
import type { SceneId } from '@/game/scenes/sceneIds';
import type { OpenOverlayOptions } from '@/game/bridge/store';

interface GameBridgeCallbacks {
  onEnterScene: (sceneId: SceneId) => void;
  onOpenOverlay: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  onReturnToOverworld: () => void;
  isPaused: boolean;
}

export function useGameBridgeCallbacks({
  onEnterScene,
  onOpenOverlay,
  onReturnToOverworld,
  isPaused
}: GameBridgeCallbacks) {
  const bridgeRef = useRef({ onEnterScene, onOpenOverlay, onReturnToOverworld, isPaused });

  useLayoutEffect(function syncGameBridgeCallbacks() {
    bridgeRef.current = { onEnterScene, onOpenOverlay, onReturnToOverworld, isPaused };
  }, [onEnterScene, onOpenOverlay, onReturnToOverworld, isPaused]);

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
