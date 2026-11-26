import type {
  GameItemId,
  GameSessionEvent,
  GameWorldState,
  HobbiesObservation,
  NearbyThing,
  OutOfBoundsEscapeObservation
} from './types';
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
  DEBUGGING_TOOLS_ITEM_ID,
  DEBUGGING_TOOLS_PICKUP_THOUGHT,
  isSimulationBroken,
  OUT_OF_BOUNDS_ALERT_THOUGHT,
  OUT_OF_BOUNDS_BARRIER_THOUGHT,
  OUT_OF_BOUNDS_BARRIER_X,
  OUT_OF_BOUNDS_ESCAPE_MAX_X,
  OUT_OF_BOUNDS_ESCAPE_MIN_X,
  OUT_OF_BOUNDS_ESCAPE_START_X,
  OUT_OF_BOUNDS_ESCAPE_TEXT,
  OUT_OF_BOUNDS_OPENING_X,
  OUT_OF_BOUNDS_TOOLBOX_TEXT,
  OUT_OF_BOUNDS_TOOLBOX_X,
  OUT_OF_BOUNDS_STAGE_TEXT,
  outOfBoundsDepth,
  outOfBoundsSightsNear,
  outOfBoundsStageAt,
  outOfBoundsThoughtsReached
} from './content/outOfBoundsVoid';
import {
  BASEMENT_BREACH_ARRIVAL_THOUGHT,
  BASEMENT_BREACH_ENTRY,
  OUT_OF_BOUNDS_BREAKOUT_TEXT,
  reachesOutOfBoundsOpening
} from './content/outOfBoundsBreakout';
import { nearbyMissMessage, pickNearby } from './nearby';
import { getHobbyOverlay } from './overlayCatalog';

const HOBBIES_STEP_PX = 40;
const HOBBIES_REACH_PX = 70;
/** The player stops beside the toolbox at the void's end, a little further off than a station. */
const TOOLBOX_REACH_PX = 110;

const STATION_PROMPTS: Record<HobbyStationId, string> = {
  art: 'Doodle at the easel',
  music: 'Pick up the guitar',
  fitness: 'Train on the heavy bag',
  dancing: 'Step onto the dance floor'
};

/** What clearing each mini-game goal means in the browser build. */
const ESCAPE_OBSERVATION: OutOfBoundsEscapeObservation = {
  wayBack: 'blocked',
  barrierX: OUT_OF_BOUNDS_BARRIER_X,
  openingX: OUT_OF_BOUNDS_OPENING_X,
  description: `${OUT_OF_BOUNDS_ESCAPE_TEXT.barrier} ${OUT_OF_BOUNDS_ESCAPE_TEXT.opening}`
};

