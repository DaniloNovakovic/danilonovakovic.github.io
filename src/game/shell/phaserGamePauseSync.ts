import type * as Phaser from 'phaser';
import { isPausableScene } from '@/game/sharedSceneRuntime/sceneContracts';

export function setPauseOnPausableScenes(game: Phaser.Game | null, paused: boolean): void {
  if (!game) return;
  game.scene.getScenes(true).forEach((scene) => {
    if (isPausableScene(scene)) {
      scene.setPaused(paused);
    }
  });
}
