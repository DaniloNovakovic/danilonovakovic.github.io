import { describe, expect, it } from 'vitest';
import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import { RIDGE_BLOCKOUT } from './ridgeBlockout';
import {
  deriveRidgeBlockoutGeometry,
  findRidgeBlockoutRoom,
  getRidgeBlockoutAnchorPoint,
  isRidgeBlockoutShortcutAvailable
} from './index';
import {
  isMantleTargetCollider,
  isTraversalPathOccludedBySolid
} from '../runtime/traversalComfort';

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

  it('keeps the Cicka Home secret chamber enclosed by solid wall colliders', () => {
    const geometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT);
    const chamberColliders = geometry.gridColliders.filter((collider) =>
      collider.roomId === 'cicka_home' &&
      collider.kind === 'solid' &&
      (
        collider.id === 'cicka_home:6:5:#' ||
        collider.id === 'cicka_home:10:5:#' ||
        collider.id === 'cicka_home:8:5:#' ||
        collider.id === 'cicka_home:8:26:#'
      )
    );

    expect(chamberColliders.map((collider) => collider.id).sort()).toEqual([
      'cicka_home:10:5:#',
      'cicka_home:6:5:#',
      'cicka_home:8:26:#',
      'cicka_home:8:5:#'
    ]);
    expect(chamberColliders.every((collider) => !isMantleTargetCollider(collider))).toBe(true);
  });

  it('keeps Cicka reachable on the Cicka Home perch shelf in the greybox', () => {
    const geometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT);
    const cickaHome = findRidgeBlockoutRoom(RIDGE_BLOCKOUT, 'cicka_home');
    const cickaAnchor = cickaHome?.anchors.find((anchor) => anchor.attrs.id === 'cicka');
    if (!cickaHome || !cickaAnchor) throw new Error('missing Cicka Home anchor');

    const cickaPoint = getRidgeBlockoutAnchorPoint(RIDGE_BLOCKOUT, cickaHome, cickaAnchor);
    const supportingFloor = geometry.gridColliders.find((collider) =>
      collider.roomId === 'cicka_home' &&
      collider.kind === 'solid' &&
      cickaPoint !== undefined &&
      cickaPoint.x >= collider.x - collider.width / 2 &&
      cickaPoint.x <= collider.x + collider.width / 2 &&
      cickaPoint.y < collider.y &&
      collider.y - cickaPoint.y <= RIDGE_BLOCKOUT.cell * 1.5
    );

    expect(cickaPoint).toBeDefined();
    expect(supportingFloor?.id).toBe('cicka_home:6:5:#');
  });

  it('uses a climb connector from Cicka Home toward Work Artifact instead of an unusable steep ramp', () => {
    const geometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT);
    const cickaToWork = geometry.routeConnectors.find(
      (connector) => connector.id === 'route:first_walk:cicka_home:work_artifact'
    );

    expect(cickaToWork?.movement).toBe('climb');
    expect(cickaToWork?.assistZones).toHaveLength(1);
    expect(cickaToWork?.assistZones[0]?.kind).toBe('climb');
    expect(cickaToWork?.assistZones[0]?.from.x).toBe(cickaToWork?.assistZones[0]?.to.x);
    const cickaFloor = geometry.gridColliders.find((collider) =>
      collider.id === 'cicka_home:13:0:#'
    );
    expect(cickaToWork?.assistZones[0]?.from.y).toBe(
      cickaFloor ? cickaFloor.y - cickaFloor.height / 2 : undefined
    );
    expect(isTraversalPathOccludedBySolid({
      from: {
        x: cickaToWork?.assistZones[0]?.from.x ?? 0,
        y: (cickaToWork?.assistZones[0]?.from.y ?? 0) - 31
      },
      to: {
        x: cickaToWork?.assistZones[0]?.to.x ?? 0,
        y: (cickaToWork?.assistZones[0]?.to.y ?? 0) - 31
      },
      bodySize: { width: 34, height: 62 },
      solidRects: geometry.gridColliders.filter((collider) => collider.kind === 'solid')
    })).toBe(false);
    expect(cickaToWork?.colliders).toEqual([]);
  });
});
