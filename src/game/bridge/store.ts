import { useEffect, useState } from 'react';
import { OVERWORLD_SCENE_ID, type SceneId } from '@/game/scenes/sceneIds';
import type { OverlayId } from '@/game/overlays/overlayIds';
import type {
  SceneUiActionId,
  SceneUiActionRequest,
  SceneUiState,
  SceneUiSurfaceId,
  SceneUiSurfaceRequest
} from '@/game/sceneUi/types';

export interface TouchBridgeState {
  left: number;
  right: number;
  up: number;
  down: number;
  /** One-shot jump request set by React touch controls and cleared by scene input readers. */
  jumpQueued: boolean;
  /** One-shot interact request set by React touch controls and cleared by scene input readers. */
  interactTap: boolean;
}

export type SceneControlPointerEventKind = 'down' | 'move' | 'up' | 'cancel';

export interface SceneControlPointerEvent {
  ownerSceneId: SceneId;
  kind: SceneControlPointerEventKind;
  pointerId: number;
  x: number;
  y: number;
  sequence: number;
  timestamp: number;
}

export type InventoryItemId = 'glasses' | 'circuit';

export type SecretDiscoveryId = 'banana-peel-clue';

export interface BridgeInventoryState {
  ownedItemIds: InventoryItemId[];
}

export interface BridgeEquipmentState {
  equippedItemIds: InventoryItemId[];
}

export type RidgeStampId = string;
export type RidgeManualPageId = string;
export type RidgeShortcutId = string;
export type RidgeFirstPlayableAreaId = 'bridge' | 'concert' | 'danceFestival' | 'relay';
export type RidgeBridgeBeatState =
  | 'intro'
  | 'needs_toy_car'
  | 'toy_car_shared'
  | 'bridge_complete'
  | 'concert_handoff';
export type RidgeBridgeAreaBeatState = Exclude<RidgeBridgeBeatState, 'concert_handoff'>;
export type RidgePostBridgeAreaId = Exclude<RidgeFirstPlayableAreaId, 'bridge'>;

export type RidgeFirstPlayableRouteState =
  | {
      activeAreaId: 'bridge';
      bridgeBeat: RidgeBridgeAreaBeatState;
    }
  | {
      activeAreaId: RidgePostBridgeAreaId;
      bridgeBeat: 'concert_handoff';
    };

export interface BridgeRidgeProgressState {
  stampIds: RidgeStampId[];
  manualPageIds: RidgeManualPageId[];
  mobility: {
    glidePips: number;
  };
  shortcutIds: RidgeShortcutId[];
  firstPlayableRoute: RidgeFirstPlayableRouteState;
}

export interface BridgeProgressState {
  hasGlasses: boolean;
  discoveredSecretIds: SecretDiscoveryId[];
  ridge: BridgeRidgeProgressState;
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
  sceneUi: SceneUiState;
  inventory: BridgeInventoryState;
  equipment: BridgeEquipmentState;
  progress: BridgeProgressState;
  sceneHintText: string | null;
  touch: TouchBridgeState;
  sceneControlPointerEvents: SceneControlPointerEvent[];
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

function createInitialRidgeProgress(): BridgeRidgeProgressState {
  return {
    stampIds: [],
    manualPageIds: [],
    mobility: {
      glidePips: 0
    },
    shortcutIds: [],
    firstPlayableRoute: createInitialRidgeFirstPlayableRoute()
  };
}

function createInitialRidgeFirstPlayableRoute(): RidgeFirstPlayableRouteState {
  return {
    activeAreaId: 'bridge',
    bridgeBeat: 'intro'
  };
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

function sceneUiSurfacesEqual(
  a: SceneUiSurfaceRequest | null,
  b: SceneUiSurfaceRequest | null
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.ownerSceneId === b.ownerSceneId &&
    a.id === b.id &&
    a.params === b.params
  );
}

function sceneUiActionsEqual(
  a: SceneUiActionRequest | null,
  b: SceneUiActionRequest | null
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.ownerSceneId === b.ownerSceneId &&
    a.action === b.action &&
    a.params === b.params &&
    a.sequence === b.sequence
  );
}