type HobbiesOutcome = { message: string; events: GameSessionEvent[] };

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
      : null,
    escape: isSimulationBroken(state.ownedItemIds) ? ESCAPE_OBSERVATION : null
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
  const toolboxDistance = Math.abs(x - OUT_OF_BOUNDS_TOOLBOX_X);
  if (toolboxDistance <= TOOLBOX_REACH_PX) {
    things.push({
      id: 'toolbox',
      label: state.ownedItemIds.includes(DEBUGGING_TOOLS_ITEM_ID) ? 'Where the toolbox lay' : 'Toolbox',
      distance: toolboxDistance,
      prompt: state.ownedItemIds.includes(DEBUGGING_TOOLS_ITEM_ID)
        ? 'Look at the bare floor'
        : 'Pick up the Debugging Tools',
      kind: state.ownedItemIds.includes(DEBUGGING_TOOLS_ITEM_ID) ? 'prop' : 'pickup'
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

export function moveHobbies(state: GameWorldState, direction: 'left' | 'right', steps: number): HobbiesOutcome {
  const from = state.hobbies.playerX;
  const delta = steps * HOBBIES_STEP_PX * (direction === 'right' ? 1 : -1);
  const escaped = isSimulationBroken(state.ownedItemIds);
  const [minX, maxX] = escaped
    ? [OUT_OF_BOUNDS_ESCAPE_MIN_X, OUT_OF_BOUNDS_ESCAPE_MAX_X]
    : [HOBBIES_PLAYER_MIN_X, HOBBIES_PLAYER_MAX_X];
  const next = Math.max(minX, Math.min(maxX, from + delta));
  state.hobbies.playerX = next;
  state.hobbies.facing = direction;
  // Walking away from the toolbox answers the warning with "leave it".
  state.hobbies.pointOfNoReturnPending = false;
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
  const hitBarrier = escaped && direction === 'right' && next >= maxX && from + delta > maxX;
  if (hitBarrier && !state.hobbies.barrierThoughtShown) {
    state.hobbies.barrierThoughtShown = true;
    thoughts.push(OUT_OF_BOUNDS_BARRIER_THOUGHT);
  }
  const said = thoughts.map((line) => ` Danilo: "${line}"`).join('');
  const blocked = hitBarrier ? ` ${OUT_OF_BOUNDS_ESCAPE_TEXT.barrier}` : '';
  const walked = `${where} to x=${Math.round(next)}.${blocked}${said}`;
  if (escaped && direction === 'left' && reachesOutOfBoundsOpening(next)) {
    return breakIntoBasement(state, walked);
  }
  return { message: walked, events: [] };
}

/**
 * Out of Bounds, Act 3 (#162): the torn opening leads through the right wall
 * of the real Basement. A later Hobbies visit starts back inside the barrier.
 */
function breakIntoBasement(state: GameWorldState, walked: string): HobbiesOutcome {
  state.hobbies.playerX = OUT_OF_BOUNDS_ESCAPE_START_X;
  state.mode = 'basement';
  state.sceneId = 'basement';
  state.basement.playerX = BASEMENT_BREACH_ENTRY.x;
  state.basement.facing = 'left';
  state.basement.breachThoughtShown = false;
  return {
    message: [
      walked,
      OUT_OF_BOUNDS_BREAKOUT_TEXT.throughOpening,
      OUT_OF_BOUNDS_BREAKOUT_TEXT.ransacked,
      `Danilo: "${BASEMENT_BREACH_ARRIVAL_THOUGHT}"`
    ].join(' '),
    events: [{ type: 'scene_entered', sceneId: 'basement' }]
  };
}

export function interactHobbies(state: GameWorldState, target: string | undefined): HobbiesOutcome {
  const nearby = listHobbiesNearby(state);
  const miss = nearbyMissMessage(nearby, target, 'Hobbies room — walk to a station or the street door on the left.');
  if (miss) return { message: miss, events: [] };
  const picked = pickNearby(nearby, target);
  if (!picked) return { message: 'Nothing close enough in the hobbies room.', events: [] };

  if (picked.id === 'exit') {
    return returnToOverworld(state, 'You step back onto the street.');
  }
  if (picked.id === 'toolbox') return interactToolbox(state);

  const stationId = picked.id as HobbyStationId;
  state.mode = 'overlay';
  state.overlay = getHobbyOverlay(stationId);
  return {
    message: `${picked.label}: ${state.overlay.blurb}`,
    events: [{ type: 'overlay_opened', overlayId: stationId }]
  };
}

/**
 * Out of Bounds, Act 2: the toolbox first asks "point of no return?". Only
 * `confirm` takes it; after that the floor is bare.
 */
function interactToolbox(state: GameWorldState): HobbiesOutcome {
  if (state.ownedItemIds.includes(DEBUGGING_TOOLS_ITEM_ID)) {
    return { message: OUT_OF_BOUNDS_TOOLBOX_TEXT.empty, events: [] };
  }
  state.hobbies.pointOfNoReturnPending = true;
  return {
    message: `${OUT_OF_BOUNDS_TOOLBOX_TEXT.withKit} ${OUT_OF_BOUNDS_ESCAPE_TEXT.warning}`,
    events: [{ type: 'point_of_no_return_shown' }]
  };
}

/**
 * Answer the point-of-no-return warning. Confirming takes the Debugging Tools
 * and breaks the simulation: the alert goes off and the way back is shut.
 * Null when no warning is up.
 */
export function answerPointOfNoReturn(state: GameWorldState, confirmed: boolean): HobbiesOutcome | null {
  if (!state.hobbies.pointOfNoReturnPending) return null;
  state.hobbies.pointOfNoReturnPending = false;
  if (!confirmed) return { message: OUT_OF_BOUNDS_ESCAPE_TEXT.declined, events: [] };
  const itemId: GameItemId = DEBUGGING_TOOLS_ITEM_ID;
  state.ownedItemIds = [...state.ownedItemIds, itemId];
  return {
    message: [
      `You pick it up. Danilo: "${DEBUGGING_TOOLS_PICKUP_THOUGHT}" (Debugging Tools added to the Backpack.)`,
      OUT_OF_BOUNDS_ESCAPE_TEXT.alert,
      `Danilo: "${OUT_OF_BOUNDS_ALERT_THOUGHT}"`,
      OUT_OF_BOUNDS_ESCAPE_TEXT.opening
    ].join(' '),
    events: [{ type: 'item_collected', itemId }, { type: 'simulation_broken' }]
  };
}

/** Headless stand-in for clearing the open hobby mini-game's goal. */
export function performHobby(state: GameWorldState): HobbiesOutcome | null {
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
