// Concert beat branching is route policy encoded as content.
// fallow-ignore-file complexity
import type {
  RidgeActorPresence,
  RidgeConversationDefinition,
  RidgeConversationOutcome,
  RidgeDialogueChoice,
  RidgeInteractable,
  RidgeStageDefinition,
  RidgeWorldState
} from '../types';
import { RIDGE_GUITAR_ITEM } from '../types';
import { CONCERT_PRACTICE_ASSISTED_FLAG, concertGradeFlag, GIG_GRADES } from '../concertGig';
import { collectNearbyFromPlans, conversationKit, type CatalogLineSpec } from './dialogueHelpers';

/**
 * Stage layout on the progress line, left to right: the kafana curb where the
 * kid sulks, the poster wall, the backstage nook (Dule on his amp, Cicka
 * behind it), the tiny stage, then the crowd packed across the crossing.
 */
export const CONCERT_LAYOUT = {
  kid: 0.15,
  poster: 0.25,
  guitarist: 0.35,
  cicka: 0.4,
  /** Centre of the stage platform; the performer stands here. */
  stage: 0.49,
  /** Half-width of the stage platform, in progress. */
  stageHalfWidth: 0.048,
  crowd: 0.635,
  /** After the show: the band waits by the opened exit. */
  bandGuitarist: 0.8,
  bandCicka: 0.835,
  bandKid: 0.765,
  exit: 0.92
} as const;

/** Just past the stage: the crowd's back row. */
const CONCERT_BLOCKED_PROGRESS = 0.545;
/** The kid went to start a clap in the crowd. Warms the show up. */
const CONCERT_KID_HYPE_FLAG = 'concert_kid_hype';
const FLAG_MET_GUITARIST = 'met_guitarist';
const FLAG_MET_KID = 'concert_kid_met';
const FLAG_CICKA_MET = 'concert_cicka_met';
/** Set while an encore is being played after the crossing cleared. */
const FLAG_ENCORE = 'concert_encore';
const KID_HYPE_START = 0.68;
const asked = (topic: string) => `concert_asked_${topic}`;

export interface ConcertDialogueCatalog {
  speakers: {
    prompt: string;
    cicka: string;
    injuredGuitarist: string;
    crowd: string;
    crowdUncle: string;
    crowdGrandma: string;
    kid: string;
  };
  lines: Record<string, string>;
}

type ConcertSpeaker = keyof ConcertDialogueCatalog['speakers'];
type LineSpec = CatalogLineSpec<ConcertSpeaker>;

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
    id: 'kid',
    label: 'Skater Kid',
    kind: 'npc' as const,
    progress: CONCERT_LAYOUT.kid,
    interactRadius: 0.06,
    actorId: 'kid' as const,
    description: 'A kid on the kafana curb, glaring at a cracked skateboard.'
  },
  {
    id: 'poster',
    label: 'Gig poster',
    kind: 'prop' as const,
    progress: CONCERT_LAYOUT.poster,
    interactRadius: 0.045,
    description: 'A hand-drawn poster for tonight. Someone has argued with it in pen.'
  },
  {
    id: 'guitarist',
    label: 'Dule',
    kind: 'npc' as const,
    progress: CONCERT_LAYOUT.guitarist,
    interactRadius: 0.05,
    actorId: 'guitarist' as const,
    description: 'Backstage, a guitarist on an amp nurses his wrist.'
  },
  {
    id: 'cicka-nook',
    label: 'Cicka',
    kind: 'npc' as const,
    progress: CONCERT_LAYOUT.cicka,
    interactRadius: 0.035,
    actorId: 'cicka' as const,
    description: 'Cicka hides behind the amp, crowd-shy.'
  },
  {
    id: 'stage',
    label: 'Tiny stage',
    kind: 'prop' as const,
    progress: CONCERT_LAYOUT.stage,
    interactRadius: 0.045,
    description: 'One mic, one amp, a setlist taped to the floor.'
  },
  {
    id: 'crowd',
    label: 'Concert crowd',
    kind: 'npc' as const,
    progress: CONCERT_LAYOUT.crowd,
    interactRadius: 0.1,
    actorId: 'crowd' as const,
    description: 'A patient-impatient crowd packed across the crossing.'
  },
  {
    id: 'band-guitarist',
    label: 'Dule',
    kind: 'npc' as const,
    progress: CONCERT_LAYOUT.bandGuitarist,
    // Wide on purpose: walking past him toward the exit, he calls you back.
    interactRadius: 0.12,
    actorId: 'guitarist' as const,
    description: 'Dule waits by the opened exit.'
  },
  {
    id: 'band-cicka',
    label: 'Cicka',
    kind: 'npc' as const,
    progress: CONCERT_LAYOUT.bandCicka,
    interactRadius: 0.03,
    actorId: 'cicka' as const,
    description: 'Cicka loafs on the warm amp with the band.'
  },
  {
    id: 'band-kid',
    label: 'Skater Kid',
    kind: 'npc' as const,
    progress: CONCERT_LAYOUT.bandKid,
    interactRadius: 0.03,
    actorId: 'kid' as const,
    description: 'The kid hangs around the band, pretending not to.'
  },
  {
    id: 'dance-exit',
    label: 'Downhill exit',
    kind: 'exit' as const,
    progress: CONCERT_LAYOUT.exit,
    interactRadius: 0.06,
    description: 'The opened crossing leans toward Last-Stop Plaza.'
  }
] as const;

