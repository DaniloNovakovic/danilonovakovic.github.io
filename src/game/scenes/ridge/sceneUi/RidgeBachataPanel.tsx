import type {
  BachataStep,
  GigGrade,
  GigJudgment,
  GigLane,
  GigPhase,
  GigSectionKind,
  RidgeEmotion
} from '@/game/core/ridge';
import type { SceneUiSurfaceProps } from '@/game/sceneUi/registry';
import { useMessages } from '@/shared/i18n';
import { cn } from '@/shared/ui/utils';
import { PortraitChip } from './conversationPortraits';
import { WarmthMeter } from './WarmthMeter';

export interface RidgeBachataPanelView {
  phase: GigPhase;
  section: GigSectionKind | null;
  /** The driver's nerve, quantised so the panel does not re-render every frame. */
  nerve: number;
  combo: number;
  counts: { perfect: number; good: number; miss: number };
  notesTotal: number;
  lastJudgment: GigJudgment | null;
  grade: GigGrade;
}

type Copy = ReturnType<typeof useMessages>['ridge']['bachataLesson'];
const STEPS: readonly { lane: GigLane; step: BachataStep }[] = [
  { lane: 0, step: 'left' },
  { lane: 1, step: 'tap' },
  { lane: 2, step: 'right' }
];
const STREAK_STEP = 8;

/**
 * The Profe's lesson chrome: her coaching, the driver's nerve, and three big
 * step buttons for touch (step left, the hip tap, step right). The step strip
 * itself is drawn by Phaser, so this only changes when a step is judged.
 */
