import type { Point3 } from './aim';
import { REAL_WORLD_EYE_HEIGHT, VENT_CELL, type VentDuct } from './labRoom';

/** Eye height above the duct floor on hands and knees. */
const CRAWL_EYE = 0.72;

const OPEN_CELLS = new Set(['m', '.', 'g', 'o']);

function ventCellAt(vent: VentDuct, x: number, z: number): string {
  const column = Math.floor((x - vent.origin.x) / VENT_CELL);
  const row = Math.floor((z - vent.origin.z) / VENT_CELL);
  return vent.plan[row]?.[column] ?? ' ';
}

/** Somewhere a crawler fits: the mouth, the duct, or a floor grate. */
export function isOpenDuct(vent: VentDuct, x: number, z: number): boolean {
  return OPEN_CELLS.has(ventCellAt(vent, x, z));
}

/** A duct cell's middle in the world, with its plan position. */
export interface DuctCell {
  char: string;
  column: number;
  row: number;
  x: number;
  z: number;
}

/** Every open cell of the plan, mouth included. */
export function ductCells(vent: VentDuct): DuctCell[] {
  const cells: DuctCell[] = [];
  vent.plan.forEach((line, row) => {
    [...line].forEach((char, column) => {
      if (!OPEN_CELLS.has(char)) return;
      cells.push({
        char,
        column,
        row,
        x: vent.origin.x + (column + 0.5) * VENT_CELL,
        z: vent.origin.z + (row + 0.5) * VENT_CELL
      });
    });
  });
  return cells;
}

/** The mouth cell, and the way into the duct from it (a unit step on the plan). */
export interface VentMouth {
  x: number;
  z: number;
  dx: number;
  dz: number;
}

const mouths = new WeakMap<VentDuct, VentMouth>();
export function mouthOf(vent: VentDuct): VentMouth {
  let mouth = mouths.get(vent);
  if (!mouth) {
    const cell = ductCells(vent).find((candidate) => candidate.char === 'm');
    if (!cell) throw new Error('A vent duct needs a mouth (m) in its plan.');
    const [dx, dz] = (
      [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ] as const
    ).find(([sx, sz]) => isOpenDuct(vent, cell.x + sx * VENT_CELL, cell.z + sz * VENT_CELL)) ?? [1, 0];
    mouth = { x: cell.x, z: cell.z, dx, dz };
    mouths.set(vent, mouth);
  }
  return mouth;
}

/** The middle of the grate Danilo pries off: the mouth's inner edge, halfway up the opening. */
export function grateCentre(vent: VentDuct): Point3 {
  const mouth = mouthOf(vent);
  return {
    x: mouth.x + (mouth.dx * VENT_CELL) / 2,
    y: vent.floor + vent.height / 2,
    z: mouth.z + (mouth.dz * VENT_CELL) / 2
  };
}

/** A floor grate in the duct: `g` bolted from below, `o` the one that opens. */
export type FloorGrate = 'g' | 'o';

/** The middle of a floor grate, in the duct floor. */
export function floorGrateCentre(vent: VentDuct, kind: FloorGrate): Point3 | null {
  const cell = ductCells(vent).find((candidate) => candidate.char === kind);
  return cell ? { x: cell.x, y: vent.floor, z: cell.z } : null;
}

/** Over the opened drop grate: nothing left to hold you up. */
export function isOverDrop(vent: VentDuct | undefined, dropOpen: boolean, x: number, z: number): boolean {
  return !!vent && dropOpen && ventCellAt(vent, x, z) === 'o';
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * How far down Danilo is: 0 standing, 1 on hands and knees. Inside the duct
 * it's always 1; across the mouth it eases down the closer to the opening,
 * so walking up to an open vent ducks into it. A closed vent never crouches.
 */
export function crawlAmount(vent: VentDuct | undefined, open: boolean, x: number, z: number): number {
  if (!vent || !open) return 0;
  const cell = ventCellAt(vent, x, z);
  if (cell === '.' || cell === 'g' || cell === 'o') return 1;
  if (cell !== 'm') return 0;
  const mouth = mouthOf(vent);
  const depth = ((x - mouth.x) * mouth.dx + (z - mouth.z) * mouth.dz) / VENT_CELL + 0.5;
  return smooth(Math.max(0, Math.min(1, depth)));
}

/** Eye height for a crawl amount. */
export function eyeHeightFor(vent: VentDuct | undefined, crawl: number): number {
  if (!vent) return REAL_WORLD_EYE_HEIGHT;
  return REAL_WORLD_EYE_HEIGHT + (vent.floor + CRAWL_EYE - REAL_WORLD_EYE_HEIGHT) * crawl;
}
