import { useEffect, type MutableRefObject } from 'react';
import type * as Phaser from 'phaser';
import { bridgeActions } from '@game/bridge/store';
import type { PhaserScenePresentationMode } from '@game/runtime/phaserScenePresentation';

interface UsePhaserScaleRefreshOptions {
  activeMiniGameId: string | null;
  gameRef: MutableRefObject<Phaser.Game | null>;
  presentationMode: PhaserScenePresentationMode;
}

export function usePhaserScaleRefresh({
  activeMiniGameId,
  gameRef,
  presentationMode
}: UsePhaserScaleRefreshOptions) {
  useEffect(function resetTouchWhenActiveModeChanges() {
    bridgeActions.resetTouch();
  }, [activeMiniGameId]);

  useEffect(function refreshPhaserScaleForPresentationMode() {
    bridgeActions.resetTouch();
    const game = gameRef.current;
    if (!game) return;

    let secondFrameId: number | undefined;
    const firstFrameId = requestAnimationFrame(() => {
      game.scale.refresh();
      secondFrameId = requestAnimationFrame(() => {
        game.scale.refresh();
      });
    });

    return () => {
      cancelAnimationFrame(firstFrameId);
      if (secondFrameId !== undefined) {
        cancelAnimationFrame(secondFrameId);
      }
    };
  }, [gameRef, presentationMode]);
}
