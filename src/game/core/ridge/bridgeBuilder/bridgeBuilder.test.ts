import { describe, expect, it } from 'vitest';
import {
  addBeam,
  BLUEPRINT_BRIDGE_PUZZLE as PUZZLE,
  BridgeSim,
  BridgeWorkbench,
  designInk,
  DRAFTSPERSON_SKETCH,
  hasRoadAcross,
  settleBridge,
  type BridgeBeamSpec,
  type BridgeDesign
} from './index';
import { createBridgeStage } from '../content/bridgeStage';
import { TEST_BRIDGE_DIALOGUE_CATALOG } from '../content/testBridgeCatalog';

const road = (ax: number, ay: number, bx: number, by: number): BridgeBeamSpec => ({
  a: { x: ax, y: ay },
  b: { x: bx, y: by },
  material: 'road'
});
const wood = (ax: number, ay: number, bx: number, by: number): BridgeBeamSpec => ({
  ...road(ax, ay, bx, by),
  material: 'wood'
});

const FLAT_DECK: BridgeDesign = [0, 2, 4, 6].map((x) => road(x, 0, x + 2, 0));
const SHORT_DECK: BridgeDesign = [0, 1, 2, 3, 4, 5, 6, 7].map((x) => road(x, 0, x + 1, 0));
/** Triangles above the deck whose tops are never joined: still a floppy chain. */
const LOOSE_TRIANGLES: BridgeDesign = [
  ...SHORT_DECK,
  ...[0, 2, 4, 6].flatMap((x) => [wood(x, 0, x + 1, -1), wood(x + 1, -1, x + 2, 0)])
];
/** One-square-deep Warren truss: the cheapest sensible answer. */
const SHALLOW_TRUSS: BridgeDesign = [
  ...LOOSE_TRIANGLES,
  wood(1, -1, 3, -1),
  wood(3, -1, 5, -1),
  wood(5, -1, 7, -1)
];
/** Truss hung below the deck from the low cliff bolts. */
const UNDER_TRUSS: BridgeDesign = [
  ...FLAT_DECK,
  wood(0, 2, 2, 1),
  wood(2, 1, 2, 0),
  wood(2, 1, 4, 1),
  wood(4, 1, 4, 0),
  wood(4, 1, 6, 1),
  wood(6, 1, 6, 0),
  wood(6, 1, 8, 2),
  wood(0, 2, 2, 0),
  wood(2, 1, 4, 0),
  wood(6, 1, 4, 0),
  wood(8, 2, 6, 0)
];

/** A W hung between the low bolts: its bottom points dangle over the river. */
const DANGLING_W: BridgeDesign = [
  road(0, 0, 1, 0),
  road(1, 0, 2, 0),
  road(2, 0, 4, 0),
  road(4, 0, 6, 0),
  road(6, 0, 7, 0),
  road(7, 0, 8, 0),
  wood(0, 2, 1, 0),
  wood(2, 0, 3, 2),
  wood(3, 2, 4, 0),
  wood(4, 0, 5, 2),
  wood(5, 2, 6, 0),
  wood(7, 0, 8, 2)
];

function run(design: BridgeDesign) {
  const sim = new BridgeSim(PUZZLE, design);
  return { status: sim.runToEnd(), sim };
}

describe('Blueprint Bridge physics', () => {
  it('splashes with nothing drawn', () => {
    expect(run([]).status).toBe('splashed');
  });

  it.each([
    ['flat long planks', FLAT_DECK],
    ['flat short planks', SHORT_DECK],
    ['triangles with loose tops', LOOSE_TRIANGLES]
  ])('collapses a %s deck', (_name, design) => {
    const { status, sim } = run(design);
    expect(status).toBe('splashed');
    expect(sim.firstSnap).not.toBeNull();
  });

  it.each([
    ["the Draftsperson's sketch", DRAFTSPERSON_SKETCH],
    ['a shallow truss', SHALLOW_TRUSS],
    ['a truss hung under the deck', UNDER_TRUSS]
  ])('carries the toy car across %s', (_name, design) => {
    const { status, sim } = run(design);
    expect(status).toBe('passed');
    expect(sim.beams.every((beam) => !beam.broken)).toBe(true);
  });

  it('is deterministic for the same design', () => {
    const a = run(SHALLOW_TRUSS).sim;
    const b = run(SHALLOW_TRUSS).sim;
    expect(a.time).toBe(b.time);
    expect(a.peakStress).toBe(b.peakStress);
    expect(a.carPose()).toEqual(b.carPose());
  });

  it('settles a sound design without breaking it', () => {
    const settled = settleBridge(PUZZLE, DRAFTSPERSON_SKETCH);
    expect(settled.beams.some((beam) => beam.broken)).toBe(false);
    expect(settled.status).toBe('settling');
  });

  it('matches the stick stage river width', () => {
    // River spans progress 0.58–0.78 on a 1440-unit progress line.
    expect(PUZZLE.columns * PUZZLE.cell).toBeCloseTo((0.78 - 0.58) * 1440);
  });
});

