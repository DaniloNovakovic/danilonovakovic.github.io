/**
 * Out of Bounds, Act 1: the unfinished page past the Hobbies room's left wall.
 * Pure geometry and copy shared by the headless console and HobbiesScene.
 * Design source: docs/game-design/secrets/out-of-bounds.md.
 *
 * "Depth" is how far past the drawn left wall the player has walked, in px.
 */

/** The drawn left wall of the Hobbies room; the void starts here. */
export const HOBBIES_LEFT_WALL_X = 50;
/** How far the void runs past the wall (~10s walking at 300px/s). */
export const OUT_OF_BOUNDS_VOID_LENGTH = 3000;
/** The empty sketchbook-spine pedestal that ends the void. */
export const OUT_OF_BOUNDS_PEDESTAL_X = HOBBIES_LEFT_WALL_X - OUT_OF_BOUNDS_VOID_LENGTH + 50;
/** Physics/camera left edge of the Hobbies scene: a little paper behind the pedestal. */
export const OUT_OF_BOUNDS_WORLD_LEFT_X = HOBBIES_LEFT_WALL_X - OUT_OF_BOUNDS_VOID_LENGTH;

export type OutOfBoundsStage = 'thinning-ink' | 'pencil-guideline' | 'eraser-smudge' | 'blank-paper';

const STAGE_LENGTH = OUT_OF_BOUNDS_VOID_LENGTH / 4;
const STAGES: readonly OutOfBoundsStage[] = ['thinning-ink', 'pencil-guideline', 'eraser-smudge', 'blank-paper'];

export function outOfBoundsDepth(x: number): number {
  return Math.max(0, HOBBIES_LEFT_WALL_X - x);
}

/** The fading-ink stage at world x, or null while still inside the drawn room. */
export function outOfBoundsStageAt(x: number): OutOfBoundsStage | null {
  const depth = outOfBoundsDepth(x);
  if (depth <= 0) return null;
  return STAGES[Math.min(STAGES.length - 1, Math.floor(depth / STAGE_LENGTH))] ?? null;
}

/** What each stage looks like, for the headless console. */
export const OUT_OF_BOUNDS_STAGE_TEXT: Record<OutOfBoundsStage, string> = {
  'thinning-ink': 'The ink lines thin out and stop. The ceiling and string lights just end.',
  'pencil-guideline': 'The floor is only a faint pencil guideline now.',
  'eraser-smudge': 'The floor line is rubbed out into a grey eraser smudge.',
  'blank-paper': 'Blank paper in every direction. The camera keeps following you anyway.'
};

export type OutOfBoundsSightId = 'todo-scribble' | 'ruler-line' | 'coffee-ring' | 'room-end-label';

/** Unfinished-world details along the void; the scene draws them at these depths. */
export const OUT_OF_BOUNDS_SIGHTS: readonly { id: OutOfBoundsSightId; depth: number; text: string }[] = [
  { id: 'todo-scribble', depth: 160, text: 'a margin scribble: "TODO: draw wall"' },
  { id: 'ruler-line', depth: 950, text: 'a ruler line, measured out and abandoned' },
  { id: 'coffee-ring', depth: 1750, text: 'a coffee ring stain on the paper' },
  { id: 'room-end-label', depth: 2700, text: 'a placeholder box labelled ROOM_END' }
];

/** About half a screen: how far away a detail still reads in the console. */
const SIGHT_RADIUS = 480;

export function outOfBoundsSightsNear(x: number): string[] {
  const depth = outOfBoundsDepth(x);
  if (depth <= 0) return [];
  return OUT_OF_BOUNDS_SIGHTS.filter((s) => Math.abs(s.depth - depth) <= SIGHT_RADIUS).map((s) => s.text);
}

/** Danilo's thoughts, getting more puzzled the further he walks (~15/45/75/95% in). */
const OUT_OF_BOUNDS_THOUGHTS: readonly { depth: number; text: string }[] = [
  { depth: 450, text: 'Huh. The wall just... stops.' },
  { depth: 1350, text: '...this wasn’t finished.' },
  { depth: 2250, text: 'Why am I still walking?' },
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
