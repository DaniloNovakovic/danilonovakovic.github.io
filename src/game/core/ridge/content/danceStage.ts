// Dance Festival branching is route policy encoded as content.
// fallow-ignore-file complexity
import type {
  RidgeActorId,
  RidgeActorPresence,
  RidgeConversationDefinition,
  RidgeDialogueChoice,
  RidgeInteractable,
  RidgeStageDefinition,
  RidgeWorldState
} from '../types';
import { RIDGE_GUITAR_ITEM } from '../types';
import { danceGradeFlag } from '../bachata';
import { GIG_GRADES, serenadeGradeFlag, type GigGrade } from '../concertGig';
import { collectNearbyFromPlans, conversationKit, standBeside, type CatalogLineSpec } from './dialogueHelpers';

/**
 * Last-Stop Plaza, left to right: the van drop-off, the traveler on his
 * suitcase, the shuttle shelter (the driver and his clipboard), the dance
 * floor (the Profe), the lantern crates (Cicka) beside the chair stacks (a
 * shy dark cat), the operations table, the steward, the service gate, and the
 * last daylight shuttle beyond it.
 */
export const DANCE_LAYOUT = {
  traveler: 0.1,
  shelter: 0.22,
  floor: 0.35,
  crates: 0.44,
  chairs: 0.49,
  operations: 0.56,
  steward: 0.625,
  gate: 0.68,
  shuttle: 0.86,
  /** The last setup jobs, spread along the lane once the request is in. */
  jobs: { lanterns: 0.605, cables: 0.64 },
  /** The steward, key in hand, on the road side of the gate while you work. */
  stewardAtGate: 0.695,
  /** The lesson happens behind the shelter, where nobody looks. */
  lesson: { teacher: 0.155, player: 0.215, driver: 0.275 },
  /** Playing for the cat from a lantern crate. */
  serenadePlayer: 0.405,
  /**
   * The night after you leave, as the Relay ending remembers it: the couple on
   * the floor, the traveler front row, the Profe on the radio.
   */
  night: {
    traveler: 0.27,
    driver: 0.33,
    ops: 0.37,
    steward: 0.41,
    teacher: 0.555
  },
  /** After the gate opens. */
  after: {
    traveler: 0.31,
    teacher: 0.515,
    cicka: 0.74,
    cat: 0.776,
    steward: 0.71,
    driver: 0.82
  }
} as const;

/** Just short of the gate: the barrier, cable run, and lantern line block the lane. */
const DANCE_BLOCKED_PROGRESS = 0.665;
const DRIVER_LESSON_NERVE = 0.3;
const DRIVER_ENCOURAGED_NERVE = 0.45;

/** The two Readiness Favors. */
const FLAG_OPS = 'ops_ready';
const FLAG_DRIVER = 'driver_ready';
const FLAG_MET_DRIVER = 'dance_met_driver';
const FLAG_MET_OPS = 'dance_met_ops';
const FLAG_LESSON_ASKED = 'dance_driver_lesson_ask';
const FLAG_ENCOURAGED = 'dance_driver_encouraged';
/** Ops ran her checklist with you and admitted it was all fine. */
const FLAG_OPS_CHECKED = 'dance_ops_checked';
/** She asked who keeps watch tonight. */
const FLAG_OPS_NEEDS_WATCH = 'dance_ops_needs_watch';
const FLAG_TEACHER_WATCH = 'dance_teacher_watch';
const FLAG_SONG_FOLDED = 'song_folded';
const FLAG_SNAP_LANTERNS = 'dance_snap_lanterns';
const FLAG_SNAP_CABLES = 'dance_snap_cables';
/** You tried the middle hook: it clears a person, not a roof load. */
const FLAG_LANTERNS_MID = 'dance_lanterns_mid';
const FLAG_CAT_SEEN = 'dance_cat_seen';
const FLAG_CAT_OUT = 'dance_cat_serenaded';
const FOLDED_REQUEST_ITEM = 'folded-request';

/** Memory-only flag: stage the plaza on the night of the dance. */
export const DANCE_NIGHT_FLAG = 'dance_memory_night';
/** Memory-only flag: second song, and nobody on the plaza is sitting down. */
export const DANCE_NIGHT_EVERYONE_FLAG = 'dance_memory_everyone';
/** The quiet cat came out for your song. */
export const DANCE_CAT_SERENADED_FLAG = FLAG_CAT_OUT;
const asked = (topic: string) => `dance_asked_${topic}`;

export interface DanceDialogueCatalog {
  speakers: {
    prompt: string;
    cicka: string;
    counterpartCat: string;
    traveler: string;
    hillShuttleDriver: string;
    /** The driver, heard over the operations radio. */
    shuttleRadio: string;
    /** Ops, heard over the shuttle radio. */
    opsRadio: string;
    operationsHelper: string;
    danceTeacher: string;
    festivalSteward: string;
  };
  lines: Record<string, string>;
}

type DanceSpeaker = keyof DanceDialogueCatalog['speakers'];
type LineSpec = CatalogLineSpec<DanceSpeaker>;

