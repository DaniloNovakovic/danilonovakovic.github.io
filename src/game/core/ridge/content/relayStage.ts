// Relay ending sequence is intentionally linear authored content.
// fallow-ignore-file complexity
import type {
  RidgeActorPresence,
  RidgeConversationDefinition,
  RidgeInteractable,
  RidgeStageDefinition,
  RidgeWorldState
} from '../types';
import { RIDGE_GUITAR_ITEM } from '../types';
import { collectNearbyFromPlans, makeCatalogLine } from './dialogueHelpers';

export interface RelayDialogueCatalog {
  speakers: {
    prompt: string;
    cicka: string;
    dedication: string;
  };
  lines: Record<string, string>;
}

const SPOTS = [
  {
    id: 'arrival',
    label: 'Relay overlook',
    kind: 'landmark' as const,
    progress: 0.2,
    interactRadius: 0.07,
    description: 'A tiny sunset overlook above the finished route.'
  },
  {
    id: 'cicka',
    label: 'Cicka',
    kind: 'npc' as const,
    progress: 0.55,
    interactRadius: 0.1,
    actorId: 'cicka' as const,
    description: 'Cicka waits in her final field-presence spot, calm and familiar.'
  },
  {
    id: 'sit',
    label: 'Sit and Play',
    kind: 'prop' as const,
    progress: 0.58,
    interactRadius: 0.1,
    description: 'A quiet place to sit beside Cicka with the concert guitar.'
  },
  {
    id: 'threshold',
    label: 'Warm threshold',
    kind: 'landmark' as const,
    progress: 0.85,
    interactRadius: 0.05,
    description: 'A warm sketchbook seam beyond the player path.'
  }
] as const;

export function createRelayStage(catalog: RelayDialogueCatalog): RidgeStageDefinition {
  return {
    areaId: 'relay',
    title: 'Relay Spire / Guitar Farewell',
    lengthLabel: 'sunset overlook',
    spots: SPOTS,
    resolveInteractables: (state) => resolveRelayInteractables(state, catalog),
    resolveActors: (state) => resolveRelayActors(state),
    resolveConversation: (conversationId, state) =>
      resolveRelayConversation(conversationId, state, catalog),
    describeAmbience: (state) => describeRelayAmbience(state)
  };
}

function resolveRelayInteractables(
  state: RidgeWorldState,
  catalog: RelayDialogueCatalog
): RidgeInteractable[] {
  if (state.beat !== 'relay_linger') return [];

  const plans = [
    {
      spotId: 'arrival',
      conversationId: 'relay.overlook.inspect',
      prompt: 'relay.overlook.inspect.01'
    },
    {
      spotId: 'cicka',
      conversationId: 'relay.sit_and_play.prompt',
      prompt: 'relay.sit_and_play.prompt.01'
    },
    {
      spotId: 'sit',
      conversationId: 'relay.sit_and_play.prompt',
      prompt: 'relay.sit_and_play.prompt.01'
    }
  ];

  return collectNearbyFromPlans(
    state.progress,
    SPOTS,
    plans,
    (key) => catalog.lines[key] ?? key
  );
}

function resolveRelayActors(state: RidgeWorldState): RidgeActorPresence[] {
  const farewell =
    state.beat === 'relay_farewell' ||
    state.beat === 'relay_complete' ||
    state.mode === 'conversation';
  const cickaGone = state.beat === 'relay_complete' || state.flags.has('cicka_crossed');

  return [
    {
      id: 'player',
      label: 'You',
      progress: farewell ? 0.58 : state.progress,
      visible: true,
      facing: state.facing
    },
    {
      id: 'cicka',
      label: 'Cicka',
      progress: cickaGone ? 0.85 : 0.55,
      visible: !cickaGone,
      facing: 'left'
    },
    {
      id: 'guitar',
      label: 'Guitar',
      progress: farewell ? 0.58 : state.progress,
      visible: state.inventory.includes(RIDGE_GUITAR_ITEM),
      facing: 'right'
    }
  ];
}

function resolveRelayConversation(
  conversationId: string,
  _state: RidgeWorldState,
  catalog: RelayDialogueCatalog
): RidgeConversationDefinition | null {
  const line = (id: string, speakerId: keyof RelayDialogueCatalog['speakers']) =>
    makeCatalogLine(catalog, id, speakerId);

  switch (conversationId) {
    case 'relay.overlook.inspect':
      return {
        id: conversationId,
        lines: [
          line('relay.overlook.inspect.01', 'prompt'),
          line('relay.overlook.inspect.02', 'prompt')
        ]
      };
    case 'relay.sit_and_play.prompt':
      return {
        id: conversationId,
        lines: [
          line('relay.sit_and_play.prompt.01', 'prompt'),
          line('relay.sit_and_play.prompt.02', 'prompt'),
          line('relay.sit_and_play.prompt.03', 'prompt'),
          // Route Memory Montage — three soft flashes, no captions in presentation;
          // console keeps short readable echoes for AI playtests.
          line('relay.montage.bridge.01', 'prompt'),
          line('relay.montage.concert.01', 'prompt'),
          line('relay.montage.dance.01', 'prompt'),
          line('relay.guitar.sunset.01', 'prompt')
        ],
        choices: [
          {
            id: 'let-song-end',
            label: catalog.lines['relay.guitar.let_song_end.01'] ?? 'Let the song end',
            lines: [
              line('relay.guitar.let_song_end.02', 'prompt'),
              line('relay.cicka.threshold_meow.01', 'cicka'),
              line('relay.cicka.threshold_meow.02', 'prompt'),
              line('relay.cicka.threshold_meow.03', 'prompt'),
              line('relay.dedication.card.01', 'dedication'),
              line('relay.dedication.card.02', 'dedication')
            ],
            outcome: {
              setBeat: 'relay_complete',
              setFlag: 'cicka_crossed',
              routeReset: true
            }
          }
        ]
      };
    default:
      return null;
  }
}

function describeRelayAmbience(state: RidgeWorldState): string {
  if (state.beat === 'relay_complete') {
    return 'Empty sunset paper. A quiet dedication holds, then the page resets.';
  }
  if (state.beat === 'relay_farewell') {
    return 'The familiar concert phrase softens the overlook. The sun lowers.';
  }
  return 'Relay Spire under warm threshold light. Cicka waits. The guitar feels ready.';
}
