// Dance Festival branching is route policy encoded as content.
// fallow-ignore-file complexity
import type {
  RidgeActorPresence,
  RidgeConversationDefinition,
  RidgeInteractable,
  RidgeStageDefinition,
  RidgeWorldState
} from '../types';
import { collectNearbyFromPlans, makeCatalogLine } from './dialogueHelpers';

const DANCE_BLOCKED_PROGRESS = 0.68;
const FLAG_OPS = 'ops_ready';
const FLAG_DRIVER = 'driver_ready';

export interface DanceDialogueCatalog {
  speakers: {
    prompt: string;
    cicka: string;
    traveler: string;
    hillShuttleDriver: string;
    operationsHelper: string;
    danceTeacher: string;
    festivalSteward: string;
  };
  lines: Record<string, string>;
}

/**
 * Spread plaza cast left→right so silhouettes and prompts stay readable.
 * Soft wall / service gate sits at ~0.68; shuttle beyond after clearance.
 */
const SPOTS = [
  {
    id: 'entry',
    label: 'Plaza entry',
    kind: 'landmark' as const,
    progress: 0.05,
    interactRadius: 0.05,
    description: 'Daytime setup for a night dance that has not begun.'
  },
  {
    id: 'traveler',
    label: 'Traveler',
    kind: 'npc' as const,
    progress: 0.14,
    interactRadius: 0.08,
    actorId: 'traveler' as const,
    description: 'Someone asking the same question you are: how to reach Relay.'
  },
  {
    id: 'driver',
    label: 'Hill-Shuttle Driver',
    kind: 'npc' as const,
    progress: 0.28,
    interactRadius: 0.09,
    actorId: 'driver' as const,
    description: 'Stuck on a route clipboard beside the shuttle sign.'
  },
  {
    id: 'teacher',
    label: 'Dance Teacher',
    kind: 'npc' as const,
    progress: 0.4,
    interactRadius: 0.09,
    actorId: 'dance-teacher' as const,
    description: 'Keeps watch without forcing anyone onto the floor.'
  },
  {
    id: 'cicka',
    label: 'Cicka',
    kind: 'npc' as const,
    progress: 0.48,
    interactRadius: 0.07,
    actorId: 'cicka' as const,
    description: 'Loafs near the operations table like a soft paperweight.'
  },
  {
    id: 'operations',
    label: 'Last-Stop Operations Helper',
    kind: 'npc' as const,
    progress: 0.56,
    interactRadius: 0.09,
    actorId: 'operations-helper' as const,
    description: 'Perfecting lanterns and chair stacks near the dance floor edge.'
  },
  {
    id: 'steward',
    label: 'Festival Steward',
    kind: 'npc' as const,
    progress: 0.64,
    interactRadius: 0.08,
    actorId: 'steward' as const,
    description: 'Holds the service-gate key until setup is safe.'
  },
  {
    id: 'gate',
    label: 'Service gate',
    kind: 'prop' as const,
    progress: 0.68,
    interactRadius: 0.1,
    description: 'Festival barriers and cable tape block the hill road.'
  },
  {
    id: 'shuttle',
    label: 'Last daylight shuttle',
    kind: 'exit' as const,
    progress: 0.9,
    interactRadius: 0.1,
    actorId: 'shuttle' as const,
    description: 'The threshold ride to Relay under warming sky.'
  }
] as const;

export function createDanceStage(catalog: DanceDialogueCatalog): RidgeStageDefinition {
  return {
    areaId: 'danceFestival',
    title: 'Dance Festival / Opening Dance Shuttle',
    lengthLabel: 'Last-Stop Plaza',
    spots: SPOTS,
    blockedProgress: DANCE_BLOCKED_PROGRESS,
    blockedMessage: (state) => describeDanceBlock(state),
    isCrossingOpen: (state) => state.beat === 'dance_cleared',
    resolveInteractables: (state) => resolveDanceInteractables(state, catalog),
    resolveActors: (state) => resolveDanceActors(state),
    resolveConversation: (conversationId, state) =>
      resolveDanceConversation(conversationId, state, catalog),
    describeAmbience: (state) => describeDanceAmbience(state)
  };
}

function bothReady(state: RidgeWorldState): boolean {
  return state.flags.has(FLAG_OPS) && state.flags.has(FLAG_DRIVER);
}

function describeDanceBlock(state: RidgeWorldState): string {
  if (state.beat === 'dance_ready' || bothReady(state)) {
    return 'Service gate is ready. Press interact on the gate to clear the last setup.';
  }
  if (state.flags.has(FLAG_OPS) && !state.flags.has(FLAG_DRIVER)) {
    return 'Operations is ready. Ask the Dance Teacher for one private practice step.';
  }
  if (state.flags.has(FLAG_DRIVER) && !state.flags.has(FLAG_OPS)) {
    return 'The driver has one step. Help the Operations Helper finish her handoff check.';
  }
  return 'Service road closed for festival setup. Help Operations and the Dance Teacher first.';
}

