import { describe, expect, it } from 'vitest';
import {
  BASEMENT_REACT_OVERLAY_IDS,
  HOBBY_REACT_OVERLAY_IDS,
  MINI_GAME_IDS
} from '@game/registry/featureIds';
import { MiniGameType } from './miniGameKind';
import {
  getAllMiniGames,
  getMiniGameById,
  getOverlayParentId,
  getPhaserSceneMiniGameById,
  getReactOverlayMiniGameById,
  isPhaserSceneMiniGame,
  isReactOverlayMiniGame
} from './miniGameRegistry';

describe('miniGameRegistry runtime catalog', () => {
  it('resolves every React overlay id to a loadable overlay entry', () => {
    const overlayIds = getAllMiniGames()
      .filter((miniGame) => miniGame.type === MiniGameType.REACT_OVERLAY)
      .map((miniGame) => miniGame.id);

    for (const id of overlayIds) {
      const overlay = getReactOverlayMiniGameById(id);
      expect(overlay).toBeDefined();
      expect(overlay?.type).toBe(MiniGameType.REACT_OVERLAY);
      expect(typeof overlay?.component).toBe('function');
      expect(typeof overlay?.loadComponent).toBe('function');
      expect(isReactOverlayMiniGame(id)).toBe(true);
      expect(isPhaserSceneMiniGame(id)).toBe(false);
    }
  });

  it('does not resolve Phaser scene ids as React overlays', () => {
    const sceneIds = getAllMiniGames()
      .filter((miniGame) => miniGame.type === MiniGameType.PHASER_SCENE)
      .map((miniGame) => miniGame.id);

    for (const id of sceneIds) {
      expect(getReactOverlayMiniGameById(id)).toBeUndefined();
      expect(getPhaserSceneMiniGameById(id)).toEqual(getMiniGameById(id));
      expect(isReactOverlayMiniGame(id)).toBe(false);
      expect(isPhaserSceneMiniGame(id)).toBe(true);
    }
  });

  it('resolves overlay parent return ids', () => {
    expect(getOverlayParentId('games')).toBe('basement');

    for (const id of HOBBY_REACT_OVERLAY_IDS) {
      expect(getOverlayParentId(id)).toBe('hobbies');
    }

    for (const id of BASEMENT_REACT_OVERLAY_IDS) {
      expect(getOverlayParentId(id)).toBe('basement');
    }
  });

  it('returns no parent for top-level React overlays', () => {
    const interiorOverlayIds = new Set<string>([
      ...HOBBY_REACT_OVERLAY_IDS,
      ...BASEMENT_REACT_OVERLAY_IDS
    ]);
    const topLevelOverlayIds = MINI_GAME_IDS.filter((id) => {
      const miniGame = getReactOverlayMiniGameById(id);
      return miniGame && !interiorOverlayIds.has(id);
    });

    for (const id of topLevelOverlayIds) {
      expect(getOverlayParentId(id)).toBeNull();
    }
  });

  it('returns safe empty results for invalid or missing ids', () => {
    for (const id of [null, undefined, 'missing-feature']) {
      expect(getMiniGameById(id)).toBeUndefined();
      expect(getReactOverlayMiniGameById(id)).toBeUndefined();
      expect(getPhaserSceneMiniGameById(id)).toBeUndefined();
      expect(getOverlayParentId(id)).toBeNull();
      expect(isReactOverlayMiniGame(id)).toBe(false);
      expect(isPhaserSceneMiniGame(id)).toBe(false);
    }
  });
});
