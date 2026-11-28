import { BoxGeometry, Group, Mesh, PointLight, type Material } from 'three';
import {
  ductCells,
  floorGrateCentre,
  grateCentre,
  isOpenDuct,
  mouthOf,
  NEIGHBOURS,
  REAL_WORLD_WALL_HEIGHT,
  SHIP_DECK_DROP,
  VENT_CELL,
  type DuctCell,
  type Pryable,
  type VentDuct
} from '@/game/core/realWorld';
import { ventGrate, type PropKit } from './labProps';
import { NIGHT_LAB } from './toon';

/** Duct sheet metal: darker than the lab, so the tunnel reads as the dark between lights. */
const DUCT = 0x262f5a;
const DUCT_SEAM = 0x1d2340;
const SHEET = 0.06;
const GRATE_FALL_SECONDS = 0.45;
/** How far prying bends the grate's top out, in radians. */
const PRY_BEND = 0.28;

function box(width: number, height: number, depth: number, material: Material, x = 0, y = 0, z = 0) {
  const mesh = new Mesh(new BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  return mesh;
}

/** A group at the cell's middle, turned so its +z points out through side (dx, dz). */
function facingSide(cell: DuctCell, [dx, dz]: readonly [number, number]) {
  const group = new Group();
  group.position.set(cell.x, 0, cell.z);
  group.rotation.y = Math.atan2(dx, dz);
  return group;
}

interface DuctParts {
  vent: VentDuct;
  sheet: Material;
  seam: Material;
}

/**
 * One side of a duct cell: sheet metal where the plan is closed, a seam ring
 * where it joins the next cell (on the + sides only, so each join gets one).
 */
function ductSide({ vent, sheet, seam }: DuctParts, cell: DuctCell, side: readonly [number, number]) {
  const open = isOpenDuct(vent, cell.x + side[0] * VENT_CELL, cell.z + side[1] * VENT_CELL);
  if (open && (side[0] < 0 || side[1] < 0)) return null;
  const { floor, height } = vent;
  const middle = floor + height / 2;
  const edge = VENT_CELL / 2;
  const group = facingSide(cell, side);
  if (!open) return group.add(box(VENT_CELL, height, SHEET, sheet, 0, middle, edge + SHEET / 2));
  group.add(box(VENT_CELL, 0.05, 0.08, seam, 0, floor + 0.02, edge));
  group.add(box(VENT_CELL, 0.05, 0.08, seam, 0, floor + height - 0.02, edge));
  for (const across of [-1, 1]) group.add(box(0.08, height, 0.08, seam, across * (edge - 0.03), middle, edge));
  return group;
}

/** The duct's sheet-metal tube: floor, ceiling and sides, cell by cell. */
function duct(kit: PropKit, vent: VentDuct, root: Group) {
  const parts: DuctParts = { vent, sheet: kit.toon(DUCT), seam: kit.toon(DUCT_SEAM) };
  const { floor, height } = vent;
  // The mouth is lab floor, and the far grate is its own floor.
  for (const cell of ductCells(vent).filter((candidate) => candidate.char !== 'm')) {
    if (cell.char === '.') root.add(box(VENT_CELL, SHEET, VENT_CELL, parts.sheet, cell.x, floor - SHEET / 2, cell.z));
    root.add(box(VENT_CELL, SHEET, VENT_CELL, parts.sheet, cell.x, floor + height + SHEET / 2, cell.z));
    for (const side of NEIGHBOURS) {
      const piece = ductSide(parts, cell, side);
      if (piece) root.add(piece);
    }
  }
}

/** A floor grate: frame and wide-gapped slats; the bolted one shows its bolt heads underneath. */
function floorGrate(kit: PropKit, bolted: boolean) {
  const group = new Group();
  const steel = kit.toon(DUCT_SEAM);
  const half = VENT_CELL / 2;
  for (const side of [-1, 1]) {
    group.add(box(VENT_CELL, 0.06, 0.12, steel, 0, 0, side * (half - 0.06)));
    group.add(box(0.12, 0.06, VENT_CELL, steel, side * (half - 0.06), 0, 0));
    // Bolted from below: heads you can see but not reach.
    for (const other of bolted ? [-1, 1] : [])
      group.add(box(0.08, 0.04, 0.08, kit.toon(NIGHT_LAB.steel), side * (half - 0.06), -0.06, other * (half - 0.06)));
  }
  // Wide gaps: enough to see down into the corridor, too narrow to fit through.
  for (let i = -2; i <= 2; i++) group.add(box(0.06, 0.05, VENT_CELL - 0.2, steel, i * 0.25, 0, 0));
  return group;
}

/** A short dark shaft under a floor grate, down to the deck's ceiling, so nothing shows round its edges. */
function shaftUnder(kit: PropKit, vent: VentDuct, centre: { x: number; z: number }, root: Group) {
  const depth = SHIP_DECK_DROP - REAL_WORLD_WALL_HEIGHT;
  const material = kit.toon(DUCT_SEAM);
  for (const side of NEIGHBOURS) {
    const wall = box(side[0] ? SHEET : VENT_CELL, depth, side[1] ? SHEET : VENT_CELL, material);
    wall.position.set(
      centre.x + side[0] * (VENT_CELL / 2 + SHEET / 2),
      vent.floor - depth / 2,
      centre.z + side[1] * (VENT_CELL / 2 + SHEET / 2)
    );
    root.add(wall);
  }
}

/**
 * The bolted grate over the corridor: warm light comes up through its slats,
 * the only light in the duct. Below is the real ship deck (built with its own
 * room), where the researcher walks its round.
 */
function peekGrate(kit: PropKit, vent: VentDuct, root: Group) {
  const peek = floorGrateCentre(vent, 'g');
  if (!peek) return;
  const grate = floorGrate(kit, true);
  grate.position.set(peek.x, vent.floor - 0.03, peek.z);
  const glow = new PointLight(NIGHT_LAB.strip, 1.1, 3.5, 1.5);
  glow.position.set(peek.x, vent.floor + 0.25, peek.z);
  root.add(grate, glow);
  shaftUnder(kit, vent, peek, root);
}

/** The lab-side grate, hinged at its foot: prying bends its top out, opening tips it flat onto the floor. */
function hingedGrate(kit: PropKit, vent: VentDuct) {
  const mouth = mouthOf(vent);
  const centre = grateCentre(vent);
  const hinge = new Group();
  // Turn to face the room first, then tilt about the hinge's own foot.
  hinge.rotation.order = 'YXZ';
  hinge.position.set(centre.x - mouth.dx * 0.08, vent.floor, centre.z - mouth.dz * 0.08);
  hinge.rotation.y = Math.atan2(-mouth.dx, -mouth.dz);
  const grate = ventGrate(kit);
  grate.position.y = vent.height / 2;
  hinge.add(grate);

  let progress = 0;
  let fallFrom = 0;
  /** -1 while it's on; then the time it started to fall; Infinity once down. */
  let fellAt = -1;
  let now = 0;
  const lie = (t: number) => {
    const e = t * t;
    hinge.rotation.x = fallFrom + (Math.PI / 2 - fallFrom) * e;
    hinge.position.y = vent.floor * (1 - e) + 0.04 * e;
    grate.position.x = 0;
  };
  return {
    hinge,
    setPry(next: number) {
      if (fellAt >= 0) return;
      progress = next;
      hinge.rotation.x = progress * PRY_BEND;
    },
    open() {
      if (fellAt >= 0) return;
      fallFrom = hinge.rotation.x;
      fellAt = kit.reducedMotion ? Infinity : now;
      if (kit.reducedMotion) lie(1);
    },
    update(seconds: number) {
      now = seconds;
      if (fellAt === Infinity) return;
      if (fellAt >= 0) {
        const t = Math.min(1, (seconds - fellAt) / GRATE_FALL_SECONDS);
        lie(t);
        if (t >= 1) fellAt = Infinity;
      } else if (progress > 0 && !kit.reducedMotion) {
        // A strained rattle while it gives.
        grate.position.x = Math.sin(seconds * 47) * 0.012 * progress;
      }
    }
  };
}

interface GrateView {
  setPry(progress: number): void;
  open(): void;
  update(seconds: number): void;
}

/**
 * The grate over the storeroom hatch: prying lifts one edge and rattles it,
 * then it drops through, down to the storeroom floor. A short dark shaft
 * joins the duct to the storeroom ceiling.
 */
function dropGrate(kit: PropKit, vent: VentDuct, root: Group): GrateView | null {
  const centre = floorGrateCentre(vent, 'o');
  if (!centre) return null;
  shaftUnder(kit, vent, centre, root);
  const grate = floorGrate(kit, false);
  const top = vent.floor - 0.03;
  const bottom = vent.floor - SHIP_DECK_DROP + 0.04;
  grate.position.set(centre.x, top, centre.z);
  root.add(grate);
  let progress = 0;
  /** -1 while it's in; then when it started to fall; Infinity once down. */
  let fellAt = -1;
  let now = 0;
  const fall = (t: number) => {
    grate.position.y = top + (bottom - top) * t * t;
    grate.rotation.z = 0.12 + Math.sin(t * Math.PI) * 0.5;
    if (t >= 1) grate.rotation.set(0, 0.4, 0);
  };
  return {
    setPry(next) {
      if (fellAt >= 0) return;
      progress = next;
      grate.rotation.z = progress * 0.12;
    },
    open() {
      if (fellAt >= 0) return;
      fellAt = kit.reducedMotion ? Infinity : now;
      if (kit.reducedMotion) fall(1);
    },
    update(seconds) {
      now = seconds;
      if (fellAt === Infinity) return;
      if (fellAt < 0) {
        if (progress > 0 && !kit.reducedMotion)
          grate.position.y = top + Math.abs(Math.sin(seconds * 41)) * 0.02 * progress;
        return;
      }
      const t = Math.min(1, (seconds - fellAt) / GRATE_FALL_SECONDS);
      fall(t);
      if (t >= 1) fellAt = Infinity;
    }
  };
}

export interface LabVent {
  root: Group;
  /** How far a grate has been worked loose, 0..1: it bends or lifts, and rattles. */
  setPry(grate: Pryable, progress: number): void;
  /** The grate comes off: the lab one tips onto the floor, the drop one falls through. */
  open(grate: Pryable): void;
  update(seconds: number): void;
}

/**
 * The lab vent from its plan: the grate to pry off, the dark duct, the bolted
 * grate over the corridor, and the grate that drops into the storeroom.
 */
export function buildVent(kit: PropKit, vent: VentDuct): LabVent {
  const root = new Group();
  duct(kit, vent, root);
  const lab = hingedGrate(kit, vent);
  root.add(lab.hinge);
  const grates: Partial<Record<Pryable, GrateView>> = { grate: lab };
  const drop = dropGrate(kit, vent, root);
  if (drop) grates.dropGrate = drop;
  peekGrate(kit, vent, root);
  return {
    root,
    setPry: (grate, progress) => grates[grate]?.setPry(progress),
    open: (grate) => grates[grate]?.open(),
    update(seconds) {
      lab.update(seconds);
      drop?.update(seconds);
    }
  };
}