describe('Blueprint Bridge design rules', () => {
  it('only starts beams from bolts or existing joints', () => {
    const floating = addBeam(PUZZLE, [], { x: 3, y: -1 }, { x: 4, y: -1 }, 'wood');
    expect(floating.ok).toBe(false);
    const bolted = addBeam(PUZZLE, [], { x: 0, y: 0 }, { x: 2, y: 0 }, 'road');
    expect(bolted.ok).toBe(true);
  });

  it('caps beam length at about two squares', () => {
    expect(addBeam(PUZZLE, [], { x: 0, y: 0 }, { x: 3, y: 0 }, 'road').ok).toBe(false);
    expect(addBeam(PUZZLE, [], { x: 0, y: 0 }, { x: 2, y: -1 }, 'wood').ok).toBe(true);
  });

  it('swaps material when redrawing an existing beam', () => {
    const first = addBeam(PUZZLE, [], { x: 0, y: 0 }, { x: 2, y: 0 }, 'wood');
    if (!first.ok) throw new Error('expected first beam');
    const swapped = addBeam(PUZZLE, first.design, { x: 2, y: 0 }, { x: 0, y: 0 }, 'road');
    expect(swapped.ok && swapped.replaced).toBe(true);
    expect(swapped.ok && swapped.design).toEqual([road(0, 0, 2, 0)]);
  });

  it('allows a post above a bank bolt but not down the cliff face', () => {
    expect(addBeam(PUZZLE, [], { x: 8, y: 0 }, { x: 8, y: -1 }, 'wood').ok).toBe(true);
    expect(addBeam(PUZZLE, [], { x: 0, y: 0 }, { x: 0, y: 2 }, 'wood').ok).toBe(false);
  });

  it('knows when road reaches both banks', () => {
    expect(hasRoadAcross(PUZZLE, FLAT_DECK)).toBe(true);
    expect(hasRoadAcross(PUZZLE, FLAT_DECK.slice(0, 3))).toBe(false);
  });

  it("keeps the Draftsperson's sketch inside the ink budget", () => {
    expect(designInk(PUZZLE, DRAFTSPERSON_SKETCH)).toBeLessThanOrEqual(PUZZLE.inkBudget);
  });
});

