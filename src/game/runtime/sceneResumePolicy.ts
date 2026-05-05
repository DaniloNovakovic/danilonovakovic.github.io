import { PHASER_SCENE_KEYS } from '@game/registry/featureIds';
import type { ResumeSnapshot } from '../kernel/types';
import {
  forgetResumePosition,
  peekResumePosition,
  rememberResumePosition
} from './sceneResumeStore';

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
