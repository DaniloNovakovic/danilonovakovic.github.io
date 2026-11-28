import type { Explorer } from './explorer';
import { LAB_ROOM, type RealWorldRoom } from './labRoom';
import { floorGrateCentre } from './vent';

/**
 * The researcher's round in the corridor under the bolted grate, as a
 * distance along the corridor (0 is right under the grate). It waits out of
 * sight until Danilo is in the duct, then walks in timed to reach the grate
 * when Danilo does, and stops under it until Danilo has had a good look, so the first look
 * through those slats always finds it. Then it walks on, and comes round
 * again every so often.
 */
export const GLIMPSE = {
  /** Out of sight up the corridor, and gone down it. */
  start: -10,
  end: 10,
  /** Where it stops: a little past the grate, so it shows between the slats. */
  stop: 0.4,
  speed: 1.1,
  /** How long Danilo gets to look before it moves on. */
  seenSeconds: 3.5,
  /** Later rounds: a short stop, a while between. */
  pauseSeconds: 3.2,
  betweenRounds: 8
} as const;

export type GlimpsePhase = 'offstage' | 'arriving' | 'lingering' | 'leaving' | 'gone';

export interface Glimpse {
  phase: GlimpsePhase;
  along: number;
  /** Seconds in the current phase. */
  waited: number;
  /** Seconds Danilo has spent looking down through the grate while it stood there. */
  seen: number;
  /** Has it already done its first round, the one that waits to be seen? */
  firstRoundDone: boolean;
}

/** Close enough over the bolted grate to be looking through it. */
const WATCH_RADIUS = 1.6;

export const startGlimpse = (): Glimpse => ({
  phase: 'offstage',
  along: GLIMPSE.start,
  waited: 0,
  seen: 0,
  firstRoundDone: false
});

/** `room` is the one whose vent has the bolted grate. */
function cue(explorer: Explorer, room: RealWorldRoom) {
  const peek = room.vent && floorGrateCentre(room.vent, 'g');
  const entered = explorer.room === room && explorer.crawl >= 0.5;
  const { x, z } = explorer.walker;
  return {
    entered,
    watching: entered && !!peek && Math.hypot(x - peek.x, z - peek.z) < WATCH_RADIUS,
    left: explorer.room !== room
  };
}

/**
 * Later rounds stop briefly. The first waits as long as it takes for Danilo
 * to have a look (backing out into the lab and coming back included), unless
 * nobody ever will: Danilo has dropped out of the vent.
 */
function lingerOver(glimpse: Glimpse, left: boolean) {
  if (glimpse.firstRoundDone) return glimpse.waited >= GLIMPSE.pauseSeconds;
  return glimpse.seen >= GLIMPSE.seenSeconds || left;
}

const enter = (glimpse: Glimpse, phase: GlimpsePhase): Glimpse => ({ ...glimpse, phase, waited: 0 });

/** One frame of the round, cued by where Danilo is in the duct of `room` (the lab's, by default). */
export function stepGlimpse(glimpse: Glimpse, explorer: Explorer, dt: number, room: RealWorldRoom = LAB_ROOM): Glimpse {
  const { entered, watching, left } = cue(explorer, room);
  const waited = glimpse.waited + dt;
  switch (glimpse.phase) {
    case 'offstage':
      return entered ? enter(glimpse, 'arriving') : glimpse;
    case 'arriving': {
      const along = Math.min(GLIMPSE.stop, glimpse.along + GLIMPSE.speed * dt);
      return along >= GLIMPSE.stop ? enter({ ...glimpse, along }, 'lingering') : { ...glimpse, along, waited };
    }
    case 'lingering': {
      const next = { ...glimpse, waited, seen: glimpse.seen + (watching ? dt : 0) };
      return lingerOver(next, left) ? enter(next, 'leaving') : next;
    }
    case 'leaving': {
      const along = glimpse.along + GLIMPSE.speed * dt;
      return along >= GLIMPSE.end
        ? enter({ ...glimpse, along: GLIMPSE.end, firstRoundDone: true }, 'gone')
        : { ...glimpse, along };
    }
    case 'gone':
      return waited >= GLIMPSE.betweenRounds
        ? enter({ ...glimpse, along: GLIMPSE.start }, 'arriving')
        : { ...glimpse, waited };
  }
}
