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
} from '@game/runtime/gameState';
import type { MiniGameId } from '@game/registry/featureIds';

export interface TouchBridgeState {
  left: number;
  right: number;
  /** One-shot jump request set by React touch controls and cleared by scene input readers. */
  jumpQueued: boolean;
  /** One-shot interact request set by React touch controls and cleared by scene input readers. */
  interactTap: boolean;
}

export const INVENTORY_ITEM_IDS = ['glasses', 'circuit'] as const;
export type InventoryItemId = (typeof INVENTORY_ITEM_IDS)[number];

export const SECRET_DISCOVERY_IDS = ['banana-peel-clue'] as const;
export type SecretDiscoveryId = (typeof SECRET_DISCOVERY_IDS)[number];
export type UiDialogId = 'inventory' | 'devSwitcher';

export interface BridgeInventoryState {
  ownedItemIds: InventoryItemId[];
}

export interface BridgeEquipmentState {
  equippedItemIds: InventoryItemId[];
}

export interface BridgeProgressState {
  hasGlasses: boolean;
  discoveredSecretIds: SecretDiscoveryId[];
}

export interface BridgeState {
  /** Canonical runtime mode; legacy projections below are derived from this value. */
  mode: RuntimeMode;
  status: GameStateValue;
  activeMiniGameId: MiniGameId | null;
  loadingMiniGameId: MiniGameId | null;
  activeUiDialogId: UiDialogId | null;
  isPaused: boolean;
  inventory: BridgeInventoryState;
  equipment: BridgeEquipmentState;
  progress: BridgeProgressState;
  sceneHintText: string | null;
  touch: TouchBridgeState;
}

const listeners = new Set<() => void>();

function hasItemOwned(inventory: BridgeInventoryState, itemId: InventoryItemId): boolean {
  return inventory.ownedItemIds.includes(itemId);
}

function hasItemEquipped(equipment: BridgeEquipmentState, itemId: InventoryItemId): boolean {
  return equipment.equippedItemIds.includes(itemId);
}

function arraysEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

let state: BridgeState = {
  mode: EXPLORING_MODE,
  ...deriveGameState(EXPLORING_MODE),
  loadingMiniGameId: null,
  activeUiDialogId: null,
  isPaused: false,
  inventory: {
    ownedItemIds: []
  },
  equipment: {
    equippedItemIds: []
  },
  progress: {
    hasGlasses: false,
    discoveredSecretIds: []
  },
  sceneHintText: null,
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
    progress: {
      ...next.progress,
      hasGlasses: hasItemOwned(next.inventory, 'glasses')
    },
    isPaused: derivePause(next.mode) || next.loadingMiniGameId !== null || next.activeUiDialogId !== null
  };
  const unchanged =
    modesEqual(previous.mode, candidate.mode) &&
    previous.status === candidate.status &&
    previous.activeMiniGameId === candidate.activeMiniGameId &&
    previous.loadingMiniGameId === candidate.loadingMiniGameId &&
    previous.activeUiDialogId === candidate.activeUiDialogId &&
    previous.isPaused === candidate.isPaused &&
    arraysEqual(previous.inventory.ownedItemIds, candidate.inventory.ownedItemIds) &&
    arraysEqual(previous.equipment.equippedItemIds, candidate.equipment.equippedItemIds) &&
    previous.progress.hasGlasses === candidate.progress.hasGlasses &&
    arraysEqual(previous.progress.discoveredSecretIds, candidate.progress.discoveredSecretIds) &&
    previous.sceneHintText === candidate.sceneHintText &&
    previous.touch.left === candidate.touch.left &&
    previous.touch.right === candidate.touch.right &&
    previous.touch.jumpQueued === candidate.touch.jumpQueued &&
    previous.touch.interactTap === candidate.touch.interactTap;
  if (unchanged) return;
  state = candidate;
  emit();
}

/**
 * Observable state boundary shared by React overlays and Phaser runtime code.
 * Callers should mutate state through `bridgeActions` so derived pause/projection
 * fields and dirty checks stay centralized.
 */
export const bridgeStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getState(): BridgeState {
    return state;
  }
};

/**
 * Bridge mutations for cross-boundary gameplay state. Actions intentionally derive
 * `status`, `activeMiniGameId`, `isPaused`, and progress facts in one place instead
 * of letting React or Phaser callers maintain parallel state.
 */
