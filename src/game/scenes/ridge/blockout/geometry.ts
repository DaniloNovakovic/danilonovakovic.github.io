import {
  RIDGE_BLOCKOUT_LADDER_SYMBOL,
  RIDGE_BLOCKOUT_TRAVERSAL_MOVEMENTS,
  findRidgeBlockoutAnchor,
  findRidgeBlockoutRoom,
  type RidgeBlockoutAnchor,
  type RidgeBlockoutTraversalMovement,
  type RidgeBlockoutMap,
  type RidgeBlockoutRect,
  type RidgeBlockoutRoom
} from './parser';
export { isRidgeBlockoutShortcutAvailable } from './progress';
import { isRidgeBlockoutShortcutAvailable } from './progress';

export type RidgeBlockoutColliderKind =
  | 'solid'
  | 'platform'
  | 'route-connector'
  | 'shortcut-connector';

export type RidgeTraversalMovement = RidgeBlockoutTraversalMovement;

export type RidgeBlockoutAssistZoneKind =
  | 'ramp'
  | 'climb'
  | 'drop';

export interface RidgeBlockoutBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RidgeBlockoutCollider {
  id: string;
  kind: RidgeBlockoutColliderKind;
  movement?: RidgeTraversalMovement;
  roomId?: string;
  routeId?: string;
  shortcutId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RidgeBlockoutAssistZone {
  id: string;
  kind: RidgeBlockoutAssistZoneKind;
  movement: RidgeTraversalMovement;
  routeId?: string;
  shortcutId?: string;
  from: {
    x: number;
    y: number;
  };
  to: {
    x: number;
    y: number;
  };
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RidgeBlockoutAnchorPoint {
  roomId: string;
  symbol: string;
  kind: string;
  attrs: Readonly<Record<string, string>>;
  x: number;
  y: number;
}

export interface RidgeBlockoutAnchorSelector {
  roomId: string;
  symbol?: string;
  kind?: string;
  attrId?: string;
}

export interface RidgeBlockoutRoomBounds {
  roomId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RidgeBlockoutShortcutConnection {
  id: string;
  unlocked: boolean;
  movement: RidgeTraversalMovement;
  from: RidgeBlockoutAnchorPoint;
  to: {
    x: number;
    y: number;
  };
  colliders: readonly RidgeBlockoutCollider[];
  assistZones: readonly RidgeBlockoutAssistZone[];
  platforms: readonly RidgeBlockoutCollider[];
}

export interface RidgeBlockoutTraversalConnector {
  id: string;
  movement: RidgeTraversalMovement;
  routeId?: string;
  shortcutId?: string;
  from: RidgeBlockoutAnchorPoint;
  to: RidgeBlockoutAnchorPoint | { x: number; y: number };
  colliders: readonly RidgeBlockoutCollider[];
  assistZones: readonly RidgeBlockoutAssistZone[];
}

export interface RidgeBlockoutGeometry {
  bounds: RidgeBlockoutBounds;
  roomBounds: readonly RidgeBlockoutRoomBounds[];
  anchorPoints: readonly RidgeBlockoutAnchorPoint[];
  gridColliders: readonly RidgeBlockoutCollider[];
  routeConnectors: readonly RidgeBlockoutTraversalConnector[];
  shortcutConnections: readonly RidgeBlockoutShortcutConnection[];
  assistZones: readonly RidgeBlockoutAssistZone[];
  colliders: readonly RidgeBlockoutCollider[];
}

export interface RidgeBlockoutGeometryOptions {
  stampIds?: readonly string[];
}

const COLLIDER_SYMBOLS = new Set(['#', '_']);
export function deriveRidgeBlockoutGeometry(
  map: RidgeBlockoutMap,
  options: RidgeBlockoutGeometryOptions = {}
): RidgeBlockoutGeometry {
  const gridColliders = deriveGridColliders(map);
  const solidBlockers = gridColliders.filter((collider) => collider.kind === 'solid');
  const routeConnectors = deriveFirstWalkRouteConnectors(map, solidBlockers);
  const routeColliders = routeConnectors.flatMap((connection) => connection.colliders);
  const shortcutConnections = deriveShortcutConnections(map, options, solidBlockers);
  const shortcutColliders = shortcutConnections.flatMap((connection) => connection.colliders);
  const assistZones = [
    ...routeConnectors.flatMap((connection) => connection.assistZones),
    ...shortcutConnections.flatMap((connection) => connection.assistZones)
  ];
  return {
    bounds: deriveRidgeBlockoutBounds(map),
    roomBounds: deriveRoomBounds(map),
    anchorPoints: deriveAnchorPoints(map),
    gridColliders,
    routeConnectors,
    shortcutConnections,
    assistZones,
    colliders: [...gridColliders, ...routeColliders, ...shortcutColliders]
  };
}

export function deriveRidgeBlockoutBounds(map: RidgeBlockoutMap): RidgeBlockoutBounds {
  const maxX = Math.max(
    ...map.rooms.map((room) => (room.place.x + room.size.width) * map.cell),
    map.cell
  );
  const maxY = Math.max(
    ...map.rooms.map((room) => (room.place.y + room.size.height) * map.cell),
    map.cell
  );
  return {
    x: 0,
    y: 0,
    width: maxX + map.cell,
    height: maxY + map.cell
  };
}

export function getRidgeBlockoutAnchorPoint(
  map: RidgeBlockoutMap,
  room: RidgeBlockoutRoom,
  anchor: RidgeBlockoutAnchor
): RidgeBlockoutAnchorPoint | undefined {
  const cells: Array<{ column: number; row: number }> = [];
  room.grid.forEach((row, rowIndex) => {
    [...row].forEach((symbol, columnIndex) => {
      if (symbol === anchor.symbol) {
        cells.push({ column: columnIndex, row: rowIndex });
      }
    });
  });

  if (!cells.length) return undefined;
  const minColumn = Math.min(...cells.map((cell) => cell.column));
  const maxColumn = Math.max(...cells.map((cell) => cell.column));
  const minRow = Math.min(...cells.map((cell) => cell.row));
  const maxRow = Math.max(...cells.map((cell) => cell.row));

  return {
    roomId: room.id,
    symbol: anchor.symbol,
    kind: anchor.kind,
    attrs: anchor.attrs,
    x: (room.place.x + (minColumn + maxColumn + 1) / 2) * map.cell,
    y: (room.place.y + (minRow + maxRow + 1) / 2) * map.cell
  };
}

export function findRidgeBlockoutAnchorPoint(
  geometry: Pick<RidgeBlockoutGeometry, 'anchorPoints'>,
  selector: RidgeBlockoutAnchorSelector
): RidgeBlockoutAnchorPoint | undefined {
  return geometry.anchorPoints.find((point) =>
    point.roomId === selector.roomId &&
    (!selector.symbol || point.symbol === selector.symbol) &&
    (!selector.kind || point.kind === selector.kind) &&
    (!selector.attrId || point.attrs.id === selector.attrId)
  );
}

export function getRidgeBlockoutSpawnPoint(map: RidgeBlockoutMap): RidgeBlockoutAnchorPoint {
  const spawnRoom = findRidgeBlockoutRoom(map, map.spawn.roomId);
  const spawnAnchor = spawnRoom?.anchors.find(
    (anchor) => anchor.symbol === map.spawn.anchorSymbol
  );
  const point = spawnRoom && spawnAnchor
    ? getRidgeBlockoutAnchorPoint(map, spawnRoom, spawnAnchor)
    : undefined;

  if (!point) {
    throw new Error(
      `Ridge blockout spawn anchor "${map.spawn.anchorSymbol}" in room "${map.spawn.roomId}" could not be resolved`
    );
  }

  return point;
}

function deriveRoomBounds(map: RidgeBlockoutMap): readonly RidgeBlockoutRoomBounds[] {
  return map.rooms.map((room) => ({
    roomId: room.id,
    title: room.title,
    x: room.place.x * map.cell,
    y: room.place.y * map.cell,
    width: room.size.width * map.cell,
    height: room.size.height * map.cell
  }));
}

function deriveAnchorPoints(map: RidgeBlockoutMap): readonly RidgeBlockoutAnchorPoint[] {
  return map.rooms.flatMap((room) =>
    room.anchors.flatMap((anchor) => {
      const point = getRidgeBlockoutAnchorPoint(map, room, anchor);
      return point ? [point] : [];
    })
  );
}

function deriveGridColliders(map: RidgeBlockoutMap): readonly RidgeBlockoutCollider[] {
  return map.rooms.flatMap((room) => {
    const colliders: RidgeBlockoutCollider[] = [];
    room.grid.forEach((row, rowIndex) => {
      let columnIndex = 0;
      while (columnIndex < row.length) {
        const symbol = row[columnIndex];
        if (!COLLIDER_SYMBOLS.has(symbol)) {
          columnIndex += 1;
          continue;
        }

        const runStart = columnIndex;
        while (columnIndex < row.length && row[columnIndex] === symbol) {
          columnIndex += 1;
        }
        const runLength = columnIndex - runStart;
        const isPlatform = symbol === '_';
        const height = isPlatform ? Math.max(12, Math.round(map.cell * 0.28)) : map.cell;
        colliders.push({
          id: `${room.id}:${rowIndex}:${runStart}:${symbol}`,
          kind: isPlatform ? 'platform' : 'solid',
          roomId: room.id,
          x: (room.place.x + runStart) * map.cell + runLength * map.cell / 2,
          y: (room.place.y + rowIndex) * map.cell + (isPlatform ? map.cell * 0.58 : map.cell / 2),
          width: runLength * map.cell,
          height
        });
      }
    });
    return colliders;
  });
}

function deriveFirstWalkRouteConnectors(
  map: RidgeBlockoutMap,
  solidBlockers: readonly RidgeBlockoutCollider[]
): readonly RidgeBlockoutTraversalConnector[] {
  const firstWalk = map.routes.find((route) => route.id === 'first_walk');
  if (!firstWalk) return [];

  return firstWalk.roomIds.flatMap((roomId, index) => {
    const nextRoomId = firstWalk.roomIds[index + 1];
    if (!nextRoomId) return [];
    const from = getRouteExit(map, roomId, nextRoomId);
    const to = getRouteExit(map, nextRoomId, roomId);
    const fromRoom = findRidgeBlockoutRoom(map, roomId);
    const toRoom = findRidgeBlockoutRoom(map, nextRoomId);
    if (!from || !to || !fromRoom || !toRoom) return [];
    const movement = resolveTraversalMovement(from.anchor, to.anchor, from.point, to.point, map.cell);
    const ladderSegment = movement === 'climb'
      ? resolveLadderClimbSegment({
        map,
        rooms: [fromRoom, toRoom],
        start: from.point,
        end: to.point
      })
      : undefined;
    return [createTraversalConnector({
      cell: map.cell,
      idPrefix: `route:${firstWalk.id}:${roomId}:${nextRoomId}`,
      colliderKind: 'route-connector',
      routeId: firstWalk.id,
      start: from.point,
      end: to.point,
      movement,
      solidBlockers,
      assistStart: ladderSegment?.start,
      assistEnd: ladderSegment?.end
    })];
  });
}

function deriveShortcutConnections(
  map: RidgeBlockoutMap,
  options: RidgeBlockoutGeometryOptions,
  solidBlockers: readonly RidgeBlockoutCollider[]
): readonly RidgeBlockoutShortcutConnection[] {
  return map.shortcuts.flatMap((shortcut) => {
    const sourceRoom = findRidgeBlockoutRoom(map, shortcut.fromRoomId);
    const targetRoom = findRidgeBlockoutRoom(map, shortcut.toRoomId);
    if (!sourceRoom || !targetRoom) return [];

    const sourceAnchor = findRidgeBlockoutAnchor(sourceRoom, (anchor) =>
      anchor.attrs.to === shortcut.toRoomId && anchor.attrs.requires === shortcut.id
    );
    if (!sourceAnchor) return [];

    const from = getRidgeBlockoutAnchorPoint(map, sourceRoom, sourceAnchor);
    if (!from) return [];

    const target = getShortcutTargetPoint(map, targetRoom, shortcut.id);
    const movement = resolveShortcutMovement(shortcut.kind);
    const unlocked = isRidgeBlockoutShortcutAvailable(shortcut.id, {
      stampIds: options.stampIds ?? []
    });
    const connection = unlocked
      ? createTraversalConnector({
        cell: map.cell,
        idPrefix: `shortcut:${shortcut.id}`,
        colliderKind: 'shortcut-connector',
        shortcutId: shortcut.id,
        start: from,
        end: target,
        movement,
        solidBlockers
      })
      : createEmptyTraversalConnector({
        idPrefix: `shortcut:${shortcut.id}`,
        shortcutId: shortcut.id,
        start: from,
        end: target,
        movement
      });

    return [{
      id: shortcut.id,
      unlocked,
      movement,
      from,
      to: target,
      colliders: connection.colliders,
      assistZones: connection.assistZones,
      platforms: connection.colliders
    }];
  });
}

interface RidgeRouteExit {
  anchor: RidgeBlockoutAnchor;
  point: RidgeBlockoutAnchorPoint;
}

function getRouteExit(
  map: RidgeBlockoutMap,
  roomId: string,
  toRoomId: string
): RidgeRouteExit | undefined {
  const room = findRidgeBlockoutRoom(map, roomId);
  if (!room) return undefined;
  const anchor = findRidgeBlockoutAnchor(room, (candidate) =>
    candidate.kind === 'exit' && candidate.attrs.to === toRoomId
  );
  const point = anchor ? getRidgeBlockoutAnchorPoint(map, room, anchor) : undefined;
  return anchor && point ? { anchor, point } : undefined;
}

function getShortcutTargetPoint(
  map: RidgeBlockoutMap,
  room: RidgeBlockoutRoom,
  shortcutId: string
): { x: number; y: number } {
  const namedTarget = shortcutId === 'stampede_sketch'
    ? room.rects.find((rect) => rect.id === 'stampede_return_landing')
    : undefined;
  const rect = namedTarget ?? room.rects[0];
  if (rect) {
    return getRectCenterPoint(map, room, rect);
  }
  return {
    x: (room.place.x + room.size.width / 2) * map.cell,
    y: (room.place.y + room.size.height / 2) * map.cell
  };
}

function getRectCenterPoint(
  map: RidgeBlockoutMap,
  room: RidgeBlockoutRoom,
  rect: RidgeBlockoutRect
): { x: number; y: number } {
  return {
    x: (room.place.x + rect.x + rect.width / 2) * map.cell,
    y: (room.place.y + rect.y + rect.height / 2) * map.cell
  };
}

function createTraversalConnector({
  cell,
  idPrefix,
  colliderKind,
  routeId,
  shortcutId,
  start,
  end,
  movement,
  solidBlockers,
  assistStart,
  assistEnd
}: {
  cell: number;
  idPrefix: string;
  colliderKind: Extract<RidgeBlockoutColliderKind, 'route-connector' | 'shortcut-connector'>;
  routeId?: string;
  shortcutId?: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  movement: RidgeTraversalMovement;
  solidBlockers?: readonly RidgeBlockoutCollider[];
  assistStart?: { x: number; y: number };
  assistEnd?: { x: number; y: number };
}): RidgeBlockoutTraversalConnector {
  if (movement === 'jump') {
    return {
      id: idPrefix,
      movement,
      routeId,
      shortcutId,
      from: start as RidgeBlockoutAnchorPoint,
      to: end,
      colliders: createJumpPlatforms({
        cell,
        idPrefix,
        kind: colliderKind,
        routeId,
        shortcutId,
        start,
        end
      }),
      assistZones: []
    };
  }

  const surfaceStart = assistStart ?? toSurfacePoint(start, cell, movement);
  const surfaceEnd = assistEnd ?? toSurfacePoint(end, cell, movement);
  const zoneKind = movement === 'ramp'
    ? 'ramp'
    : movement === 'climb'
      ? 'climb'
      : 'drop';
  return {
    id: idPrefix,
    movement,
    routeId,
    shortcutId,
    from: start as RidgeBlockoutAnchorPoint,
    to: end,
    colliders: movement === 'ramp'
      ? createRampBridgePlatforms({
        cell,
        idPrefix,
        kind: colliderKind,
        routeId,
        shortcutId,
        start: surfaceStart,
        end: surfaceEnd,
        solidBlockers: solidBlockers ?? []
      })
      : [],
    assistZones: [createAssistZone({
      cell,
      id: idPrefix,
      kind: zoneKind,
      movement,
      routeId,
      shortcutId,
      start: surfaceStart,
      end: surfaceEnd
    })]
  };
}

function resolveLadderClimbSegment({
  map,
  rooms,
  start,
  end
}: {
  map: RidgeBlockoutMap;
  rooms: readonly RidgeBlockoutRoom[];
  start: { x: number; y: number };
  end: { x: number; y: number };
}): { start: { x: number; y: number }; end: { x: number; y: number } } | undefined {
  const cells = rooms.flatMap((room) => getLadderCells(map, room));
  if (cells.length === 0) return undefined;

  const midpointX = (start.x + end.x) / 2;
  const x = cells.reduce((best, cell) =>
    Math.abs(cell.x - midpointX) < Math.abs(best.x - midpointX) ? cell : best
  ).x;

  return {
    start: { x, y: toSurfacePoint(start, map.cell, 'climb').y },
    end: { x, y: toSurfacePoint(end, map.cell, 'climb').y }
  };
}

function getLadderCells(
  map: RidgeBlockoutMap,
  room: RidgeBlockoutRoom
): readonly { x: number; y: number }[] {
  return room.grid.flatMap((row, rowIndex) =>
    [...row].flatMap((symbol, columnIndex) =>
      symbol === RIDGE_BLOCKOUT_LADDER_SYMBOL
        ? [{
          x: (room.place.x + columnIndex + 0.5) * map.cell,
          y: (room.place.y + rowIndex + 0.5) * map.cell
        }]
        : []
    )
  );
}

function createEmptyTraversalConnector({
  idPrefix,
  routeId,
  shortcutId,
  start,
  end,
  movement
}: {
  idPrefix: string;
  routeId?: string;
  shortcutId?: string;
  start: RidgeBlockoutAnchorPoint;
  end: { x: number; y: number };
  movement: RidgeTraversalMovement;
}): RidgeBlockoutTraversalConnector {
  return {
    id: idPrefix,
    movement,
    routeId,
    shortcutId,
    from: start,
    to: end,
    colliders: [],
    assistZones: []
  };
}

function createJumpPlatforms({
  cell,
  idPrefix,
  kind,
  routeId,
  shortcutId,
  start,
  end
}: {
  cell: number;
  idPrefix: string;
  kind: Extract<RidgeBlockoutColliderKind, 'route-connector' | 'shortcut-connector'>;
  routeId?: string;
  shortcutId?: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
}): readonly RidgeBlockoutCollider[] {
  const distanceX = Math.abs(end.x - start.x);
  const distanceY = Math.abs(end.y - start.y);
  const steps = Math.max(
    1,
    Math.min(2, Math.ceil(Math.max(distanceX / (cell * 11), distanceY / (cell * 4))))
  );

  return Array.from({ length: steps }, (_, index) => {
    const t = (index + 1) / (steps + 1);
    return {
      id: `${idPrefix}:${index + 1}`,
      kind,
      movement: 'jump',
      routeId,
      shortcutId,
      x: lerp(start.x, end.x, t),
      y: lerp(start.y, end.y, t) + cell * 0.56,
      width: Math.max(Math.round(cell * 3.4), Math.min(Math.round(distanceX * 0.34), Math.round(cell * 7))),
      height: Math.max(12, Math.round(cell * 0.24))
    };
  });
}

function createRampBridgePlatforms({
  cell,
  idPrefix,
  kind,
  routeId,
  shortcutId,
  start,
  end,
  solidBlockers
}: {
  cell: number;
  idPrefix: string;
  kind: Extract<RidgeBlockoutColliderKind, 'route-connector' | 'shortcut-connector'>;
  routeId?: string;
  shortcutId?: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  solidBlockers: readonly RidgeBlockoutCollider[];
}): readonly RidgeBlockoutCollider[] {
  const distanceX = Math.abs(end.x - start.x);
  const distanceY = Math.abs(end.y - start.y);
  if (distanceX < 0.001 && distanceY < 0.001) return [];

  const stripCount = Math.max(
    2,
    Math.ceil(Math.max(distanceX / (cell * 0.9), distanceY / (cell * 0.3)))
  );
  const width = Math.max(
    Math.round(cell * 1.2),
    Math.round(distanceX / stripCount + cell * 0.72)
  );
  const height = Math.max(12, Math.round(cell * 0.24));
  const catchOffsetY = 0;

  return Array.from({ length: stripCount }, (_, index) => {
    const t = (index + 0.5) / stripCount;
    const surfaceY = lerp(start.y, end.y, t);
    return {
      id: `${idPrefix}:ramp:${index + 1}`,
      kind,
      movement: 'ramp' as const,
      routeId,
      shortcutId,
      x: lerp(start.x, end.x, t),
      y: surfaceY + catchOffsetY + height / 2,
      width,
      height
    };
  })
    .map((collider) => trimColliderAgainstSolidBlockers(collider, solidBlockers, cell))
    .map((collider) => collider
      ? {
        ...collider,
        y: getSegmentYAtX(start, end, collider.x) + catchOffsetY + height / 2
      }
      : undefined)
    .filter((collider): collider is RidgeBlockoutCollider => collider !== undefined);
}

function createAssistZone({
  cell,
  id,
  kind,
  movement,
  routeId,
  shortcutId,
  start,
  end
}: {
  cell: number;
  id: string;
  kind: RidgeBlockoutAssistZoneKind;
  movement: RidgeTraversalMovement;
  routeId?: string;
  shortcutId?: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
}): RidgeBlockoutAssistZone {
  const paddingX = kind === 'climb' ? cell * 1.25 : cell * 1.75;
  const paddingY = kind === 'ramp' ? cell * 1.9 : cell * 2.4;
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);
  return {
    id,
    kind,
    movement,
    routeId,
    shortcutId,
    from: start,
    to: end,
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    width: Math.max(cell * 2, maxX - minX + paddingX * 2),
    height: Math.max(cell * 2, maxY - minY + paddingY * 2)
  };
}

function resolveTraversalMovement(
  fromAnchor: RidgeBlockoutAnchor,
  toAnchor: RidgeBlockoutAnchor,
  from: { x: number; y: number },
  to: { x: number; y: number },
  cell: number
): RidgeTraversalMovement {
  const explicit = parseTraversalMovement(fromAnchor.attrs.movement ?? toAnchor.attrs.movement);
  if (explicit) return explicit;
  if (Math.abs(to.y - from.y) > cell * 4) return 'climb';
  if (Math.abs(to.x - from.x) > cell * 8 && Math.abs(to.y - from.y) < cell * 2) return 'jump';
  return 'ramp';
}

function resolveShortcutMovement(kind: string | undefined): RidgeTraversalMovement {
  if (kind?.includes('drop') || kind?.includes('fall')) return 'drop';
  return parseTraversalMovement(kind) ?? 'ramp';
}

function parseTraversalMovement(value: string | undefined): RidgeTraversalMovement | undefined {
  return value && RIDGE_BLOCKOUT_TRAVERSAL_MOVEMENTS.has(value)
    ? value as RidgeTraversalMovement
    : undefined;
}

function toSurfacePoint(
  point: { x: number; y: number },
  cell: number,
  movement: RidgeTraversalMovement
): { x: number; y: number } {
  if (movement === 'climb') return { x: point.x, y: point.y + cell * 0.5 };
  if (movement === 'drop') return { x: point.x, y: point.y + cell * 0.2 };
  return { x: point.x, y: point.y + cell * 0.58 };
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function getSegmentYAtX(
  from: { x: number; y: number },
  to: { x: number; y: number },
  x: number
): number {
  const dx = to.x - from.x;
  if (Math.abs(dx) < 0.001) return Math.min(from.y, to.y);
  return lerp(from.y, to.y, (x - from.x) / dx);
}

function trimColliderAgainstSolidBlockers(
  collider: RidgeBlockoutCollider,
  solidBlockers: readonly RidgeBlockoutCollider[],
  cell: number
): RidgeBlockoutCollider | undefined {
  const clearance = 0.5;
  let left = collider.x - collider.width / 2;
  let right = collider.x + collider.width / 2;
  const top = collider.y - collider.height / 2;
  const bottom = collider.y + collider.height / 2;

  solidBlockers.forEach((solid) => {
    const solidLeft = solid.x - solid.width / 2;
    const solidRight = solid.x + solid.width / 2;
    const solidTop = solid.y - solid.height / 2;
    const solidBottom = solid.y + solid.height / 2;
    const overlapsVertically = top < solidBottom && bottom > solidTop;
    const overlapsHorizontally = left < solidRight && right > solidLeft;
    if (!overlapsVertically || !overlapsHorizontally) return;

    if (collider.x < solid.x) {
      right = Math.min(right, solidLeft - clearance);
    } else if (collider.x > solid.x) {
      left = Math.max(left, solidRight + clearance);
    } else {
      left = right;
    }
  });

  const width = right - left;
  if (width < cell * 0.45) return undefined;

  return {
    ...collider,
    x: (left + right) / 2,
    width
  };
}
