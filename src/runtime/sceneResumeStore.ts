/**
 * Last player positions when leaving Phaser scenes, keyed by `scene.scene.key`
 * (e.g. `MainScene`, `hobbies`). Used so returning to a scene can restore where you left off.
 */
const lastExitBySceneKey = new Map<string, { x: number; y: number }>();

export type SceneResumePosition = { x: number; y: number };

export function rememberResumePosition(sceneKey: string, position: SceneResumePosition): void {
  lastExitBySceneKey.set(sceneKey, { x: position.x, y: position.y });
}

export function forgetResumePosition(sceneKey: string): void {
  lastExitBySceneKey.delete(sceneKey);
}

/** Read saved position without removing it (safe with React StrictMode double effects). */
export function peekResumePosition(sceneKey: string): SceneResumePosition | undefined {
  const p = lastExitBySceneKey.get(sceneKey);
  return p ? { x: p.x, y: p.y } : undefined;
}
