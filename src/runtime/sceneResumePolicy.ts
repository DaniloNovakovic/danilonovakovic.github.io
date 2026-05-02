import { PHASER_SCENE_KEYS } from '../config/featureIds';
import type { ResumeSnapshot } from '../core/kernel/types';
import {
  forgetResumePosition,
  peekResumePosition,
  rememberResumePosition
} from './sceneResumeStore';

const FRESH_START_SCENE_KEYS = new Set<string>([PHASER_SCENE_KEYS.potassium]);

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

export function prepareSceneStart(sceneKey: string): void {
  if (FRESH_START_SCENE_KEYS.has(sceneKey)) {
    forgetResumePosition(sceneKey);
  }
}

export function getSceneStartResume(sceneKey: string): ResumeSnapshot | undefined {
  return peekResumePosition(sceneKey);
}
