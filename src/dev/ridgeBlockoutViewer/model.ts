import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import {
  RIDGE_BLOCKOUT,
  RIDGE_BLOCKOUT_RUNTIME_TILE_ROOMS,
  RIDGE_BLOCKOUT_SOURCE,
  RIDGE_BLOCKOUT_TILE_REGISTRY,
  compileRidgeBlockoutFacts,
  deriveRidgeBlockoutGeometry,
  findRidgeBlockoutRoom,
  type RidgeBlockoutAssistZone,
  type RidgeBlockoutBounds,
  type RidgeBlockoutCollider,
  type RidgeBlockoutGeometry,
  type RidgeBlockoutRoom,
  type RidgeTileDefinition
} from '@/game/scenes/ridge/blockout';
import { FOLDED_DESK_RIDGE_COMPILED_BLOCKOUT } from '@/game/scenes/ridge/blockout/sources/folded-desk-ridge.generated';

export type RidgeViewerLayerId =
  | 'grid'
  | 'rooms'
  | 'anchors'
  | 'routes'
  | 'futureRoutes'
  | 'shortcuts'
  | 'colliders'
  | 'assistZones'
  | 'rects';

export interface RidgeViewerTileCell {
  id: string;
  roomId: string;
  column: number;
  row: number;
  symbol: string;
  runtimeTileId: number | undefined;
  tile: RidgeTileDefinition | undefined;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RidgeViewerRoom {
  id: string;
  title: string;
  theme?: string;
  mood?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RidgeViewerAnchor {
  id: string;
  roomId: string;
  roomTitle: string;
  symbol: string;
  kind: string;
  label?: string;
  attrId?: string;
  targetRoomId?: string;
  requires?: string;
  movement?: string;
  x: number;
  y: number;
}

export interface RidgeViewerRouteLink {
  id: string;
  routeId: string;
  fromRoomId: string;
  toRoomId: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  movement?: string;
}

export interface RidgeViewerRoute {
  id: string;
  kind: 'route' | 'future_route';
  roomIds: readonly string[];
  links: readonly RidgeViewerRouteLink[];
}

export interface RidgeViewerShortcut {
  id: string;
  fromRoomId: string;
  toRoomId: string;
  requiredStampId?: string;
  lockedAvailable: boolean;
  unlockedAvailable: boolean;
  lockedConnection?: RidgeBlockoutGeometry['shortcutConnections'][number];
  unlockedConnection?: RidgeBlockoutGeometry['shortcutConnections'][number];
}

export interface RidgeViewerRect {
  id: string;
  roomId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  attrs: Readonly<Record<string, string>>;
}

export interface RidgeBlockoutViewerModel {
  worldId: string;
  generatedWorldId: string;
  sourceWorldId: string;
  title: string;
  cell: number;
  bounds: RidgeBlockoutBounds;
  validationErrors: readonly string[];
  tileRegistry: readonly RidgeTileDefinition[];
  rooms: readonly RidgeViewerRoom[];
  gridCells: readonly RidgeViewerTileCell[];
  anchors: readonly RidgeViewerAnchor[];
  routes: readonly RidgeViewerRoute[];
  futureRoutes: readonly RidgeViewerRoute[];
  shortcuts: readonly RidgeViewerShortcut[];
  rects: readonly RidgeViewerRect[];
  lockedGeometry: RidgeBlockoutGeometry;
  unlockedGeometry: RidgeBlockoutGeometry;
  colliders: readonly RidgeBlockoutCollider[];
  assistZones: readonly RidgeBlockoutAssistZone[];
}

const DEFAULT_UNLOCKED_STAMPS = [STAMPEDE_SKETCH_RIDGE_STAMP_ID];

export function createRidgeBlockoutViewerModel(): RidgeBlockoutViewerModel {
  const lockedGeometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT, { stampIds: [] });
  const unlockedGeometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT, {
    stampIds: DEFAULT_UNLOCKED_STAMPS
  });
  const lockedFacts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT, {
    geometry: lockedGeometry,
    stampIds: []
  });
  const unlockedFacts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT, {
    geometry: unlockedGeometry,
    stampIds: DEFAULT_UNLOCKED_STAMPS
  });

  return {
    worldId: RIDGE_BLOCKOUT.worldId,
    generatedWorldId: FOLDED_DESK_RIDGE_COMPILED_BLOCKOUT.map.worldId,
    sourceWorldId: RIDGE_BLOCKOUT_SOURCE.worldId,
    title: RIDGE_BLOCKOUT.title,
    cell: RIDGE_BLOCKOUT.cell,
    bounds: lockedGeometry.bounds,
    validationErrors: [
      ...new Set([
        ...FOLDED_DESK_RIDGE_COMPILED_BLOCKOUT.validationErrors,
        ...RIDGE_BLOCKOUT.validationErrors
      ])
    ],
    tileRegistry: RIDGE_BLOCKOUT_TILE_REGISTRY,
    rooms: toViewerRooms(RIDGE_BLOCKOUT.rooms),
    gridCells: toViewerGridCells(),
    anchors: lockedFacts.anchors.map((anchor) => ({
      id: `${anchor.roomId}:${anchor.symbol}:${anchor.kind}:${anchor.id ?? anchor.label ?? anchor.x}`,
      roomId: anchor.roomId,
      roomTitle: findRidgeBlockoutRoom(RIDGE_BLOCKOUT, anchor.roomId)?.title ?? anchor.roomId,
      symbol: anchor.symbol,
      kind: anchor.kind,
      label: anchor.label,
      attrId: anchor.id,
      targetRoomId: anchor.targetRoomId,
      requires: anchor.requires,
      movement: anchor.movement,
      x: anchor.x,
      y: anchor.y
    })),
    routes: lockedFacts.routes.map((route) => toViewerRoute(route, lockedGeometry, 'route')),
    futureRoutes: lockedFacts.futureRoutes.map((route) =>
      toViewerRoute(route, lockedGeometry, 'future_route')
    ),
    shortcuts: lockedFacts.shortcuts.map((shortcut) => {
      const unlockedShortcut = unlockedFacts.shortcuts.find((candidate) =>
        candidate.id === shortcut.id
      );
      return {
        id: shortcut.id,
        fromRoomId: shortcut.fromRoomId,
        toRoomId: shortcut.toRoomId,
        requiredStampId: shortcut.requiredStampId,
        lockedAvailable: shortcut.available,
        unlockedAvailable: unlockedShortcut?.available ?? false,
        lockedConnection: lockedGeometry.shortcutConnections.find((connection) =>
          connection.id === shortcut.id
        ),
        unlockedConnection: unlockedGeometry.shortcutConnections.find((connection) =>
          connection.id === shortcut.id
        )
      };
    }),
    rects: RIDGE_BLOCKOUT.rooms.flatMap((room) =>
      room.rects.map((rect) => ({
        id: rect.id,
        roomId: room.id,
        x: (room.place.x + rect.x) * RIDGE_BLOCKOUT.cell,
        y: (room.place.y + rect.y) * RIDGE_BLOCKOUT.cell,
        width: rect.width * RIDGE_BLOCKOUT.cell,
        height: rect.height * RIDGE_BLOCKOUT.cell,
        attrs: rect.attrs
      }))
    ),
    lockedGeometry,
    unlockedGeometry,
    colliders: lockedGeometry.colliders,
    assistZones: lockedGeometry.assistZones
  };
}

