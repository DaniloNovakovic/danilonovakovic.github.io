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

export interface RidgeTraversalSize {
  width: number;
  height: number;
}

export interface RidgeTraversalRect {
  x: number;
  y: number;
  width: number;
  height: number;
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

function isPointInsideTraversalZone(
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

export function isMantleTargetCollider(collider: { kind: string }): boolean {
  return (
    collider.kind === 'platform' ||
    collider.kind === 'route-connector' ||
    collider.kind === 'shortcut-connector'
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

export function getClimbProgressDelta(input: {
  verticalAxis: number;
  fromY: number;
  toY: number;
  progressPerSecond: number;
  deltaMs: number;
}): number {
  if (input.verticalAxis === 0) return 0;
  const directionY = Math.sign(input.toY - input.fromY) || 1;
  return input.verticalAxis * directionY * input.progressPerSecond * getClampedDeltaSeconds(input.deltaMs);
}

export function shouldMaintainClimbAttachment(input: {
  attached: boolean;
  jump: boolean;
  horizontalAxis: number;
  nearClimbLine: boolean;
}): boolean {
  return input.attached && !input.jump && input.horizontalAxis === 0 && input.nearClimbLine;
}

export function getFrameRateIndependentLerpAlpha(
  referenceFrameAlpha: number,
  deltaMs: number
): number {
  const clampedAlpha = clamp(referenceFrameAlpha, 0, 1);
  if (clampedAlpha === 0 || clampedAlpha === 1) return clampedAlpha;
  const referenceFrames = getClampedDeltaSeconds(deltaMs) / (1 / 60);
  return 1 - ((1 - clampedAlpha) ** referenceFrames);
}

export function isTraversalPathOccludedBySolid(input: {
  from: RidgeTraversalPoint;
  to: RidgeTraversalPoint;
  bodySize: RidgeTraversalSize;
  solidRects: readonly RidgeTraversalRect[];
  skin?: number;
}): boolean {
  const skin = input.skin ?? 4;
  const inflateX = Math.max(0, input.bodySize.width / 2 - skin);
  const inflateY = Math.max(0, input.bodySize.height / 2 - skin);

  return input.solidRects.some((rect) =>
    doesSegmentIntersectRect(input.from, input.to, inflateRect(rect, inflateX, inflateY))
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

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getClampedDeltaSeconds(deltaMs: number): number {
  return clamp(deltaMs, 0, 50) / 1000;
}

function inflateRect(
  rect: RidgeTraversalRect,
  inflateX: number,
  inflateY: number
): RidgeTraversalRect {
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width + inflateX * 2,
    height: rect.height + inflateY * 2
  };
}

function doesSegmentIntersectRect(
  from: RidgeTraversalPoint,
  to: RidgeTraversalPoint,
  rect: RidgeTraversalRect
): boolean {
  if (isPointInsideRect(from, rect) || isPointInsideRect(to, rect)) return true;

  const left = rect.x - rect.width / 2;
  const right = rect.x + rect.width / 2;
  const top = rect.y - rect.height / 2;
  const bottom = rect.y + rect.height / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  let tMin = 0;
  let tMax = 1;

  const clippedX = clipSegmentAxis(from.x, dx, left, right, tMin, tMax);
  if (!clippedX) return false;
  tMin = clippedX.tMin;
  tMax = clippedX.tMax;

  const clippedY = clipSegmentAxis(from.y, dy, top, bottom, tMin, tMax);
  return clippedY !== undefined;
}

function clipSegmentAxis(
  start: number,
  delta: number,
  min: number,
  max: number,
  tMin: number,
  tMax: number
): { tMin: number; tMax: number } | undefined {
  if (Math.abs(delta) < 0.001) {
    return start >= min && start <= max ? { tMin, tMax } : undefined;
  }

  const t1 = (min - start) / delta;
  const t2 = (max - start) / delta;
  const axisMin = Math.min(t1, t2);
  const axisMax = Math.max(t1, t2);
  const nextMin = Math.max(tMin, axisMin);
  const nextMax = Math.min(tMax, axisMax);
  return nextMin <= nextMax ? { tMin: nextMin, tMax: nextMax } : undefined;
}

function isPointInsideRect(point: RidgeTraversalPoint, rect: RidgeTraversalRect): boolean {
  return (
    point.x >= rect.x - rect.width / 2 &&
    point.x <= rect.x + rect.width / 2 &&
    point.y >= rect.y - rect.height / 2 &&
    point.y <= rect.y + rect.height / 2
  );
}
