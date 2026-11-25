/**
 * What the backpack shows: every street secret in a fixed order, found or not,
 * plus hidden slots that only appear once owned and never count toward the
 * tally (the Out of Bounds Debugging Tools). Pure, so the overlay and the
 * corner button agree on what counts.
 */
import {
  CIRCUIT_PART_IDS,
  DEBUGGING_TOOLS_ITEM_ID,
  getOverworldProgress,
  type CircuitPartId,
  type GameItemId,
  type GameWorldState
} from '@/game/core/console';

export type BackpackSlotId = 'glasses' | 'litter-clue' | CircuitPartId | 'circuit' | typeof DEBUGGING_TOOLS_ITEM_ID;

export interface BackpackSlot {
  id: BackpackSlotId;
  found: boolean;
  /** Only the glasses can be taken off. */
  worn?: boolean;
  /** A part that already went into the Circuit. */
  soldered?: boolean;
}

export interface BackpackView {
  /** The street secrets: always listed, counted by the tally. */
  slots: readonly BackpackSlot[];
  /** Owned off-the-books finds: listed only once owned, never counted. */
  hiddenSlots: readonly BackpackSlot[];
  found: number;
  total: number;
}

export type BackpackSource = Pick<GameWorldState, 'ownedItemIds' | 'equippedItemIds' | 'discoveredSecretIds'>;

export function getBackpackView(source: BackpackSource): BackpackView {
  const owns = (id: GameItemId) => source.ownedItemIds.includes(id);
  const hasCircuit = owns('circuit');
  const slots: BackpackSlot[] = [
    { id: 'glasses', found: owns('glasses'), worn: source.equippedItemIds.includes('glasses') },
    { id: 'litter-clue', found: source.discoveredSecretIds.includes('banana-peel-clue') },
    ...CIRCUIT_PART_IDS.map((id) => ({ id, found: owns(id), soldered: hasCircuit && owns(id) })),
    { id: 'circuit', found: hasCircuit }
  ];
  const hiddenSlots: BackpackSlot[] = owns(DEBUGGING_TOOLS_ITEM_ID)
    ? [{ id: DEBUGGING_TOOLS_ITEM_ID, found: true }]
    : [];
  const { found, total } = getOverworldProgress(source);
  return { slots, hiddenSlots, found, total };
}