type ConcertSpotId = (typeof SPOTS)[number]['id'];

export function createConcertStage(catalog: ConcertDialogueCatalog): RidgeStageDefinition {
  return {
    areaId: 'concert',
    title: 'Concert Area / Concert Crossing',
    lengthLabel: 'small-town night block',
    spots: SPOTS,
    blockedProgress: CONCERT_BLOCKED_PROGRESS,
    blockedMessage: (state) =>
      state.beat === 'concert_practiced'
        ? 'The crowd is waiting for music. The stage is right there.'
        : "The crowd is packed shoulder to shoulder across the crossing. Nobody's moving till there's music.",
    isCrossingOpen: (state) => state.beat === 'concert_cleared',
    resolveInteractables: (state) => resolveConcertInteractables(state, catalog),
    resolveActors: (state) => resolveConcertActors(state),
    resolveConversation: (conversationId, state) =>
      resolveConcertConversation(conversationId, state, catalog),
    describeAmbience: (state) => describeConcertAmbience(state),
    concertGigStartHype: (state, mode) =>
      mode === 'show' && state.flags.has(CONCERT_KID_HYPE_FLAG) ? KID_HYPE_START : 0.5
  };
}

interface ConcertPlan {
  spotId: ConcertSpotId;
  conversationId: string;
}

function interactPlans(state: RidgeWorldState): ConcertPlan[] {
  const plan = (spotId: ConcertSpotId, conversationId: string): ConcertPlan => ({ spotId, conversationId });
  const poster = plan('poster', 'concert.poster.read');

  if (state.beat === 'concert_cleared') {
    const hasGuitar = state.inventory.includes(RIDGE_GUITAR_ITEM);
    const plans = [
      poster,
      plan('stage', 'concert.stage.encore'),
      plan('band-guitarist', hasGuitar ? 'concert.guitarist.farewell' : 'concert.guitarist.guitar_handoff')
    ];
    // Dule's goodbye comes first; then Cicka can be visited on her amp.
    if (hasGuitar) plans.push(plan('band-cicka', 'concert.cicka.band_resting_spot'));
    plans.push(
      state.flags.has(CONCERT_KID_HYPE_FLAG) ? plan('band-kid', 'concert.kid.after') : plan('kid', 'concert.kid.after')
    );
    if (hasGuitar) plans.push(plan('dance-exit', 'concert.exit.dance_transition'));
    return plans;
  }

  const practiced = state.beat === 'concert_practiced';
  const kidInCrowd = state.flags.has(CONCERT_KID_HYPE_FLAG);
  return [
    poster,
    plan('crowd', 'concert.crowd.delay_barks'),
    plan('kid', kidInCrowd ? 'concert.kid.hype_waiting' : 'concert.kid.board'),
    plan(
      'guitarist',
      practiced
        ? 'concert.guitarist.ready'
        : state.flags.has(FLAG_MET_GUITARIST)
          ? 'concert.guitarist.practice_riff'
          : 'concert.guitarist.injury'
    ),
    plan('cicka-nook', 'concert.cicka.band_resting_spot'),
    plan('stage', practiced ? 'concert.guitarist.ready' : 'concert.stage.look')
  ];
}