const SPOTS = [
  {
    id: 'entry',
    label: 'Van drop-off',
    kind: 'landmark' as const,
    progress: 0.04,
    interactRadius: 0.03,
    description: 'Daytime setup for a night dance that has not begun.'
  },
  {
    id: 'traveler',
    label: 'Traveler',
    kind: 'npc' as const,
    progress: DANCE_LAYOUT.traveler,
    interactRadius: 0.05,
    actorId: 'traveler' as const,
    description: 'A traveler on her suitcase, writing postcards, waiting for the same shuttle you are.'
  },
  {
    id: 'driver',
    label: 'Hill-Shuttle Driver',
    kind: 'npc' as const,
    progress: DANCE_LAYOUT.shelter,
    interactRadius: 0.05,
    actorId: 'driver' as const,
    description: 'Under the shuttle shelter, rereading a route clipboard.'
  },
  {
    id: 'teacher',
    label: 'Dance Teacher',
    kind: 'npc' as const,
    progress: DANCE_LAYOUT.floor,
    interactRadius: 0.05,
    actorId: 'dance-teacher' as const,
    description: 'The Profe, dancing with nobody on the empty floor, perfectly.'
  },
  {
    id: 'cicka',
    label: 'Cicka',
    kind: 'npc' as const,
    progress: DANCE_LAYOUT.crates,
    interactRadius: 0.025,
    actorId: 'cicka' as const,
    description: 'Loafing on a crate of paper lanterns, staring hard at the chairs.'
  },
  {
    id: 'chairs',
    label: 'Chair stacks',
    kind: 'prop' as const,
    progress: DANCE_LAYOUT.chairs,
    interactRadius: 0.025,
    description: 'Twelve stacks of twelve folding chairs. Something is underneath.'
  },
  {
    id: 'operations',
    label: 'Last-Stop Operations Helper',
    kind: 'npc' as const,
    progress: DANCE_LAYOUT.operations,
    interactRadius: 0.04,
    actorId: 'operations-helper' as const,
    description: 'The operations table: a radio, a checklist, and a jar for song requests.'
  },
  {
    id: 'steward',
    label: 'Festival Steward',
    kind: 'npc' as const,
    progress: DANCE_LAYOUT.steward,
    interactRadius: 0.035,
    actorId: 'steward' as const,
    description: 'Holds the service-gate key in a very serious pocket.'
  },
  {
    id: 'lantern-pole',
    label: 'Lantern line',
    kind: 'prop' as const,
    progress: DANCE_LAYOUT.jobs.lanterns,
    interactRadius: 0.015,
    description: 'A lantern line sagging across the lane, tied to a pole with three hooks.'
  },
  {
    id: 'cable-run',
    label: 'Cable run',
    kind: 'prop' as const,
    progress: DANCE_LAYOUT.jobs.cables,
    interactRadius: 0.015,
    description: 'Loose speaker cables across the lane, right where the shuttle tyres will go.'
  },
  {
    id: 'gate',
    label: 'Service gate',
    kind: 'prop' as const,
    progress: DANCE_LAYOUT.gate,
    interactRadius: 0.03,
    description: 'Barriers, a loose cable run, and a sagging lantern line block the hill road.'
  },
  {
    id: 'shuttle',
    label: 'Last daylight shuttle',
    kind: 'exit' as const,
    progress: DANCE_LAYOUT.shuttle,
    interactRadius: 0.06,
    actorId: 'shuttle' as const,
    description: 'The threshold ride to Relay under a warming sky.'
  }
] as const;

type DanceSpotId = (typeof SPOTS)[number]['id'];

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
    resolveConversation: (conversationId, state) => resolveDanceConversation(conversationId, state, catalog),
    describeAmbience: (state) => describeDanceAmbience(state),
    bachataStartNerve: (state) => (state.flags.has(FLAG_ENCOURAGED) ? DRIVER_ENCOURAGED_NERVE : DRIVER_LESSON_NERVE),
    resolveSceneryMarks: (state) => danceSceneryMarks(state)
  };
}

const cleared = (state: RidgeWorldState) => state.beat === 'dance_cleared';
/** The request is in the jar: from here the lane is the only thing left. */
const requested = (state: RidgeWorldState) => state.beat === 'dance_ready' || cleared(state);
const driverReady = (state: RidgeWorldState) => state.flags.has(FLAG_DRIVER) || requested(state);
const opsReady = (state: RidgeWorldState) => state.flags.has(FLAG_OPS) || requested(state);
const bothReady = (state: RidgeWorldState) => driverReady(state) && opsReady(state);
const catOut = (state: RidgeWorldState) => state.flags.has(FLAG_CAT_OUT);

function describeDanceBlock(state: RidgeWorldState): string {
  if (requested(state)) {
    const left = [
      state.flags.has(FLAG_SNAP_LANTERNS) ? null : 'lift the lantern line',
      state.flags.has(FLAG_SNAP_CABLES) ? null : 'sort out the cable run'
    ].filter((job): job is string => job !== null);
    return left.length > 0
      ? `The steward has the key. Still to do: ${left.join(' and ')}.`
      : 'Lanterns up, cables ramped. The steward is waiting at the gate with the key.';
  }
  return 'Barriers, a loose cable run, and a sagging lantern line block the service road. The steward will not open it until setup is safe.';
}

/** Set dressing the plaza wears as the afternoon goes on. */
function danceSceneryMarks(state: RidgeWorldState): string[] {
  if (state.flags.has(DANCE_NIGHT_FLAG)) {
    return ['lanterns-tied', 'cables-ramped', 'sign-flipped', 'request-in-jar', 'sky-night'];
  }
  const marks: string[] = [];
  const open = cleared(state);
  const lanterns = open || state.flags.has(FLAG_SNAP_LANTERNS);
  const cables = open || state.flags.has(FLAG_SNAP_CABLES);
  if (lanterns) marks.push('lanterns-tied');
  else if (state.flags.has(FLAG_LANTERNS_MID)) marks.push('lanterns-mid');
  if (cables) marks.push('cables-ramped');
  // Ink to-do tags over each open job, then over the gate once only the sign is left.
  if (requested(state) && !open) {
    if (!lanterns) marks.push('todo-lanterns');
    if (!cables) marks.push('todo-cables');
    if (lanterns && cables) marks.push('todo-gate');
  }
  if (open) marks.push('sign-flipped', 'sky-sunset');
  else if (requested(state)) marks.push('sky-late');
  if (requested(state)) marks.push('request-in-jar');
  // While you play he is a body creeping out, not two eyes under the chairs.
  const serenading = state.mode === 'concertGig' || state.conversation?.id === 'dance.cats.serenade_done';
  if (!open && !catOut(state) && !serenading) marks.push('cat-hiding');
  return marks;
}

