import { useCallback, useState } from 'react';
import { bridgeActions, bridgeStore, useBridgeState } from '@/game/bridge/store';
import type { InventoryItemId } from '@/game/bridge/store';

export type SparePartId = Extract<InventoryItemId, 'copper-string' | 'battery-cell' | 'clock-crystal'>;

/** `found` = awarded by this win; `replay` = won again while already owned. */
export type SparePartOutcome = 'found' | 'replay';

/**
 * Spare Circuit part reward for a hobby mini-game win.
 * `claim()` awards the part at most once (checked against the live bridge
 * store) and records the outcome for the reward sticker.
 */
export function useSparePartReward(partId: SparePartId) {
  const owned = useBridgeState().inventory.ownedItemIds.includes(partId);
  const [outcome, setOutcome] = useState<SparePartOutcome | null>(null);
  /** Bumps on every claim; use as the sticker `key` so each win replays the drop. */
  const [stickerKey, setStickerKey] = useState(0);

  const claim = useCallback((): SparePartOutcome => {
    const alreadyOwned = bridgeStore.getState().inventory.ownedItemIds.includes(partId);
    if (!alreadyOwned) bridgeActions.collectItem(partId);
    const next: SparePartOutcome = alreadyOwned ? 'replay' : 'found';
    setOutcome(next);
    setStickerKey((key) => key + 1);
    return next;
  }, [partId]);

  const dismiss = useCallback(() => setOutcome(null), []);

  return { owned, outcome, stickerKey, claim, dismiss };
}
