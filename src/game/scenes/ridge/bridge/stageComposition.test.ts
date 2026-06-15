import { describe, expect, it } from 'vitest';
import { BRIDGE_TEXTURE_KEYS } from './assets';
import {
  BRIDGE_STAGE_SOURCE,
  getBridgeCrossingPlacementSignature,
  getBridgeWalkRailLength,
  getNearestBridgeStageSpotId,
  getStageCompositionPlacementSignature,
  projectPointToBridgeWalkRail,
  resolveBridgeRailRelativeStageDepth,
  resolveBridgeStageObject,
  resolveBridgeStageObjectPlacement,
  resolveBridgeStagePresentation,
  resolveBridgeStageSpot,
  sampleBridgeWalkRail
} from './stageComposition';
import { updateStageAuthoringDraft } from './stageAuthoring';

describe('Bridge Stage Composition Source', () => {
  it('samples the Primary Walk Rail and interpolates Rail Perspective Cues', () => {
    const sample = sampleBridgeWalkRail(BRIDGE_STAGE_SOURCE.primaryWalkRail, 0.615);

    expect(sample.x).toBeGreaterThan(1410);
    expect(sample.x).toBeLessThan(1638);
    expect(sample.y).toBeLessThanOrEqual(520);
    expect(sample.cue.scale).toBeGreaterThan(0.95);
    expect(sample.cue.depth).toBeGreaterThanOrEqual(30);
  });

  it('resolves Stage Spots from rail progress plus authored offsets', () => {
    const draftsperson = resolveBridgeStageSpot(BRIDGE_STAGE_SOURCE, 'draftsperson');
    const blueprint = resolveBridgeStageSpot(BRIDGE_STAGE_SOURCE, 'blueprint');
    const exit = resolveBridgeStageSpot(BRIDGE_STAGE_SOURCE, 'concert-exit');

    expect(draftsperson).toMatchObject({
      x: 1275,
      y: 520,
      prompt: {
        x: 1535,
        y: 424
      },
      interactRadius: 86
    });
    expect(blueprint).toMatchObject({
      x: 1145,
      y: 450
    });
    expect(exit.prompt.y).toBe(394);
  });

  it('derives Bridge presentation from route beat state', () => {
    expect(resolveBridgeStagePresentation('intro')).toMatchObject({
      crossingOpen: false,
      playerProgressRange: {
        min: 0,
        max: 0.61
      },
      cickaSpotId: 'cicka-play',
      toyCar: {
        visible: true,
        spotId: 'cicka-toy-car'
      },
      completedBridgeVisible: false,
      blockedBridgeVisible: true
    });

    expect(resolveBridgeStagePresentation('toy_car_shared')).toMatchObject({
      crossingOpen: false,
      toyCar: {
        visible: false,
        spotId: 'toy-car-test-start'
      }
    });

    expect(resolveBridgeStagePresentation('bridge_complete')).toMatchObject({
      crossingOpen: true,
      playerProgressRange: {
        max: 1
      },
      cickaSpotId: 'cicka-settled',
      toyCar: {
        visible: true,
        spotId: 'toy-car-test-end'
      },
      completedBridgeVisible: true
    });
  });

  it('keeps runtime assets referenced through Stage Plates and Stage Objects', () => {
    expect(BRIDGE_STAGE_SOURCE.plates.map((plate) => plate.textureKey)).toEqual([
      BRIDGE_TEXTURE_KEYS.layeredCornfieldSky,
      BRIDGE_TEXTURE_KEYS.layeredCornfieldFarHill,
      BRIDGE_TEXTURE_KEYS.layeredCornfieldGround
    ]);

    expect(resolveBridgeStageObject(BRIDGE_STAGE_SOURCE, 'bridge-draftsperson')).toMatchObject({
      textureKey: BRIDGE_TEXTURE_KEYS.bridgeBuilder,
      spotId: 'draftsperson'
    });
    expect(resolveBridgeStageObject(BRIDGE_STAGE_SOURCE, 'toy-car')).toMatchObject({
      textureKey: BRIDGE_TEXTURE_KEYS.modularToyCar,
      spotId: 'cicka-toy-car'
    });
    expect(resolveBridgeStageObject(BRIDGE_STAGE_SOURCE, 'completed-bridge')).toMatchObject({
      kind: 'procedural-bridge',
      spotId: 'bridge-center',
      depthMode: 'fixed',
      leftSpotId: 'bridge-left-bank',
      rightSpotId: 'bridge-right-bank',
      deckInset: 8
    });
    expect(BRIDGE_STAGE_SOURCE.occluders[0]?.id).toBe('near-bank-lip');
  });

  it('resolves Stage Object placement with rail-relative visual depth', () => {
    const draftsperson = resolveBridgeStageObjectPlacement(
      BRIDGE_STAGE_SOURCE,
      'bridge-draftsperson'
    );
    const completedBridge = resolveBridgeStageObjectPlacement(
      BRIDGE_STAGE_SOURCE,
      'completed-bridge'
    );
    const bridgeLeftBank = resolveBridgeStageSpot(BRIDGE_STAGE_SOURCE, 'bridge-left-bank');
    const belowRailDepth = resolveBridgeRailRelativeStageDepth(
      bridgeLeftBank.railPoint,
      {
        x: bridgeLeftBank.railPoint.x,
        y: bridgeLeftBank.railPoint.y + 42
      }
    );
    const slightlyBelowRailDepth = resolveBridgeRailRelativeStageDepth(
      bridgeLeftBank.railPoint,
      {
        x: bridgeLeftBank.railPoint.x,
        y: bridgeLeftBank.railPoint.y + 20
      }
    );
    const cickaSettled = resolveBridgeStageSpot(BRIDGE_STAGE_SOURCE, 'cicka-settled');
    const cickaSettledDepth = resolveBridgeRailRelativeStageDepth(
      cickaSettled.railPoint,
      cickaSettled
    );

    expect(draftsperson).toMatchObject({
      x: 1275,
      y: 518,
      depthMode: 'rail-relative'
    });
    expect(draftsperson.depth).toBeLessThan(draftsperson.railPoint.cue.depth);

    expect(belowRailDepth).toBeGreaterThan(bridgeLeftBank.railPoint.cue.depth);
    expect(slightlyBelowRailDepth).toBeGreaterThan(bridgeLeftBank.railPoint.cue.depth);
    expect(cickaSettledDepth).toBeGreaterThan(cickaSettled.railPoint.cue.depth);

    expect(completedBridge).toMatchObject({
      depthMode: 'fixed',
      depth: 10
    });
  });

  it('can resolve route-state object placement without changing the source anchor', () => {
    const toyCarAtTestEnd = resolveBridgeStageObjectPlacement(
      BRIDGE_STAGE_SOURCE,
      'toy-car',
      { spotId: 'toy-car-test-end' }
    );

    expect(toyCarAtTestEnd).toMatchObject({
      x: 1985,
      y: 524,
      depthMode: 'rail-relative'
    });
    expect(resolveBridgeStageObject(BRIDGE_STAGE_SOURCE, 'toy-car').spotId).toBe('cicka-toy-car');
  });

  it('projects free world positions back onto the Walk Rail for resume and dev teleports', () => {
    const projected = projectPointToBridgeWalkRail(
      BRIDGE_STAGE_SOURCE.primaryWalkRail,
      { x: 1280, y: 560 }
    );

    expect(projected.progress).toBeCloseTo(0.48, 1);
    expect(getNearestBridgeStageSpotId(BRIDGE_STAGE_SOURCE, projected.progress)).toBe('draftsperson');
    expect(getBridgeWalkRailLength(BRIDGE_STAGE_SOURCE.primaryWalkRail)).toBeGreaterThan(2000);
  });

  it('tracks plate edits in placement signatures', () => {
    const baseline = getStageCompositionPlacementSignature(BRIDGE_STAGE_SOURCE);
    const draft = updateStageAuthoringDraft(
      BRIDGE_STAGE_SOURCE,
      { kind: 'plate', id: 'cornfield-ground' },
      'y',
      -580
    );

    expect(getStageCompositionPlacementSignature(draft)).not.toBe(baseline);
  });

  it('tracks spot offset edits in placement signatures without touching bridge crossing', () => {
    const baseline = getStageCompositionPlacementSignature(BRIDGE_STAGE_SOURCE);
    const draft = updateStageAuthoringDraft(
      BRIDGE_STAGE_SOURCE,
      { kind: 'spot', id: 'draftsperson' },
      'offset.y',
      -12
    );

    expect(getStageCompositionPlacementSignature(draft)).not.toBe(baseline);
    expect(getBridgeCrossingPlacementSignature(draft)).toBe(
      getBridgeCrossingPlacementSignature(BRIDGE_STAGE_SOURCE)
    );
  });
});
