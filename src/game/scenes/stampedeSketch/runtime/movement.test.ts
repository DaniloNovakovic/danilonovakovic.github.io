import { describe, expect, it } from 'vitest';
import {
  STAMPEDE_ARENA,
  STAMPEDE_PLAYER_SPEED,
  clampStampedePosition,
  resolveStampedeVelocity
} from './movement';

describe('stampede movement', () => {
  it('normalizes diagonal keyboard movement', () => {
    const velocity = resolveStampedeVelocity({
      keyboard: { x: 1, y: 1 },
      pointer: { active: false, deltaX: 0, deltaY: 0 }
    });

    expect(Math.hypot(velocity.x, velocity.y)).toBeCloseTo(STAMPEDE_PLAYER_SPEED, 5);
  });

  it('uses pointer movement intensity after the dead zone', () => {
    const idle = resolveStampedeVelocity({
      keyboard: { x: 0, y: 0 },
      pointer: { active: true, deltaX: 4, deltaY: 0 }
    });
    const moving = resolveStampedeVelocity({
      keyboard: { x: 0, y: 0 },
      pointer: { active: true, deltaX: 60, deltaY: 0 }
    });

    expect(idle).toEqual({ x: 0, y: 0 });
    expect(moving.x).toBeCloseTo(STAMPEDE_PLAYER_SPEED, 5);
    expect(moving.y).toBe(0);
  });

  it('clamps the player inside the safe arena', () => {
    expect(clampStampedePosition({ x: 100, y: 900 })).toEqual({
      x: STAMPEDE_ARENA.safeLeft,
      y: STAMPEDE_ARENA.safeBottom
    });
  });
});
