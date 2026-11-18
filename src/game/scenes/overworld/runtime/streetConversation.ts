/**
 * Street conversations: short scripted talks (the chick, the signpost, the
 * CRT, the litter pile) shown in the same docked box Ridge uses. Pure: the
 * scene owns when a talk opens and what each ending does.
 */
import type { RidgeEmotion } from '@/game/core/ridge';
import type { OverworldProgressStage } from '@/game/core/console';
import type { RidgePortraitId } from '@/game/scenes/ridge/content/castRegistry';
import type { RidgeConversationPanelView } from '@/game/scenes/ridge/sceneUi/RidgeConversationPanel';
import { getMessages } from '@/shared/i18n';

export type StreetSpeakerId = 'player' | 'chick' | 'narrator';

export interface StreetLine {
  speakerId: StreetSpeakerId;
  text: string;
  emotion?: RidgeEmotion;
}

export interface StreetChoice {
  id: string;
  label: string;
}

export interface StreetConversationScript {
  id: string;
  lines: readonly StreetLine[];
  /** Offered on the last line; without them the last advance finishes the talk. */
  choices?: readonly StreetChoice[];
}

/** How a talk ended: read to the end, stepped away from, or a choice id. */
export type StreetConversationOutcome = 'finished' | 'left' | (string & {});

function portraitFor(speakerId: StreetSpeakerId, glassesOn: boolean): RidgePortraitId {
  if (speakerId === 'player') return glassesOn ? 'streetPlayerGlasses' : 'streetPlayer';
  return speakerId === 'chick' ? 'chick' : 'prompt';
}

export class StreetConversation {
  private lineIndex = 0;
  private readonly script: StreetConversationScript;
  /** World x of whoever the player is talking to; picks each speaker's side. */
  private readonly partnerX: number;

  constructor(script: StreetConversationScript, partnerX: number) {
    if (script.lines.length === 0) throw new Error(`Street conversation "${script.id}" has no lines`);
    this.script = script;
    this.partnerX = partnerX;
  }

  get awaitingChoice(): boolean {
    return this.isLastLine && (this.script.choices?.length ?? 0) > 0;
  }

  /** Next line, or the outcome once the talk is over. A choice line ignores it. */
  advance(): StreetConversationOutcome | null {
    if (this.awaitingChoice) return null;
    if (this.isLastLine) return 'finished';
    this.lineIndex += 1;
    return null;
  }

  choose(choiceId: string): StreetConversationOutcome | null {
    if (!this.awaitingChoice) return null;
    return this.script.choices?.some((choice) => choice.id === choiceId) ? choiceId : null;
  }

  /** `glassesOn` dresses the player's bust like the street sprite. */
  view(playerX: number, glassesOn = false): RidgeConversationPanelView {
    const line = this.script.lines[this.lineIndex];
    const names = getMessages().scenes.overworld.conversation.speakers;
    const playerOnLeft = playerX <= this.partnerX;
    const awaitingChoice = this.awaitingChoice;
    return {
      conversationId: this.script.id,
      speaker: names[line.speakerId],
      speakerId: line.speakerId,
      text: line.text,
      emotion: line.emotion,
      lineIndex: this.lineIndex,
      lineCount: this.script.lines.length,
      awaitingChoice,
      choices: awaitingChoice ? (this.script.choices ?? []) : [],
      portrait: portraitFor(line.speakerId, glassesOn),
      speakerSide:
        line.speakerId === 'narrator'
          ? 'center'
          : (line.speakerId === 'player') === playerOnLeft
            ? 'left'
            : 'right'
    };
  }

  private get isLastLine(): boolean {
    return this.lineIndex >= this.script.lines.length - 1;
  }
}

export const CHICK_CHASE_CHOICE = 'chase';
export const CRT_SEAT_CHOICE = 'seat';
/** Every "not now" answer: the talk just closes. */
export const LATER_CHOICE = 'later';

/** The chick sizes you up. Coming back after the chase, it remembers. */
export function chickConversation(hasMetBefore: boolean): StreetConversationScript {
  const copy = getMessages().scenes.overworld.conversation.chick;
  const lines = hasMetBefore ? copy.again : copy.first;
  return {
    id: hasMetBefore ? 'chick-again' : 'chick-first',
    lines: [
      { speakerId: 'chick', text: lines[0], emotion: 'curious' },
      { speakerId: 'player', text: lines[1], emotion: 'surprised' },
      { speakerId: 'chick', text: lines[2], emotion: 'playful' },
      { speakerId: 'chick', text: lines[3], emotion: 'playful' }
    ],
    choices: [
      { id: CHICK_CHASE_CHOICE, label: copy.chase },
      { id: LATER_CHOICE, label: copy.later }
    ]
  };
}

export function signpostConversation(
  stage: OverworldProgressStage,
  found: number,
  total: number
): StreetConversationScript {
  const copy = getMessages().scenes.overworld;
  return {
    id: `signpost-${stage}`,
    lines: [
      { speakerId: 'narrator', text: copy.signpostHints[stage] },
      { speakerId: 'narrator', text: copy.signpostTally(found, total) }
    ]
  };
}

export function crtConversation(): StreetConversationScript {
  const copy = getMessages().scenes.overworld.conversation.crt;
  return {
    id: 'crt-ready',
    lines: [{ speakerId: 'narrator', text: copy.line }],
    choices: [
      { id: CRT_SEAT_CHOICE, label: copy.seat },
      { id: LATER_CHOICE, label: copy.later }
    ]
  };
}

/** First find of the litter pile; reading it to the end slips you into the dumpster. */
export function litterConversation(): StreetConversationScript {
  const lines = getMessages().scenes.overworld.conversation.litter;
  return {
    id: 'litter-first',
    lines: [
      { speakerId: 'narrator', text: lines[0] },
      { speakerId: 'player', text: lines[1], emotion: 'thoughtful' },
      { speakerId: 'narrator', text: lines[2] }
    ]
  };
}
