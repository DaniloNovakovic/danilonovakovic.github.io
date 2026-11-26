import type { Explorer } from './explorer';
import { LAB_ROOM, LAB_VENT } from './labRoom';
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
  /** If nobody ever comes to look, it gives up waiting. */
  giveUpSeconds: 25,
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
  /** Has it already done its first, waiting round? */
  rounds: boolean;
}

/** Close enough over the bolted grate to be looking through it. */
const WATCH_RADIUS = 1.6;

export const startGlimpse = (): Glimpse => ({
  phase: 'offstage',
  along: GLIMPSE.start,
  waited: 0,
  seen: 0,
  rounds: false
});

function cue(explorer: Explorer) {
  const peek = floorGrateCentre(LAB_VENT, 'g');
  const entered = explorer.room === LAB_ROOM && explorer.crawl >= 0.5;
  const { x, z } = explorer.walker;
  return { entered, watching: entered && !!peek && Math.hypot(x - peek.x, z - peek.z) < WATCH_RADIUS };
}

function lingerOver(glimpse: Glimpse) {
  if (glimpse.rounds) return glimpse.waited >= GLIMPSE.pauseSeconds;
  return glimpse.seen >= GLIMPSE.seenSeconds || glimpse.waited >= GLIMPSE.giveUpSeconds;
}

const enter = (glimpse: Glimpse, phase: GlimpsePhase): Glimpse => ({ ...glimpse, phase, waited: 0 });

/** One frame of the round, cued by where Danilo is. */
export function stepGlimpse(glimpse: Glimpse, explorer: Explorer, dt: number): Glimpse {
  const { entered, watching } = cue(explorer);
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
      return lingerOver(next) ? enter(next, 'leaving') : next;
    }
    case 'leaving': {
      const along = glimpse.along + GLIMPSE.speed * dt;
      return along >= GLIMPSE.end
        ? enter({ ...glimpse, along: GLIMPSE.end, rounds: true }, 'gone')
        : { ...glimpse, along };
    }
    case 'gone':
      return waited >= GLIMPSE.betweenRounds
        ? enter({ ...glimpse, along: GLIMPSE.start }, 'arriving')
        : { ...glimpse, waited };
  }
}
