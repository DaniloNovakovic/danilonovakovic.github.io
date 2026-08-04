import { useEffect, useId } from 'react';
import type { SceneUiSurfaceProps } from '@/game/sceneUi/registry';
import { Button, Card } from '@/shared/ui';

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
  /** Stick silhouette key for portrait frame. */
  portrait: 'player' | 'cicka' | 'draftsperson' | 'prompt';
}

export function RidgeConversationPanel({ params, dispatchAction }: SceneUiSurfaceProps) {
  const view = readParams(params);
  const titleId = useId();
  const textId = useId();

  useEffect(() => {
    if (!view || view.awaitingChoice) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'z' || event.key === 'Z') {
        event.preventDefault();
        dispatchAction('ridgeConversationAdvance');
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        dispatchAction('ridgeConversationLeave');
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatchAction, view]);

  if (!view) return null;

  return (
    <Card
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={textId}
      tone="paper"
      border="thick"
      shadow="lg"
      padding="md"
      className="grid w-[min(42rem,calc(100vw-1rem))] grid-cols-[5.5rem_1fr] gap-3 sm:grid-cols-[7rem_1fr] sm:gap-4"
    >
      <PortraitFrame portrait={view.portrait} speaker={view.speaker} />

      <div className="min-w-0 text-left">
        <div className="flex items-baseline justify-between gap-2">
          <p
            id={titleId}
            className="font-[Caveat,Comic_Neue,cursive] text-2xl font-bold leading-none text-[#1a1a1a] sm:text-3xl"
          >
            {view.speaker}
          </p>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#4b4337]">
            {view.lineIndex + 1}/{view.lineCount}
          </p>
        </div>

        <p
          id={textId}
          className="mt-2 font-mono text-sm font-bold leading-snug text-[#1a1a1a] sm:mt-3 sm:text-base"
        >
          {view.text}
        </p>

        {view.awaitingChoice && view.choices.length > 0 ? (
          <div className="mt-3 grid gap-2 sm:mt-4">
            {view.choices.map((choice, index) => (
              <Button
                key={choice.id}
                variant={index === 0 ? 'primary' : 'secondary'}
                size="md"
                className="justify-start font-mono text-xs uppercase tracking-wider sm:text-sm"
                onClick={() =>
                  dispatchAction('ridgeConversationChoose', { choiceId: choice.id })
                }
                autoFocus={index === 0}
              >
                {index + 1}. {choice.label}
              </Button>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
            <Button
              variant="primary"
              size="md"
              className="font-mono text-xs uppercase tracking-wider sm:text-sm"
              onClick={() => dispatchAction('ridgeConversationAdvance')}
              autoFocus
            >
              Continue
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="font-mono text-xs uppercase tracking-wider sm:text-sm"
              onClick={() => dispatchAction('ridgeConversationLeave')}
            >
              Step back
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function PortraitFrame({
  portrait,
  speaker
}: {
  portrait: RidgeConversationPanelView['portrait'];
  speaker: string;
}) {
  return (
    <div
      aria-hidden
      className="relative flex aspect-square items-end justify-center overflow-hidden rounded border-2 border-[#1a1a1a] bg-[#f4f1ea] shadow-[4px_4px_0px_0px_rgba(26,26,26,0.35)]"
      title={speaker}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:repeating-linear-gradient(-18deg,transparent,transparent_3px,#1a1a1a_3px,#1a1a1a_4px)]" />
      <svg viewBox="0 0 80 80" className="relative h-full w-full p-2">
        {portrait === 'cicka' ? <CickaPortrait /> : null}
        {portrait === 'draftsperson' ? <DraftspersonPortrait /> : null}
        {portrait === 'player' ? <PlayerPortrait /> : null}
        {portrait === 'prompt' ? <PromptPortrait /> : null}
      </svg>
    </div>
  );
}

function CickaPortrait() {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <ellipse cx="34" cy="52" rx="18" ry="12" fill="#fbfbf9" />
      <circle cx="50" cy="40" r="10" fill="#fbfbf9" />
      <path d="M42 30 L38 18 L48 28" />
      <path d="M54 30 L58 16 L50 28" />
      <path d="M18 50 Q8 34 14 28" />
    </g>
  );
}

function DraftspersonPortrait() {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <circle cx="40" cy="24" r="9" fill="#fbfbf9" />
      <path d="M40 34 V58" />
      <path d="M40 40 L22 50" />
      <path d="M40 40 L62 44" />
      <rect x="48" y="38" width="18" height="12" fill="#fbfbf9" />
      <path d="M28 58 L40 58 L52 58" />
    </g>
  );
}

function PlayerPortrait() {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <circle cx="40" cy="22" r="9" fill="#fbfbf9" />
      <path d="M40 32 V56" />
      <path d="M40 38 L24 48" />
      <path d="M40 38 L58 46" />
      <path d="M40 56 L28 72" />
      <path d="M40 56 L52 72" />
      <rect x="28" y="36" width="7" height="12" fill="#fbfbf9" />
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
