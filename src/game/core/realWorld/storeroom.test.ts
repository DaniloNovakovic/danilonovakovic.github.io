import { describe, expect, it } from 'vitest';
import { aimedFixture } from './interactions';
import {
  distanceTo,
  findCells,
  footprintsOf,
  isSolidAt,
  LAB_ROOM,
  REAL_WORLD_CELL,
  REAL_WORLD_EYE_HEIGHT,
  REAL_WORLD_PLAYER_RADIUS,
  REAL_WORLD_WALL_HEIGHT,
  VENT_CELL
} from './labRoom';
import { SHIP_DECK_DROP, STOREROOM } from './storeroom';
import { floorGrateCentre } from './vent';
import { stepWalker, type Walker } from './walker';

const vent = LAB_ROOM.vent!;
const offset = STOREROOM.offset!;
const hatch = STOREROOM.hatch!;
const DT = 1 / 60;

function walkTo(from: Walker, x: number, z: number, seconds = 8): Walker {
  let walker = from;
  for (let t = 0; t < seconds; t += DT) {
    const dx = x - walker.x;
    const dz = z - walker.z;
    if (Math.hypot(dx, dz) < 0.1) break;
    walker = stepWalker(STOREROOM, walker, { forward: 1, strafe: 0, yaw: Math.atan2(-dx, -dz) }, DT);
  }
  return walker;
}

const landing = (): Walker => ({ x: STOREROOM.wake.x, z: STOREROOM.wake.z, vx: 0, vz: 0 });

describe('the storeroom under the vent', () => {
  it('has its ceiling hatch right under the drop grate', () => {
    const drop = floorGrateCentre(vent, 'o')!;
    expect(offset.x + hatch.x).toBeCloseTo(drop.x);
    expect(offset.z + hatch.z).toBeCloseTo(drop.z);
    expect(offset.y).toBeCloseTo(vent.floor - SHIP_DECK_DROP);
    // Its walls stop below the duct floor.
    expect(offset.y + REAL_WORLD_WALL_HEIGHT).toBeLessThan(vent.floor - 0.05);
  });

  it('lands Danilo under the hatch, on clear floor', () => {
    const { x, z } = STOREROOM.wake;
    expect({ x, z }).toEqual({ x: hatch.x, z: hatch.z });
    expect(isSolidAt(STOREROOM.walls, x, z)).toBe(false);
    for (const footprint of footprintsOf(STOREROOM)) {
      expect(distanceTo(footprint, x, z)).toBeGreaterThan(REAL_WORLD_PLAYER_RADIUS + VENT_CELL / 2);
    }
  });

  it('keeps the walker in: no way through its walls or the shut door', () => {
    const [door] = findCells(STOREROOM.walls, 'D');
    const atDoor = walkTo(landing(), door.x - 5, door.z);
    expect(atDoor.x).toBeGreaterThan(door.x + REAL_WORLD_CELL / 2);
    const deep = walkTo(landing(), 40, 40);
    expect(isSolidAt(STOREROOM.walls, deep.x, deep.z)).toBe(false);
  });

  it('has a clear way from the landing to the door, which is locked', () => {
    const [door] = findCells(STOREROOM.walls, 'D');
    const face = { x: door.x + REAL_WORLD_CELL / 2, z: door.z };
    const atDoor = walkTo(landing(), face.x + 0.6, face.z);
    expect(Math.hypot(atDoor.x - (face.x + 0.6), atDoor.z - face.z)).toBeLessThan(0.15);
    const view = { x: atDoor.x + 1, y: REAL_WORLD_EYE_HEIGHT, z: atDoor.z, yaw: Math.PI / 2, pitch: -0.1 };
    expect(aimedFixture(STOREROOM, view, { grate: true, dropGrate: true })).toBe('door');
  });

  it('is a cramped closet, stocked like one: spares on racks, cleaning things, the sleeping drones', () => {
    const floorCells = STOREROOM.walls.join('').split('.').length - 1;
    expect(floorCells).toBeLessThanOrEqual(6);
    const kinds = new Set(STOREROOM.furniture.map((piece) => piece.kind));
    for (const kind of ['lampShelf', 'supplyShelf', 'mopBucket', 'drums', 'cleanerBot'] as const) {
      expect(kinds.has(kind)).toBe(true);
    }
    // Every wall but the door's has something against it.
    const near = (axis: 'x' | 'z', value: number) =>
      STOREROOM.furniture.some((piece) => Math.abs(piece[axis] - value) < 1.2);
    const inner = { west: REAL_WORLD_CELL, east: (STOREROOM.walls[0].length - 1) * REAL_WORLD_CELL };
    const north = REAL_WORLD_CELL;
    const south = (STOREROOM.walls.length - 1) * REAL_WORLD_CELL;
    expect(near('x', inner.east)).toBe(true);
    expect(near('z', north)).toBe(true);
    expect(near('z', south)).toBe(true);
  });

  it('opens its door onto the corridor: west, towards the bolted grate', () => {
    const [door] = findCells(STOREROOM.walls, 'D');
    const peek = floorGrateCentre(vent, 'g')!;
    expect(offset.x + door.x).toBeGreaterThan(peek.x);
    expect(offset.x).toBeGreaterThan(peek.x + 1.5);
  });
});
