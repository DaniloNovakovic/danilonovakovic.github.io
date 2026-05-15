import { describe, expect, it } from 'vitest';
import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import { RIDGE_BLOCKOUT } from './ridgeBlockout';
import {
  deriveRidgeBlockoutGeometry,
  findRidgeBlockoutRoom,
  getRidgeBlockoutAnchorPoint,
  isRidgeBlockoutShortcutAvailable
} from './index';

describe('ridge blockout geometry', () => {
  it('derives horizontal collider runs from solid and platform cells', () => {
    const geometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT);

    expect(geometry.gridColliders.some((collider) => collider.kind === 'solid')).toBe(true);
    expect(geometry.gridColliders.some((collider) => collider.kind === 'platform')).toBe(true);
    expect(geometry.gridColliders.find((collider) =>
      collider.roomId === 'outskirts' &&
      collider.kind === 'solid' &&
      collider.width > RIDGE_BLOCKOUT.cell
    )).toBeDefined();
  });

  it('generates first-walk connector platforms from route exit anchors', () => {
    const geometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT);

    expect(geometry.routeConnectors.length).toBeGreaterThan(0);
    expect(geometry.routeConnectors.every((collider) => collider.routeId === 'first_walk')).toBe(true);
  });

  it('does not generate collider platforms for future routes', () => {
    const geometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT);
    const futureRouteIds = new Set(RIDGE_BLOCKOUT.futureRoutes.map((route) => route.id));

    expect(geometry.colliders.some((collider) =>
      collider.routeId !== undefined && futureRouteIds.has(collider.routeId)
    )).toBe(false);
  });

  it('keeps the Stampede shortcut unavailable until the Stampede stamp exists', () => {
    const geometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT, { stampIds: [] });
    const stampedeShortcut = geometry.shortcutConnections.find(
      (connection) => connection.id === 'stampede_sketch'
    );

    expect(isRidgeBlockoutShortcutAvailable('stampede_sketch', { stampIds: [] })).toBe(false);
    expect(stampedeShortcut?.unlocked).toBe(false);
    expect(stampedeShortcut?.platforms).toEqual([]);
    expect(geometry.colliders.some((collider) => collider.shortcutId === 'stampede_sketch')).toBe(false);
  });

  it('creates Stampede shortcut collider platforms from progress', () => {
    const geometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT, {
      stampIds: [STAMPEDE_SKETCH_RIDGE_STAMP_ID]
    });
    const stampedeShortcut = geometry.shortcutConnections.find(
      (connection) => connection.id === 'stampede_sketch'
    );

    expect(isRidgeBlockoutShortcutAvailable('stampede_sketch', {
      stampIds: [STAMPEDE_SKETCH_RIDGE_STAMP_ID]
    })).toBe(true);
    expect(stampedeShortcut?.unlocked).toBe(true);
    expect(stampedeShortcut?.platforms.length).toBeGreaterThan(0);
    expect(geometry.colliders.some((collider) => collider.shortcutId === 'stampede_sketch')).toBe(true);
  });

  it('resolves anchor positions from the matching grid symbol bounding box', () => {
    const spawnRoom = findRidgeBlockoutRoom(RIDGE_BLOCKOUT, 'outskirts');
    const spawnAnchor = spawnRoom?.anchors.find((anchor) => anchor.symbol === '1');
    if (!spawnRoom || !spawnAnchor) throw new Error('missing spawn anchor');

    expect(getRidgeBlockoutAnchorPoint(RIDGE_BLOCKOUT, spawnRoom, spawnAnchor)).toMatchObject({
      roomId: 'outskirts',
      symbol: '1',
      kind: 'player_spawn',
      x: 360,
      y: 3768
    });
  });
});
