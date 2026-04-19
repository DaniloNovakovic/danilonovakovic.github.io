import type { Scene } from 'phaser';

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

/** Hobbies room forwards interact ids to React; expose callback updates without `any`. */
export interface InteractBridgeScene extends PausableScene {
  updateInteractCallback(callback: (id: string) => void): void;
}

export function isInteractBridgeScene(scene: Scene): scene is InteractBridgeScene {
  return (
    isPausableScene(scene) &&
    typeof (scene as InteractBridgeScene).updateInteractCallback === 'function'
  );
}
