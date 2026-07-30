// Nearby scanning encodes room priority rules; keep branches local and readable.
// fallow-ignore-file complexity
import { BASEMENT_SPOTS, BASEMENT_STEP_PX } from './content/basementSpots';
import { clamp, nearbyMissMessage, pickNearby } from './nearby';
import { getGamesOverlay } from './overlayCatalog';
import type { GameItemId, GameSessionEvent, GameWorldState, NearbyThing } from './types';

export interface BasementInteractOutcome {
  message: string;
  events: GameSessionEvent[];
}

export function listBasementNearby(state: GameWorldState): NearbyThing[] {
  const x = state.basement.playerX;
  const things: NearbyThing[] = [];

  for (const spot of BASEMENT_SPOTS) {
    if (spot.id === 'glasses' && state.ownedItemIds.includes('glasses')) continue;
    const distance = Math.abs(x - spot.x);
    if (distance > spot.radius) continue;

    const prompt =
      spot.id === 'exit'
        ? 'Climb out'
        : spot.id === 'glasses'
          ? 'Pick up glasses'
          : state.ownedItemIds.includes('glasses')
            ? 'Open developer console'
            : 'Peer at the screen';

    things.push({
      id: spot.id,
      label: spot.label,
      distance,
      prompt,
      kind: spot.id === 'exit' ? 'exit' : spot.id === 'glasses' ? 'pickup' : 'computer',
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
  const next = clamp(state.basement.playerX + delta, 60, 720);
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

  if (picked.id === 'exit') {
    return returnToOverworld(state, 'You climb back to the street.');
  }

  if (picked.id === 'glasses') {
    return collectGlasses(state);
  }

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