function resolveDanceInteractables(
  state: RidgeWorldState,
  catalog: DanceDialogueCatalog
): RidgeInteractable[] {
  const plans: { spotId: string; conversationId: string; prompt: string }[] = [];
  const line = (key: string) => catalog.lines[key] ?? key;

  if (state.beat === 'dance_arrival' || state.beat === 'dance_ready') {
    plans.push({
      spotId: 'traveler',
      conversationId: 'dance.traveler.relay_wayfinding',
      prompt: 'dance.traveler.relay_wayfinding.prompt'
    });
    plans.push({
      spotId: 'steward',
      conversationId: 'dance.locals.triangulated_read',
      prompt: 'dance.locals.triangulated_read.prompt'
    });
    plans.push({
      spotId: 'teacher',
      conversationId: 'dance.driver.one_step_practice',
      prompt: 'dance.driver.one_step_practice.prompt'
    });
    plans.push({
      spotId: 'operations',
      conversationId: 'dance.operations_helper.handoff_check',
      prompt: 'dance.operations_helper.handoff_check.prompt'
    });
    plans.push({
      spotId: 'driver',
      conversationId: bothReady(state)
        ? 'dance.driver.folded_song_request'
        : 'dance.driver.shuttle_delay',
      prompt: bothReady(state)
        ? 'dance.driver.folded_song_request.prompt'
        : 'dance.driver.shuttle_delay.prompt'
    });
    plans.push({
      spotId: 'cicka',
      conversationId: 'dance.cicka.resting_spot',
      prompt: 'dance.cicka.resting_spot.prompt'
    });
  }

  if (state.beat === 'dance_ready' || bothReady(state)) {
    plans.push({
      spotId: 'gate',
      conversationId: 'dance.setup_clearance',
      prompt: 'dance.setup_clearance.prompt'
    });
  }

  if (state.beat === 'dance_cleared') {
    plans.push({
      spotId: 'shuttle',
      conversationId: 'dance.shuttle.last_daylight_ride',
      prompt: 'dance.shuttle.last_daylight_ride.prompt'
    });
    plans.push({
      spotId: 'cicka',
      conversationId: 'dance.cicka.resting_spot',
      prompt: 'dance.cicka.resting_spot.02'
    });
  }

  return collectNearbyFromPlans(state.progress, SPOTS, plans, line);
}

function resolveDanceActors(state: RidgeWorldState): RidgeActorPresence[] {
  const cleared = state.beat === 'dance_cleared';
  return [
    {
      id: 'player',
      label: 'You',
      progress: state.progress,
      visible: true,
      facing: state.facing
    },
    {
      id: 'traveler',
      label: 'Traveler',
      progress: 0.14,
      visible: !cleared,
      facing: 'right'
    },
    {
      id: 'driver',
      label: 'Driver',
      progress: cleared ? 0.88 : 0.28,
      visible: true,
      facing: cleared ? 'right' : 'left'
    },
    {
      id: 'dance-teacher',
      label: 'Teacher',
      progress: 0.4,
      visible: true,
      facing: 'right'
    },
    {
      id: 'cicka',
      label: 'Cicka',
      progress: cleared ? 0.72 : 0.48,
      visible: true,
      facing: 'right'
    },
    {
      id: 'operations-helper',
      label: 'Operations',
      progress: cleared ? 0.74 : 0.56,
      visible: true,
      facing: 'left'
    },
    {
      id: 'steward',
      label: 'Steward',
      progress: cleared ? 0.7 : 0.64,
      visible: true,
      facing: 'left'
    },
    {
      id: 'counterpart-cat',
      label: 'Quiet cat',
      progress: 0.76,
      visible: cleared,
      facing: 'left'
    },
    {
      id: 'shuttle',
      label: 'Shuttle',
      progress: 0.9,
      visible: true,
      facing: 'right'
    }
  ];
}

