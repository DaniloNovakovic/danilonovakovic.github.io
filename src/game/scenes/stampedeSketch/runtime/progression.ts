import type { StampedeUpgradeId } from './upgrades';

export const STAMPEDE_SCRAP_PICKUP_RADIUS = 10;
export const STAMPEDE_SCRAP_COLLECTION_RADIUS = 34;
export const STAMPEDE_UPGRADE_SCRAP_GOAL = 3;

export interface StampedeClearedMarkPoint {
  id: string;
  x: number;
  y: number;
}

export interface StampedePickup {
  id: string;
  sourceId: string;
  x: number;
  y: number;
  radius: number;
  value: number;
}

export type StampedeUpgradeDraftStatus = 'none' | 'pending' | 'chosen';

export interface StampedeProgressionState {
  pickups: readonly StampedePickup[];
  scrapsCollected: number;
  scrapGoal: number;
  nextPickupIndex: number;
  upgradeDraftStatus: StampedeUpgradeDraftStatus;
  appliedUpgradeIds: readonly StampedeUpgradeId[];
}

export interface StampedePickupCollectionFrame {
  state: StampedeProgressionState;
  collected: readonly StampedePickup[];
}

export function createStampedeProgressionState(
  options: Partial<StampedeProgressionState> = {}
): StampedeProgressionState {
  return {
    pickups: options.pickups ?? [],
    scrapsCollected: options.scrapsCollected ?? 0,
    scrapGoal: options.scrapGoal ?? STAMPEDE_UPGRADE_SCRAP_GOAL,
    nextPickupIndex: options.nextPickupIndex ?? 1,
    upgradeDraftStatus: options.upgradeDraftStatus ?? 'none',
    appliedUpgradeIds: options.appliedUpgradeIds ?? []
  };
}

export function spawnStampedePickupsFromClearedMarks(
  state: StampedeProgressionState,
  marks: readonly StampedeClearedMarkPoint[]
): StampedeProgressionState {
  if (marks.length === 0) return state;

  let nextPickupIndex = state.nextPickupIndex;
  const spawned = marks.map((mark) => {
    const pickup: StampedePickup = {
      id: `scrap-${nextPickupIndex}`,
      sourceId: mark.id,
      x: mark.x,
      y: mark.y,
      radius: STAMPEDE_SCRAP_PICKUP_RADIUS,
      value: 1
    };
    nextPickupIndex += 1;
    return pickup;
  });

  return {
    ...state,
    pickups: [...state.pickups, ...spawned],
    nextPickupIndex
  };
}

export function collectStampedePickups(
  state: StampedeProgressionState,
  player: { x: number; y: number; radius?: number }
): StampedePickupCollectionFrame {
  const collected: StampedePickup[] = [];
  const kept: StampedePickup[] = [];

  state.pickups.forEach((pickup) => {
    const distance = Math.hypot(pickup.x - player.x, pickup.y - player.y);
    const collectionRadius = STAMPEDE_SCRAP_COLLECTION_RADIUS +
      (player.radius ?? 0) +
      pickup.radius;

    if (distance <= collectionRadius) {
      collected.push(pickup);
      return;
    }

    kept.push(pickup);
  });

  if (collected.length === 0) {
    return { state, collected };
  }

  const scrapsCollected = state.scrapsCollected +
    collected.reduce((total, pickup) => total + pickup.value, 0);
  const upgradeDraftStatus =
    state.upgradeDraftStatus === 'none' && scrapsCollected >= state.scrapGoal
      ? 'pending'
      : state.upgradeDraftStatus;

  return {
    state: {
      ...state,
      pickups: kept,
      scrapsCollected,
      upgradeDraftStatus
    },
    collected
  };
}

export function applyStampedeUpgradeChoice(
  state: StampedeProgressionState,
  upgradeId: StampedeUpgradeId
): StampedeProgressionState {
  const appliedUpgradeIds = state.appliedUpgradeIds.includes(upgradeId)
    ? state.appliedUpgradeIds
    : [...state.appliedUpgradeIds, upgradeId];

  return {
    ...state,
    upgradeDraftStatus: 'chosen',
    appliedUpgradeIds
  };
}
