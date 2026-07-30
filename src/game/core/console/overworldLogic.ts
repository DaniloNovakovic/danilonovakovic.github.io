import {
  OVERWORLD_BANANA_PEEL,
  OVERWORLD_BASEMENT_HOLE,
  OVERWORLD_BUILDING_SPOTS,
  OVERWORLD_CIRCUIT_CRT,
  OVERWORLD_INTERACT_DISTANCE_X,
  OVERWORLD_INTERACT_MIN_PLAYER_Y,
  OVERWORLD_STEP_PX,
  OVERWORLD_WIDTH,
  type OverworldBuildingSpot
} from './content/overworldSpots';
import { getPortfolioOverlay } from './overlayCatalog';
import type { GameSecretId, GameSessionEvent, GameWorldState, NearbyThing } from './types';

export interface OverworldInteractOutcome {
  message: string;
  events: GameSessionEvent[];
}

export function listOverworldNearby(state: GameWorldState): NearbyThing[] {
  const x = state.overworld.playerX;
  const y = state.overworld.playerY;
  const things: NearbyThing[] = [];

  const hatchDx = Math.abs(x - OVERWORLD_BASEMENT_HOLE.x);
  if (hatchDx < OVERWORLD_BASEMENT_HOLE.interactDistanceX && y > OVERWORLD_BASEMENT_HOLE.minPlayerY) {
    things.push({
      id: OVERWORLD_BASEMENT_HOLE.id,
      label: OVERWORLD_BASEMENT_HOLE.label,
      distance: hatchDx,
      prompt: 'Enter basement',
      kind: 'hatch'
    });
  }

  const peelDist = Math.hypot(x - OVERWORLD_BANANA_PEEL.x, y - OVERWORLD_BANANA_PEEL.y);
  const glassesOn = state.equippedItemIds.includes('glasses');
  if (glassesOn && peelDist <= OVERWORLD_BANANA_PEEL.radius) {
    const discovered = state.discoveredSecretIds.includes(OVERWORLD_BANANA_PEEL.secretId);
    things.push({
      id: OVERWORLD_BANANA_PEEL.id,
      label: OVERWORLD_BANANA_PEEL.label,
      distance: peelDist,
      prompt: discovered ? 'Slip into Potassium' : 'Inspect peel',
      kind: 'secret'
    });
  }

  const crtDx = Math.abs(x - OVERWORLD_CIRCUIT_CRT.x);
  if (crtDx < OVERWORLD_CIRCUIT_CRT.interactDistanceX && y > OVERWORLD_CIRCUIT_CRT.minPlayerY) {
    const hasCircuit = state.ownedItemIds.includes('circuit');
    things.push({
      id: OVERWORLD_CIRCUIT_CRT.id,
      label: OVERWORLD_CIRCUIT_CRT.label,
      distance: crtDx,
      prompt: hasCircuit ? 'Insert Circuit — enter Ridge' : 'CRT waits for a Circuit',
      kind: 'crt'
    });
  }

  for (const building of OVERWORLD_BUILDING_SPOTS) {
    const dx = Math.abs(x - building.x);
    if (dx < OVERWORLD_INTERACT_DISTANCE_X && y > OVERWORLD_INTERACT_MIN_PLAYER_Y) {
      things.push({
        id: building.id,
        label: building.label,
        distance: dx,
        prompt: `Enter ${building.label}`,
        kind: 'building'
      });
    }
  }

  return things.sort((a, b) => a.distance - b.distance);
}

export function moveOverworld(
  state: GameWorldState,
  direction: 'left' | 'right',
  steps: number
): string {
  const delta = steps * OVERWORLD_STEP_PX * (direction === 'right' ? 1 : -1);
  const next = clamp(state.overworld.playerX + delta, 24, OVERWORLD_WIDTH - 24);
  state.overworld.playerX = next;
  state.overworld.facing = direction;

  const peelDist = Math.hypot(
    next - OVERWORLD_BANANA_PEEL.x,
    state.overworld.playerY - OVERWORLD_BANANA_PEEL.y
  );
  if (state.overworld.bananaFirstPeelPending && peelDist > OVERWORLD_BANANA_PEEL.radius + 40) {
    state.overworld.bananaFirstPeelPending = false;
  }

  return direction === 'right'
    ? `You walk right to x=${Math.round(next)}.`
    : `You walk left to x=${Math.round(next)}.`;
}

