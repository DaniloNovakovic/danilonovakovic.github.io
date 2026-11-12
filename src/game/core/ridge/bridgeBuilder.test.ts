import { describe, expect, it } from 'vitest';
import {
  addBridgeEdge,
  BRIDGE_BUILDER_INK_BUDGET,
  BRIDGE_GUIDE_EDGES,
  canAddBridgeEdge,
  createCanonicalBridgeDesign,
  createEmptyBridgeDesign,
  evaluateBridge,
  hasBridgeEdge,
  nextBridgeHint,
  removeBridgeEdge
} from './bridgeBuilder';

describe('Blueprint Bridge construction', () => {
  it('accepts the fully traced design for both vehicle tests within budget', () => {
    const design = createCanonicalBridgeDesign();
    const evaluation = evaluateBridge(design);

    expect(evaluation.deckSegments).toBe(4);
    expect(evaluation.triangleCount).toBe(4);
    expect(evaluation.keelCount).toBe(3);
    expect(evaluation.carReady).toBe(true);
    expect(evaluation.truckReady).toBe(true);
    expect(evaluation.inkUsed).toBeLessThanOrEqual(BRIDGE_BUILDER_INK_BUDGET);
  });

  it('lets a light car cross a simpler bridge that cannot carry the truck', () => {
    let design = createEmptyBridgeDesign();
    for (const edge of BRIDGE_GUIDE_EDGES.filter((edge) => edge.role === 'deck')) {
      design = addBridgeEdge(design, edge.a, edge.b);
    }
    for (const edge of [
      { a: 'west-bank', b: 'west-top' },
      { a: 'west-deck', b: 'west-top' },
      { a: 'west-deck', b: 'center-top' },
      { a: 'center-deck', b: 'center-top' }
    ] as const) {
      design = addBridgeEdge(design, edge.a, edge.b);
    }

    const evaluation = evaluateBridge(design);
    expect(evaluation.carReady).toBe(true);
    expect(evaluation.truckReady).toBe(false);
    expect(evaluation.triangleCount).toBe(2);
  });

  it('requires a complete deck before either vehicle can cross', () => {
    const design = addBridgeEdge(createEmptyBridgeDesign(), 'west-bank', 'west-deck');
    const evaluation = evaluateBridge(design);

    expect(evaluation.deckSegments).toBe(1);
    expect(evaluation.carReady).toBe(false);
    expect(evaluation.truckReady).toBe(false);
  });

  it('rejects duplicate joints and removes a strut by either endpoint order', () => {
    const empty = createEmptyBridgeDesign();
    const design = addBridgeEdge(empty, 'west-bank', 'west-deck');

    expect(canAddBridgeEdge(design, 'west-deck', 'west-bank')).toBe(false);
    expect(canAddBridgeEdge(design, 'west-deck', 'west-deck')).toBe(false);
    expect(hasBridgeEdge(design, 'west-deck', 'west-bank')).toBe(true);
    expect(removeBridgeEdge(design, { a: 'west-deck', b: 'west-bank' }).edges).toEqual([]);
  });

  it('offers a useful next pencil mark instead of solving the whole puzzle', () => {
    const empty = createEmptyBridgeDesign();
    const hint = nextBridgeHint(empty);
    expect(hint?.role).toBe('deck');

    const withHint = addBridgeEdge(empty, hint!.a, hint!.b);
    expect(nextBridgeHint(withHint)).not.toEqual(hint);
  });
});
