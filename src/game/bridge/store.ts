import { useEffect, useState } from 'react';
import { OVERWORLD_SCENE_ID, type SceneId } from '@/game/scenes/sceneIds';
import type { OverlayId } from '@/game/overlays/overlayIds';

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

export interface OverlayRequest {
  id: OverlayId;
  params?: unknown;
  returnToSceneId?: SceneId;
  closeOnEscape: boolean;
  closeOnBackdrop: boolean;
}

export interface OpenOverlayOptions {
  params?: unknown;
  returnToSceneId?: SceneId;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
}

export interface BridgeState {
  activeSceneId: SceneId;
  activeOverlay: OverlayRequest | null;
  activeOverlayId: OverlayId | null;
  loadingSceneId: SceneId | null;
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

function overlayRequestsEqual(
  a: OverlayRequest | null,
  b: OverlayRequest | null
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.params === b.params &&
    a.returnToSceneId === b.returnToSceneId &&
    a.closeOnEscape === b.closeOnEscape &&
    a.closeOnBackdrop === b.closeOnBackdrop
  );
}

let state: BridgeState = {
  activeSceneId: OVERWORLD_SCENE_ID,
  activeOverlay: null,
  activeOverlayId: null,
  loadingSceneId: null,
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
  const candidate: BridgeState = {
    ...next,
    activeOverlayId: next.activeOverlay?.id ?? null,
    progress: {
      ...next.progress,
      hasGlasses: hasItemOwned(next.inventory, 'glasses')
    },
    isPaused: next.activeOverlay !== null || next.loadingSceneId !== null
  };
  const unchanged =
    previous.activeSceneId === candidate.activeSceneId &&
    overlayRequestsEqual(previous.activeOverlay, candidate.activeOverlay) &&
    previous.activeOverlayId === candidate.activeOverlayId &&
    previous.loadingSceneId === candidate.loadingSceneId &&
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
 * scene, overlay, pause, and progress facts in one place instead of letting React
 * or Phaser callers maintain parallel state.
 */
export const bridgeActions = {
  enterScene(sceneId: SceneId): void {
    setState((current) => ({
      ...current,
      activeSceneId: sceneId,
      activeOverlay: null,
      loadingSceneId: null,
      sceneHintText: null
    }));
  },
  returnToOverworld(): void {
    bridgeActions.enterScene(OVERWORLD_SCENE_ID);
  },
  openOverlay(
    overlayId: OverlayId,
    options: OpenOverlayOptions = {}
  ): void {
    setState((current) => ({
      ...current,
      activeSceneId: options.returnToSceneId ?? current.activeSceneId,
      activeOverlay: {
        id: overlayId,
        params: options.params,
        returnToSceneId: options.returnToSceneId,
        closeOnEscape: options.closeOnEscape ?? true,
        closeOnBackdrop: options.closeOnBackdrop ?? true
      },
      sceneHintText: null
    }));
  },
  closeOverlay(): void {
    setState((current) => ({
      ...current,
      activeOverlay: null,
      sceneHintText: null
    }));
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
  setSceneLoading(sceneId: SceneId | null): void {
    setState((current) => ({
      ...current,
      loadingSceneId: sceneId
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
