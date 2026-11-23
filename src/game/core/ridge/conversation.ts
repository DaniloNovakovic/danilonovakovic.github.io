// Outcome application branches across inventory/flags/handoffs by design.
// fallow-ignore-file complexity
import type {
  RidgeConversationDefinition,
  RidgeConversationOutcome,
  RidgeConversationState,
  RidgeDialogueChoice,
  RidgeSessionEvent,
  RidgeWorldState
} from './types';

export function startConversation(
  state: RidgeWorldState,
  definition: RidgeConversationDefinition
): { state: RidgeWorldState; events: RidgeSessionEvent[] } {
  const conversation: RidgeConversationState = {
    id: definition.id,
    lineIndex: 0,
    lines: definition.lines,
    choices: definition.choices ?? null,
    awaitingChoice: false,
    outcome: definition.outcome ?? null,
    menu: definition.choices ?? null,
    asked: []
  };

  return {
    state: {
      ...state,
      mode: 'conversation',
      conversation,
      lastMessage: `Talking: ${definition.id}`
    },
    events: [{ type: 'conversation_started', conversationId: definition.id }]
  };
}

export function advanceConversation(state: RidgeWorldState): {
  state: RidgeWorldState;
  events: RidgeSessionEvent[];
  message: string;
} {
  const conversation = state.conversation;
  if (!conversation) {
    return {
      state,
      events: [],
      message: 'No active conversation.'
    };
  }

  if (conversation.awaitingChoice) {
    return {
      state,
      events: [],
      message: 'A choice is waiting. Use: choose <number|id>'
    };
  }

  const nextIndex = conversation.lineIndex + 1;
  if (nextIndex < conversation.lines.length) {
    return {
      state: {
        ...state,
        conversation: { ...conversation, lineIndex: nextIndex },
        lastMessage: null
      },
      events: [],
      message: '...'
    };
  }

  if (conversation.choices && conversation.choices.length > 0) {
    return {
      state: {
        ...state,
        conversation: { ...conversation, awaitingChoice: true },
        lastMessage: 'Choose a reply.'
      },
      events: [],
      message: 'Choose a reply.'
    };
  }

  return finishConversation(state, conversation.outcome);
}

export function chooseInConversation(
  state: RidgeWorldState,
  choiceIdOrIndex: string
): { state: RidgeWorldState; events: RidgeSessionEvent[]; message: string } {
  const conversation = state.conversation;
  if (!conversation?.awaitingChoice || !conversation.choices) {
    return {
      state,
      events: [],
      message: 'No conversation choice is available.'
    };
  }

  const choice = resolveChoice(conversation.choices, choiceIdOrIndex);
  if (!choice) {
    return {
      state,
      events: [],
      message: `Unknown choice "${choiceIdOrIndex}".`
    };
  }

  const asked = choice.once ? [...conversation.asked, choice.id] : conversation.asked;
  const returnsToMenu = choice.then === 'menu';
  let next: RidgeWorldState = state;
  const events: RidgeSessionEvent[] = [];
  let pendingOutcome = choice.outcome ?? conversation.outcome;

  // Topic choices land their consequences now: the talk keeps going.
  if (returnsToMenu) {
    pendingOutcome = conversation.outcome;
    if (choice.outcome) {
      const applied = applyOutcome(next, choice.outcome);
      next = applied.state;
      events.push(...applied.events);
    }
  }

  const followUp =
    choice.choices && choice.choices.length > 0
      ? choice.choices
      : returnsToMenu
        ? visibleMenu(conversation.menu, asked)
        : null;

  if (choice.lines && choice.lines.length > 0) {
    return {
      state: {
        ...next,
        conversation: {
          ...conversation,
          lineIndex: 0,
          lines: choice.lines,
          choices: followUp,
          awaitingChoice: false,
          outcome: pendingOutcome,
          asked
        },
        lastMessage: choice.label
      },
      events,
      message: choice.label
    };
  }

  if (followUp) {
    return {
      state: {
        ...next,
        conversation: {
          ...conversation,
          choices: followUp,
          awaitingChoice: true,
          outcome: pendingOutcome,
          asked
        },
        lastMessage: choice.label
      },
      events,
      message: choice.label
    };
  }

  const finished = finishConversation(next, pendingOutcome);
  return { ...finished, events: [...events, ...finished.events] };
}

/** The topic menu minus `once` topics already asked; null when nothing is left. */
function visibleMenu(
  menu: readonly RidgeDialogueChoice[] | null,
  asked: readonly string[]
): readonly RidgeDialogueChoice[] | null {
  if (!menu) return null;
  const remaining = menu.filter((choice) => !asked.includes(choice.id));
  return remaining.length > 0 ? remaining : null;
}

