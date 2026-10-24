import { fretsInKey, gripById, slideFrets, type ChordColor, type ChordQuality, type Frets, type GripId, type Voicing } from './grips';

/** The five CAGED forms, in the order they walk up a root. */
export type CagedForm = 'C' | 'A' | 'G' | 'E' | 'D';

export interface CagedShape {
  form: CagedForm;
  frets: Frets;
  /** Average sounding fret, so nearby chords can share a neck region. */
  center: number;
}

const FORM_ORDER: Record<CagedForm, number> = { C: 0, A: 1, G: 2, E: 3, D: 4 };

function centerOf(frets: Frets): number {
  const sounding = frets.filter((fret): fret is number => fret !== null);
  if (sounding.length === 0) return 0;
  return sounding.reduce((sum, fret) => sum + fret, 0) / sounding.length;
}

function sameFrets(left: Frets, right: Frets): boolean {
  return left.length === right.length && left.every((fret, index) => fret === right[index]);
}

function accept(form: CagedForm, frets: Frets): CagedShape | null {
  if (frets.some((fret) => fret !== null && (fret < 0 || fret > 12))) return null;
  if (frets.filter((fret) => fret !== null).length < 3) return null;
  return { form, frets, center: centerOf(frets) };
}

function majorForms(neck: number, fifth: number, fourth: number): (CagedShape | null)[] {
  return [
    accept('C', [fifth - 3, fifth - 2, fifth - 3, fifth - 1, fifth, null]),
    accept('A', [fifth, fifth + 2, fifth + 2, fifth + 2, fifth, null]),
    accept('G', [neck, neck - 3, neck - 3, neck - 3, neck - 1, neck]),
    accept('E', [neck, neck, neck + 1, neck + 2, neck + 2, neck]),
    accept('D', [fourth + 2, fourth + 3, fourth + 2, fourth, null, null])
  ];
}

function minorForms(neck: number, fifth: number, fourth: number): (CagedShape | null)[] {
  return [
    accept('C', [fifth - 4, fifth - 2, fifth - 3, fifth - 2, fifth, null]),
    accept('A', [fifth, fifth + 1, fifth + 2, fifth + 2, fifth, null]),
    accept('G', [neck, neck - 4, neck - 3, neck - 3, neck - 2, neck]),
    accept('E', [neck, neck, neck, neck + 2, neck + 2, neck]),
    accept('D', [fourth + 1, fourth + 3, fourth + 2, fourth, null, null])
  ];
}

function dimForms(neck: number, fifth: number, fourth: number): (CagedShape | null)[] {
  return [
    accept('C', [fifth - 4, fifth - 2, fifth - 4, fifth - 2, fifth, null]),
    accept('A', [null, fifth + 1, fifth + 2, fifth + 1, fifth, null]),
    accept('G', [neck, neck - 4, neck - 3, neck - 4, neck - 2, neck]),
    accept('E', [neck, neck - 1, neck, neck + 2, null, neck]),
    accept('D', [fourth + 1, fourth, fourth + 1, fourth, null, null])
  ];
}

const SHAPE_FOR = { major: majorForms, minor: minorForms, dim: dimForms };

function dedupe(candidates: readonly (CagedShape | null)[]): CagedShape[] {
  const seen = new Set<string>();
  const shapes: CagedShape[] = [];
  for (const shape of candidates) {
    if (!shape) continue;
    const key = shape.frets.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    shapes.push(shape);
  }
  return shapes.sort((left, right) => left.center - right.center || FORM_ORDER[left.form] - FORM_ORDER[right.form]);
}

function formsFor(quality: ChordQuality, root: number): CagedShape[] {
  const neck = (root - 4 + 12) % 12;
  const fifth = (root - 9 + 12) % 12;
  const fourth = (root - 2 + 12) % 12;
  return dedupe(SHAPE_FOR[quality](neck, fifth, fourth));
}

/** Playable CAGED forms of one scale chord, lowest on the neck first. */
export function cagedVoicings(id: GripId, color: ChordColor, capo: number): CagedShape[] {
  if (id === 'open') return [];
  const grip = gripById(id);
  const quality = color === 'alt' ? grip.altQuality : grip.scaleQuality;
  const root = (((grip.root + capo) % 12) + 12) % 12;
  return formsFor(quality, root);
}

/** The form closest to a neck region. Ties stay with the lower shape. */
export function nearestVoicing(shapes: readonly CagedShape[], anchor: number): CagedShape | null {
  if (shapes.length === 0) return null;
  return shapes.reduce((best, shape) => (Math.abs(shape.center - anchor) < Math.abs(best.center - anchor) ? shape : best));
}

/** The next form up the neck, wrapping back to the lowest. */
export function nextVoicing(shapes: readonly CagedShape[], current: Frets): CagedShape | null {
  if (shapes.length === 0) return null;
  const here = centerOf(current);
  const higher = shapes.find((shape) => shape.center > here + 0.05 && !sameFrets(shape.frets, current));
  if (higher) return higher;
  return shapes.find((shape) => !sameFrets(shape.frets, current)) ?? shapes[0];
}

/** Frets for the latched chord. A neck anchor pulls every chord toward that region. */
export function fretsForPosition(
  id: GripId,
  voicing: Voicing,
  color: ChordColor,
  keyCapo: number,
  slide: number,
  anchor: number | null
): Frets {
  if (id === 'open' || anchor === null) return fretsInKey(id, voicing, color, keyCapo + slide);
  const shape = nearestVoicing(cagedVoicings(id, color, keyCapo), anchor);
  if (!shape) return fretsInKey(id, voicing, color, keyCapo + slide);
  // Copy so the diagram does not alias the form table.
  return [...(slideFrets(shape.frets, slide) ?? shape.frets)];
}

/** CAGED letter of the shape on the neck, when one matches. */
export function positionForm(id: GripId, color: ChordColor, keyCapo: number, slide: number, frets: Frets): CagedForm | null {
  const shapes = cagedVoicings(id, color, keyCapo).flatMap((shape) => {
    const moved = slideFrets(shape.frets, slide);
    if (!moved) return [];
    return [{ ...shape, frets: moved, center: centerOf(moved) }];
  });
  const exact = shapes.find((shape) => sameFrets(shape.frets, frets));
  return (exact ?? nearestVoicing(shapes, centerOf(frets)))?.form ?? null;
}
