import type { MiniGameId } from '../config/featureIds';
import { isPhaserSceneMiniGameId } from '../config/miniGameCategories';

export const GameState = {
  EXPLORING: 'EXPLORING',
  IN_MINIGAME: 'IN_MINIGAME'
} as const;

export type GameStateValue = (typeof GameState)[keyof typeof GameState];

export type RuntimeMode =
  | { kind: 'exploring' }
  | { kind: 'reactOverlay'; miniGameId: MiniGameId }
  | { kind: 'phaserScene'; miniGameId: MiniGameId };

export interface AppState {
  status: GameStateValue;
  activeMiniGameId: MiniGameId | null;
}

export const EXPLORING_MODE: RuntimeMode = { kind: 'exploring' };

export function createRuntimeModeForInteraction(miniGameId: MiniGameId): RuntimeMode {
  return isPhaserSceneMiniGameId(miniGameId)
    ? { kind: 'phaserScene', miniGameId }
    : { kind: 'reactOverlay', miniGameId };
}

export function deriveGameState(mode: RuntimeMode): AppState {
  if (mode.kind === 'exploring') {
    return {
      status: GameState.EXPLORING,
      activeMiniGameId: null
    };
  }

  return {
    status: GameState.IN_MINIGAME,
    activeMiniGameId: mode.miniGameId
  };
}

export function derivePause(mode: RuntimeMode): boolean {
  return mode.kind === 'reactOverlay';
}

export function closeRuntimeMode(
  mode: RuntimeMode,
  resolveParentId?: (miniGameId: MiniGameId) => MiniGameId | null | undefined
): RuntimeMode {
  if (mode.kind !== 'reactOverlay') return EXPLORING_MODE;

  const parentId = resolveParentId?.(mode.miniGameId);
  return parentId ? createRuntimeModeForInteraction(parentId) : EXPLORING_MODE;
}

export function modesEqual(a: RuntimeMode, b: RuntimeMode): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'exploring' || b.kind === 'exploring') return true;
  return a.miniGameId === b.miniGameId;
}
