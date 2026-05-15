import { describe, expect, it } from 'vitest';
import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import { STAMPEDE_SKETCH_SCENE_ID } from '@/game/scenes/sceneIds';
import { CICKA_INTERACTION_TARGET_ID } from './cicka/interaction';
import {
  RIDGE_BLOCKOUT,
  deriveRidgeBlockoutGeometry,
  findRidgeBlockoutAnchorPoint,
  getRidgeBlockoutSpawnPoint,
  isRidgeBlockoutShortcutAvailable
} from './blockout';
import { RIDGE_TRAIL_CARD_TARGETS } from './worldLayout';

describe('ridge world layout', () => {
  it('uses the Ridge Blockout source for first route order and spawn', () => {
    const firstWalk = RIDGE_BLOCKOUT.routes.find((route) => route.id === 'first_walk');

    expect(firstWalk?.roomIds.slice(0, 4)).toEqual([
      'outskirts',
      'cicka_home',
      'work_artifact',
      'stampede_blanket'
    ]);
    expect(getRidgeBlockoutSpawnPoint(RIDGE_BLOCKOUT)).toMatchObject({
      roomId: 'outskirts',
      symbol: '1',
      kind: 'player_spawn',
      attrs: { id: 'start' }
    });
  });

  it('resolves Cicka Home from the compiled blockout anchor', () => {
    const geometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT);
    const cickaPoint = findRidgeBlockoutAnchorPoint(geometry, {
      roomId: 'cicka_home',
      symbol: 'C',
      kind: 'npc',
      attrId: 'cicka'
    });

    expect(cickaPoint).toMatchObject({
      roomId: 'cicka_home',
      symbol: 'C',
      kind: 'npc',
      attrs: { id: 'cicka' }
    });
    expect(cickaPoint?.x).toBeGreaterThan(0);
    expect(cickaPoint?.y).toBeGreaterThan(0);
  });

  it('resolves Trail Card targets from their blockout anchors while keeping card content non-spatial', () => {
    const geometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT);
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
    expect(findRidgeBlockoutAnchorPoint(geometry, stampede.anchor)).toMatchObject({
      roomId: 'stampede_blanket',
      symbol: '*',
      kind: 'minigame',
      attrs: { id: 'stampede_sketch' }
    });
  });

  it('resolves the Relay promise from the Relay Gate blockout anchor', () => {
    const geometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT);
    const relayRoom = geometry.roomBounds.find((room) => room.roomId === 'relay_gate');
    const relayPoint = findRidgeBlockoutAnchorPoint(geometry, {
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
      attrs: { id: 'relay_proof_slots' }
    });
    expect(relayPoint?.x).toBeGreaterThanOrEqual(relayRoom?.x ?? 0);
    expect(relayPoint?.x).toBeLessThanOrEqual(
      relayRoom ? relayRoom.x + relayRoom.width : Number.POSITIVE_INFINITY
    );
  });

  it('derives the Stampede shortcut source and availability from blockout facts', () => {
    const shortcut = RIDGE_BLOCKOUT.shortcuts.find((candidate) => candidate.id === 'stampede_sketch');
    const lockedGeometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT, { stampIds: [] });
    const unlockedGeometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT, {
      stampIds: [STAMPEDE_SKETCH_RIDGE_STAMP_ID]
    });
    const lockedConnection = lockedGeometry.shortcutConnections.find(
      (connection) => connection.id === 'stampede_sketch'
    );
    const unlockedConnection = unlockedGeometry.shortcutConnections.find(
      (connection) => connection.id === 'stampede_sketch'
    );

    expect(shortcut).toMatchObject({
      id: 'stampede_sketch',
      fromRoomId: 'switchback_shelf',
      toRoomId: 'cicka_home',
      kind: 'fall_steer_fold_drop'
    });
    expect(isRidgeBlockoutShortcutAvailable('stampede_sketch', { stampIds: [] })).toBe(false);
    expect(isRidgeBlockoutShortcutAvailable('stampede_sketch', {
      stampIds: [STAMPEDE_SKETCH_RIDGE_STAMP_ID]
    })).toBe(true);
    expect(lockedConnection).toMatchObject({
      id: 'stampede_sketch',
      unlocked: false,
      movement: 'drop'
    });
    expect(lockedConnection?.from).toMatchObject({
      roomId: 'switchback_shelf',
      attrs: {
        to: 'cicka_home',
        requires: 'stampede_sketch'
      }
    });
    expect(lockedConnection?.assistZones).toEqual([]);
    expect(unlockedConnection).toMatchObject({
      id: 'stampede_sketch',
      unlocked: true,
      movement: 'drop'
    });
    expect(unlockedConnection?.assistZones.some((zone) => zone.kind === 'drop')).toBe(true);
  });
});
