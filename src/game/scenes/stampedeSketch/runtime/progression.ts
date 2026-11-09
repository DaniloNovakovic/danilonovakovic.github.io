import type { StampedeFlockKind } from './flock';
import { clampStampedePosition } from './movement';
import {
  STAMPEDE_BONUS_HEART_CAP,
  STAMPEDE_CLUTCH_HEART_CHANCE
} from './session';
import {
  isStampedeModId,
  isStampedeWeaponId,
  type StampedeUpgradeId,
  type StampedeWeaponId
} from './upgrades';

const STAMPEDE_SCRAP_PICKUP_RADIUS = 10;
export const STAMPEDE_SCRAP_COLLECTION_RADIUS = 10;
const STAMPEDE_SCRAP_MAGNET_RADIUS = 104;
const STAMPEDE_SCRAP_FLY_SPEED = 520;
const STAMPEDE_DRAFT_GAP_MS = 14_000;
const STAMPEDE_UPGRADE_THRESHOLDS = [8, 20, 36, 56, 80, 108, 140] as const;

function nextStampedeScrapGoal(appliedCount: number): number {
  return STAMPEDE_UPGRADE_THRESHOLDS[appliedCount] ?? 0;
}

export interface StampedeClearedMarkPoint {
  id: string;
  x: number;
  y: number;
  value?: number;
  kind?: StampedeFlockKind;
}

export interface StampedePickup {
  id: string;
  sourceId: string;
  x: number;
  y: number;
  radius: number;
  value: number;
  kind?: 'scrap' | 'heart' | 'gift';
  /** Set once the pickup is flying to the player; it keeps flying from then on. */
  homing?: boolean;
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
  bonusHearts: number;
  draftsTaken: number;
  nextDraftAtMs: number;
}

export interface StampedePickupCollectionFrame {
  state: StampedeProgressionState;
  collected: readonly StampedePickup[];
  heartsCollected: number;
  giftsCollected: number;
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
    bonusHearts: options.bonusHearts ?? 0,
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
    return { state, collected, heartsCollected: 0, giftsCollected: 0 };
  }

  const heartsCollected = collected.filter((pickup) => pickup.kind === 'heart').length;
  const giftsCollected = collected.filter((pickup) => pickup.kind === 'gift').length;
  const scrapsCollected = state.scrapsCollected +
    collected.reduce((total, pickup) => (
      total + (pickup.kind === 'heart' || pickup.kind === 'gift' ? 0 : pickup.value)
    ), 0);
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
    collected,
    heartsCollected,
    giftsCollected
  };
}

/**
 * Scraps near the player (or every scrap, for a magnet gift) start flying in and
 * keep flying until collected. Hearts and gifts stay put so grabbing them is a choice.
 */
export function attractStampedePickups(
  state: StampedeProgressionState,
  player: { x: number; y: number; radius?: number },
  deltaMs: number,
  options: { pullAll?: boolean } = {}
): StampedeProgressionState {
  if (state.pickups.length === 0) return state;
  const step = STAMPEDE_SCRAP_FLY_SPEED * (deltaMs / 1000);
  const reach = STAMPEDE_SCRAP_MAGNET_RADIUS + (player.radius ?? 0);
  let moved = false;
  const pickups = state.pickups.map((pickup) => {
    if (pickup.kind === 'heart' || pickup.kind === 'gift') return pickup;
    const dx = player.x - pickup.x;
    const dy = player.y - pickup.y;
    const distance = Math.hypot(dx, dy);
    const homing = pickup.homing || options.pullAll || distance <= reach;
    if (!homing || distance < 0.5) return pickup;
    moved = true;
    const travel = Math.min(distance, step);
    return {
      ...pickup,
      homing: true,
      x: pickup.x + (dx / distance) * travel,
      y: pickup.y + (dy / distance) * travel
    };
  });
  return moved ? { ...state, pickups } : state;
}

export function spawnStampedeGiftPickup(
  state: StampedeProgressionState,
  at: { x: number; y: number }
): StampedeProgressionState {
  const point = clampStampedePosition(at);
  const pickup: StampedePickup = {
    id: `gift-${state.nextPickupIndex}`,
    sourceId: 'gift',
    x: point.x,
    y: point.y,
    radius: 14,
    value: 0,
    kind: 'gift'
  };
  return {
    ...state,
    pickups: [...state.pickups, pickup],
    nextPickupIndex: state.nextPickupIndex + 1
  };
}