// --- interactables --------------------------------------------------------

interface DancePlan {
  spotId: DanceSpotId;
  conversationId: string;
  /** Prompt key, when it is not `<conversationId>.prompt`. */
  prompt?: string;
}

function driverConversation(state: RidgeWorldState): string {
  if (cleared(state)) return 'dance.shuttle.last_daylight_ride';
  if (requested(state)) return 'dance.driver.after_request';
  if (state.inventory.includes(FOLDED_REQUEST_ITEM)) return 'dance.driver.request_pending';
  if (bothReady(state)) return 'dance.driver.request';
  if (driverReady(state)) return 'dance.driver.practiced';
  if (state.flags.has(FLAG_LESSON_ASKED)) return 'dance.driver.waiting_lesson';
  return 'dance.driver.clipboard';
}

function interactPlans(state: RidgeWorldState): DancePlan[] {
  const plan = (spotId: DanceSpotId, conversationId: string, prompt?: string): DancePlan => ({
    spotId,
    conversationId,
    ...(prompt ? { prompt } : {})
  });
  const open = cleared(state);
  const plans: DancePlan[] = [
    plan('traveler', open ? 'dance.traveler.staying' : 'dance.traveler.wayfinding'),
    plan('driver', driverConversation(state), open ? 'dance.shuttle.driver.prompt' : 'dance.driver.prompt'),
    plan('teacher', 'dance.teacher.floor'),
    plan('operations', requested(state) ? 'dance.operations.after' : 'dance.operations.table'),
    plan(
      'cicka',
      open ? 'dance.cats.gate' : catOut(state) ? 'dance.cats.together' : 'dance.cicka.crates'
    )
  ];
  if (!open && !catOut(state)) plans.push(plan('chairs', 'dance.cats.chairs'));
  if (open) {
    plans.push(plan('steward', 'dance.steward.after'), plan('shuttle', 'dance.shuttle.last_daylight_ride'));
  } else if (requested(state)) {
    plans.push(plan('steward', 'dance.steward.clearance'), plan('gate', 'dance.steward.clearance', 'dance.gate.clearance.prompt'));
    if (!state.flags.has(FLAG_SNAP_LANTERNS)) plans.push(plan('lantern-pole', 'dance.setup.lanterns'));
    if (!state.flags.has(FLAG_SNAP_CABLES)) plans.push(plan('cable-run', 'dance.setup.cables'));
  } else {
    plans.push(plan('steward', 'dance.steward.gate'), plan('gate', 'dance.gate.look'));
  }
  return plans;
}

function resolveDanceInteractables(state: RidgeWorldState, catalog: DanceDialogueCatalog): RidgeInteractable[] {
  const plans = interactPlans(state).map((entry) => ({
    spotId: entry.spotId,
    conversationId: entry.conversationId,
    prompt: entry.prompt ?? `${entry.conversationId}.prompt`
  }));
  // Residents who moved after the gate opened are found where they now stand.
  const spots = SPOTS.map((spot) => {
    const actor = 'actorId' in spot ? spot.actorId : undefined;
    if (!actor || actor === 'shuttle') return spot;
    return { ...spot, progress: restingProgress(state, actor) };
  });
  return collectNearbyFromPlans(state.progress, spots, plans, (key) => catalog.lines[key] ?? key);
}

// --- actors ---------------------------------------------------------------

/** Where a resident stands when nothing is being danced or played. */
function restingProgress(state: RidgeWorldState, id: RidgeActorId): number {
  const open = cleared(state);
  if (state.flags.has(DANCE_NIGHT_FLAG)) {
    const night = DANCE_LAYOUT.night;
    switch (id) {
      case 'traveler':
        return night.traveler;
      case 'driver':
        return night.driver;
      case 'operations-helper':
        return night.ops;
      case 'steward':
        return night.steward;
      case 'dance-teacher':
        return night.teacher;
      case 'cicka':
        return DANCE_LAYOUT.crates;
      case 'counterpart-cat':
        // On her crate if your song brought him out; just out from under the chairs if not.
        return catOut(state) ? DANCE_LAYOUT.crates : DANCE_LAYOUT.chairs - 0.012;
      default:
        break;
    }
  }
  switch (id) {
    case 'traveler':
      return open ? DANCE_LAYOUT.after.traveler : DANCE_LAYOUT.traveler;
    case 'driver':
      return open ? DANCE_LAYOUT.after.driver : DANCE_LAYOUT.shelter;
    case 'dance-teacher':
      return open ? DANCE_LAYOUT.after.teacher : DANCE_LAYOUT.floor;
    case 'cicka':
      return open ? DANCE_LAYOUT.after.cicka : DANCE_LAYOUT.crates;
    case 'counterpart-cat':
      // Beside Cicka, exactly one paw apart.
      return open ? DANCE_LAYOUT.after.cat : DANCE_LAYOUT.crates + 0.036;
    case 'operations-helper':
      return DANCE_LAYOUT.operations;
    case 'steward':
      if (open) return DANCE_LAYOUT.after.steward;
      return requested(state) ? DANCE_LAYOUT.stewardAtGate : DANCE_LAYOUT.steward;
    default:
      return state.progress;
  }
}

/** Who the player is talking with, by conversation family. */
const CONVERSATION_PARTNER: readonly (readonly [string, RidgeActorId])[] = [
  ['dance.traveler', 'traveler'],
  ['dance.driver', 'driver'],
  ['dance.shuttle', 'driver'],
  ['dance.teacher', 'dance-teacher'],
  ['dance.lesson', 'dance-teacher'],
  ['dance.operations', 'operations-helper'],
  ['dance.steward', 'steward'],
  ['dance.setup', 'steward'],
  ['dance.cicka', 'cicka'],
  ['dance.cats', 'cicka']
];

