import type {
  RidgeDialogueChoice,
  RidgeDialogueLine,
  RidgeEmotion,
  RidgeInteractable,
  RidgeSpotDefinition
} from '../types';

export function makeCatalogLine(
  catalog: { speakers: Record<string, string>; lines: Record<string, string> },
  id: string,
  speakerId: string,
  emotion?: RidgeEmotion
): RidgeDialogueLine {
  return {
    id,
    speakerId,
    speaker: catalog.speakers[speakerId] ?? speakerId,
    text: catalog.lines[id] ?? id,
    ...(emotion ? { emotion } : {})
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
      conversationId: plan.conversationId,
      progress: spot.progress,
      actorId: spot.actorId
    });
  }
  return result;
}

/** One authored line: key suffix, speaker, and an optional mood. */
export type CatalogLineSpec<Speaker extends string = string> = readonly [
  suffix: string,
  speaker: Speaker,
  emotion?: RidgeEmotion
];

/**
 * Small authoring kit for a conversation family: lines live at
 * `<prefix>.<suffix>`, choice labels at `<prefix>.choice.<id>`, and a choice's
 * own lines at `<prefix>.<id>.<suffix>`.
 */
export function conversationKit<Speaker extends string>(
  prefix: string,
  catalog: { speakers: Record<Speaker, string>; lines: Record<string, string> }
) {
  const say = ([suffix, speaker, emotion]: CatalogLineSpec<Speaker>) =>
    makeCatalogLine(catalog, `${prefix}.${suffix}`, speaker, emotion);
  const choice = (
    id: string,
    lines: readonly CatalogLineSpec<Speaker>[],
    extra: Omit<RidgeDialogueChoice, 'id' | 'label' | 'lines'> = {}
  ): RidgeDialogueChoice => ({
    id,
    label: catalog.lines[`${prefix}.choice.${id}`] ?? id,
    ...(lines.length > 0 ? { lines: lines.map(([suffix, ...rest]) => say([`${id}.${suffix}`, ...rest])) } : {}),
    ...extra
  });
  return { say, choice };
}

/** Gap kept between the player and whoever they talk to, so bodies never stack. */
const TALK_GAP = 0.04;

/** While talking, stand beside your partner rather than inside them. */
export function standBeside(playerProgress: number, partnerProgress: number): number {
  if (Math.abs(playerProgress - partnerProgress) >= TALK_GAP) return playerProgress;
  return partnerProgress + (playerProgress >= partnerProgress ? TALK_GAP : -TALK_GAP);
}
