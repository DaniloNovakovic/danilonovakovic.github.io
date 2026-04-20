import { useSyncExternalStore } from 'react';
import { getMiniGameById } from '../../game/miniGameRegistry';
import { GameState, type GameStateValue } from '../../game/gameState';
import { MiniGameType } from '../../game/types';
import type { MiniGameId } from '../../config/featureIds';

export interface TouchBridgeState {
  left: boolean;
  right: boolean;
  jumpQueued: boolean;
  interactTap: boolean;
}

export interface BridgeState {
  status: GameStateValue;
  activeMiniGameId: MiniGameId | null;
  isPaused: boolean;
  touch: TouchBridgeState;
}

const listeners = new Set<() => void>();

let state: BridgeState = {
  status: GameState.EXPLORING,
  activeMiniGameId: null,
  isPaused: false,
  touch: {
    left: false,
    right: false,
    jumpQueued: false,
    interactTap: false
  }
};

function emit(): void {
  listeners.forEach((listener) => listener());
}

function computePause(next: Pick<BridgeState, 'status' | 'activeMiniGameId'>): boolean {
  if (next.status !== GameState.IN_MINIGAME || !next.activeMiniGameId) return false;
  const activeMiniGame = getMiniGameById(next.activeMiniGameId);
  return activeMiniGame?.type === MiniGameType.REACT_OVERLAY;
}

function setState(updater: (current: BridgeState) => BridgeState): void {
  const next = updater(state);
  state = {
    ...next,
    isPaused: computePause(next)
  };
  emit();
}

export const bridgeStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getState(): BridgeState {
    return state;
  }
};

export const bridgeActions = {
  requestInteraction(area: MiniGameId): void {
    setState((current) => ({
      ...current,
      status: GameState.IN_MINIGAME,
      activeMiniGameId: area
    }));
  },
  closeActiveOverlay(): void {
    setState((current) => {
      const currentId = current.activeMiniGameId;
      if (!currentId) {
        return { ...current, status: GameState.EXPLORING, activeMiniGameId: null };
      }
      const active = getMiniGameById(currentId);
      if (active?.overlayParentId) {
        return {
          ...current,
          status: GameState.IN_MINIGAME,
          activeMiniGameId: active.overlayParentId
        };
      }
      return {
        ...current,
        status: GameState.EXPLORING,
        activeMiniGameId: null
      };
    });
  },
  setTouchDirectional(direction: 'left' | 'right', pressed: boolean): void {
    setState((current) => ({
      ...current,
      touch: {
        ...current.touch,
        [direction]: pressed
      }
    }));
  },
  queueJump(): void {
    setState((current) => ({
      ...current,
      touch: {
        ...current.touch,
        jumpQueued: true
      }
    }));
  },
  tapInteract(): void {
    setState((current) => ({
      ...current,
      touch: {
        ...current.touch,
        interactTap: true
      }
    }));
  },
  consumeTouchOneShots(): { jumpQueued: boolean; interactTap: boolean } {
    const current = bridgeStore.getState();
    const oneShots = {
      jumpQueued: current.touch.jumpQueued,
      interactTap: current.touch.interactTap
    };
    if (!oneShots.jumpQueued && !oneShots.interactTap) return oneShots;
    setState((next) => ({
      ...next,
      touch: {
        ...next.touch,
        jumpQueued: false,
        interactTap: false
      }
    }));
    return oneShots;
  },
  resetTouch(): void {
    setState((current) => ({
      ...current,
      touch: {
        left: false,
        right: false,
        jumpQueued: false,
        interactTap: false
      }
    }));
  }
};

export function useBridgeSelector<T>(selector: (state: BridgeState) => T): T {
  return useSyncExternalStore(
    bridgeStore.subscribe,
    () => selector(bridgeStore.getState()),
    () => selector(bridgeStore.getState())
  );
}
