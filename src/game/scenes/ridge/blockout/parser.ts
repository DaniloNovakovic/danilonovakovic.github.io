export const RIDGE_BLOCKOUT_RUNTIME_SYMBOLS = new Set([
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

export const RIDGE_BLOCKOUT_DESIGN_SYMBOLS = new Set(['=', '~', 'N', 'M']);

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

export interface RidgeBlockoutRoom {
  id: string;
  title: string;
  place: RidgeBlockoutPoint;
  size: RidgeBlockoutSize;
  theme?: string;
  mood?: string;
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

interface MutableRoom {
  id: string;
  title: string;
  place?: RidgeBlockoutPoint;
  size?: RidgeBlockoutSize;
  theme?: string;
  mood?: string;
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

export function parseRidgeBlockout(source: string): RidgeBlockoutMap {
  let language = DEFAULT_MAP.language;
  let cell = DEFAULT_MAP.cell;
  let worldId = DEFAULT_MAP.worldId;
  let title = DEFAULT_MAP.title;
  let spawn = DEFAULT_MAP.spawn;
  const routes: RidgeBlockoutRoute[] = [];
  const futureRoutes: RidgeBlockoutRoute[] = [];
  const shortcuts: RidgeBlockoutShortcut[] = [];
  const optionalPockets: RidgeBlockoutOptionalPocket[] = [];
  const homeMutations: RidgeBlockoutHomeMutation[] = [];
  const rooms: RidgeBlockoutRoom[] = [];
  let currentRoom: MutableRoom | undefined;
  let readingGrid = false;

  const finishCurrentRoom = () => {
    if (!currentRoom) return;
    rooms.push({
      id: currentRoom.id,
      title: currentRoom.title || currentRoom.id,
      place: currentRoom.place ?? { x: 0, y: 0 },
      size: currentRoom.size ?? { width: 0, height: 0 },
      theme: currentRoom.theme,
      mood: currentRoom.mood,
      links: currentRoom.links,
      props: currentRoom.props,
      grid: currentRoom.grid,
      anchors: currentRoom.anchors,
      rects: currentRoom.rects,
      declarations: currentRoom.declarations
    });
    currentRoom = undefined;
  };

  normalizeLines(source).forEach((line) => {
    if (!line) {
      readingGrid = false;
      return;
    }

    if (line.startsWith('room ')) {
      finishCurrentRoom();
      currentRoom = {
        id: line.slice('room '.length).trim(),
        title: '',
        links: [],
        props: [],
        grid: [],
        anchors: [],
        rects: [],
        declarations: []
      };
      readingGrid = false;
      return;
    }

    if (!currentRoom) {
      if (line.startsWith('language ')) {
        language = line.slice('language '.length).trim();
      } else if (line.startsWith('cell ')) {
        cell = Number(line.slice('cell '.length).trim());
      } else if (line.startsWith('world ')) {
        worldId = line.slice('world '.length).trim();
      } else if (line.startsWith('title ')) {
        title = line.slice('title '.length).trim();
      } else if (line.startsWith('spawn ')) {
        const attrs = parseAttrs(line.slice('spawn '.length).split(/\s+/));
        spawn = {
          roomId: attrs.room ?? '',
          anchorSymbol: attrs.anchor ?? ''
        };
      } else if (line.startsWith('route ')) {
        routes.push(parseRoute(line, 'route'));
      } else if (line.startsWith('future_route ')) {
        futureRoutes.push(parseRoute(line, 'future_route'));
      } else if (line.startsWith('shortcut ')) {
        shortcuts.push(parseShortcut(line));
      } else if (line.startsWith('optional_pocket ')) {
        optionalPockets.push(parseOptionalPocket(line));
      } else if (line.startsWith('home_mutation ')) {
        homeMutations.push(parseHomeMutation(line));
      }
      return;
    }

    if (readingGrid) {
      currentRoom.grid.push(line);
      return;
    }

    if (line === 'grid') {
      readingGrid = true;
    } else if (line.startsWith('title ')) {
      currentRoom.title = line.slice('title '.length).trim();
    } else if (line.startsWith('place ')) {
      currentRoom.place = parsePoint(line.slice('place '.length));
    } else if (line.startsWith('size ')) {
      currentRoom.size = parseSize(line.slice('size '.length).trim());
    } else if (line.startsWith('theme ')) {
      currentRoom.theme = line.slice('theme '.length).trim();
    } else if (line.startsWith('mood ')) {
      currentRoom.mood = line.slice('mood '.length).trim();
    } else if (line.startsWith('links ')) {
      currentRoom.links = line.slice('links '.length).split(/\s+/).filter(Boolean);
    } else if (line.startsWith('props ')) {
      currentRoom.props = line.slice('props '.length).split(',').map((prop) => prop.trim()).filter(Boolean);
    } else if (line.startsWith('anchor ')) {
      currentRoom.anchors.push(parseAnchor(line));
    } else if (line.startsWith('rect ')) {
      currentRoom.rects.push(parseRect(line));
    } else if (ROOM_DECLARATION_PREFIXES.some((prefix) => line.startsWith(prefix))) {
      currentRoom.declarations.push(line);
    }
  });

  finishCurrentRoom();

  const mapWithoutErrors: RidgeBlockoutMap = {
    language,
    cell,
    worldId,
    title,
    spawn,
    routes,
    futureRoutes,
    shortcuts,
    optionalPockets,
    homeMutations,
    rooms,
    validationErrors: []
  };

  return {
    ...mapWithoutErrors,
    validationErrors: validateRidgeBlockout(mapWithoutErrors)
  };
}

export function validateRidgeBlockout(map: RidgeBlockoutMap): readonly string[] {
  const errors: string[] = [];
  const roomIds = new Set<string>();

  if (map.language !== 'ridge-v0') {
    errors.push(`unsupported language "${map.language}"`);
  }
  if (!Number.isFinite(map.cell) || map.cell <= 0) {
    errors.push(`invalid cell size "${map.cell}"`);
  }
  if (!map.worldId) {
    errors.push('missing world id');
  }
  if (!map.spawn.roomId || !map.spawn.anchorSymbol) {
    errors.push('missing spawn room or anchor');
  }

  map.rooms.forEach((room) => {
    if (roomIds.has(room.id)) {
      errors.push(`duplicate room "${room.id}"`);
    }
    roomIds.add(room.id);

    if (room.size.width <= 0 || room.size.height <= 0) {
      errors.push(`room "${room.id}" has invalid size`);
    }
    if (room.grid.length !== room.size.height) {
      errors.push(`room "${room.id}" grid height ${room.grid.length} does not match size ${room.size.height}`);
    }
    room.grid.forEach((row, rowIndex) => {
      if (row.length !== room.size.width) {
        errors.push(`room "${room.id}" row ${rowIndex + 1} width ${row.length} does not match size ${room.size.width}`);
      }
      [...row].forEach((symbol, columnIndex) => {
        if (!isKnownRidgeBlockoutSymbol(symbol)) {
          errors.push(`room "${room.id}" has unknown symbol "${symbol}" at ${columnIndex},${rowIndex}`);
        }
      });
    });

    room.anchors.forEach((anchor) => {
      if (!room.grid.some((row) => row.includes(anchor.symbol))) {
        errors.push(`room "${room.id}" anchor "${anchor.symbol}" has no matching grid cell`);
      }
    });
  });

  if (!roomIds.has(map.spawn.roomId)) {
    errors.push(`spawn room "${map.spawn.roomId}" does not exist`);
  } else {
    const spawnRoom = findRidgeBlockoutRoom(map, map.spawn.roomId);
    const spawnAnchor = spawnRoom?.anchors.find((anchor) => anchor.symbol === map.spawn.anchorSymbol);
    if (!spawnAnchor) {
      errors.push(`spawn anchor "${map.spawn.anchorSymbol}" does not exist in room "${map.spawn.roomId}"`);
    }
  }

  [...map.routes, ...map.futureRoutes].forEach((route) => {
    route.roomIds.forEach((roomId) => {
      if (!roomIds.has(roomId)) {
        errors.push(`route "${route.id}" references missing room "${roomId}"`);
      }
    });
  });

  map.shortcuts.forEach((shortcut) => {
    if (!roomIds.has(shortcut.fromRoomId)) {
      errors.push(`shortcut "${shortcut.id}" references missing from room "${shortcut.fromRoomId}"`);
    }
    if (!roomIds.has(shortcut.toRoomId)) {
      errors.push(`shortcut "${shortcut.id}" references missing to room "${shortcut.toRoomId}"`);
    }
  });

  errors.push(...validateRuntimeCellOverlaps(map));
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

export function isRuntimeActiveRidgeBlockoutSymbol(symbol: string): boolean {
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
  return RIDGE_BLOCKOUT_RUNTIME_SYMBOLS.has(symbol) || RIDGE_BLOCKOUT_DESIGN_SYMBOLS.has(symbol);
}

function validateRuntimeCellOverlaps(map: RidgeBlockoutMap): readonly string[] {
  const errors: string[] = [];
  const seen = new Map<string, { roomId: string; symbol: string }>();

  map.rooms.forEach((room) => {
    room.grid.forEach((row, rowIndex) => {
      [...row].forEach((symbol, columnIndex) => {
        if (!isRuntimeActiveRidgeBlockoutSymbol(symbol)) return;
        const key = `${room.place.x + columnIndex},${room.place.y + rowIndex}`;
        const previous = seen.get(key);
        if (previous && previous.roomId !== room.id) {
          errors.push(
            `runtime cell overlap at ${key}: ${previous.roomId}/${previous.symbol} and ${room.id}/${symbol}`
          );
          return;
        }
        seen.set(key, { roomId: room.id, symbol });
      });
    });
  });

  return errors;
}
