import { describe, expect, it } from 'vitest';
import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import { STAMPEDE_SKETCH_SCENE_ID } from '@/game/scenes/sceneIds';
import { CICKA_INTERACTION_TARGET_ID } from './cicka/interaction';
import {
  RIDGE_BLOCKOUT,
  compileRidgeBlockoutFacts,
  findRidgeBlockoutFactAnchor
} from './blockout';
import { RIDGE_TRAIL_CARD_TARGETS } from './worldLayout';

describe('ridge world layout', () => {
  it('uses the Ridge Blockout source for first route order and spawn', () => {
    const facts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT);
    const firstWalk = facts.routes.find((route) => route.id === 'first_walk');

    expect(firstWalk?.roomIds.slice(0, 4)).toEqual([
      'outskirts',
      'cicka_home',
      'work_artifact',
      'stampede_blanket'
    ]);
    expect(facts.spawn).toMatchObject({
      roomId: 'outskirts',
      symbol: '1',
      kind: 'player_spawn',
      id: 'start'
    });
  });

  it('resolves Cicka Home from the compiled blockout anchor', () => {
    const facts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT);
    const cickaPoint = findRidgeBlockoutFactAnchor(facts, {
      roomId: 'cicka_home',
      symbol: 'C',
      kind: 'npc',
      attrId: 'cicka'
    });

    expect(cickaPoint).toMatchObject({
      roomId: 'cicka_home',
      symbol: 'C',
      kind: 'npc',
      id: 'cicka'
    });
    expect(cickaPoint?.x).toBeGreaterThan(0);
    expect(cickaPoint?.y).toBeGreaterThan(0);
  });

  it('resolves Trail Card targets from their blockout anchors while keeping card content non-spatial', () => {
    const facts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT);
    const stampede = RIDGE_TRAIL_CARD_TARGETS.find((target) => target.id === 'stampede-sketch');
    const unavailable = RIDGE_TRAIL_CARD_TARGETS.filter((target) => target.id !== 'stampede-sketch');

    expect(RIDGE_TRAIL_CARD_TARGETS.map((target) => target.id)).toEqual([
      'stampede-sketch',
      'telegraph-terrace',
      'domino-desk'
    ]);
    expect(RIDGE_TRAIL_CARD_TARGETS.map((target) => target.id)).not.toContain(
      CICKA_INTERACTION_TARGET_ID
    );
    expect(stampede?.card.enterSceneId).toBe(STAMPEDE_SKETCH_SCENE_ID);
    expect(stampede?.card.unavailableReason).toBeUndefined();
    expect(unavailable.every((target) => target.card.unavailableReason && !target.card.enterSceneId)).toBe(true);

    if (!stampede) throw new Error('missing Stampede Trail Card target');
    expect(findRidgeBlockoutFactAnchor(facts, stampede.anchor)).toMatchObject({
      roomId: 'stampede_blanket',
      symbol: '*',
      kind: 'minigame',
      id: 'stampede_sketch'
    });
  });

  it('resolves the Relay promise from the Relay Gate blockout anchor', () => {
    const facts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT);
    const relayRoom = facts.rooms.find((room) => room.id === 'relay_gate');
    const relayPoint = findRidgeBlockoutFactAnchor(facts, {
      roomId: 'relay_gate',
      symbol: '?',
      kind: 'gate',
      attrId: 'relay_proof_slots'
    });

    expect(relayRoom).toBeDefined();
    expect(relayPoint).toMatchObject({
      roomId: 'relay_gate',
      symbol: '?',
      kind: 'gate',
      id: 'relay_proof_slots'
    });
    expect(relayPoint?.x).toBeGreaterThanOrEqual(relayRoom?.bounds.x ?? 0);
    expect(relayPoint?.x).toBeLessThanOrEqual(
      relayRoom ? relayRoom.bounds.x + relayRoom.bounds.width : Number.POSITIVE_INFINITY
    );
  });

  it('derives the Stampede shortcut source and availability from blockout facts', () => {
    const lockedFacts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT, { stampIds: [] });
    const unlockedFacts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT, {
      stampIds: [STAMPEDE_SKETCH_RIDGE_STAMP_ID]
    });
    const lockedConnection = lockedFacts.shortcuts.find((shortcut) => shortcut.id === 'stampede_sketch');
    const unlockedConnection = unlockedFacts.shortcuts.find((shortcut) => shortcut.id === 'stampede_sketch');

    expect(lockedConnection).toMatchObject({
      id: 'stampede_sketch',
      fromRoomId: 'switchback_shelf',
      toRoomId: 'cicka_home',
      kind: 'fall_steer_fold_drop',
      available: false,
      movement: 'drop'
    });
    expect(lockedConnection?.from).toMatchObject({
      roomId: 'switchback_shelf',
      targetRoomId: 'cicka_home',
      requires: 'stampede_sketch'
    });
    expect(unlockedConnection).toMatchObject({
      id: 'stampede_sketch',
      available: true,
      movement: 'drop'
    });
  });
});
