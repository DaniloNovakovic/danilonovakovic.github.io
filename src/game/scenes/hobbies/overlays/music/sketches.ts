import type { GripId } from './grips';

export type SketchId = 'campfire' | 'porch' | 'soda' | 'window' | 'booth' | 'truck';

export interface Sketch {
  id: SketchId;
  /** Roman-numeral title printed under the nickname. */
  figures: string;
  steps: readonly GripId[];
  /** Only the campfire sketch loosens a spare string. */
  reward: boolean;
}

const SKETCHES: readonly Sketch[] = [
  { id: 'campfire', figures: 'I–V–vi–IV–I', steps: ['g', 'd', 'e', 'c', 'g'], reward: true },
  { id: 'porch', figures: 'I–IV–I–V–IV–I', steps: ['g', 'c', 'g', 'd', 'c', 'g'], reward: false },
  { id: 'soda', figures: 'I–vi–IV–V', steps: ['g', 'e', 'c', 'd'], reward: false },
  { id: 'window', figures: 'vi–IV–I–V', steps: ['e', 'c', 'g', 'd'], reward: false },
  { id: 'booth', figures: 'ii–V–I', steps: ['a', 'd', 'g'], reward: false },
  { id: 'truck', figures: 'I–IV–V–IV', steps: ['g', 'c', 'd', 'c'], reward: false }
];

export function sketchById(id: SketchId): Sketch {
  return SKETCHES.find((sketch) => sketch.id === id) ?? SKETCHES[0]!;
}

export function stepSketch(id: SketchId, delta: number): Sketch {
  const index = SKETCHES.findIndex((sketch) => sketch.id === id);
  const next = (Math.max(index, 0) + delta + SKETCHES.length) % SKETCHES.length;
  return SKETCHES[next] ?? SKETCHES[0]!;
}
