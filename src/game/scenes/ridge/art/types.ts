import type {
  RidgeActorId,
  RidgeActorPresence,
  RidgeAreaId,
  RidgeInteractable,
  RidgeMode,
  RidgeObservation
} from '@/game/core/ridge';
import { actorIdForSpeaker } from '../content/castRegistry';

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
  actors: readonly RidgeActorPresence[];
  crossingOpen: boolean;
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
    speakingActorId: observation.conversation
      ? actorIdForSpeaker(observation.conversation.speakerId)
      : null,
    actors: observation.actors,
    crossingOpen
  };
}
