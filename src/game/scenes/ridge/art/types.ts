import type {
  BridgeDesign,
  RidgeActorId,
  RidgeActorPresence,
  RidgeAreaId,
  RidgeEmotion,
  RidgeInteractable,
  RidgeMode,
  RidgeObservation
} from '@/game/core/ridge';
import { conversationPartnerId, speakingActorIdFor } from './conversationStaging';

/**
 * Replaceable art seam.
 * Stick math art today; iPad/Procreate sprites later without rewriting gameplay.
 */
export interface RidgeVisualViewModel {
  mode: RidgeMode;
  areaId: RidgeAreaId;
  progress: number;
  facing: RidgeObservation['facing'];
  beat: RidgeObservation['beat'];
  ambience: string;
  /** Nearest interactable from core; presentation anchors the pip to it. */
  focus: RidgeInteractable | null;
  /** Who is speaking right now, so the world can animate their mouth. */
  speakingActorId: RidgeActorId | null;
  /** Who the player is talking with, kept in frame while either speaks. */
  partnerActorId: RidgeActorId | null;
  /** Authored mood of the current line; drives faces and emote marks. */
  speakingEmotion: RidgeEmotion | null;
  /** Changes whenever a new line starts, so one-shot reactions can replay. */
  lineKey: string | null;
  actors: readonly RidgeActorPresence[];
  crossingOpen: boolean;
  /** The Bridge span the player drew, once proven. */
  builtBridge: BridgeDesign | null;
}

export interface RidgeVisualProvider {
  /** Draw or sync the current world view. */
  sync(view: RidgeVisualViewModel): void;
  destroy(): void;
}

export function toRidgeVisualViewModel(
  observation: RidgeObservation
): RidgeVisualViewModel {
  const crossingOpen =
    observation.beat === 'bridge_complete' ||
    observation.beat === 'concert_cleared' ||
    observation.beat === 'dance_cleared';

  return {
    mode: observation.mode,
    areaId: observation.areaId,
    progress: observation.progress,
    facing: observation.facing,
    beat: observation.beat,
    ambience: observation.ambience,
    focus: observation.nearby[0] ?? null,
    speakingActorId: speakingActorIdFor(observation),
    partnerActorId: observation.conversation ? conversationPartnerId(observation) : null,
    speakingEmotion: observation.conversation?.emotion ?? null,
    lineKey: observation.conversation
      ? `${observation.conversation.id}:${observation.conversation.lineIndex}`
      : null,
    actors: observation.actors,
    crossingOpen,
    builtBridge: observation.builtBridge
  };
}