export function leaveConversation(state: RidgeWorldState): {
  state: RidgeWorldState;
  events: RidgeSessionEvent[];
  message: string;
} {
  if (!state.conversation) {
    return { state, events: [], message: 'No active conversation.' };
  }
  const conversationId = state.conversation.id;
  return {
    state: {
      ...state,
      mode: 'explore',
      conversation: null,
      lastMessage: 'You step back.'
    },
    events: [{ type: 'conversation_ended', conversationId }],
    message: 'You step back.'
  };
}

function finishConversation(
  state: RidgeWorldState,
  outcome: RidgeConversationOutcome | null
): { state: RidgeWorldState; events: RidgeSessionEvent[]; message: string } {
  const conversationId = state.conversation?.id ?? 'unknown';
  let next: RidgeWorldState = {
    ...state,
    mode: 'explore',
    conversation: null,
    lastMessage: 'Conversation ended.'
  };
  const events: RidgeSessionEvent[] = [{ type: 'conversation_ended', conversationId }];

  if (outcome) {
    const applied = applyOutcome(next, outcome);
    next = applied.state;
    events.push(...applied.events);
  }

  return {
    state: next,
    events,
    message: next.lastMessage ?? 'Conversation ended.'
  };
}

function applyOutcome(
  state: RidgeWorldState,
  outcome: RidgeConversationOutcome
): { state: RidgeWorldState; events: RidgeSessionEvent[] } {
  const events: RidgeSessionEvent[] = [];
  const flags = new Set(state.flags);

  if (outcome.setFlag) {
    flags.add(outcome.setFlag);
    events.push({ type: 'flag_changed', flag: outcome.setFlag, present: true });
  }
  if (outcome.clearFlag) {
    flags.delete(outcome.clearFlag);
    events.push({ type: 'flag_changed', flag: outcome.clearFlag, present: false });
  }

  let inventory = state.inventory;
  if (outcome.addItem && !inventory.includes(outcome.addItem)) {
    inventory = [...inventory, outcome.addItem];
    events.push({ type: 'item_added', itemId: outcome.addItem });
  }
  if (outcome.removeItem && inventory.includes(outcome.removeItem)) {
    inventory = inventory.filter((item) => item !== outcome.removeItem);
    events.push({ type: 'item_removed', itemId: outcome.removeItem });
  }

  let beat = state.beat;
  if (outcome.setBeat) {
    beat = outcome.setBeat;
    events.push({ type: 'beat_changed', beat: outcome.setBeat });
  }

  if (outcome.handoffToArea) {
    events.push({ type: 'area_handoff', areaId: outcome.handoffToArea });
  }

  if (outcome.routeReset) {
    events.push({ type: 'route_reset' });
  }

  if (outcome.openBridgeBuild) {
    events.push({ type: 'bridge_build_opened' });
  }

  if (outcome.openCickaDuel) {
    events.push({ type: 'cicka_duel_opened' });
  }

  if (outcome.openConcertGig) {
    events.push({ type: 'concert_gig_opened', mode: outcome.openConcertGig });
  }

  if (outcome.openBachataLesson) {
    events.push({ type: 'bachata_lesson_opened' });
  }

  return {
    state: {
      ...state,
      flags,
      inventory,
      beat,
      lastMessage: describeOutcome(outcome)
    },
    events
  };
}

function describeOutcome(outcome: RidgeConversationOutcome): string {
  const parts: string[] = [];
  if (outcome.addItem) parts.push(`Got: ${outcome.addItem}`);
  if (outcome.removeItem) parts.push(`Left: ${outcome.removeItem}`);
  if (outcome.setBeat) parts.push(`Beat -> ${outcome.setBeat}`);
  if (outcome.handoffToArea) parts.push(`Handoff -> ${outcome.handoffToArea}`);
  if (outcome.routeReset) parts.push('Route resets to Bridge');
  return parts.length > 0 ? parts.join(' | ') : 'Conversation ended.';
}

function resolveChoice(
  choices: readonly RidgeDialogueChoice[],
  choiceIdOrIndex: string
): RidgeDialogueChoice | undefined {
  const asIndex = Number.parseInt(choiceIdOrIndex, 10);
  if (!Number.isNaN(asIndex) && asIndex >= 1 && asIndex <= choices.length) {
    return choices[asIndex - 1];
  }
  return choices.find((choice) => choice.id === choiceIdOrIndex);
}
