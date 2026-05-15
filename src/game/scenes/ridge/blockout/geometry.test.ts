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

  it('generates first-walk traversal connectors from route exit anchors', () => {
    const geometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT);

    expect(geometry.routeConnectors.length).toBeGreaterThan(0);
    expect(geometry.routeConnectors.every((connector) => connector.routeId === 'first_walk')).toBe(true);
  });

  it('derives typed traversal connectors from movement anchor metadata', () => {
    const geometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT);

    expect(geometry.routeConnectors.some((connector) => connector.movement === 'ramp')).toBe(true);
    expect(geometry.routeConnectors.some((connector) => connector.movement === 'jump')).toBe(true);
    expect(geometry.routeConnectors.some((connector) => connector.movement === 'climb')).toBe(true);
    expect(geometry.assistZones.some((zone) => zone.kind === 'ramp')).toBe(true);
    expect(geometry.assistZones.some((zone) => zone.kind === 'climb')).toBe(true);
  });

  it('keeps main-route generated jump platforms sparse and intentional', () => {
    const geometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT);
    const jumpConnectors = geometry.routeConnectors.filter(
      (connector) => connector.movement === 'jump'
    );

    expect(jumpConnectors.length).toBeGreaterThan(0);
    jumpConnectors.forEach((connector) => {
      expect(connector.colliders.length).toBeGreaterThan(0);
      expect(connector.colliders.length).toBeLessThanOrEqual(2);
    });
    expect(geometry.routeConnectors.some((connector) =>
      connector.movement === 'ramp' && connector.colliders.length > 2
    )).toBe(false);
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
    expect(stampedeShortcut?.colliders).toEqual([]);
    expect(stampedeShortcut?.assistZones).toEqual([]);
    expect(geometry.colliders.some((collider) => collider.shortcutId === 'stampede_sketch')).toBe(false);
  });

  it('creates Stampede shortcut drop assist from progress', () => {
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
    expect(stampedeShortcut?.movement).toBe('drop');
    expect(stampedeShortcut?.assistZones.some((zone) => zone.kind === 'drop')).toBe(true);
    expect(geometry.assistZones.some((zone) => zone.shortcutId === 'stampede_sketch')).toBe(true);
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
