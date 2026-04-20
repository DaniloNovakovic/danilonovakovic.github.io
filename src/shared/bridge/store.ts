import { useEffect, useState } from 'react';
import { GameState, type GameStateValue } from '../../game/gameState';
import type { MiniGameId } from '../../config/featureIds';
import { isOverlayPauseTriggerId } from '../../config/miniGameCategories';

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
  return isOverlayPauseTriggerId(next.activeMiniGameId);
}

function setState(updater: (current: BridgeState) => BridgeState): void {
  const previous = state;
  const next = updater(state);
  const candidate: BridgeState = {
    ...next,
    isPaused: computePause(next)
  };
  const unchanged =
    previous.status === candidate.status &&
    previous.activeMiniGameId === candidate.activeMiniGameId &&
    previous.isPaused === candidate.isPaused &&
    previous.touch.left === candidate.touch.left &&
    previous.touch.right === candidate.touch.right &&
    previous.touch.jumpQueued === candidate.touch.jumpQueued &&
    previous.touch.interactTap === candidate.touch.interactTap;
  if (unchanged) return;
  state = candidate;
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
  /** Set bridge back to the exploring state. Callers (App.tsx) are responsible for
   *  routing to a parent overlay via `requestInteraction` if one exists. */
  closeActiveOverlay(): void {
    setState((current) => ({
      ...current,
      status: GameState.EXPLORING,
      activeMiniGameId: null
    }));
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

export function useBridgeState(): BridgeState {
  const [snapshot, setSnapshot] = useState<BridgeState>(() => bridgeStore.getState());

  useEffect(() => {
    return bridgeStore.subscribe(() => {
      setSnapshot(bridgeStore.getState());
    });
  }, []);

  return snapshot;
}
