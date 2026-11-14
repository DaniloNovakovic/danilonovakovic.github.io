import { useCallback, useEffect, useId, useRef, useState, type RefObject } from 'react';
import type { SceneUiSurfaceProps } from '@/game/sceneUi/registry';
import type { RidgeEmotion } from '@/game/core/ridge';
import { cn } from '@/shared/ui/utils';
import type { RidgePortraitId } from '../content/castRegistry';
import type { RidgeSpeakerSide } from '../art/conversationStaging';
import { ConversationBust } from './conversationPortraits';

export interface RidgeConversationChoiceView {
  id: string;
  label: string;
}

export interface RidgeConversationPanelView {
  conversationId: string;
  speaker: string;
  speakerId: string;
  text: string;
  lineIndex: number;
  lineCount: number;
  awaitingChoice: boolean;
  choices: readonly RidgeConversationChoiceView[];
  portrait: RidgePortraitId;
  emotion?: RidgeEmotion;
  /** Screen side of the speaker; the box docks under them. Defaults to `left`. */
  speakerSide?: RidgeSpeakerSide;
}

const COPY = {
  continue: 'Continue',
  stepBack: 'Step back',
  escHint: 'Esc'
} as const;

const TYPEWRITER_MS = 16;

type Dispatch = SceneUiSurfaceProps['dispatchAction'];

/**
 * Docked JRPG conversation box. It sits along the bottom of the game frame
 * under whoever is speaking, flips sides when the speaker changes, and leaves
 * the people talking visible above it.
 */
export function RidgeConversationPanel({ params, dispatchAction }: SceneUiSurfaceProps) {
  const view = readParams(params);
  if (!view) return null;
  return <ConversationStage view={view} dispatchAction={dispatchAction} />;
}

