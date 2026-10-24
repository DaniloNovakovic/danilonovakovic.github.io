/**
 * Latched chord grips for the hobby guitar.
 *
 * A guitar needs a fretting hand and a picking hand. On a laptop the fretting
 * hand is one key: the shape stays held until the next chord, and every string
 * then sounds at that fret (or chucks if the shape mutes it). The shapes are
 * the open G / Em campfire set, so any order still sits in one key.
 *
 * `frets` is string 1 (high E) → string 6 (low E). `null` is a muted string.
 * Fret numbers are semitones above the open string.
 */

export type GripId = 'em' | 'g' | 'd' | 'c' | 'am' | 'open';

export interface ChordGrip {
  id: GripId;
  /** Keyboard key, lowercase. */
  key: string;
  frets: readonly (number | null)[];
}

export const CHORD_GRIPS: readonly ChordGrip[] = [
  { id: 'em', key: 'q', frets: [0, 0, 0, 2, 2, 0] },
  { id: 'g', key: 'w', frets: [3, 0, 0, 0, 2, 3] },
  { id: 'd', key: 'e', frets: [2, 3, 2, 0, null, null] },
  { id: 'c', key: 'r', frets: [0, 1, 0, 2, 3, null] },
  { id: 'am', key: 't', frets: [0, 1, 2, 2, 0, null] },
  { id: 'open', key: 'y', frets: [0, 0, 0, 0, 0, 0] }
];

/** Sticky-note song: vi–I–V–IV in G, the four keys Q W E R. */
export const CAMPFIRE: readonly GripId[] = ['em', 'g', 'd', 'c'];

const GRIP_BY_ID = new Map(CHORD_GRIPS.map((grip) => [grip.id, grip]));

export function gripById(id: GripId): ChordGrip {
  const grip = GRIP_BY_ID.get(id);
  if (!grip) throw new Error(`Unknown chord grip: ${id}`);
  return grip;
}

const PITCHES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export function frettedFrequency(openFrequency: number, fret: number): number {
  return openFrequency * 2 ** (fret / 12);
}

/** Equal-tempered note name for an open-string frequency stopped at `fret`. */
export function noteLabel(openFrequency: number, fret: number): string {
  const midi = Math.round(69 + 12 * Math.log2(openFrequency / 440)) + fret;
  const pitch = PITCHES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${pitch}${octave}`;
}
