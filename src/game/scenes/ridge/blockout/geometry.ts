import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
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
const SHORTCUT_STAMP_IDS: Readonly<Record<string, string>> = {
  stampede_sketch: STAMPEDE_SKETCH_RIDGE_STAMP_ID
};

export function deriveRidgeBlockoutGeometry(
  map: RidgeBlockoutMap,
  options: RidgeBlockoutGeometryOptions = {}
): RidgeBlockoutGeometry {
  const gridColliders = deriveGridColliders(map);
  const routeConnectors = deriveFirstWalkRouteConnectors(map);
  const routeColliders = routeConnectors.flatMap((connection) => connection.colliders);
  const shortcutConnections = deriveShortcutConnections(map, options);
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

export function isRidgeBlockoutShortcutAvailable(
  shortcutId: string,
  progress: { stampIds: readonly string[] }
): boolean {
  const stampId = SHORTCUT_STAMP_IDS[shortcutId];
  return stampId ? progress.stampIds.includes(stampId) : false;
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
  map: RidgeBlockoutMap
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
      assistStart: ladderSegment?.start,
      assistEnd: ladderSegment?.end
    })];
  });
}

function deriveShortcutConnections(
  map: RidgeBlockoutMap,
  options: RidgeBlockoutGeometryOptions
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
        movement
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
    colliders: [],
    assistZones: [createAssistZone({
      cell,
      id: idPrefix,
      kind: zoneKind,
      movement,
      routeId,
      shortcutId,
      start: assistStart ?? toSurfacePoint(start, cell, movement),
      end: assistEnd ?? toSurfacePoint(end, cell, movement)
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
