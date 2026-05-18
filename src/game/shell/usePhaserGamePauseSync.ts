import { useEffect, type RefObject } from 'react';
import type * as Phaser from 'phaser';
import type { SceneId } from '@/game/scenes/sceneIds';
import { setPauseOnPausableScenes } from './phaserGamePauseSync';

interface UsePhaserGamePauseSyncOptions {
  activeSceneId: SceneId;
  gameRef: RefObject<Phaser.Game | null>;
  isPaused: boolean;
}

export function usePhaserGamePauseSync({
  activeSceneId,
  gameRef,
  isPaused
}: UsePhaserGamePauseSyncOptions): void {
  useEffect(function syncPausableScenesWithGamePauseProp() {
    setPauseOnPausableScenes(gameRef.current, isPaused);
  }, [activeSceneId, gameRef, isPaused]);
}
