/**
 * What the backpack shows: every street secret in a fixed order, found or not.
 * Pure, so the overlay and the corner button agree on what counts.
 */
import {
  CIRCUIT_PART_IDS,
  getOverworldProgress,
  type CircuitPartId,
  type GameItemId,
  type GameWorldState
} from '@/game/core/console';

export type BackpackSlotId = 'glasses' | 'litter-clue' | CircuitPartId | 'circuit';

export interface BackpackSlot {
  id: BackpackSlotId;
  found: boolean;
  /** Only the glasses can be taken off. */
  worn?: boolean;
  /** A part that already went into the Circuit. */
  soldered?: boolean;
}

export interface BackpackView {
  slots: readonly BackpackSlot[];
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
  const { found, total } = getOverworldProgress(source);
  return { slots, found, total };
}
