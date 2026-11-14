// Bridge content resolvers encode beat-specific actor presence; branching is data policy.
// fallow-ignore-file complexity
import type { BridgeBuildTip } from '../bridgeBuilder';
import type {
  RidgeActorPresence,
  RidgeConversationDefinition,
  RidgeDialogueLine,
  RidgeEmotion,
  RidgeInteractable,
  RidgeStageDefinition,
  RidgeWorldState
} from '../types';
import { RIDGE_TOY_CAR_ITEM } from '../types';

/**
 * River banks on the progress line. The Blueprint Bridge puzzle gap (8 cells of
 * 36 world units) spans exactly this stretch of the 1440-unit walk line.
 */
export const BRIDGE_RIVER_PROGRESS = { left: 0.58, right: 0.78 } as const;

/** Just short of the near bank edge. */
const BRIDGE_BLOCKED_PROGRESS = 0.575;
/** Mirrors the session flag set once the drawing table has been opened. */
const BRIDGE_BUILD_STARTED_FLAG = 'bridge_build_started';

const BRIDGE_TIP_IDS: readonly BridgeBuildTip[] = [
  'intro',
  'drawing',
  'testing',
  'no_road',
  'self_weight',
  'car_weight',
  'stuck',
  'sketch_offer',
  'sketch_shown',
  'out_of_ink',
  'passed'
];

export interface BridgeDialogueCatalog {
  speakers: {
    prompt: string;
    cicka: string;
    bridgeDraftsperson: string;
  };
  lines: Record<string, string>;
}

const SPOTS = [
  {
    id: 'spawn',
    label: 'Nature entry',
    kind: 'landmark' as const,
    progress: 0.05,
    interactRadius: 0.06,
    description: 'A sunny hill edge opens onto the farm river page.'
  },
  {
    id: 'cicka',
    label: 'Cicka',
    kind: 'npc' as const,
    progress: 0.22,
    interactRadius: 0.08,
    actorId: 'cicka' as const,
    description: 'Cicka plays inside the corn with a tiny toy car.'
  },
  {
    id: 'cornfield-exit',
    label: 'Cornfield exit',
    kind: 'landmark' as const,
    progress: 0.38,
    interactRadius: 0.05,
    description: 'Corn thins. The river crossing comes into view.'
  },
  {
    id: 'draftsperson',
    label: 'Bridge Draftsperson',
    kind: 'npc' as const,
    progress: 0.55,
    interactRadius: 0.08,
    actorId: 'draftsperson' as const,
    description: 'A nervous draftsperson frets over a missing middle span.'
  },
  {
    id: 'bridge',
    label: 'Simple Bridge Crossing',
    kind: 'prop' as const,
    progress: 0.68,
    interactRadius: 0.06,
    description: 'The unfinished crossing. Blueprint ink waits for courage.'
  },
  {
    id: 'concert-exit',
    label: 'Concert exit',
    kind: 'exit' as const,
    progress: 0.9,
    interactRadius: 0.08,
    description: 'Evening music waits past the finished crossing.'
  }
] as const;

type BridgeSpotId = (typeof SPOTS)[number]['id'];

interface BridgeInteractPlan {
  spotId: BridgeSpotId;
  conversationId: string;
  prompt: string;
}

export function createBridgeStage(catalog: BridgeDialogueCatalog): RidgeStageDefinition {
  return {
    areaId: 'bridge',
    title: 'Bridge Area / Blueprint Bridge',
    lengthLabel: 'farm river sketch',
    spots: SPOTS,
    blockedProgress: BRIDGE_BLOCKED_PROGRESS,
    blockedMessage:
      'The unfinished bridge blocks the way. Talk to the draftsperson or finish the crossing.',
    isCrossingOpen: (state) => state.beat === 'bridge_complete',
    resolveInteractables: (state) => resolveBridgeInteractables(state, catalog),
    resolveActors: (state) => resolveBridgeActors(state),
    resolveConversation: (conversationId, state) =>
      resolveBridgeConversation(conversationId, state, catalog),
    describeAmbience: (state) => describeBridgeAmbience(state),
    describeBridgeTip: (tip) =>
      catalog.lines[`bridge.builder.tip.${BRIDGE_TIP_IDS.includes(tip) ? tip : 'drawing'}`] ?? tip
  };
}

