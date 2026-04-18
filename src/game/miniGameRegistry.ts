import { MINI_GAMES } from '../config/hobbies';
import { type MiniGameTypeValue, type MiniGamePlugin } from './types';

export const getMiniGameById = (id: string | null): MiniGamePlugin | undefined => {
  if (!id) return undefined;
  return MINI_GAMES.find(game => game.id === id);
};

export const getAllMiniGames = (): MiniGamePlugin[] => {
  return MINI_GAMES;
};

export const getMiniGamesByType = (type: MiniGameTypeValue): MiniGamePlugin[] => {
  return MINI_GAMES.filter(game => game.type === type);
};