/** Prompt keys follow the conversation, except where one talk is reached two ways. */
function promptKeyFor(plan: ConcertPlan): string {
  if (plan.spotId === 'stage' && plan.conversationId === 'concert.guitarist.ready') {
    return 'concert.stage.take.prompt';
  }
  return `${plan.conversationId}.prompt`;
}

function resolveConcertInteractables(
  state: RidgeWorldState,
  catalog: ConcertDialogueCatalog
): RidgeInteractable[] {
  const plans = interactPlans(state).map((plan) => ({ ...plan, prompt: promptKeyFor(plan) }));
  // The kid moves into the crowd to start the clap; follow him there.
  const kidSpotProgress = kidProgress(state);
  const spots = SPOTS.map((spot) => (spot.id === 'kid' ? { ...spot, progress: kidSpotProgress } : spot));
  return collectNearbyFromPlans(state.progress, spots, plans, (key) => catalog.lines[key] ?? key);
}

function kidProgress(state: RidgeWorldState): number {
  if (state.beat === 'concert_cleared') {
    return state.flags.has(CONCERT_KID_HYPE_FLAG) ? CONCERT_LAYOUT.bandKid : CONCERT_LAYOUT.kid;
  }
  // Front row, just past the back of the crowd wall: reachable over shoulders.
  return state.flags.has(CONCERT_KID_HYPE_FLAG) ? 0.565 : CONCERT_LAYOUT.kid;
}

function resolveConcertActors(state: RidgeWorldState): RidgeActorPresence[] {
  // Everyone holds their places through the bow, then the street clears.
  const bowing = state.mode === 'conversation' && state.conversation?.id === 'concert.gig.show_done';
  const cleared = state.beat === 'concert_cleared' && !bowing;
  const playing = state.mode === 'concertGig' || bowing;
  const hasGuitar = state.inventory.includes(RIDGE_GUITAR_ITEM);
  // During a show Dule cheers from the wings and stragglers come back for encores.
  const guitaristProgress = playing ? 0.43 : cleared ? CONCERT_LAYOUT.bandGuitarist : CONCERT_LAYOUT.guitarist;
  // A great show coaxes crowd-shy Cicka out to the edge of the stage.
  const braveCicka =
    bowing &&
    state.flags.has(FLAG_CICKA_MET) &&
    (state.flags.has(concertGradeFlag('legendary')) || state.flags.has(concertGradeFlag('great')));
  const cickaProgress = braveCicka
    ? CONCERT_LAYOUT.stage - CONCERT_LAYOUT.stageHalfWidth
    : cleared && !playing
      ? CONCERT_LAYOUT.bandCicka
      : CONCERT_LAYOUT.cicka;

  return [
    {
      id: 'player',
      label: 'You',
      progress: playing ? CONCERT_LAYOUT.stage : talkingSpot(state, guitaristProgress),
      visible: true,
      facing: playing ? 'right' : state.facing,
      ...(playing ? { prop: 'guitar-playing' as const } : hasGuitar ? { prop: 'guitar-back' as const } : {})
    },
    {
      id: 'crowd',
      label: 'Concert crowd',
      progress: CONCERT_LAYOUT.crowd,
      visible: !cleared || playing,
      facing: 'left'
    },
    {
      id: 'kid',
      label: 'Skater Kid',
      progress: playing && state.flags.has(CONCERT_KID_HYPE_FLAG) ? 0.565 : kidProgress(state),
      visible: true,
      facing: playing || (cleared && state.flags.has(CONCERT_KID_HYPE_FLAG)) ? 'left' : 'right',
      // Sulking on the curb, until he has a reason to get up.
      seated: !state.flags.has(CONCERT_KID_HYPE_FLAG) && !playing
    },
    {
      id: 'guitarist',
      label: 'Dule',
      progress: guitaristProgress,
      visible: true,
      facing: playing ? 'right' : cleared ? 'left' : 'right',
      // On his amp backstage; on his feet for the show and the goodbye.
      seated: !playing && !cleared
    },
    {
      id: 'cicka',
      label: 'Cicka',
      progress: cickaProgress,
      visible: true,
      facing: cleared && !playing ? 'left' : 'right'
    }
  ];
}

