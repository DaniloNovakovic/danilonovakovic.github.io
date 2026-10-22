// Nearby scanning encodes room priority rules; keep branches local and readable.
// fallow-ignore-file complexity
import {
  BASEMENT_CORKBOARD_NOTE_COUNT,
  BASEMENT_SPOTS,
  BASEMENT_STEP_PX,
  BASEMENT_WALK_BOUNDS,
  type BasementSpot
} from './content/basementSpots';
import { CIRCUIT_PART_IDS, countCircuitParts } from './content/circuitParts';
import { clamp, nearbyMissMessage, pickNearby } from './nearby';
import { getGamesOverlay } from './overlayCatalog';
import type { GameItemId, GameSessionEvent, GameWorldState, NearbyThing } from './types';

export interface BasementInteractOutcome {
  message: string;
  events: GameSessionEvent[];
}

const SPOT_KIND: Record<BasementSpot['id'], NearbyThing['kind']> = {
  exit: 'exit',
  corkboard: 'prop',
  computer: 'computer',
  glasses: 'pickup',
  workbench: 'prop',
  shelf: 'prop'
};

function promptFor(state: GameWorldState, id: BasementSpot['id']): string {
  const hasGlasses = state.ownedItemIds.includes('glasses');
  switch (id) {
    case 'exit':
      return 'Climb out';
    case 'glasses':
      return 'Pick up glasses';
    case 'corkboard':
      return 'Read a note';
    case 'shelf':
      return 'Rummage the shelf';
    case 'workbench':
      return state.ownedItemIds.includes('circuit') ? 'Admire the bench' : 'Use the workbench';
    case 'computer':
      return hasGlasses ? 'Open developer console' : 'Peer at the screen';
  }
}

export function listBasementNearby(state: GameWorldState): NearbyThing[] {
  const x = state.basement.playerX;
  const things: NearbyThing[] = [];

  for (const spot of BASEMENT_SPOTS) {
    if (spot.id === 'glasses' && state.ownedItemIds.includes('glasses')) continue;
    const distance = Math.abs(x - spot.x);
    if (distance > spot.radius) continue;

    things.push({
      id: spot.id,
      label: spot.label,
      distance,
      prompt: promptFor(state, spot.id),
      kind: SPOT_KIND[spot.id],
      promptX: spot.promptX,
      promptY: spot.promptY
    });
  }

  return things.sort((a, b) => a.distance - b.distance);
}

export function moveBasement(
  state: GameWorldState,
  direction: 'left' | 'right',
  steps: number
): string {
  const delta = steps * BASEMENT_STEP_PX * (direction === 'right' ? 1 : -1);
  const next = clamp(state.basement.playerX + delta, BASEMENT_WALK_BOUNDS.minX, BASEMENT_WALK_BOUNDS.maxX);
  state.basement.playerX = next;
  state.basement.facing = direction;
  return direction === 'right'
    ? `You shuffle right to x=${Math.round(next)}.`
    : `You shuffle left to x=${Math.round(next)}.`;
}

export function syncBasementPosition(state: GameWorldState, x: number): void {
  state.basement.playerX = x;
}

export function interactBasement(
  state: GameWorldState,
  target: string | undefined
): BasementInteractOutcome {
  const nearby = listBasementNearby(state);
  const miss = nearbyMissMessage(nearby, target, 'Nothing close enough in the basement.');
  if (miss) return { message: miss, events: [] };
  const picked = pickNearby(nearby, target);
  if (!picked) return { message: 'Nothing close enough in the basement.', events: [] };

  switch (picked.id as BasementSpot['id']) {
    case 'exit':
      return returnToOverworld(state, 'You climb back to the street.');
    case 'glasses':
      return collectGlasses(state);
    case 'corkboard':
      return readCorkboard(state);
    case 'shelf':
      return {
        message: 'Dusty boxes: an old uc32 board, jumper wires, a chess piece glued to a Tetris block.',
        events: [{ type: 'thought', id: 'basement_shelf' }]
      };
    case 'workbench':
      return operateWorkbench(state);
    case 'computer':
      return openComputer(state);
  }
}

function openComputer(state: GameWorldState): BasementInteractOutcome {
  if (!state.ownedItemIds.includes('glasses')) {
    return {
      message: "ughh... I can't see",
      events: [{ type: 'thought', id: 'basement_cannot_see' }]
    };
  }

  state.mode = 'overlay';
  state.overlay = getGamesOverlay();
  return {
    message: 'The developer console boots on the basement CRT.',
    events: [{ type: 'overlay_opened', overlayId: 'games' }]
  };
}

function readCorkboard(state: GameWorldState): BasementInteractOutcome {
  const variant = state.basement.corkboardNote % BASEMENT_CORKBOARD_NOTE_COUNT;
  state.basement.corkboardNote = variant + 1;
  return {
    message: `You unpin note ${variant + 1}/${BASEMENT_CORKBOARD_NOTE_COUNT} from the corkboard.`,
    events: [{ type: 'thought', id: 'basement_corkboard', variant }]
  };
}

function operateWorkbench(state: GameWorldState): BasementInteractOutcome {
  if (state.ownedItemIds.includes('circuit')) {
    return {
      message: 'The soldering iron is cold. Your Circuit is already humming in your pocket.',
      events: [{ type: 'thought', id: 'workbench_soldered', variant: 1 }]
    };
  }

  const owned = countCircuitParts(state.ownedItemIds);
  if (owned < CIRCUIT_PART_IDS.length) {
    const missing = CIRCUIT_PART_IDS.filter((id) => !state.ownedItemIds.includes(id));
    return {
      message: `A Circuit blueprint is taped to the bench. Parts ${owned}/${CIRCUIT_PART_IDS.length} — missing: ${missing.join(', ')}.`,
      events: [{ type: 'thought', id: 'workbench_missing_parts', variant: owned }]
    };
  }

  const itemId: GameItemId = 'circuit';
  state.ownedItemIds = [...state.ownedItemIds, itemId];
  return {
    message: 'Copper, crystal, cell — solder, flux, a puff of smoke. You built a Circuit!',
    events: [
      { type: 'item_collected', itemId },
      { type: 'thought', id: 'workbench_soldered', variant: 0 }
    ]
  };
}

function collectGlasses(state: GameWorldState): BasementInteractOutcome {
  if (state.ownedItemIds.includes('glasses')) {
    return { message: 'Glasses already collected.', events: [] };
  }

  const itemId: GameItemId = 'glasses';
  state.ownedItemIds = [...state.ownedItemIds, itemId];
  if (!state.equippedItemIds.includes(itemId)) {
    state.equippedItemIds = [...state.equippedItemIds, itemId];
  }

  return {
    message: 'Glasses acquired. The sketch city flickers into focus.',
    events: [
      { type: 'item_collected', itemId },
      { type: 'item_equipped', itemId }
    ]
  };
}

export function returnToOverworld(state: GameWorldState, message: string): BasementInteractOutcome {
  state.mode = 'overworld';
  state.sceneId = 'overworld';
  state.overlay = null;
  return {
    message,
    events: [{ type: 'scene_returned', sceneId: 'overworld' }]
  };
}
