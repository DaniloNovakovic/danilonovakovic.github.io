import type { GameSessionEvent, GameWorldState, NearbyThing } from './types';
import { returnToOverworld } from './basementLogic';

const HOBBIES_EXIT_X = 80;
const HOBBIES_STEP_PX = 40;

export function listHobbiesNearby(state: GameWorldState): NearbyThing[] {
  const distance = Math.abs(state.hobbies.playerX - HOBBIES_EXIT_X);
  if (distance > 90) return [];
  return [
    {
      id: 'exit',
      label: 'Street door',
      distance,
      prompt: 'Return to street',
      kind: 'exit'
    }
  ];
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
  if (nearby.length === 0) {
    return {
      message: 'Hobbies room — walk left to the street door, or close to leave.',
      events: []
    };
  }

  const needle = target?.toLowerCase();
  const picked = !needle
    ? nearby[0]
    : nearby.find((n) => n.id.includes(needle) || n.label.toLowerCase().includes(needle));

  if (!picked) {
    return { message: `No match for "${target}".`, events: [] };
  }

  return returnToOverworld(state, 'You step back onto the street.');
}
