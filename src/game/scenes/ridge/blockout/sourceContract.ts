import type { RidgeBlockoutMap, RidgeBlockoutTraversalMovement } from './parser';

export type AuthoringSymbol = string;
export type RuntimeTileId = number;

export type RidgeTileKind =
  | 'empty'
  | 'solid'
  | 'platform'
  | 'ladder'
  | 'anchor'
  | 'design';

export interface RidgeTileDefinition {
  symbol: AuthoringSymbol;
  id: RuntimeTileId;
  kind: RidgeTileKind;
  label: string;
  runtimeActive?: boolean;
}

export type RidgeTileRegistry = readonly RidgeTileDefinition[];

export type RidgeBlockoutAttrs = Readonly<Record<string, string>>;

export interface RidgeBlockoutSourcePoint {
  x: number;
  y: number;
}

export interface RidgeBlockoutSourceSize {
  width: number;
  height: number;
}

export interface RidgeBlockoutSourceAnchor {
  symbol: AuthoringSymbol;
  kind: string;
  attrs?: RidgeBlockoutAttrs;
}

export interface RidgeBlockoutSourceRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  attrs?: RidgeBlockoutAttrs;
}

export interface RidgeBlockoutSourceRoom {
  id: string;
  title: string;
  place: RidgeBlockoutSourcePoint;
  size: RidgeBlockoutSourceSize;
  theme?: string;
  mood?: string;
  links?: readonly string[];
  props?: readonly string[];
  grid: readonly string[];
  anchors?: readonly RidgeBlockoutSourceAnchor[];
  rects?: readonly RidgeBlockoutSourceRect[];
  declarations?: readonly string[];
}

export interface RidgeBlockoutSourceRoute {
  id: string;
  roomIds: readonly string[];
}

export interface RidgeBlockoutSourceShortcut {
  id: string;
  fromRoomId: string;
  toRoomId: string;
  kind?: string;
}

export interface RidgeBlockoutSourceOptionalPocket {
  id: string;
  roomId?: string;
  kind?: string;
}

export interface RidgeBlockoutSourceHomeMutation {
  id: string;
  attrs: RidgeBlockoutAttrs;
}

export interface RidgeBlockoutSource {
  language: 'ridge-v0';
  cell: number;
  worldId: string;
  title: string;
  tileRegistry: RidgeTileRegistry;
  spawn: {
    roomId: string;
    anchorSymbol: AuthoringSymbol;
  };
  routes: readonly RidgeBlockoutSourceRoute[];
  futureRoutes?: readonly RidgeBlockoutSourceRoute[];
  shortcuts?: readonly RidgeBlockoutSourceShortcut[];
  optionalPockets?: readonly RidgeBlockoutSourceOptionalPocket[];
  homeMutations?: readonly RidgeBlockoutSourceHomeMutation[];
  rooms: readonly RidgeBlockoutSourceRoom[];
}

export interface RidgeCompiledBlockoutRoom {
  id: string;
  runtimeTileRows: readonly (readonly RuntimeTileId[])[];
}

export interface RidgeCompiledBlockout {
  source: RidgeBlockoutSource;
  map: RidgeBlockoutMap;
  tileRegistry: RidgeTileRegistry;
  runtimeTileRooms: readonly RidgeCompiledBlockoutRoom[];
  validationErrors: readonly string[];
}

export type RidgeBlockoutSourceTraversalMovement = RidgeBlockoutTraversalMovement;
