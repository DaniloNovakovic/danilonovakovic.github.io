import type { InteriorInteractionTarget } from '@/game/sharedSceneRuntime/interactions/InteriorInteractionRuntime';
import type {
  RidgeBridgeBeatState,
  RidgeFirstPlayableRouteState
} from '@/game/bridge/store';
import type { BridgeDialogueLineId } from '../dialogue/bridgeDialogue';

export const BRIDGE_TRACER_WORLD = {
  bounds: {
    x: 0,
    y: 0,
    width: 2600,
    height: 600
  },
  floorY: 500,
  spawn: {
    x: 140,
    y: 452
  },
  cickaPlaySpot: {
    x: 650,
    y: 458
  },
  cickaSettledSpot: {
    x: 1850,
    y: 458
  },
  draftsperson: {
    x: 1295,
    y: 456
  },
  blueprint: {
    x: 1375,
    y: 430
  },
  bridge: {
    leftBankEndX: 1450,
    rightBankStartX: 1730,
    centerX: 1590,
    deckY: 500,
    deckWidth: 286
  },
  exit: {
    x: 2315,
    y: 456
  }
} as const;

export const BRIDGE_TRACER_INTERACT_RADIUS = 86;

export type BridgeTracerTargetId = 'cicka' | 'draftsperson' | 'concert-exit';

export type BridgeTracerEffect =
  | {
      kind: 'showDialogue';
      lineIds: BridgeDialogueLineId[];
      nextBeat?: RidgeBridgeBeatState;
    }
  | {
      kind: 'runToyCarTest';
      lineIds: BridgeDialogueLineId[];
    }
  | {
      kind: 'triggerConcertHandoff';
      lineIds: BridgeDialogueLineId[];
    };

export type BridgeTracerInteractionTarget = InteriorInteractionTarget<
  BridgeTracerTargetId,
  BridgeTracerEffect
> & {
  promptLineId: BridgeDialogueLineId;
};

export function isBridgeCrossingOpen(bridgeBeat: RidgeBridgeBeatState): boolean {
  return bridgeBeat === 'bridge_complete' || bridgeBeat === 'concert_handoff';
}

export function hasCickaSharedToyCar(bridgeBeat: RidgeBridgeBeatState): boolean {
  return (
    bridgeBeat === 'toy_car_shared' ||
    bridgeBeat === 'testing_bridge' ||
    isBridgeCrossingOpen(bridgeBeat)
  );
}

export function createBridgeTracerInteractionTargets(
  route: RidgeFirstPlayableRouteState
): BridgeTracerInteractionTarget[] {
  if (route.activeAreaId !== 'bridge') return [];

  const targets: BridgeTracerInteractionTarget[] = [];

  if (route.bridgeBeat === 'intro') {
    targets.push(createCickaFirstMeetTarget());
  }

  if (route.bridgeBeat === 'needs_toy_car') {
    targets.push(createCickaParallelPlayTarget());
  }

  if (route.bridgeBeat === 'intro' || route.bridgeBeat === 'needs_toy_car') {
    targets.push(createMissingSpanTarget(route.bridgeBeat));
  }

  if (route.bridgeBeat === 'toy_car_shared') {
    targets.push(createToyCarTestTarget());
  }

  if (route.bridgeBeat === 'bridge_complete') {
    targets.push(createConcertExitTarget());
  }

  return targets;
}

function createCickaFirstMeetTarget(): BridgeTracerInteractionTarget {
  return {
    id: 'cicka',
    kind: 'ridge-bridge-cicka',
    x: BRIDGE_TRACER_WORLD.cickaPlaySpot.x,
    distanceAnchorY: BRIDGE_TRACER_WORLD.cickaPlaySpot.y,
    interactRadius: BRIDGE_TRACER_INTERACT_RADIUS,
    prompt: {
      x: BRIDGE_TRACER_WORLD.cickaPlaySpot.x,
      y: BRIDGE_TRACER_WORLD.cickaPlaySpot.y - 116
    },
    promptLineId: 'bridge.cicka.first_meet.01',
    effect: {
      kind: 'showDialogue',
      lineIds: [
        'bridge.cicka.first_meet.01',
        'bridge.cicka.first_meet.02',
        'bridge.cicka.first_meet.03'
      ]
    }
  };
}

