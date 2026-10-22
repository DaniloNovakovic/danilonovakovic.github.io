/**
 * Second route to the Circuit: three spare parts won in the Hobbies room,
 * soldered together at the Basement workbench.
 */
export const CIRCUIT_PART_IDS = ['copper-string', 'clock-crystal', 'battery-cell'] as const;

export type CircuitPartId = (typeof CIRCUIT_PART_IDS)[number];

export type CircuitPartHobbyId = 'music' | 'dancing' | 'fitness';

export const CIRCUIT_PART_HOBBY: Record<CircuitPartId, CircuitPartHobbyId> = {
  'copper-string': 'music',
  'clock-crystal': 'dancing',
  'battery-cell': 'fitness'
};


export function countCircuitParts(ownedItemIds: readonly string[]): number {
  return CIRCUIT_PART_IDS.filter((id) => ownedItemIds.includes(id)).length;
}
