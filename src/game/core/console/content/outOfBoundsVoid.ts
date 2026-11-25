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
/** Where the void ends: the Debugging Tools lie on the floor here. */
export const OUT_OF_BOUNDS_TOOLBOX_X = HOBBIES_LEFT_WALL_X - OUT_OF_BOUNDS_VOID_LENGTH;
/** Out of Bounds, Act 2: the kit on the floor. Its first tool is a hammer. */
export const DEBUGGING_TOOLS_ITEM_ID = 'debugging-tools';

/** The end of the void, before and after the pickup, for the console. */
export const OUT_OF_BOUNDS_TOOLBOX_TEXT = {
  withKit: 'A beat-up toolbox lies on the blank floor, faintly glowing, stencilled DEBUGGING TOOLS.',
  empty: 'Bare floor. A clean rectangle in the pencil dust shows where the toolbox lay.'
} as const;

/** Danilo's thought as he lifts the lid. */
export const DEBUGGING_TOOLS_PICKUP_THOUGHT = '...debugging tools? There’s a hammer in here.';

/** Physics left edge of the Hobbies scene: the player stops just beside the toolbox. */
export const OUT_OF_BOUNDS_WORLD_LEFT_X = OUT_OF_BOUNDS_TOOLBOX_X + 60;
/** Camera left edge: blank paper beyond the toolbox so it isn't jammed against the screen edge. */
export const OUT_OF_BOUNDS_CAMERA_LEFT_X = OUT_OF_BOUNDS_TOOLBOX_X - 440;

/**
 * The void reads as a collision bug: mostly blank paper. A few far-apart marks
 * and Danilo's thoughts are what keep the player walking to the toolbox.
 */
export type OutOfBoundsStage = 'past-the-wall' | 'margin-notes' | 'room-end' | 'beyond';

const STAGE_STARTS: readonly { stage: OutOfBoundsStage; depth: number }[] = [
  { stage: 'past-the-wall', depth: 0 },
  { stage: 'margin-notes', depth: 2200 },
  { stage: 'room-end', depth: 5000 },
  // Past where the toolbox lay: only reachable once the simulation is broken.
  { stage: 'beyond', depth: 6100 }
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
  'room-end': 'The page is running out. Something glows faintly up ahead.',
  beyond: 'Past where the toolbox lay. The page goes on, rougher, as if drawn in a hurry.'
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
 * just past the wall, the first deliberate mark, and the toolbox coming up.
 */
const OUT_OF_BOUNDS_THOUGHTS: readonly { depth: number; text: string }[] = [
  { depth: 300, text: '...did I just walk through the wall?' },
  { depth: 2700, text: '...this wasn’t finished.' },
  { depth: 5300, text: 'Wait. There’s something up ahead.' },
  // Only reachable during the escape.
  { depth: 6600, text: 'The page keeps going. Left, then.' }
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

/*
 * Out of Bounds, Act 2 cliffhanger: the point of no return.
 * Picking the toolbox up breaks the simulation. From then on (for the rest of
 * the session) the Hobbies scene is the escape: the way back right is
 * scribbled shut and the page runs on further left. Owning the Debugging Tools
 * *is* that state — the only way to get them is to confirm the warning.
 */

/** True once the player has taken the Debugging Tools and broken the simulation. */
export function isSimulationBroken(ownedItemIds: readonly string[]): boolean {
  return ownedItemIds.includes(DEBUGGING_TOOLS_ITEM_ID);
}

/** The ink barrier that shuts the way back right, a little behind the toolbox spot (centre of the scribble). */
export const OUT_OF_BOUNDS_BARRIER_X = OUT_OF_BOUNDS_TOOLBOX_X + 360;
/** Half the scribble's width: the player stops at its left edge, not inside it. */
export const OUT_OF_BOUNDS_BARRIER_HALF_WIDTH = 45;
/** Physics right edge during the escape. */
export const OUT_OF_BOUNDS_ESCAPE_WORLD_RIGHT_X = OUT_OF_BOUNDS_BARRIER_X - OUT_OF_BOUNDS_BARRIER_HALF_WIDTH;
/** Where the page opens up, past where the toolbox lay. The route on (#162) starts here. */
export const OUT_OF_BOUNDS_OPENING_X = OUT_OF_BOUNDS_TOOLBOX_X - 700;
/** Physics left edge during the escape: the player stops at the opening. */
export const OUT_OF_BOUNDS_ESCAPE_WORLD_LEFT_X = OUT_OF_BOUNDS_OPENING_X - 40;
/** Camera left edge during the escape: some blank page beyond the opening. */
export const OUT_OF_BOUNDS_ESCAPE_CAMERA_LEFT_X = OUT_OF_BOUNDS_OPENING_X - 420;
/** Where a return visit during the escape puts the player: just inside the barrier. */
export const OUT_OF_BOUNDS_ESCAPE_START_X = OUT_OF_BOUNDS_TOOLBOX_X + 180;
/** Half the side-view player's width: the body stops when its edge meets a wall. */
const PLAYER_HALF_WIDTH = 24;
/** How far the player's centre can walk during the escape. */
export const OUT_OF_BOUNDS_ESCAPE_MIN_X = OUT_OF_BOUNDS_ESCAPE_WORLD_LEFT_X + PLAYER_HALF_WIDTH;
export const OUT_OF_BOUNDS_ESCAPE_MAX_X = OUT_OF_BOUNDS_ESCAPE_WORLD_RIGHT_X - PLAYER_HALF_WIDTH;

/** The warning before the pickup: a dangerous, video-game "point of no return". */
export const POINT_OF_NO_RETURN_TEXT = {
  title: 'POINT OF NO RETURN',
  body: 'This isn’t part of the portfolio. Pick it up and the page won’t let you walk back.',
  confirm: 'Pick it up',
  decline: 'Leave it'
} as const;

/** The alert stamp that goes off once the toolbox is lifted. */
export const OUT_OF_BOUNDS_ALERT_STAMP = 'OUT_OF_BOUNDS';
export const OUT_OF_BOUNDS_ALERT_THOUGHT = '...okay. That sounds bad.';
/** Walking into the barrier, once per visit. */
export const OUT_OF_BOUNDS_BARRIER_THOUGHT = 'It scribbled itself shut. No going back.';

/** The escape, for the headless console. */
export const OUT_OF_BOUNDS_ESCAPE_TEXT = {
  warning: `${POINT_OF_NO_RETURN_TEXT.title}. ${POINT_OF_NO_RETURN_TEXT.body} Type confirm to pick it up, or decline to leave it.`,
  declined: 'You leave the toolbox where it is. It keeps glowing.',
  noWarning: 'Nothing to confirm here.',
  alert: `An alarm goes off. A stamp slams across the page: ${OUT_OF_BOUNDS_ALERT_STAMP}. Behind you, the page scribbles itself shut.`,
  barrier: 'A wall of ink scribble blocks the way back right.',
  opening: 'The page runs on past where the toolbox lay. A torn gap opens to the left.',
  entry: 'You step back in, and you are at the end of the page again. The way back is still scribbled shut.'
} as const;

/** Where the Hobbies scene starts the player: the room, or the escape once the simulation is broken. */
export function hobbiesEntryX(ownedItemIds: readonly string[], roomStartX: number): number {
  return isSimulationBroken(ownedItemIds) ? OUT_OF_BOUNDS_ESCAPE_START_X : roomStartX;
}