function resolveDanceActors(state: RidgeWorldState): RidgeActorPresence[] {
  const lesson = state.mode === 'bachataLesson';
  // The lesson's reactions play out where it was danced; the plaza resets after.
  const lessonTalk = state.mode === 'conversation' && state.conversation?.id === 'dance.lesson.done';
  const serenade = state.mode === 'concertGig';
  const serenadeTalk = state.mode === 'conversation' && state.conversation?.id === 'dance.cats.serenade_done';
  const atLesson = lesson || lessonTalk;
  const open = cleared(state);
  const night = state.flags.has(DANCE_NIGHT_FLAG);
  const everyone = state.flags.has(DANCE_NIGHT_EVERYONE_FLAG);
  const hasGuitar = state.inventory.includes(RIDGE_GUITAR_ITEM);
  const rest = (id: RidgeActorId) => restingProgress(state, id);

  const partnerId = state.mode === 'conversation'
    ? CONVERSATION_PARTNER.find(([prefix]) => state.conversation?.id.startsWith(prefix))?.[1]
    : undefined;
  const playerProgress = atLesson
    ? DANCE_LAYOUT.lesson.player
    : serenade || serenadeTalk
      ? DANCE_LAYOUT.serenadePlayer
      : partnerId
        ? standBeside(state.progress, rest(partnerId))
        : state.progress;

  return [
    {
      id: 'player',
      label: 'You',
      progress: playerProgress,
      visible: true,
      facing: atLesson || serenade ? 'right' : state.facing,
      ...(serenade ? { prop: 'guitar-playing' as const } : hasGuitar ? { prop: 'guitar-back' as const } : {})
    },
    {
      id: 'traveler',
      label: 'Traveler',
      progress: rest('traveler'),
      visible: true,
      facing: 'right',
      // On her suitcase until she decides to stay; front row on it at night, until the second song.
      seated: night ? !everyone : !open
    },
    {
      id: 'driver',
      label: 'Driver',
      progress: atLesson ? DANCE_LAYOUT.lesson.driver : rest('driver'),
      visible: true,
      // At night he faces her across the floor.
      facing: night ? 'right' : atLesson || open ? 'left' : 'right'
    },
    {
      id: 'dance-teacher',
      label: 'Profe',
      progress: atLesson ? DANCE_LAYOUT.lesson.teacher : rest('dance-teacher'),
      visible: true,
      // At night she watches the floor from the operations table.
      facing: !night && (atLesson || open) ? 'right' : 'left'
    },
    {
      id: 'cicka',
      label: 'Cicka',
      progress: rest('cicka'),
      // She went up the hill with you; the night dance happens without her.
      visible: !night,
      facing: 'right'
    },
    {
      id: 'counterpart-cat',
      label: 'Quiet cat',
      // While you play he edges out from under the chairs toward Cicka.
      progress: serenade && !catOut(state) ? DANCE_LAYOUT.chairs : rest('counterpart-cat'),
      // Under the chairs until a song (or the open gate, or the dance) brings him out.
      visible: catOut(state) || open || night || serenade || serenadeTalk,
      facing: 'left'
    },
    {
      id: 'operations-helper',
      label: 'Operations',
      progress: rest('operations-helper'),
      visible: true,
      facing: 'left'
    },
    {
      id: 'steward',
      label: 'Steward',
      progress: rest('steward'),
      visible: true,
      facing: 'left'
    },
    {
      id: 'shuttle',
      label: 'Shuttle',
      progress: DANCE_LAYOUT.shuttle,
      visible: true,
      facing: 'right'
    }
  ];
}

// --- conversations --------------------------------------------------------

function gradeOf(state: RidgeWorldState, flagFor: (grade: GigGrade) => string): GigGrade {
  return GIG_GRADES.find((grade) => state.flags.has(flagFor(grade))) ?? 'good';
}

