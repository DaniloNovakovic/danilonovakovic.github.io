import { describe, expect, it } from 'vitest';
import {
  compileRidgeBlockoutSource,
  serializeRidgeCompiledBlockout,
  validateRidgeBlockoutSource
} from './sourceCompiler';
import type { RidgeBlockoutSource } from './sourceContract';
import { CONTRACT_FIXTURE_RIDGE_COMPILED_BLOCKOUT } from './sources/contract-fixture.generated';
import { CONTRACT_FIXTURE_RIDGE_SOURCE } from './sources/contract-fixture.source';
import generatedFixtureSource from './sources/contract-fixture.generated.ts?raw';

describe('ridge blockout source compiler', () => {
  it('compiles a typed source into a RidgeBlockoutMap-compatible artifact', () => {
    const compiled = compileRidgeBlockoutSource(CONTRACT_FIXTURE_RIDGE_SOURCE);

    expect(compiled.validationErrors).toEqual([]);
    expect(compiled.map).toMatchObject({
      language: 'ridge-v0',
      worldId: 'contract_fixture',
      cell: 16,
      spawn: {
        roomId: 'start',
        anchorSymbol: '1'
      }
    });
    expect(compiled.map.rooms).toHaveLength(3);
    expect(compiled.runtimeTileRooms[0]?.runtimeTileRows).toEqual([
      [10, 0, 0, 11],
      [0, 2, 2, 0],
      [1, 1, 1, 1]
    ]);
  });

  it('keeps the committed generated artifact in sync with deterministic serialization', () => {
    const compiled = compileRidgeBlockoutSource(CONTRACT_FIXTURE_RIDGE_SOURCE);

    expect(CONTRACT_FIXTURE_RIDGE_COMPILED_BLOCKOUT.map.validationErrors).toEqual([]);
    expect(serializeRidgeCompiledBlockout({
      exportName: 'CONTRACT_FIXTURE_RIDGE_COMPILED_BLOCKOUT',
      compiled,
      typeImportPath: '../sourceContract'
    })).toBe(generatedFixtureSource);
  });

  it('validates unknown symbols and bad grid dimensions', () => {
    const errors = validateRidgeBlockoutSource(withSource({
      rooms: [{
        ...CONTRACT_FIXTURE_RIDGE_SOURCE.rooms[0],
        grid: [
          '1X.2.',
          '.__.',
          '####'
        ]
      }, ...CONTRACT_FIXTURE_RIDGE_SOURCE.rooms.slice(1)]
    }));

    expect(errors).toContain('room "start" row 1 width 5 does not match size 4');
    expect(errors).toContain('room "start" has unknown symbol "X" at 1,0');
  });

  it('validates spawn anchors, route references, and traversal movements', () => {
    const errors = validateRidgeBlockoutSource(withSource({
      spawn: {
        roomId: 'start',
        anchorSymbol: 'A'
      },
      routes: [{
        id: 'first_walk',
        roomIds: ['start', 'missing_room']
      }],
      rooms: [{
        ...CONTRACT_FIXTURE_RIDGE_SOURCE.rooms[0],
        anchors: [
          { symbol: '1', kind: 'player_spawn', attrs: { id: 'start' } },
          { symbol: '2', kind: 'exit', attrs: { to: 'lookout', movement: 'teleport' } }
        ]
      }, ...CONTRACT_FIXTURE_RIDGE_SOURCE.rooms.slice(1)]
    }));

    expect(errors).toContain('spawn anchor "A" does not exist in room "start"');
    expect(errors).toContain('route "first_walk" references missing room "missing_room"');
    expect(errors).toContain('room "start" anchor "2" has unknown movement "teleport"');
  });

  it('validates duplicate tile symbols and runtime ids', () => {
    const errors = validateRidgeBlockoutSource(withSource({
      tileRegistry: [
        { symbol: '.', id: 0, kind: 'empty', label: 'empty' },
        { symbol: '.', id: 1, kind: 'solid', label: 'duplicate symbol' },
        { symbol: '#', id: 1, kind: 'solid', label: 'duplicate id' },
        { symbol: 'AA', id: 2, kind: 'anchor', label: 'wide symbol' }
      ]
    }));

    expect(errors).toContain('duplicate tile symbol "."');
    expect(errors).toContain('duplicate runtime tile id "1"');
    expect(errors).toContain('tile symbol "AA" must be exactly one character');
  });

  it('throws a grouped error when compilation receives invalid source', () => {
    expect(() => compileRidgeBlockoutSource(withSource({
      routes: [{
        id: 'broken_route',
        roomIds: ['start', 'missing_room']
      }]
    }))).toThrow('Ridge blockout source validation failed');
  });
});

function withSource(overrides: Partial<RidgeBlockoutSource>): RidgeBlockoutSource {
  return {
    ...CONTRACT_FIXTURE_RIDGE_SOURCE,
    ...overrides
  };
}
