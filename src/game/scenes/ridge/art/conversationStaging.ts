import type { RidgeActorId, RidgeObservation } from '@/game/core/ridge';
import { actorIdForSpeaker } from '../content/castRegistry';

/**
 * Which side of the frame the current speaker stands on, so the conversation
 * box can sit under them. `center` is for narrator voices with no body.
 */
export type RidgeSpeakerSide = 'left' | 'right' | 'center';

type StagingObservation = Pick<RidgeObservation, 'actors' | 'nearby' | 'conversation'>;

/**
 * The resident the player is talking with: the spot they walked up to, or the
 * nearest visible resident when the conversation is not anchored to one.
 */
export function conversationPartnerId(observation: StagingObservation): RidgeActorId | null {
  const focused = observation.nearby.find((item) => item.actorId && item.actorId !== 'player');
  if (focused?.actorId) return focused.actorId;

  const player = observation.actors.find((actor) => actor.id === 'player');
  if (!player) return null;

  let nearest: RidgeActorId | null = null;
  let nearestDistance = Infinity;
  for (const actor of observation.actors) {
    if (actor.id === 'player' || !actor.visible) continue;
    const distance = Math.abs(actor.progress - player.progress);
    if (distance < nearestDistance) {
      nearest = actor.id;
      nearestDistance = distance;
    }
  }
  return nearest;
}

/** Stage actor voicing the current line, or null for narration. */
export function speakingActorIdFor(observation: StagingObservation): RidgeActorId | null {
  return observation.conversation ? actorIdForSpeaker(observation.conversation.speakerId) : null;
}

/**
 * Compare the speaker with whoever they are talking to. Stage progress runs
 * left to right on screen, so the lower progress is the left-hand figure.
 */
export function speakerSideFor(observation: StagingObservation): RidgeSpeakerSide {
  const speakerId = speakingActorIdFor(observation);
  if (!speakerId) return 'center';

  const otherId = speakerId === 'player' ? conversationPartnerId(observation) : 'player';
  const speaker = observation.actors.find((actor) => actor.id === speakerId);
  const other = otherId ? observation.actors.find((actor) => actor.id === otherId) : undefined;

  // The player usually walks in from the left, so that is their default seat.
  if (!speaker || !other || speaker.progress === other.progress) {
    return speakerId === 'player' ? 'left' : 'right';
  }
  return speaker.progress < other.progress ? 'left' : 'right';
}
