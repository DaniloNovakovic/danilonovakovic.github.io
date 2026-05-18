import { describe, expect, it } from 'vitest';
import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import { createRidgeBlockoutViewerModel } from './model';

describe('ridge blockout viewer model', () => {
  it('collects the generated Folded Desk Ridge source, map, and validation status', () => {
    const model = createRidgeBlockoutViewerModel();

    expect(model.worldId).toBe('folded_desk_ridge');
    expect(model.sourceWorldId).toBe('folded_desk_ridge');
    expect(model.generatedWorldId).toBe('folded_desk_ridge');
    expect(model.validationErrors).toEqual([]);
    expect(model.rooms).toHaveLength(12);
    expect(model.rooms.map((room) => room.id)).toContain('cicka_home');
  });

  it('classifies grid cells through the shared tile registry and runtime ids', () => {
    const model = createRidgeBlockoutViewerModel();
    const cickaLadder = model.gridCells.find((cell) =>
      cell.roomId === 'cicka_home' && cell.symbol === 'L'
    );
    const cickaAnchor = model.gridCells.find((cell) =>
      cell.roomId === 'cicka_home' && cell.symbol === 'C'
    );

    expect(cickaLadder).toMatchObject({
      runtimeTileId: 3,
      tile: expect.objectContaining({ kind: 'ladder', label: 'ladder or cord guide' })
    });
    expect(cickaAnchor).toMatchObject({
      runtimeTileId: 20,
      tile: expect.objectContaining({ kind: 'anchor', label: 'Cicka anchor' })
    });
  });

  it('exposes route, future-route, shortcut, collider, anchor, and rect overlays', () => {
    const model = createRidgeBlockoutViewerModel();

    expect(model.routes.find((route) => route.id === 'first_walk')?.links.length).toBe(8);
    expect(model.futureRoutes.map((route) => route.id)).toEqual([
      'cicka_underpath',
      'drop_pocket',
      'high_ledge'
    ]);
    expect(model.shortcuts.map((shortcut) => shortcut.id)).toEqual([
      'stampede_sketch',
      'telegraph_clear'
    ]);
    expect(model.colliders.some((collider) => collider.kind === 'solid')).toBe(true);
    expect(model.anchors.some((anchor) => anchor.attrId === 'cicka')).toBe(true);
    expect(model.rects.some((rect) => rect.id === 'stampede_return_landing')).toBe(true);
  });

  it('distinguishes locked and Stampede-unlocked shortcut states', () => {
    const model = createRidgeBlockoutViewerModel();
    const stampedeShortcut = model.shortcuts.find((shortcut) => shortcut.id === 'stampede_sketch');

    expect(stampedeShortcut).toMatchObject({
      requiredStampId: STAMPEDE_SKETCH_RIDGE_STAMP_ID,
      lockedAvailable: false,
      unlockedAvailable: true
    });
    expect(stampedeShortcut?.lockedConnection?.colliders).toEqual([]);
    expect(stampedeShortcut?.unlockedConnection?.assistZones.length).toBeGreaterThan(0);
  });
});
