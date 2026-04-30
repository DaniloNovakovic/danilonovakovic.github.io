import { useEffect, useState } from 'react';
import {
  EXPLORING_MODE,
  closeRuntimeMode,
  createRuntimeModeForInteraction,
  deriveGameState,
  derivePause,
  modesEqual,
  type GameStateValue,
  type RuntimeMode
} from '../../runtime/gameState';
import type { MiniGameId } from '../../config/featureIds';

export interface TouchBridgeState {
  left: number;
  right: number;
  jumpQueued: boolean;
  interactTap: boolean;
}

export interface BridgeProgressState {
  hasGlasses: boolean;
}

export interface BridgeState {
  mode: RuntimeMode;
  status: GameStateValue;
  activeMiniGameId: MiniGameId | null;
  isPaused: boolean;
  progress: BridgeProgressState;
  touch: TouchBridgeState;
}

const listeners = new Set<() => void>();

let state: BridgeState = {
  mode: EXPLORING_MODE,
  ...deriveGameState(EXPLORING_MODE),
  isPaused: false,
  progress: {
    hasGlasses: false
  },
  touch: {
    left: 0,
    right: 0,
    jumpQueued: false,
    interactTap: false
  }
};

function emit(): void {
  listeners.forEach((listener) => listener());
}

function setState(updater: (current: BridgeState) => BridgeState): void {
  const previous = state;
  const next = updater(state);
  const derived = deriveGameState(next.mode);
  const candidate: BridgeState = {
    ...next,
    ...derived,
    isPaused: derivePause(next.mode)
  };
  const unchanged =
    modesEqual(previous.mode, candidate.mode) &&
    previous.status === candidate.status &&
    previous.activeMiniGameId === candidate.activeMiniGameId &&
    previous.isPaused === candidate.isPaused &&
    previous.progress.hasGlasses === candidate.progress.hasGlasses &&
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
      mode: createRuntimeModeForInteraction(area)
    }));
  },
  closeActiveMode(resolveParentId?: (miniGameId: MiniGameId) => MiniGameId | null | undefined): void {
    setState((current) => ({
      ...current,
      mode: closeRuntimeMode(current.mode, resolveParentId)
    }));
  },
  /** Backward-compatible alias for callers that always return to the overworld. */
  closeActiveOverlay(): void {
    bridgeActions.closeActiveMode();
  },
  collectGlasses(): void {
    setState((current) => ({
      ...current,
      progress: {
        ...current.progress,
        hasGlasses: true
      }
    }));
  },
  resetProgress(): void {
    setState((current) => ({
      ...current,
      progress: {
        hasGlasses: false
      }
    }));
  },
  setTouchDirectional(direction: 'left' | 'right', intensity: number): void {
    setState((current) => ({
      ...current,
      touch: {
        ...current.touch,
        [direction]: intensity
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
        left: 0,
        right: 0,
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