export function offerClutchHeart(random: () => number = Math.random): boolean {
  return random() < STAMPEDE_CLUTCH_HEART_CHANCE;
}

export function spawnStampedeHeartPickup(
  state: StampedeProgressionState,
  player: { x: number; y: number },
  random: () => number = Math.random
): StampedeProgressionState {
  const angle = random() * Math.PI * 2;
  const point = clampStampedePosition({
    x: player.x + Math.cos(angle) * 170,
    y: player.y + Math.sin(angle) * 120
  });
  const pickup: StampedePickup = {
    id: `heart-${state.nextPickupIndex}`,
    sourceId: 'clutch',
    x: point.x,
    y: point.y,
    radius: 12,
    value: 0,
    kind: 'heart'
  };
  return {
    ...state,
    pickups: [...state.pickups, pickup],
    nextPickupIndex: state.nextPickupIndex + 1
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
  nowMs = 0,
  options: { free?: boolean } = {}
): StampedeProgressionState {
  if (options.free) {
    // A gifted twist leaves the scrap goal, draft count, and draft clock alone.
    const paid = applyStampedeUpgradeChoice(state, upgradeId, nowMs);
    return {
      ...paid,
      upgradeDraftStatus: state.upgradeDraftStatus,
      scrapGoal: state.scrapGoal,
      draftsTaken: state.draftsTaken,
      nextDraftAtMs: state.nextDraftAtMs
    };
  }

  if (upgradeId === 'spareFeather') {
    return finishStampedeDraft(state, nowMs, {
      bonusHearts: Math.min(STAMPEDE_BONUS_HEART_CAP, state.bonusHearts + 1)
    });
  }

  if (upgradeId === 'shell' || isStampedeModId(upgradeId)) {
    return finishStampedeDraft(state, nowMs, {
      appliedUpgradeIds: appendUpgradeId(state.appliedUpgradeIds, upgradeId)
    });
  }

  // Healing happens on the session. This card can come back.
  if (upgradeId === 'catchBreath') return finishStampedeDraft(state, nowMs);
  if (isStampedeWeaponId(upgradeId)) return applyStampedeWeaponChoice(state, upgradeId, nowMs);

  return finishStampedeDraft(state, nowMs, {
    appliedUpgradeIds: appendUpgradeId(state.appliedUpgradeIds, upgradeId)
  });
}

function applyStampedeWeaponChoice(
  state: StampedeProgressionState,
  upgradeId: StampedeWeaponId,
  nowMs: number
): StampedeProgressionState {
  if (state.upgradedWeaponIds.includes(upgradeId)) {
    return { ...state, upgradeDraftStatus: 'none' };
  }

  if (state.appliedUpgradeIds.includes(upgradeId)) {
    return finishStampedeDraft(state, nowMs, {
      upgradedWeaponIds: [...state.upgradedWeaponIds, upgradeId]
    });
  }

  return finishStampedeDraft(state, nowMs, {
    appliedUpgradeIds: [...state.appliedUpgradeIds, upgradeId]
  });
}

function appendUpgradeId(
  appliedUpgradeIds: readonly StampedeUpgradeId[],
  upgradeId: StampedeUpgradeId
): readonly StampedeUpgradeId[] {
  return appliedUpgradeIds.includes(upgradeId)
    ? appliedUpgradeIds
    : [...appliedUpgradeIds, upgradeId];
}

function finishStampedeDraft(
  state: StampedeProgressionState,
  nowMs: number,
  patch: Partial<Pick<StampedeProgressionState, 'appliedUpgradeIds' | 'upgradedWeaponIds' | 'bonusHearts'>> = {}
): StampedeProgressionState {
  const draftsTaken = state.draftsTaken + 1;
  return {
    ...state,
    ...patch,
    upgradeDraftStatus: 'none',
    scrapGoal: nextStampedeScrapGoal(draftsTaken),
    draftsTaken,
    nextDraftAtMs: nowMs + STAMPEDE_DRAFT_GAP_MS
  };
}