/** Gap kept between the player and whoever they talk to, so bodies never stack. */
const TALK_GAP = 0.04;

/** While talking with Dule or the kid, stand beside them rather than inside them. */
function talkingSpot(state: RidgeWorldState, duleProgress: number): number {
  const id = state.mode === 'conversation' ? state.conversation?.id ?? '' : '';
  const partner = id.startsWith('concert.guitarist')
    ? duleProgress
    : id.startsWith('concert.kid')
      ? kidProgress(state)
      : null;
  if (partner === null || Math.abs(state.progress - partner) >= TALK_GAP) return state.progress;
  return partner + (state.progress >= partner ? TALK_GAP : -TALK_GAP);
}

function resolveConcertConversation(
  conversationId: string,
  state: RidgeWorldState,
  catalog: ConcertDialogueCatalog
): RidgeConversationDefinition | null {
  const kit = (prefix: string) => conversationKit<ConcertSpeaker>(prefix, catalog);
  const flags = state.flags;
  const unasked = (...choices: RidgeDialogueChoice[]) => choices.filter((option) => !flags.has(asked(option.id)));

  // Dule's topics are shared by every talk with him, so they stay asked.
  const dule = kit('concert.guitarist');
  const duleTopic = (id: string, lines: readonly LineSpec[]) =>
    dule.choice(id, lines, { then: 'menu', once: true, outcome: { setFlag: asked(id) } });
  const duleTopics = () =>
    unasked(
      duleTopic('wrist', [
        ['01', 'injuredGuitarist'],
        ['02', 'injuredGuitarist', 'playful'],
        ['03', 'injuredGuitarist', 'thoughtful']
      ]),
      duleTopic('who', [
        ['01', 'injuredGuitarist'],
        ['02', 'injuredGuitarist', 'playful']
      ]),
      duleTopic('cancel', [
        ['01', 'injuredGuitarist', 'thoughtful'],
        ['02', 'injuredGuitarist', 'thoughtful']
      ]),
      ...(flags.has(FLAG_MET_KID) || flags.has(CONCERT_KID_HYPE_FLAG)
        ? [
            duleTopic('kid', [
              ['01', 'injuredGuitarist', 'thoughtful'],
              ['02', 'injuredGuitarist']
            ])
          ]
        : [])
    );
  const learn = dule.choice(
    'learn',
    [
      ['01', 'injuredGuitarist', 'determined'],
      ['02', 'injuredGuitarist']
    ],
    { outcome: { setFlag: FLAG_MET_GUITARIST, openConcertGig: 'practice' } }
  );

  switch (conversationId) {
    case 'concert.poster.read': {
      const { say } = kit(conversationId);
      return {
        id: conversationId,
        lines:
          state.beat === 'concert_cleared'
            ? [say(['01', 'prompt']), say(['02', 'prompt']), say(['after.01', 'prompt'])]
            : [say(['01', 'prompt']), say(['02', 'prompt'])]
      };
    }

    case 'concert.crowd.delay_barks': {
      const { say, choice } = kit(conversationId);
      if (state.beat === 'concert_practiced') {
        return {
          id: conversationId,
          lines: [say(['ready.01', 'crowdGrandma', 'surprised']), say(['ready.02', 'crowdUncle'])]
        };
      }
      const topic = (id: string, lines: readonly LineSpec[]) => choice(id, lines, { then: 'menu', once: true });
      return {
        id: conversationId,
        lines: [say(['01', 'crowdUncle'])],
        choices: [
          topic('holdup', [
            ['01', 'crowdGrandma'],
            ['02', 'crowdUncle']
          ]),
          topic('who', [
            ['01', 'crowdGrandma', 'playful'],
            ['02', 'crowdGrandma', 'thoughtful']
          ]),
          topic('through', [
            ['01', 'crowdUncle', 'determined'],
            ['02', 'prompt']
          ]),
          choice('leave', [['01', 'crowdUncle']])
        ]
      };
    }

    // The kid who started it. Win him over and he starts the crowd clapping.
    case 'concert.kid.board': {
      const { say, choice } = kit(conversationId);
      const met: RidgeConversationOutcome = { setFlag: FLAG_MET_KID };
      const hype = choice(
        'hype',
        [
          ['01', 'kid', 'curious'],
          ['02', 'kid', 'determined'],
          ['03', 'prompt']
        ],
        { outcome: { setFlag: CONCERT_KID_HYPE_FLAG } }
      );
      const secret = choice('secret', [['01', 'kid', 'playful']], { then: 'menu', once: true });
      return {
        id: conversationId,
        lines: [say(['01', 'prompt']), say(['02', 'kid', 'determined'])],
        choices: [
          choice(
            'what',
            [
              ['01', 'kid'],
              ['02', 'kid', 'surprised'],
              ['03', 'kid', 'thoughtful']
            ],
            { then: 'menu', once: true, outcome: met }
          ),
          choice(
            'harsh',
            [
              ['01', 'kid', 'determined'],
              ['02', 'prompt'],
              ['03', 'kid', 'thoughtful']
            ],
            { then: 'menu', once: true, outcome: met }
          ),
          choice(
            'sticker',
            [
              ['01', 'kid', 'surprised'],
              ['02', 'prompt']
            ],
            { once: true, outcome: met, choices: [hype, secret] }
          ),
          choice('leave', [['01', 'kid']])
        ],
        outcome: met
      };
    }
    case 'concert.kid.hype_waiting': {
      const { say } = kit(conversationId);
      return {
        id: conversationId,
        lines: [say(['01', 'kid', 'determined']), say(['02', 'kid', 'playful'])]
      };
    }
    case 'concert.kid.after': {
      const { say, choice } = kit(conversationId);
      if (flags.has(CONCERT_KID_HYPE_FLAG)) {
        return { id: conversationId, lines: [say(['hype.01', 'kid', 'playful']), say(['hype.02', 'kid'])] };
      }
      return {
        id: conversationId,
        lines: [say(['01', 'prompt']), say(['02', 'kid', 'thoughtful'])],
        choices: [choice('tell', [['01', 'kid', 'thoughtful']]), choice('nod', [['01', 'prompt']])]
      };
    }

    case 'concert.guitarist.injury':
      return {
        id: conversationId,
        lines: [dule.say(['injury.01', 'prompt']), dule.say(['injury.02', 'injuredGuitarist', 'playful'])],
        choices: [
          ...duleTopics(),
          dule.choice(
            'help',
            [
              ['01', 'injuredGuitarist', 'surprised'],
              ['02', 'injuredGuitarist', 'curious'],
              ['03', 'injuredGuitarist']
            ],
            {
              choices: [learn, dule.choice('later', [['01', 'injuredGuitarist', 'playful']])]
            }
          ),
          dule.choice('leave', [['01', 'injuredGuitarist', 'playful']])
        ],
        outcome: { setFlag: FLAG_MET_GUITARIST }
      };
    case 'concert.guitarist.practice_riff':
      return {
        id: conversationId,
        lines: [dule.say(['practice_riff.01', 'injuredGuitarist', 'curious'])],
        choices: [learn, ...duleTopics(), dule.choice('not_yet', [['01', 'injuredGuitarist']])]
      };
    case 'concert.guitarist.ready':
      return {
        id: conversationId,
        lines: [
          dule.say([
            flags.has(CONCERT_PRACTICE_ASSISTED_FLAG) ? 'ready.01_assisted' : 'ready.01',
            'injuredGuitarist',
            'playful'
          ])
        ],
        choices: [
          dule.choice(
            'show',
            [
              ['01', 'injuredGuitarist', 'determined'],
              ['02', 'injuredGuitarist']
            ],
            { outcome: { openConcertGig: 'show' } }
          ),
          dule.choice('again', [['01', 'injuredGuitarist']], { outcome: { openConcertGig: 'practice' } }),
          ...unasked(
            duleTopic('nervous', [
              ['01', 'injuredGuitarist', 'thoughtful'],
              ['02', 'injuredGuitarist', 'playful']
            ])
          ),
          ...duleTopics(),
          dule.choice('wait', [['01', 'injuredGuitarist']])
        ]
      };

    case 'concert.stage.look': {
      const { say } = kit(conversationId);
      return { id: conversationId, lines: [say(['01', 'prompt']), say(['02', 'prompt'])] };
    }
    case 'concert.stage.encore': {
      const { say, choice } = kit(conversationId);
      return {
        id: conversationId,
        lines: [say(['01', 'prompt'])],
        choices: [
          choice('encore', [['01', 'prompt']], { outcome: { setFlag: FLAG_ENCORE, openConcertGig: 'show' } }),
          choice('leave', [['01', 'prompt']])
        ]
      };
    }

    case 'concert.gig.practice_done': {
      const { say } = kit(conversationId);
      const assisted = flags.has(CONCERT_PRACTICE_ASSISTED_FLAG);
      return {
        id: conversationId,
        lines: [
          ...(assisted
            ? [say(['assisted.01', 'injuredGuitarist', 'playful']), say(['assisted.02', 'injuredGuitarist', 'thoughtful'])]
            : [say(['passed.01', 'injuredGuitarist', 'surprised']), say(['passed.02', 'injuredGuitarist', 'playful'])]),
          ...(flags.has(FLAG_CICKA_MET) ? [say(['cicka.01', 'prompt'])] : []),
          say(['03', 'injuredGuitarist', 'determined'])
        ]
      };
    }
    case 'concert.gig.show_done': {
      const { say } = kit(conversationId);
      const grade = GIG_GRADES.find((candidate) => flags.has(concertGradeFlag(candidate))) ?? 'good';
      const loved = grade === 'legendary' || grade === 'great';
      const duleLine = say([`dule.${grade}`, 'injuredGuitarist', grade === 'legendary' ? 'surprised' : grade === 'rough' ? 'thoughtful' : 'playful']);
      if (flags.has(FLAG_ENCORE)) {
        return {
          id: conversationId,
          lines: [say(['encore.01', 'prompt']), duleLine],
          outcome: { clearFlag: FLAG_ENCORE }
        };
      }
      const crowdVoice: ConcertSpeaker = grade === 'great' || grade === 'rough' ? 'crowdGrandma' : 'crowdUncle';
      return {
        id: conversationId,
        lines: [
          say(['01', 'prompt']),
          say([`crowd.${grade}`, crowdVoice, grade === 'legendary' ? 'surprised' : 'playful']),
          duleLine,
          ...(loved && flags.has(FLAG_CICKA_MET) ? [say(['cicka.01', 'prompt'])] : []),
          say(['02', 'prompt']),
          say(['03', 'injuredGuitarist'])
        ]
      };
    }

    case 'concert.guitarist.guitar_handoff': {
      const { say, choice } = kit(conversationId);
      const take: RidgeConversationOutcome = { addItem: RIDGE_GUITAR_ITEM };
      return {
        id: conversationId,
        lines: [
          say(['01', 'injuredGuitarist', 'thoughtful']),
          say(['02', 'injuredGuitarist']),
          ...(flags.has(CONCERT_KID_HYPE_FLAG)
            ? [
                say(['kid.01', 'kid', 'thoughtful']),
                say(['kid.02', 'kid']),
                say(['kid.03', 'injuredGuitarist', 'playful']),
                say(['kid.04', 'injuredGuitarist']),
                say(['kid.05', 'kid', 'playful'])
              ]
            : []),
          say(['03', 'injuredGuitarist', 'thoughtful'])
        ],
        choices: [
          choice(
            'promise',
            [
              ['01', 'injuredGuitarist', 'thoughtful'],
              ['02', 'prompt']
            ],
            { outcome: take }
          ),
          choice(
            'sure',
            [
              ['01', 'injuredGuitarist', 'playful'],
              ['02', 'injuredGuitarist', 'thoughtful'],
              ['03', 'prompt']
            ],
            { outcome: take }
          )
        ]
      };
    }
    case 'concert.guitarist.farewell': {
      const { say, choice } = kit(conversationId);
      return {
        id: conversationId,
        lines: [say(['01', 'injuredGuitarist', 'playful'])],
        choices: [
          choice('thanks', [['01', 'injuredGuitarist', 'thoughtful']]),
          choice('leave', [['01', 'injuredGuitarist']])
        ]
      };
    }

    case 'concert.cicka.band_resting_spot': {
      const { say, choice } = kit(conversationId);
      if (state.beat === 'concert_cleared') {
        return {
          id: conversationId,
          lines: [say(['after.01', 'prompt']), say(['after.02', 'cicka', 'sleepy'])],
          choices: [
            choice('pet', [
              ['01', 'cicka', 'sleepy'],
              ['02', 'prompt']
            ]),
            choice('nap', [['01', 'prompt']])
          ]
        };
      }
      return {
        id: conversationId,
        lines: [say([state.beat === 'concert_practiced' ? '01_practiced' : '01', 'prompt'])],
        choices: [
          choice(
            'sit',
            [
              ['01', 'prompt'],
              ['02', 'cicka', 'sleepy'],
              ['03', 'prompt']
            ],
            { outcome: { setFlag: FLAG_CICKA_MET } }
          ),
          choice(
            'coax',
            [
              ['01', 'cicka', 'determined'],
              ['02', 'prompt']
            ],
            { then: 'menu', once: true }
          ),
          choice('leave', [['01', 'prompt']])
        ]
      };
    }

    case 'concert.exit.dance_transition': {
      const { say } = kit(conversationId);
      return {
        id: conversationId,
        lines: [say(['01', 'prompt']), say(['02', 'injuredGuitarist', 'playful']), say(['03', 'prompt'])],
        outcome: { handoffToArea: 'danceFestival' }
      };
    }
    default:
      return null;
  }
}

function describeConcertAmbience(state: RidgeWorldState): string {
  if (state.mode === 'concertGig') {
    return 'Lights on the tiny stage. The notes slide down; strum as they reach the line.';
  }
  if (state.beat === 'concert_cleared') {
    return state.inventory.includes(RIDGE_GUITAR_ITEM)
      ? "The crossing is open. Dule's guitar rides on your back; the festival lights wait downhill."
      : 'The crowd drifts home humming. Dule waits by the corner near the opened exit.';
  }
  if (state.beat === 'concert_practiced') {
    return 'You know the phrase. The tiny stage waits, and so does the whole street.';
  }
  if (state.flags.has(FLAG_MET_GUITARIST)) {
    return 'Night storefronts. A late crowd. Dule sits behind the stage with seven notes to teach.';
  }
  return 'A compact night block. The crossing is packed with people waiting for a concert that will not start.';
}
