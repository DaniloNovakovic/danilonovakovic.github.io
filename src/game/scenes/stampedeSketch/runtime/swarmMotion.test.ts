import { describe, expect, it } from 'vitest';
import {
  getStampedeSwarmMotion,
  resolveStampedeSwarmTarget
} from './swarmMotion';

describe('stampede swarm motion', () => {
  it('keeps swarm targets distributed around the player instead of all at center', () => {
    const target = { x: 500, y: 300 };
    const first = resolveStampedeSwarmTarget({
      target,
      phase: 0,
      mode: 'build',
      pressure: 0.5,
      nowMs: 10_000
    });
    const second = resolveStampedeSwarmTarget({
      target,
      phase: 2.1,
      mode: 'build',
      pressure: 0.5,
      nowMs: 10_000
    });

    expect(first).not.toEqual(target);
    expect(second).not.toEqual(target);
    expect(Math.hypot(first.x - second.x, first.y - second.y)).toBeGreaterThan(40);
  });

  it('tightens the orbit during surge without collapsing to zero radius', () => {
    const calm = getStampedeSwarmMotion('calm', 0);
    const surge = getStampedeSwarmMotion('surge', 1);

    expect(surge.orbitRadius).toBeLessThan(calm.orbitRadius);
    expect(surge.orbitRadius).toBeGreaterThan(18);
    expect(surge.centerBias).toBeGreaterThan(0.7);
  });

  it('cuts inside the broad spacing radius once pressure surges', () => {
    const build = getStampedeSwarmMotion('build', 0.5);
    const surge = getStampedeSwarmMotion('surge', 1);

    expect(build.orbitRadius).toBeGreaterThan(30);
    expect(surge.orbitRadius).toBeLessThan(30);
  });

  it('blends surge targets close to the player center while keeping build distributed', () => {
    const target = { x: 500, y: 300 };
    const build = resolveStampedeSwarmTarget({
      target,
      phase: 0,
      mode: 'build',
      pressure: 0.5,
      nowMs: 0
    });
    const surge = resolveStampedeSwarmTarget({
      target,
      phase: 0,
      mode: 'surge',
      pressure: 1,
      nowMs: 0
    });

    const buildDistance = Math.hypot(build.x - target.x, build.y - target.y);
    const surgeDistance = Math.hypot(surge.x - target.x, surge.y - target.y);

    expect(buildDistance).toBeGreaterThan(30);
    expect(surgeDistance).toBeLessThan(8);
    expect(surge).not.toEqual(target);
  });
});
