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
