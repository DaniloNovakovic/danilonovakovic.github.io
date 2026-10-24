/**
 * Latched chord grips for the hobby guitar, in G major.
 *
 * The letter plays that scale degree: G Am Bm C D Em, and F is F#°.
 * Shift is the other fingering. Option flips major and minor (F#° flips to F#m).
 * `-` and `=` slide the latched shape one fret, which is how D# and the rest appear.
 *
 * Right hand: I 9 0 are G, B, and high E. N M J are low E, A, and D.
 *
 * Frets are string 1 (high E) → string 6 (low E). `null` is muted.
 */

export type GripId = 'g' | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'open';
export type Voicing = 'low' | 'high';
export type ChordColor = 'scale' | 'alt';
export type ChordQuality = 'major' | 'minor' | 'dim';
export type Frets = readonly (number | null)[];

interface Voicings {
  low: Frets;
  high: Frets;
}

export interface ChordGrip {
  id: GripId;
  /** Keyboard key, lowercase. */
  key: string;
  /** Pitch class of the scale root. C = 0. */
  root: number;
  scaleQuality: ChordQuality;
  altQuality: ChordQuality;
  scale: Voicings;
  alt: Voicings;
}

const OPEN_STRINGS: Frets = [0, 0, 0, 0, 0, 0];

/** Scale order, so the buttons themselves stay inside G major. */
export const CHORD_GRIPS: readonly ChordGrip[] = [
  {
    id: 'g',
    key: 'g',
    root: 7,
    scaleQuality: 'major',
    altQuality: 'minor',
    scale: { low: [3, 0, 0, 0, 2, 3], high: [3, 3, 4, 5, null, null] },
    alt: { low: [3, 3, 3, 5, null, null], high: [3, 3, 3, 5, 5, 3] }
  },
  {
    id: 'a',
    key: 'a',
    root: 9,
    scaleQuality: 'minor',
    altQuality: 'major',
    scale: { low: [0, 1, 2, 2, 0, null], high: [5, 5, 5, 7, 7, 5] },
    alt: { low: [0, 2, 2, 2, 0, null], high: [5, 5, 6, 7, 7, 5] }
  },
  {
    id: 'b',
    key: 'b',
    root: 11,
    scaleQuality: 'minor',
    altQuality: 'major',
    scale: { low: [2, 3, 4, 4, 2, null], high: [7, 7, 7, 9, 9, 7] },
    alt: { low: [2, 4, 4, 4, 2, null], high: [7, 7, 8, 9, 9, 7] }
  },
  {
    id: 'c',
    key: 'c',
    root: 0,
    scaleQuality: 'major',
    altQuality: 'minor',
    scale: { low: [0, 1, 0, 2, 3, null], high: [3, 5, 5, 5, null, null] },
    alt: { low: [3, 4, 5, 5, 3, null], high: [8, 8, 8, 10, null, null] }
  },
  {
    id: 'd',
    key: 'd',
    root: 2,
    scaleQuality: 'major',
    altQuality: 'minor',
    scale: { low: [2, 3, 2, 0, null, null], high: [null, null, 2, 4, 5, null] },
    alt: { low: [1, 3, 2, 0, null, null], high: [5, 6, 7, 7, 5, null] }
  },
  {
    id: 'e',
    key: 'e',
    root: 4,
    scaleQuality: 'minor',
    altQuality: 'major',
    scale: { low: [0, 0, 0, 2, 2, 0], high: [3, 5, 4, 2, null, null] },
    alt: { low: [0, 0, 1, 2, 2, 0], high: [4, 5, 4, 2, null, null] }
  },
  {
    id: 'f',
    key: 'f',
    root: 6,
    scaleQuality: 'dim',
    altQuality: 'minor',
    scale: { low: [2, 1, 2, 4, null, 2], high: [5, 4, 5, 4, null, null] },
    alt: { low: [2, 2, 2, 4, 4, 2], high: [2, 2, 2, 4, null, null] }
  },
  {
    id: 'open',
    key: 'z',
    root: 4,
    scaleQuality: 'major',
    altQuality: 'major',
    scale: { low: OPEN_STRINGS, high: OPEN_STRINGS },
    alt: { low: OPEN_STRINGS, high: OPEN_STRINGS }
  }
];

/**
 * Right-hand picks, high E first.
 * I 9 0 = G, B, high E. N M J = low E, A, D.
 */
export const STRING_PICKS = [
  { key: '0', string: 1 },
  { key: '9', string: 2 },
  { key: 'i', string: 3 },
  { key: 'j', string: 4 },
  { key: 'm', string: 5 },
  { key: 'n', string: 6 }
] as const;

/** On-screen rows match the keys under the right hand, treble above bass. */
export const PICK_ROWS = [
  ['i', '9', '0'],
  ['n', 'm', 'j']
] as const;

/** Sticky-note song: I–V–IV–I in G. */
export const CAMPFIRE: readonly GripId[] = ['g', 'd', 'c', 'g'];

const GRIP_BY_ID = new Map(CHORD_GRIPS.map((grip) => [grip.id, grip]));
const PITCHES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const QUALITY_SUFFIX: Record<ChordQuality, string> = { major: '', minor: 'm', dim: '°' };

export function gripById(id: GripId): ChordGrip {
  const grip = GRIP_BY_ID.get(id);
  if (!grip) throw new Error(`Unknown chord grip: ${id}`);
  return grip;
}

export function fretsFor(id: GripId, voicing: Voicing, color: ChordColor = 'scale'): Frets {
  const grip = gripById(id);
  const pair = id === 'open' || color === 'scale' ? grip.scale : grip.alt;
  return voicing === 'high' ? pair.high : pair.low;
}

/** Moves a shape up or down the neck. Returns null when a fret would leave 0–12. */
export function slideFrets(frets: Frets, capo: number): Frets | null {
  if (capo === 0) return frets;
  const moved = frets.map((fret) => (fret === null ? null : fret + capo));
  if (moved.some((fret) => fret !== null && (fret < 0 || fret > 12))) return null;
  return moved;
}

/** Lowest string that speaks in the shape. Index 5 is the low E. Muted strings are skipped. */
export function lowestSoundingIndex(frets: readonly (number | null)[]): number | null {
  for (let index = frets.length - 1; index >= 0; index -= 1) {
    if (frets[index] !== null) return index;
  }
  return null;
}

export function pickForKey(key: string): (typeof STRING_PICKS)[number] | undefined {
  const letter = key.toLowerCase();
  return STRING_PICKS.find((pick) => pick.key === letter);
}

/** Sounding name, including a flipped quality or a slid root. */
export function chordName(id: GripId, color: ChordColor, capo = 0): string {
  if (id === 'open') return 'Open';
  const grip = gripById(id);
  const quality = color === 'alt' ? grip.altQuality : grip.scaleQuality;
  const pitch = PITCHES[(((grip.root + capo) % 12) + 12) % 12];
  return `${pitch}${QUALITY_SUFFIX[quality]}`;
}

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