function ConversationStage({
  view,
  dispatchAction
}: {
  view: RidgeConversationPanelView;
  dispatchAction: Dispatch;
}) {
  const titleId = useId();
  const textId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const side = sideFor(view);
  const typewriter = useTypewriter(view);
  useConversationKeys(view, typewriter, dispatchAction);
  useDialogFocus(dialogRef, side);

  /** Same as Z/Space: skip the typewriter, or advance once the line is shown. */
  const advanceOrSkip = () => {
    if (view.awaitingChoice) return;
    if (typewriter.isTyping) typewriter.skip();
    else dispatchAction('ridgeConversationAdvance');
  };

  const isNarration = side === 'center';
  const hasChoices = view.awaitingChoice && view.choices.length > 0;

  return (
    <div className="absolute inset-0">
      <Letterbox />
      <div className={cn('absolute inset-x-0 bottom-0 flex px-2 pb-3 sm:px-5 sm:pb-5 short:pb-3', DOCK_JUSTIFY[side])}>
        {/* Keyed by side so a change of speaker re-enters from their edge. */}
        <div
          key={side}
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={textId}
          tabIndex={-1}
          onClick={advanceOrSkip}
          className={cn(
            'pointer-events-auto relative w-full cursor-pointer focus:outline-none motion-reduce:animate-none',
            DIALOG_LAYOUT[side]
          )}
        >
          <ConversationBust
            key={view.lineIndex}
            portrait={view.portrait}
            emotion={view.emotion}
            speaker={view.speaker}
            side={side}
          />
          <SpeakerTag id={titleId} speaker={view.speaker} side={side} />
          <div className={cn(BOX_BASE, BOX_LAYOUT[side])}>
            <StepBackButton side={side} onLeave={() => dispatchAction('ridgeConversationLeave')} />
            <LineText id={textId} text={view.text} typedLength={typewriter.typedLength} narration={isNarration} />
            {hasChoices ? (
              <ChoiceList
                choices={view.choices}
                onChoose={(choiceId) => dispatchAction('ridgeConversationChoose', { choiceId })}
              />
            ) : (
              <ContinueButton side={side} ready={!typewriter.isTyping} onContinue={advanceOrSkip} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function sideFor(view: RidgeConversationPanelView): RidgeSpeakerSide {
  if (view.portrait === 'prompt') return 'center';
  return view.speakerSide ?? 'left';
}

const DOCK_JUSTIFY: Record<RidgeSpeakerSide, string> = {
  left: 'justify-start',
  right: 'justify-end',
  center: 'justify-center'
};

const DIALOG_LAYOUT: Record<RidgeSpeakerSide, string> = {
  left: 'sm:w-[min(38rem,78%)] animate-ridge-enter-left',
  right: 'sm:w-[min(38rem,78%)] animate-ridge-enter-right',
  center: 'max-w-[30rem] animate-ridge-enter-center'
};

const BOX_BASE =
  'relative rounded-lg border-[3px] border-[#1a1a1a] text-[#1a1a1a] shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] sm:border-4';

/** The speaker side leaves room for the bust that overlaps the box. */
const BOX_LAYOUT: Record<RidgeSpeakerSide, string> = {
  left: 'bg-[#fbfbf9] pb-5 pt-3 pl-[6.5rem] pr-4 sm:py-4 sm:pl-[9rem] sm:pr-6 short:pb-5 short:pt-2.5 short:pl-[6.5rem]',
  right: 'bg-[#fbfbf9] pb-5 pt-3 pl-4 pr-[6.5rem] sm:py-4 sm:pl-6 sm:pr-[9rem] short:pb-5 short:pt-2.5 short:pr-[6.5rem]',
  center: 'border-dashed bg-[#f4f1ea] px-5 pb-5 pt-3'
};

interface Typewriter {
  typedLength: number;
  isTyping: boolean;
  skip: () => void;
}

function useTypewriter(view: RidgeConversationPanelView): Typewriter {
  const lineKey = `${view.conversationId}:${view.lineIndex}:${view.text}`;
  const targetLen = view.text.length;
  const [typedLength, setTypedLength] = useState(0);
  const [activeLineKey, setActiveLineKey] = useState(lineKey);

  // Reset the typewriter when the authored line changes — during render, not in
  // an effect (react-hooks/set-state-in-effect).
  if (lineKey !== activeLineKey) {
    setActiveLineKey(lineKey);
    setTypedLength(0);
  }

  useEffect(() => {
    if (targetLen === 0) return;
    const interval = setInterval(() => {
      setTypedLength((prev) => {
        if (prev >= targetLen) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, TYPEWRITER_MS);
    return () => clearInterval(interval);
  }, [lineKey, targetLen]);

  const skip = useCallback(() => setTypedLength(targetLen), [targetLen]);
  return { typedLength, isTyping: typedLength < targetLen, skip };
}

function useConversationKeys(
  view: RidgeConversationPanelView,
  typewriter: Typewriter,
  dispatchAction: Dispatch
): void {
  const { isTyping, skip } = typewriter;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      handleConversationKey(event, view, isTyping, {
        choose: (choiceId) => dispatchAction('ridgeConversationChoose', { choiceId }),
        advance: () => dispatchAction('ridgeConversationAdvance'),
        skipTypewriter: skip,
        leave: () => dispatchAction('ridgeConversationLeave')
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatchAction, view, isTyping, skip]);
}

/**
 * Screen readers land in the conversation when it opens, and again when the
 * dialog remounts on a side change. Choice lines focus their first card.
 */
function useDialogFocus(dialogRef: RefObject<HTMLDivElement | null>, side: RidgeSpeakerSide): void {
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.contains(document.activeElement)) {
      dialog.focus({ preventScroll: true });
    }
  }, [dialogRef, side]);
}

/** Cinema bars: the world steps back while people talk. */
function Letterbox() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute inset-x-0 top-0 h-[7%] animate-ridge-letterbox-top bg-[#1a1a1a] motion-reduce:animate-none" />
      <div className="absolute inset-x-0 bottom-0 h-[7%] animate-ridge-letterbox-bottom bg-[#1a1a1a] motion-reduce:animate-none" />
    </div>
  );
}

function SpeakerTag({ id, speaker, side }: { id: string; speaker: string; side: RidgeSpeakerSide }) {
  // Narration has no name to show, but the dialog still needs a label.
  if (side === 'center') {
    return (
      <span id={id} className="sr-only">
        {speaker}
      </span>
    );
  }
  return (
    <div
      className={cn(
        'absolute -top-4 z-20 rounded border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-0.5 text-xs font-black uppercase tracking-widest text-[#fbfbf9] shadow-[3px_3px_0px_0px_rgba(75,67,55,1)] sm:-top-5 sm:text-sm',
        side === 'right'
          ? 'right-[6.25rem] rotate-2 sm:right-[8.75rem] short:right-[6.25rem]'
          : 'left-[6.25rem] -rotate-2 sm:left-[8.75rem] short:left-[6.25rem]'
      )}
    >
      <span id={id}>{speaker}</span>
    </div>
  );
}

function LineText({
  id,
  text,
  typedLength,
  narration
}: {
  id: string;
  text: string;
  typedLength: number;
  narration: boolean;
}) {
  const hiddenText = text.slice(typedLength);
  return (
    <p
      id={id}
      className={cn(
        'relative whitespace-pre-wrap text-[13px] font-bold leading-snug text-[#1a1a1a] sm:text-base sm:leading-relaxed short:text-sm short:leading-snug',
        narration ? 'text-center italic text-[#4b4337]' : 'min-h-[2.6rem] text-left'
      )}
    >
      {text.slice(0, typedLength)}
      {/* Unrevealed characters stay in the line so wrap and box height do not jump. */}
      {hiddenText ? (
        <span className="text-transparent">
          <span
            aria-hidden="true"
            className="absolute -translate-x-full animate-pulse font-black text-[#1a1a1a]"
          >
            |
          </span>
          {hiddenText}
        </span>
      ) : null}
    </p>
  );
}

function ChoiceList({
  choices,
  onChoose
}: {
  choices: readonly RidgeConversationChoiceView[];
  onChoose: (choiceId: string) => void;
}) {
  return (
    <div className="mt-2.5 grid gap-1.5 sm:mt-3 sm:grid-cols-2 sm:gap-2">
      {choices.map((choice, index) => (
        <button
          key={choice.id}
          type="button"
          className="group relative flex items-center gap-2.5 rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] px-3 py-1.5 text-left shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#f4f1ea] hover:shadow-[5px_5px_0px_0px_rgba(26,26,26,1)] focus:-translate-y-0.5 focus:bg-[#f4f1ea] focus:shadow-[5px_5px_0px_0px_rgba(26,26,26,1)] focus:outline-none sm:py-2"
          onClick={(e) => {
            e.stopPropagation();
            onChoose(choice.id);
          }}
          autoFocus={index === 0}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#1a1a1a] bg-[#1a1a1a] text-[11px] font-black text-[#fbfbf9] group-hover:scale-110 pointer-coarse:hidden">
            {index + 1}
          </span>
          <span className="text-xs font-bold text-[#1a1a1a] sm:text-sm">{choice.label}</span>
        </button>
      ))}
    </div>
  );
}

/** The ▼ "next" cue; it only appears once the line has finished typing. */
function ContinueButton({
  side,
  ready,
  onContinue
}: {
  side: RidgeSpeakerSide;
  ready: boolean;
  onContinue: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={COPY.continue}
      className={cn(
        'absolute -bottom-3 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#1a1a1a] bg-[#1a1a1a] text-[10px] text-[#fbfbf9] shadow-[2px_2px_0px_0px_rgba(75,67,55,1)] transition-opacity motion-reduce:animate-none',
        side === 'right' ? 'left-4' : 'right-4',
        ready ? 'animate-bounce opacity-100' : 'opacity-0'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onContinue();
      }}
    >
      <span aria-hidden="true">▼</span>
    </button>
  );
}

/** Small ✕ on the far corner from the bust; the Esc hint is keyboard-only. */
function StepBackButton({ side, onLeave }: { side: RidgeSpeakerSide; onLeave: () => void }) {
  return (
    <button
      type="button"
      aria-label={COPY.stepBack}
      title={`${COPY.stepBack} (${COPY.escHint})`}
      className={cn(
        'absolute -top-3 z-20 flex items-center gap-1 rounded-full border-2 border-[#1a1a1a] bg-[#fbfbf9] px-1.5 py-0.5 text-[10px] font-black leading-none text-[#1a1a1a] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-transform hover:-translate-y-0.5',
        side === 'left' ? 'right-3' : 'left-3'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onLeave();
      }}
    >
      <span aria-hidden="true">✕</span>
      <span aria-hidden="true" className="uppercase tracking-wider opacity-70 pointer-coarse:hidden">
        {COPY.escHint}
      </span>
    </button>
  );
}

interface ConversationKeyActions {
  choose: (choiceId: string) => void;
  advance: () => void;
  skipTypewriter: () => void;
  leave: () => void;
}

/** Keyboard contract for the JRPG panel: 1–9 choose, Z/Space/Enter advance, Esc leave. */
function handleConversationKey(
  event: KeyboardEvent,
  view: RidgeConversationPanelView,
  isTyping: boolean,
  actions: ConversationKeyActions
): void {
  if (tryChoiceKey(event, view, actions.choose)) return;
  if (tryAdvanceKey(event, view, isTyping, actions)) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    actions.leave();
  }
}

function tryChoiceKey(
  event: KeyboardEvent,
  view: RidgeConversationPanelView,
  choose: (choiceId: string) => void
): boolean {
  if (!view.awaitingChoice || view.choices.length === 0) return false;
  if (event.key < '1' || event.key > '9') return false;
  const index = parseInt(event.key, 10) - 1;
  if (index >= view.choices.length) return false;
  event.preventDefault();
  choose(view.choices[index].id);
  return true;
}

function tryAdvanceKey(
  event: KeyboardEvent,
  view: RidgeConversationPanelView,
  isTyping: boolean,
  actions: Pick<ConversationKeyActions, 'advance' | 'skipTypewriter'>
): boolean {
  if (view.awaitingChoice) return false;
  if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'z' && event.key !== 'Z') {
    return false;
  }
  event.preventDefault();
  if (isTyping) actions.skipTypewriter();
  else actions.advance();
  return true;
}

function readParams(params: unknown): RidgeConversationPanelView | null {
  if (!params || typeof params !== 'object') return null;
  const value = params as RidgeConversationPanelView;
  if (typeof value.speaker !== 'string' || typeof value.text !== 'string') return null;
  return value;
}
