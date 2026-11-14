import { describe, expect, it } from 'vitest';
import {
  addBridgeBeam,
  bridgeInkUsed,
  canAddBridgeBeam,
  createCanonicalBridgeDesign,
  createEmptyBridgeDesign,
  isBridgeDesign,
  moveBridgeNode,
  removeBridgeBeam,
  removeBridgeNode
} from './bridgeBuilder';
import {
  createBridgeSimulation,
  runBridgeCarTest,
  stepBridgeSimulation
} from './bridgePhysics';

describe('freeform Blueprint Bridge construction', () => {
  it('creates arbitrary joints, snaps to them, and supports moving and erasing', () => {
    const empty = createEmptyBridgeDesign();
    const first = addBridgeBeam(empty, { x: 70, y: 210 }, { x: 190, y: 190 });
    const joint = first.nodes.find((node) => !node.pinned);
    expect(joint).toBeDefined();

    const second = addBridgeBeam(first, { x: 188, y: 192 }, { x: 320, y: 100 }, 'cable');
    expect(second.nodes).toHaveLength(first.nodes.length + 1);
    expect(second.beams).toHaveLength(2);
    expect(second.beams[1]?.kind).toBe('cable');
    expect(isBridgeDesign(second)).toBe(true);

    const moved = moveBridgeNode(second, joint!.id, { x: 205, y: 180 });
    expect(moved.nodes.find((node) => node.id === joint!.id)).toMatchObject({ x: 205, y: 180 });

    const withoutBeam = removeBridgeBeam(moved, moved.beams[0]!.id);
    expect(withoutBeam.beams).toHaveLength(1);
    const withoutJoint = removeBridgeNode(withoutBeam, joint!.id);
    expect(withoutJoint.beams).toHaveLength(0);
    expect(withoutJoint.nodes.some((node) => node.id === joint!.id)).toBe(false);
  });

  it('rejects duplicate and overlong beams', () => {
    const design = addBridgeBeam(createEmptyBridgeDesign(), { x: 70, y: 210 }, { x: 190, y: 190 });
    expect(canAddBridgeBeam(design, { x: 70, y: 210 }, { x: 190, y: 190 })).toBe(false);
    expect(canAddBridgeBeam(design, { x: 70, y: 210 }, { x: 400, y: 80 })).toBe(false);
  });

  it('uses material length rather than a fixed beam count for the ink budget', () => {
    const design = addBridgeBeam(createEmptyBridgeDesign(), { x: 70, y: 210 }, { x: 190, y: 190 });
    const withCable = addBridgeBeam(design, { x: 190, y: 190 }, { x: 300, y: 100 }, 'cable');
    expect(bridgeInkUsed(withCable)).toBeGreaterThan(bridgeInkUsed(design));
    expect(bridgeInkUsed(withCable)).toBeLessThan(bridgeInkUsed(design) + 16);
  });
});

describe('Blueprint Bridge car physics', () => {
  it('lets the car cross a freely constructed supported bridge', () => {
    const design = createCanonicalBridgeDesign();
    expect(isBridgeDesign(design)).toBe(true);
    const result = runBridgeCarTest(design);

    expect(result.status).toBe('crossed');
    expect(result.car.rear.x).toBeGreaterThan(582);
    expect(result.car.front.x).toBeGreaterThan(582);
    expect(result.brokenBeamIds).toEqual([]);
  });

  it('allows a minimal road when its own physics carries the car', () => {
    const supported = createCanonicalBridgeDesign();
    const result = runBridgeCarTest({ nodes: supported.nodes, beams: supported.beams.slice(0, 4) });
    expect(result.status).toBe('crossed');
  });

  it('fails the test when there is no continuous road', () => {
    const result = runBridgeCarTest(createEmptyBridgeDesign());
    expect(result.status).toBe('failed');
    expect(Math.max(result.car.rear.y, result.car.front.y)).toBeGreaterThan(300);
  });

  it('snaps a beam after sustained overstress', () => {
    const design = addBridgeBeam(createEmptyBridgeDesign(), { x: 70, y: 210 }, { x: 190, y: 210 });
    const simulation = createBridgeSimulation(design);
    const joint = simulation.nodes.find((node) => !node.pinned)!;
    joint.y += 80;
    joint.pinned = true;
    for (let index = 0; index < 60; index += 1) stepBridgeSimulation(simulation);

    expect(simulation.brokenBeamIds).toContain(design.beams[0]!.id);
  });

  it('does not let tension-only cables act as a road', () => {
    let design = createEmptyBridgeDesign();
    design = addBridgeBeam(design, { x: 70, y: 210 }, { x: 240, y: 210 }, 'cable');
    design = addBridgeBeam(design, { x: 240, y: 210 }, { x: 410, y: 210 }, 'cable');
    design = addBridgeBeam(design, { x: 410, y: 210 }, { x: 570, y: 210 }, 'cable');
    const result = runBridgeCarTest(design);

    expect(result.status).toBe('failed');
  });
});
