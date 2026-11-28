import { describe, expect, it } from 'vitest';
import { aimedDock, checkpointAt, retry, startEscape, stepEscape, wakeDrone, type Escape } from './escape';
import { REAL_WORLD_EYE_HEIGHT } from './labRoom';
import { angleBetween } from './patrol';
import { DECK_ESCAPE as PLAN } from './shipDeck';
import { stepWalker, type Walker } from './walker';

const DT = 1 / 30;
const SOUTH = Math.PI;

/** A player bot: walks to points and waits for moments, stepping the deck all the while. */
function sneak() {
  let escape = startEscape(PLAN);
  let walker: Walker = { x: PLAN.room.wake.x, z: PLAN.room.wake.z, vx: 0, vz: 0 };
  let caughtEver = false;
  const tick = (input = { forward: 0, strafe: 0, yaw: 0 }) => {
    walker = stepWalker(PLAN.room, walker, input, DT, { vent: false, doors: escape.doorOpen });
    escape = stepEscape(PLAN, escape, walker, DT);
    caughtEver ||= escape.caught;
  };
  const bot = {
    get escape() {
      return escape;
    },
    get walker() {
      return walker;
    },
    get caughtEver() {
      return caughtEver;
    },
    set(next: Escape) {
      escape = next;
    },
    walk(...points: ReadonlyArray<readonly [number, number]>) {
      for (const [x, z] of points) {
        for (let t = 0; t < 15 && !escape.caught && !escape.reached; t += DT) {
          const dx = x - walker.x;
          const dz = z - walker.z;
          if (Math.hypot(dx, dz) < 0.15) break;
          tick({ forward: 1, strafe: 0, yaw: Math.atan2(-dx, -dz) });
        }
      }
      return bot;
    },
    idle(seconds: number) {
      for (let t = 0; t < seconds; t += DT) tick();
      return bot;
    },
    waitUntil(moment: (escape: Escape) => boolean, seconds = 120) {
      for (let t = 0; t < seconds && !moment(escape) && !escape.caught; t += DT) tick();
      expect(moment(escape), 'the moment never came').toBe(true);
      return bot;
    }
  };
  return bot;
}

const researcher = (escape: Escape) => escape.guards[0].patrol;
/** The officer has just turned to the camera screens on the desk (it turns while it waits there). */
const officerFacingAway = ({ guards: [, officer] }: Escape) =>
  officer.patrol.target === 2 &&
  Math.abs(angleBetween(officer.patrol.yaw, SOUTH)) < 0.05 &&
  officer.patrol.waited < 2.5;

describe('the service door and the drones', () => {
  it('stays shut until a drone is woken; then it rolls out and the door opens for it', () => {
    const bot = sneak().idle(10);
    expect(bot.escape.doorOpen).toBe(false);
    bot.set(wakeDrone(PLAN, bot.escape, 0));
    bot.waitUntil((escape) => escape.doorOpen, 12);
    bot.waitUntil((escape) => escape.drone?.phase === 'cleaning', 20);
    // Out in the corridor; the door stays open behind it.
    expect(bot.escape.drone!.patrol.x).toBeLessThan(15);
    expect(bot.escape.doorOpen).toBe(true);
  });

  it('wakes only one drone, the one you’re looking at, when you’re close enough', () => {
    const [dock] = PLAN.drones.docks;
    const view = { x: dock.x, y: REAL_WORLD_EYE_HEIGHT, z: dock.z - 1.6, yaw: Math.PI, pitch: -0.6 };
    const escape = startEscape(PLAN);
    expect(aimedDock(PLAN, escape, view)).toBe(0);
    expect(aimedDock(PLAN, escape, { ...view, z: dock.z - 5 })).toBeNull();
    const woken = wakeDrone(PLAN, escape, 0);
    expect(aimedDock(PLAN, woken, view)).toBeNull();
    expect(wakeDrone(PLAN, woken, 1)).toBe(woken);
  });
});

