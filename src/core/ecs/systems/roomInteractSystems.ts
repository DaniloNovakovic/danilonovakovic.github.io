export interface RoomInteractableSlot<Id extends string = string> {
  id: Id;
  x: number;
  distanceAnchorY: number;
}

export interface RoomInteractPickResult<Id extends string = string> {
  id: Id | null;
  x: number | null;
}

export function pickRoomInteractTarget<Id extends string>(
  playerX: number,
  playerY: number,
  slots: readonly RoomInteractableSlot<Id>[],
  interactRadius: number
): RoomInteractPickResult<Id> {
  for (const slot of slots) {
    const dx = playerX - slot.x;
    const dy = playerY - slot.distanceAnchorY;
    if (Math.hypot(dx, dy) < interactRadius) {
      return {
        id: slot.id,
        x: slot.x
      };
    }
  }

  return {
    id: null,
    x: null
  };
}
