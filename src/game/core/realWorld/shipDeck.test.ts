import { describe, expect, it } from 'vitest';
import { aimedFixture } from './interactions';
import { GLIMPSE } from './glimpse';
import {
  cellAt,
  distanceTo,
  findCells,
  footprintsOf,
  isSolidAt,
  LAB_ROOM,
  NEIGHBOURS,
  REAL_WORLD_CELL,
  REAL_WORLD_EYE_HEIGHT,
  REAL_WORLD_PLAYER_RADIUS,
  REAL_WORLD_WALL_HEIGHT,
  VENT_CELL
} from './labRoom';
import { DECK_ESCAPE, SHIP_DECK, SHIP_DECK_DROP } from './shipDeck';
import { floorGrateCentre } from './vent';
import { stepWalker, type Walker } from './walker';

const vent = LAB_ROOM.vent!;
const offset = SHIP_DECK.offset!;
const hatch = SHIP_DECK.hatch!;
const DT = 1 / 60;
const SHUT = { vent: false, doors: false };
const OPEN = { vent: false, doors: true };

function walkTo(from: Walker, x: number, z: number, ways = SHUT, seconds = 12): Walker {
  let walker = from;
  for (let t = 0; t < seconds; t += DT) {
    const dx = x - walker.x;
    const dz = z - walker.z;
    if (Math.hypot(dx, dz) < 0.1) break;
    walker = stepWalker(SHIP_DECK, walker, { forward: 1, strafe: 0, yaw: Math.atan2(-dx, -dz) }, DT, ways);
  }
  return walker;
}

function walkRoute(route: ReadonlyArray<readonly [number, number]>, ways = OPEN): Walker {
  let walker = landing();
  for (const [x, z] of route) {
    walker = walkTo(walker, x, z, ways);
    expect(Math.hypot(walker.x - x, walker.z - z), `stuck before ${x}, ${z}`).toBeLessThan(0.15);
  }
  return walker;
}

const landing = (): Walker => ({ x: SHIP_DECK.wake.x, z: SHIP_DECK.wake.z, vx: 0, vz: 0 });
const [serviceDoor] = findCells(SHIP_DECK.walls, 'S');
const toWorld = (x: number, z: number) => ({ x: offset.x + x, z: offset.z + z });

