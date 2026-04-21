import type { MiniGameId } from '../config/featureIds';

export const GameState = {
  EXPLORING: 'EXPLORING',
  IN_MINIGAME: 'IN_MINIGAME',
  LOADING: 'LOADING'
} as const;

export type GameStateValue = (typeof GameState)[keyof typeof GameState];

export interface AppState {
  status: GameStateValue;
  activeMiniGameId: MiniGameId | null;
}
