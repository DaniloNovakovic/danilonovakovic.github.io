import { getMessages } from '@/shared/i18n';

export const BRIDGE_DIALOGUE_CONVERSATION_IDS = [
  'bridge.cicka.first_meet',
  'bridge.draftsperson.missing_span',
  'bridge.cicka.parallel_play',
  'bridge.draftsperson.toy_car_test',
  'bridge.exit.opened_crossing'
] as const;

export type BridgeDialogueConversationId =
  (typeof BRIDGE_DIALOGUE_CONVERSATION_IDS)[number];

type BridgeDialogueCopy = ReturnType<typeof getMessages>['scenes']['ridge']['bridge'];
export type BridgeDialogueSpeakerId = keyof BridgeDialogueCopy['speakers'];

export type BridgeDialogueSpeaker =
  BridgeDialogueCopy['speakers'][BridgeDialogueSpeakerId];

export interface BridgeDialogueLine {
  id: string;
  conversationId: BridgeDialogueConversationId;
  speakerId: BridgeDialogueSpeakerId;
  speaker: BridgeDialogueSpeaker;
  text: string;
}

interface BridgeDialogueLineDefinition {
  id: keyof BridgeDialogueCopy['dialogue'];
  conversationId: BridgeDialogueConversationId;
  speakerId: BridgeDialogueSpeakerId;
}

const BRIDGE_DIALOGUE_LINE_DEFINITIONS = [
  {
    id: 'bridge.cicka.first_meet.01',
    conversationId: 'bridge.cicka.first_meet',
    speakerId: 'prompt'
  },
  {
    id: 'bridge.cicka.first_meet.02',
    conversationId: 'bridge.cicka.first_meet',
    speakerId: 'cicka'
  },
  {
    id: 'bridge.cicka.first_meet.03',
    conversationId: 'bridge.cicka.first_meet',
    speakerId: 'prompt'
  },
  {
    id: 'bridge.draftsperson.missing_span.01',
    conversationId: 'bridge.draftsperson.missing_span',
    speakerId: 'bridgeDraftsperson'
  },
  {
    id: 'bridge.draftsperson.missing_span.02',
    conversationId: 'bridge.draftsperson.missing_span',
    speakerId: 'bridgeDraftsperson'
  },
  {
    id: 'bridge.draftsperson.missing_span.03',
    conversationId: 'bridge.draftsperson.missing_span',
    speakerId: 'prompt'
  },
  {
    id: 'bridge.cicka.parallel_play.01',
    conversationId: 'bridge.cicka.parallel_play',
    speakerId: 'prompt'
  },
  {
    id: 'bridge.cicka.parallel_play.02',
    conversationId: 'bridge.cicka.parallel_play',
    speakerId: 'prompt'
  },
  {
    id: 'bridge.cicka.parallel_play.03',
    conversationId: 'bridge.cicka.parallel_play',
    speakerId: 'cicka'
  },
  {
    id: 'bridge.cicka.parallel_play.04',
    conversationId: 'bridge.cicka.parallel_play',
    speakerId: 'prompt'
  },
  {
    id: 'bridge.draftsperson.toy_car_test.01',
    conversationId: 'bridge.draftsperson.toy_car_test',
    speakerId: 'prompt'
  },
  {
    id: 'bridge.draftsperson.toy_car_test.02',
    conversationId: 'bridge.draftsperson.toy_car_test',
    speakerId: 'bridgeDraftsperson'
  },
  {
    id: 'bridge.draftsperson.toy_car_test.03',
    conversationId: 'bridge.draftsperson.toy_car_test',
    speakerId: 'prompt'
  },
  {
    id: 'bridge.draftsperson.toy_car_test.04',
    conversationId: 'bridge.draftsperson.toy_car_test',
    speakerId: 'bridgeDraftsperson'
  },
  {
    id: 'bridge.exit.opened_crossing.01',
    conversationId: 'bridge.exit.opened_crossing',
    speakerId: 'prompt'
  },
  {
    id: 'bridge.exit.opened_crossing.02',
    conversationId: 'bridge.exit.opened_crossing',
    speakerId: 'bridgeDraftsperson'
  },
  {
    id: 'bridge.exit.opened_crossing.03',
    conversationId: 'bridge.exit.opened_crossing',
    speakerId: 'prompt'
  }
] as const satisfies readonly BridgeDialogueLineDefinition[];

export type BridgeDialogueLineId =
  (typeof BRIDGE_DIALOGUE_LINE_DEFINITIONS)[number]['id'];

const BRIDGE_DIALOGUE_BY_ID = new Map<
  BridgeDialogueLineId,
  (typeof BRIDGE_DIALOGUE_LINE_DEFINITIONS)[number]
>(
  BRIDGE_DIALOGUE_LINE_DEFINITIONS.map((line) => [line.id, line])
);

export function getBridgeDialogueLine(id: BridgeDialogueLineId): BridgeDialogueLine {
  const lineDefinition = BRIDGE_DIALOGUE_BY_ID.get(id);
  if (!lineDefinition) {
    throw new Error(`Unknown Bridge dialogue line: ${id}`);
  }
  const bridgeCopy = getMessages().scenes.ridge.bridge;
  return {
    id: lineDefinition.id,
    conversationId: lineDefinition.conversationId,
    speakerId: lineDefinition.speakerId,
    speaker: bridgeCopy.speakers[lineDefinition.speakerId],
    text: bridgeCopy.dialogue[lineDefinition.id]
  };
}

export function getBridgeDialogueLines(
  conversationId: BridgeDialogueConversationId
): BridgeDialogueLine[] {
  return BRIDGE_DIALOGUE_LINE_DEFINITIONS.filter(
    (line) => line.conversationId === conversationId
  ).map((line) => getBridgeDialogueLine(line.id));
}

export function getBridgePromptText(id: BridgeDialogueLineId): string {
  return getBridgeDialogueLine(id).text;
}
