import type { EscapePlan } from './escape';
import { LAB_VENT, type RealWorldRoom } from './labRoom';

/** How far below the duct floor the ship deck is. */
export const SHIP_DECK_DROP = 3.6;

const NORTH = 0;
const WEST = Math.PI / 2;
const SOUTH = Math.PI;
/** From the officer's post at the desk, the way to the corridor door. */
const CORRIDOR_DOOR = Math.atan2(2.5, 5.1);

/**
 * The ship deck under the lab (#145), where Danilo drops in through the vent.
 * Laid out like a working deck, rooms off a corridor:
 * - **the storeroom** (east): a cramped cleaners' closet, racks down the
 *   back, two cleaning drones asleep on their docks. Danilo lands here under
 *   the hatch. Its service door (`S`) onto the corridor opens for the drones.
 * - **the corridor** (middle, north–south): the one Danilo looked down into
 *   through the bolted grate, lit in pools by its strips. The researcher's
 *   round runs along it.
 * - **the break room** (north): a mess table, a drinks machine the
 *   researcher stops at, the crew's lockers.
 * - **the laundry** (west, alongside the corridor): laid out the way it's
 *   used, north to south: washers and a folding table under the one light,
 *   sheets drying across the middle (a dark zig-zag nobody sees through),
 *   racks of clean uniforms at the far end. The long way round.
 * - **the security post** (south): where both ways meet. An officer watches
 *   the room from the desk, and the stun blaster hangs in the armoury cage
 *   (`A`) in the south wall, out of reach.
 *
 * Plan in local coordinates (same symbols and cell size as the lab), placed in
 * the world by `offset`.
 */
export const SHIP_DECK: RealWorldRoom = {
  walls: [
    '######## ', //
    '#......# ',
    '#......# ',
    '#.##.### ',
    '#..#.#   ',
    '#..#.####',
    '#..#.#..#',
    '#..#.S..#',
    '#..#.#..#',
    '#..#.####',
    '#..#..#  ',
    '#.##.##  ',
    '#.....#  ',
    '#.....#  ',
    '###A###  '
  ],
  furniture: [
    // The storeroom. Racks down the back wall: spare light tubes and bulbs, then supplies.
    { kind: 'lampShelf', x: 23.6, z: 19.5, facing: 'west' },
    { kind: 'supplyShelf', x: 23.6, z: 22.6, facing: 'west' },
    { kind: 'supplyShelf', x: 23.6, z: 25.6, facing: 'west' },
    // North wall: the mop and bucket by the door, drums of cleaning fluid.
    { kind: 'mopBucket', x: 18.7, z: 18.8, facing: 'east' },
    { kind: 'drums', x: 20.7, z: 18.5, facing: 'south' },
    // South wall: the cleaning drones' docks, a delivery not yet put away.
    { kind: 'cleanerBot', x: 18.8, z: 26.2, facing: 'north' },
    { kind: 'cleanerBot', x: 20.4, z: 26.3, facing: 'north' },
    { kind: 'crates', x: 22.0, z: 26.3, facing: 'north' },
    // Left out in the middle, half in the way: someone's round isn't finished.
    { kind: 'janitorCart', x: 21.6, z: 24.5, facing: 'west' },
    // The break room.
    { kind: 'messTable', x: 8.5, z: 5.8, facing: 'south' },
    { kind: 'vending', x: 16.5, z: 3.6, facing: 'south' },
    { kind: 'lockers', x: 20.6, z: 6, facing: 'west' },
    { kind: 'noticeBoard', x: 12, z: 3.05, facing: 'south' },
    // The laundry, north to south as it's used: wash, dry, put away. The washers and a dryer
    // stack down the west wall, a folding table opposite under the one light.
    { kind: 'washer', x: 3.9, z: 14, facing: 'east' },
    { kind: 'washer', x: 3.9, z: 15.2, facing: 'east' },
    { kind: 'washer', x: 3.9, z: 16.4, facing: 'east' },
    { kind: 'dryerStack', x: 3.9, z: 17.7, facing: 'east' },
    { kind: 'foldingTable', x: 8.15, z: 14.6, facing: 'west' },
    { kind: 'hamper', x: 8.2, z: 17.2, facing: 'west' },
    { kind: 'noticeBoard', x: 8.95, z: 12.95, facing: 'west' },
    // Sheets hung to dry across the middle, one from each wall: a dark zig-zag nobody sees through.
    { kind: 'linenLine', x: 4.85, z: 20.2, facing: 'south' },
    { kind: 'linenLine', x: 7.15, z: 24.2, facing: 'north' },
    // Put away: clean coats and uniforms on racks, linen on a shelf, a full hamper waiting.
    { kind: 'coatRack', x: 8.6, z: 28.2, facing: 'west' },
    { kind: 'supplyShelf', x: 3.4, z: 28.6, facing: 'east' },
    { kind: 'hamper', x: 7.9, z: 31.8, facing: 'west' },
    // The security post: the officer's desk and its camera screens, lockers, a delivery.
    { kind: 'securityDesk', x: 16.5, z: 41.3, facing: 'north' },
    { kind: 'lockers', x: 3.4, z: 39, facing: 'east' },
    { kind: 'crates', x: 7.4, z: 37, facing: 'south' },
    { kind: 'noticeBoard', x: 10.5, z: 36.05, facing: 'south' }
  ],
  // Landing under the hatch. Dropping in keeps the way Danilo was crawling; the yaw is for starting here.
  wake: { x: 20.75, z: 22.5, yaw: WEST },
  offset: { x: 22, y: LAB_VENT.floor - SHIP_DECK_DROP, z: -7.5 },
  hatch: { x: 20.75, z: 22.5 },
  // Over the corridor, under the bolted grate Danilo looked down through.
  skylights: [{ x: 13.25, z: 19.5 }],
  // Each room done up as its own place.
  finishes: [
    { area: { x0: 3, z0: 3, x1: 24, z1: 9 }, finish: 'panelling' },
    { area: { x0: 3, z0: 9, x1: 9, z1: 33 }, finish: 'tiles' },
    { area: { x0: 18, z0: 18, x1: 24, z1: 27 }, finish: 'service' },
    { area: { x0: 3, z0: 33, x1: 18, z1: 42 }, finish: 'security' }
  ],
  strips: [
    // The break room: over the table, by the drinks machine.
    { x: 7.5, z: 5.5 },
    { x: 16.5, z: 7.5 },
    // The corridor, in pools: one just past the grate, so whoever stops under it stands in the light.
    { x: 13.5, z: 14.4 },
    { x: 13.5, z: 20.6 },
    { x: 13.5, z: 26.7 },
    { x: 13.5, z: 32.4 },
    // One at the back of the storeroom: the door side stays dark.
    { x: 22.5, z: 25.5 },
    // The laundry: over the folding table; the drying lines and the racks are dark.
    { x: 7, z: 14.6 },
    // The security post: inside the corridor door (whoever comes in that way is lit), and over the cage.
    { x: 13.5, z: 37.6 },
    { x: 10.5, z: 40.5 }
  ]
};

