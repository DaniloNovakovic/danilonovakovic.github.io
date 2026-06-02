import type { RidgeBlockoutMap } from './parser';
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
import type {
  RidgeBlockoutSource,
  RidgeBlockoutSourceAnchor,
  RidgeBlockoutSourceRect,
  RidgeBlockoutSourceRoom,
  RidgeCompiledBlockout,
  RidgeCompiledBlockoutRoom,
  RidgeTileDefinition,
  RidgeTileRegistry
} from './sourceContract';

class RidgeBlockoutSourceValidationError extends Error {
  readonly errors: readonly string[];

  constructor(errors: readonly string[]) {
    super(`Ridge blockout source validation failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
    this.name = 'RidgeBlockoutSourceValidationError';
    this.errors = errors;
  }
}

interface TileLookup {
  bySymbol: ReadonlyMap<string, RidgeTileDefinition>;
}

export function compileRidgeBlockoutSource(source: RidgeBlockoutSource): RidgeCompiledBlockout {
  const validationErrors = validateRidgeBlockoutSource(source);
  if (validationErrors.length > 0) {
    throw new RidgeBlockoutSourceValidationError(validationErrors);
  }

  const tileLookup = createTileLookup(source.tileRegistry);
  const map = toRidgeBlockoutMap(source, validationErrors);

  return {
    source,
    map,
    tileRegistry: source.tileRegistry,
    runtimeTileRooms: source.rooms.map((room) => toRuntimeTileRoom(room, tileLookup)),
    validationErrors
  };
}

export function validateRidgeBlockoutSource(source: RidgeBlockoutSource): readonly string[] {
  const errors: string[] = [];
  const tileLookup = validateTileRegistry(source.tileRegistry, errors);
  const roomIds = new Set<string>();

  appendRidgeBlockoutHeaderErrors(errors, source);

  source.rooms.forEach((room) => {
    appendDuplicateRidgeBlockoutRoomId(room.id, roomIds, errors);

    appendRidgeBlockoutRoomGridErrors(room, errors, (symbol) => tileLookup.bySymbol.has(symbol));
    appendRidgeBlockoutRoomAnchorErrors(
      {
        ...room,
        anchors: (room.anchors ?? []).map((anchor) => ({
          symbol: anchor.symbol,
          attrs: anchor.attrs ?? {}
        }))
      },
      errors,
      {
        gridContainsSymbol: (symbol) => room.grid.some((row) => [...row].includes(symbol)),
        anchorSymbolErrors: (anchor) =>
          tileLookup.bySymbol.has(anchor.symbol)
            ? []
            : [`room "${room.id}" anchor "${anchor.symbol}" uses an unknown tile symbol`]
      }
    );
  });

  appendRidgeBlockoutSpawnErrors(errors, source.spawn, roomIds, (roomId) => {
    const room = source.rooms.find((candidate) => candidate.id === roomId);
    return room
      ? {
          anchors: (room.anchors ?? []).map((anchor) => ({ symbol: anchor.symbol }))
        }
      : undefined;
  });
  appendRidgeBlockoutRouteErrors(
    errors,
    [...source.routes, ...(source.futureRoutes ?? [])],
    roomIds
  );
  appendRidgeBlockoutShortcutErrors(errors, source.shortcuts ?? [], roomIds);
  appendRidgeBlockoutRuntimeCellOverlapErrors(errors, source.rooms, (symbol) => {
    const tile = tileLookup.bySymbol.get(symbol);
    return tile !== undefined && isRuntimeActiveTile(tile);
  });

  return errors;
}

function toRidgeBlockoutMap(
  source: RidgeBlockoutSource,
  validationErrors: readonly string[] = validateRidgeBlockoutSource(source)
): RidgeBlockoutMap {
  return {
    language: source.language,
    cell: source.cell,
    worldId: source.worldId,
    title: source.title,
    spawn: source.spawn,
    routes: source.routes.map((route) => ({
      id: route.id,
      roomIds: route.roomIds
    })),
    futureRoutes: (source.futureRoutes ?? []).map((route) => ({
      id: route.id,
      roomIds: route.roomIds
    })),
    shortcuts: (source.shortcuts ?? []).map((shortcut) => ({
      id: shortcut.id,
      fromRoomId: shortcut.fromRoomId,
      toRoomId: shortcut.toRoomId,
      kind: shortcut.kind
    })),
    optionalPockets: (source.optionalPockets ?? []).map((pocket) => ({
      id: pocket.id,
      roomId: pocket.roomId,
      kind: pocket.kind
    })),
    homeMutations: (source.homeMutations ?? []).map((mutation) => ({
      id: mutation.id,
      attrs: mutation.attrs
    })),
    rooms: source.rooms.map((room) => ({
      id: room.id,
      title: room.title,
      place: room.place,
      size: room.size,
      theme: room.theme,
      mood: room.mood,
      links: room.links ?? [],
      props: room.props ?? [],
      grid: room.grid,
      anchors: (room.anchors ?? []).map(toMapAnchor),
      rects: (room.rects ?? []).map(toMapRect),
      declarations: room.declarations ?? []
    })),
    validationErrors
  };
}

export function serializeRidgeCompiledBlockout({
  exportName,
  compiled,
  typeImportPath
}: {
  exportName: string;
  compiled: RidgeCompiledBlockout;
  typeImportPath: string;
}): string {
  return [
    `import type { RidgeCompiledBlockout } from '${typeImportPath}';`,
    '',
    '// This file is generated by scripts/generate-ridge-blockout-sources.mjs.',
    '// Edit the matching .source.ts file instead.',
    '',
    `export const ${exportName} = ` +
      JSON.stringify(compiled, null, 2) +
      ' as const satisfies RidgeCompiledBlockout;',
    ''
  ].join('\n');
}

function validateTileRegistry(
  registry: RidgeTileRegistry,
  errors: string[]
): TileLookup {
  const symbols = new Set<string>();
  const ids = new Set<number>();
  const bySymbol = new Map<string, RidgeTileDefinition>();

  registry.forEach((tile) => {
    if ([...tile.symbol].length !== 1) {
      errors.push(`tile symbol "${tile.symbol}" must be exactly one character`);
    }
    if (symbols.has(tile.symbol)) {
      errors.push(`duplicate tile symbol "${tile.symbol}"`);
    }
    symbols.add(tile.symbol);
    bySymbol.set(tile.symbol, tile);

    if (!Number.isInteger(tile.id) || tile.id < 0) {
      errors.push(`tile "${tile.symbol}" has invalid runtime tile id "${tile.id}"`);
    }
    if (ids.has(tile.id)) {
      errors.push(`duplicate runtime tile id "${tile.id}"`);
    }
    ids.add(tile.id);
  });

  return { bySymbol };
}

function createTileLookup(registry: RidgeTileRegistry): TileLookup {
  return {
    bySymbol: new Map(registry.map((tile) => [tile.symbol, tile]))
  };
}

function toRuntimeTileRoom(
  room: RidgeBlockoutSourceRoom,
  tileLookup: TileLookup
): RidgeCompiledBlockoutRoom {
  return {
    id: room.id,
    runtimeTileRows: room.grid.map((row) =>
      [...row].map((symbol) => tileLookup.bySymbol.get(symbol)?.id ?? -1)
    )
  };
}

function toMapAnchor(anchor: RidgeBlockoutSourceAnchor) {
  return {
    symbol: anchor.symbol,
    kind: anchor.kind,
    attrs: anchor.attrs ?? {}
  };
}

function toMapRect(rect: RidgeBlockoutSourceRect) {
  return {
    id: rect.id,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    attrs: rect.attrs ?? {}
  };
}

function isRuntimeActiveTile(tile: RidgeTileDefinition): boolean {
  if (tile.runtimeActive !== undefined) return tile.runtimeActive;
  return tile.kind !== 'empty' && tile.kind !== 'design' && tile.kind !== 'ladder';
}
