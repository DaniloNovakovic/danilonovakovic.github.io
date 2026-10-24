import { fretsForPosition } from './caged';
import { gripById, lowestSoundingIndex, type ChordColor, type ChordQuality, type Frets, type GripId, type Voicing } from './grips';

/** Added colors. 2 is the 9th, 4 the 11th, 6 the 6th, 7 the 7th. */
export type Extension = 2 | 4 | 6 | 7;

const OPEN_PITCH = [4, 11, 7, 2, 9, 4];
const TONES: readonly Extension[] = [2, 4, 6, 7];

const MAJOR_TAGS: Record<string, string> = {
  '2': 'add9',
  '4': 'add11',
  '24': 'add9',
  '6': '6',
  '26': '6/9',
  '46': '6',
  '246': '6/9',
  '7': '7',
  '27': '9',
  '47': '7',
  '247': '9',
  '67': '13',
  '267': '13',
  '467': '13',
  '2467': '13'
};

const MINOR_TAGS: Record<string, string> = {
  '2': 'madd9',
  '4': 'madd11',
  '24': 'madd9',
  '6': 'm6',
  '26': 'm6/9',
  '46': 'm6',
  '246': 'm6/9',
  '7': 'm7',
  '27': 'm9',
  '47': 'm7',
  '247': 'm9',
  '67': 'm13',
  '267': 'm13',
  '467': 'm13',
  '2467': 'm13'
};

const DIM_TAGS: Record<string, string> = {
  '2': '°add9',
  '4': '°add11',
  '24': '°add9',
  '6': '°6',
  '26': '°6',
  '46': '°6',
  '246': '°6',
  '7': '°7',
  '27': '°7',
  '47': '°7',
  '247': '°7',
  '67': '°7',
  '267': '°7',
  '467': '°7',
  '2467': '°7'
};

const TAGS: Record<ChordQuality, Record<string, string>> = {
  major: MAJOR_TAGS,
  minor: MINOR_TAGS,
  dim: DIM_TAGS
};

function toneKey(extensions: readonly Extension[]): string {
  return TONES.filter((tone) => extensions.includes(tone)).join('');
}

function toneTag(quality: ChordQuality, extensions: readonly Extension[]): string {
  return TAGS[quality][toneKey(extensions)] ?? '';
}

/** Chord name with the latched colors, such as G7 or Emadd9. */
export function chordLabel(name: string, quality: ChordQuality, extensions: readonly Extension[]): string {
  if (extensions.length === 0 || name === 'Open') return name;
  const root = name.replace(/m$|°$/, '');
  return `${root}${toneTag(quality, extensions)}`;
}

function intervalFor(quality: ChordQuality, extension: Extension): number {
  if (extension === 2) return 2;
  if (extension === 4) return 5;
  if (extension === 6) return 9;
  return quality === 'dim' ? 9 : 10;
}

function nearestFret(open: number, fret: number, target: number): { fret: number; distance: number } | null {
  let best: { fret: number; distance: number } | null = null;
  for (let candidate = 0; candidate <= 12; candidate += 1) {
    if ((open + candidate) % 12 !== target) continue;
    const distance = Math.abs(candidate - fret);
    if (distance === 0 || distance > 4) continue;
    if (!best || distance < best.distance) best = { fret: candidate, distance };
  }
  return best;
}

function closestString(
  frets: readonly (number | null)[],
  target: number,
  used: ReadonlySet<number>
): { string: number; fret: number } | null {
  let best: { string: number; fret: number; distance: number } | null = null;
  frets.forEach((fret, index) => {
    if (fret === null || used.has(index)) return;
    const moved = nearestFret(OPEN_PITCH[index] ?? 0, fret, target);
    if (!moved || (best && moved.distance >= best.distance)) return;
    best = { string: index, fret: moved.fret, distance: moved.distance };
  });
  return best;
}

function retune(frets: (number | null)[], root: number, interval: number, used: Set<number>) {
  const target = (root + interval) % 12;
  const already = frets.findIndex(
    (fret, index) => fret !== null && !used.has(index) && ((OPEN_PITCH[index] ?? 0) + fret) % 12 === target
  );
  if (already !== -1) {
    used.add(already);
    return;
  }
  const choice = closestString(frets, target, used);
  if (!choice) return;
  frets[choice.string] = choice.fret;
  used.add(choice.string);
}

/** Move a nearby string onto each requested color. The bass note stays put. */
export function colorFrets(frets: Frets, root: number, quality: ChordQuality, extensions: readonly Extension[]): Frets {
  if (extensions.length === 0) return frets;
  const next = [...frets];
  const used = new Set<number>();
  const bass = lowestSoundingIndex(next);
  if (bass !== null) used.add(bass);
  for (const extension of TONES) {
    if (!extensions.includes(extension)) continue;
    retune(next, root, intervalFor(quality, extension), used);
  }
  return next;
}

/** Frets the player hears: the CAGED shape, then any latched colors. */
export function playedFrets(
  id: GripId,
  voicing: Voicing,
  color: ChordColor,
  keyCapo: number,
  anchor: number | null,
  extensions: readonly Extension[]
): Frets {
  const plain = fretsForPosition(id, voicing, color, keyCapo, 0, anchor);
  if (id === 'open') return plain;
  const grip = gripById(id);
  const quality = color === 'alt' ? grip.altQuality : grip.scaleQuality;
  const root = (((grip.root + keyCapo) % 12) + 12) % 12;
  return colorFrets(plain, root, quality, extensions);
}
