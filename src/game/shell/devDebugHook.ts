import type * as Phaser from 'phaser';
import { PHASER_SCENE_KEYS } from '@/game/scenes/sceneIds';

/**
 * Dev-only window hook for agents and Playwright: read the live scene and
 * player position, and move the player, instead of guessing from screenshots.
 * Installed by usePhaserGameBoot behind `import.meta.env.DEV`; never shipped.
 *
 *   await page.evaluate(() => window.__sketchbookDebug?.player())
 */
export const DEV_DEBUG_GLOBAL = '__sketchbookDebug';

/** Phaser keys back to the app's scene ids (the names `?startScene=` takes). */
const SCENE_ID_BY_PHASER_KEY = new Map<string, string>(
  Object.entries(PHASER_SCENE_KEYS).map(([sceneId, phaserKey]) => [phaserKey, sceneId])
);
const sceneName = (scene: Phaser.Scene) =>
  SCENE_ID_BY_PHASER_KEY.get(scene.scene.key) ?? scene.scene.key;

export interface DebugPoint {
  x: number;
  y: number;
}

export interface SketchbookDebugHook {
  /** Every running scene, bottom to top, as app scene ids (Phaser key if unmapped). */
  scenes(): string[];
  /** Topmost running scene that has a player, as an app scene id, or null. */
  scene(): string | null;
  /** Player position in the active scene, rounded to whole pixels. */
  player(): DebugPoint | null;
  /** Physics world bounds of the active scene. */
  worldBounds(): { x: number; y: number; width: number; height: number } | null;
  /** Move the player (keeps y when omitted). Returns false when there is no player. */
  teleport(x: number, y?: number): boolean;
}

interface DebugPlayerSprite {
  x: number;
  y: number;
  setPosition(x: number, y: number): unknown;
  body?: { reset?(x: number, y: number): unknown } | null;
}

type PlayerScene = Phaser.Scene & { player: DebugPlayerSprite };

function hasPlayer(scene: Phaser.Scene): scene is PlayerScene {
  const player = (scene as Partial<PlayerScene>).player;
  return typeof player?.x === 'number' && typeof player.setPosition === 'function';
}

export function createDevDebugHook(getGame: () => Phaser.Game | null): SketchbookDebugHook {
  const runningScenes = () => getGame()?.scene.getScenes(true) ?? [];
  const activePlayerScene = (): PlayerScene | null => {
    const withPlayer = runningScenes().filter(hasPlayer);
    return withPlayer[withPlayer.length - 1] ?? null;
  };

  return {
    scenes: () => runningScenes().map(sceneName),
    scene: () => {
      const scene = activePlayerScene();
      return scene ? sceneName(scene) : null;
    },
    player: () => {
      const player = activePlayerScene()?.player;
      return player ? { x: Math.round(player.x), y: Math.round(player.y) } : null;
    },
    worldBounds: () => {
      const bounds = activePlayerScene()?.physics?.world?.bounds;
      return bounds ? { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height } : null;
    },
    teleport: (x, y) => {
      const player = activePlayerScene()?.player;
      if (!player) return false;
      const nextY = y ?? player.y;
      // body.reset moves the physics body too and clears velocity.
      if (typeof player.body?.reset === 'function') player.body.reset(x, nextY);
      else player.setPosition(x, nextY);
      return true;
    }
  };
}

/** Installs the hook on `target` and returns the uninstall function. */
export function installDevDebugHook(
  target: Record<string, unknown>,
  getGame: () => Phaser.Game | null
): () => void {
  const hook = createDevDebugHook(getGame);
  target[DEV_DEBUG_GLOBAL] = hook;
  return () => {
    if (target[DEV_DEBUG_GLOBAL] === hook) delete target[DEV_DEBUG_GLOBAL];
  };
}
