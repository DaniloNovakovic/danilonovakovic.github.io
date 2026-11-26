import { LAB_VENT, type RealWorldRoom } from './labRoom';

/** How far below the duct floor the corridor and the storeroom floors are. */
export const SHIP_DECK_DROP = 3.4;

/**
 * The storeroom (#145): a cramped, dim supply closet next to the ship
 * corridor, under the end of the lab vent, where the ship's cleaners live.
 * Racks of spares down the back, cleaning things by the door, the cleaning
 * drones asleep on their docks. Danilo drops in through the hatch in its
 * ceiling; its door, onto the corridor, stays shut for now. This is where the
 * sneaking starts.
 *
 * Plan in local coordinates (same symbols and cell size as the lab), placed
 * in the world by `offset`: west of it runs the corridor.
 */
export const STOREROOM: RealWorldRoom = {
  walls: [
    '####', //
    '#..#',
    'D..#',
    '#..#',
    '####'
  ],
  furniture: [
    // Racks down the back wall: spare light tubes and bulbs, then supplies.
    { kind: 'lampShelf', x: 8.6, z: 4.5, facing: 'west' },
    { kind: 'supplyShelf', x: 8.6, z: 7.6, facing: 'west' },
    { kind: 'supplyShelf', x: 8.6, z: 10.6, facing: 'west' },
    // North wall: the mop and bucket by the door, drums of cleaning fluid.
    { kind: 'mopBucket', x: 3.7, z: 3.8, facing: 'east' },
    { kind: 'drums', x: 5.7, z: 3.5, facing: 'south' },
    // South wall: two cleaning drones asleep on their docks, a delivery not yet put away.
    { kind: 'cleanerBot', x: 3.8, z: 11.2, facing: 'north' },
    { kind: 'cleanerBot', x: 5.4, z: 11.3, facing: 'north' },
    { kind: 'crates', x: 7.0, z: 11.3, facing: 'north' },
    // Left out in the middle, half in the way: someone's round isn't finished.
    { kind: 'janitorCart', x: 6.6, z: 9.5, facing: 'west' }
  ],
  // Landing under the hatch, facing the door.
  wake: { x: 5.75, z: 7.5, yaw: Math.PI / 2 },
  offset: { x: 37, y: LAB_VENT.floor - SHIP_DECK_DROP, z: 7.5 },
  hatch: { x: 5.75, z: 7.5 },
  // One strip, at the back: the door side stays dark.
  strips: [{ x: 7.5, z: 10.5 }]
};
