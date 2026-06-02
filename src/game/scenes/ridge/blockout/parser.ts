const RIDGE_BLOCKOUT_RUNTIME_SYMBOLS = new Set([
  '.',
  '#',
  '_',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'C',
  'A',
  '*',
  '^',
  '?'
]);

const RIDGE_BLOCKOUT_DESIGN_SYMBOLS = new Set(['=', '~', 'N', 'M']);

export {
  RIDGE_BLOCKOUT_LADDER_SYMBOL,
  RIDGE_BLOCKOUT_TRAVERSAL_MOVEMENTS,
  type RidgeBlockoutTraversalMovement
} from './ridgeBlockoutConstants';
import { RIDGE_BLOCKOUT_LADDER_SYMBOL } from './ridgeBlockoutConstants';
import {
  appendDuplicateRidgeBlockoutRoomId,
  appendRidgeBlockoutHeaderErrors,
  appendRidgeBlockoutRoomAnchorErrors,
  appendRidgeBlockoutRoomGridErrors,
  appendRidgeBlockoutRouteErrors,
  appendRidgeBlockoutRuntimeCellOverlapErrors,
  appendRidgeBlockoutShortcutErrors,
  appendRidgeBlockoutSpawnErrors
} from './ridgeBlockoutValidation';

export interface RidgeBlockoutPoint {
  x: number;
  y: number;
}

export interface RidgeBlockoutSize {
  width: number;
  height: number;
}

export interface RidgeBlockoutAnchor {
  symbol: string;
  kind: string;
  attrs: Readonly<Record<string, string>>;
}

export interface RidgeBlockoutRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  attrs: Readonly<Record<string, string>>;
}

interface RidgeBlockoutRoomCore {
  id: string;
  title: string;
  theme?: string;
  mood?: string;
}

export interface RidgeBlockoutRoom extends RidgeBlockoutRoomCore {
  place: RidgeBlockoutPoint;
  size: RidgeBlockoutSize;
  links: readonly string[];
  props: readonly string[];
  grid: readonly string[];
  anchors: readonly RidgeBlockoutAnchor[];
  rects: readonly RidgeBlockoutRect[];
  declarations: readonly string[];
}

export interface RidgeBlockoutRoute {
  id: string;
  roomIds: readonly string[];
}

export interface RidgeBlockoutShortcut {
  id: string;
  fromRoomId: string;
  toRoomId: string;
  kind?: string;
}

export interface RidgeBlockoutOptionalPocket {
  id: string;
  roomId?: string;
  kind?: string;
}

export interface RidgeBlockoutHomeMutation {
  id: string;
  attrs: Readonly<Record<string, string>>;
}

export interface RidgeBlockoutMap {
  language: string;
  cell: number;
  worldId: string;
  title: string;
  spawn: {
    roomId: string;
    anchorSymbol: string;
  };
  routes: readonly RidgeBlockoutRoute[];
  futureRoutes: readonly RidgeBlockoutRoute[];
  shortcuts: readonly RidgeBlockoutShortcut[];
  optionalPockets: readonly RidgeBlockoutOptionalPocket[];
  homeMutations: readonly RidgeBlockoutHomeMutation[];
  rooms: readonly RidgeBlockoutRoom[];
  validationErrors: readonly string[];
}

interface MutableRoom extends RidgeBlockoutRoomCore {
  place?: RidgeBlockoutPoint;
  size?: RidgeBlockoutSize;
  links: string[];
  props: string[];
  grid: string[];
  anchors: RidgeBlockoutAnchor[];
  rects: RidgeBlockoutRect[];
  declarations: string[];
}

const DEFAULT_MAP: Omit<
  RidgeBlockoutMap,
  'rooms' | 'routes' | 'futureRoutes' | 'shortcuts' | 'optionalPockets' | 'homeMutations' | 'validationErrors'
> = {
  language: '',
  cell: 0,
  worldId: '',
  title: '',
  spawn: {
    roomId: '',
    anchorSymbol: ''
  }
};

const ROOM_DECLARATION_PREFIXES = [
  'after ',
  'minigame ',
  'reward ',
  'future_reward ',
  'gate ',
  'future_shortcut ',
  'future '
];