function createCickaParallelPlayTarget(): BridgeTracerInteractionTarget {
  return {
    id: 'cicka',
    kind: 'ridge-bridge-cicka',
    x: BRIDGE_TRACER_WORLD.cickaPlaySpot.x,
    distanceAnchorY: BRIDGE_TRACER_WORLD.cickaPlaySpot.y,
    interactRadius: BRIDGE_TRACER_INTERACT_RADIUS,
    prompt: {
      x: BRIDGE_TRACER_WORLD.cickaPlaySpot.x,
      y: BRIDGE_TRACER_WORLD.cickaPlaySpot.y - 116
    },
    promptLineId: 'bridge.cicka.parallel_play.01',
    effect: {
      kind: 'showDialogue',
      lineIds: [
        'bridge.cicka.parallel_play.01',
        'bridge.cicka.parallel_play.02',
        'bridge.cicka.parallel_play.03',
        'bridge.cicka.parallel_play.04'
      ],
      nextBeat: 'toy_car_shared'
    }
  };
}

function createMissingSpanTarget(
  bridgeBeat: Extract<RidgeBridgeBeatState, 'intro' | 'needs_toy_car'>
): BridgeTracerInteractionTarget {
  return {
    id: 'draftsperson',
    kind: 'ridge-bridge-draftsperson',
    x: BRIDGE_TRACER_WORLD.draftsperson.x,
    distanceAnchorY: BRIDGE_TRACER_WORLD.draftsperson.y,
    interactRadius: BRIDGE_TRACER_INTERACT_RADIUS,
    prompt: {
      x: BRIDGE_TRACER_WORLD.draftsperson.x,
      y: BRIDGE_TRACER_WORLD.draftsperson.y - 132
    },
    promptLineId: 'bridge.draftsperson.missing_span.03',
    effect: {
      kind: 'showDialogue',
      lineIds: [
        'bridge.draftsperson.missing_span.01',
        'bridge.draftsperson.missing_span.02',
        'bridge.draftsperson.missing_span.03'
      ],
      nextBeat: bridgeBeat === 'intro' ? 'needs_toy_car' : undefined
    }
  };
}

function createToyCarTestTarget(): BridgeTracerInteractionTarget {
  return {
    id: 'draftsperson',
    kind: 'ridge-bridge-draftsperson',
    x: BRIDGE_TRACER_WORLD.draftsperson.x,
    distanceAnchorY: BRIDGE_TRACER_WORLD.draftsperson.y,
    interactRadius: BRIDGE_TRACER_INTERACT_RADIUS,
    prompt: {
      x: BRIDGE_TRACER_WORLD.draftsperson.x,
      y: BRIDGE_TRACER_WORLD.draftsperson.y - 132
    },
    promptLineId: 'bridge.draftsperson.toy_car_test.01',
    effect: {
      kind: 'runToyCarTest',
      lineIds: [
        'bridge.draftsperson.toy_car_test.01',
        'bridge.draftsperson.toy_car_test.02',
        'bridge.draftsperson.toy_car_test.03',
        'bridge.draftsperson.toy_car_test.04'
      ]
    }
  };
}

function createConcertExitTarget(): BridgeTracerInteractionTarget {
  return {
    id: 'concert-exit',
    kind: 'ridge-bridge-exit',
    x: BRIDGE_TRACER_WORLD.exit.x,
    distanceAnchorY: BRIDGE_TRACER_WORLD.exit.y,
    interactRadius: 104,
    prompt: {
      x: BRIDGE_TRACER_WORLD.exit.x,
      y: BRIDGE_TRACER_WORLD.exit.y - 126
    },
    promptLineId: 'bridge.exit.opened_crossing.01',
    effect: {
      kind: 'triggerConcertHandoff',
      lineIds: [
        'bridge.exit.opened_crossing.01',
        'bridge.exit.opened_crossing.02',
        'bridge.exit.opened_crossing.03'
      ]
    }
  };
}
