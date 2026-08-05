import { useEffect, useId, useState } from 'react';
import type { SceneUiSurfaceProps } from '@/game/sceneUi/registry';
import type { RidgeEmotion } from '@/game/core/ridge';
import type { RidgePortraitId } from '../content/castRegistry';

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
}

export function RidgeConversationPanel({ params, dispatchAction }: SceneUiSurfaceProps) {
  const view = readParams(params);
  const titleId = useId();
  const textId = useId();

  const [typedLength, setTypedLength] = useState(0);

  useEffect(() => {
    if (!view) return;
    setTypedLength(0);
    const targetLen = view.text.length;
    if (targetLen === 0) return;

    const interval = setInterval(() => {
      setTypedLength((prev) => {
        if (prev < targetLen) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [view?.text, view?.lineIndex]);

  const isTyping = view ? typedLength < view.text.length : false;

  useEffect(() => {
    if (!view) return;

    const onKey = (event: KeyboardEvent) => {
      if (view.awaitingChoice && view.choices.length > 0) {
        if (event.key >= '1' && event.key <= '9') {
          const index = parseInt(event.key, 10) - 1;
          if (index < view.choices.length) {
            event.preventDefault();
            dispatchAction('ridgeConversationChoose', { choiceId: view.choices[index].id });
            return;
          }
        }
      }

      if (!view.awaitingChoice) {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'z' || event.key === 'Z') {
          event.preventDefault();
          if (isTyping) {
            setTypedLength(view.text.length);
          } else {
            dispatchAction('ridgeConversationAdvance');
          }
        }
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        dispatchAction('ridgeConversationLeave');
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatchAction, view, isTyping]);

  if (!view) return null;

  const visibleText = view.text.slice(0, typedLength);

  /** Same as Z/Space: skip the typewriter, or advance once the line is shown. */
  const handleBoxClick = () => {
    if (view.awaitingChoice) return;
    if (isTyping) {
      setTypedLength(view.text.length);
      return;
    }
    dispatchAction('ridgeConversationAdvance');
  };

  // Stay in-flow: SceneUiHost already centers overlay panels with a transform +
  // overflow clip. `position: fixed` here collapses against that host and renders
  // as a clipped black strip while conversation mode freezes gameplay.
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={textId}
      onClick={handleBoxClick}
      className="relative mt-3 grid w-full max-w-[min(46rem,calc(100vw-1rem))] grid-cols-[4.5rem_1fr] gap-3 rounded-lg border-4 border-[#1a1a1a] bg-[#fbfbf9] p-3.5 text-[#1a1a1a] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] sm:grid-cols-[6.5rem_1fr] sm:gap-4 sm:p-4"
    >
      <div className="absolute -top-4 left-4 z-10 -rotate-2 rounded border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-0.5 font-mono text-xs font-black uppercase tracking-widest text-[#fbfbf9] shadow-[3px_3px_0px_0px_rgba(75,67,55,1)] sm:text-sm">
        <span id={titleId}>{view.speaker}</span>
      </div>

      <PortraitFrame portrait={view.portrait} emotion={view.emotion} speaker={view.speaker} />

      <div className="min-w-0 text-left pt-1">
        <div className="flex items-baseline justify-end gap-2">
          <span className="rounded border border-[#1a1a1a] bg-[#f4f1ea] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#4b4337]">
            {view.lineIndex + 1} / {view.lineCount}
          </span>
        </div>

        <p
          id={textId}
          className="mt-1.5 min-h-[3rem] font-mono text-xs font-bold leading-relaxed text-[#1a1a1a] sm:mt-2 sm:text-sm"
        >
          {visibleText}
          {isTyping ? <span className="inline-block animate-pulse font-black">|</span> : null}
        </p>

        {/* Persona 5 Choice Cards */}
        {view.awaitingChoice && view.choices.length > 0 ? (
          <div className="mt-3 grid gap-2">
            {view.choices.map((choice, index) => (
              <button
                key={choice.id}
                type="button"
                className="group relative flex items-center gap-2.5 rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] px-3 py-2 text-left shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#f4f1ea] hover:shadow-[5px_5px_0px_0px_rgba(26,26,26,1)] focus:-translate-y-0.5 focus:bg-[#f4f1ea] focus:shadow-[5px_5px_0px_0px_rgba(26,26,26,1)] focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatchAction('ridgeConversationChoose', { choiceId: choice.id });
                }}
                autoFocus={index === 0}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#1a1a1a] bg-[#1a1a1a] font-mono text-[11px] font-black text-[#fbfbf9] group-hover:scale-110">
                  {index + 1}
                </span>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">
                  {choice.label}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-2 pt-1 border-t border-[#1a1a1a]/15">
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#fbfbf9] shadow-[3px_3px_0px_0px_rgba(75,67,55,1)] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(26,26,26,1)]"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBoxClick();
                }}
              >
                Continue<span className="hidden sm:inline-block font-normal opacity-70 ml-1.5">[Z / Space]</span>
              </button>
              <button
                type="button"
                className="rounded border-2 border-[#1a1a1a] bg-[#f4f1ea] px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#1a1a1a] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(26,26,26,1)]"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatchAction('ridgeConversationLeave');
                }}
              >
                Step back<span className="hidden sm:inline-block font-normal opacity-70 ml-1.5">[Esc]</span>
              </button>
            </div>

            {!isTyping ? (
              <span className="animate-bounce font-mono text-xs font-black tracking-widest text-[#1a1a1a]">
                ▼
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function PortraitFrame({
  portrait,
  emotion = 'neutral',
  speaker
}: {
  portrait: RidgeConversationPanelView['portrait'];
  emotion?: RidgeEmotion;
  speaker: string;
}) {
  return (
    <div
      aria-hidden
      className="relative flex aspect-square items-end justify-center overflow-hidden rounded-md border-2 border-[#1a1a1a] bg-[#f4f1ea] shadow-[4px_4px_0px_0px_rgba(26,26,26,0.35)]"
      title={`${speaker} (${emotion})`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:repeating-linear-gradient(-18deg,transparent,transparent_3px,#1a1a1a_3px,#1a1a1a_4px)]" />
      <svg viewBox="0 0 80 80" className="relative h-full w-full p-2">
        {portrait === 'cicka' ? <CickaPortrait emotion={emotion} /> : null}
        {portrait === 'draftsperson' ? <DraftspersonPortrait emotion={emotion} /> : null}
        {portrait === 'guitarist' ? <GuitaristPortrait emotion={emotion} /> : null}
        {portrait === 'driver' ? <DriverPortrait /> : null}
        {portrait === 'traveler' ? <TravelerPortrait /> : null}
        {portrait === 'teacher' ? <TeacherPortrait /> : null}
        {portrait === 'player' ? <PlayerPortrait emotion={emotion} /> : null}
        {portrait === 'prompt' ? <PromptPortrait /> : null}
      </svg>
    </div>
  );
}

function CickaPortrait({ emotion }: { emotion: RidgeEmotion }) {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <ellipse cx="34" cy="52" rx="18" ry="12" fill="#fbfbf9" />
      <circle cx="50" cy="40" r="11" fill="#fbfbf9" />
      <path d="M42 30 L38 16 L48 28" />
      <path d="M54 30 L58 14 L50 28" />
      {emotion === 'sleepy' ? (
        <>
          <path d="M46 40 Q49 43 52 40" />
          <path d="M54 40 Q57 43 60 40" />
        </>
      ) : emotion === 'curious' ? (
        <>
          <circle cx="48" cy="38" r="2.5" fill="#1a1a1a" />
          <circle cx="56" cy="38" r="2.5" fill="#1a1a1a" />
        </>
      ) : (
        <>
          <circle cx="48" cy="39" r="2" fill="#1a1a1a" />
          <circle cx="56" cy="39" r="2" fill="#1a1a1a" />
        </>
      )}
      <line x1="58" y1="42" x2="68" y2="40" strokeWidth="2" />
      <line x1="58" y1="44" x2="67" y2="46" strokeWidth="2" />
      <path d="M18 50 Q8 34 14 28" />
    </g>
  );
}

function DraftspersonPortrait({ emotion }: { emotion: RidgeEmotion }) {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <circle cx="40" cy="24" r="10" fill="#fbfbf9" />
      <circle cx="36" cy="24" r="3.5" strokeWidth="2" fill="#fbfbf9" />
      <circle cx="44" cy="24" r="3.5" strokeWidth="2" fill="#fbfbf9" />
      <line x1="39.5" y1="24" x2="40.5" y2="24" strokeWidth="2" />
      {emotion === 'surprised' ? (
        <circle cx="40" cy="30" r="2" fill="#1a1a1a" />
      ) : emotion === 'thoughtful' ? (
        <line x1="36" y1="29" x2="44" y2="29" strokeWidth="2" />
      ) : (
        <path d="M36 29 Q40 32 44 29" strokeWidth="2" />
      )}
      <path d="M40 34 V58" />
      <path d="M40 40 L22 50" />
      <path d="M40 40 L62 44" />
      <rect x="48" y="38" width="18" height="12" fill="#fbfbf9" />
      <path d="M28 58 L40 58 L52 58" />
    </g>
  );
}

function GuitaristPortrait({ emotion }: { emotion: RidgeEmotion }) {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <circle cx="40" cy="24" r="10" fill="#fbfbf9" />
      <path d="M30 20 Q40 12 50 20" fill="#1a1a1a" />
      <circle cx="36" cy="24" r="1.5" fill="#1a1a1a" />
      <circle cx="44" cy="24" r="1.5" fill="#1a1a1a" />
      {emotion === 'playful' ? (
        <path d="M36 28 Q40 33 44 28" strokeWidth="2" />
      ) : (
        <line x1="36" y1="29" x2="44" y2="29" strokeWidth="2" />
      )}
      <path d="M40 34 V56" />
      <ellipse cx="48" cy="46" rx="10" ry="14" fill="#fbfbf9" />
      <line x1="48" y1="32" x2="48" y2="60" />
    </g>
  );
}

function DriverPortrait() {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <circle cx="40" cy="24" r="10" fill="#fbfbf9" />
      <path d="M28 19 H52" strokeWidth="4" />
      <rect x="32" y="14" width="16" height="6" fill="#fbfbf9" />
      <circle cx="36" cy="24" r="1.5" fill="#1a1a1a" />
      <circle cx="44" cy="24" r="1.5" fill="#1a1a1a" />
      <path d="M37 29 H43" strokeWidth="2" />
      <path d="M40 34 V58" />
      <rect x="46" y="36" width="16" height="20" fill="#fbfbf9" />
      <line x1="48" y1="42" x2="58" y2="42" strokeWidth="2" />
      <line x1="48" y1="47" x2="56" y2="47" strokeWidth="2" />
    </g>
  );
}

function TravelerPortrait() {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <circle cx="40" cy="24" r="10" fill="#fbfbf9" />
      <path d="M32 17 Q40 12 48 17" />
      <circle cx="36" cy="24" r="1.5" fill="#1a1a1a" />
      <circle cx="44" cy="24" r="1.5" fill="#1a1a1a" />
      <path d="M36 28 Q40 32 44 28" strokeWidth="2" />
      <path d="M40 34 V58" />
      <path d="M40 40 L58 48" />
      <line x1="58" y1="36" x2="58" y2="68" strokeWidth="2.5" />
    </g>
  );
}

function TeacherPortrait() {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <circle cx="40" cy="24" r="10" fill="#fbfbf9" />
      <circle cx="40" cy="12" r="4" fill="#fbfbf9" />
      <circle cx="36" cy="24" r="1.5" fill="#1a1a1a" />
      <circle cx="44" cy="24" r="1.5" fill="#1a1a1a" />
      <path d="M35 28 Q40 33 45 28" strokeWidth="2" />
      <path d="M40 34 V56" />
      <path d="M40 40 L22 28" />
      <path d="M40 40 L58 28" />
    </g>
  );
}

function PlayerPortrait({ emotion }: { emotion: RidgeEmotion }) {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <circle cx="40" cy="22" r="10" fill="#fbfbf9" />
      <path d="M32 16 L28 10" />
      <path d="M40 13 L42 7" />
      <path d="M48 16 L52 11" />
      {emotion === 'determined' ? (
        <>
          <line x1="33" y1="21" x2="38" y2="23" strokeWidth="2" />
          <line x1="47" y1="21" x2="42" y2="23" strokeWidth="2" />
          <circle cx="35" cy="24" r="1.5" fill="#1a1a1a" />
          <circle cx="45" cy="24" r="1.5" fill="#1a1a1a" />
        </>
      ) : (
        <>
          <circle cx="35" cy="22" r="1.5" fill="#1a1a1a" />
          <circle cx="45" cy="22" r="1.5" fill="#1a1a1a" />
          <path d="M36 27 Q40 31 44 27" strokeWidth="2" />
        </>
      )}
      <rect x="30" y="30" width="20" height="7" fill="#1a1a1a" rx="2" />
      <path d="M40 37 V58" />
      <path d="M40 42 L24 52" />
      <path d="M40 42 L58 50" />
    </g>
  );
}

function PromptPortrait() {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <rect x="16" y="20" width="48" height="40" rx="4" fill="#fbfbf9" />
      <path d="M24 34 H56" />
      <path d="M24 44 H48" />
    </g>
  );
}

function readParams(params: unknown): RidgeConversationPanelView | null {
  if (!params || typeof params !== 'object') return null;
  const value = params as RidgeConversationPanelView;
  if (typeof value.speaker !== 'string' || typeof value.text !== 'string') return null;
  return value;
}