/**
 * Who's on the deck, where you start again when caught, the drones, and the
 * blaster: the run from the storeroom to the cage.
 */
export const DECK_ESCAPE: EscapePlan = {
  room: SHIP_DECK,
  guards: [
    {
      // The researcher Danilo saw from the vent: a drink at the machine, down the corridor,
      // a sniff under the grate, a look towards security, and back.
      kind: 'researcher',
      route: {
        mode: 'pingPong',
        speed: 1.1,
        turnSpeed: 2.2,
        posts: [
          { x: 16.2, z: 5.3, wait: 4, look: NORTH },
          { x: 13.5, z: 10.5 },
          { x: 13.75, z: 19.9, wait: 3 },
          { x: 13.5, z: 31, wait: 3.5, look: SOUTH }
        ]
      }
    },
    {
      // The officer at the security desk: watches the corridor door, the room, then the camera screens.
      kind: 'officer',
      route: {
        mode: 'pingPong',
        speed: 1,
        turnSpeed: 1.2,
        posts: [
          { x: 16, z: 39.6, wait: 4, look: CORRIDOR_DOOR },
          { x: 16, z: 39.6, wait: 3.5, look: WEST },
          { x: 16, z: 39.6, wait: 6, look: SOUTH }
        ]
      }
    }
  ],
  checkpoints: [
    { id: 'storeroom', rank: 0, area: { x0: 18, z0: 18, x1: 24, z1: 27 }, spawn: { x: 20.75, z: 22.5 } },
    { id: 'laundry', rank: 1, area: { x0: 3, z0: 12, x1: 9, z1: 33 }, spawn: { x: 6, z: 13.5 } },
    { id: 'nook', rank: 1, area: { x0: 15, z0: 30, x1: 18, z1: 33 }, spawn: { x: 16.6, z: 31.5 } }
  ],
  drones: {
    // At the docks (the storeroom's `cleanerBot`s), facing out.
    docks: [
      { x: 18.8, z: 26.2 },
      { x: 20.4, z: 26.3 }
    ],
    // The service door's inside face, and the corridor in front of it.
    door: { x: 18, z: 22.5 },
    corridor: { x: 13.5, z: 22.5 },
    // Out on its round: up and down the corridor, a pause at each end.
    beat: {
      mode: 'pingPong',
      speed: 0.9,
      turnSpeed: 2,
      posts: [
        { x: 13.5, z: 22.5 },
        { x: 13.5, z: 30.5, wait: 2 },
        { x: 13.5, z: 22.5 },
        { x: 13.5, z: 11, wait: 2 }
      ]
    }
  },
  cage: { x: 10.5, z: 41.2, reach: 1.4 }
};
