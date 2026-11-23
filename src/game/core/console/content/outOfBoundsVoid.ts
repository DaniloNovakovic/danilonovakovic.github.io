/**
 * Out of Bounds, Act 1: the unfinished page past the Hobbies room's left wall.
 * Pure geometry and copy shared by the headless console and HobbiesScene.
 * Design source: docs/game-design/secrets/out-of-bounds.md.
 *
 * "Depth" is how far past the drawn left wall the player has walked, in px.
 */

/** The drawn left wall of the Hobbies room. It looks solid; pushing into it clips you through. */
export const HOBBIES_LEFT_WALL_X = 50;
/** How far the void runs past the wall (~10s walking at 300px/s). */
export const OUT_OF_BOUNDS_VOID_LENGTH = 3000;
/** The empty sketchbook-spine pedestal that ends the void. */
export const OUT_OF_BOUNDS_PEDESTAL_X = HOBBIES_LEFT_WALL_X - OUT_OF_BOUNDS_VOID_LENGTH + 50;
/** Physics/camera left edge of the Hobbies scene: a little paper behind the pedestal. */
export const OUT_OF_BOUNDS_WORLD_LEFT_X = HOBBIES_LEFT_WALL_X - OUT_OF_BOUNDS_VOID_LENGTH;

/**
 * The void reads as a collision bug first: blank paper, nothing drawn. Only
 * once the player keeps walking do deliberate marks build up toward the pedestal.
 */
export type OutOfBoundsStage = 'past-the-wall' | 'stray-marks' | 'margin-notes' | 'room-end';

const STAGE_STARTS: readonly { stage: OutOfBoundsStage; depth: number }[] = [
  { stage: 'past-the-wall', depth: 0 },
  { stage: 'stray-marks', depth: 1000 },
  { stage: 'margin-notes', depth: 1750 },
  { stage: 'room-end', depth: 2500 }
];

/**
 * Depth where the first deliberate mark comes into view (it sits about half a
 * screen further on); before it the void is blank paper.
 */
export const OUT_OF_BOUNDS_FIRST_MARK_DEPTH = 1000;

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
  'past-the-wall':
    'Outside the room. Nothing is drawn here, just empty paper. Looks like you glitched through the wall.',
  'stray-marks': 'A faint pencil guideline under your feet, and a few stray marks. Someone was drawing out here.',
  'margin-notes': 'Margin notes and doodles crowd the blank page. This was left here on purpose.',
  'room-end': 'The page is running out. Something glows faintly up ahead.'
};

export type OutOfBoundsSightId = 'stray-mark' | 'todo-scribble' | 'ruler-line' | 'coffee-ring' | 'room-end-label';

/** Unfinished-world details along the void; the scene draws them at these depths. */
export const OUT_OF_BOUNDS_SIGHTS: readonly { id: OutOfBoundsSightId; depth: number; text: string }[] = [
  { id: 'stray-mark', depth: 1500, text: 'a stray pencil tick on the blank paper' },
  { id: 'todo-scribble', depth: 1850, text: 'a margin scribble: "TODO: fix left wall collision"' },
  { id: 'ruler-line', depth: 2150, text: 'a ruler line, measured out and abandoned' },
  { id: 'coffee-ring', depth: 2420, text: 'a coffee ring stain on the paper' },
  { id: 'room-end-label', depth: 2700, text: 'a placeholder box labelled ROOM_END' }
];

/** About half a screen: how far away a detail still reads in the console. */
const SIGHT_RADIUS = 480;

export function outOfBoundsSightsNear(x: number): string[] {
  const depth = outOfBoundsDepth(x);
  if (depth <= 0) return [];
  return OUT_OF_BOUNDS_SIGHTS.filter((s) => Math.abs(s.depth - depth) <= SIGHT_RADIUS).map((s) => s.text);
}

/** Danilo's thoughts: a bug at first, then more and more puzzled. */
const OUT_OF_BOUNDS_THOUGHTS: readonly { depth: number; text: string }[] = [
  { depth: 150, text: '...did I just walk through the wall?' },
  { depth: 1100, text: '...this wasn’t finished.' },
  { depth: 2000, text: 'Why am I still walking?' },
  { depth: 2850, text: 'Something’s out here.' }
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
