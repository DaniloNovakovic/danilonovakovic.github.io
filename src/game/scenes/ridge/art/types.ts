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
import type { DuelActorStaging } from './duelStaging';

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
  /** Per-frame body nudges while a mini-game (Cicka's Standoff) moves people. */
  actorNudges?: DuelActorStaging | null;
  /** Set dressing the stage asks for (a lantern line tied off, the cat hiding). */
  sceneryMarks: readonly string[];
  /**
   * Set while the view shows a remembered scene instead of the current one
   * (the Relay ending's cuts); changes on every cut.
   */
  memoryShot: string | null;
}

export interface RidgeVisualProvider {
  /** Draw or sync the current world view. */
  sync(view: RidgeVisualViewModel): void;
  destroy(): void;
}

export function toRidgeVisualViewModel(
  observation: RidgeObservation
): RidgeVisualViewModel {
  const memory = observation.memory;
  if (memory) return toMemoryViewModel(observation, memory);
  const crossingOpen = isCrossingBeat(observation.beat);

  return {
    mode: observation.mode,
    areaId: observation.areaId,
    progress: observation.progress,
    facing: observation.facing,
    beat: observation.beat,
    ambience: observation.ambience,
    focus: observation.nearby[0] ?? null,
    speakingActorId: speakingActorIdFor(observation),
    partnerActorId: observation.conversation
      ? conversationPartnerId(observation)
      : observation.mode === 'cickaDuel'
        ? 'cicka'
        : null,
    speakingEmotion: observation.conversation?.emotion ?? null,
    lineKey: observation.conversation
      ? `${observation.conversation.id}:${observation.conversation.lineIndex}`
      : null,
    actors: observation.actors,
    crossingOpen,
    builtBridge: observation.builtBridge,
    sceneryMarks: observation.sceneryMarks,
    memoryShot: null
  };
}

function isCrossingBeat(beat: RidgeObservation['beat']): boolean {
  return beat === 'bridge_complete' || beat === 'concert_cleared' || beat === 'dance_cleared';
}

/**
 * A remembered scene, drawn in place of the current one: that area's set and
 * cast, framed on the shot's focus. Nobody speaks in it; the line is narration.
 */
function toMemoryViewModel(
  observation: RidgeObservation,
  memory: NonNullable<RidgeObservation['memory']>
): RidgeVisualViewModel {
  return {
    mode: observation.mode,
    areaId: memory.areaId,
    progress: memory.focus,
    facing: 'right',
    beat: memory.beat,
    ambience: observation.ambience,
    focus: null,
    speakingActorId: null,
    partnerActorId: null,
    speakingEmotion: null,
    lineKey: memory.shotKey,
    actors: memory.actors,
    crossingOpen: isCrossingBeat(memory.beat),
    builtBridge: observation.builtBridge,
    sceneryMarks: memory.sceneryMarks,
    memoryShot: memory.shotKey
  };
}
