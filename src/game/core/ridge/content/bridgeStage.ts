// Bridge content resolvers encode beat-specific actor presence; branching is data policy.
// fallow-ignore-file complexity
import type { BridgeBuildTip } from '../bridgeBuilder';
import type {
  RidgeActorPresence,
  RidgeConversationDefinition,
  RidgeConversationOutcome,
  RidgeDialogueChoice,
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
  'wobbly',
  'steady',
  'testing',
  'no_road',
  'bare_deck',
  'loose_frame',
  'hanging_joint',
  'snapped_middle',
  'snapped_end',
  'stuck',
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
    describeBridgeTip: (tip, context) => describeBridgeTip(catalog, tip, context)
  };
}

/**
 * A remark may have alternates at `<key>.2`, `<key>.3`, …; retries rotate
 * through them so the Draftsperson reacts instead of repeating a manual.
 */
function describeBridgeTip(
  catalog: BridgeDialogueCatalog,
  tip: BridgeBuildTip,
  context: { variant: number; sketchNudge: boolean }
): string {
  const base = `bridge.builder.tip.${BRIDGE_TIP_IDS.includes(tip) ? tip : 'drawing'}`;
  const phrasings = [base];
  while (catalog.lines[`${base}.${phrasings.length + 1}`]) {
    phrasings.push(`${base}.${phrasings.length + 1}`);
  }
  const line = catalog.lines[phrasings[context.variant % phrasings.length]!] ?? tip;
  const nudge = context.sketchNudge ? catalog.lines['bridge.builder.tip.sketch_nudge'] : undefined;
  return nudge ? `${line} ${nudge}` : line;
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
          spotId: 'cicka',
          conversationId: 'bridge.cicka.after_share',
          prompt: 'bridge.cicka.after_share.prompt'
        },
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

type BridgeSpeaker = keyof BridgeDialogueCatalog['speakers'];
type BridgeLineSpec = readonly [suffix: string, speaker: BridgeSpeaker, emotion?: RidgeEmotion];

/** Set once the player has met Cicka at least once. */
const FLAG_CICKA_MET = 'bridge_cicka_met';
/** The player tried to take the car and got the paw. Colors later lines. */
const FLAG_CICKA_GUARDED = 'bridge_cicka_guarded_car';
/** Draftsperson topics stay asked across visits. */
const askedFlag = (topic: string) => `bridge_asked_${topic}`;

/**
 * Small authoring kit for one conversation: lines live at `<conv>.<suffix>`,
 * choice labels at `<conv>.choice.<id>`, and choice lines at `<conv>.<id>.<nn>`.
 */
function conversationKit(conversationId: string, catalog: BridgeDialogueCatalog) {
  const say = ([suffix, speaker, emotion]: BridgeLineSpec) =>
    makeLine(catalog, `${conversationId}.${suffix}`, speaker, emotion);
  const choice = (
    id: string,
    lines: readonly BridgeLineSpec[],
    extra: Omit<RidgeDialogueChoice, 'id' | 'label' | 'lines'> = {}
  ): RidgeDialogueChoice => ({
    id,
    label: catalog.lines[`${conversationId}.choice.${id}`] ?? id,
    ...(lines.length > 0 ? { lines: lines.map(([suffix, ...rest]) => say([`${id}.${suffix}`, ...rest])) } : {}),
    ...extra
  });
  return { say, choice };
}

