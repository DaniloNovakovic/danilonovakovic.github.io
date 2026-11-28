import { describe, expect, it } from 'vitest';
import { eyeOf, FALL_SECONDS, startExplorer, stepExplorer, toRoom, type Explorer } from './explorer';
import type { Opened } from './interactions';
import { LAB_ROOM, REAL_WORLD_EYE_HEIGHT } from './labRoom';
import { SHIP_DECK } from './shipDeck';
import { floorGrateCentre } from './vent';

const DT = 1 / 60;
const vent = LAB_ROOM.vent!;
const drop = floorGrateCentre(vent, 'o')!;
const peek = floorGrateCentre(vent, 'g')!;
const ROUTE = [
  [23, 16.5],
  [29.25, 16.5],
  [29.25, peek.z],
  [drop.x, peek.z],
  [drop.x, drop.z]
] as const;

/** Crawl the vent route in world coordinates, then keep stepping a little. */
function crawl(opened: Opened): Explorer {
  let explorer: Explorer = { ...startExplorer(LAB_ROOM), walker: { x: 22, z: 16.5, vx: 0, vz: 0 } };
  for (const [tx, tz] of ROUTE) {
    for (let t = 0; t < 20 && explorer.room === LAB_ROOM; t += DT) {
      const { x, z } = explorer.walker;
      if (Math.hypot(tx - x, tz - z) < 0.1) break;
      explorer = stepExplorer(explorer, { forward: 1, strafe: 0, yaw: Math.atan2(-(tx - x), -(tz - z)) }, DT, opened);
    }
  }
  return explorer;
}

describe('getting around the real world', () => {
  it('starts standing at the room’s wake spot', () => {
    const explorer = startExplorer(LAB_ROOM);
    expect(eyeOf(explorer)).toEqual({ x: LAB_ROOM.wake.x, y: REAL_WORLD_EYE_HEIGHT, z: LAB_ROOM.wake.z });
  });

  it('crawls to the drop grate and stays in the duct while it is shut', () => {
    const explorer = crawl({ grate: true, dropGrate: false, serviceDoor: false });
    expect(explorer.room).toBe(LAB_ROOM);
    expect(explorer.crawl).toBe(1);
    expect(Math.hypot(explorer.walker.x - drop.x, explorer.walker.z - drop.z)).toBeLessThan(0.15);
  });

  it('falls through the opened drop grate into the storeroom, landing on its feet under the hatch', () => {
    let explorer = crawl({ grate: true, dropGrate: true, serviceDoor: false });
    expect(explorer.room).toBe(SHIP_DECK);
    expect(explorer.fall).not.toBeNull();
    const top = eyeOf(explorer).y;
    expect(top).toBeGreaterThan(vent.floor);
    // No control while falling.
    const still = { forward: 1, strafe: 0, yaw: 0 };
    for (let t = 0; t < FALL_SECONDS + 0.1; t += DT) {
      explorer = stepExplorer(explorer, still, DT, { grate: true, dropGrate: true, serviceDoor: false });
      if (explorer.fall) expect(explorer.walker).toEqual(startExplorer(SHIP_DECK).walker);
    }
    expect(explorer.fall).toBeNull();
    const eye = eyeOf(explorer);
    expect(eye.y).toBeCloseTo(SHIP_DECK.offset!.y + REAL_WORLD_EYE_HEIGHT);
    // Landed right under the drop grate.
    const landed = eyeOf({ ...explorer, walker: startExplorer(SHIP_DECK).walker });
    expect(landed.x).toBeCloseTo(drop.x);
    expect(landed.z).toBeCloseTo(drop.z);
  });

  it('moves world points into a room’s own coordinates', () => {
    const world = { x: drop.x, y: 0, z: drop.z };
    const local = toRoom(SHIP_DECK, world);
    expect(local.x).toBeCloseTo(SHIP_DECK.hatch!.x);
    expect(local.z).toBeCloseTo(SHIP_DECK.hatch!.z);
    expect(toRoom(LAB_ROOM, world)).toEqual(world);
  });
});