function resolveBridgeInteractables(
  state: RidgeWorldState,
  catalog: BridgeDialogueCatalog
): RidgeInteractable[] {
  const plans = interactPlansForBeat(state.beat);
  const result: RidgeInteractable[] = [];

  for (const plan of plans) {
    const spot = SPOTS.find((candidate) => candidate.id === plan.spotId);
    if (!spot) continue;
    const distance = Math.abs(state.progress - spot.progress);
    if (distance > spot.interactRadius) continue;

    result.push({
      spotId: spot.id,
      label: spot.label,
      kind: spot.kind,
      distance,
      prompt: catalog.lines[plan.prompt] ?? plan.prompt,
      conversationId: plan.conversationId,
      progress: spot.progress,
      actorId: 'actorId' in spot ? spot.actorId : undefined
    });
  }

  return result;
}

function interactPlansForBeat(beat: RidgeWorldState['beat']): BridgeInteractPlan[] {
  switch (beat) {
    case 'intro':
      return [
        {
          spotId: 'cicka',
          conversationId: 'bridge.cicka.first_meet',
          prompt: 'bridge.cicka.first_meet.prompt'
        },
        {
          spotId: 'draftsperson',
          conversationId: 'bridge.draftsperson.missing_span',
          prompt: 'bridge.draftsperson.missing_span.prompt'
        }
      ];
    case 'needs_toy_car':
      return [
        {
          spotId: 'cicka',
          conversationId: 'bridge.cicka.parallel_play',
          prompt: 'bridge.cicka.parallel_play.prompt'
        },
        {
          spotId: 'draftsperson',
          conversationId: 'bridge.draftsperson.missing_span',
          prompt: 'bridge.draftsperson.missing_span.prompt'
        }
      ];
    case 'toy_car_shared':
      return [
        {
          spotId: 'draftsperson',
          conversationId: 'bridge.draftsperson.toy_car_test',
          prompt: 'bridge.draftsperson.toy_car_test.prompt'
        }
      ];
    case 'bridge_complete':
      return [
        {
          spotId: 'concert-exit',
          conversationId: 'bridge.exit.opened_crossing',
          prompt: 'bridge.exit.opened_crossing.prompt'
        }
      ];
    default:
      return [];
  }
}

function resolveBridgeActors(state: RidgeWorldState): RidgeActorPresence[] {
  const crossingOpen = state.beat === 'bridge_complete';
  // After the test Cicka settles on the far bank beside the car that proved it.
  const cickaProgress = crossingOpen ? 0.8 : 0.22;
  const toyCarProgress =
    state.beat === 'toy_car_shared' ? state.progress : crossingOpen ? 0.825 : 0.24;
  // While drawing, the workbench owns the toy car (it drives the test run).
  const building = state.mode === 'bridgeBuild';

  return [
    {
      id: 'player',
      label: 'You',
      progress: state.progress,
      visible: true,
      facing: state.facing
    },
    {
      id: 'cicka',
      label: 'Cicka',
      progress: cickaProgress,
      visible: true,
      facing: 'right'
    },
    {
      id: 'draftsperson',
      label: 'Bridge Draftsperson',
      progress: 0.55,
      visible: true,
      facing: 'left'
    },
    {
      id: 'toy-car',
      label: 'Toy car',
      progress: toyCarProgress,
      visible:
        !building &&
        (state.beat === 'intro' ||
          state.beat === 'needs_toy_car' ||
          state.inventory.includes(RIDGE_TOY_CAR_ITEM) ||
          crossingOpen),
      facing: 'right'
    }
  ];
}

