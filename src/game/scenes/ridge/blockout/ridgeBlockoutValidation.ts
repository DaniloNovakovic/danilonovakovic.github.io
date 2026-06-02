import { RIDGE_BLOCKOUT_TRAVERSAL_MOVEMENTS } from './ridgeBlockoutConstants';

export interface RidgeBlockoutValidationHeader {
  language: string;
  cell: number;
  worldId: string;
  spawn: {
    roomId: string;
    anchorSymbol: string;
  };
}

export interface RidgeBlockoutValidationRoom {
  id: string;
  size: { width: number; height: number };
  grid: readonly string[];
}

export interface RidgeBlockoutValidationAnchor {
  symbol: string;
  attrs: Readonly<Record<string, string | undefined>>;
}

export interface RidgeBlockoutPlacedRoom extends RidgeBlockoutValidationRoom {
  place: { x: number; y: number };
}

export function appendDuplicateRidgeBlockoutRoomId(
  roomId: string,
  roomIds: Set<string>,
  errors: string[]
): void {
  if (roomIds.has(roomId)) {
    errors.push(`duplicate room "${roomId}"`);
  }
  roomIds.add(roomId);
}

export function appendRidgeBlockoutHeaderErrors(
  errors: string[],
  header: RidgeBlockoutValidationHeader
): void {
  if (header.language !== 'ridge-v0') {
    errors.push(`unsupported language "${header.language}"`);
  }
  if (!Number.isFinite(header.cell) || header.cell <= 0) {
    errors.push(`invalid cell size "${header.cell}"`);
  }
  if (!header.worldId) {
    errors.push('missing world id');
  }
  if (!header.spawn.roomId || !header.spawn.anchorSymbol) {
    errors.push('missing spawn room or anchor');
  }
}

export function appendRidgeBlockoutRoomGridErrors(
  room: RidgeBlockoutValidationRoom,
  errors: string[],
  isSymbolKnown: (symbol: string) => boolean
): void {
  if (room.size.width <= 0 || room.size.height <= 0) {
    errors.push(`room "${room.id}" has invalid size`);
  }
  if (room.grid.length !== room.size.height) {
    errors.push(
      `room "${room.id}" grid height ${room.grid.length} does not match size ${room.size.height}`
    );
  }
  room.grid.forEach((row, rowIndex) => {
    const rowSymbols = [...row];
    if (rowSymbols.length !== room.size.width) {
      errors.push(
        `room "${room.id}" row ${rowIndex + 1} width ${rowSymbols.length} does not match size ${room.size.width}`
      );
    }
    rowSymbols.forEach((symbol, columnIndex) => {
      if (!isSymbolKnown(symbol)) {
        errors.push(`room "${room.id}" has unknown symbol "${symbol}" at ${columnIndex},${rowIndex}`);
      }
    });
  });
}

export function appendRidgeBlockoutRoomAnchorErrors(
  room: RidgeBlockoutValidationRoom & { anchors: readonly RidgeBlockoutValidationAnchor[] },
  errors: string[],
  options: {
    gridContainsSymbol: (symbol: string) => boolean;
    anchorSymbolErrors?: (anchor: RidgeBlockoutValidationAnchor) => readonly string[];
  }
): void {
  room.anchors.forEach((anchor) => {
    for (const message of options.anchorSymbolErrors?.(anchor) ?? []) {
      errors.push(message);
    }
    if (!options.gridContainsSymbol(anchor.symbol)) {
      errors.push(`room "${room.id}" anchor "${anchor.symbol}" has no matching grid cell`);
    }
    const movement = anchor.attrs.movement;
    if (movement !== undefined && !RIDGE_BLOCKOUT_TRAVERSAL_MOVEMENTS.has(movement)) {
      errors.push(`room "${room.id}" anchor "${anchor.symbol}" has unknown movement "${movement}"`);
    }
  });
}

export function appendRidgeBlockoutSpawnErrors(
  errors: string[],
  spawn: RidgeBlockoutValidationHeader['spawn'],
  roomIds: ReadonlySet<string>,
  findRoom: (roomId: string) => { anchors: readonly { symbol: string }[] } | undefined
): void {
  if (!roomIds.has(spawn.roomId)) {
    errors.push(`spawn room "${spawn.roomId}" does not exist`);
    return;
  }

  const spawnRoom = findRoom(spawn.roomId);
  const spawnAnchor = spawnRoom?.anchors.find((anchor) => anchor.symbol === spawn.anchorSymbol);
  if (!spawnAnchor) {
    errors.push(`spawn anchor "${spawn.anchorSymbol}" does not exist in room "${spawn.roomId}"`);
  }
}

export function appendRidgeBlockoutRouteErrors(
  errors: string[],
  routes: readonly { id: string; roomIds: readonly string[] }[],
  roomIds: ReadonlySet<string>
): void {
  routes.forEach((route) => {
    route.roomIds.forEach((roomId) => {
      if (!roomIds.has(roomId)) {
        errors.push(`route "${route.id}" references missing room "${roomId}"`);
      }
    });
  });
}

export function appendRidgeBlockoutShortcutErrors(
  errors: string[],
  shortcuts: readonly { id: string; fromRoomId: string; toRoomId: string }[],
  roomIds: ReadonlySet<string>
): void {
  shortcuts.forEach((shortcut) => {
    if (!roomIds.has(shortcut.fromRoomId)) {
      errors.push(`shortcut "${shortcut.id}" references missing from room "${shortcut.fromRoomId}"`);
    }
    if (!roomIds.has(shortcut.toRoomId)) {
      errors.push(`shortcut "${shortcut.id}" references missing to room "${shortcut.toRoomId}"`);
    }
  });
}

export function appendRidgeBlockoutRuntimeCellOverlapErrors(
  errors: string[],
  rooms: readonly RidgeBlockoutPlacedRoom[],
  isRuntimeActiveSymbol: (symbol: string) => boolean
): void {
  const seen = new Map<string, { roomId: string; symbol: string }>();

  rooms.forEach((room) => {
    room.grid.forEach((row, rowIndex) => {
      [...row].forEach((symbol, columnIndex) => {
        if (!isRuntimeActiveSymbol(symbol)) return;
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
}
