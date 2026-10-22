import type { GameItemId, GameSessionEvent, GameWorldState, NearbyThing } from './types';
import { returnToOverworld } from './basementLogic';
import { CIRCUIT_PART_HOBBY, CIRCUIT_PART_IDS } from './content/circuitParts';
import { HOBBIES_EXIT_SPOT_X, HOBBY_STATION_SPOTS, type HobbyStationId } from './content/hobbiesSpots';
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
  music: 'You nail the riff. A spare copper string pings loose — you pocket it.',
  fitness: 'Perfect combo. A battery cell rolls out from behind the bag.',
  dancing: 'Round five, on the beat. A clock crystal glints on the floor.'
};

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

export function moveHobbies(
  state: GameWorldState,
  direction: 'left' | 'right',
  steps: number
): string {
  const delta = steps * HOBBIES_STEP_PX * (direction === 'right' ? 1 : -1);
  const next = Math.max(60, Math.min(900, state.hobbies.playerX + delta));
  state.hobbies.playerX = next;
  state.hobbies.facing = direction;
  return `You wander the hobbies room to x=${Math.round(next)}.`;
}

export function interactHobbies(
  state: GameWorldState,
  target: string | undefined
): { message: string; events: GameSessionEvent[] } {
  const nearby = listHobbiesNearby(state);
  const miss = nearbyMissMessage(
    nearby,
    target,
    'Hobbies room — walk to a station or the street door on the left.'
  );
  if (miss) return { message: miss, events: [] };
  const picked = pickNearby(nearby, target);
  if (!picked) return { message: 'Nothing close enough in the hobbies room.', events: [] };

  if (picked.id === 'exit') {
    return returnToOverworld(state, 'You step back onto the street.');
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
