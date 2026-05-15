import {
  findRidgeBlockoutFactAnchor,
  type RidgeAnchorFact,
  type RidgeBlockoutAnchorSelector,
  type RidgeBlockoutFacts
} from '../blockout';

export function requireRidgeBlockoutFactAnchor(
  facts: RidgeBlockoutFacts,
  selector: RidgeBlockoutAnchorSelector,
  label: string
): RidgeAnchorFact {
  const point = findRidgeBlockoutFactAnchor(facts, selector);
  if (!point) {
    throw new Error(
      `Ridge blockout anchor for ${label} could not be resolved in room "${selector.roomId}"`
    );
  }
  return point;
}

export function getRidgeBlockoutRoomCenter(
  facts: Pick<RidgeBlockoutFacts, 'rooms'>,
  roomId: string
): { x: number; y: number } | undefined {
  const room = facts.rooms.find((candidate) => candidate.id === roomId);
  return room
    ? {
      x: room.bounds.x + room.bounds.width / 2,
      y: room.bounds.y + room.bounds.height / 2
    }
    : undefined;
}
