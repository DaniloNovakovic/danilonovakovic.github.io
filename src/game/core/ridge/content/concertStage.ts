// Concert beat branching is route policy encoded as content.
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

const CONCERT_BLOCKED_PROGRESS = 0.55;

export interface ConcertDialogueCatalog {
  speakers: {
    prompt: string;
    cicka: string;
    injuredGuitarist: string;
    crowd: string;
  };
  lines: Record<string, string>;
}

const SPOTS = [
  {
    id: 'entry',
    label: 'Bridge night entry',
    kind: 'landmark' as const,
    progress: 0.05,
    interactRadius: 0.05,
    description: 'Evening ink. Small-town storefronts lean toward a delayed show.'
  },
  {
    id: 'guitarist',
    label: 'Injured Guitarist',
    kind: 'npc' as const,
    progress: 0.28,
    interactRadius: 0.08,
    actorId: 'guitarist' as const,
    description: 'A musician-side nook. Skateboard regret and a quiet guitar case.'
  },
  {
    id: 'cicka-nook',
    label: 'Cicka',
    kind: 'npc' as const,
    progress: 0.32,
    interactRadius: 0.07,
    actorId: 'cicka' as const,
    description: 'Cicka watches from behind stage props, crowd-shy.'
  },
  {
    id: 'crowd',
    label: 'Concert crowd',
    kind: 'npc' as const,
    progress: 0.55,
    interactRadius: 0.08,
    actorId: 'crowd' as const,
    description: 'A patient-impatient line waiting for a late local concert.'
  },
  {
    id: 'stage',
    label: 'Tiny stage',
    kind: 'prop' as const,
    progress: 0.42,
    interactRadius: 0.07,
    description: 'A forgiving practice spot that can become the show.'
  },
  {
    id: 'dance-exit',
    label: 'Dance exit',
    kind: 'exit' as const,
    progress: 0.9,
    interactRadius: 0.08,
    description: 'The opened crossing leans toward Last-Stop Plaza.'
  }
] as const;

export function createConcertStage(catalog: ConcertDialogueCatalog): RidgeStageDefinition {
  return {
    areaId: 'concert',
    title: 'Concert Area / Concert Crossing',
    lengthLabel: 'small-town night block',
    spots: SPOTS,
    blockedProgress: CONCERT_BLOCKED_PROGRESS,
    blockedMessage:
      'The crowd fills the crossing. Find the musician-side nook or wait for the show.',
    isCrossingOpen: (state) => state.beat === 'concert_cleared',
    resolveInteractables: (state) => resolveConcertInteractables(state, catalog),
    resolveActors: (state) => resolveConcertActors(state),
    resolveConversation: (conversationId, state) =>
      resolveConcertConversation(conversationId, state, catalog),
    describeAmbience: (state) => describeConcertAmbience(state)
  };
}

function resolveConcertInteractables(
  state: RidgeWorldState,
  catalog: ConcertDialogueCatalog
): RidgeInteractable[] {
  const plans: { spotId: string; conversationId: string; prompt: string }[] = [];

  if (state.beat === 'concert_arrival' || state.beat === 'concert_practiced') {
    plans.push({
      spotId: 'crowd',
      conversationId: 'concert.crowd.delay_barks',
      prompt: 'concert.crowd.delay_barks.01'
    });
    plans.push({
      spotId: 'guitarist',
      conversationId:
        state.beat === 'concert_practiced'
          ? 'concert.performance.auto_success'
          : state.flags.has('met_guitarist')
            ? 'concert.guitarist.practice_riff'
            : 'concert.guitarist.injury',
      prompt:
        state.beat === 'concert_practiced'
          ? 'concert.performance.auto_success.01'
          : state.flags.has('met_guitarist')
            ? 'concert.guitarist.practice_riff.01'
            : 'concert.guitarist.injury.01'
    });
    plans.push({
      spotId: 'cicka-nook',
      conversationId: 'concert.cicka.band_resting_spot',
      prompt: 'concert.cicka.band_resting_spot.01'
    });
    if (state.beat === 'concert_practiced') {
      plans.push({
        spotId: 'stage',
        conversationId: 'concert.performance.auto_success',
        prompt: 'concert.performance.auto_success.01'
      });
    }
  }

  if (state.beat === 'concert_cleared') {
    plans.push({
      spotId: 'guitarist',
      conversationId: 'concert.guitarist.guitar_handoff',
      prompt: 'concert.guitarist.guitar_handoff.01'
    });
    plans.push({
      spotId: 'cicka-nook',
      conversationId: 'concert.cicka.band_resting_spot',
      prompt: 'concert.cicka.band_resting_spot.03'
    });
    plans.push({
      spotId: 'dance-exit',
      conversationId: 'concert.exit.dance_transition',
      prompt: 'concert.exit.dance_transition.01'
    });
  }

  return collectNearbyFromPlans(
    state.progress,
    SPOTS,
    plans,
    (key) => catalog.lines[key] ?? key
  );
}