export const bridgeActions = {
  /** Opens either a React overlay or Phaser scene based on the runtime catalog kind. */
  requestInteraction(area: MiniGameId): void {
    setState((current) => ({
      ...current,
      mode: createRuntimeModeForInteraction(area),
      loadingMiniGameId: null,
      activeUiDialogId: null,
      sceneHintText: null
    }));
  },
  /**
   * Closes the active runtime mode. Interior React overlays may resolve to a parent
   * Phaser scene; otherwise closing returns to overworld exploration.
   */
  closeActiveMode(resolveParentId?: (miniGameId: MiniGameId) => MiniGameId | null | undefined): void {
    setState((current) => ({
      ...current,
      mode: closeRuntimeMode(current.mode, resolveParentId),
      loadingMiniGameId: null,
      activeUiDialogId: null,
      sceneHintText: null
    }));
  },
  /** Backward-compatible alias for callers that always return to the overworld. */
  closeActiveOverlay(): void {
    bridgeActions.closeActiveMode();
  },
  collectItem(itemId: InventoryItemId, autoEquip: boolean = false): void {
    setState((current) => {
      const alreadyOwned = hasItemOwned(current.inventory, itemId);
      const alreadyEquipped = hasItemEquipped(current.equipment, itemId);
      return {
        ...current,
        inventory: alreadyOwned
          ? current.inventory
          : {
              ownedItemIds: [...current.inventory.ownedItemIds, itemId]
            },
        equipment: autoEquip && !alreadyEquipped
          ? {
              equippedItemIds: [...current.equipment.equippedItemIds, itemId]
            }
          : current.equipment
      };
    });
  },
  equipItem(itemId: InventoryItemId): void {
    setState((current) => {
      if (!hasItemOwned(current.inventory, itemId)) return current;
      if (hasItemEquipped(current.equipment, itemId)) return current;
      return {
        ...current,
        equipment: {
          equippedItemIds: [...current.equipment.equippedItemIds, itemId]
        }
      };
    });
  },
  unequipItem(itemId: InventoryItemId): void {
    setState((current) => {
      if (!hasItemEquipped(current.equipment, itemId)) return current;
      return {
        ...current,
        equipment: {
          equippedItemIds: current.equipment.equippedItemIds.filter((id) => id !== itemId)
        }
      };
    });
  },
  toggleItemEquipped(itemId: InventoryItemId): void {
    if (hasItemEquipped(bridgeStore.getState().equipment, itemId)) {
      bridgeActions.unequipItem(itemId);
    } else {
      bridgeActions.equipItem(itemId);
    }
  },
  collectGlasses(): void {
    bridgeActions.collectItem('glasses', true);
  },
  discoverSecret(secretId: SecretDiscoveryId): void {
    setState((current) => {
      if (current.progress.discoveredSecretIds.includes(secretId)) return current;
      return {
        ...current,
        progress: {
          ...current.progress,
          discoveredSecretIds: [...current.progress.discoveredSecretIds, secretId]
        }
      };
    });
  },
  resetProgress(): void {
    setState((current) => ({
      ...current,
      inventory: {
        ownedItemIds: []
      },
      equipment: {
        equippedItemIds: []
      },
      progress: {
        hasGlasses: false,
        discoveredSecretIds: []
      }
    }));
  },
  setSceneLoading(miniGameId: MiniGameId | null): void {
    setState((current) => ({
      ...current,
      loadingMiniGameId: miniGameId
    }));
  },
  openUiDialog(dialogId: UiDialogId): void {
    setState((current) => ({
      ...current,
      activeUiDialogId: dialogId
    }));
  },
  closeUiDialog(): void {
    setState((current) => ({
      ...current,
      activeUiDialogId: null
    }));
  },
  setSceneHintText(text: string | null): void {
    setState((current) => ({
      ...current,
      sceneHintText: text
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
  /** Queues a jump for the next scene input read; consumers must call `consumeTouchOneShots`. */
  queueJump(): void {
    setState((current) => ({
      ...current,
      touch: {
        ...current.touch,
        jumpQueued: true
      }
    }));
  },
  /** Queues an interact tap for the next scene input read; consumers must call `consumeTouchOneShots`. */
  tapInteract(): void {
    setState((current) => ({
      ...current,
      touch: {
        ...current.touch,
        interactTap: true
      }
    }));
  },
  /**
   * Reads and clears touch one-shots atomically from the caller's perspective.
   * Directional intensities are durable until `setTouchDirectional` or `resetTouch`.
   */
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

  useEffect(function subscribeToBridgeStore() {
    return bridgeStore.subscribe(() => {
      setSnapshot(bridgeStore.getState());
    });
  }, []);

  return snapshot;
}

export function isItemOwned(itemId: InventoryItemId): boolean {
  return hasItemOwned(bridgeStore.getState().inventory, itemId);
}

export function isItemEquipped(itemId: InventoryItemId): boolean {
  return hasItemEquipped(bridgeStore.getState().equipment, itemId);
}

export function isSecretDiscovered(secretId: SecretDiscoveryId): boolean {
  return bridgeStore.getState().progress.discoveredSecretIds.includes(secretId);
}

export function getTouchState(): TouchBridgeState {
  return bridgeStore.getState().touch;
}
