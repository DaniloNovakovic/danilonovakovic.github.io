/**
 * Out of Bounds, Act 3 step 1 (#162): the breakout through the Basement.
 * Past the torn opening at the escape's far left, the blank page breaks
 * through the right wall of the real Developer Basement. The den has been
 * ransacked; the old exit ladder climbs out onto the street by the hatch.
 * Pure geometry and copy shared by the headless console and the Phaser scenes.
 * Design source: docs/game-design/secrets/out-of-bounds.md (Act 3).
 *
 * All of this exists only while the simulation is broken (owning the
 * Debugging Tools, see outOfBoundsVoid.ts). Otherwise the Basement is as always.
 */
import { BASEMENT_FLOOR_Y, BASEMENT_WALK_BOUNDS } from './basementSpots';
import { OUT_OF_BOUNDS_OPENING_X } from './outOfBoundsVoid';
import { OVERWORLD_BASEMENT_HOLE, OVERWORLD_PLAYER_START } from './overworldSpots';

/** Walking left into the torn opening (past its middle) takes the player through. */
export function reachesOutOfBoundsOpening(x: number): boolean {
  return x <= OUT_OF_BOUNDS_OPENING_X;
}

/** The torn hole in the Basement's right wall (its centre), where the page broke in. */
export const BASEMENT_BREACH_X = 975;
/** Where the player lands through the breach: the right end of the den, facing left. */
export const BASEMENT_BREACH_ENTRY = { x: BASEMENT_WALK_BOUNDS.maxX, y: BASEMENT_FLOOR_Y - 50 } as const;
/** Starting this close to the breach means the page just broke in (the scene plays the arrival). */
export const BASEMENT_BREACH_ARRIVAL_RADIUS = 12;

export function isBasementBreachArrival(x: number): boolean {
  return Math.abs(x - BASEMENT_BREACH_ENTRY.x) <= BASEMENT_BREACH_ARRIVAL_RADIUS;
}

/**
 * A Basement exit position, kept out of the arrival zone. Only the breach
 * itself (Hobbies placing BASEMENT_BREACH_ENTRY) may start the player there,
 * so leaving from the right wall and coming back down the hatch never replays
 * the arrival.
 */
export function awayFromBasementBreach<T extends { x: number }>(position: T): T {
  const limit = BASEMENT_BREACH_ENTRY.x - BASEMENT_BREACH_ARRIVAL_RADIUS - 1;
  return position.x > limit ? { ...position, x: limit } : position;
}

/**
 * Leaving the Basement while the simulation is broken (ladder, `Esc`, Back)
 * comes up through the hatch onto the street, wherever the visit began.
 * #163 (the evil chick) takes over from here.
 */
export const OUT_OF_BOUNDS_STREET_ARRIVAL = { x: OVERWORLD_BASEMENT_HOLE.x, y: OVERWORLD_PLAYER_START.y } as const;

/** Danilo, arriving through the breach. */
export const BASEMENT_BREACH_ARRIVAL_THOUGHT = '...my basement? Someone’s been through here.';
/** Walking back into the breach, once per visit. */
export const BASEMENT_BREACH_SHUT_THOUGHT = 'Shut behind me too. Up the ladder, then.';

/** The red scrawl circled around Danilo's things. */
export const BASEMENT_WANTED_SCRAWL = 'WANTED';

/** The breakout, for the headless console. */
export const OUT_OF_BOUNDS_BREAKOUT_TEXT = {
  throughOpening:
    'You step into the torn opening. The blank page gives way and you stumble through a wall you know: the right wall of your own basement.',
  ransacked:
    'The den has been ransacked: the desk tipped over, the corkboard torn down, papers everywhere, the shelf knocked over. Claw marks on the bricks, and red circles scrawled around your things: WANTED.',
  breachShut: 'The hole in the right wall is scribbled shut.',
  ladder: 'You climb the ladder and push up through the hatch, onto the street.'
} as const;