function resolveBridgeConversation(
  conversationId: string,
  state: RidgeWorldState,
  catalog: BridgeDialogueCatalog
): RidgeConversationDefinition | null {
  const line = (
    id: string,
    speakerId: keyof BridgeDialogueCatalog['speakers'],
    emotion?: RidgeEmotion
  ) => makeLine(catalog, id, speakerId, emotion);

  switch (conversationId) {
    case 'bridge.cicka.first_meet':
      return {
        id: conversationId,
        lines: [
          line('bridge.cicka.first_meet.01', 'prompt'),
          line('bridge.cicka.first_meet.02', 'cicka'),
          line('bridge.cicka.first_meet.03', 'prompt')
        ],
        choices: [
          {
            id: 'pet',
            label: 'Pet Cicka gently',
            lines: [
              {
                id: 'bridge.cicka.first_meet.choice.pet',
                speakerId: 'cicka',
                speaker: catalog.speakers.cicka,
                text: 'mrrp.'
              }
            ]
          },
          {
            id: 'watch',
            label: 'Just watch the tiny car',
            lines: [
              {
                id: 'bridge.cicka.first_meet.choice.watch',
                speakerId: 'prompt',
                speaker: catalog.speakers.prompt,
                text: 'The toy car makes another brave loop through the corn.'
              }
            ]
          }
        ]
      };
    case 'bridge.draftsperson.missing_span':
      return {
        id: conversationId,
        lines: [
          line('bridge.draftsperson.missing_span.01', 'bridgeDraftsperson'),
          line('bridge.draftsperson.missing_span.02', 'bridgeDraftsperson'),
          line('bridge.draftsperson.missing_span.03', 'prompt')
        ],
        outcome: {
          setBeat: state.beat === 'intro' ? 'needs_toy_car' : undefined
        }
      };
    case 'bridge.cicka.parallel_play':
      return {
        id: conversationId,
        lines: [
          line('bridge.cicka.parallel_play.01', 'prompt'),
          line('bridge.cicka.parallel_play.02', 'prompt'),
          line('bridge.cicka.parallel_play.03', 'cicka'),
          line('bridge.cicka.parallel_play.04', 'prompt')
        ],
        outcome: {
          setBeat: 'toy_car_shared',
          addItem: RIDGE_TOY_CAR_ITEM,
          setFlag: 'toy_car_shared'
        }
      };
    case 'bridge.draftsperson.toy_car_test':
      // Coming back to an unfinished drawing skips straight to the table.
      if (state.flags.has(BRIDGE_BUILD_STARTED_FLAG)) {
        return {
          id: conversationId,
          lines: [line('bridge.draftsperson.toy_car_test.resume', 'bridgeDraftsperson', 'determined')],
          outcome: { openBridgeBuild: true }
        };
      }
      return {
        id: conversationId,
        lines: [
          line('bridge.draftsperson.toy_car_test.01', 'prompt'),
          line('bridge.draftsperson.toy_car_test.02', 'bridgeDraftsperson', 'thoughtful'),
          line('bridge.draftsperson.toy_car_test.03', 'bridgeDraftsperson', 'curious'),
          line('bridge.draftsperson.toy_car_test.04', 'prompt')
        ],
        outcome: { openBridgeBuild: true }
      };
    case 'bridge.draftsperson.bridge_built':
      return {
        id: conversationId,
        lines: [
          line('bridge.draftsperson.bridge_built.01', 'prompt'),
          line('bridge.draftsperson.bridge_built.02', 'bridgeDraftsperson', 'surprised'),
          line('bridge.draftsperson.bridge_built.03', 'bridgeDraftsperson', 'playful'),
          line('bridge.draftsperson.bridge_built.04', 'prompt')
        ]
      };
    case 'bridge.exit.opened_crossing':
      return {
        id: conversationId,
        lines: [
          line('bridge.exit.opened_crossing.01', 'prompt'),
          line('bridge.exit.opened_crossing.02', 'bridgeDraftsperson'),
          line('bridge.exit.opened_crossing.03', 'prompt')
        ],
        outcome: {
          handoffToArea: 'concert'
        }
      };
    default:
      return null;
  }
}

function makeLine(
  catalog: BridgeDialogueCatalog,
  id: string,
  speakerId: keyof BridgeDialogueCatalog['speakers'],
  emotion?: RidgeEmotion
): RidgeDialogueLine {
  return {
    id,
    speakerId,
    speaker: catalog.speakers[speakerId],
    text: catalog.lines[id] ?? id,
    ...(emotion ? { emotion } : {})
  };
}

function describeBridgeAmbience(state: RidgeWorldState): string {
  if (state.beat === 'bridge_complete') {
    return 'Ink settles into a real crossing. The concert exit is open to the east.';
  }
  if (state.mode === 'bridgeBuild') {
    return 'The blueprint table is unrolled across the gap. Bolts wait on both banks.';
  }
  if (state.beat === 'toy_car_shared') {
    return 'You carry the tiny test car. The draftsperson waits by the blueprint.';
  }
  if (state.beat === 'needs_toy_car') {
    return 'The middle span is still brave only on paper. Cicka has the missing test car.';
  }
  if (state.progress < 0.3) {
    return 'Sunny corn and river breeze. A small cat plays with something wheeled.';
  }
  return 'A farm river lowland. An unfinished simple bridge interrupts the walk east.';
}

