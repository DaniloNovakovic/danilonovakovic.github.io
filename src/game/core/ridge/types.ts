/**
 * Pure Ridge console types. No Phaser, React, or DOM.
 */

export type RidgeAreaId = 'bridge' | 'concert' | 'danceFestival' | 'relay';

export type RidgeBridgeBeat =
  | 'intro'
  | 'needs_toy_car'
  | 'toy_car_shared'
  | 'bridge_complete'
  | 'concert_handoff';

export type RidgeBridgeAreaBeat = Exclude<RidgeBridgeBeat, 'concert_handoff'>;

export type RidgeFacing = 'left' | 'right';

export type RidgeMode = 'explore' | 'conversation';

export type RidgeSpotKind = 'landmark' | 'npc' | 'prop' | 'exit';

export type RidgeActorId = 'player' | 'cicka' | 'draftsperson' | 'toy-car';

export interface RidgeDialogueLine {
  id: string;
  speakerId: string;
  speaker: string;
  text: string;
}

export interface RidgeDialogueChoice {
  id: string;
  label: string;
  /** Optional follow-up lines before outcome applies. */
  lines?: readonly RidgeDialogueLine[];
  outcome?: RidgeConversationOutcome;
}

export interface RidgeConversationOutcome {
  setBeat?: RidgeBridgeAreaBeat;
  concertHandoff?: boolean;
  addItem?: string;
  setFlag?: string;
  clearFlag?: string;
}

export interface RidgeConversationDefinition {
  id: string;
  lines: readonly RidgeDialogueLine[];
  /** Choices appear after the last line, before outcome. */
  choices?: readonly RidgeDialogueChoice[];
  outcome?: RidgeConversationOutcome;
}

export interface RidgeConversationState {
  id: string;
  lineIndex: number;
  lines: readonly RidgeDialogueLine[];
  choices: readonly RidgeDialogueChoice[] | null;
  awaitingChoice: boolean;
  outcome: RidgeConversationOutcome | null;
}

export interface RidgeSpotDefinition {
  id: string;
  label: string;
  kind: RidgeSpotKind;
  /** Position on the stage progress line, 0 at entry and 1 at exit. */
  progress: number;
  interactRadius: number;
  actorId?: RidgeActorId;
  description: string;
}

export interface RidgeInteractable {
  spotId: string;
  label: string;
  kind: RidgeSpotKind;
  distance: number;
  prompt: string;
  conversationId: string;
}

export interface RidgeActorPresence {
  id: RidgeActorId;
  label: string;
  progress: number;
  visible: boolean;
  facing: RidgeFacing;
}

export interface RidgeStageDefinition {
  areaId: RidgeAreaId;
  title: string;
  lengthLabel: string;
  spots: readonly RidgeSpotDefinition[];
  /** Soft wall until the crossing opens. */
  blockedProgress?: number;
  resolveInteractables: (state: RidgeWorldState) => readonly RidgeInteractable[];
  resolveActors: (state: RidgeWorldState) => readonly RidgeActorPresence[];
  resolveConversation: (
    conversationId: string,
    state: RidgeWorldState
  ) => RidgeConversationDefinition | null;
  describeAmbience: (state: RidgeWorldState) => string;
}

export interface RidgeWorldState {
  areaId: RidgeAreaId;
  title: string;
  progress: number;
  facing: RidgeFacing;
  beat: RidgeBridgeBeat;
  mode: RidgeMode;
  flags: ReadonlySet<string>;
  inventory: readonly string[];
  conversation: RidgeConversationState | null;
  lastMessage: string | null;
}

export interface RidgeObservation {
  mode: RidgeMode;
  areaId: RidgeAreaId;
  title: string;
  beat: RidgeBridgeBeat;
  progress: number;
  progressPercent: number;
  facing: RidgeFacing;
  ambience: string;
  nearby: readonly RidgeInteractable[];
  actors: readonly RidgeActorPresence[];
  inventory: readonly string[];
  conversation: null | {
    id: string;
    speaker: string;
    speakerId: string;
    text: string;
    lineId: string;
    lineIndex: number;
    lineCount: number;
    choices: readonly RidgeDialogueChoice[] | null;
    awaitingChoice: boolean;
  };
  canMove: boolean;
  blockedAhead: boolean;
  lastMessage: string | null;
  hints: readonly string[];
}

export type RidgeCommand =
  | { type: 'help' }
  | { type: 'look' }
  | { type: 'status' }
  | { type: 'inventory' }
  | { type: 'go'; direction: RidgeFacing; steps?: number }
  | { type: 'interact'; target?: string }
  | { type: 'advance' }
  | { type: 'choose'; choiceIdOrIndex: string }
  | { type: 'leave' }
  | { type: 'unknown'; raw: string };

export type RidgeSessionEvent =
  | { type: 'beat_changed'; beat: RidgeBridgeAreaBeat }
  | { type: 'concert_handoff' }
  | { type: 'conversation_started'; conversationId: string }
  | { type: 'conversation_ended'; conversationId: string }
  | { type: 'item_added'; itemId: string }
  | { type: 'flag_changed'; flag: string; present: boolean };

export interface RidgeCommandResult {
  ok: boolean;
  message: string;
  observation: RidgeObservation;
  events: readonly RidgeSessionEvent[];
}
