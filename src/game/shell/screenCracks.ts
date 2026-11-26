/**
 * Hand-drawn glass cracks for the screen damage layer (Out of Bounds, #163).
 * Pure geometry. A crack breaks out of the screen corner nearest the smash
 * (struck glass gives at its edges here, by design): an impact star and
 * broken rings in the corner, and jagged runs that branch inward. Runs stop
 * at a clear oval in the middle of the screen, so the game and Danilo always
 * stay visible. Same crack + same viewport size, same drawing.
 */
import type { ScreenCrack } from '@/game/bridge/store';

export interface CrackDrawing {
  /** Long runs and branches: the heavy lines. */
  runs: string[];
  /** Short impact lines and ring fragments at the corner. */
  impact: string[];
}

interface Viewport {
  width: number;
  height: number;
}

type Point = [number, number];

/** Half-axes of the clear middle, as fractions of the viewport. */
const CRACK_CLEAR_CENTER = { rx: 0.3, ry: 0.32 } as const;
/** How far in from its corner a crack may start, as a fraction of the viewport. */
const CORNER_INSET = 0.12;

/** Small deterministic PRNG (mulberry32), so a crack keeps its shape across renders. */
function random(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n: number) => Math.round(n * 10) / 10;

function polyline(points: readonly Point[]): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${round(x)} ${round(y)}`).join(' ');
}

/** Inside the clear middle oval. */
export function inClearCenter([x, y]: Point, viewport: Viewport): boolean {
  const dx = (x - viewport.width / 2) / (viewport.width * CRACK_CLEAR_CENTER.rx);
  const dy = (y - viewport.height / 2) / (viewport.height * CRACK_CLEAR_CENTER.ry);
  return dx * dx + dy * dy < 1;
}

/**
 * A jagged run from `from` heading `angle`, up to `length` px, with a kink
 * every few dozen px. It stops short of the clear middle.
 */
function jaggedRun(rand: () => number, from: Point, angle: number, length: number, viewport: Viewport): Point[] {
  const points: Point[] = [from];
  let travelled = 0;
  let heading = angle;
  let [px, py] = from;
  while (travelled < length) {
    const step = 18 + rand() * 34;
    heading += (rand() - 0.5) * 0.55;
    const next: Point = [px + Math.cos(heading) * step, py + Math.sin(heading) * step];
    if (inClearCenter(next, viewport)) break;
    [px, py] = next;
    travelled += step;
    points.push(next);
  }
  return points;
}

export function drawScreenCrack(crack: ScreenCrack, viewport: Viewport): CrackDrawing {
  const rand = random(crack.seed);
  const { width, height } = viewport;
  // The corner nearest the hit, pulled in a little so cracks don't all share one point.
  const right = crack.x >= 0.5;
  const bottom = crack.y >= 0.5;
  const insetX = rand() * CORNER_INSET * width;
  const insetY = rand() * CORNER_INSET * height;
  const origin: Point = [right ? width - insetX : insetX, bottom ? height - insetY : insetY];
  // Into the screen: from this corner toward the middle.
  const inward = Math.atan2(height / 2 - origin[1], width / 2 - origin[0]);
  return {
    runs: fanRuns(rand, origin, inward, Math.hypot(width, height), viewport),
    impact: impactMarks(rand, origin, viewport)
  };
}

/** The break itself: short splinters and two broken rings around the origin. */
function impactMarks(rand: () => number, origin: Point, viewport: Viewport): string[] {
  const marks: string[] = [];
  const splinters = 5 + Math.floor(rand() * 3);
  for (let i = 0; i < splinters; i++) {
    const angle = (i / splinters) * Math.PI * 2 + rand() * 0.4;
    marks.push(polyline(jaggedRun(rand, origin, angle, 14 + rand() * 26, viewport)));
  }
  for (const radius of [22 + rand() * 10, 46 + rand() * 18]) marks.push(...brokenRing(rand, origin, radius));
  return marks;
}

/** Arcs of a polygon, with gaps, like struck glass. */
function brokenRing(rand: () => number, [cx, cy]: Point, radius: number): string[] {
  const arcs: string[] = [];
  const sides = 9 + Math.floor(rand() * 4);
  for (let i = 0; i < sides; i++) {
    if (rand() < 0.35) continue;
    const a0 = (i / sides) * Math.PI * 2;
    const a1 = ((i + 1) / sides) * Math.PI * 2;
    const r0 = radius * (0.85 + rand() * 0.3);
    const r1 = radius * (0.85 + rand() * 0.3);
    arcs.push(
      polyline([
        [cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0],
        [cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1]
      ])
    );
  }
  return arcs;
}

/** Long runs fanning inward and along the edges from the corner, some branching. */
function fanRuns(rand: () => number, origin: Point, inward: number, reach: number, viewport: Viewport): string[] {
  const runs: string[] = [];
  const runCount = 4 + Math.floor(rand() * 3);
  for (let i = 0; i < runCount; i++) {
    const spread = (i / Math.max(1, runCount - 1) - 0.5) * 2.4;
    const angle = inward + spread + (rand() - 0.5) * 0.4;
    const length = reach * (0.3 + rand() * 0.4);
    const run = jaggedRun(rand, origin, angle, length, viewport);
    runs.push(polyline(run));
    if (run.length > 4 && rand() < 0.7) {
      const from = run[2 + Math.floor(rand() * (run.length - 3))]!;
      const side = rand() < 0.5 ? -1 : 1;
      runs.push(polyline(jaggedRun(rand, from, angle + side * (0.5 + rand() * 0.6), length * 0.35, viewport)));
    }
  }
  return runs;
}