interface RidgeBlockoutParseContext {
  language: string;
  cell: number;
  worldId: string;
  title: string;
  spawn: RidgeBlockoutMap['spawn'];
  routes: RidgeBlockoutRoute[];
  futureRoutes: RidgeBlockoutRoute[];
  shortcuts: RidgeBlockoutShortcut[];
  optionalPockets: RidgeBlockoutOptionalPocket[];
  homeMutations: RidgeBlockoutHomeMutation[];
  rooms: RidgeBlockoutRoom[];
  currentRoom?: MutableRoom;
  readingGrid: boolean;
}

function createRidgeBlockoutParseContext(): RidgeBlockoutParseContext {
  return {
    language: DEFAULT_MAP.language,
    cell: DEFAULT_MAP.cell,
    worldId: DEFAULT_MAP.worldId,
    title: DEFAULT_MAP.title,
    spawn: DEFAULT_MAP.spawn,
    routes: [],
    futureRoutes: [],
    shortcuts: [],
    optionalPockets: [],
    homeMutations: [],
    rooms: [],
    readingGrid: false
  };
}

function finishRidgeBlockoutRoom(ctx: RidgeBlockoutParseContext): void {
  if (!ctx.currentRoom) return;
  ctx.rooms.push({
    id: ctx.currentRoom.id,
    title: ctx.currentRoom.title || ctx.currentRoom.id,
    place: ctx.currentRoom.place ?? { x: 0, y: 0 },
    size: ctx.currentRoom.size ?? { width: 0, height: 0 },
    theme: ctx.currentRoom.theme,
    mood: ctx.currentRoom.mood,
    links: ctx.currentRoom.links,
    props: ctx.currentRoom.props,
    grid: ctx.currentRoom.grid,
    anchors: ctx.currentRoom.anchors,
    rects: ctx.currentRoom.rects,
    declarations: ctx.currentRoom.declarations
  });
  ctx.currentRoom = undefined;
}

function startRidgeBlockoutRoom(ctx: RidgeBlockoutParseContext, line: string): void {
  finishRidgeBlockoutRoom(ctx);
  ctx.currentRoom = {
    id: line.slice('room '.length).trim(),
    title: '',
    links: [],
    props: [],
    grid: [],
    anchors: [],
    rects: [],
    declarations: []
  };
  ctx.readingGrid = false;
}

function applyRidgeBlockoutMapHeaderLine(ctx: RidgeBlockoutParseContext, line: string): boolean {
  if (line.startsWith('language ')) {
    ctx.language = line.slice('language '.length).trim();
    return true;
  }
  if (line.startsWith('cell ')) {
    ctx.cell = Number(line.slice('cell '.length).trim());
    return true;
  }
  if (line.startsWith('world ')) {
    ctx.worldId = line.slice('world '.length).trim();
    return true;
  }
  if (line.startsWith('title ')) {
    ctx.title = line.slice('title '.length).trim();
    return true;
  }
  if (line.startsWith('spawn ')) {
    const attrs = parseAttrs(line.slice('spawn '.length).split(/\s+/));
    ctx.spawn = {
      roomId: attrs.room ?? '',
      anchorSymbol: attrs.anchor ?? ''
    };
    return true;
  }
  return false;
}

function applyRidgeBlockoutMapCollectionLine(ctx: RidgeBlockoutParseContext, line: string): boolean {
  if (line.startsWith('route ')) {
    ctx.routes.push(parseRoute(line, 'route'));
    return true;
  }
  if (line.startsWith('future_route ')) {
    ctx.futureRoutes.push(parseRoute(line, 'future_route'));
    return true;
  }
  if (line.startsWith('shortcut ')) {
    ctx.shortcuts.push(parseShortcut(line));
    return true;
  }
  if (line.startsWith('optional_pocket ')) {
    ctx.optionalPockets.push(parseOptionalPocket(line));
    return true;
  }
  if (line.startsWith('home_mutation ')) {
    ctx.homeMutations.push(parseHomeMutation(line));
    return true;
  }
  return false;
}

function parseRidgeBlockoutMapLine(ctx: RidgeBlockoutParseContext, line: string): void {
  if (applyRidgeBlockoutMapHeaderLine(ctx, line)) return;
  applyRidgeBlockoutMapCollectionLine(ctx, line);
}