function resolveBridgeConversation(
  conversationId: string,
  state: RidgeWorldState,
  catalog: BridgeDialogueCatalog
): RidgeConversationDefinition | null {
  const { say, choice } = conversationKit(conversationId, catalog);
  const met: RidgeConversationOutcome = { setFlag: FLAG_CICKA_MET };
  const guarded: RidgeConversationOutcome = { setFlag: FLAG_CICKA_GUARDED };
  const topic = (id: string, lines: readonly BridgeLineSpec[], outcome?: RidgeConversationOutcome) =>
    choice(id, lines, { then: 'menu', once: true, outcome: outcome ?? { setFlag: askedFlag(id) } });
  const unasked = (...choices: RidgeDialogueChoice[]) =>
    choices.filter((option) => !state.flags.has(askedFlag(option.id)));

  switch (conversationId) {
    // Toy Car Play: a first hello. Reaching for the car is allowed, and teaches.
    case 'bridge.cicka.first_meet':
      return {
        id: conversationId,
        lines: [say(['01', 'prompt']), say(['02', 'cicka']), say(['03', 'prompt'])],
        choices: [
          choice('pet', [['01', 'cicka', 'playful'], ['02', 'prompt']], { then: 'menu', once: true, outcome: met }),
          choice('watch', [['01', 'prompt']], { then: 'menu', once: true, outcome: met }),
          choice('reach', [['01', 'prompt'], ['02', 'cicka', 'determined'], ['03', 'prompt']], {
            then: 'menu',
            once: true,
            outcome: guarded
          }),
          choice('leave', [['01', 'prompt']])
        ],
        outcome: met
      };

    // Cicka Parallel Play: grabbing and asking bounce off; joining her game wins.
    case 'bridge.cicka.parallel_play': {
      const rollAgain = choice(
        'roll_again',
        [['01', 'prompt'], ['02', 'cicka', 'playful'], ['03', 'prompt'], ['04', 'prompt']],
        { outcome: { setBeat: 'toy_car_shared', addItem: RIDGE_TOY_CAR_ITEM, setFlag: 'toy_car_shared' } }
      );
      const keep = choice('keep', [['01', 'prompt'], ['02', 'prompt']], { then: 'menu' });
      const roll = choice('roll', [['01', 'prompt'], ['02', 'cicka', 'curious'], ['03', 'prompt']], {
        choices: [rollAgain, keep]
      });
      const pocket = choice('pocket', [['01', 'prompt']], { then: 'menu', outcome: guarded });
      return {
        id: conversationId,
        lines: [say(['01', 'prompt']), say(['02', 'prompt'])],
        choices: [
          choice('grab', [['01', 'prompt'], ['02', 'cicka', 'determined']], { then: 'menu', outcome: guarded }),
          choice('ask', [['01', 'prompt']], { then: 'menu', once: true }),
          choice('leaf', [['01', 'prompt'], ['02', 'prompt']], { choices: [pocket, roll] }),
          choice('leave', [['01', 'prompt']])
        ]
      };
    }

    case 'bridge.cicka.after_share':
      return {
        id: conversationId,
        lines: [say(['01', 'prompt'])],
        choices: [choice('pet', [['01', 'cicka', 'sleepy']]), choice('promise', [['01', 'prompt']])]
      };

    // The Draftsperson is a little topic menu, not a cutscene.
    case 'bridge.draftsperson.missing_span': {
      const who = topic('who', [['01', 'bridgeDraftsperson', 'playful']]);
      const why = topic('why', [
        ['01', 'bridgeDraftsperson'],
        ['02', 'bridgeDraftsperson', 'thoughtful']
      ]);
      if (state.beat === 'intro') {
        const car = topic(
          'car',
          [
            ['01', 'bridgeDraftsperson', 'playful'],
            ['02', 'bridgeDraftsperson', 'surprised'],
            [state.flags.has(FLAG_CICKA_MET) || state.flags.has(FLAG_CICKA_GUARDED) ? '03_cat' : '03', 'prompt']
          ],
          { setBeat: 'needs_toy_car' }
        );
        return {
          id: conversationId,
          lines: [say(['01', 'bridgeDraftsperson', 'thoughtful']), say(['02', 'bridgeDraftsperson'])],
          choices: [car, ...unasked(who, why), choice('leave', [['01', 'bridgeDraftsperson']])]
        };
      }
      const cickaHasIt = topic('cicka', [
        [state.flags.has(FLAG_CICKA_GUARDED) ? '01_guarded' : '01', 'bridgeDraftsperson', 'surprised'],
        ['02', 'bridgeDraftsperson', 'thoughtful']
      ]);
      return {
        id: conversationId,
        lines: [say(['waiting', 'bridgeDraftsperson', 'curious'])],
        choices: [
          ...unasked(cickaHasIt, who, why),
          choice('still_looking', [['01', 'bridgeDraftsperson']])
        ]
      };
    }

    case 'bridge.draftsperson.toy_car_test': {
      // Coming back to an unfinished drawing: the table is one choice away.
      if (state.flags.has(BRIDGE_BUILD_STARTED_FLAG)) {
        return {
          id: conversationId,
          lines: [say(['resume', 'bridgeDraftsperson', 'determined'])],
          choices: [
            choice('resume', [], { outcome: { openBridgeBuild: true } }),
            choice('advice', [['01', 'bridgeDraftsperson'], ['02', 'bridgeDraftsperson', 'playful']], {
              then: 'menu',
              once: true
            }),
            choice('later', [['01', 'bridgeDraftsperson']])
          ]
        };
      }
      return {
        id: conversationId,
        lines: [say(['01', 'prompt']), say(['02', 'bridgeDraftsperson', 'surprised'])],
        choices: [
          choice(
            'hand_over',
            [
              ['01', 'bridgeDraftsperson', 'thoughtful'],
              ['02', 'bridgeDraftsperson', 'curious'],
              ['03', 'prompt']
            ],
            { outcome: { openBridgeBuild: true } }
          ),
          ...unasked(
            topic('story', [
              ['01', 'bridgeDraftsperson', 'surprised'],
              ['02', 'bridgeDraftsperson', 'thoughtful']
            ])
          ),
          choice('not_yet', [['01', 'bridgeDraftsperson']])
        ]
      };
    }
    case 'bridge.draftsperson.bridge_built':
      return {
        id: conversationId,
        lines: [
          say(['01', 'prompt']),
          say(['02', 'bridgeDraftsperson', 'surprised']),
          say(['03', 'bridgeDraftsperson', 'playful']),
          say(['04', 'prompt'])
        ]
      };
    case 'bridge.exit.opened_crossing':
      return {
        id: conversationId,
        lines: [say(['01', 'prompt']), say(['02', 'bridgeDraftsperson']), say(['03', 'prompt'])],
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
  speakerId: BridgeSpeaker,
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

