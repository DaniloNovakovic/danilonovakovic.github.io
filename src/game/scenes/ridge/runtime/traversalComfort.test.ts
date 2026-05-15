import { describe, expect, it } from 'vitest';
import {
  canMantleLedge,
  canStepUp,
  chooseFallRecovery,
  getClimbProgressDelta,
  getDistanceToTraversalSegment,
  getPointOnTraversalSegment,
  getRampSurfaceYAtX,
  isMantleTargetCollider,
  isPointNearTraversalLine,
  isTraversalPathOccludedBySolid,
  projectPointToSegmentT,
  resolveRampSurfaceY,
  resolveWalkableRampSurfaceY,
  shouldMaintainClimbAttachment
} from './traversalComfort';

const ramp = {
  id: 'ramp',
  kind: 'ramp' as const,
  from: { x: 100, y: 300 },
  to: { x: 300, y: 200 },
  x: 200,
  y: 250,
  width: 260,
  height: 180
};

describe('Ridge traversal comfort helpers', () => {
  it('resolves ramp surface y from the connector line', () => {
    expect(getRampSurfaceYAtX(ramp, 200)).toBe(250);
    expect(getRampSurfaceYAtX(ramp, 80)).toBeUndefined();
  });

  it('selects the closest ramp surface within tolerance', () => {
    expect(resolveRampSurfaceY([ramp], { x: 200, y: 258 }, 16)).toMatchObject({
      zone: ramp,
      y: 250
    });
    expect(resolveRampSurfaceY([ramp], { x: 200, y: 310 }, 16)).toBeUndefined();
  });

  it('keeps ramp snap mostly downward instead of pulling the player up from below', () => {
    expect(resolveWalkableRampSurfaceY([ramp], { x: 200, y: 230 }, {
      maxSnapDownY: 24,
      maxSnapUpY: 6
    })).toMatchObject({
      zone: ramp,
      y: 250
    });
    expect(resolveWalkableRampSurfaceY([ramp], { x: 200, y: 262 }, {
      maxSnapDownY: 24,
      maxSnapUpY: 6
    })).toBeUndefined();
  });

  it('allows ledge mantle only when moving toward a reachable ledge', () => {
    const ledge = { x: 300, y: 250, width: 120, height: 16 };

    expect(canMantleLedge({
      playerX: 210,
      playerBottomY: 330,
      moveAxis: 1,
      ledge,
      maxHorizontalDistance: 96,
      minVerticalDelta: 16,
      maxVerticalDelta: 140
    })).toBe(true);
    expect(canMantleLedge({
      playerX: 210,
      playerBottomY: 330,
      moveAxis: -1,
      ledge,
      maxHorizontalDistance: 96,
      minVerticalDelta: 16,
      maxVerticalDelta: 140
    })).toBe(false);
  });

  it('allows mantle targets only for platforms and connector platforms', () => {
    expect(isMantleTargetCollider({ kind: 'solid' })).toBe(false);
    expect(isMantleTargetCollider({ kind: 'platform' })).toBe(true);
    expect(isMantleTargetCollider({ kind: 'route-connector' })).toBe(true);
    expect(isMantleTargetCollider({ kind: 'shortcut-connector' })).toBe(true);
  });

  it('allows small step-ups but rejects tall walls', () => {
    expect(canStepUp({ playerBottomY: 300, obstacleTopY: 256, maxStepHeight: 56 })).toBe(true);
    expect(canStepUp({ playerBottomY: 300, obstacleTopY: 220, maxStepHeight: 56 })).toBe(false);
  });

  it('returns the last safe position when falling into the world bottom band', () => {
    const safe = { x: 120, y: 300 };

    expect(chooseFallRecovery({
      playerY: 980,
      worldBottomY: 1000,
      thresholdY: 48,
      lastSafePosition: safe
    })).toBe(safe);
    expect(chooseFallRecovery({
      playerY: 900,
      worldBottomY: 1000,
      thresholdY: 48,
      lastSafePosition: safe
    })).toBeUndefined();
  });

  it('projects points along climb and drop segments', () => {
    const segment = { from: { x: 0, y: 100 }, to: { x: 100, y: 0 } };
    const t = projectPointToSegmentT({ x: 50, y: 50 }, segment);

    expect(t).toBeCloseTo(0.5);
    expect(getPointOnTraversalSegment(segment, t)).toEqual({ x: 50, y: 50 });
    expect(getDistanceToTraversalSegment({ x: 50, y: 50 }, segment)).toBeCloseTo(0);
    expect(getDistanceToTraversalSegment({ x: 50, y: 80 }, segment)).toBeCloseTo(21.21, 1);
  });

  it('requires traversal line attachment to stay close to the authored line', () => {
    const segment = {
      id: 'climb',
      kind: 'climb' as const,
      from: { x: 0, y: 100 },
      to: { x: 100, y: 0 },
      x: 50,
      y: 50,
      width: 220,
      height: 220
    };

    expect(isPointNearTraversalLine(segment, { x: 50, y: 50 }, 18)).toBe(true);
    expect(isPointNearTraversalLine(segment, { x: 50, y: 80 }, 18)).toBe(false);
  });

  it('moves ladder progress with vertical input instead of horizontal input', () => {
    expect(getClimbProgressDelta({
      verticalAxis: -1,
      fromY: 300,
      toY: 100,
      progressPerFrame: 0.02
    })).toBeCloseTo(0.02);
    expect(getClimbProgressDelta({
      verticalAxis: 1,
      fromY: 300,
      toY: 100,
      progressPerFrame: 0.02
    })).toBeCloseTo(-0.02);
  });

  it('keeps ladder attachment while input is released but detaches on jump or distance', () => {
    expect(shouldMaintainClimbAttachment({
      attached: true,
      jump: false,
      nearClimbLine: true
    })).toBe(true);
    expect(shouldMaintainClimbAttachment({
      attached: true,
      jump: true,
      nearClimbLine: true
    })).toBe(false);
    expect(shouldMaintainClimbAttachment({
      attached: true,
      jump: false,
      nearClimbLine: false
    })).toBe(false);
  });

  it('rejects assist paths that cross solid walls', () => {
    const wall = { x: 50, y: 50, width: 10, height: 100 };

    expect(isTraversalPathOccludedBySolid({
      from: { x: 0, y: 50 },
      to: { x: 100, y: 50 },
      bodySize: { width: 10, height: 10 },
      solidRects: [wall],
      skin: 0
    })).toBe(true);
    expect(isTraversalPathOccludedBySolid({
      from: { x: 0, y: -20 },
      to: { x: 100, y: -20 },
      bodySize: { width: 10, height: 10 },
      solidRects: [wall],
      skin: 0
    })).toBe(false);
  });

  it('does not treat standing on top of a solid floor as an occluded assist path', () => {
    expect(isTraversalPathOccludedBySolid({
      from: { x: 0, y: 80 },
      to: { x: 100, y: 80 },
      bodySize: { width: 20, height: 20 },
      solidRects: [{ x: 50, y: 100, width: 120, height: 20 }]
    })).toBe(false);
  });
});
