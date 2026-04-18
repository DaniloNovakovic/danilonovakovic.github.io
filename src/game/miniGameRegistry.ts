import { PORTFOLIO_SECTIONS } from '../config/portfolioRegistry';
import type { MiniGamePlugin, MiniGameTypeValue } from './types';

export const getAllMiniGames = (): MiniGamePlugin[] => {
  return PORTFOLIO_SECTIONS;
};

export const getMiniGameById = (id: string): MiniGamePlugin | undefined => {
  return PORTFOLIO_SECTIONS.find(game => game.id === id);
};

export const getMiniGamesByType = (type: MiniGameTypeValue): MiniGamePlugin[] => {
  return PORTFOLIO_SECTIONS.filter(game => game.type === type);
};