describe('Blueprint Bridge workbench', () => {
  it('runs the draw → fail → fix → pass loop with tips', () => {
    const bench = new BridgeWorkbench(PUZZLE);
    expect(bench.tip).toBe('intro');

    for (const beam of FLAT_DECK) {
      expect(bench.apply({ kind: 'add', material: beam.material, a: beam.a, b: beam.b }).ok).toBe(true);
    }
    const failed = bench.apply({ kind: 'test', instant: true });
    expect(failed.ok).toBe(false);
    expect(bench.phase).toBe('failed');
    expect(bench.tip).toBe('bare_deck');
    expect(bench.lastBreak).not.toBeNull();

    // Editing is locked until the player goes back to the table.
    expect(bench.apply({ kind: 'undo' }).ok).toBe(false);
    expect(bench.apply({ kind: 'edit' }).ok).toBe(true);
    expect(bench.design).toHaveLength(FLAT_DECK.length);

    bench.apply({ kind: 'sketch' });
    expect(bench.apply({ kind: 'test', instant: true }).ok).toBe(true);
    expect(bench.phase).toBe('passed');
    expect(bench.apply({ kind: 'done' }).ok).toBe(true);
  });

  it('offers the sketch after repeated failures', () => {
    const bench = new BridgeWorkbench(PUZZLE);
    bench.apply({ kind: 'add', material: 'road', a: { x: 0, y: 0 }, b: { x: 2, y: 0 } });
    bench.apply({ kind: 'test', instant: true });
    expect(bench.tip).toBe('no_road');
    bench.apply({ kind: 'edit' });
    for (const beam of FLAT_DECK.slice(1)) {
      bench.apply({ kind: 'add', material: beam.material, a: beam.a, b: beam.b });
    }
    bench.apply({ kind: 'test', instant: true });
    expect(bench.sketchOffered).toBe(true);
    // The remark still names what went wrong; the sketch offer rides along.
    expect(bench.tip).toBe('bare_deck');
    expect(bench.sketchNudge).toBe(true);
    bench.apply({ kind: 'hint' });
    expect(bench.sketchNudge).toBe(false);
  });

  it.each([
    ['road with no supports', FLAT_DECK, 'bare_deck'],
    ['triangles with loose tops', LOOSE_TRIANGLES, 'loose_frame'],
    ['a W whose low points dangle', DANGLING_W, 'hanging_joint'],
    // The sketch missing one middle diagonal survives settling, then cracks under the car.
    ['a truss missing a middle brace', DRAFTSPERSON_SKETCH.filter((_, i) => i !== 7), 'snapped_middle']
  ] as const)('reacts to %s', (_name, design, tip) => {
    const bench = new BridgeWorkbench(PUZZLE);
    for (const beam of design) bench.apply({ kind: 'add', ...beam });
    bench.apply({ kind: 'test', instant: true });
    expect(bench.phase).toBe('failed');
    expect(bench.tip).toBe(tip);
  });

  it.each([
    ['a sound truss', DRAFTSPERSON_SKETCH, 'steady', false],
    ['triangles with loose tops', LOOSE_TRIANGLES, 'wobbly', true],
    ['a W whose low points dangle', DANGLING_W, 'wobbly', true]
  ] as const)('previews %s before testing', (_name, design, tip, snaps) => {
    const bench = new BridgeWorkbench(PUZZLE);
    for (const beam of design) bench.apply({ kind: 'add', ...beam });
    expect(bench.tip).toBe(tip);
    expect(bench.preview.beams.some((beam) => beam.broken)).toBe(snaps);
    expect(bench.attempts).toBe(0);
  });

  it('only coaches the preview once road reaches across', () => {
    const bench = new BridgeWorkbench(PUZZLE);
    bench.apply({ kind: 'add', material: 'road', a: { x: 0, y: 0 }, b: { x: 2, y: 0 } });
    expect(bench.tip).toBe('drawing');
  });

  it('animates a test one frame at a time', () => {
    const bench = new BridgeWorkbench(PUZZLE);
    bench.apply({ kind: 'sketch' });
    expect(bench.apply({ kind: 'test', instant: false }).ok).toBe(true);
    expect(bench.phase).toBe('testing');
    for (let i = 0; i < 2000 && bench.phase === 'testing'; i += 1) bench.stepTest();
    expect(bench.phase).toBe('passed');
  });

  it('refuses to test over the ink budget', () => {
    const bench = new BridgeWorkbench({ ...PUZZLE, inkBudget: 5 });
    bench.apply({ kind: 'sketch' });
    expect(bench.apply({ kind: 'test', instant: true }).ok).toBe(false);
    expect(bench.tip).toBe('out_of_ink');
    expect(bench.attempts).toBe(0);
  });

  it('undoes one edit at a time', () => {
    const bench = new BridgeWorkbench(PUZZLE);
    bench.apply({ kind: 'add', material: 'road', a: { x: 0, y: 0 }, b: { x: 2, y: 0 } });
    bench.apply({ kind: 'add', material: 'road', a: { x: 2, y: 0 }, b: { x: 4, y: 0 } });
    bench.apply({ kind: 'undo' });
    expect(bench.design).toEqual([road(0, 0, 2, 0)]);
  });
});

describe('Draftsperson remarks', () => {
  const catalog = {
    ...TEST_BRIDGE_DIALOGUE_CATALOG,
    lines: {
      ...TEST_BRIDGE_DIALOGUE_CATALOG.lines,
      'bridge.builder.tip.bare_deck': 'Ouch.',
      'bridge.builder.tip.bare_deck.2': 'Oof.',
      'bridge.builder.tip.sketch_nudge': '(Psst.)'
    }
  };
  const remark = createBridgeStage(catalog).describeBridgeTip!;

  it('rotates phrasings between retries', () => {
    expect(remark('bare_deck', { variant: 0, sketchNudge: false })).toBe('Ouch.');
    expect(remark('bare_deck', { variant: 1, sketchNudge: false })).toBe('Oof.');
    expect(remark('bare_deck', { variant: 2, sketchNudge: false })).toBe('Ouch.');
  });

  it('tacks the sketch offer onto the remark', () => {
    expect(remark('bare_deck', { variant: 0, sketchNudge: true })).toBe('Ouch. (Psst.)');
  });
});
