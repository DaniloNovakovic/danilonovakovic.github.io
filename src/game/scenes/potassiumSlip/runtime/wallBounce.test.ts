import { describe, expect, it } from 'vitest';
import {
  POTASSIUM_WALL_CLONE_COOLDOWN_MS,
  POTASSIUM_WALL_CLONE_MAX_ACTIVE,
  POTASSIUM_WALL_SUDS_COOLDOWN_MS,
  POTASSIUM_WALL_SUDS_INSET,
  POTASSIUM_WALL_SUDS_MIN_SPEED,
  resolvePotassiumWallClones,
  resolvePotassiumWallSuds,
  shouldShowPotassiumWallSuds
} from './wallBounce';

const arena = { left: 300, right: 700, top: 40, bottom: 560 };
const none = { up: false, down: false, left: false, right: false };

describe('potassium wall suds', () => {
  it('places the splash on the wall the sponge hit, inset from the border', () => {
    const projectile = { x: 420, y: 250 };
    expect(resolvePotassiumWallSuds({ blocked: { ...none, left: true }, projectile, arena }))
      .toEqual({ side: 'left', x: arena.left + POTASSIUM_WALL_SUDS_INSET, y: 250 });
    expect(resolvePotassiumWallSuds({ blocked: { ...none, right: true }, projectile, arena }))
      .toEqual({ side: 'right', x: arena.right - POTASSIUM_WALL_SUDS_INSET, y: 250 });
    expect(resolvePotassiumWallSuds({ blocked: { ...none, up: true }, projectile, arena }))
      .toEqual({ side: 'up', x: 420, y: arena.top + POTASSIUM_WALL_SUDS_INSET });
    expect(resolvePotassiumWallSuds({ blocked: { ...none, down: true }, projectile, arena }))
      .toEqual({ side: 'down', x: 420, y: arena.bottom - POTASSIUM_WALL_SUDS_INSET });
  });

  it('skips suds while recalling, when slow, or inside the cooldown', () => {
    const fast = POTASSIUM_WALL_SUDS_MIN_SPEED + 1;
    const ready = { isRecalling: false, speed: fast, now: 1000, lastSudsAt: 0 };
    expect(shouldShowPotassiumWallSuds(ready)).toBe(true);
    expect(shouldShowPotassiumWallSuds({ ...ready, isRecalling: true })).toBe(false);
    expect(shouldShowPotassiumWallSuds({ ...ready, speed: POTASSIUM_WALL_SUDS_MIN_SPEED - 1 })).toBe(false);
    expect(shouldShowPotassiumWallSuds({
      ...ready,
      lastSudsAt: ready.now - POTASSIUM_WALL_SUDS_COOLDOWN_MS + 1
    })).toBe(false);
  });

  describe('mini sponges', () => {
    const ready = {
      duplicateRank: 1 as const,
      cloneTimeRank: 0,
      side: 'left' as const,
      isRecalling: false,
      speed: POTASSIUM_WALL_SUDS_MIN_SPEED + 1,
      now: 5000,
      lastClonesAt: 0,
      activeClones: 0
    };

    it('fans mini sponges back into the arena from the wall that was hit', () => {
      const left = resolvePotassiumWallClones(ready);
      expect(left?.angles).toHaveLength(2);
      expect(left?.lifetimeMs).toBe(3000);
      left?.angles.forEach((angle) => expect(Math.cos(angle)).toBeGreaterThan(0.5));

      const top = resolvePotassiumWallClones({ ...ready, side: 'up', duplicateRank: 2, cloneTimeRank: 2 });
      expect(top?.angles).toHaveLength(3);
      expect(top?.lifetimeMs).toBe(3600);
      top?.angles.forEach((angle) => expect(Math.sin(angle)).toBeGreaterThan(0.5));
    });

    it('skips when locked, recalling, slow, cooling down, or the board is full', () => {
      expect(resolvePotassiumWallClones({ ...ready, duplicateRank: 0 })).toBeNull();
      expect(resolvePotassiumWallClones({ ...ready, isRecalling: true })).toBeNull();
      expect(resolvePotassiumWallClones({ ...ready, speed: POTASSIUM_WALL_SUDS_MIN_SPEED - 1 })).toBeNull();
      expect(resolvePotassiumWallClones({
        ...ready,
        lastClonesAt: ready.now - POTASSIUM_WALL_CLONE_COOLDOWN_MS + 1
      })).toBeNull();
      expect(resolvePotassiumWallClones({ ...ready, activeClones: POTASSIUM_WALL_CLONE_MAX_ACTIVE })).toBeNull();
      expect(resolvePotassiumWallClones({ ...ready, activeClones: POTASSIUM_WALL_CLONE_MAX_ACTIVE - 1 })?.angles)
        .toHaveLength(1);
    });
  });
});
