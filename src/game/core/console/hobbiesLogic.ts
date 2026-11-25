import type { GameItemId, GameSessionEvent, GameWorldState, HobbiesObservation, NearbyThing } from './types';
import { returnToOverworld } from './basementLogic';
import { CIRCUIT_PART_HOBBY, CIRCUIT_PART_IDS } from './content/circuitParts';
import {
  HOBBIES_EXIT_SPOT_X,
  HOBBIES_PLAYER_MAX_X,
  HOBBIES_PLAYER_MIN_X,
  HOBBY_STATION_SPOTS,
  type HobbyStationId
} from './content/hobbiesSpots';
import {
  OUT_OF_BOUNDS_PEDESTAL_X,
  OUT_OF_BOUNDS_STAGE_TEXT,
  outOfBoundsDepth,
  outOfBoundsSightsNear,
  outOfBoundsStageAt,
  outOfBoundsThoughtsReached
} from './content/outOfBoundsVoid';
import { nearbyMissMessage, pickNearby } from './nearby';
import { getHobbyOverlay } from './overlayCatalog';

const HOBBIES_STEP_PX = 40;
const HOBBIES_REACH_PX = 70;

const STATION_PROMPTS: Record<HobbyStationId, string> = {
  art: 'Doodle at the easel',
  music: 'Pick up the guitar',
  fitness: 'Train on the heavy bag',
  dancing: 'Step onto the dance floor'
};

/** What clearing each mini-game goal means in the browser build. */
const PERFORM_MESSAGES: Record<HobbyStationId, string> = {
  art: 'You sign the doodle and pin it up. Somewhere on the street, a billboard changes.',
  music: 'You strum the song. A spare copper string pings loose — you pocket it.',
  fitness: 'Perfect combo. A battery cell rolls out from behind the bag.',
  dancing: 'Round five, on the beat. A clock crystal glints on the floor.'
};

export function observeHobbies(state: GameWorldState): HobbiesObservation {
  const { playerX } = state.hobbies;
  const stage = outOfBoundsStageAt(playerX);
  return {
    ...state.hobbies,
    void: stage
      ? {
          stage,
          depth: Math.round(outOfBoundsDepth(playerX)),
          description: OUT_OF_BOUNDS_STAGE_TEXT[stage],
          sights: outOfBoundsSightsNear(playerX)
        }
      : null
  };
}

export function listHobbiesNearby(state: GameWorldState): NearbyThing[] {
  const x = state.hobbies.playerX;
  const things: NearbyThing[] = [];
  const exitDistance = Math.abs(x - HOBBIES_EXIT_SPOT_X);
  if (exitDistance <= 90) {
    things.push({
      id: 'exit',
      label: 'Street door',
      distance: exitDistance,
      prompt: 'Return to street',
      kind: 'exit'
    });
  }
  const pedestalDistance = Math.abs(x - OUT_OF_BOUNDS_PEDESTAL_X);
  if (pedestalDistance <= HOBBIES_REACH_PX) {
    things.push({
      id: 'pedestal',
      label: 'Sketchbook-spine pedestal',
      distance: pedestalDistance,
      prompt: 'Look at the pedestal',
      kind: 'prop'
    });
  }
  for (const station of HOBBY_STATION_SPOTS) {
    const distance = Math.abs(x - station.x);
    if (distance > HOBBIES_REACH_PX) continue;
    things.push({
      id: station.id,
      label: station.label,
      distance,
      prompt: STATION_PROMPTS[station.id],
      kind: 'prop'
    });
  }
  return things.sort((a, b) => a.distance - b.distance);
}

export function moveHobbies(state: GameWorldState, direction: 'left' | 'right', steps: number): string {
  const from = state.hobbies.playerX;
  const delta = steps * HOBBIES_STEP_PX * (direction === 'right' ? 1 : -1);
  const next = Math.max(HOBBIES_PLAYER_MIN_X, Math.min(HOBBIES_PLAYER_MAX_X, from + delta));
  state.hobbies.playerX = next;
  state.hobbies.facing = direction;
  const depth = outOfBoundsDepth(next);
  const thoughts = outOfBoundsThoughtsReached(state.hobbies.voidFurthestDepth, depth);
  state.hobbies.voidFurthestDepth = Math.max(state.hobbies.voidFurthestDepth, depth);
  // The left wall is drawn solid but has no collision: you just walk through it.
  const wentOut = outOfBoundsDepth(from) <= 0 && depth > 0;
  const where = wentOut
    ? 'You walk straight through the wall, out of the room'
    : depth > 0
      ? 'You walk across blank paper'
      : 'You wander the hobbies room';
  const said = thoughts.map((line) => ` Danilo: "${line}"`).join('');
  return `${where} to x=${Math.round(next)}.${said}`;
}

export function interactHobbies(
  state: GameWorldState,
  target: string | undefined
): { message: string; events: GameSessionEvent[] } {
  const nearby = listHobbiesNearby(state);
  const miss = nearbyMissMessage(nearby, target, 'Hobbies room — walk to a station or the street door on the left.');
  if (miss) return { message: miss, events: [] };
  const picked = pickNearby(nearby, target);
  if (!picked) return { message: 'Nothing close enough in the hobbies room.', events: [] };

  if (picked.id === 'exit') {
    return returnToOverworld(state, 'You step back onto the street.');
  }
  if (picked.id === 'pedestal') {
    return {
      message:
        'A closed sketchbook stood on its end, spine out, faintly glowing. The top is empty: a dashed outline where something should sit.',
      events: []
    };
  }

  const stationId = picked.id as HobbyStationId;
  state.mode = 'overlay';
  state.overlay = getHobbyOverlay(stationId);
  return {
    message: `${picked.label}: ${state.overlay.blurb}`,
    events: [{ type: 'overlay_opened', overlayId: stationId }]
  };
}

/** Headless stand-in for clearing the open hobby mini-game's goal. */
export function performHobby(state: GameWorldState): { message: string; events: GameSessionEvent[] } | null {
  const stationId = HOBBY_STATION_SPOTS.find((spot) => spot.id === state.overlay?.id)?.id;
  if (!stationId) return null;

  const part = CIRCUIT_PART_IDS.find((id) => CIRCUIT_PART_HOBBY[id] === stationId);
  if (!part) return { message: PERFORM_MESSAGES[stationId], events: [] };
  if (state.ownedItemIds.includes(part)) {
    return { message: 'You already won this part. Play on for fun.', events: [] };
  }
  const itemId: GameItemId = part;
  state.ownedItemIds = [...state.ownedItemIds, itemId];
  return {
    message: PERFORM_MESSAGES[stationId],
    events: [{ type: 'item_collected', itemId }]
  };
}
