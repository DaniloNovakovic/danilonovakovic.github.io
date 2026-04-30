import * as Phaser from 'phaser';
import { PHASER_SCENE_KEYS } from '../../config/featureIds';
import {
  isInteractBridgeScene,
  isPausableScene,
  isResumeCaptureScene
} from '../../runtime/sceneContracts';
import { rememberResumePosition } from '../../runtime/sceneResumeStore';
import type { ResumeSnapshot } from '../../core/kernel/types';
import type { SceneRuntimeAdapter } from '../../core/kernel/SceneManager';

interface PhaserSceneAdapterOptions {
  getGame: () => Phaser.Game | null;
  onInteract: (area: string) => void;
}

export class PhaserSceneAdapter implements SceneRuntimeAdapter {
  private readonly options: PhaserSceneAdapterOptions;

  constructor(options: PhaserSceneAdapterOptions) {
    this.options = options;
  }

  isSceneActive(sceneKey: string): boolean {
    const game = this.options.getGame();
    if (!game) return false;
    return game.scene.isActive(sceneKey);
  }

  startScene(sceneKey: string, data: Record<string, unknown>): void {
    const game = this.options.getGame();
    if (!game) return;
    game.scene.start(sceneKey, data);
    this.updateInteractCallbacks(this.options.onInteract);
  }

  stopScene(sceneKey: string): void {
    const game = this.options.getGame();
    if (!game) return;
    game.scene.stop(sceneKey);
  }

  listKnownSceneKeys(): string[] {
    const game = this.options.getGame();
    if (!game) return [];
    return game.scene.getScenes(false).map((s) => s.scene.key);
  }

  setPauseOnActiveScenes(paused: boolean): void {
    const game = this.options.getGame();
    if (!game) return;
    const scenes = game.scene.getScenes(true);
    scenes.forEach((scene) => {
      if (isPausableScene(scene)) {
        scene.setPaused(paused);
      }
    });
  }

  captureResume(sceneKey: string): ResumeSnapshot | null {
    const game = this.options.getGame();
    if (!game) return null;
    const scene = game.scene.getScene(sceneKey);
    if (!scene || !isResumeCaptureScene(scene)) return null;
    const position = scene.getResumeCapturePosition();
    if (!position) return null;
    // Secret mini-game: each entry should start fresh (spawn + collectibles), not last exit coords.
    if (sceneKey !== PHASER_SCENE_KEYS.potassium) {
      rememberResumePosition(sceneKey, position);
    }
    return position;
  }

  updateInteractCallbacks(onInteract: (area: string) => void): void {
    const game = this.options.getGame();
    if (!game) return;
    const scenes = game.scene.getScenes(false);
    for (const scene of scenes) {
      if (isInteractBridgeScene(scene)) {
        scene.updateInteractCallback(onInteract);
      }
    }
  }
}
