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
    outcome: definition.outcome ?? null
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

export function advanceConversation(
  state: RidgeWorldState
): { state: RidgeWorldState; events: RidgeSessionEvent[]; message: string } {
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

  if (choice.lines && choice.lines.length > 0) {
    return {
      state: {
        ...state,
        conversation: {
          id: conversation.id,
          lineIndex: 0,
          lines: choice.lines,
          choices: null,
          awaitingChoice: false,
          outcome: choice.outcome ?? conversation.outcome
        },
        lastMessage: choice.label
      },
      events: [],
      message: choice.label
    };
  }

  return finishConversation(state, choice.outcome ?? conversation.outcome);
}

export function leaveConversation(
  state: RidgeWorldState
): { state: RidgeWorldState; events: RidgeSessionEvent[]; message: string } {
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
  const events: RidgeSessionEvent[] = [
    { type: 'conversation_ended', conversationId }
  ];

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
  let next = state;
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

  let beat = state.beat;
  if (outcome.setBeat) {
    beat = outcome.setBeat;
    events.push({ type: 'beat_changed', beat: outcome.setBeat });
  }

  if (outcome.concertHandoff) {
    beat = 'concert_handoff';
    events.push({ type: 'concert_handoff' });
  }

  next = {
    ...state,
    flags,
    inventory,
    beat,
    areaId: outcome.concertHandoff ? 'concert' : state.areaId,
    lastMessage: describeOutcome(outcome)
  };

  return { state: next, events };
}

function describeOutcome(outcome: RidgeConversationOutcome): string {
  const parts: string[] = [];
  if (outcome.addItem) parts.push(`Got: ${outcome.addItem}`);
  if (outcome.setBeat) parts.push(`Beat -> ${outcome.setBeat}`);
  if (outcome.concertHandoff) parts.push('Handoff -> concert');
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
