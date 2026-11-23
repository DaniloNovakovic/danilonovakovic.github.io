/**
 * Pure Ridge console types. No Phaser, React, or DOM.
 */
import type { BridgeBuildAction, BridgeBuildPhase, BridgeBuildTip, BridgeDesign } from './bridgeBuilder';
import type { CickaAttackKind, CickaDuelPhase, CickaStrikeResult } from './cickaDuel';
import type { GigGrade, GigJudgment, GigLane, GigMode, GigPhase, GigSectionKind } from './concertGig';
import type { BachataStep } from './bachata';

export type RidgeAreaId = 'bridge' | 'concert' | 'danceFestival' | 'relay';

/** Full first-playable route beat vocabulary across all areas. */
export type RidgeRouteBeat =
  // Bridge
  | 'intro'
  | 'needs_toy_car'
  | 'toy_car_shared'
  | 'bridge_complete'
  // Concert
  | 'concert_arrival'
  | 'concert_practiced'
  | 'concert_cleared'
  // Dance Festival
  | 'dance_arrival'
  | 'dance_ready'
  | 'dance_cleared'
  // Relay Ending
  | 'relay_linger'
  | 'relay_farewell'
  | 'relay_complete';

/** @deprecated Prefer RidgeRouteBeat — kept for Bridge-local call sites. */
export type RidgeBridgeBeat = RidgeRouteBeat;
export type RidgeBridgeAreaBeat = Extract<
  RidgeRouteBeat,
  'intro' | 'needs_toy_car' | 'toy_car_shared' | 'bridge_complete'
>;

export type RidgeFacing = 'left' | 'right';

/**
 * `bridgeBuild` is the Blueprint Bridge workbench: drawing and testing a span.
 * `cickaDuel` is Cicka's Standoff: dodging her paw to earn the toy car.
 * `concertGig` is the Concert Crossing rhythm show (or Steve's practice riff),
 * and the guitar serenade for the shy cat at Last-Stop Plaza.
 * `bachataLesson` is the Profe's One-Step Practice behind the shuttle shelter.
 */
export type RidgeMode = 'explore' | 'conversation' | 'bridgeBuild' | 'cickaDuel' | 'concertGig' | 'bachataLesson';

export type RidgeSpotKind = 'landmark' | 'npc' | 'prop' | 'exit';

export type RidgeActorId =
  | 'player'
  | 'cicka'
  | 'draftsperson'
  | 'toy-car'
  | 'guitarist'
  | 'kid'
  | 'crowd'
  | 'guitar'
  | 'traveler'
  | 'driver'
  | 'operations-helper'
  | 'dance-teacher'
  | 'steward'
  | 'counterpart-cat'
  | 'shuttle';

export type RidgeEmotion = 'neutral' | 'curious' | 'playful' | 'determined' | 'thoughtful' | 'surprised' | 'sleepy';

export interface RidgeDialogueLine {
  id: string;
  speakerId: string;
  speaker: string;
  text: string;
  emotion?: RidgeEmotion;
  /** While this line shows, the view cuts away to a remembered scene. */
  memory?: RidgeMemoryShot;
}

/**
 * A cut to another area for one line of a conversation (the Relay ending's
 * memories). The core stages that area as it would look; presentation draws
 * it in place of the current one.
 */
export interface RidgeMemoryShot {
  areaId: RidgeAreaId;
  beat: RidgeRouteBeat;
  /** Where the camera looks along that area, 0..1. */
  focus: number;
  /** Extra flags that area reads to stage the memory (the plaza at night). */
  flags?: readonly string[];
  /** Residents dancing the bachata basic in this shot. */
  dancers?: readonly RidgeActorId[];
}

export interface RidgeDialogueChoice {
  id: string;
  label: string;
  /** Optional follow-up lines before outcome applies. */
  lines?: readonly RidgeDialogueLine[];
  outcome?: RidgeConversationOutcome;
  /** Follow-up choices offered after this choice's lines (a nested branch). */
  choices?: readonly RidgeDialogueChoice[];
  /**
   * `menu` returns to the conversation's topic menu after this choice's lines,
   * applying its outcome right away instead of when the conversation ends.
   * Defaults to ending the conversation (or showing `choices` when present).
   */
  then?: 'end' | 'menu';
  /** Hide this choice from the topic menu once picked in this conversation. */
  once?: boolean;
}

export interface RidgeConversationOutcome {
  setBeat?: RidgeRouteBeat;
  /** Swap into the next Compact Ridge Stage and reset progress. */
  handoffToArea?: RidgeAreaId;
  /** First Playable Reset Return — clean Bridge restart. */
  routeReset?: boolean;
  addItem?: string;
  removeItem?: string;
  setFlag?: string;
  clearFlag?: string;
  /** Open the Blueprint Bridge workbench once the conversation closes. */
  openBridgeBuild?: boolean;
  /** Start Cicka's Standoff once the conversation closes. */
  openCickaDuel?: boolean;
  /** Start the concert rhythm game (practice riff or the show) once it closes. */
  openConcertGig?: GigMode;
  /** Start the Profe's bachata lesson (the driver's One-Step Practice) once it closes. */
  openBachataLesson?: boolean;
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
  /** Root topic menu that `then: 'menu'` choices return to. */
  menu: readonly RidgeDialogueChoice[] | null;
  /** `once` choices already picked in this conversation. */
  asked: readonly string[];
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
  /** Stage position of the spot, so presentation can anchor a prompt to it. */
  progress: number;
  /** Set when the spot is embodied by an actor rather than scenery. */
  actorId?: RidgeActorId;
}

