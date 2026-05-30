export const BRIDGE_DIALOGUE_CONVERSATION_IDS = [
  'bridge.cicka.first_meet',
  'bridge.draftsperson.missing_span',
  'bridge.cicka.parallel_play',
  'bridge.draftsperson.toy_car_test',
  'bridge.exit.opened_crossing'
] as const;

export type BridgeDialogueConversationId =
  (typeof BRIDGE_DIALOGUE_CONVERSATION_IDS)[number];

export type BridgeDialogueSpeaker = 'Prompt' | 'Cicka' | 'Bridge Draftsperson';

export interface BridgeDialogueLine {
  id: string;
  conversationId: BridgeDialogueConversationId;
  speaker: BridgeDialogueSpeaker;
  text: string;
}

const BRIDGE_DIALOGUE_LINES = [
  {
    id: 'bridge.cicka.first_meet.01',
    conversationId: 'bridge.cicka.first_meet',
    speaker: 'Prompt',
    text: 'Sit near Cicka'
  },
  {
    id: 'bridge.cicka.first_meet.02',
    conversationId: 'bridge.cicka.first_meet',
    speaker: 'Cicka',
    text: 'Small chirp.'
  },
  {
    id: 'bridge.cicka.first_meet.03',
    conversationId: 'bridge.cicka.first_meet',
    speaker: 'Prompt',
    text: 'Cicka bats the tiny car back into place.'
  },
  {
    id: 'bridge.draftsperson.missing_span.01',
    conversationId: 'bridge.draftsperson.missing_span',
    speaker: 'Bridge Draftsperson',
    text: 'The middle span keeps looking brave until I imagine someone crossing it.'
  },
  {
    id: 'bridge.draftsperson.missing_span.02',
    conversationId: 'bridge.draftsperson.missing_span',
    speaker: 'Bridge Draftsperson',
    text: 'I had a tiny test car for this. It was here a minute ago.'
  },
  {
    id: 'bridge.draftsperson.missing_span.03',
    conversationId: 'bridge.draftsperson.missing_span',
    speaker: 'Prompt',
    text: 'Look for the tiny test car'
  },
  {
    id: 'bridge.cicka.parallel_play.01',
    conversationId: 'bridge.cicka.parallel_play',
    speaker: 'Prompt',
    text: 'Sit with Cicka'
  },
  {
    id: 'bridge.cicka.parallel_play.02',
    conversationId: 'bridge.cicka.parallel_play',
    speaker: 'Prompt',
    text: 'Roll the car back gently'
  },
  {
    id: 'bridge.cicka.parallel_play.03',
    conversationId: 'bridge.cicka.parallel_play',
    speaker: 'Cicka',
    text: 'Quiet purr.'
  },
  {
    id: 'bridge.cicka.parallel_play.04',
    conversationId: 'bridge.cicka.parallel_play',
    speaker: 'Prompt',
    text: 'Cicka leaves the tiny car beside you.'
  },
  {
    id: 'bridge.draftsperson.toy_car_test.01',
    conversationId: 'bridge.draftsperson.toy_car_test',
    speaker: 'Prompt',
    text: 'Set the tiny car on the drawing'
  },
  {
    id: 'bridge.draftsperson.toy_car_test.02',
    conversationId: 'bridge.draftsperson.toy_car_test',
    speaker: 'Bridge Draftsperson',
    text: 'If it can carry this much courage, maybe it can carry us.'
  },
  {
    id: 'bridge.draftsperson.toy_car_test.03',
    conversationId: 'bridge.draftsperson.toy_car_test',
    speaker: 'Prompt',
    text: 'The toy car rolls across the new span.'
  },
  {
    id: 'bridge.draftsperson.toy_car_test.04',
    conversationId: 'bridge.draftsperson.toy_car_test',
    speaker: 'Bridge Draftsperson',
    text: 'That line holds. The bridge knows it now.'
  },
  {
    id: 'bridge.exit.opened_crossing.01',
    conversationId: 'bridge.exit.opened_crossing',
    speaker: 'Prompt',
    text: 'Cross the finished bridge'
  },
  {
    id: 'bridge.exit.opened_crossing.02',
    conversationId: 'bridge.exit.opened_crossing',
    speaker: 'Bridge Draftsperson',
    text: 'Thank you. I think I can leave this line alone now.'
  },
  {
    id: 'bridge.exit.opened_crossing.03',
    conversationId: 'bridge.exit.opened_crossing',
    speaker: 'Prompt',
    text: 'The page turns toward evening music.'
  }
] as const satisfies readonly BridgeDialogueLine[];

export type BridgeDialogueLineId = (typeof BRIDGE_DIALOGUE_LINES)[number]['id'];

const BRIDGE_DIALOGUE_BY_ID = new Map<BridgeDialogueLineId, BridgeDialogueLine>(
  BRIDGE_DIALOGUE_LINES.map((line) => [line.id, line])
);

export function getBridgeDialogueLine(id: BridgeDialogueLineId): BridgeDialogueLine {
  const line = BRIDGE_DIALOGUE_BY_ID.get(id);
  if (!line) {
    throw new Error(`Unknown Bridge dialogue line: ${id}`);
  }
  return line;
}

export function getBridgeDialogueLines(
  conversationId: BridgeDialogueConversationId
): BridgeDialogueLine[] {
  return BRIDGE_DIALOGUE_LINES.filter(
    (line) => line.conversationId === conversationId
  );
}

export function getBridgePromptText(id: BridgeDialogueLineId): string {
  return getBridgeDialogueLine(id).text;
}
