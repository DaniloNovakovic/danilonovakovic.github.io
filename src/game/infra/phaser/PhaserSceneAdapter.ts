import * as Phaser from 'phaser';
import {
  isPausableScene,
  isResumeCaptureScene
} from '../../runtime/sceneContracts';
import { recordSceneExitResume } from '../../runtime/sceneResumePolicy';
import type { ResumeSnapshot } from '../../kernel/types';
import type { SceneRuntimeAdapter } from '../../kernel/SceneManager';

interface PhaserSceneAdapterOptions {
  getGame: () => Phaser.Game | null;
}

export class PhaserSceneAdapter implements SceneRuntimeAdapter {
  private readonly options: PhaserSceneAdapterOptions;

  constructor(options: PhaserSceneAdapterOptions) {
    this.options = options;
  }

  hasScene(sceneKey: string): boolean {
    const game = this.options.getGame();
    if (!game) return false;
    return game.scene.getScenes(false).some((scene) => scene.scene.key === sceneKey);
  }

  registerScene(sceneKey: string, scene: unknown): void {
    const game = this.options.getGame();
    if (!game) return;
    if (this.hasScene(sceneKey)) return;
    game.scene.add(sceneKey, scene as typeof Phaser.Scene, false);
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
    return recordSceneExitResume(sceneKey, position);
  }

}
