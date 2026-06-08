import { describe, expect, it } from 'vitest';
import type { RidgeBridgeBeatState, RidgeFirstPlayableRouteState } from '@/game/bridge/store';
import {
  createBridgeTracerInteractionTargets,
  hasCickaSharedToyCar,
  isBridgeCrossingOpen
} from './bridgeTracerSlice';
import { BRIDGE_STAGE_SOURCE, resolveBridgeStageSpot } from './stageComposition';

function route(bridgeBeat: RidgeBridgeBeatState): RidgeFirstPlayableRouteState {
  if (bridgeBeat === 'concert_handoff') {
    return {
      activeAreaId: 'concert',
      bridgeBeat
    };
  }

  return {
    activeAreaId: 'bridge',
    bridgeBeat
  };
}

describe('Bridge Tracer Slice route targets', () => {
  it('starts with Cicka first-meet and missing-span targets', () => {
    const targets = createBridgeTracerInteractionTargets(route('intro'));

    expect(targets.map((target) => target.id)).toEqual(['cicka', 'draftsperson']);
    expect(targets[0]?.promptLineId).toBe('bridge.cicka.first_meet.01');
    expect(targets[1]?.effect).toMatchObject({
      kind: 'showDialogue',
      nextBeat: 'needs_toy_car'
    });
  });

  it('switches Cicka to parallel play after the draftsperson names the missing car', () => {
    const targets = createBridgeTracerInteractionTargets(route('needs_toy_car'));
    const cicka = targets.find((target) => target.id === 'cicka');

    expect(cicka?.promptLineId).toBe('bridge.cicka.parallel_play.01');
    expect(cicka?.effect).toMatchObject({
      kind: 'showDialogue',
      nextBeat: 'toy_car_shared',
      lineIds: expect.arrayContaining(['bridge.cicka.parallel_play.04'])
    });
  });

  it('enables the toy-car bridge test after Cicka shares the prop', () => {
    const targets = createBridgeTracerInteractionTargets(route('toy_car_shared'));

    expect(targets).toHaveLength(1);
    expect(targets[0]).toMatchObject({
      id: 'draftsperson',
      promptLineId: 'bridge.draftsperson.toy_car_test.01',
      effect: {
        kind: 'runToyCarTest'
      }
    });
  });

  it('enables only the opened crossing exit after the bridge is complete', () => {
    const targets = createBridgeTracerInteractionTargets(route('bridge_complete'));

    expect(targets).toHaveLength(1);
    expect(targets[0]).toMatchObject({
      id: 'concert-exit',
      promptLineId: 'bridge.exit.opened_crossing.01',
      effect: {
        kind: 'triggerConcertHandoff'
      }
    });
  });

  it('stops Bridge interactions once the Concert handoff is recorded', () => {
    expect(createBridgeTracerInteractionTargets(route('concert_handoff'))).toEqual([]);
  });

  it('derives visible world-change helpers from the route state', () => {
    expect(isBridgeCrossingOpen('intro')).toBe(false);
    expect(isBridgeCrossingOpen('bridge_complete')).toBe(true);
    expect(hasCickaSharedToyCar('needs_toy_car')).toBe(false);
    expect(hasCickaSharedToyCar('toy_car_shared')).toBe(true);
  });

  it('resolves interaction anchors from Bridge Stage Spots', () => {
    const targets = createBridgeTracerInteractionTargets(route('intro'));
    const cickaSpot = resolveBridgeStageSpot(BRIDGE_STAGE_SOURCE, 'cicka-play');
    const draftspersonSpot = resolveBridgeStageSpot(BRIDGE_STAGE_SOURCE, 'draftsperson');

    expect(targets[0]).toMatchObject({
      x: cickaSpot.x,
      distanceAnchorY: cickaSpot.y,
      prompt: cickaSpot.prompt
    });
    expect(targets[1]).toMatchObject({
      x: draftspersonSpot.x,
      distanceAnchorY: draftspersonSpot.y,
      prompt: draftspersonSpot.prompt
    });
  });

  it('resolves interaction anchors from an authored composition source', () => {
    const draft = structuredClone(BRIDGE_STAGE_SOURCE) as typeof BRIDGE_STAGE_SOURCE;
    const draftsperson = draft.spots.find((spot) => spot.id === 'draftsperson');
    if (draftsperson) {
      draftsperson.offset = { x: 42, y: -18 };
    }

    const targets = createBridgeTracerInteractionTargets(route('intro'), draft);
    const draftspersonSpot = resolveBridgeStageSpot(draft, 'draftsperson');

    expect(targets[1]).toMatchObject({
      x: draftspersonSpot.x,
      distanceAnchorY: draftspersonSpot.y
    });
  });
});
