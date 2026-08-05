// Bridge content resolvers encode beat-specific actor presence; branching is data policy.
// fallow-ignore-file complexity
import type {
  RidgeActorPresence,
  RidgeConversationDefinition,
  RidgeDialogueLine,
  RidgeInteractable,
  RidgeStageDefinition,
  RidgeWorldState
} from '../types';
import { RIDGE_TOY_CAR_ITEM } from '../types';

const BRIDGE_BLOCKED_PROGRESS = 0.62;

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
    progress: 0.62,
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
    describeAmbience: (state) => describeBridgeAmbience(state)
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
      conversationId: plan.conversationId
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
  const cickaProgress = crossingOpen ? 0.68 : 0.22;
  const toyCarProgress =
    state.beat === 'toy_car_shared' ? state.progress : crossingOpen ? 0.7 : 0.24;

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
        state.beat === 'intro' ||
        state.beat === 'needs_toy_car' ||
        state.inventory.includes(RIDGE_TOY_CAR_ITEM) ||
        crossingOpen,
      facing: 'right'
    }
  ];
}

function resolveBridgeConversation(
  conversationId: string,
  state: RidgeWorldState,
  catalog: BridgeDialogueCatalog
): RidgeConversationDefinition | null {
  const line = (id: string, speakerId: keyof BridgeDialogueCatalog['speakers']) =>
    makeLine(catalog, id, speakerId);

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
      return {
        id: conversationId,
        lines: [
          line('bridge.draftsperson.toy_car_test.01', 'prompt'),
          line('bridge.draftsperson.toy_car_test.02', 'bridgeDraftsperson'),
          line('bridge.draftsperson.toy_car_test.03', 'prompt'),
          line('bridge.draftsperson.toy_car_test.04', 'bridgeDraftsperson')
        ],
        outcome: {
          setBeat: 'bridge_complete',
          clearFlag: 'toy_car_shared'
        }
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
  speakerId: keyof BridgeDialogueCatalog['speakers']
): RidgeDialogueLine {
  return {
    id,
    speakerId,
    speaker: catalog.speakers[speakerId],
    text: catalog.lines[id] ?? id
  };
}

function describeBridgeAmbience(state: RidgeWorldState): string {
  if (state.beat === 'bridge_complete') {
    return 'Ink settles into a real crossing. The concert exit is open to the east.';
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

