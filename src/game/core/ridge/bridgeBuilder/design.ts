import {
  cellDistance,
  gridKey,
  isAnchor,
  isInBuildArea,
  type BridgeMaterial,
  type BridgePuzzle,
  type GridPoint
} from './puzzle';

export interface BridgeBeamSpec {
  a: GridPoint;
  b: GridPoint;
  material: BridgeMaterial;
}

export type BridgeDesign = readonly BridgeBeamSpec[];

export type AddBeamResult = { ok: true; design: BridgeDesign; replaced: boolean } | { ok: false; reason: string };

/** Grid points a new member may start from: anchors and existing joints. */
export function designJoints(puzzle: BridgePuzzle, design: BridgeDesign): GridPoint[] {
  const seen = new Map<string, GridPoint>();
  for (const anchor of puzzle.anchors) seen.set(gridKey(anchor), anchor);
  for (const beam of design) {
    seen.set(gridKey(beam.a), beam.a);
    seen.set(gridKey(beam.b), beam.b);
  }
  return [...seen.values()];
}

function isJoint(puzzle: BridgePuzzle, design: BridgeDesign, point: GridPoint): boolean {
  if (isAnchor(puzzle, point)) return true;
  return design.some((beam) => samePoint(beam.a, point) || samePoint(beam.b, point));
}

function samePoint(a: GridPoint, b: GridPoint): boolean {
  return a.x === b.x && a.y === b.y;
}

function sameBeam(beam: BridgeBeamSpec, a: GridPoint, b: GridPoint): boolean {
  return (samePoint(beam.a, a) && samePoint(beam.b, b)) || (samePoint(beam.a, b) && samePoint(beam.b, a));
}

/**
 * Add a member from an existing joint to any buildable grid point. Drawing
 * over an existing member swaps its material instead of doubling it.
 */
export function addBeam(
  puzzle: BridgePuzzle,
  design: BridgeDesign,
  a: GridPoint,
  b: GridPoint,
  material: BridgeMaterial
): AddBeamResult {
  if (!isInBuildArea(puzzle, a) || !isInBuildArea(puzzle, b)) {
    return { ok: false, reason: 'That point is off the blueprint.' };
  }
  if (samePoint(a, b)) {
    return { ok: false, reason: 'A beam needs two different points.' };
  }
  if (cellDistance(a, b) > puzzle.maxBeamCells + 1e-9) {
    return { ok: false, reason: 'Too long — beams can reach about two squares.' };
  }
  if (!isJoint(puzzle, design, a) && !isJoint(puzzle, design, b)) {
    return { ok: false, reason: 'Start from a bolt or a joint you already drew.' };
  }
  if (bothOnBankFace(puzzle, a, b)) {
    return { ok: false, reason: 'That would just run along the cliff.' };
  }

  const existing = design.findIndex((beam) => sameBeam(beam, a, b));
  if (existing >= 0) {
    const next = design.map((beam, index) => (index === existing ? { ...beam, material } : beam));
    return { ok: true, design: next, replaced: true };
  }
  return { ok: true, design: [...design, { a, b, material }], replaced: false };
}

/** Members running down a cliff face add nothing and only clutter the plan. */
function bothOnBankFace(puzzle: BridgePuzzle, a: GridPoint, b: GridPoint): boolean {
  const onEdge = a.x === b.x && (a.x === 0 || a.x === puzzle.columns);
  return onEdge && a.y >= 0 && b.y >= 0;
}

export function removeBeamAt(design: BridgeDesign, index: number): BridgeDesign {
  if (index < 0 || index >= design.length) return design;
  return design.filter((_, i) => i !== index);
}

export function designInk(puzzle: BridgePuzzle, design: BridgeDesign): number {
  let ink = 0;
  for (const beam of design) {
    ink += cellDistance(beam.a, beam.b) * puzzle.materials[beam.material].inkPerCell;
  }
  return Math.round(ink * 10) / 10;
}

/** True when connected road members run from the near bank to the far bank. */
export function hasRoadAcross(puzzle: BridgePuzzle, design: BridgeDesign): boolean {
  const links = new Map<string, string[]>();
  for (const beam of design) {
    if (beam.material !== 'road') continue;
    const a = gridKey(beam.a);
    const b = gridKey(beam.b);
    links.set(a, [...(links.get(a) ?? []), b]);
    links.set(b, [...(links.get(b) ?? []), a]);
  }
  const queue = [...links.keys()].filter((key) => key.startsWith('0,'));
  const seen = new Set(queue);
  const farBank = `${puzzle.columns},`;
  while (queue.length > 0) {
    const key = queue.shift()!;
    if (key.startsWith(farBank)) return true;
    for (const next of links.get(key) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return false;
}

/**
 * The Draftsperson's own sketch: a deck with a simple triangle truss above it.
 * Offered as a traceable hint, and used by console/AI playtests.
 */
export const DRAFTSPERSON_SKETCH: BridgeDesign = buildSketch();

function buildSketch(): BridgeBeamSpec[] {
  const beams: BridgeBeamSpec[] = [];
  const p = (x: number, y: number): GridPoint => ({ x, y });
  for (let x = 0; x < 8; x += 2) {
    beams.push({ a: p(x, 0), b: p(x + 2, 0), material: 'road' });
  }
  // Warren truss: apexes over each deck panel, joined along the top.
  for (let x = 0; x < 8; x += 2) {
    beams.push({ a: p(x, 0), b: p(x + 1, -2), material: 'wood' });
    beams.push({ a: p(x + 1, -2), b: p(x + 2, 0), material: 'wood' });
  }
  for (let x = 1; x < 7; x += 2) {
    beams.push({ a: p(x, -2), b: p(x + 2, -2), material: 'wood' });
  }
  return beams;
}
