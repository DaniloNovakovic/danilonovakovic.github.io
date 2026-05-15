import { describe, expect, it } from 'vitest';
import { RIDGE_BLOCKOUT } from './ridgeBlockout';
import {
  RIDGE_BLOCKOUT_LADDER_SYMBOL,
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

  it('parses traversal movement metadata on exit anchors', () => {
    const outskirts = findRidgeBlockoutRoom(RIDGE_BLOCKOUT, 'outskirts');
    const cickaExit = outskirts?.anchors.find((anchor) => anchor.attrs.to === 'cicka_home');

    expect(cickaExit?.attrs.movement).toBe('ramp');
  });

  it('accepts the single-cell ladder marker in grids', () => {
    expect(RIDGE_BLOCKOUT_LADDER_SYMBOL).toBe('L');
    const cickaHome = findRidgeBlockoutRoom(RIDGE_BLOCKOUT, 'cicka_home');

    expect(cickaHome?.grid.some((row) => row.includes(RIDGE_BLOCKOUT_LADDER_SYMBOL))).toBe(true);
    expect(RIDGE_BLOCKOUT.validationErrors.some((error) => error.includes('unknown symbol "L"'))).toBe(false);
  });

  it('keeps the Cicka Home climb out of the lower floor explicit', () => {
    const cickaHome = findRidgeBlockoutRoom(RIDGE_BLOCKOUT, 'cicka_home');
    const workExit = cickaHome?.anchors.find((anchor) => anchor.attrs.to === 'work_artifact');

    expect(workExit?.attrs.movement).toBe('climb');
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

  it('fails validation when an anchor uses an unknown traversal movement', () => {
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
12

anchor 1 player_spawn id=start
anchor 2 exit to=missing movement=teleport
`);

    expect(parsed.validationErrors).toContain(
      'room "test" anchor "2" has unknown movement "teleport"'
    );
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
