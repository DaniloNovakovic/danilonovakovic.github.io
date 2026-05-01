import type { Scene } from 'phaser';
import type { SceneResumePosition } from './sceneResumeStore';

/**
 * Scenes that support React-modal pause (keyboard release + movement stop).
 * Implemented by OverworldScene and HobbiesScene.
 */
export interface PausableScene extends Scene {
  setPaused(paused: boolean): void;
}

export function isPausableScene(scene: Scene): scene is PausableScene {
  return typeof (scene as PausableScene).setPaused === 'function';
}

/** Scenes that can report a player position when switching away (resume / restore). */
export interface ResumeCaptureScene extends Scene {
  getResumeCapturePosition(): SceneResumePosition | null;
}

export function isResumeCaptureScene(scene: Scene): scene is ResumeCaptureScene {
  return typeof (scene as ResumeCaptureScene).getResumeCapturePosition === 'function';
}
