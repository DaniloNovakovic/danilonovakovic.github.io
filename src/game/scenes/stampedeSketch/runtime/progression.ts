import {
  isStampedeModId,
  isStampedeWeaponId,
  type StampedeUpgradeId,
  type StampedeWeaponId
} from './upgrades';

const STAMPEDE_SCRAP_PICKUP_RADIUS = 10;
export const STAMPEDE_SCRAP_COLLECTION_RADIUS = 34;
export const STAMPEDE_DRAFT_GAP_MS = 14_000;
const STAMPEDE_UPGRADE_THRESHOLDS = [16, 40, 72, 112, 160, 216, 280] as const;

export function nextStampedeScrapGoal(appliedCount: number): number {
  return STAMPEDE_UPGRADE_THRESHOLDS[appliedCount] ?? 0;
}

export interface StampedeClearedMarkPoint {
  id: string;
  x: number;
  y: number;
  value?: number;
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
  upgradedWeaponIds: readonly StampedeWeaponId[];
  draftsTaken: number;
  nextDraftAtMs: number;
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
    scrapGoal: options.scrapGoal ?? nextStampedeScrapGoal(options.draftsTaken ?? 0),
    nextPickupIndex: options.nextPickupIndex ?? 1,
    upgradeDraftStatus: options.upgradeDraftStatus ?? 'none',
    appliedUpgradeIds: options.appliedUpgradeIds ?? [],
    upgradedWeaponIds: options.upgradedWeaponIds ?? [],
    draftsTaken: options.draftsTaken ?? 0,
    nextDraftAtMs: options.nextDraftAtMs ?? STAMPEDE_DRAFT_GAP_MS
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
      value: mark.value ?? 1
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
  player: { x: number; y: number; radius?: number },
  options: { elapsedMs?: number } = {}
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
  const clockReady = options.elapsedMs === undefined || options.elapsedMs >= state.nextDraftAtMs;
  const upgradeDraftStatus =
    state.upgradeDraftStatus === 'none' &&
    state.scrapGoal > 0 &&
    scrapsCollected >= state.scrapGoal &&
    clockReady
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

export function openStampedeDraftIfReady(
  state: StampedeProgressionState,
  elapsedMs: number
): StampedeProgressionState {
  if (state.upgradeDraftStatus !== 'none' || state.scrapGoal <= 0) return state;
  if (state.scrapsCollected < state.scrapGoal || elapsedMs < state.nextDraftAtMs) return state;
  return {
    ...state,
    upgradeDraftStatus: 'pending'
  };
}

export function grantStampedeStartingWeapon(
  state: StampedeProgressionState,
  weaponId: StampedeWeaponId
): StampedeProgressionState {
  if (
    state.appliedUpgradeIds.includes(weaponId) ||
    state.upgradedWeaponIds.includes(weaponId)
  ) {
    return state;
  }

  return {
    ...state,
    appliedUpgradeIds: [...state.appliedUpgradeIds, weaponId],
    upgradeDraftStatus: 'none',
    scrapGoal: nextStampedeScrapGoal(state.draftsTaken)
  };
}

export function applyStampedeUpgradeChoice(
  state: StampedeProgressionState,
  upgradeId: StampedeUpgradeId,
  nowMs = 0
): StampedeProgressionState {
  let appliedUpgradeIds = state.appliedUpgradeIds;
  let upgradedWeaponIds = state.upgradedWeaponIds;

  if (isStampedeModId(upgradeId)) {
    if (!appliedUpgradeIds.includes(upgradeId)) {
      appliedUpgradeIds = [...appliedUpgradeIds, upgradeId];
    }
  } else if (isStampedeWeaponId(upgradeId)) {
    const rank = state.upgradedWeaponIds.includes(upgradeId)
      ? 2
      : state.appliedUpgradeIds.includes(upgradeId)
        ? 1
        : 0;
    if (rank >= 2) {
      return { ...state, upgradeDraftStatus: 'none' };
    }
    if (rank === 0) {
      appliedUpgradeIds = [...appliedUpgradeIds, upgradeId];
    } else {
      upgradedWeaponIds = [...upgradedWeaponIds, upgradeId];
    }
  } else if (!appliedUpgradeIds.includes(upgradeId)) {
    appliedUpgradeIds = [...appliedUpgradeIds, upgradeId];
  }

  const draftsTaken = state.draftsTaken + 1;
  return {
    ...state,
    upgradeDraftStatus: 'none',
    scrapGoal: nextStampedeScrapGoal(draftsTaken),
    appliedUpgradeIds,
    upgradedWeaponIds,
    draftsTaken,
    nextDraftAtMs: nowMs + STAMPEDE_DRAFT_GAP_MS
  };
}
