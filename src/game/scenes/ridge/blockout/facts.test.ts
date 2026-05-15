import { describe, expect, it } from 'vitest';
import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import { RIDGE_BLOCKOUT } from './ridgeBlockout';
import {
  compileRidgeBlockoutFacts,
  findRidgeBlockoutFactAnchor
} from './facts';

describe('ridge blockout facts', () => {
  it('compiles the first route order and route links', () => {
    const facts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT);
    const firstWalk = facts.routes.find((route) => route.id === 'first_walk');

    expect(firstWalk?.roomIds.slice(0, 4)).toEqual([
      'outskirts',
      'cicka_home',
      'work_artifact',
      'stampede_blanket'
    ]);
    expect(firstWalk?.links.slice(0, 3)).toEqual([
      { fromRoomId: 'outskirts', toRoomId: 'cicka_home' },
      { fromRoomId: 'cicka_home', toRoomId: 'work_artifact' },
      { fromRoomId: 'work_artifact', toRoomId: 'stampede_blanket' }
    ]);
  });

  it('resolves spawn and Cicka Home anchors as typed facts', () => {
    const facts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT);
    const cicka = findRidgeBlockoutFactAnchor(facts, {
      roomId: 'cicka_home',
      symbol: 'C',
      kind: 'npc',
      attrId: 'cicka'
    });

    expect(facts.spawn).toMatchObject({
      roomId: 'outskirts',
      symbol: '1',
      kind: 'player_spawn',
      id: 'start'
    });
    expect(cicka).toMatchObject({
      roomId: 'cicka_home',
      symbol: 'C',
      kind: 'npc',
      id: 'cicka'
    });
    expect(cicka?.x).toBeGreaterThan(0);
    expect(cicka?.y).toBeGreaterThan(0);
  });

  it('exposes Trail Card and Relay anchors without raw attr reads', () => {
    const facts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT);
    const stampede = findRidgeBlockoutFactAnchor(facts, {
      roomId: 'stampede_blanket',
      symbol: '*',
      kind: 'minigame',
      attrId: 'stampede_sketch'
    });
    const relay = findRidgeBlockoutFactAnchor(facts, {
      roomId: 'relay_gate',
      symbol: '?',
      kind: 'gate',
      attrId: 'relay_proof_slots'
    });
    const relayRoom = facts.rooms.find((room) => room.id === 'relay_gate');

    expect(stampede).toMatchObject({
      roomId: 'stampede_blanket',
      id: 'stampede_sketch'
    });
    expect(relay).toMatchObject({
      roomId: 'relay_gate',
      id: 'relay_proof_slots'
    });
    expect(relay?.x).toBeGreaterThanOrEqual(relayRoom?.bounds.x ?? 0);
    expect(relay?.x).toBeLessThanOrEqual(
      relayRoom ? relayRoom.bounds.x + relayRoom.bounds.width : Number.POSITIVE_INFINITY
    );
  });

  it('resolves future-route promises as typed route facts', () => {
    const facts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT);
    const underpath = facts.futureRoutes.find((route) => route.id === 'cicka_underpath');
    const highLedge = facts.futureRoutes.find((route) => route.id === 'high_ledge');

    expect(underpath).toMatchObject({
      kind: 'future_route',
      roomIds: ['outskirts', 'underpath', 'cicka_home']
    });
    expect(underpath?.links).toContainEqual({
      fromRoomId: 'underpath',
      toRoomId: 'cicka_home'
    });
    expect(highLedge?.links).toEqual([
      { fromRoomId: 'domino_desk', toRoomId: 'high_ledge' }
    ]);
  });

  it('resolves Stampede shortcut source, gate, and availability from progress', () => {
    const lockedFacts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT, { stampIds: [] });
    const unlockedFacts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT, {
      stampIds: [STAMPEDE_SKETCH_RIDGE_STAMP_ID]
    });
    const lockedShortcut = lockedFacts.shortcuts.find((shortcut) => shortcut.id === 'stampede_sketch');
    const unlockedShortcut = unlockedFacts.shortcuts.find((shortcut) => shortcut.id === 'stampede_sketch');

    expect(lockedShortcut).toMatchObject({
      id: 'stampede_sketch',
      fromRoomId: 'switchback_shelf',
      toRoomId: 'cicka_home',
      kind: 'fall_steer_fold_drop',
      movement: 'drop',
      requiredStampId: STAMPEDE_SKETCH_RIDGE_STAMP_ID,
      available: false
    });
    expect(lockedShortcut?.from).toMatchObject({
      roomId: 'switchback_shelf',
      targetRoomId: 'cicka_home',
      requires: 'stampede_sketch',
      movement: 'drop'
    });
    expect(unlockedShortcut).toMatchObject({
      id: 'stampede_sketch',
      movement: 'drop',
      available: true
    });
  });

  it('exposes Cicka Home mutation declarations as typed facts', () => {
    const facts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT);

    expect(facts.homeMutations).toContainEqual(expect.objectContaining({
      id: 'stampede_sketch',
      adds: 'stampede_note',
      opens: 'fold_drop_landing'
    }));
    expect(facts.homeMutations).toContainEqual(expect.objectContaining({
      id: 'work_artifact',
      adds: 'work_display'
    }));
  });
});
