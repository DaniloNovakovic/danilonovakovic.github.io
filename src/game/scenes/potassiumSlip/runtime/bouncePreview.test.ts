import { describe, expect, it } from 'vitest';
import {
  predictPotassiumBounce,
  reflectPotassiumRicochet,
  type PotassiumBounceObstacle
} from './bouncePreview';

const arena = { left: 0, right: 400, top: 0, bottom: 600 };
const radius = 20;

function box(x: number, y: number, halfWidth: number, halfHeight: number, vy = 0): PotassiumBounceObstacle {
  return {
    x,
    y,
    left: x - halfWidth,
    right: x + halfWidth,
    top: y - halfHeight,
    bottom: y + halfHeight,
    vx: 0,
    vy
  };
}

function predict(velocity: { x: number; y: number }, obstacles: PotassiumBounceObstacle[] = []) {
  return predictPotassiumBounce({
    origin: { x: 200, y: 500 },
    velocity,
    radius,
    arena,
    obstacles,
    afterBounceLength: 100
  });
}

describe('potassium bounce preview', () => {
  it('reflects off the top wall when nothing is in the way', () => {
    const preview = predict({ x: 0, y: -400 });

    expect(preview?.hit).toBe('wall');
    expect(preview?.contact.x).toBeCloseTo(200);
    expect(preview?.contact.y).toBeCloseTo(radius);
    expect(preview?.bounceEnd.x).toBeCloseTo(200);
    expect(preview?.bounceEnd.y).toBeCloseTo(radius + 100);
  });

  it('flips only the x axis on a side wall', () => {
    const preview = predict({ x: 300, y: -300 });

    expect(preview?.hit).toBe('wall');
    expect(preview?.contact.x).toBeCloseTo(arena.right - radius);
    expect(preview!.bounceEnd.x).toBeLessThan(preview!.contact.x);
    expect(preview!.bounceEnd.y).toBeLessThan(preview!.contact.y);
  });

  it('stops at the face of a box and bounces straight back on a head-on hit', () => {
    const preview = predict({ x: 0, y: -400 }, [box(200, 200, 40, 20)]);

    expect(preview?.hit).toBe('enemy');
    expect(preview?.contact.y).toBeCloseTo(200 + 20 + radius);
    expect(preview!.bounceEnd.y).toBeGreaterThan(preview!.contact.y);
    expect(preview?.bounceEnd.x).toBeCloseTo(200);
  });

  it('bounces off-axis when the face hit is away from the sprite center', () => {
    // A wide box hit near its right end: the box face is flat, but the
    // ricochet normal points from the sprite center, so the sponge kicks right.
    const preview = predict({ x: 0, y: -400 }, [box(150, 200, 70, 20)]);

    expect(preview?.hit).toBe('enemy');
    expect(preview?.contact.y).toBeCloseTo(240);
    expect(preview!.bounceEnd.x).toBeGreaterThan(preview!.contact.x);
  });

  it('uses the rounded corner when the sponge clips a box corner', () => {
    // Box right edge at x=190, so the sponge (x=200, r=20) can only clip the corner.
    const preview = predict({ x: 0, y: -400 }, [box(150, 200, 40, 20)]);

    expect(preview?.hit).toBe('enemy');
    const dx = preview!.contact.x - 190;
    const dy = preview!.contact.y - 220;
    expect(Math.hypot(dx, dy)).toBeCloseTo(radius);
  });

  it('misses a box that is out of the path', () => {
    expect(predict({ x: 0, y: -400 }, [box(60, 200, 20, 20)])?.hit).toBe('wall');
  });

  it('leads a falling enemy', () => {
    // Static box would be hit at its face y=240; falling at 100 px/s it meets the sponge lower.
    const preview = predict({ x: 0, y: -400 }, [box(200, 200, 40, 20, 100)]);

    expect(preview?.hit).toBe('enemy');
    expect(preview!.contact.y).toBeGreaterThan(240);
  });

  it('follows an orbiting can instead of its zero body velocity', () => {
    // Can starts right of the path (x=280) and swings counter-clockwise up
    // across it, so a stationary guess would miss it entirely.
    const orbit = {
      centerX: 200, centerY: 200, centerVx: 0, centerVy: 0,
      radiusX: 80, radiusY: 80, angle: 0, angularSpeed: -2
    };
    const can = { ...box(280, 200, 29, 21), orbit };

    expect(predict({ x: 0, y: -400 }, [box(280, 200, 29, 21)])?.hit).toBe('wall');

    const preview = predict({ x: 0, y: -400 }, [can]);
    expect(preview?.hit).toBe('enemy');
    // Touching the can's box where the can actually is at that moment.
    const t = (500 - preview!.contact.y) / 400;
    const angle = orbit.angle + orbit.angularSpeed * t;
    const canX = 200 + Math.cos(angle) * 80;
    const canY = 200 + Math.sin(angle) * 80;
    const nearestX = Math.max(canX - 29, Math.min(preview!.contact.x, canX + 29));
    const nearestY = Math.max(canY - 21, Math.min(preview!.contact.y, canY + 21));
    expect(Math.hypot(preview!.contact.x - nearestX, preview!.contact.y - nearestY)).toBeCloseTo(radius, 0);
  });

  it('cuts the post-bounce line at the next contact', () => {
    // Head-on off the top wall, straight back into a box under it.
    const wallFirst = predictPotassiumBounce({
      origin: { x: 200, y: 100 },
      velocity: { x: 0, y: -400 },
      radius,
      arena,
      obstacles: [box(200, 160, 40, 10)],
      afterBounceLength: 200
    });
    expect(wallFirst?.hit).toBe('wall');
    expect(wallFirst?.bounceEnd.y).toBeCloseTo(150 - radius);
  });

  it('matches the live ricochet reflection rule', () => {
    expect(reflectPotassiumRicochet({ x: 0, y: -10 }, { x: 0, y: 1 })).toEqual({ x: 0, y: 10 });
    // Moving away from the enemy: shoot out along the normal.
    expect(reflectPotassiumRicochet({ x: 0, y: 10 }, { x: 0, y: 1 })).toEqual({ x: 0, y: 1 });
  });
});
