import { describe, expect, it } from 'vitest';
import { RIDGE_BLOCKOUT } from './ridgeBlockout';
import {
  findRidgeBlockoutRoom,
  parseRidgeBlockout
} from './parser';

describe('ridge blockout parser', () => {
  it('parses the real Ridge blockout source without validation errors', () => {
    expect(RIDGE_BLOCKOUT.validationErrors).toEqual([]);
    expect(RIDGE_BLOCKOUT.language).toBe('ridge-v0');
    expect(RIDGE_BLOCKOUT.cell).toBe(48);
    expect(RIDGE_BLOCKOUT.rooms).toHaveLength(12);
  });

  it('keeps the first-walk topology order from the source file', () => {
    const firstWalk = RIDGE_BLOCKOUT.routes.find((route) => route.id === 'first_walk');

    expect(firstWalk?.roomIds.slice(0, 4)).toEqual([
      'outskirts',
      'cicka_home',
      'work_artifact',
      'stampede_blanket'
    ]);
  });

  it('requires every room grid to match the declared size', () => {
    RIDGE_BLOCKOUT.rooms.forEach((room) => {
      expect(room.grid).toHaveLength(room.size.height);
      room.grid.forEach((row) => {
        expect(row).toHaveLength(room.size.width);
      });
    });
  });

  it('fails validation when the grid contains an unknown symbol', () => {
    const parsed = parseRidgeBlockout(`
language ridge-v0
cell 48
world broken
title Broken
spawn room=test anchor=1

room test
title Test
place x=0 y=0
size 2x1

grid
1X

anchor 1 player_spawn id=start
`);

    expect(parsed.validationErrors).toContain('room "test" has unknown symbol "X" at 1,0');
  });

  it('rejects runtime-active overlaps between room beats', () => {
    const parsed = parseRidgeBlockout(`
language ridge-v0
cell 48
world overlap
title Overlap
spawn room=a anchor=1

room a
title A
place x=0 y=0
size 2x1

grid
1#

anchor 1 player_spawn id=start

room b
title B
place x=1 y=0
size 1x1

grid
#
`);

    expect(parsed.validationErrors).toContain('runtime cell overlap at 1,0: a/# and b/#');
  });

  it('resolves the declared spawn room and anchor', () => {
    const spawnRoom = findRidgeBlockoutRoom(RIDGE_BLOCKOUT, RIDGE_BLOCKOUT.spawn.roomId);
    const spawnAnchor = spawnRoom?.anchors.find(
      (anchor) => anchor.symbol === RIDGE_BLOCKOUT.spawn.anchorSymbol
    );

    expect(RIDGE_BLOCKOUT.spawn).toEqual({
      roomId: 'outskirts',
      anchorSymbol: '1'
    });
    expect(spawnAnchor?.kind).toBe('player_spawn');
  });
});