function applyRidgeBlockoutRoomLayoutLine(room: MutableRoom, line: string): boolean {
  if (line.startsWith('title ')) {
    room.title = line.slice('title '.length).trim();
    return true;
  }
  if (line.startsWith('place ')) {
    room.place = parsePoint(line.slice('place '.length));
    return true;
  }
  if (line.startsWith('size ')) {
    room.size = parseSize(line.slice('size '.length).trim());
    return true;
  }
  if (line.startsWith('theme ')) {
    room.theme = line.slice('theme '.length).trim();
    return true;
  }
  if (line.startsWith('mood ')) {
    room.mood = line.slice('mood '.length).trim();
    return true;
  }
  return false;
}

function applyRidgeBlockoutRoomContentLine(room: MutableRoom, line: string): boolean {
  if (line.startsWith('links ')) {
    room.links = line.slice('links '.length).split(/\s+/).filter(Boolean);
    return true;
  }
  if (line.startsWith('props ')) {
    room.props = line.slice('props '.length).split(',').map((prop) => prop.trim()).filter(Boolean);
    return true;
  }
  if (line.startsWith('anchor ')) {
    room.anchors.push(parseAnchor(line));
    return true;
  }
  if (line.startsWith('rect ')) {
    room.rects.push(parseRect(line));
    return true;
  }
  return false;
}

function applyRidgeBlockoutRoomScalarLine(room: MutableRoom, line: string): boolean {
  return applyRidgeBlockoutRoomLayoutLine(room, line) || applyRidgeBlockoutRoomContentLine(room, line);
}

function parseRidgeBlockoutRoomLine(ctx: RidgeBlockoutParseContext, line: string): void {
  const room = ctx.currentRoom;
  if (!room) return;

  if (ctx.readingGrid) {
    room.grid.push(line);
    return;
  }

  if (line === 'grid') {
    ctx.readingGrid = true;
    return;
  }

  if (applyRidgeBlockoutRoomScalarLine(room, line)) return;

  if (ROOM_DECLARATION_PREFIXES.some((prefix) => line.startsWith(prefix))) {
    room.declarations.push(line);
  }
}

export function parseRidgeBlockout(source: string): RidgeBlockoutMap {
  const ctx = createRidgeBlockoutParseContext();

  normalizeLines(source).forEach((line) => {
    if (!line) {
      ctx.readingGrid = false;
      return;
    }

    if (line.startsWith('room ')) {
      startRidgeBlockoutRoom(ctx, line);
      return;
    }

    if (!ctx.currentRoom) {
      parseRidgeBlockoutMapLine(ctx, line);
      return;
    }

    parseRidgeBlockoutRoomLine(ctx, line);
  });

  finishRidgeBlockoutRoom(ctx);

  const mapWithoutErrors: RidgeBlockoutMap = {
    language: ctx.language,
    cell: ctx.cell,
    worldId: ctx.worldId,
    title: ctx.title,
    spawn: ctx.spawn,
    routes: ctx.routes,
    futureRoutes: ctx.futureRoutes,
    shortcuts: ctx.shortcuts,
    optionalPockets: ctx.optionalPockets,
    homeMutations: ctx.homeMutations,
    rooms: ctx.rooms,
    validationErrors: []
  };

  return {
    ...mapWithoutErrors,
    validationErrors: validateRidgeBlockout(mapWithoutErrors)
  };
}

function validateRidgeBlockout(map: RidgeBlockoutMap): readonly string[] {
  const errors: string[] = [];
  const roomIds = new Set<string>();

  appendRidgeBlockoutHeaderErrors(errors, map);

  map.rooms.forEach((room) => {
    appendDuplicateRidgeBlockoutRoomId(room.id, roomIds, errors);

    appendRidgeBlockoutRoomGridErrors(room, errors, isKnownRidgeBlockoutSymbol);
    appendRidgeBlockoutRoomAnchorErrors(room, errors, {
      gridContainsSymbol: (symbol) => room.grid.some((row) => row.includes(symbol))
    });
  });

  appendRidgeBlockoutSpawnErrors(errors, map.spawn, roomIds, (roomId) =>
    findRidgeBlockoutRoom(map, roomId)
  );
  appendRidgeBlockoutRouteErrors(errors, [...map.routes, ...map.futureRoutes], roomIds);
  appendRidgeBlockoutShortcutErrors(errors, map.shortcuts, roomIds);
  appendRidgeBlockoutRuntimeCellOverlapErrors(errors, map.rooms, isRuntimeActiveRidgeBlockoutSymbol);

  return errors;
}

