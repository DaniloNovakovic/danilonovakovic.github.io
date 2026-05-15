import type { InteriorInteractionTarget } from '@/game/sharedSceneRuntime/interactions/InteriorInteractionRuntime';
import type { TrailCardOverlayParams } from '@/game/overlays/trailCard/types';
import {
  RIDGE_TRAIL_CARD_TARGETS,
  type RidgeTrailCardTargetId
} from '../worldLayout';
import {
  CICKA_INTERACTION_TARGET_ID,
  getCickaInteractionResponse,
  type CickaInteractionCopy,
  type CickaInteractionResponse
} from '../cicka/interaction';
import type { CickaPerch } from '../cicka/CickaPerch';
import type { RidgeBlockoutFacts } from '../blockout';
import type { RidgeWorldMemory } from '../worldMemory';
import { requireRidgeBlockoutFactAnchor } from './ridgePresentationFacts';

const TRAIL_CARD_PROMPT_OFFSET_Y = -86;

export type RidgeInteractionEffect =
  | { kind: 'close' }
  | { kind: 'openTrailCard'; params: TrailCardOverlayParams }
  | { kind: 'showCickaResponse'; response: CickaInteractionResponse };

export type RidgeInteractionTargetId =
  | RidgeTrailCardTargetId
  | typeof CICKA_INTERACTION_TARGET_ID;

export type RidgeInteractionTarget = InteriorInteractionTarget<
  RidgeInteractionTargetId,
  RidgeInteractionEffect
>;

export interface RidgeInteractionTargetOptions {
  facts: RidgeBlockoutFacts;
  cickaPerch?: CickaPerch;
  cickaInteractionCopy: CickaInteractionCopy;
  getWorldMemories: () => readonly RidgeWorldMemory[];
}

export function createRidgeInteractionTargets(
  options: RidgeInteractionTargetOptions
): RidgeInteractionTarget[] {
  const { facts, cickaPerch, cickaInteractionCopy, getWorldMemories } = options;
  return [
    ...(cickaPerch ? [{
      ...cickaPerch.interactionFacts,
      effect: (): RidgeInteractionEffect => ({
        kind: 'showCickaResponse',
        response: getCickaInteractionResponse(
          getWorldMemories(),
          cickaInteractionCopy
        )
      })
    }] : []),
    ...createTrailCardTargets(facts)
  ];
}

function createTrailCardTargets(
  facts: RidgeBlockoutFacts
): RidgeInteractionTarget[] {
  return RIDGE_TRAIL_CARD_TARGETS.map((target) => {
    const anchorPoint = requireRidgeBlockoutFactAnchor(
      facts,
      target.anchor,
      `${target.id} Trail Card`
    );
    return {
      id: target.id,
      kind: 'trail-card',
      x: anchorPoint.x,
      distanceAnchorY: anchorPoint.y,
      prompt: {
        x: anchorPoint.x,
        y: anchorPoint.y + TRAIL_CARD_PROMPT_OFFSET_Y
      },
      effect: {
        kind: 'openTrailCard',
        params: target.card
      }
    };
  });
}