function resolveDanceConversation(
  conversationId: string,
  state: RidgeWorldState,
  catalog: DanceDialogueCatalog
): RidgeConversationDefinition | null {
  const line = (id: string, speakerId: keyof DanceDialogueCatalog['speakers']) =>
    makeCatalogLine(catalog, id, speakerId);

  switch (conversationId) {
    case 'dance.traveler.relay_wayfinding':
      return {
        id: conversationId,
        lines: [
          line('dance.traveler.relay_wayfinding.01', 'traveler'),
          line('dance.traveler.relay_wayfinding.02', 'traveler'),
          line('dance.traveler.relay_wayfinding.03', 'prompt')
        ]
      };
    case 'dance.driver.shuttle_delay':
      return {
        id: conversationId,
        lines: [
          line('dance.driver.shuttle_delay.01', 'hillShuttleDriver'),
          line('dance.driver.shuttle_delay.02', 'hillShuttleDriver'),
          line('dance.driver.shuttle_delay.03', 'prompt')
        ],
        choices: state.flags.has(FLAG_DRIVER)
          ? undefined
          : [
              {
                id: 'offer-help',
                label: 'Find the Dance Teacher for him',
                lines: [
                  line('dance.driver.shuttle_delay.choice.help', 'hillShuttleDriver'),
                  line('dance.driver.shuttle_delay.choice.help_hint', 'prompt')
                ]
              },
              {
                id: 'wait',
                label: 'Ask around the plaza first',
                lines: [line('dance.driver.shuttle_delay.choice.wait', 'prompt')]
              }
            ]
      };
    case 'dance.operations_helper.handoff_check':
      return {
        id: conversationId,
        lines: state.flags.has(FLAG_OPS)
          ? [
              line('dance.operations_helper.handoff_check.done.01', 'operationsHelper'),
              line('dance.operations_helper.handoff_check.done.02', 'prompt')
            ]
          : [
              line('dance.operations_helper.handoff_check.01', 'operationsHelper'),
              line('dance.operations_helper.handoff_check.02', 'operationsHelper'),
              line('dance.operations_helper.handoff_check.03', 'prompt')
            ],
        outcome: state.flags.has(FLAG_OPS)
          ? undefined
          : {
              setFlag: FLAG_OPS,
              setBeat: state.flags.has(FLAG_DRIVER) ? 'dance_ready' : undefined
            }
      };
    case 'dance.locals.triangulated_read':
      return {
        id: conversationId,
        lines: [
          line('dance.locals.triangulated_read.01', 'festivalSteward'),
          line('dance.locals.triangulated_read.02', 'festivalSteward'),
          line('dance.locals.triangulated_read.03', 'danceTeacher')
        ]
      };
    case 'dance.driver.one_step_practice':
      return {
        id: conversationId,
        lines: state.flags.has(FLAG_DRIVER)
          ? [
              line('dance.driver.one_step_practice.done.01', 'danceTeacher'),
              line('dance.driver.one_step_practice.done.02', 'prompt')
            ]
          : [
              line('dance.driver.one_step_practice.01', 'danceTeacher'),
              line('dance.driver.one_step_practice.02', 'prompt'),
              line('dance.driver.one_step_practice.03', 'hillShuttleDriver')
            ],
        outcome: state.flags.has(FLAG_DRIVER)
          ? undefined
          : {
              setFlag: FLAG_DRIVER,
              setBeat: state.flags.has(FLAG_OPS) ? 'dance_ready' : undefined
            }
      };
    case 'dance.driver.folded_song_request':
      return {
        id: conversationId,
        lines: [
          line('dance.driver.folded_song_request.01', 'hillShuttleDriver'),
          line('dance.driver.folded_song_request.02', 'prompt'),
          line('dance.driver.folded_song_request.03', 'operationsHelper'),
          line('dance.driver.folded_song_request.04', 'prompt')
        ],
        outcome: { setBeat: 'dance_ready', setFlag: 'song_folded' }
      };
    case 'dance.setup_clearance':
      return {
        id: conversationId,
        lines: [
          line('dance.setup_clearance.01', 'prompt'),
          line('dance.setup_clearance.02', 'prompt'),
          line('dance.setup_clearance.03', 'prompt'),
          line('dance.setup_clearance.04', 'festivalSteward'),
          line('dance.setup_clearance.05', 'prompt')
        ],
        outcome: { setBeat: 'dance_cleared' }
      };
    case 'dance.shuttle.last_daylight_ride':
      return {
        id: conversationId,
        lines: [
          line('dance.shuttle.last_daylight_ride.01', 'hillShuttleDriver'),
          line('dance.shuttle.last_daylight_ride.02', 'prompt'),
          line('dance.shuttle.last_daylight_ride.03', 'prompt')
        ],
        outcome: { handoffToArea: 'relay' }
      };
    case 'dance.cicka.resting_spot':
      return {
        id: conversationId,
        lines:
          state.beat === 'dance_cleared'
            ? [
                line('dance.cicka.resting_spot.02', 'prompt'),
                line('dance.cicka.resting_spot.03', 'cicka')
              ]
            : [
                line('dance.cicka.resting_spot.01', 'prompt'),
                line('dance.cicka.resting_spot.03', 'cicka')
              ]
      };
    default:
      return null;
  }
}

function describeDanceAmbience(state: RidgeWorldState): string {
  if (state.beat === 'dance_cleared') {
    return 'Lane clear. Board the last daylight shuttle on the right.';
  }
  if (state.beat === 'dance_ready' || bothReady(state)) {
    return 'Both helpers are ready. Clear the service gate, then take the shuttle.';
  }
  if (state.flags.has(FLAG_OPS) && !state.flags.has(FLAG_DRIVER)) {
    return 'Operations handoff done. The Dance Teacher can teach one private step.';
  }
  if (state.flags.has(FLAG_DRIVER) && !state.flags.has(FLAG_OPS)) {
    return 'Driver practiced one step. The Operations Helper still needs a handoff check.';
  }
  return 'Last-Stop Plaza setup. Talk to Operations (lantern) and the Dance Teacher (skirt pose).';
}
