import { PHASER_SCENE_KEYS } from '@/game/scenes/sceneIds';
import type { ResumeSnapshot } from '../sceneLifecycle/types';
import { forgetResumePosition, peekResumePosition, rememberResumePosition } from './sceneResumeStore';

const FRESH_START_SCENE_KEYS = new Set<string>([PHASER_SCENE_KEYS.potassium]);

/**
 * Persists a scene exit position unless the scene is intentionally fresh-start.
 * Adapters capture raw positions; this policy owns the persist-or-discard decision.
 */
export function recordSceneExitResume(
  sceneKey: string,
  position: ResumeSnapshot | null | undefined
): ResumeSnapshot | null {
  if (!position) return null;

  if (!FRESH_START_SCENE_KEYS.has(sceneKey)) {
    rememberResumePosition(sceneKey, position);
  }

  return position;
}

/** Applies per-scene reset rules before a scene starts. */
export function prepareSceneStart(sceneKey: string): void {
  if (FRESH_START_SCENE_KEYS.has(sceneKey)) {
    forgetResumePosition(sceneKey);
  }
}

/** Reads the resume position selected by policy for this scene start. */
export function getSceneStartResume(sceneKey: string): ResumeSnapshot | undefined {
  return peekResumePosition(sceneKey);
}

/**
 * Chooses where a scene's next start places the player, replacing its last
 * exit position. For one-way doors into a scene (the Out of Bounds breach into
 * the Basement, the hatch arrival on the street). Call it right before the
 * transition: the scene being left records its own exit afterwards, as usual.
 */
export function placeNextSceneStart(sceneKey: string, position: ResumeSnapshot): void {
  rememberResumePosition(sceneKey, position);
}
