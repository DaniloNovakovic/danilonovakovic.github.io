import {
  RIDGE_BLOCKOUT_TRAVERSAL_MOVEMENTS,
  type RidgeBlockoutMap,
  type RidgeBlockoutTraversalMovement
} from './parser';
import {
  deriveRidgeBlockoutGeometry,
  type RidgeBlockoutAnchorPoint,
  type RidgeBlockoutAnchorSelector,
  type RidgeBlockoutBounds,
  type RidgeBlockoutGeometry,
  type RidgeBlockoutRoomBounds
} from './geometry';
import {
  getRidgeBlockoutShortcutRequiredStampId,
  isRidgeBlockoutShortcutAvailable
} from './progress';

export type RidgeBlockoutRouteKind = 'route' | 'future_route';

export interface RidgeRouteLinkFact {
  fromRoomId: string;
  toRoomId: string;
}

export interface RidgeAnchorFact extends RidgeBlockoutAnchorPoint {
  id?: string;
  label?: string;
  targetRoomId?: string;
  requires?: string;
  movement?: RidgeBlockoutTraversalMovement;
  reward?: string;
}

export interface RidgeRoomBeatFact {
  id: string;
  title: string;
  theme?: string;
  mood?: string;
  links: readonly string[];
  props: readonly string[];
  declarations: readonly string[];
  bounds: RidgeBlockoutRoomBounds;
  anchors: readonly RidgeAnchorFact[];
}

export interface RidgeRouteFact {
  id: string;
  kind: RidgeBlockoutRouteKind;
  roomIds: readonly string[];
  links: readonly RidgeRouteLinkFact[];
}

export interface RidgeShortcutFact {
  id: string;
  fromRoomId: string;
  toRoomId: string;
  kind?: string;
  movement: RidgeBlockoutTraversalMovement;
  requiredStampId?: string;
  available: boolean;
  from?: RidgeAnchorFact;
  to: {
    x: number;
    y: number;
  };
}

export interface RidgeHomeMutationFact {
  id: string;
  adds?: string;
  opens?: string;
  attrs: Readonly<Record<string, string>>;
}

export interface RidgeBlockoutFacts {
  worldId: string;
  title: string;
  cell: number;
  bounds: RidgeBlockoutBounds;
  spawn: RidgeAnchorFact;
  rooms: readonly RidgeRoomBeatFact[];
  anchors: readonly RidgeAnchorFact[];
  routes: readonly RidgeRouteFact[];
  futureRoutes: readonly RidgeRouteFact[];
  shortcuts: readonly RidgeShortcutFact[];
  homeMutations: readonly RidgeHomeMutationFact[];
}

export interface RidgeBlockoutFactsOptions {
  stampIds?: readonly string[];
  geometry?: RidgeBlockoutGeometry;
}

export function compileRidgeBlockoutFacts(
  map: RidgeBlockoutMap,
  options: RidgeBlockoutFactsOptions = {}
): RidgeBlockoutFacts {
  const geometry = options.geometry ?? deriveRidgeBlockoutGeometry(map, {
    stampIds: options.stampIds
  });
  const anchors = geometry.anchorPoints.map(toAnchorFact);
  const rooms = map.rooms.map((room) => {
    const bounds = geometry.roomBounds.find((candidate) => candidate.roomId === room.id);
    if (!bounds) {
      throw new Error(`Ridge blockout room "${room.id}" could not be compiled into facts`);
    }
    return {
      id: room.id,
      title: room.title,
      theme: room.theme,
      mood: room.mood,
      links: room.links,
      props: room.props,
      declarations: room.declarations,
      bounds,
      anchors: anchors.filter((anchor) => anchor.roomId === room.id)
    };
  });
  const spawn = findRidgeBlockoutFactAnchor({ anchors }, {
    roomId: map.spawn.roomId,
    symbol: map.spawn.anchorSymbol
  });
  if (!spawn) {
    throw new Error(
      `Ridge blockout spawn anchor "${map.spawn.anchorSymbol}" in room "${map.spawn.roomId}" could not be compiled into facts`
    );
  }

  return {
    worldId: map.worldId,
    title: map.title,
    cell: map.cell,
    bounds: geometry.bounds,
    spawn,
    rooms,
    anchors,
    routes: map.routes.map((route) => toRouteFact(route, 'route')),
    futureRoutes: map.futureRoutes.map((route) => toRouteFact(route, 'future_route')),
    shortcuts: map.shortcuts.map((shortcut) => {
      const connection = geometry.shortcutConnections.find((candidate) => candidate.id === shortcut.id);
      const source = anchors.find((anchor) =>
        anchor.roomId === shortcut.fromRoomId &&
        anchor.targetRoomId === shortcut.toRoomId &&
        anchor.requires === shortcut.id
      );
      const available = options.geometry && options.stampIds === undefined
        ? connection?.unlocked ?? false
        : isRidgeBlockoutShortcutAvailable(shortcut.id, {
          stampIds: options.stampIds ?? []
        });
      return {
        id: shortcut.id,
        fromRoomId: shortcut.fromRoomId,
        toRoomId: shortcut.toRoomId,
        kind: shortcut.kind,
        movement: connection?.movement ?? 'ramp',
        requiredStampId: getRidgeBlockoutShortcutRequiredStampId(shortcut.id),
        available,
        from: source,
        to: connection?.to ?? getRoomCenter(geometry, shortcut.toRoomId) ?? { x: 0, y: 0 }
      };
    }),
    homeMutations: map.homeMutations.map((mutation) => ({
      id: mutation.id,
      adds: mutation.attrs.adds,
      opens: mutation.attrs.opens,
      attrs: mutation.attrs
    }))
  };
}

export function findRidgeBlockoutFactAnchor(
  facts: Pick<RidgeBlockoutFacts, 'anchors'>,
  selector: RidgeBlockoutAnchorSelector
): RidgeAnchorFact | undefined {
  return facts.anchors.find((point) =>
    point.roomId === selector.roomId &&
    (!selector.symbol || point.symbol === selector.symbol) &&
    (!selector.kind || point.kind === selector.kind) &&
    (!selector.attrId || point.id === selector.attrId)
  );
}

function toAnchorFact(point: RidgeBlockoutAnchorPoint): RidgeAnchorFact {
  return {
    ...point,
    id: point.attrs.id,
    label: point.attrs.label,
    targetRoomId: point.attrs.to,
    requires: point.attrs.requires,
    movement: parseTraversalMovement(point.attrs.movement),
    reward: point.attrs.reward
  };
}

function toRouteFact(
  route: { id: string; roomIds: readonly string[] },
  kind: RidgeBlockoutRouteKind
): RidgeRouteFact {
  return {
    id: route.id,
    kind,
    roomIds: route.roomIds,
    links: route.roomIds.slice(0, -1).map((roomId, index) => ({
      fromRoomId: roomId,
      toRoomId: route.roomIds[index + 1] ?? ''
    }))
  };
}

function parseTraversalMovement(value: string | undefined): RidgeBlockoutTraversalMovement | undefined {
  return value && RIDGE_BLOCKOUT_TRAVERSAL_MOVEMENTS.has(value)
    ? value as RidgeBlockoutTraversalMovement
    : undefined;
}

function getRoomCenter(
  geometry: Pick<RidgeBlockoutGeometry, 'roomBounds'>,
  roomId: string
): { x: number; y: number } | undefined {
  const room = geometry.roomBounds.find((candidate) => candidate.roomId === roomId);
  return room
    ? {
      x: room.x + room.width / 2,
      y: room.y + room.height / 2
    }
    : undefined;
}
