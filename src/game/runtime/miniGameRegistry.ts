import {
  BASEMENT_REACT_OVERLAY_IDS,
  HOBBY_REACT_OVERLAY_IDS,
  isBasementReactOverlayId,
  isHobbyReactOverlayId,
  isMiniGameId,
  type MiniGameId
} from '@/game/registry/featureIds';
import { PORTFOLIO_SECTIONS } from '@/game/registry/portfolioRegistry';
import { HOBBIES_ROOM_INTERACTABLES } from '@/game/scenes/hobbies';
import { OVERWORLD_BUILDING_PLACEMENTS } from '@/game/scenes/overworld';
import { MiniGameType } from './types';
import type {
  MiniGamePlugin,
  PhaserSceneMiniGamePlugin,
  ReactOverlayMiniGamePlugin
} from './types';

function assertPortfolioRegistryInvariants(sections: readonly MiniGamePlugin[]): void {
  const byId = new Map<MiniGameId, MiniGamePlugin>();
  for (const row of sections) {
    if (byId.has(row.id)) {
      throw new Error(`Portfolio registry: duplicate id "${row.id}"`);
    }
    byId.set(row.id, row);
  }

  for (const p of OVERWORLD_BUILDING_PLACEMENTS) {
    const row = byId.get(p.id);
    if (!row) {
      throw new Error(`Portfolio registry: overworld placement "${p.id}" has no plugin row`);
    }
    if (row.x !== p.x) {
      throw new Error(
        `Portfolio registry: x for "${p.id}" is ${row.x} but worldLayout expects ${p.x}`
      );
    }
  }

  for (const id of HOBBY_REACT_OVERLAY_IDS) {
    const row = byId.get(id);
    if (!row) {
      throw new Error(`Portfolio registry: HOBBY_REACT_OVERLAY_IDS includes "${id}" but no plugin`);
    }
    if (row.type !== MiniGameType.REACT_OVERLAY) {
      throw new Error(`Portfolio registry: hobby overlay "${id}" must be REACT_OVERLAY`);
    }
    if (row.overlayParentId !== 'hobbies') {
      throw new Error(
        `Portfolio registry: hobby overlay "${id}" must have overlayParentId "hobbies"`
      );
    }
    if (!row.loadComponent) {
      throw new Error(`Portfolio registry: hobby overlay "${id}" must define loadComponent`);
    }
  }

  for (const id of BASEMENT_REACT_OVERLAY_IDS) {
    const row = byId.get(id);
    if (!row) {
      throw new Error(`Portfolio registry: BASEMENT_REACT_OVERLAY_IDS includes "${id}" but no plugin`);
    }
    if (row.type !== MiniGameType.REACT_OVERLAY) {
      throw new Error(`Portfolio registry: basement overlay "${id}" must be REACT_OVERLAY`);
    }
    if (row.overlayParentId !== 'basement') {
      throw new Error(
        `Portfolio registry: basement overlay "${id}" must have overlayParentId "basement"`
      );
    }
    if (!row.loadComponent) {
      throw new Error(`Portfolio registry: basement overlay "${id}" must define loadComponent`);
    }
  }

  for (const item of HOBBIES_ROOM_INTERACTABLES) {
    if (item.id === 'exit') continue;
    const row = byId.get(item.id);
    if (!row) {
      throw new Error(
        `Portfolio registry: hobbies room interactable "${item.id}" has no plugin row`
      );
    }
  }

  for (const row of sections) {
    const isInteriorOverlay =
      isHobbyReactOverlayId(row.id) || isBasementReactOverlayId(row.id);
    if (row.type === MiniGameType.REACT_OVERLAY && !isInteriorOverlay && row.x === undefined) {
      throw new Error(
        `Portfolio registry: REACT_OVERLAY "${row.id}" is not an interior overlay but has no world x`
      );
    }
  }
}

assertPortfolioRegistryInvariants(PORTFOLIO_SECTIONS);

const MINI_GAME_BY_ID: ReadonlyMap<MiniGameId, MiniGamePlugin> = new Map(
  PORTFOLIO_SECTIONS.map((game) => [game.id, game])
);

/** Returns the composed runtime catalog; callers must treat entries as read-only facts. */
export const getAllMiniGames = (): MiniGamePlugin[] => {
  return PORTFOLIO_SECTIONS;
};

/** Looks up any catalog entry by id while safely ignoring null, undefined, and unknown ids. */
export const getMiniGameById = (id: string | null | undefined): MiniGamePlugin | undefined => {
  if (id == null || !isMiniGameId(id)) return undefined;
  return MINI_GAME_BY_ID.get(id);
};

/** Resolves only React overlay entries, including overlays that return to an interior parent scene. */
export function getReactOverlayMiniGameById(
  id: string | null | undefined
): ReactOverlayMiniGamePlugin | undefined {
  const miniGame = getMiniGameById(id);
  return miniGame?.type === MiniGameType.REACT_OVERLAY ? miniGame : undefined;
}

/** Resolves only Phaser scene entries. Use this instead of local id allow-lists. */
export function getPhaserSceneMiniGameById(
  id: string | null | undefined
): PhaserSceneMiniGamePlugin | undefined {
  const miniGame = getMiniGameById(id);
  return miniGame?.type === MiniGameType.PHASER_SCENE ? miniGame : undefined;
}

/** Returns the parent runtime id used when an interior React overlay closes. */
export function getOverlayParentId(id: string | null | undefined): MiniGameId | null {
  return getReactOverlayMiniGameById(id)?.overlayParentId ?? null;
}

export function isReactOverlayMiniGame(id: string | null | undefined): boolean {
  return getReactOverlayMiniGameById(id) !== undefined;
}

export function isPhaserSceneMiniGame(id: string | null | undefined): boolean {
  return getPhaserSceneMiniGameById(id) !== undefined;
}
