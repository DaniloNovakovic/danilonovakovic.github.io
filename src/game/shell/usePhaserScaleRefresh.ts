import { useEffect, type RefObject } from 'react';
import type * as Phaser from 'phaser';
import { bridgeActions } from '@/game/bridge/store';
import type { PhaserScenePresentationMode } from '@/game/sharedSceneRuntime/phaserScenePresentation';
import type { SceneId } from '@/game/scenes/sceneIds';
import { refreshPhaserScale } from './refreshPhaserScale';

interface UsePhaserScaleRefreshOptions {
  activeSceneId: SceneId;
  gameRef: RefObject<Phaser.Game | null>;
  presentationMode: PhaserScenePresentationMode;
}

export function usePhaserScaleRefresh({
  activeSceneId,
  gameRef,
  presentationMode
}: UsePhaserScaleRefreshOptions) {
  useEffect(function resetTouchWhenActiveModeChanges() {
    bridgeActions.resetTouch();
  }, [activeSceneId]);

  useEffect(function refreshPhaserScaleForPresentationMode() {
    bridgeActions.resetTouch();
    const game = gameRef.current;
    if (!game) return;

    let secondFrameId: number | undefined;
    const firstFrameId = requestAnimationFrame(() => {
      refreshPhaserScale(game);
      secondFrameId = requestAnimationFrame(() => {
        refreshPhaserScale(game);
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
