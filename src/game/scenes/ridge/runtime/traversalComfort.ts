export interface RidgeTraversalPoint {
  x: number;
  y: number;
}

export interface RidgeTraversalLineZone {
  id: string;
  kind: 'ramp' | 'climb' | 'drop';
  from: RidgeTraversalPoint;
  to: RidgeTraversalPoint;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RidgeLedgeCandidate {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RidgeSafePosition {
  x: number;
  y: number;
}

export interface RidgeRampSnapOptions {
  maxSnapDownY: number;
  maxSnapUpY: number;
}

export function getRampSurfaceYAtX(
  zone: Pick<RidgeTraversalLineZone, 'from' | 'to'>,
  x: number
): number | undefined {
  const minX = Math.min(zone.from.x, zone.to.x);
  const maxX = Math.max(zone.from.x, zone.to.x);
  if (x < minX || x > maxX) return undefined;
  const dx = zone.to.x - zone.from.x;
  if (Math.abs(dx) < 0.001) return Math.min(zone.from.y, zone.to.y);
  const t = (x - zone.from.x) / dx;
  return lerp(zone.from.y, zone.to.y, t);
}

export function isPointInsideTraversalZone(
  zone: Pick<RidgeTraversalLineZone, 'x' | 'y' | 'width' | 'height'>,
  point: RidgeTraversalPoint
): boolean {
  return (
    point.x >= zone.x - zone.width / 2 &&
    point.x <= zone.x + zone.width / 2 &&
    point.y >= zone.y - zone.height / 2 &&
    point.y <= zone.y + zone.height / 2
  );
}

export function resolveRampSurfaceY(
  zones: readonly RidgeTraversalLineZone[],
  point: RidgeTraversalPoint,
  toleranceY: number
): { zone: RidgeTraversalLineZone; y: number } | undefined {
  return zones.reduce<{ zone: RidgeTraversalLineZone; y: number; distance: number } | undefined>(
    (best, zone) => {
      if (zone.kind !== 'ramp' || !isPointInsideTraversalZone(zone, point)) return best;
      const y = getRampSurfaceYAtX(zone, point.x);
      if (y === undefined) return best;
      const distance = Math.abs(point.y - y);
      if (distance > toleranceY) return best;
      return !best || distance < best.distance ? { zone, y, distance } : best;
    },
    undefined
  );
}

export function resolveWalkableRampSurfaceY(
  zones: readonly RidgeTraversalLineZone[],
  point: RidgeTraversalPoint,
  options: RidgeRampSnapOptions
): { zone: RidgeTraversalLineZone; y: number } | undefined {
  return zones.reduce<{ zone: RidgeTraversalLineZone; y: number; distance: number } | undefined>(
    (best, zone) => {
      if (zone.kind !== 'ramp' || !isPointInsideTraversalZone(zone, point)) return best;
      const y = getRampSurfaceYAtX(zone, point.x);
      if (y === undefined) return best;

      const snapDownDistance = y - point.y;
      const snapUpDistance = point.y - y;
      const canSnapDown = snapDownDistance >= 0 && snapDownDistance <= options.maxSnapDownY;
      const canSnapUp = snapUpDistance >= 0 && snapUpDistance <= options.maxSnapUpY;
      if (!canSnapDown && !canSnapUp) return best;

      const distance = Math.abs(point.y - y);
      return !best || distance < best.distance ? { zone, y, distance } : best;
    },
    undefined
  );
}

export function canMantleLedge(input: {
  playerX: number;
  playerBottomY: number;
  moveAxis: number;
  ledge: RidgeLedgeCandidate;
  maxHorizontalDistance: number;
  minVerticalDelta: number;
  maxVerticalDelta: number;
}): boolean {
  if (input.moveAxis === 0) return false;
  const ledgeLeft = input.ledge.x - input.ledge.width / 2;
  const ledgeRight = input.ledge.x + input.ledge.width / 2;
  const targetX = input.moveAxis > 0 ? ledgeLeft : ledgeRight;
  const horizontalDistance = Math.abs(targetX - input.playerX);
  const movingToward =
    input.moveAxis > 0
      ? input.playerX <= ledgeRight
      : input.playerX >= ledgeLeft;
  const verticalDelta = input.playerBottomY - getLedgeTop(input.ledge);

  return (
    movingToward &&
    horizontalDistance <= input.maxHorizontalDistance &&
    verticalDelta >= input.minVerticalDelta &&
    verticalDelta <= input.maxVerticalDelta
  );
}

export function canStepUp(input: {
  playerBottomY: number;
  obstacleTopY: number;
  maxStepHeight: number;
}): boolean {
  const stepHeight = input.playerBottomY - input.obstacleTopY;
  return stepHeight > 0 && stepHeight <= input.maxStepHeight;
}

export function chooseFallRecovery(input: {
  playerY: number;
  worldBottomY: number;
  thresholdY: number;
  lastSafePosition?: RidgeSafePosition;
}): RidgeSafePosition | undefined {
  if (!input.lastSafePosition) return undefined;
  return input.playerY >= input.worldBottomY - input.thresholdY
    ? input.lastSafePosition
    : undefined;
}

export function projectPointToSegmentT(
  point: RidgeTraversalPoint,
  segment: Pick<RidgeTraversalLineZone, 'from' | 'to'>
): number {
  const dx = segment.to.x - segment.from.x;
  const dy = segment.to.y - segment.from.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= 0.001) return 0;
  return clamp(
    ((point.x - segment.from.x) * dx + (point.y - segment.from.y) * dy) / lengthSquared,
    0,
    1
  );
}

export function getDistanceToTraversalSegment(
  point: RidgeTraversalPoint,
  segment: Pick<RidgeTraversalLineZone, 'from' | 'to'>
): number {
  const t = projectPointToSegmentT(point, segment);
  const projected = getPointOnTraversalSegment(segment, t);
  return Math.hypot(point.x - projected.x, point.y - projected.y);
}

export function isPointNearTraversalLine(
  zone: RidgeTraversalLineZone,
  point: RidgeTraversalPoint,
  maxDistance: number
): boolean {
  return (
    isPointInsideTraversalZone(zone, point) &&
    getDistanceToTraversalSegment(point, zone) <= maxDistance
  );
}

export function getPointOnTraversalSegment(
  segment: Pick<RidgeTraversalLineZone, 'from' | 'to'>,
  t: number
): RidgeTraversalPoint {
  return {
    x: lerp(segment.from.x, segment.to.x, clamp(t, 0, 1)),
    y: lerp(segment.from.y, segment.to.y, clamp(t, 0, 1))
  };
}

export function getLedgeTop(ledge: RidgeLedgeCandidate): number {
  return ledge.y - ledge.height / 2;
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