describe('the ship deck under the vent', () => {
  it('has its ceiling hatch right under the drop grate, and a skylight under the bolted one', () => {
    const drop = floorGrateCentre(vent, 'o')!;
    expect(toWorld(hatch.x, hatch.z).x).toBeCloseTo(drop.x);
    expect(toWorld(hatch.x, hatch.z).z).toBeCloseTo(drop.z);
    const peek = floorGrateCentre(vent, 'g')!;
    const [skylight] = SHIP_DECK.skylights!;
    expect(toWorld(skylight.x, skylight.z).x).toBeCloseTo(peek.x);
    expect(toWorld(skylight.x, skylight.z).z).toBeCloseTo(peek.z);
    expect(offset.y).toBeCloseTo(vent.floor - SHIP_DECK_DROP);
    // Its walls stop below the duct floor.
    expect(offset.y + REAL_WORLD_WALL_HEIGHT).toBeLessThan(vent.floor - 0.05);
  });

  it('puts the corridor right under the bolted grate, lit there, with the researcher’s glimpse along it', () => {
    const [skylight] = SHIP_DECK.skylights!;
    expect(cellAt(SHIP_DECK.walls, skylight.x, skylight.z)).toBe('.');
    // The corridor runs north–south: walls either side of the grate, floor along it.
    expect(isSolidAt(SHIP_DECK.walls, skylight.x - REAL_WORLD_CELL, skylight.z)).toBe(true);
    expect(isSolidAt(SHIP_DECK.walls, skylight.x + REAL_WORLD_CELL, skylight.z)).toBe(true);
    for (let along = GLIMPSE.start; along <= GLIMPSE.end; along += 0.5) {
      expect(isSolidAt(SHIP_DECK.walls, skylight.x + 0.5, skylight.z + along)).toBe(false);
    }
    const lit = SHIP_DECK.strips!.some(
      (strip) => Math.hypot(strip.x - skylight.x, strip.z - (skylight.z + GLIMPSE.stop)) < 1.2
    );
    expect(lit).toBe(true);
    // No strip hangs in the skylight.
    for (const strip of SHIP_DECK.strips!) {
      const clear =
        Math.abs(strip.x - skylight.x) > VENT_CELL / 2 + 0.8 || Math.abs(strip.z - skylight.z) > VENT_CELL / 2 + 0.2;
      expect(clear).toBe(true);
    }
  });

  it('lands Danilo under the hatch, on clear floor', () => {
    const { x, z } = SHIP_DECK.wake;
    expect({ x, z }).toEqual({ x: hatch.x, z: hatch.z });
    expect(isSolidAt(SHIP_DECK.walls, x, z)).toBe(false);
    for (const footprint of footprintsOf(SHIP_DECK)) {
      expect(distanceTo(footprint, x, z)).toBeGreaterThan(REAL_WORLD_PLAYER_RADIUS + VENT_CELL / 2);
    }
  });

  it('keeps the walker in the storeroom while the service door is shut', () => {
    const atDoor = walkTo(landing(), serviceDoor.x - 5, serviceDoor.z);
    expect(atDoor.x).toBeGreaterThan(serviceDoor.x + REAL_WORLD_CELL / 2);
    const aim = { x: atDoor.x + 1, y: REAL_WORLD_EYE_HEIGHT, z: atDoor.z, yaw: Math.PI / 2, pitch: -0.1 };
    expect(aimedFixture(SHIP_DECK, aim, { grate: true, dropGrate: true, serviceDoor: false })).toBe('serviceDoor');
    expect(aimedFixture(SHIP_DECK, aim, { grate: true, dropGrate: true, serviceDoor: true })).toBeNull();
  });

  it('walks out through the open door into the corridor', () => {
    const out = walkTo(landing(), serviceDoor.x - 3, serviceDoor.z, OPEN);
    expect(out.x).toBeCloseTo(serviceDoor.x - 3, 1);
  });

  it('is laid out with every floor cell reachable and nothing drawn next to the gaps between rooms', () => {
    const { walls } = SHIP_DECK;
    const key = (x: number, z: number) => `${x},${z}`;
    const floor = new Set<string>();
    walls.forEach((row, z) => [...row].forEach((char, x) => char === '.' && floor.add(key(x, z))));
    const start = [Math.floor(hatch.x / REAL_WORLD_CELL), Math.floor(hatch.z / REAL_WORLD_CELL)] as const;
    const seen = new Set([key(...start)]);
    const queue = [start];
    while (queue.length) {
      const [x, z] = queue.shift()!;
      for (const [dx, dz] of NEIGHBOURS) {
        const char = walls[z + dz]?.[x + dx];
        if ((char === '.' || char === 'S') && !seen.has(key(x + dx, z + dz))) {
          seen.add(key(x + dx, z + dz));
          queue.push([x + dx, z + dz]);
        }
        if (char === '.' || char === undefined) continue;
        expect(walls[z][x] === '.' && char === ' ', `floor ${x},${z} opens onto nothing`).toBe(false);
      }
    }
    for (const cell of floor) expect(seen.has(cell), `cell ${cell} cut off`).toBe(true);
  });

  it('keeps furniture out of the walls', () => {
    for (const footprint of footprintsOf(SHIP_DECK)) {
      expect(isSolidAt(SHIP_DECK.walls, footprint.x, footprint.z)).toBe(false);
    }
  });

  it('is stocked like the rooms it is: a cleaners’ closet, a break room, a laundry, a security post', () => {
    const kinds = new Set(SHIP_DECK.furniture.map((piece) => piece.kind));
    for (const kind of [
      'lampShelf',
      'supplyShelf',
      'mopBucket',
      'drums',
      'cleanerBot',
      'messTable',
      'vending',
      'washer',
      'coatRack',
      'lockers',
      'securityDesk'
    ] as const) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(findCells(SHIP_DECK.walls, 'A')).toHaveLength(1);
  });

  it('has more than one way from the storeroom to the cage: down the corridor, or round through the laundry', () => {
    const { cage } = DECK_ESCAPE;
    const corridor = [
      [17, 22.5],
      [13.5, 22.5],
      [13.5, 37],
      [cage.x, cage.z - 0.2]
    ] as const;
    const laundry = [
      [17, 22.5],
      [13.5, 22.5],
      [13.5, 7.8],
      [4.5, 7.8],
      [6, 13],
      [6, 32],
      [4.5, 35],
      [4.5, 41],
      [cage.x, cage.z - 0.2]
    ] as const;
    walkRoute(corridor);
    walkRoute(laundry);
  });
});