function toViewerRooms(rooms: readonly RidgeBlockoutRoom[]): readonly RidgeViewerRoom[] {
  return rooms.map((room) => ({
    id: room.id,
    title: room.title,
    theme: room.theme,
    mood: room.mood,
    x: room.place.x * RIDGE_BLOCKOUT.cell,
    y: room.place.y * RIDGE_BLOCKOUT.cell,
    width: room.size.width * RIDGE_BLOCKOUT.cell,
    height: room.size.height * RIDGE_BLOCKOUT.cell
  }));
}

function toViewerGridCells(): readonly RidgeViewerTileCell[] {
  const tilesBySymbol = new Map<string, RidgeTileDefinition>(
    RIDGE_BLOCKOUT_TILE_REGISTRY.map((tile) => [tile.symbol, tile])
  );
  const runtimeRowsByRoomId = new Map(
    RIDGE_BLOCKOUT_RUNTIME_TILE_ROOMS.map((room) => [room.id, room.runtimeTileRows])
  );

  return RIDGE_BLOCKOUT.rooms.flatMap((room) => {
    const runtimeRows = runtimeRowsByRoomId.get(room.id);
    return room.grid.flatMap((row, rowIndex) =>
      [...row].map((symbol, columnIndex) => ({
        id: `${room.id}:${rowIndex}:${columnIndex}:${symbol}`,
        roomId: room.id,
        column: columnIndex,
        row: rowIndex,
        symbol,
        runtimeTileId: runtimeRows?.[rowIndex]?.[columnIndex],
        tile: tilesBySymbol.get(symbol),
        x: (room.place.x + columnIndex) * RIDGE_BLOCKOUT.cell,
        y: (room.place.y + rowIndex) * RIDGE_BLOCKOUT.cell,
        width: RIDGE_BLOCKOUT.cell,
        height: RIDGE_BLOCKOUT.cell
      }))
    );
  });
}

function toViewerRoute(
  route: { id: string; roomIds: readonly string[]; links: readonly { fromRoomId: string; toRoomId: string }[] },
  geometry: RidgeBlockoutGeometry,
  kind: RidgeViewerRoute['kind']
): RidgeViewerRoute {
  return {
    id: route.id,
    kind,
    roomIds: route.roomIds,
    links: route.links.map((link) => {
      const connector = geometry.routeConnectors.find((candidate) =>
        candidate.routeId === route.id &&
        candidate.from.roomId === link.fromRoomId &&
        'roomId' in candidate.to &&
        candidate.to.roomId === link.toRoomId
      );
      return {
        id: `${route.id}:${link.fromRoomId}:${link.toRoomId}`,
        routeId: route.id,
        fromRoomId: link.fromRoomId,
        toRoomId: link.toRoomId,
        from: connector?.from ?? findRoutePoint(geometry, link.fromRoomId, link.toRoomId),
        to: connector?.to ?? findRoutePoint(geometry, link.toRoomId, link.fromRoomId),
        movement: connector?.movement
      };
    })
  };
}

function findRoutePoint(
  geometry: RidgeBlockoutGeometry,
  roomId: string,
  toRoomId: string
): { x: number; y: number } {
  const anchor = geometry.anchorPoints.find((point) =>
    point.roomId === roomId && point.attrs.to === toRoomId
  );
  if (anchor) return anchor;
  const room = geometry.roomBounds.find((candidate) => candidate.roomId === roomId);
  return room
    ? { x: room.x + room.width / 2, y: room.y + room.height / 2 }
    : { x: 0, y: 0 };
}
