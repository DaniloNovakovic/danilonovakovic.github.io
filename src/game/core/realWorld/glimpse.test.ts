import { describe, expect, it } from 'vitest';
import { startExplorer, stepExplorer, type Explorer } from './explorer';
import { GLIMPSE, startGlimpse, stepGlimpse, type Glimpse } from './glimpse';
import type { Opened } from './interactions';
import { LAB_ROOM, LAB_VENT } from './labRoom';
import { floorGrateCentre } from './vent';

const DT = 1 / 60;
const peek = floorGrateCentre(LAB_VENT, 'g')!;
const OPEN: Opened = { grate: true, dropGrate: false };
const ROUTE = [
  [23, 16.5],
  [29.25, 16.5],
  [29.25, peek.z],
  [peek.x, peek.z]
] as const;

/** Crawl to the bolted grate at full speed, the round running alongside. */
function crawlToPeek(from: Explorer, glimpse: Glimpse) {
  let explorer = from;
  let round = glimpse;
  for (const [tx, tz] of ROUTE) {
    for (let t = 0; t < 20; t += DT) {
      const { x, z } = explorer.walker;
      if (Math.hypot(tx - x, tz - z) < 0.1) break;
      explorer = stepExplorer(explorer, { forward: 1, strafe: 0, yaw: Math.atan2(-(tx - x), -(tz - z)) }, DT, OPEN);
      round = stepGlimpse(round, explorer, DT);
    }
  }
  return { explorer, round };
}

function wait(explorer: Explorer, glimpse: Glimpse, seconds: number) {
  let round = glimpse;
  for (let t = 0; t < seconds; t += DT) round = stepGlimpse(round, explorer, DT);
  return round;
}

const standing = (): Explorer => ({ ...startExplorer(LAB_ROOM), walker: { x: 22, z: 16.5, vx: 0, vz: 0 } });

describe('the researcher under the bolted grate', () => {
  it('waits out of sight while Danilo is still in the lab, however long that takes', () => {
    const round = wait(standing(), startGlimpse(), 120);
    expect(round.phase).toBe('offstage');
    expect(round.along).toBe(GLIMPSE.start);
  });

  it('sets off on the crawl in, and is in the corridor below on reaching the grate', () => {
    const { round } = crawlToPeek(standing(), startGlimpse());
    expect(round.phase).not.toBe('offstage');
    expect(Math.abs(round.along - GLIMPSE.stop)).toBeLessThan(1.5);
  });

  it('stands under the grate until Danilo has had a look, then walks on', () => {
    const { explorer, round } = crawlToPeek(standing(), startGlimpse());
    const looked = wait(explorer, round, GLIMPSE.seenSeconds + 2);
    expect(looked.phase === 'leaving' || looked.phase === 'gone').toBe(true);
  });

  it('waits for a slow crawler: still there after dawdling in the duct first', () => {
    const { explorer } = crawlToPeek(standing(), startGlimpse());
    // In the duct but short of the grate, for a good while.
    const dawdling = { ...explorer, walker: { x: 29.25, z: 15, vx: 0, vz: 0 } };
    const round = wait(dawdling, stepGlimpse(startGlimpse(), dawdling, DT), 18);
    expect(round.phase).toBe('lingering');
    expect(wait(explorer, round, GLIMPSE.seenSeconds + 0.1).phase).toBe('leaving');
  });

  it('comes round again later, with only a short stop', () => {
    const { explorer, round } = crawlToPeek(standing(), startGlimpse());
    const away = { ...explorer, walker: { x: 29.25, z: 15, vx: 0, vz: 0 } };
    let next = wait(explorer, round, GLIMPSE.seenSeconds + 0.1);
    while (next.phase !== 'gone') next = stepGlimpse(next, away, DT);
    expect(next.rounds).toBe(true);
    while (next.phase !== 'lingering') next = stepGlimpse(next, away, DT);
    // Nobody looking this time, and it still moves on after its short stop.
    const stopped = wait(away, next, GLIMPSE.pauseSeconds + 0.1);
    expect(stopped.phase).toBe('leaving');
  });
});
