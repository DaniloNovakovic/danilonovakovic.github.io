import { describe, it, expect } from 'vitest';
import { pickGlassesSecretTarget, pickOverworldInteractTarget } from './overworldInteractSystems';

const opts = {
  maxDistX: 80,
  minPlayerY: 400,
  promptOffsetY: 40
} as const;

describe('pickOverworldInteractTarget', () => {
  it('returns null when there are no buildings', () => {
    const r = pickOverworldInteractTarget(100, 450, [], opts);
    expect(r.buildingId).toBeNull();
    expect(r.promptX).toBeNull();
    expect(r.promptY).toBeNull();
  });

  it('returns null when player is too far horizontally', () => {
    const buildings = [{ buildingId: 'profile', x: 400, y: 500 }];
    const r = pickOverworldInteractTarget(300, 450, buildings, opts);
    expect(r.buildingId).toBeNull();
  });

  it('returns null when player Y is not low enough', () => {
    const buildings = [{ buildingId: 'profile', x: 400, y: 500 }];
    const r = pickOverworldInteractTarget(390, 400, buildings, opts);
    expect(r.buildingId).toBeNull();
  });

  it('picks first matching building in iteration order', () => {
    const buildings = [
      { buildingId: 'a', x: 100, y: 500 },
      { buildingId: 'b', x: 105, y: 500 }
    ];
    const r = pickOverworldInteractTarget(100, 450, buildings, opts);
    expect(r.buildingId).toBe('a');
    expect(r.promptX).toBe(100);
    expect(r.promptY).toBe(540);
  });

  it('matches when horizontal distance is strictly inside maxDistX', () => {
    const buildings = [{ buildingId: 'projects', x: 400, y: 500 }];
    const r = pickOverworldInteractTarget(330, 450, buildings, opts);
    expect(r.buildingId).toBe('projects');
    expect(r.promptY).toBe(540);
  });
});

describe('pickGlassesSecretTarget', () => {
  const secrets = [{ secretId: 'banana-peel-clue', x: 300, y: 420, radius: 50, promptOffsetY: -40 }];

  it('does not reveal secrets without equipped glasses', () => {
    const r = pickGlassesSecretTarget(300, 420, false, secrets);
    expect(r.secretId).toBeNull();
    expect(r.promptX).toBeNull();
    expect(r.promptY).toBeNull();
  });

  it('picks a visible glasses secret when player is inside radius', () => {
    const r = pickGlassesSecretTarget(310, 420, true, secrets);
    expect(r.secretId).toBe('banana-peel-clue');
    expect(r.promptX).toBe(300);
    expect(r.promptY).toBe(380);
  });

  it('uses a strict radius check', () => {
    const r = pickGlassesSecretTarget(350, 420, true, secrets);
    expect(r.secretId).toBeNull();
  });
});
