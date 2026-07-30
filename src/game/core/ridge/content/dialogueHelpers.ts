import type { RidgeDialogueLine, RidgeInteractable, RidgeSpotDefinition } from '../types';

export function makeCatalogLine(
  catalog: { speakers: Record<string, string>; lines: Record<string, string> },
  id: string,
  speakerId: string
): RidgeDialogueLine {
  return {
    id,
    speakerId,
    speaker: catalog.speakers[speakerId] ?? speakerId,
    text: catalog.lines[id] ?? id
  };
}

export function collectNearbyFromPlans(
  stateProgress: number,
  spots: readonly RidgeSpotDefinition[],
  plans: readonly { spotId: string; conversationId: string; prompt: string }[],
  resolvePrompt: (promptKey: string) => string
): RidgeInteractable[] {
  const result: RidgeInteractable[] = [];
  for (const plan of plans) {
    const spot = spots.find((candidate) => candidate.id === plan.spotId);
    if (!spot) continue;
    const distance = Math.abs(stateProgress - spot.progress);
    if (distance > spot.interactRadius) continue;
    result.push({
      spotId: spot.id,
      label: spot.label,
      kind: spot.kind,
      distance,
      prompt: resolvePrompt(plan.prompt),
      conversationId: plan.conversationId
    });
  }
  return result;
}