function resolveDanceConversation(
  conversationId: string,
  state: RidgeWorldState,
  catalog: DanceDialogueCatalog
): RidgeConversationDefinition | null {
  const kit = (prefix: string) => conversationKit<DanceSpeaker>(prefix, catalog);
  const flags = state.flags;

  // Each resident's topics persist once asked, across every talk with them.
  const topicsOf = (prefix: string, tag: string) => {
    const { choice } = kit(prefix);
    return (id: string, lines: readonly LineSpec[]) =>
      choice(id, lines, { then: 'menu', once: true, outcome: { setFlag: asked(`${tag}_${id}`) } });
  };
  const askedTopic = (tag: string, id: string) => flags.has(asked(`${tag}_${id}`));
  const unaskedTopics = (tag: string, ...choices: RidgeDialogueChoice[]) =>
    choices.filter((option) => !askedTopic(tag, option.id));

  switch (conversationId) {
    // ---- Traveler: the practical first read --------------------------------
    case 'dance.traveler.wayfinding': {
      const { say, choice } = kit(conversationId);
      const topic = topicsOf(conversationId, 'traveler');
      const first = !askedTopic('traveler', 'met');
      return {
        id: conversationId,
        lines: first
          ? [say(['01', 'prompt']), say(['02', 'traveler', 'curious'])]
          : [say(['again.01', 'traveler', 'playful'])],
        outcome: first ? { setFlag: asked('traveler_met') } : undefined,
        choices: [
          ...unaskedTopics(
            'traveler',
            topic('relay', [
              ['01', 'traveler'],
              ['02', 'traveler', 'playful']
            ]),
            topic('gate', [['01', 'traveler', 'thoughtful']]),
            topic('driver', [
              ['01', 'traveler'],
              ['02', 'traveler', 'playful']
            ]),
            topic('festival', [
              ['01', 'traveler'],
              ['02', 'traveler', 'playful']
            ]),
            topic('you', [
              ['01', 'traveler', 'thoughtful'],
              ['02', 'traveler', 'playful'],
              ['03', 'traveler', 'curious']
            ])
          ),
          choice('leave', [['01', 'traveler']])
        ]
      };
    }
    case 'dance.traveler.staying': {
      const { say, choice } = kit(conversationId);
      return {
        id: conversationId,
        lines: [say(['01', 'traveler', 'playful']), say(['02', 'traveler', 'thoughtful'])],
        choices: [choice('spot', [['01', 'traveler', 'playful']]), choice('enjoy', [['01', 'traveler']])]
      };
    }

    // ---- Hill-Shuttle Driver ----------------------------------------------
    case 'dance.driver.clipboard': {
      const { say, choice } = kit(conversationId);
      const topic = topicsOf(conversationId, 'driver');
      const first = !flags.has(FLAG_MET_DRIVER);
      const learn = choice(
        'learn',
        [
          ['01', 'hillShuttleDriver', 'surprised'],
          ['02', 'hillShuttleDriver', 'thoughtful'],
          ['03', 'hillShuttleDriver']
        ],
        { outcome: { setFlag: FLAG_LESSON_ASKED } }
      );
      const tease = choice('tease', [
        ['01', 'hillShuttleDriver', 'determined'],
        ['02', 'prompt']
      ], { choices: [learn] });
      const drop = choice('drop', [['01', 'hillShuttleDriver']]);
      return {
        id: conversationId,
        lines: first
          ? [say(['01', 'prompt']), say(['02', 'hillShuttleDriver', 'surprised'])]
          : [say(['again.01', 'hillShuttleDriver'])],
        choices: [
          ...unaskedTopics(
            'driver',
            topic('when', [
              ['01', 'hillShuttleDriver'],
              ['02', 'hillShuttleDriver', 'playful']
            ]),
            topic('list', [
              ['01', 'hillShuttleDriver'],
              ['02', 'hillShuttleDriver', 'thoughtful'],
              ['03', 'hillShuttleDriver', 'surprised']
            ])
          ),
          // The romance surfaces only once you've asked why the shuttle waits.
          ...(askedTopic('driver', 'when')
            ? [
                choice(
                  'dance',
                  [
                    ['01', 'hillShuttleDriver', 'playful'],
                    ['02', 'prompt'],
                    ['03', 'hillShuttleDriver', 'thoughtful']
                  ],
                  { choices: [learn, tease, drop] }
                )
              ]
            : []),
          choice('leave', [['01', 'hillShuttleDriver']])
        ],
        outcome: first ? { setFlag: FLAG_MET_DRIVER } : undefined
      };
    }
    case 'dance.driver.waiting_lesson': {
      const { say, choice } = kit(conversationId);
      return {
        id: conversationId,
        lines: [say(['01', 'hillShuttleDriver', 'surprised'])],
        choices: [
          choice('encourage', [['01', 'hillShuttleDriver', 'determined'], ['02', 'prompt']], {
            outcome: { setFlag: FLAG_ENCOURAGED }
          }),
          choice('looking', [['01', 'hillShuttleDriver', 'playful']])
        ]
      };
    }
    case 'dance.driver.practiced': {
      const { say, choice } = kit(conversationId);
      return {
        id: conversationId,
        lines: [say(['01', 'prompt']), say(['02', 'hillShuttleDriver', 'playful'])],
        choices: [
          choice('tonight', [
            ['01', 'hillShuttleDriver', 'surprised'],
            ['02', 'hillShuttleDriver', 'thoughtful']
          ]),
          choice('leave', [['01', 'hillShuttleDriver']])
        ]
      };
    }
    // The Folded Song Request: one dance, later, on paper.
    case 'dance.driver.request': {
      const { say, choice } = kit(conversationId);
      const simple = choice(
        'simple',
        [
          ['01', 'prompt'],
          ['02', 'hillShuttleDriver', 'thoughtful'],
          ['03', 'hillShuttleDriver']
        ],
        { outcome: { addItem: FOLDED_REQUEST_ITEM } }
      );
      const novel = choice('novel', [['01', 'hillShuttleDriver', 'surprised'], ['02', 'hillShuttleDriver']], {
        choices: [simple]
      });
      const sign = choice('sign', [['01', 'hillShuttleDriver', 'thoughtful']], { choices: [simple] });
      return {
        id: conversationId,
        lines: [
          say(['01', 'prompt']),
          say(['02', 'hillShuttleDriver', 'thoughtful']),
          say(['03', 'hillShuttleDriver'])
        ],
        choices: [
          choice(
            'write',
            [
              ['01', 'hillShuttleDriver', 'curious'],
              ['02', 'hillShuttleDriver', 'thoughtful'],
              ['03', 'prompt']
            ],
            { choices: [simple, novel, sign] }
          ),
          choice('later', [['01', 'hillShuttleDriver'], ['02', 'hillShuttleDriver', 'surprised']], {
            then: 'menu',
            once: true
          })
        ]
      };
    }
    case 'dance.driver.request_pending': {
      const { say } = kit(conversationId);
      return { id: conversationId, lines: [say(['01', 'hillShuttleDriver', 'surprised']), say(['02', 'prompt'])] };
    }
    case 'dance.driver.after_request': {
      const { say } = kit(conversationId);
      return {
        id: conversationId,
        lines: [
          say(['01', 'hillShuttleDriver', 'surprised']),
          say(['02', 'hillShuttleDriver', 'playful']),
          say(['03', 'hillShuttleDriver'])
        ]
      };
    }

    // ---- The Profe ---------------------------------------------------------
    case 'dance.teacher.floor': {
      const { say, choice } = kit(conversationId);
      const topic = topicsOf(conversationId, 'teacher');
      const first = !askedTopic('teacher', 'met');
      const startLesson = choice(
        'go',
        [
          ['01', 'danceTeacher', 'playful'],
          ['02', 'danceTeacher', 'determined']
        ],
        { outcome: { openBachataLesson: true } }
      );
      const lessonOffer =
        flags.has(FLAG_LESSON_ASKED) && !driverReady(state)
          ? [
              choice(
                'lesson',
                [
                  ['01', 'danceTeacher', 'playful'],
                  ['02', 'danceTeacher']
                ],
                { choices: [startLesson, choice('later', [['01', 'danceTeacher']])] }
              )
            ]
          : [];
      const watch =
        flags.has(FLAG_OPS_NEEDS_WATCH) && !flags.has(FLAG_TEACHER_WATCH) && !opsReady(state)
          ? [
              choice(
                'watch',
                [
                  ['01', 'danceTeacher', 'surprised'],
                  ['02', 'danceTeacher', 'playful'],
                  ['03', 'danceTeacher', 'determined']
                ],
                { then: 'menu', once: true, outcome: { setFlag: FLAG_TEACHER_WATCH } }
              )
            ]
          : [];
      const again = driverReady(state)
        ? [choice('again', [['01', 'danceTeacher', 'playful']], { outcome: { openBachataLesson: true } })]
        : [];
      // Only once you have met both of them, so "those two" means somebody.
      const metBoth = flags.has(FLAG_MET_DRIVER) && flags.has(FLAG_MET_OPS);
      return {
        id: conversationId,
        lines: first
          ? [say(['01', 'prompt']), say(['02', 'danceTeacher', 'playful'])]
          : [say([cleared(state) ? 'after.01' : 'back.01', 'danceTeacher', 'playful'])],
        choices: [
          ...lessonOffer,
          ...watch,
          ...unaskedTopics(
            'teacher',
            topic('what', [
              ['01', 'danceTeacher'],
              ['02', 'danceTeacher', 'thoughtful']
            ]),
            topic('teach', [
              ['01', 'danceTeacher', 'playful'],
              ['02', 'danceTeacher'],
              ['03', 'prompt']
            ]),
            ...(metBoth
              ? [
                  topic('couple', [
                    ['01', 'danceTeacher', 'thoughtful'],
                    ['02', 'danceTeacher', 'playful']
                  ])
                ]
              : [])
          ),
          ...again,
          choice('leave', [['01', 'danceTeacher', 'playful']])
        ],
        outcome: first ? { setFlag: asked('teacher_met') } : undefined
      };
    }
    case 'dance.lesson.done': {
      const { say } = kit(conversationId);
      const grade = gradeOf(state, danceGradeFlag);
      const replay = flags.has(FLAG_DRIVER) || requested(state);
      const driverMood = grade === 'rough' ? 'surprised' : grade === 'legendary' ? 'surprised' : 'playful';
      return {
        id: conversationId,
        lines: [
          say([`teacher.${grade}`, 'danceTeacher', grade === 'rough' ? 'thoughtful' : 'playful']),
          say([`driver.${grade}`, 'hillShuttleDriver', driverMood]),
          ...(replay
            ? [say(['again.01', 'danceTeacher'])]
            : [say(['01', 'hillShuttleDriver', 'thoughtful']), say(['02', 'prompt'])])
        ],
        outcome: replay ? undefined : { setFlag: FLAG_DRIVER }
      };
    }

    // ---- Last-Stop Operations Helper ---------------------------------------
    case 'dance.operations.table': {
      const { say, choice } = kit(conversationId);
      const topic = topicsOf(conversationId, 'ops');
      const first = !flags.has(FLAG_MET_OPS);
      const watch = choice(
        'watch',
        [
          ['01', 'operationsHelper', 'thoughtful'],
          ['02', 'operationsHelper']
        ],
        { outcome: { setFlag: FLAG_OPS_NEEDS_WATCH } }
      );
      const askHim = choice(
        'ask',
        [
          ['01', 'operationsHelper', 'surprised'],
          ['02', 'prompt'],
          ['03', 'operationsHelper', 'determined']
        ],
        { outcome: { setFlag: FLAG_OPS_CHECKED } }
      );
      const count = choice(
        'count',
        [
          ['01', 'prompt'],
          ['02', 'operationsHelper', 'thoughtful'],
          ['03', 'operationsHelper', 'thoughtful'],
          ['04', 'prompt']
        ],
        { choices: [watch, askHim] }
      );
      const stamp = choice('stamp', [['01', 'prompt'], ['02', 'operationsHelper']], { choices: [count] });
      const tug = choice('tug', [['01', 'prompt'], ['02', 'operationsHelper']], { choices: [stamp] });

      const checklist =
        !flags.has(FLAG_OPS_CHECKED) && !flags.has(FLAG_OPS_NEEDS_WATCH)
          ? [choice('help', [['01', 'operationsHelper', 'curious'], ['02', 'operationsHelper']], { choices: [tug] })]
          : [];
      const tonight =
        flags.has(FLAG_OPS_CHECKED) && !flags.has(FLAG_OPS_NEEDS_WATCH)
          ? [choice('tonight', [['01', 'operationsHelper', 'thoughtful']], { choices: [watch] })]
          : [];
      const watchKept =
        flags.has(FLAG_TEACHER_WATCH) && !opsReady(state)
          ? [
              choice(
                'kept',
                [
                  ['01', 'operationsHelper', 'surprised'],
                  ['02', 'operationsHelper', 'thoughtful'],
                  ['03', 'operationsHelper', 'playful'],
                  ['04', 'prompt']
                ],
                { outcome: { setFlag: FLAG_OPS } }
              )
            ]
          : [];
      const drop = state.inventory.includes(FOLDED_REQUEST_ITEM)
        ? [
            choice(
              'drop',
              [
                ['01', 'prompt'],
                ['02', 'operationsHelper', 'curious'],
                ['03', 'prompt'],
                ['04', 'operationsHelper', 'thoughtful'],
                ['05', 'prompt'],
                ['06', 'operationsHelper'],
                ['07', 'shuttleRadio'],
                ['08', 'operationsHelper', 'thoughtful'],
                ['09', 'operationsHelper', 'playful'],
                ['10', 'shuttleRadio'],
                ['11', 'prompt'],
                ['12', 'operationsHelper', 'surprised']
              ],
              {
                outcome: { removeItem: FOLDED_REQUEST_ITEM, setBeat: 'dance_ready', setFlag: FLAG_SONG_FOLDED }
              }
            )
          ]
        : [];
      return {
        id: conversationId,
        lines: first
          ? [say(['01', 'prompt']), say(['02', 'operationsHelper', 'surprised'])]
          : [say([opsReady(state) ? 'ready.01' : 'again.01', 'operationsHelper', opsReady(state) ? 'playful' : 'curious'])],
        choices: [
          ...drop,
          ...watchKept,
          ...checklist,
          ...tonight,
          ...unaskedTopics(
            'ops',
            topic('job', [
              ['01', 'operationsHelper'],
              ['02', 'operationsHelper', 'determined']
            ]),
            topic('jar', [
              ['01', 'operationsHelper'],
              ['02', 'operationsHelper', 'playful']
            ])
          ),
          choice('leave', [['01', 'operationsHelper', 'playful']])
        ],
        outcome: first ? { setFlag: FLAG_MET_OPS } : undefined
      };
    }
    case 'dance.operations.after': {
      const { say, choice } = kit(conversationId);
      return {
        id: conversationId,
        lines: [say([cleared(state) ? 'open.01' : '01', 'operationsHelper', 'playful'])],
        choices: [
          choice('happy', [['01', 'operationsHelper', 'determined'], ['02', 'operationsHelper', 'playful']]),
          choice('leave', [['01', 'operationsHelper']])
        ]
      };
    }

    // ---- Festival Steward and the gate -------------------------------------
    case 'dance.steward.gate': {
      const { say, choice } = kit(conversationId);
      const topic = topicsOf(conversationId, 'steward');
      // Only once you have met both of them, so "those two" means somebody.
      const metBoth = flags.has(FLAG_MET_DRIVER) && flags.has(FLAG_MET_OPS);
      return {
        id: conversationId,
        lines: [say(['01', 'festivalSteward', 'determined'])],
        choices: [
          ...unaskedTopics(
            'steward',
            topic('why', [
              ['01', 'festivalSteward'],
              ['02', 'festivalSteward', 'playful']
            ]),
            topic('open', [['01', 'festivalSteward', 'determined']]),
            ...(metBoth
              ? [
                  topic('couple', [
                    ['01', 'festivalSteward', 'thoughtful'],
                    ['02', 'festivalSteward']
                  ])
                ]
              : [])
          ),
          choice('leave', [['01', 'festivalSteward']])
        ]
      };
    }
    case 'dance.gate.look': {
      const { say } = kit(conversationId);
      return { id: conversationId, lines: [say(['01', 'prompt']), say(['02', 'prompt'])] };
    }
    // Setup Clearance: two jobs on the lane, then the sign. Each one shows on the plaza as it lands.
    case 'dance.steward.clearance': {
      const { say, choice } = kit(conversationId);
      const lanterns = flags.has(FLAG_SNAP_LANTERNS);
      const cables = flags.has(FLAG_SNAP_CABLES);
      const briefed = askedTopic('steward', 'brief');
      if (!lanterns || !cables) {
        return {
          id: conversationId,
          lines: [
            ...(briefed
              ? [say(['again.01', 'festivalSteward'])]
              : [say(['01', 'festivalSteward', 'playful']), say(['02', 'festivalSteward', 'determined'])]),
            ...(lanterns ? [] : [say(['todo.lanterns', 'festivalSteward'])]),
            ...(cables ? [] : [say(['todo.cables', 'festivalSteward'])])
          ],
          choices: [choice('later', [['01', 'festivalSteward']])],
          outcome: briefed ? undefined : { setFlag: asked('steward_brief') }
        };
      }
      const sign = choice(
        'sign',
        [
          ['01', 'prompt'],
          ['02', 'festivalSteward', 'determined'],
          ['03', 'prompt']
        ],
        { outcome: { setBeat: 'dance_cleared' } }
      );
      const party = choice('party', [['01', 'prompt'], ['02', 'festivalSteward', 'playful']], {
        then: 'menu',
        once: true
      });
      return {
        id: conversationId,
        lines: [say(['ready.01', 'festivalSteward', 'playful']), say(['ready.02', 'festivalSteward'])],
        choices: [party, sign, choice('later', [['01', 'festivalSteward']])]
      };
    }
    // The lantern line: three hooks, and only one clears a shuttle with crates on its roof.
    case 'dance.setup.lanterns': {
      const { say, choice } = kit(conversationId);
      return {
        id: conversationId,
        lines: [say([flags.has(FLAG_LANTERNS_MID) ? '01_mid' : '01', 'prompt'])],
        choices: [
          choice('low', [['01', 'prompt'], ['02', 'festivalSteward', 'playful']], { then: 'menu', once: true }),
          choice('middle', [['01', 'prompt'], ['02', 'festivalSteward', 'thoughtful']], {
            then: 'menu',
            once: true,
            outcome: { setFlag: FLAG_LANTERNS_MID }
          }),
          choice('top', [['01', 'prompt'], ['02', 'prompt']], { outcome: { setFlag: FLAG_SNAP_LANTERNS } }),
          choice('leave', [['01', 'prompt']])
        ]
      };
    }
    // The cable run: tyres eat tape, and the speakers need their cables.
    case 'dance.setup.cables': {
      const { say, choice } = kit(conversationId);
      return {
        id: conversationId,
        lines: [say(['01', 'prompt'])],
        choices: [
          choice('tape', [['01', 'prompt'], ['02', 'festivalSteward']], { then: 'menu', once: true }),
          choice(
            'unplug',
            [
              ['01', 'prompt'],
              ['02', 'danceTeacher', 'surprised'],
              ['03', 'prompt']
            ],
            { then: 'menu', once: true }
          ),
          choice('ramp', [['01', 'prompt'], ['02', 'festivalSteward', 'playful']], {
            outcome: { setFlag: FLAG_SNAP_CABLES }
          }),
          choice('leave', [['01', 'prompt']])
        ]
      };
    }
    case 'dance.steward.after': {
      const { say } = kit(conversationId);
      return { id: conversationId, lines: [say(['01', 'festivalSteward', 'playful'])] };
    }

    // ---- Cicka and the quiet cat -------------------------------------------
    case 'dance.cicka.crates': {
      const { say, choice } = kit(conversationId);
      return {
        id: conversationId,
        lines: [say(['01', 'prompt'])],
        choices: [
          choice('pet', [['01', 'cicka', 'sleepy'], ['02', 'prompt']], { then: 'menu', once: true }),
          choice('look', [['01', 'prompt'], ['02', 'prompt']], {
            then: 'menu',
            once: true,
            outcome: { setFlag: FLAG_CAT_SEEN }
          }),
          choice('leave', [['01', 'prompt']])
        ]
      };
    }
    case 'dance.cats.chairs': {
      const { say, choice } = kit(conversationId);
      const play = state.inventory.includes(RIDGE_GUITAR_ITEM)
        ? [choice('play', [['01', 'prompt'], ['02', 'prompt']], { outcome: { openConcertGig: 'serenade' } })]
        : [];
      return {
        id: conversationId,
        lines: [say([flags.has(FLAG_CAT_SEEN) ? '01_seen' : '01', 'prompt'])],
        choices: [
          ...play,
          choice('coax', [['01', 'counterpartCat', 'determined'], ['02', 'prompt']], { then: 'menu', once: true }),
          choice('call', [['01', 'prompt']], { then: 'menu', once: true }),
          choice('leave', [['01', 'prompt']])
        ]
      };
    }
    case 'dance.cats.serenade_done': {
      const { say } = kit(conversationId);
      const grade = gradeOf(state, serenadeGradeFlag);
      return {
        id: conversationId,
        lines: [
          say(['01', 'prompt']),
          say([grade === 'rough' ? 'rough.01' : 'warm.01', 'prompt']),
          say(['02', 'counterpartCat', 'curious']),
          say(['03', 'cicka', 'sleepy']),
          say(['04', 'prompt'])
        ],
        outcome: { setFlag: FLAG_CAT_OUT }
      };
    }
    case 'dance.cats.together': {
      const { say, choice } = kit(conversationId);
      return {
        id: conversationId,
        lines: [say(['01', 'prompt'])],
        choices: [
          choice('pet', [['01', 'cicka', 'sleepy'], ['02', 'prompt']]),
          choice('encore', [['01', 'prompt']], { outcome: { openConcertGig: 'serenade' } }),
          choice('leave', [['01', 'prompt']])
        ]
      };
    }
    case 'dance.cats.gate': {
      const { say } = kit(conversationId);
      return {
        id: conversationId,
        lines: [
          say(['01', 'prompt']),
          say([catOut(state) ? 'together.01' : 'apart.01', 'prompt']),
          say(['02', 'cicka', 'curious'])
        ]
      };
    }

    // ---- The last daylight ride -------------------------------------------
    case 'dance.shuttle.last_daylight_ride': {
      const { say, choice } = kit(conversationId);
      return {
        id: conversationId,
        lines: [say(['01', 'hillShuttleDriver', 'playful'])],
        choices: [
          choice(
            'board',
            [
              ['01', 'opsRadio'],
              ['02', 'opsRadio'],
              ['03', 'hillShuttleDriver', 'thoughtful'],
              ['04', 'prompt'],
              ['05', 'prompt']
            ],
            { outcome: { handoffToArea: 'relay' } }
          ),
          choice('wait', [['01', 'hillShuttleDriver']])
        ]
      };
    }
    default:
      return null;
  }
}

function describeDanceAmbience(state: RidgeWorldState): string {
  if (state.mode === 'bachataLesson') {
    return 'Behind the shuttle shelter. One, two, three, tap. Five, six, seven, tap.';
  }
  if (state.mode === 'concertGig') {
    return 'Under the lanterns, a soft requinto line for someone hiding under the chairs.';
  }
  if (cleared(state)) {
    return 'The gate is open and the sky has gone gold. The last daylight shuttle idles beyond it.';
  }
  if (requested(state)) {
    return 'A folded request sits in the jar. Ink tags mark the last setup jobs on the lane; the steward waits at the gate.';
  }
  if (bothReady(state)) {
    return 'He has one step. She has someone to keep watch. Neither of them has said a word to the other.';
  }
  if (driverReady(state)) {
    return 'The driver practises under his clipboard. The operations table is still re-counting lanterns.';
  }
  if (opsReady(state)) {
    return 'Ops has set the radio down. At the shelter, the driver still reads the same clipboard line.';
  }
  return 'Last-Stop Plaza, daytime setup for tonight\'s bachata. The service road to the Relay hill is closed.';
}
