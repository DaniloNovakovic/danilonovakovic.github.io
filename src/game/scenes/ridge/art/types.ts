import type {
  RidgeActorId,
  RidgeActorPresence,
  RidgeAreaId,
  RidgeMode,
  RidgeObservation
} from '@/game/core/ridge';

/** The thing the player is currently close enough to act on. */
export interface RidgeVisualFocus {
  spotId: string;
  label: string;
  prompt: string;
  /** Stage position of the spot, used when no actor embodies it. */
  progress: number;
  actorId?: RidgeActorId;
}

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
  focus: RidgeVisualFocus | null;
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

  const nearest = observation.nearby[0];

  return {
    mode: observation.mode,
    areaId: observation.areaId,
    progress: observation.progress,
    facing: observation.facing,
    beat: observation.beat,
    ambience: observation.ambience,
    focus: nearest
      ? {
          spotId: nearest.spotId,
          label: nearest.label,
          prompt: nearest.prompt,
          progress: nearest.progress,
          actorId: nearest.actorId
        }
      : null,
    speakingActorId: observation.conversation
      ? actorIdForSpeaker(observation.conversation.speakerId)
      : null,
    actors: observation.actors,
    crossingOpen
  };
}

/**
 * Dialogue speaker ids are authored per area; actor ids are the cast on stage.
 * Narrator-style speakers deliberately map to nobody.
 */
export function actorIdForSpeaker(speakerId: string): RidgeActorId | null {
  switch (speakerId) {
    case 'cicka':
      return 'cicka';
    case 'counterpartCat':
      return 'counterpart-cat';
    case 'bridgeDraftsperson':
    case 'draftsperson':
      return 'draftsperson';
    case 'injuredGuitarist':
    case 'guitarist':
      return 'guitarist';
    case 'crowd':
      return 'crowd';
    case 'danceDriver':
    case 'driver':
      return 'driver';
    case 'operationsHelper':
      return 'operations-helper';
    case 'danceTeacher':
      return 'dance-teacher';
    case 'traveler':
      return 'traveler';
    case 'steward':
      return 'steward';
    default:
      return null;
  }
}