export function RidgeBachataPanel({ params, dispatchAction }: SceneUiSurfaceProps) {
  const view = readParams(params);
  const copy = useMessages().ridge.bachataLesson;
  if (!view) return null;
  const finished = view.phase === 'finished';
  const status = statusText(view, copy);

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-2 sm:p-3 short:p-1.5">
      <div className="flex flex-wrap items-start gap-2">
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none flex max-w-[min(28rem,100%)] items-center gap-2 rounded-lg border-[3px] border-[#1a1a1a] bg-[#fbfbf9] p-1.5 pr-3 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] sm:max-w-[min(28rem,58%)] sm:gap-3 sm:p-2 sm:pr-4 short:p-1 short:pr-2"
        >
          <PortraitChip
            portrait="teacher"
            emotion={teacherEmotion(view)}
            className="h-10 w-10 sm:h-12 sm:w-12 short:h-7 short:w-7 short:border-2"
          />
          <div className="min-w-0">
            <p
              key={status}
              className="animate-ridge-enter-center text-[12px] font-bold leading-snug text-[#1a1a1a] motion-reduce:animate-none sm:text-sm short:text-[11px]"
            >
              {status}
            </p>
            {finished ? (
              <p className="text-[10px] font-black uppercase tracking-wider text-[#4b4337] tabular-nums">
                {copy.gradeNote(view.counts.perfect, view.counts.good, view.notesTotal)}
              </p>
            ) : (
              <p className="text-[10px] font-black uppercase tracking-wider text-[#4b4337] short:hidden">
                {copy.subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="pointer-events-none ml-auto flex shrink-0 flex-row flex-wrap items-center justify-end gap-1.5 sm:flex-col sm:items-end short:flex-row short:items-center">
          <span className="hidden -rotate-2 rounded border-2 border-[#1a1a1a] bg-[#1a1a1a] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#fbfbf9] shadow-[3px_3px_0px_0px_rgba(75,67,55,1)] sm:inline sm:text-xs">
            {copy.title}
          </span>
          <WarmthMeter value={view.nerve} label={copy.nerve} />
          <span
            className={cn(
              'rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#1a1a1a] tabular-nums transition-transform duration-100',
              view.combo >= STREAK_STEP && 'scale-110 bg-[#1a1a1a] text-[#fbfbf9]'
            )}
          >
            {copy.combo} {view.combo}
          </span>
        </div>
      </div>

      {finished ? (
        <div className="flex justify-center pb-4">
          <span className="animate-ridge-bust-pop -rotate-3 rounded-md border-4 border-[#1a1a1a] bg-[#fbfbf9] px-5 py-2 text-xl font-black uppercase tracking-widest text-[#1a1a1a] shadow-[5px_5px_0px_0px_rgba(26,26,26,1)] motion-reduce:animate-none sm:text-3xl">
            {copy.grades[view.grade]}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          {/* Touch steps. Mouse-and-keyboard screens dance on the arrows or A S D. */}
          <div className="flex w-full max-w-[24rem] items-stretch justify-center gap-2 sm:gap-3 pointer-fine:hidden">
            {STEPS.map(({ lane, step }) => (
              <button
                key={lane}
                type="button"
                aria-label={copy.steps[lane]}
                onPointerDown={(event) => {
                  // Fire on press, not release, and carry the press time: the count is the game.
                  event.preventDefault();
                  dispatchAction('ridgeDanceStep', { lane, at: event.timeStamp });
                }}
                onClick={(event) => {
                  if (event.detail === 0) dispatchAction('ridgeDanceStep', { lane, at: event.timeStamp });
                }}
                className={cn(
                  'group pointer-events-auto flex h-11 touch-manipulation select-none flex-col items-center justify-center gap-0.5 rounded-xl border-[3px] border-[#1a1a1a] bg-[#fbfbf9] text-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-all duration-75 active:translate-y-1 active:bg-[#1a1a1a] active:text-[#fbfbf9] active:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a] pointer-coarse:h-20 short:h-10 short:pointer-coarse:h-14',
                  step === 'tap' ? 'flex-[0.8]' : 'flex-1'
                )}
              >
                <StepGlyph step={step} />
                <span className="text-[10px] font-black uppercase tracking-wider short:hidden">{copy.steps[lane]}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {/* Keyboard legend: the same glyphs as the step strip, each with its keys. */}
            <span className="pointer-events-none hidden items-center gap-1.5 pointer-fine:flex short:hidden">
              {STEPS.map(({ lane, step }) => (
                <span
                  key={lane}
                  className="flex items-center gap-1 whitespace-nowrap rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] px-1.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#1a1a1a]"
                >
                  <StepGlyph step={step} size="small" />
                  {copy.steps[lane]}: {copy.keys[lane]}
                </span>
              ))}
            </span>
            {/* The non-arcade path: the Profe counts it out, and the driver still gets his step. */}
            <button
              type="button"
              onClick={() => dispatchAction('ridgeDanceSkip')}
              className="pointer-events-auto rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
            >
              {copy.justCount}
            </button>
            <button
              type="button"
              onClick={() => dispatchAction('ridgeConversationLeave')}
              className="pointer-events-auto rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
            >
              {copy.stepAway}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Same glyphs as the step strip: arrows for the feet, a burst for the hip. */
function StepGlyph({ step, size = 'button' }: { step: BachataStep; size?: 'button' | 'small' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={size === 'small' ? 'h-3.5 w-3.5' : 'h-6 w-6 pointer-coarse:h-8 pointer-coarse:w-8'}
    >
      {step === 'tap' ? (
        <path d="M12 1 L14.5 8.5 L22.5 9 L16 14 L18.5 22 L12 17.5 L5.5 22 L8 14 L1.5 9 L9.5 8.5 Z" fill="currentColor" />
      ) : (
        <>
          <circle cx="12" cy="12" r="10" fill="currentColor" />
          <path
            d={step === 'left' ? 'M14 6 L8 12 L14 18' : 'M10 6 L16 12 L10 18'}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-[#fbfbf9] group-active:stroke-[#1a1a1a]"
          />
        </>
      )}
    </svg>
  );
}

// Coach-line priority is a flat ladder; reads best as one function.
// fallow-ignore-next-line complexity
function statusText(view: RidgeBachataPanelView, copy: Copy): string {
  if (view.phase === 'finished') return copy.grades[view.grade];
  if (view.phase === 'countIn') return copy.countIn;
  if (view.lastJudgment === 'miss' && view.combo === 0) return copy.shakeItOff;
  if (view.combo > 0 && view.combo % STREAK_STEP === 0) return copy.streak(view.combo);
  const section = view.section;
  if (section && section in copy.sections) return copy.sections[section as keyof Copy['sections']];
  return copy.countIn;
}

function teacherEmotion(view: RidgeBachataPanelView): RidgeEmotion {
  if (view.phase === 'finished') return view.grade === 'rough' ? 'thoughtful' : 'playful';
  if (view.lastJudgment === 'miss') return 'surprised';
  return view.combo >= STREAK_STEP ? 'playful' : 'determined';
}

function readParams(params: unknown): RidgeBachataPanelView | null {
  if (!params || typeof params !== 'object') return null;
  const value = params as RidgeBachataPanelView;
  return typeof value.phase === 'string' && typeof value.nerve === 'number' ? value : null;
}