export interface RidgeActorPresence {
  id: RidgeActorId;
  label: string;
  progress: number;
  visible: boolean;
  facing: RidgeFacing;
  /** What the actor is holding: slung on the back, or being played. */
  prop?: 'guitar-back' | 'guitar-playing';
  /** Sitting (on an amp, a curb) rather than standing. */
  seated?: boolean;
}

export interface RidgeStageDefinition {
  areaId: RidgeAreaId;
  title: string;
  lengthLabel: string;
  spots: readonly RidgeSpotDefinition[];
  /** Soft wall until the crossing opens. */
  blockedProgress?: number;
  /** Message when the soft wall stops the player. */
  blockedMessage?: string | ((state: RidgeWorldState) => string);
  /** When true, blockedProgress no longer applies. */
  isCrossingOpen?: (state: RidgeWorldState) => boolean;
  resolveInteractables: (state: RidgeWorldState) => readonly RidgeInteractable[];
  resolveActors: (state: RidgeWorldState) => readonly RidgeActorPresence[];
  resolveConversation: (conversationId: string, state: RidgeWorldState) => RidgeConversationDefinition | null;
  describeAmbience: (state: RidgeWorldState) => string;
  /** Concert only: how warm the crowd is when a gig starts. */
  concertGigStartHype?: (state: RidgeWorldState, mode: GigMode) => number;
  /** Dance Festival only: how steady the driver is at the lesson's first count, 0..1. */
  bachataStartNerve?: (state: RidgeWorldState) => number;
  /**
   * Set-dressing tokens the scenery should show (a lantern line tied off, a
   * cable ramp down). Presentation redraws when they change; gameplay never
   * reads them back.
   */
  resolveSceneryMarks?: (state: RidgeWorldState) => readonly string[];
  /**
   * Draftsperson remark for the Blueprint Bridge workbench (Bridge only).
   * `variant` rotates between phrasings; `sketchNudge` appends the sketch offer.
   */
  describeBridgeTip?: (tip: BridgeBuildTip, context: { variant: number; sketchNudge: boolean }) => string;
}

export type RidgeStageRegistry = Record<RidgeAreaId, RidgeStageDefinition>;

export interface RidgeWorldState {
  areaId: RidgeAreaId;
  title: string;
  progress: number;
  facing: RidgeFacing;
  beat: RidgeRouteBeat;
  mode: RidgeMode;
  flags: ReadonlySet<string>;
  inventory: readonly string[];
  conversation: RidgeConversationState | null;
  lastMessage: string | null;
  /** The span the player drew and proved, once the toy car crossed it. */
  builtBridge: BridgeDesign | null;
}

export interface RidgeObservation {
  mode: RidgeMode;
  areaId: RidgeAreaId;
  title: string;
  beat: RidgeRouteBeat;
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
    emotion?: RidgeEmotion;
    lineId: string;
    lineIndex: number;
    lineCount: number;
    choices: readonly RidgeDialogueChoice[] | null;
    awaitingChoice: boolean;
  };
  /** Workbench summary while drawing or testing the bridge. */
  bridgeBuild: null | {
    phase: BridgeBuildPhase;
    attempts: number;
    beamCount: number;
    canUndo: boolean;
    ink: number;
    inkBudget: number;
    tip: BridgeBuildTip;
    tipText: string;
    hintVisible: boolean;
    sketchOffered: boolean;
  };
  /** Cicka's Standoff, while dodging her for the toy car. */
  cickaDuel: null | {
    phase: CickaDuelPhase;
    hearts: number;
    maxHearts: number;
    strikesDone: number;
    strikesTotal: number;
    perfectCount: number;
    canDodge: boolean;
    telegraph: null | { kind: CickaAttackKind; framesToImpact: number };
    lastResult: CickaStrikeResult | null;
  };
  /** The concert rhythm game, while practicing or playing the show. */
  concertGig: null | {
    mode: GigMode;
    phase: GigPhase;
    timeMs: number;
    section: GigSectionKind | null;
    hype: number;
    combo: number;
    bestCombo: number;
    score: number;
    counts: { perfect: number; good: number; miss: number };
    notesTotal: number;
    lastJudgment: GigJudgment | null;
    next: null | { lane: GigLane; inMs: number };
    grade: GigGrade;
    practice: null | { loop: number; loopsTotal: number; hits: number; needed: number; passed: boolean };
    /** The crowd started warmer than usual (someone got them clapping). */
    warmStart: boolean;
  };
  /** The Profe's bachata lesson, while dancing the basic with the driver. */
  bachataLesson: null | {
    phase: GigPhase;
    timeMs: number;
    section: GigSectionKind | null;
    /** The driver's nerve, 0..1: the lesson's crowd meter. */
    nerve: number;
    combo: number;
    bestCombo: number;
    counts: { perfect: number; good: number; miss: number };
    notesTotal: number;
    lastJudgment: GigJudgment | null;
    next: null | { step: BachataStep; inMs: number };
    grade: GigGrade;
  };
  /** Set-dressing tokens from the stage (see RidgeStageDefinition.resolveSceneryMarks). */
  sceneryMarks: readonly string[];
  /** The remembered scene the current line cuts to, staged by that area. */
  memory: null | {
    areaId: RidgeAreaId;
    beat: RidgeRouteBeat;
    focus: number;
    actors: readonly RidgeActorPresence[];
    sceneryMarks: readonly string[];
    dancers: readonly RidgeActorId[];
    /** Changes on every cut, so presentation can flash between shots. */
    shotKey: string;
  };
  builtBridge: BridgeDesign | null;
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
  /** DEV / AI: jump to the next Compact Ridge Area. */
  | { type: 'skip' }
  /** DEV / AI: warp to a named area start. */
  | { type: 'warp'; areaId: RidgeAreaId }
  /** Blueprint Bridge workbench verbs (`build road 0,0 2,0`, `build test`, …). */
  | { type: 'build'; action: BridgeBuildAction }
  /** Cicka's Standoff verbs (`duel dodge`, `duel wait [n]`, `duel done`). */
  | { type: 'duel'; action: RidgeDuelAction }
  /** Concert rhythm verbs (`gig hit [lane]`, `gig wait [ms]`, `gig auto`, …). */
  | { type: 'gig'; action: RidgeGigAction }
  /** Bachata lesson verbs (`dance left|tap|right`, `dance step`, `dance wait`, …). */
  | { type: 'dance'; action: RidgeGigAction }
  | { type: 'unknown'; raw: string };

