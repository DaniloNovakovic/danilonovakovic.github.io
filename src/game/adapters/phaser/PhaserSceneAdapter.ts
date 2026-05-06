import * as Phaser from 'phaser';
import {
  isPausableScene,
  isResumeCaptureScene
} from '../../sharedSceneRuntime/sceneContracts';
import { recordSceneExitResume } from '../../sharedSceneRuntime/sceneResumePolicy';
import type { ResumeSnapshot } from '../../sceneLifecycle/types';
import type { SceneRuntimeAdapter } from '../../sceneLifecycle/SceneManager';

interface PhaserSceneAdapterOptions {
  getGame: () => Phaser.Game | null;
}

/**
 * Adapter from the engine-agnostic scene lifecycle to Phaser's concrete scene API.
 *
 * `SceneManager` should not know about `Phaser.Game`, `game.scene.start`, or
 * Phaser-specific scene contracts. This class is the narrow bridge that turns
 * scene lifecycle requests into Phaser calls, while also translating repo-level scene
 * capabilities such as pause handling and resume capture.
 */
export class PhaserSceneAdapter implements SceneRuntimeAdapter {
  private readonly options: PhaserSceneAdapterOptions;

  constructor(options: PhaserSceneAdapterOptions) {
    this.options = options;
  }

  /**
   * Returns whether Phaser already knows about a scene key.
   *
   * Used before registering lazily loaded scenes so the same scene class is not
   * added twice during repeated transitions or hot reload.
   */
  hasScene(sceneKey: string): boolean {
    const game = this.options.getGame();
    if (!game) return false;
    return game.scene.getScenes(false).some((scene) => scene.scene.key === sceneKey);
  }

  /**
   * Registers a scene class/object with Phaser if it has not been registered yet.
   */
  registerScene(sceneKey: string, scene: unknown): void {
    const game = this.options.getGame();
    if (!game) return;
    if (this.hasScene(sceneKey)) return;
    game.scene.add(sceneKey, scene as typeof Phaser.Scene, false);
  }

  /**
   * Returns whether a scene is currently active according to Phaser.
   */
  isSceneActive(sceneKey: string): boolean {
    const game = this.options.getGame();
    if (!game) return false;
    return game.scene.isActive(sceneKey);
  }

  /**
   * Starts a Phaser scene with scene-lifecycle-composed start data.
   */
  startScene(sceneKey: string, data: Record<string, unknown>): void {
    const game = this.options.getGame();
    if (!game) return;
    game.scene.start(sceneKey, data);
  }

  /**
   * Stops a Phaser scene by key.
   */
  stopScene(sceneKey: string): void {
    const game = this.options.getGame();
    if (!game) return;
    game.scene.stop(sceneKey);
  }

  /**
   * Lists all scene keys currently registered with Phaser.
   */
  listKnownSceneKeys(): string[] {
    const game = this.options.getGame();
    if (!game) return [];
    return game.scene.getScenes(false).map((s) => s.scene.key);
  }

  /**
   * Applies the repo's pausable-scene contract to every active Phaser scene.
   *
   * Scene lifecycle asks for pause propagation once; this adapter decides which
   * Phaser scenes actually implement `setPaused`.
   */
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

  /**
   * Captures and records the resume position for a scene that supports it.
   *
   * This keeps Phaser object access here while the resume policy remains the
   * single place that decides how snapshots are persisted/reset.
   */
  captureResume(sceneKey: string): ResumeSnapshot | null {
    const game = this.options.getGame();
    if (!game) return null;
    const scene = game.scene.getScene(sceneKey);
    if (!scene || !isResumeCaptureScene(scene)) return null;
    const position = scene.getResumeCapturePosition();
    return recordSceneExitResume(sceneKey, position);
  }

}