function sceneControlPointerEventsEqual(
  a: readonly SceneControlPointerEvent[],
  b: readonly SceneControlPointerEvent[]
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const left = a[i];
    const right = b[i];
    if (
      left.ownerSceneId !== right.ownerSceneId ||
      left.kind !== right.kind ||
      left.pointerId !== right.pointerId ||
      left.x !== right.x ||
      left.y !== right.y ||
      left.sequence !== right.sequence ||
      left.timestamp !== right.timestamp
    ) {
      return false;
    }
  }
  return true;
}

function clearSceneUiState(): SceneUiState {
  return {
    status: null,
    panel: null,
    lastAction: null
  };
}

let state: BridgeState = {
  activeSceneId: OVERWORLD_SCENE_ID,
  activeOverlay: null,
  activeOverlayId: null,
  loadingSceneId: null,
  isPaused: false,
  sceneUi: clearSceneUiState(),
  inventory: {
    ownedItemIds: []
  },
  equipment: {
    equippedItemIds: []
  },
  progress: {
    hasGlasses: false,
    discoveredSecretIds: [],
    ridge: createInitialRidgeProgress()
  },
  sceneHintText: null,
  touch: {
    left: 0,
    right: 0,
    up: 0,
    down: 0,
    jumpQueued: false,
    interactTap: false
  },
  sceneControlPointerEvents: []
};
let nextSceneUiActionSequence = 1;
let nextSceneControlPointerSequence = 1;

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
    sceneUiSurfacesEqual(previous.sceneUi.status, candidate.sceneUi.status) &&
    sceneUiSurfacesEqual(previous.sceneUi.panel, candidate.sceneUi.panel) &&
    sceneUiActionsEqual(previous.sceneUi.lastAction, candidate.sceneUi.lastAction) &&
    arraysEqual(previous.inventory.ownedItemIds, candidate.inventory.ownedItemIds) &&
    arraysEqual(previous.equipment.equippedItemIds, candidate.equipment.equippedItemIds) &&
    previous.progress.hasGlasses === candidate.progress.hasGlasses &&
    arraysEqual(previous.progress.discoveredSecretIds, candidate.progress.discoveredSecretIds) &&
    arraysEqual(previous.progress.ridge.stampIds, candidate.progress.ridge.stampIds) &&
    arraysEqual(previous.progress.ridge.manualPageIds, candidate.progress.ridge.manualPageIds) &&
    previous.progress.ridge.mobility.glidePips === candidate.progress.ridge.mobility.glidePips &&
    arraysEqual(previous.progress.ridge.shortcutIds, candidate.progress.ridge.shortcutIds) &&
    previous.progress.ridge.firstPlayableRoute.activeAreaId ===
      candidate.progress.ridge.firstPlayableRoute.activeAreaId &&
    previous.progress.ridge.firstPlayableRoute.bridgeBeat ===
      candidate.progress.ridge.firstPlayableRoute.bridgeBeat &&
    previous.sceneHintText === candidate.sceneHintText &&
    previous.touch.left === candidate.touch.left &&
    previous.touch.right === candidate.touch.right &&
    previous.touch.up === candidate.touch.up &&
    previous.touch.down === candidate.touch.down &&
    previous.touch.jumpQueued === candidate.touch.jumpQueued &&
    previous.touch.interactTap === candidate.touch.interactTap &&
    sceneControlPointerEventsEqual(
      previous.sceneControlPointerEvents,
      candidate.sceneControlPointerEvents
    );
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
      sceneUi: clearSceneUiState(),
      sceneHintText: null,
      sceneControlPointerEvents: []
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
  awardRidgeStamp(stampId: RidgeStampId): void {
    setState((current) => {
      if (current.progress.ridge.stampIds.includes(stampId)) return current;
      return {
        ...current,
        progress: {
          ...current.progress,
          ridge: {
            ...current.progress.ridge,
            stampIds: [...current.progress.ridge.stampIds, stampId]
          }
        }
      };
    });
  },
  awardRidgeManualPage(manualPageId: RidgeManualPageId): void {
    setState((current) => {
      if (current.progress.ridge.manualPageIds.includes(manualPageId)) return current;
      return {
        ...current,
        progress: {
          ...current.progress,
          ridge: {
            ...current.progress.ridge,
            manualPageIds: [...current.progress.ridge.manualPageIds, manualPageId]
          }
        }
      };
    });
  },
  awardRidgeGlidePip(count: number = 1): void {
    const wholeCount = Math.trunc(count);
    if (!Number.isFinite(wholeCount) || wholeCount <= 0) return;
    setState((current) => ({
      ...current,
      progress: {
        ...current.progress,
        ridge: {
          ...current.progress.ridge,
          mobility: {
            glidePips: current.progress.ridge.mobility.glidePips + wholeCount
          }
        }
      }
    }));
  },
  unlockRidgeShortcut(shortcutId: RidgeShortcutId): void {
    setState((current) => {
      if (current.progress.ridge.shortcutIds.includes(shortcutId)) return current;
      return {
        ...current,
        progress: {
          ...current.progress,
          ridge: {
            ...current.progress.ridge,
            shortcutIds: [...current.progress.ridge.shortcutIds, shortcutId]
          }
        }
      };
    });
  },
  setRidgeBridgeBeat(bridgeBeat: RidgeBridgeAreaBeatState): void {
    setState((current) => ({
      ...current,
      progress: {
        ...current.progress,
        ridge: {
          ...current.progress.ridge,
          firstPlayableRoute: {
            ...current.progress.ridge.firstPlayableRoute,
            activeAreaId: 'bridge',
            bridgeBeat
          }
        }
      }
    }));
  },
  triggerRidgeConcertHandoff(): void {
    setState((current) => ({
      ...current,
      progress: {
        ...current.progress,
        ridge: {
          ...current.progress.ridge,
          firstPlayableRoute: {
            activeAreaId: 'concert',
            bridgeBeat: 'concert_handoff'
          }
        }
      }
    }));
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
        discoveredSecretIds: [],
        ridge: createInitialRidgeProgress()
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
  setSceneUiStatus(
    ownerSceneId: SceneId,
    id: SceneUiSurfaceId,
    params?: unknown
  ): void {
    setState((current) => ({
      ...current,
      sceneUi: {
        ...current.sceneUi,
        status: {
          ownerSceneId,
          id,
          params
        }
      }
    }));
  },
  clearSceneUiStatus(ownerSceneId?: SceneId): void {
    setState((current) => {
      if (
        ownerSceneId &&
        current.sceneUi.status?.ownerSceneId !== ownerSceneId
      ) {
        return current;
      }
      return {
        ...current,
        sceneUi: {
          ...current.sceneUi,
          status: null
        }
      };
    });
  },
  setSceneUiPanel(
    ownerSceneId: SceneId,
    id: SceneUiSurfaceId,
    params?: unknown
  ): void {
    setState((current) => ({
      ...current,
      sceneUi: {
        ...current.sceneUi,
        panel: {
          ownerSceneId,
          id,
          params
        }
      }
    }));
  },
  clearSceneUiPanel(ownerSceneId?: SceneId): void {
    setState((current) => {
      if (
        ownerSceneId &&
        current.sceneUi.panel?.ownerSceneId !== ownerSceneId
      ) {
        return current;
      }
      return {
        ...current,
        sceneUi: {
          ...current.sceneUi,
          panel: null
        }
      };
    });
  },
  clearSceneUi(ownerSceneId?: SceneId): void {
    setState((current) => {
      if (!ownerSceneId) {
        return {
          ...current,
          sceneUi: clearSceneUiState()
        };
      }

      const keepStatus = current.sceneUi.status?.ownerSceneId !== ownerSceneId;
      const keepPanel = current.sceneUi.panel?.ownerSceneId !== ownerSceneId;
      const keepAction = current.sceneUi.lastAction?.ownerSceneId !== ownerSceneId;

      if (keepStatus && keepPanel && keepAction) return current;

      return {
        ...current,
        sceneUi: {
          status: keepStatus ? current.sceneUi.status : null,
          panel: keepPanel ? current.sceneUi.panel : null,
          lastAction: keepAction ? current.sceneUi.lastAction : null
        }
      };
    });
  },
  dispatchSceneUiAction(ownerSceneId: SceneId, action: SceneUiActionId, params?: unknown): void {
    const sequence = nextSceneUiActionSequence++;
    setState((current) => ({
      ...current,
      sceneUi: {
        ...current.sceneUi,
        lastAction: {
          ownerSceneId,
          action,
          params,
          sequence
        }
      }
    }));
  },
  dispatchSceneControlPointerEvent(
    ownerSceneId: SceneId,
    event: Omit<SceneControlPointerEvent, 'ownerSceneId' | 'sequence'>
  ): void {
    const sequence = nextSceneControlPointerSequence++;
    setState((current) => {
      if (current.activeSceneId !== ownerSceneId) return current;
      return {
        ...current,
        sceneControlPointerEvents: [
          ...current.sceneControlPointerEvents,
          {
            ...event,
            ownerSceneId,
            sequence
          }
        ]
      };
    });
  },
  consumeSceneControlPointerEvents(ownerSceneId: SceneId): SceneControlPointerEvent[] {
    const current = bridgeStore.getState();
    const events = current.sceneControlPointerEvents.filter((event) => event.ownerSceneId === ownerSceneId);
    if (!events.length) return [];

    setState((next) => ({
      ...next,
      sceneControlPointerEvents: next.sceneControlPointerEvents.filter((event) => event.ownerSceneId !== ownerSceneId)
    }));
    return events;
  },
  clearSceneControlPointerEvents(ownerSceneId?: SceneId): void {
    setState((current) => {
      if (!ownerSceneId) {
        if (!current.sceneControlPointerEvents.length) return current;
        return {
          ...current,
          sceneControlPointerEvents: []
        };
      }
      const nextEvents = current.sceneControlPointerEvents.filter((event) => event.ownerSceneId !== ownerSceneId);
      if (nextEvents.length === current.sceneControlPointerEvents.length) return current;
      return {
        ...current,
        sceneControlPointerEvents: nextEvents
      };
    });
  },
  consumeSceneUiAction(ownerSceneId: SceneId): SceneUiActionRequest | null {
    const current = bridgeStore.getState();
    const action = current.sceneUi.lastAction;
    if (!action || action.ownerSceneId !== ownerSceneId) return null;

    setState((next) => ({
      ...next,
      sceneUi: {
        ...next.sceneUi,
        lastAction: null
      }
    }));
    return action;
  },
  setTouchDirectional(direction: 'left' | 'right' | 'up' | 'down', intensity: number): void {
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
        up: 0,
        down: 0,
        jumpQueued: false,
        interactTap: false
      },
      sceneControlPointerEvents: []
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

export function hasRidgeStamp(stampId: RidgeStampId): boolean {
  return bridgeStore.getState().progress.ridge.stampIds.includes(stampId);
}

export function hasRidgeManualPage(manualPageId: RidgeManualPageId): boolean {
  return bridgeStore.getState().progress.ridge.manualPageIds.includes(manualPageId);
}

export function isRidgeShortcutUnlocked(shortcutId: RidgeShortcutId): boolean {
  return bridgeStore.getState().progress.ridge.shortcutIds.includes(shortcutId);
}

export function getTouchState(): TouchBridgeState {
  return bridgeStore.getState().touch;
}
