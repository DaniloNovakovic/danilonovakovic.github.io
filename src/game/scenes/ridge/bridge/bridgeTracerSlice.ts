import type { InteriorInteractionTarget } from '@/game/sharedSceneRuntime/interactions/InteriorInteractionRuntime';
import type {
  RidgeBridgeAreaBeatState,
  RidgeFirstPlayableRouteState
} from '@/game/bridge/store';
import type { BridgeDialogueLineId } from '../dialogue/bridgeDialogue';
import {
  BRIDGE_STAGE_DEFAULT_INTERACT_RADIUS,
  BRIDGE_STAGE_SOURCE,
  resolveBridgeStageSpot,
  type BridgeStageCompositionSource,
  type BridgeStageSpotId
} from './stageComposition';

export { hasCickaSharedToyCar, isBridgeCrossingOpen } from './stageComposition';

const spawnSpot = resolveBridgeStageSpot(BRIDGE_STAGE_SOURCE, 'spawn');
const cickaPlaySpot = resolveBridgeStageSpot(BRIDGE_STAGE_SOURCE, 'cicka-play');
const cickaSettledSpot = resolveBridgeStageSpot(BRIDGE_STAGE_SOURCE, 'cicka-settled');
const draftspersonSpot = resolveBridgeStageSpot(BRIDGE_STAGE_SOURCE, 'draftsperson');
const blueprintSpot = resolveBridgeStageSpot(BRIDGE_STAGE_SOURCE, 'blueprint');
const bridgeLeftBankSpot = resolveBridgeStageSpot(BRIDGE_STAGE_SOURCE, 'bridge-left-bank');
const exitSpot = resolveBridgeStageSpot(BRIDGE_STAGE_SOURCE, 'concert-exit');

export const BRIDGE_TRACER_WORLD = {
  bounds: BRIDGE_STAGE_SOURCE.canvas,
  floorY: bridgeLeftBankSpot.y,
  spawn: {
    x: spawnSpot.x,
    y: spawnSpot.y
  },
  cickaPlaySpot: {
    x: cickaPlaySpot.x,
    y: cickaPlaySpot.y
  },
  cickaSettledSpot: {
    x: cickaSettledSpot.x,
    y: cickaSettledSpot.y
  },
  draftsperson: {
    x: draftspersonSpot.x,
    y: draftspersonSpot.y
  },
  blueprint: {
    x: blueprintSpot.x,
    y: blueprintSpot.y
  },
  exit: {
    x: exitSpot.x,
    y: exitSpot.y
  }
} as const;

export const BRIDGE_TRACER_INTERACT_RADIUS = BRIDGE_STAGE_DEFAULT_INTERACT_RADIUS;

export type BridgeTracerTargetId = 'cicka' | 'draftsperson' | 'concert-exit';

export type BridgeTracerEffect =
  | {
      kind: 'showDialogue';
      lineIds: BridgeDialogueLineId[];
      nextBeat?: RidgeBridgeAreaBeatState;
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

type BridgeTracerTargetFactory = (
  source: BridgeStageCompositionSource
) => BridgeTracerInteractionTarget;

export function createBridgeTracerInteractionTargets(
  route: RidgeFirstPlayableRouteState,
  source: BridgeStageCompositionSource = BRIDGE_STAGE_SOURCE
): BridgeTracerInteractionTarget[] {
  if (route.activeAreaId !== 'bridge') return [];
  return BRIDGE_TARGETS_BY_BEAT[route.bridgeBeat].map((createTarget) => createTarget(source));
}

const BRIDGE_TARGETS_BY_BEAT = {
  intro: [
    createCickaFirstMeetTarget,
    createIntroMissingSpanTarget
  ],
  needs_toy_car: [
    createCickaParallelPlayTarget,
    createNeedsToyCarMissingSpanTarget
  ],
  toy_car_shared: [createToyCarTestTarget],
  bridge_complete: [createConcertExitTarget]
} satisfies Record<RidgeBridgeAreaBeatState, readonly BridgeTracerTargetFactory[]>;

function createCickaFirstMeetTarget(source: BridgeStageCompositionSource): BridgeTracerInteractionTarget {
  return createSpotTarget(source, {
    id: 'cicka',
    kind: 'ridge-bridge-cicka',
    spotId: 'cicka-play',
    promptLineId: 'bridge.cicka.first_meet.01',
    effect: {
      kind: 'showDialogue',
      lineIds: [
        'bridge.cicka.first_meet.01',
        'bridge.cicka.first_meet.02',
        'bridge.cicka.first_meet.03'
      ]
    }
  });
}

function createCickaParallelPlayTarget(source: BridgeStageCompositionSource): BridgeTracerInteractionTarget {
  return createSpotTarget(source, {
    id: 'cicka',
    kind: 'ridge-bridge-cicka',
    spotId: 'cicka-play',
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
  });
}

function createIntroMissingSpanTarget(source: BridgeStageCompositionSource): BridgeTracerInteractionTarget {
  return createMissingSpanTarget(source, 'intro');
}

function createNeedsToyCarMissingSpanTarget(source: BridgeStageCompositionSource): BridgeTracerInteractionTarget {
  return createMissingSpanTarget(source, 'needs_toy_car');
}

function createMissingSpanTarget(
  source: BridgeStageCompositionSource,
  bridgeBeat: Extract<RidgeBridgeAreaBeatState, 'intro' | 'needs_toy_car'>
): BridgeTracerInteractionTarget {
  return createSpotTarget(source, {
    id: 'draftsperson',
    kind: 'ridge-bridge-draftsperson',
    spotId: 'draftsperson',
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
  });
}

function createToyCarTestTarget(source: BridgeStageCompositionSource): BridgeTracerInteractionTarget {
  return createSpotTarget(source, {
    id: 'draftsperson',
    kind: 'ridge-bridge-draftsperson',
    spotId: 'draftsperson',
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
  });
}

function createConcertExitTarget(source: BridgeStageCompositionSource): BridgeTracerInteractionTarget {
  return createSpotTarget(source, {
    id: 'concert-exit',
    kind: 'ridge-bridge-exit',
    spotId: 'concert-exit',
    promptLineId: 'bridge.exit.opened_crossing.01',
    effect: {
      kind: 'triggerConcertHandoff',
      lineIds: [
        'bridge.exit.opened_crossing.01',
        'bridge.exit.opened_crossing.02',
        'bridge.exit.opened_crossing.03'
      ]
    }
  });
}

function createSpotTarget(
  source: BridgeStageCompositionSource,
  options: {
    id: BridgeTracerTargetId;
    kind: string;
    spotId: BridgeStageSpotId;
    promptLineId: BridgeDialogueLineId;
    effect: BridgeTracerEffect;
  }
): BridgeTracerInteractionTarget {
  const spot = resolveBridgeStageSpot(source, options.spotId);
  return {
    id: options.id,
    kind: options.kind,
    x: spot.x,
    distanceAnchorY: spot.y,
    interactRadius: spot.interactRadius ?? BRIDGE_TRACER_INTERACT_RADIUS,
    prompt: spot.prompt,
    promptLineId: options.promptLineId,
    effect: options.effect
  };
}
