import { LAB_VENT, type RealWorldRoom } from './labRoom';

/** How far below the duct floor the corridor and the storeroom floors are. */
export const SHIP_DECK_DROP = 3.4;

/**
 * The storeroom (#145): a small, dim supply room next to the ship corridor,
 * under the end of the lab vent. Danilo drops in through the hatch in its
 * ceiling; its door, onto the corridor, stays shut for now. This is where the
 * sneaking starts.
 *
 * Plan in local coordinates (same symbols and cell size as the lab), placed
 * in the world by `offset`: west of it runs the corridor.
 */
export const STOREROOM: RealWorldRoom = {
  walls: [
    '#####', //
    '#...#',
    'D...#',
    '#...#',
    '#####'
  ],
  furniture: [
    // Racks of supplies along the back wall and the north wall.
    { kind: 'supplyShelf', x: 11.6, z: 6.2, facing: 'west' },
    { kind: 'supplyShelf', x: 11.6, z: 9.4, facing: 'west' },
    { kind: 'supplyShelf', x: 8.2, z: 3.4, facing: 'south' },
    // Deliveries in the corners by the door; the way from the hatch to the door stays clear.
    { kind: 'crates', x: 4.2, z: 4.2, facing: 'south' },
    { kind: 'crates', x: 4.4, z: 10.8, facing: 'east' }
  ],
  // Landing under the hatch, facing the door.
  wake: { x: 5.75, z: 7.5, yaw: Math.PI / 2 },
  offset: { x: 37, y: LAB_VENT.floor - SHIP_DECK_DROP, z: 7.5 },
  hatch: { x: 5.75, z: 7.5 },
  // One strip, at the back: the door side stays dark.
  strips: [{ x: 10.5, z: 7.5 }]
};
