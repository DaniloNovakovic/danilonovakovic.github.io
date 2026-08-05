import type { RidgeActorId } from '@/game/core/ridge';

/**
 * Portrait chip shown in the conversation panel.
 * Narrator / dedication share `prompt`; several roles reuse a nearby face.
 */
export type RidgePortraitId =
  | 'player'
  | 'cicka'
  | 'draftsperson'
  | 'guitarist'
  | 'driver'
  | 'traveler'
  | 'teacher'
  | 'prompt';

interface CastSpeakerEntry {
  /** Stage actor that mouths the line; omit for narrator-style voices. */
  actorId: RidgeActorId | null;
  portrait: RidgePortraitId;
}

/**
 * Authored dialogue `speakerId` → stage actor + panel portrait.
 *
 * One table so mouth animation, camera framing, and the React panel cannot drift.
 */
const SPEAKER_CAST: Readonly<Record<string, CastSpeakerEntry>> = {
  player: { actorId: 'player', portrait: 'player' },
  cicka: { actorId: 'cicka', portrait: 'cicka' },
  counterpartCat: { actorId: 'counterpart-cat', portrait: 'cicka' },
  'counterpart-cat': { actorId: 'counterpart-cat', portrait: 'cicka' },
  bridgeDraftsperson: { actorId: 'draftsperson', portrait: 'draftsperson' },
  draftsperson: { actorId: 'draftsperson', portrait: 'draftsperson' },
  injuredGuitarist: { actorId: 'guitarist', portrait: 'guitarist' },
  guitarist: { actorId: 'guitarist', portrait: 'guitarist' },
  crowd: { actorId: 'crowd', portrait: 'player' },
  danceDriver: { actorId: 'driver', portrait: 'driver' },
  hillShuttleDriver: { actorId: 'driver', portrait: 'driver' },
  driver: { actorId: 'driver', portrait: 'driver' },
  operationsHelper: { actorId: 'operations-helper', portrait: 'driver' },
  danceTeacher: { actorId: 'dance-teacher', portrait: 'teacher' },
  traveler: { actorId: 'traveler', portrait: 'traveler' },
  steward: { actorId: 'steward', portrait: 'traveler' },
  festivalSteward: { actorId: 'steward', portrait: 'traveler' },
  prompt: { actorId: null, portrait: 'prompt' },
  dedication: { actorId: null, portrait: 'prompt' }
};

const DEFAULT_PORTRAIT: RidgePortraitId = 'player';

/** Actor on stage for a dialogue speaker, or null for narrator voices. */
export function actorIdForSpeaker(speakerId: string): RidgeActorId | null {
  return SPEAKER_CAST[speakerId]?.actorId ?? null;
}

/** Conversation-panel portrait for a dialogue speaker. */
export function portraitForSpeaker(speakerId: string): RidgePortraitId {
  return SPEAKER_CAST[speakerId]?.portrait ?? DEFAULT_PORTRAIT;
}