export function interactOverworld(
  state: GameWorldState,
  target: string | undefined
): OverworldInteractOutcome {
  const nearby = listOverworldNearby(state);
  if (nearby.length === 0) {
    return { message: 'Nothing close enough to interact with.', events: [] };
  }

  const picked = pickNearby(nearby, target);
  if (!picked) {
    return {
      message: `No match for "${target}". Nearby: ${nearby.map((n) => n.id).join(', ')}`,
      events: []
    };
  }

  if (picked.id === OVERWORLD_BASEMENT_HOLE.id) {
    state.mode = 'basement';
    state.sceneId = 'basement';
    state.basement.playerX = 135;
    state.basement.facing = 'right';
    state.overworld.bananaFirstPeelPending = false;
    return {
      message: 'You drop through the hatch into the basement.',
      events: [{ type: 'scene_entered', sceneId: 'basement' }]
    };
  }

  if (picked.id === OVERWORLD_BANANA_PEEL.id) {
    return interactBananaPeel(state);
  }

  if (picked.id === OVERWORLD_CIRCUIT_CRT.id) {
    if (!state.ownedItemIds.includes('circuit')) {
      return {
        message: 'The CRT is blank. Win Potassium Slip for a Circuit, then come back.',
        events: []
      };
    }
    state.mode = 'ridge';
    state.sceneId = 'ridge';
    return {
      message: 'You seat the Circuit. The CRT blooms into Ridge — a game inside the game.',
      events: [{ type: 'scene_entered', sceneId: 'ridge' }]
    };
  }

  const building = OVERWORLD_BUILDING_SPOTS.find((b) => b.id === picked.id);
  if (!building) {
    return { message: 'Interaction fizzled.', events: [] };
  }
  return enterBuilding(state, building);
}

function interactBananaPeel(state: GameWorldState): OverworldInteractOutcome {
  const secretId: GameSecretId = OVERWORLD_BANANA_PEEL.secretId;
  const discovered = state.discoveredSecretIds.includes(secretId);

  if (!discovered) {
    state.discoveredSecretIds = [...state.discoveredSecretIds, secretId];
    return {
      message:
        'A banana peel snaps into focus. Secret discovered — interact again to slip into Potassium.',
      events: [{ type: 'secret_discovered', secretId }]
    };
  }

  state.mode = 'potassium';
  state.sceneId = 'potassium';
  state.potassium = {
    phase: 'lobby',
    wave: 0,
    maxWaves: 5,
    lives: 3,
    score: 0,
    draftChoices: []
  };
  return {
    message: 'You slip on the peel and tumble into Potassium Slip.',
    events: [{ type: 'scene_entered', sceneId: 'potassium' }]
  };
}

function enterBuilding(
  state: GameWorldState,
  building: OverworldBuildingSpot
): OverworldInteractOutcome {
  if (building.action.kind === 'enterScene') {
    state.mode = 'hobbies';
    state.sceneId = 'hobbies';
    state.hobbies.playerX = 200;
    state.hobbies.facing = 'right';
    return {
      message: `You enter ${building.label}.`,
      events: [{ type: 'scene_entered', sceneId: 'hobbies' }]
    };
  }

  state.mode = 'overlay';
  state.overlay = getPortfolioOverlay(building.action.overlayId);
  return {
    message: `You open ${state.overlay.title}.`,
    events: [{ type: 'overlay_opened', overlayId: building.action.overlayId }]
  };
}

function pickNearby(nearby: readonly NearbyThing[], target: string | undefined): NearbyThing | null {
  if (!target) return nearby[0] ?? null;
  const needle = target.toLowerCase();
  return (
    nearby.find((n) => n.id.toLowerCase() === needle || n.label.toLowerCase().includes(needle)) ??
    null
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
