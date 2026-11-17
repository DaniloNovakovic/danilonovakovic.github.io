import { describe, expect, it } from 'vitest';
import {
  POTASSIUM_WALL_SUDS_COOLDOWN_MS,
  POTASSIUM_WALL_SUDS_INSET,
  POTASSIUM_WALL_SUDS_MIN_SPEED,
  resolvePotassiumWallSuds,
  shouldShowPotassiumWallSuds
} from './wallSuds';

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
});
