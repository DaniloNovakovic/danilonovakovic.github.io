import type {
  RidgeActorPresence,
  RidgeMode,
  RidgeObservation
} from '@/game/core/ridge';

/**
 * Replaceable art seam.
 * Stick math art today; iPad/Procreate sprites later without rewriting gameplay.
 */
export interface RidgeVisualViewModel {
  mode: RidgeMode;
  progress: number;
  facing: RidgeObservation['facing'];
  beat: RidgeObservation['beat'];
  ambience: string;
  nearbyPrompt: string | null;
  actors: readonly RidgeActorPresence[];
  bridgeOpen: boolean;
}

export interface RidgeVisualProvider {
  /** Draw or sync the current world view. */
  sync(view: RidgeVisualViewModel): void;
  destroy(): void;
}

export function toRidgeVisualViewModel(
  observation: RidgeObservation
): RidgeVisualViewModel {
  return {
    mode: observation.mode,
    progress: observation.progress,
    facing: observation.facing,
    beat: observation.beat,
    ambience: observation.ambience,
    nearbyPrompt: observation.nearby[0]?.prompt ?? null,
    actors: observation.actors,
    bridgeOpen:
      observation.beat === 'bridge_complete' ||
      observation.beat === 'concert_handoff'
  };
}
