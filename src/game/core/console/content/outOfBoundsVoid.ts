/**
 * Out of Bounds, Act 1: the unfinished page past the Hobbies room's left wall.
 * Pure geometry and copy shared by the headless console and HobbiesScene.
 * Design source: docs/game-design/secrets/out-of-bounds.md.
 *
 * "Depth" is how far past the drawn left wall the player has walked, in px.
 */

/** The drawn left wall of the Hobbies room. It looks solid but has no collision. */
export const HOBBIES_LEFT_WALL_X = 50;
/** How far the void runs past the wall (~20s walking at 300px/s, ~10s sprinting). */
export const OUT_OF_BOUNDS_VOID_LENGTH = 6000;
/** The empty sketchbook-spine pedestal that ends the void. */
export const OUT_OF_BOUNDS_PEDESTAL_X = HOBBIES_LEFT_WALL_X - OUT_OF_BOUNDS_VOID_LENGTH;
/** Out of Bounds, Act 2: the kit sitting on the pedestal. Its first tool is a hammer. */
export const DEBUGGING_TOOLS_ITEM_ID = 'debugging-tools';

/** What the pedestal holds, for the console and the scene. */
export const OUT_OF_BOUNDS_PEDESTAL_TEXT = {
  withKit:
    'A closed sketchbook stood on its end, spine out, faintly glowing. On top sits a beat-up toolbox stencilled DEBUGGING TOOLS.',
  empty: 'A closed sketchbook stood on its end, spine out. The top is empty: a dashed outline where the toolbox sat.'
} as const;

/** Danilo's thought as he lifts the lid. */
export const DEBUGGING_TOOLS_PICKUP_THOUGHT = '...debugging tools? There’s a hammer in here.';

/** Physics left edge of the Hobbies scene: the player stops just beside the pedestal. */
export const OUT_OF_BOUNDS_WORLD_LEFT_X = OUT_OF_BOUNDS_PEDESTAL_X + 40;
/** Camera left edge: blank paper beyond the pedestal so it isn't jammed against the screen edge. */
export const OUT_OF_BOUNDS_CAMERA_LEFT_X = OUT_OF_BOUNDS_PEDESTAL_X - 440;

/**
 * The void reads as a collision bug: mostly blank paper. A few far-apart marks
 * and Danilo's thoughts are what keep the player walking to the pedestal.
 */
export type OutOfBoundsStage = 'past-the-wall' | 'margin-notes' | 'room-end';

const STAGE_STARTS: readonly { stage: OutOfBoundsStage; depth: number }[] = [
  { stage: 'past-the-wall', depth: 0 },
  { stage: 'margin-notes', depth: 2200 },
  { stage: 'room-end', depth: 5000 }
];

export function outOfBoundsDepth(x: number): number {
  return Math.max(0, HOBBIES_LEFT_WALL_X - x);
}

/** The void stage at world x, or null while still inside the drawn room. */
export function outOfBoundsStageAt(x: number): OutOfBoundsStage | null {
  const depth = outOfBoundsDepth(x);
  if (depth <= 0) return null;
  let current: OutOfBoundsStage | null = null;
  for (const start of STAGE_STARTS) if (depth >= start.depth) current = start.stage;
  return current;
}

/** What each stage looks like, for the headless console. */
export const OUT_OF_BOUNDS_STAGE_TEXT: Record<OutOfBoundsStage, string> = {
  'past-the-wall': 'Outside the room. Nothing is drawn here, just empty paper. Looks like you walked through the wall.',
  'margin-notes': 'Still mostly blank, but now and then a mark. Someone left these here on purpose.',
  'room-end': 'The page is running out. Something glows faintly up ahead.'
};

export type OutOfBoundsSightId = 'todo-scribble' | 'coffee-ring' | 'room-end-label';

/** The few unfinished-world details along the void; the scene draws them at these depths. */
export const OUT_OF_BOUNDS_SIGHTS: readonly { id: OutOfBoundsSightId; depth: number; text: string }[] = [
  { id: 'todo-scribble', depth: 2600, text: 'a margin scribble: "TODO: fix left wall collision"' },
  { id: 'coffee-ring', depth: 4100, text: 'a coffee ring stain on the paper' },
  { id: 'room-end-label', depth: 5550, text: 'a placeholder box labelled ROOM_END' }
];

/** About half a screen: how far away a detail still reads in the console. */
const SIGHT_RADIUS = 480;

export function outOfBoundsSightsNear(x: number): string[] {
  const depth = outOfBoundsDepth(x);
  if (depth <= 0) return [];
  return OUT_OF_BOUNDS_SIGHTS.filter((s) => Math.abs(s.depth - depth) <= SIGHT_RADIUS).map((s) => s.text);
}

/**
 * Danilo's thoughts: few and far apart, so most of the walk is quiet. A bug
 * just past the wall, the first deliberate mark, and the pedestal coming up.
 */
const OUT_OF_BOUNDS_THOUGHTS: readonly { depth: number; text: string }[] = [
  { depth: 300, text: '...did I just walk through the wall?' },
  { depth: 2700, text: '...this wasn’t finished.' },
  { depth: 5300, text: 'Wait. There’s something up ahead.' }
];

/**
 * Thoughts newly reached when the visit's furthest depth grows from
 * `furthestDepth` to `depth`. Tracking only the furthest depth makes each line
 * fire once per visit, and a sprint that skips several triggers hears them all.
 */
export function outOfBoundsThoughtsReached(furthestDepth: number, depth: number): string[] {
  if (depth <= furthestDepth) return [];
  return OUT_OF_BOUNDS_THOUGHTS.filter((t) => t.depth > furthestDepth && t.depth <= depth).map((t) => t.text);
}