function resolveConcertActors(state: RidgeWorldState): RidgeActorPresence[] {
  const cleared = state.beat === 'concert_cleared';
  return [
    {
      id: 'player',
      label: 'You',
      progress: state.progress,
      visible: true,
      facing: state.facing
    },
    {
      id: 'crowd',
      label: 'Concert crowd',
      progress: cleared ? 0.72 : 0.55,
      visible: !cleared,
      facing: 'left'
    },
    {
      id: 'guitarist',
      label: 'Injured Guitarist',
      progress: cleared ? 0.78 : 0.28,
      visible: true,
      facing: cleared ? 'left' : 'right'
    },
    {
      id: 'cicka',
      label: 'Cicka',
      progress: cleared ? 0.8 : 0.32,
      visible: true,
      facing: 'right'
    },
    {
      id: 'guitar',
      label: 'Guitar',
      progress: cleared ? state.progress : 0.3,
      visible: cleared && state.inventory.includes(RIDGE_GUITAR_ITEM),
      facing: 'right'
    }
  ];
}

function resolveConcertConversation(
  conversationId: string,
  state: RidgeWorldState,
  catalog: ConcertDialogueCatalog
): RidgeConversationDefinition | null {
  const line = (id: string, speakerId: keyof ConcertDialogueCatalog['speakers']) =>
    makeCatalogLine(catalog, id, speakerId);

  switch (conversationId) {
    case 'concert.crowd.delay_barks':
      return {
        id: conversationId,
        lines: [
          line('concert.crowd.delay_barks.01', 'crowd'),
          line('concert.crowd.delay_barks.02', 'crowd'),
          line('concert.crowd.delay_barks.03', 'prompt')
        ]
      };
    case 'concert.guitarist.injury':
      return {
        id: conversationId,
        lines: [
          line('concert.guitarist.injury.01', 'injuredGuitarist'),
          line('concert.guitarist.injury.02', 'injuredGuitarist'),
          line('concert.guitarist.injury.03', 'prompt')
        ],
        outcome: { setFlag: 'met_guitarist' }
      };
    case 'concert.guitarist.practice_riff':
      return {
        id: conversationId,
        lines: [
          line('concert.guitarist.practice_riff.01', 'injuredGuitarist'),
          line('concert.guitarist.practice_riff.02', 'prompt'),
          line('concert.guitarist.practice_riff.03', 'injuredGuitarist')
        ],
        outcome: { setBeat: 'concert_practiced' }
      };
    case 'concert.performance.auto_success':
      return {
        id: conversationId,
        lines: [
          line('concert.performance.auto_success.01', 'prompt'),
          line('concert.performance.auto_success.02', 'prompt'),
          line('concert.performance.auto_success.03', 'crowd'),
          line('concert.performance.auto_success.04', 'injuredGuitarist')
        ],
        outcome: {
          setBeat: 'concert_cleared',
          addItem: RIDGE_GUITAR_ITEM
        }
      };
    case 'concert.guitarist.guitar_handoff':
      return {
        id: conversationId,
        lines: [
          line('concert.guitarist.guitar_handoff.01', 'injuredGuitarist'),
          line('concert.guitarist.guitar_handoff.02', 'injuredGuitarist'),
          line('concert.guitarist.guitar_handoff.03', 'prompt')
        ]
      };
    case 'concert.cicka.band_resting_spot':
      return {
        id: conversationId,
        lines:
          state.beat === 'concert_cleared'
            ? [
                line('concert.cicka.band_resting_spot.03', 'prompt'),
                line('concert.cicka.band_resting_spot.04', 'cicka')
              ]
            : [
                line('concert.cicka.band_resting_spot.01', 'prompt'),
                line('concert.cicka.band_resting_spot.02', 'cicka')
              ]
      };
    case 'concert.exit.dance_transition':
      return {
        id: conversationId,
        lines: [
          line('concert.exit.dance_transition.01', 'prompt'),
          line('concert.exit.dance_transition.02', 'injuredGuitarist'),
          line('concert.exit.dance_transition.03', 'prompt')
        ],
        outcome: { handoffToArea: 'danceFestival' }
      };
    default:
      return null;
  }
}

function describeConcertAmbience(state: RidgeWorldState): string {
  if (state.beat === 'concert_cleared') {
    return 'The crossing breathes again. Cicka loafs with the band near the opened exit.';
  }
  if (state.beat === 'concert_practiced') {
    return 'You know the phrase. The tiny stage waits for a forgiving first note.';
  }
  if (state.flags.has('met_guitarist')) {
    return 'Night storefronts. A late crowd. One careful practice could clear the street.';
  }
  return 'A compact night block. The crossing is full of people waiting for a concert that will not start.';
}
