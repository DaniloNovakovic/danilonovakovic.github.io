import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import {
  findRidgeBlockoutAnchor,
  findRidgeBlockoutRoom,
  type RidgeBlockoutAnchor,
  type RidgeBlockoutMap,
  type RidgeBlockoutRect,
  type RidgeBlockoutRoom
} from './parser';

export type RidgeBlockoutColliderKind =
  | 'solid'
  | 'platform'
  | 'route-connector'
  | 'shortcut-connector';

export interface RidgeBlockoutBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RidgeBlockoutCollider {
  id: string;
  kind: RidgeBlockoutColliderKind;
  roomId?: string;
  routeId?: string;
  shortcutId?: string;
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
  from: RidgeBlockoutAnchorPoint;
  to: {
    x: number;
    y: number;
  };
  platforms: readonly RidgeBlockoutCollider[];
}

export interface RidgeBlockoutGeometry {
  bounds: RidgeBlockoutBounds;
  roomBounds: readonly RidgeBlockoutRoomBounds[];
  anchorPoints: readonly RidgeBlockoutAnchorPoint[];
  gridColliders: readonly RidgeBlockoutCollider[];
  routeConnectors: readonly RidgeBlockoutCollider[];
  shortcutConnections: readonly RidgeBlockoutShortcutConnection[];
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
  const shortcutConnections = deriveShortcutConnections(map, options);
  const shortcutColliders = shortcutConnections.flatMap((connection) => connection.platforms);
  return {
    bounds: deriveRidgeBlockoutBounds(map),
    roomBounds: deriveRoomBounds(map),
    anchorPoints: deriveAnchorPoints(map),
    gridColliders,
    routeConnectors,
    shortcutConnections,
    colliders: [...gridColliders, ...routeConnectors, ...shortcutColliders]
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

function deriveFirstWalkRouteConnectors(map: RidgeBlockoutMap): readonly RidgeBlockoutCollider[] {
  const firstWalk = map.routes.find((route) => route.id === 'first_walk');
  if (!firstWalk) return [];

  return firstWalk.roomIds.flatMap((roomId, index) => {
    const nextRoomId = firstWalk.roomIds[index + 1];
    if (!nextRoomId) return [];
    const from = getRouteExitPoint(map, roomId, nextRoomId);
    const to = getRouteExitPoint(map, nextRoomId, roomId);
    if (!from || !to) return [];
    return createSteppedPlatforms({
      cell: map.cell,
      idPrefix: `route:${firstWalk.id}:${roomId}:${nextRoomId}`,
      kind: 'route-connector',
      routeId: firstWalk.id,
      start: from,
      end: to
    });
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
    const unlocked = isRidgeBlockoutShortcutAvailable(shortcut.id, {
      stampIds: options.stampIds ?? []
    });
    const platforms = unlocked
      ? createSteppedPlatforms({
        cell: map.cell,
        idPrefix: `shortcut:${shortcut.id}`,
        kind: 'shortcut-connector',
        shortcutId: shortcut.id,
        start: from,
        end: target
      })
      : [];

    return [{
      id: shortcut.id,
      unlocked,
      from,
      to: target,
      platforms
    }];
  });
}

function getRouteExitPoint(
  map: RidgeBlockoutMap,
  roomId: string,
  toRoomId: string
): RidgeBlockoutAnchorPoint | undefined {
  const room = findRidgeBlockoutRoom(map, roomId);
  if (!room) return undefined;
  const anchor = findRidgeBlockoutAnchor(room, (candidate) =>
    candidate.kind === 'exit' && candidate.attrs.to === toRoomId
  );
  return anchor ? getRidgeBlockoutAnchorPoint(map, room, anchor) : undefined;
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

function createSteppedPlatforms({
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
    2,
    Math.min(18, Math.ceil(Math.max(distanceX / (cell * 1.55), distanceY / (cell * 1.2))))
  );

  return Array.from({ length: steps - 1 }, (_, index) => {
    const t = (index + 1) / steps;
    return {
      id: `${idPrefix}:${index + 1}`,
      kind,
      routeId,
      shortcutId,
      x: lerp(start.x, end.x, t),
      y: lerp(start.y, end.y, t) + Math.sin(t * Math.PI) * cell * 0.18,
      width: Math.max(60, Math.round(cell * 1.35)),
      height: Math.max(12, Math.round(cell * 0.24))
    };
  });
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}
