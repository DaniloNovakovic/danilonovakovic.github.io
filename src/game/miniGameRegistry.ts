import {
  HOBBY_REACT_OVERLAY_IDS,
  isHobbyReactOverlayId,
  isMiniGameId,
  type MiniGameId
} from '../config/featureIds';
import { HOBBIES_ROOM_INTERACTABLES } from '../config/hobbiesRoomLayout';
import { PORTFOLIO_SECTIONS } from '../config/portfolioRegistry';
import { OVERWORLD_BUILDING_PLACEMENTS } from '../config/worldLayout';
import { MiniGameType } from './types';
import type { MiniGamePlugin, MiniGameTypeValue } from './types';

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
    if (!row.Component) {
      throw new Error(`Portfolio registry: hobby overlay "${id}" must define Component`);
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
    if (row.type === MiniGameType.PHASER_SCENE && !row.Scene) {
      throw new Error(`Portfolio registry: PHASER_SCENE "${row.id}" must define Scene`);
    }
    if (row.type === MiniGameType.REACT_OVERLAY && !isHobbyReactOverlayId(row.id) && row.x === undefined) {
      throw new Error(
        `Portfolio registry: REACT_OVERLAY "${row.id}" is not a hobby overlay but has no world x`
      );
    }
  }
}

assertPortfolioRegistryInvariants(PORTFOLIO_SECTIONS);

const MINI_GAME_BY_ID: ReadonlyMap<MiniGameId, MiniGamePlugin> = new Map(
  PORTFOLIO_SECTIONS.map((game) => [game.id, game])
);

export const getAllMiniGames = (): MiniGamePlugin[] => {
  return PORTFOLIO_SECTIONS;
};

export const getMiniGameById = (id: string | null | undefined): MiniGamePlugin | undefined => {
  if (id == null || !isMiniGameId(id)) return undefined;
  return MINI_GAME_BY_ID.get(id);
};

export const getMiniGamesByType = (type: MiniGameTypeValue): MiniGamePlugin[] => {
  return PORTFOLIO_SECTIONS.filter((game) => game.type === type);
};