export function findRidgeBlockoutRoom(
  map: Pick<RidgeBlockoutMap, 'rooms'>,
  roomId: string
): RidgeBlockoutRoom | undefined {
  return map.rooms.find((room) => room.id === roomId);
}

export function findRidgeBlockoutAnchor(
  room: RidgeBlockoutRoom,
  predicate: (anchor: RidgeBlockoutAnchor) => boolean
): RidgeBlockoutAnchor | undefined {
  return room.anchors.find(predicate);
}

function isRuntimeActiveRidgeBlockoutSymbol(symbol: string): boolean {
  return symbol !== '.' && RIDGE_BLOCKOUT_RUNTIME_SYMBOLS.has(symbol);
}

function normalizeLines(source: string): readonly string[] {
  return source
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => stripComment(line).trimEnd());
}

function stripComment(line: string): string {
  const commentIndex = line.indexOf('//');
  return (commentIndex === -1 ? line : line.slice(0, commentIndex)).trim();
}

function parseRoute(line: string, prefix: 'route' | 'future_route'): RidgeBlockoutRoute {
  const content = line.slice(prefix.length + 1).trim();
  const [id = '', ...rest] = content.split(/\s+/);
  return {
    id,
    roomIds: rest.filter((part) => part !== '->')
  };
}

function parseShortcut(line: string): RidgeBlockoutShortcut {
  const [id = '', ...attrTokens] = line.slice('shortcut '.length).trim().split(/\s+/);
  const attrs = parseAttrs(attrTokens);
  return {
    id,
    fromRoomId: attrs.from ?? '',
    toRoomId: attrs.to ?? '',
    kind: attrs.kind
  };
}

function parseOptionalPocket(line: string): RidgeBlockoutOptionalPocket {
  const [id = '', ...attrTokens] = line.slice('optional_pocket '.length).trim().split(/\s+/);
  const attrs = parseAttrs(attrTokens);
  return {
    id,
    roomId: attrs.room,
    kind: attrs.kind
  };
}

function parseHomeMutation(line: string): RidgeBlockoutHomeMutation {
  const [id = '', ...attrTokens] = line.slice('home_mutation '.length).trim().split(/\s+/);
  return {
    id,
    attrs: parseAttrs(attrTokens)
  };
}

function parseAnchor(line: string): RidgeBlockoutAnchor {
  const [symbol = '', kind = '', ...attrTokens] = line.slice('anchor '.length).trim().split(/\s+/);
  return {
    symbol,
    kind,
    attrs: parseAttrs(attrTokens)
  };
}

function parseRect(line: string): RidgeBlockoutRect {
  const [id = '', ...attrTokens] = line.slice('rect '.length).trim().split(/\s+/);
  const attrs = parseAttrs(attrTokens);
  return {
    id,
    x: Number(attrs.x ?? 0),
    y: Number(attrs.y ?? 0),
    width: Number(attrs.w ?? 0),
    height: Number(attrs.h ?? 0),
    attrs: stripGeometryAttrs(attrs)
  };
}

function parsePoint(content: string): RidgeBlockoutPoint {
  const attrs = parseAttrs(content.split(/\s+/));
  return {
    x: Number(attrs.x ?? 0),
    y: Number(attrs.y ?? 0)
  };
}

function parseSize(content: string): RidgeBlockoutSize {
  const [width = '0', height = '0'] = content.split('x');
  return {
    width: Number(width),
    height: Number(height)
  };
}

function parseAttrs(tokens: readonly string[]): Record<string, string> {
  return tokens.reduce<Record<string, string>>((attrs, token) => {
    const separatorIndex = token.indexOf('=');
    if (separatorIndex === -1) return attrs;
    attrs[token.slice(0, separatorIndex)] = token.slice(separatorIndex + 1);
    return attrs;
  }, {});
}

function stripGeometryAttrs(attrs: Readonly<Record<string, string>>): Record<string, string> {
  const rest = { ...attrs };
  delete rest.x;
  delete rest.y;
  delete rest.w;
  delete rest.h;
  return rest;
}

function isKnownRidgeBlockoutSymbol(symbol: string): boolean {
  return (
    RIDGE_BLOCKOUT_RUNTIME_SYMBOLS.has(symbol) ||
    RIDGE_BLOCKOUT_DESIGN_SYMBOLS.has(symbol) ||
    symbol === RIDGE_BLOCKOUT_LADDER_SYMBOL
  );
}