export type RidgeDuelAction = { kind: 'dodge' } | { kind: 'wait'; frames?: number } | { kind: 'done' };

/**
 * `hit` with no lane strums the next note(s) exactly on time; with a lane it
 * strums that lane now. `auto` plays the rest perfectly, `skip` lets it pass.
 */
export type RidgeGigAction =
  | { kind: 'hit'; lane?: GigLane }
  | { kind: 'wait'; ms?: number }
  | { kind: 'auto' }
  | { kind: 'skip' }
  | { kind: 'done' };

export type RidgeSessionEvent =
  | { type: 'beat_changed'; beat: RidgeRouteBeat }
  | { type: 'area_handoff'; areaId: RidgeAreaId }
  | { type: 'route_reset' }
  | { type: 'conversation_started'; conversationId: string }
  | { type: 'conversation_ended'; conversationId: string }
  | { type: 'item_added'; itemId: string }
  | { type: 'item_removed'; itemId: string }
  | { type: 'flag_changed'; flag: string; present: boolean }
  | { type: 'bridge_build_opened' }
  | { type: 'bridge_build_closed' }
  | { type: 'bridge_built'; design: BridgeDesign }
  | { type: 'cicka_duel_opened' }
  | { type: 'cicka_duel_closed'; won: boolean }
  | { type: 'concert_gig_opened'; mode: GigMode }
  | { type: 'concert_gig_closed'; mode: GigMode; grade: GigGrade; passed: boolean }
  | { type: 'bachata_lesson_opened' }
  | { type: 'bachata_lesson_closed'; grade: GigGrade };

export interface RidgeCommandResult {
  ok: boolean;
  message: string;
  observation: RidgeObservation;
  events: readonly RidgeSessionEvent[];
}

export const RIDGE_INITIAL_BEAT: Record<RidgeAreaId, RidgeRouteBeat> = {
  bridge: 'intro',
  concert: 'concert_arrival',
  danceFestival: 'dance_arrival',
  relay: 'relay_linger'
};

/** Left-to-right Compact Ridge Area order for the First Playable Route. */
const RIDGE_AREA_ORDER = ['bridge', 'concert', 'danceFestival', 'relay'] as const;

/** Next area on the route, or null at Relay. */
export function ridgeNextArea(areaId: RidgeAreaId): RidgeAreaId | null {
  const index = RIDGE_AREA_ORDER.indexOf(areaId);
  if (index < 0 || index >= RIDGE_AREA_ORDER.length - 1) return null;
  return RIDGE_AREA_ORDER[index + 1]!;
}

/**
 * Previous area for DEV reverse-warp. Wraps Bridge → Relay so `[` / `]` cycle.
 */
export function ridgePrevArea(areaId: RidgeAreaId): RidgeAreaId {
  const index = RIDGE_AREA_ORDER.indexOf(areaId);
  if (index <= 0) return RIDGE_AREA_ORDER[RIDGE_AREA_ORDER.length - 1]!;
  return RIDGE_AREA_ORDER[index - 1]!;
}

export const RIDGE_GUITAR_ITEM = 'guitar';
export const RIDGE_TOY_CAR_ITEM = 'toy-car';