describe('checkpoints', () => {
  it('moves on to the laundry or the nook, never back to the storeroom', () => {
    const laundry = checkpointAt(PLAN, 0, { x: 6, z: 20 });
    expect(PLAN.checkpoints[laundry].id).toBe('laundry');
    expect(checkpointAt(PLAN, laundry, { x: 20.75, z: 22.5 })).toBe(laundry);
    expect(PLAN.checkpoints[checkpointAt(PLAN, laundry, { x: 16.6, z: 31.5 })].id).toBe('nook');
  });
});

describe('getting caught', () => {
  it('happens walking lit down the corridor into the researcher, and puts you back at the checkpoint', () => {
    const bot = sneak();
    bot.set(wakeDrone(PLAN, bot.escape, 0));
    bot.waitUntil((escape) => escape.doorOpen, 12);
    bot.waitUntil((escape) => researcher(escape).z > 18 && researcher(escape).z < 20 && !researcher(escape).moving);
    bot.walk([16.5, 22.5], [13.5, 22.5], [13.5, 19]);
    expect(bot.escape.caught).toBe(true);
    // Everything holds still until you try again.
    const held = bot.escape;
    expect(stepEscape(PLAN, held, bot.walker, 1)).toBe(held);
    const again = retry(PLAN, held);
    expect(again.spawn).toEqual(PLAN.checkpoints[0].spawn);
    expect(again.escape.caught).toBe(false);
    expect(again.escape.doorOpen).toBe(true);
    expect(again.escape.guards[0].alert).toBe(0);
  });
});

describe('sneaking to the blaster', () => {
  it('works down the corridor: wait in the doorway, hide in the nook, slip past the officer', () => {
    const bot = sneak();
    bot.set(wakeDrone(PLAN, bot.escape, 0));
    bot.waitUntil((escape) => escape.doorOpen, 12);
    bot.walk([16.8, 22.5]);
    bot.waitUntil((escape) => researcher(escape).z < 14 && researcher(escape).moving);
    bot.walk([13.5, 22.5], [13.5, 30], [16.6, 31.5]);
    expect(PLAN.checkpoints[bot.escape.checkpoint].id).toBe('nook');
    bot.waitUntil(
      (escape) => officerFacingAway(escape) && researcher(escape).z < 22 && researcher(escape).direction === -1
    );
    bot.walk([13.5, 33.5], [13.5, 37], [PLAN.cage.x, PLAN.cage.z]);
    expect(bot.caughtEver).toBe(false);
    expect(bot.escape.reached).toBe(true);
  });

  it('works the long way round: north behind the researcher, through the laundry, along the lockers', () => {
    const bot = sneak();
    bot.set(wakeDrone(PLAN, bot.escape, 1));
    bot.waitUntil((escape) => escape.doorOpen, 12);
    bot.walk([16.8, 22.5]);
    bot.waitUntil((escape) => researcher(escape).z > 25 && researcher(escape).moving);
    bot.walk([13.5, 22.5], [13.5, 7.8], [4.5, 7.8], [6, 13], [6, 32], [4.5, 35], [4.5, 38.5]);
    expect(PLAN.checkpoints[bot.escape.checkpoint].id).toBe('laundry');
    bot.waitUntil(officerFacingAway);
    bot.walk([4.5, 41], [PLAN.cage.x, PLAN.cage.z]);
    expect(bot.caughtEver).toBe(false);
    expect(bot.escape.reached).toBe(true);
  });

  it('is not a stroll: walking in through the corridor door while the officer watches it gets you caught', () => {
    const bot = sneak();
    // At the end of the corridor as the officer turns to watch the door (the researcher is up in the break room).
    bot.set({ ...bot.escape, doorOpen: true });
    bot.walk([16.8, 22.5], [16.6, 31.5]);
    bot.waitUntil(
      ({ guards: [, officer] }) =>
        officer.patrol.target === 0 && officer.patrol.waited > 1 && officer.patrol.waited < 1.2
    );
    bot.walk([13.5, 33.5], [13.5, 37], [PLAN.cage.x, PLAN.cage.z]);
    expect(bot.caughtEver).toBe(true);
    expect(bot.escape.reached).toBe(false);
  });
});
