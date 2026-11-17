import type {
  GigGrade,
  GigJudgment,
  GigLane,
  GigMode,
  GigPhase,
  GigSectionKind,
  RidgeEmotion
} from '@/game/core/ridge';
import type { SceneUiSurfaceProps } from '@/game/sceneUi/registry';
import { useMessages } from '@/shared/i18n';
import { cn } from '@/shared/ui/utils';
import { PortraitChip } from './conversationPortraits';

export interface RidgeConcertGigPanelView {
  mode: GigMode;
  phase: GigPhase;
  section: GigSectionKind | null;
  /** Crowd warmth, quantised so the panel does not re-render every frame. */
  hype: number;
  combo: number;
  counts: { perfect: number; good: number; miss: number };
  notesTotal: number;
  lastJudgment: GigJudgment | null;
  grade: GigGrade;
  practice: null | { loop: number; loopsTotal: number; hits: number; needed: number; passed: boolean };
  /** The kid is in the front row starting a clap. */
  kidHype: boolean;
}

type Copy = ReturnType<typeof useMessages>['ridge']['concertGig'];
const LANES: readonly GigLane[] = [0, 1, 2];
const STREAK_STEP = 10;

/**
 * Concert gig chrome: Steve coaching from the wings, the crowd meter, and
 * three big strum buttons for touch. The note highway itself is drawn by
 * Phaser, so this panel only changes when a note is judged.
 */
export function RidgeConcertGigPanel({ params, dispatchAction }: SceneUiSurfaceProps) {
  const view = readParams(params);
  const copy = useMessages().ridge.concertGig;
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
            portrait="guitarist"
            emotion={steveEmotion(view)}
            className="h-10 w-10 sm:h-12 sm:w-12 short:h-7 short:w-7 short:border-2"
          />
          <div className="min-w-0">
            <p
              key={status}
              className="animate-ridge-enter-center text-[12px] font-bold leading-snug text-[#1a1a1a] motion-reduce:animate-none sm:text-sm short:text-[11px]"
            >
              {status}
            </p>
            {view.practice && !finished ? (
              <p className="text-[10px] font-black uppercase tracking-wider text-[#4b4337] tabular-nums short:hidden">
                {copy.practicePass(
                  view.practice.loop + 1,
                  view.practice.loopsTotal,
                  view.practice.hits,
                  view.practice.needed
                )}
              </p>
            ) : null}
            {finished && view.mode === 'show' ? (
              <p className="text-[10px] font-black uppercase tracking-wider text-[#4b4337] tabular-nums">
                {copy.gradeNote(view.counts.perfect, view.counts.good, view.notesTotal)}
              </p>
            ) : null}
          </div>
        </div>
        <div className="pointer-events-none ml-auto flex shrink-0 flex-row flex-wrap items-center justify-end gap-1.5 sm:flex-col sm:items-end short:flex-row short:items-center">
          <span className="hidden -rotate-2 rounded sm:inline border-2 border-[#1a1a1a] bg-[#1a1a1a] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#fbfbf9] shadow-[3px_3px_0px_0px_rgba(75,67,55,1)] sm:text-xs">
            {view.mode === 'practice' ? copy.titlePractice : copy.titleShow}
          </span>
          {view.mode === 'show' ? <CrowdMeter hype={view.hype} label={copy.crowd} /> : null}
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
          {view.mode === 'show' ? (
            <span className="animate-ridge-bust-pop -rotate-3 rounded-md border-4 border-[#1a1a1a] bg-[#fbfbf9] px-5 py-2 text-xl font-black uppercase tracking-widest text-[#1a1a1a] shadow-[5px_5px_0px_0px_rgba(26,26,26,1)] motion-reduce:animate-none sm:text-3xl">
              {copy.grades[view.grade]}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <div className="flex w-full max-w-[22rem] items-stretch justify-center gap-2 sm:gap-3">
            {LANES.map((lane) => (
              <button
                key={lane}
                type="button"
                aria-label={copy.strum(copy.lanes[lane]!)}
                onPointerDown={(event) => {
                  // Fire on press, not release, and carry the press time: timing is the game.
                  event.preventDefault();
                  dispatchAction('ridgeGigStrum', { lane, at: event.timeStamp });
                }}
                onClick={(event) => {
                  // Keyboard activation (Enter on a focused button) has no pointer press.
                  if (event.detail === 0) dispatchAction('ridgeGigStrum', { lane, at: event.timeStamp });
                }}
                className="pointer-events-auto flex h-11 flex-1 touch-manipulation select-none items-center justify-center rounded-xl border-[3px] border-[#1a1a1a] bg-[#fbfbf9] text-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-all duration-75 active:translate-y-1 active:bg-[#1a1a1a] active:text-[#fbfbf9] active:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a] pointer-coarse:h-20 short:h-10 short:pointer-coarse:h-14"
              >
                <LaneGlyph lane={lane} />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="pointer-events-none hidden text-[10px] font-bold uppercase tracking-wider text-[#4b4337] pointer-fine:inline short:hidden">
              {copy.keys}
            </span>
            {view.mode === 'practice' ? (
              <button
                type="button"
                onClick={() => dispatchAction('ridgeConversationLeave')}
                className="pointer-events-auto rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
              >
                {copy.stepAway}
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

/** How warm the crowd is: a hand-ruled bar that fills as they warm up. */
function CrowdMeter({ hype, label }: { hype: number; label: string }) {
  const percent = Math.round(hype * 100);
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="flex items-center gap-1.5 rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] px-1.5 py-1 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
    >
      <span className="text-[10px] font-black uppercase tracking-wider text-[#1a1a1a]">{label}</span>
      <span className="relative h-2.5 w-20 overflow-hidden rounded-sm border-2 border-[#1a1a1a] sm:w-28">
        <span
          className="absolute inset-y-0 left-0 bg-[#1a1a1a] transition-[width] duration-200"
          style={{ width: `${percent}%` }}
        />
      </span>
    </div>
  );
}

/** Same shapes as the highway: circle, diamond, square. */
function LaneGlyph({ lane }: { lane: GigLane }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6 pointer-coarse:h-8 pointer-coarse:w-8">
      {lane === 0 ? <circle cx="12" cy="12" r="8" fill="currentColor" /> : null}
      {lane === 1 ? <path d="M12 2 L22 12 L12 22 L2 12 Z" fill="currentColor" /> : null}
      {lane === 2 ? <rect x="4.5" y="4.5" width="15" height="15" fill="currentColor" /> : null}
    </svg>
  );
}

// Coach-line priority is a flat ladder; reads best as one function.
// fallow-ignore-next-line complexity
function statusText(view: RidgeConcertGigPanelView, copy: Copy): string {
  if (view.phase === 'finished') {
    if (view.mode === 'show') return copy.grades[view.grade];
    return view.practice?.passed ? copy.practicePassed : copy.practiceAssisted;
  }
  if (view.phase === 'countIn') {
    if (view.mode === 'practice') return copy.countInPractice;
    return view.kidHype ? copy.countInKid : copy.countInShow;
  }
  if (view.lastJudgment === 'miss' && view.combo === 0) return copy.shakeItOff;
  if (view.combo > 0 && view.combo % STREAK_STEP === 0) return copy.streak(view.combo);
  return view.section ? copy.sections[view.section] : copy.countInShow;
}

function steveEmotion(view: RidgeConcertGigPanelView): RidgeEmotion {
  if (view.phase === 'finished') return view.grade === 'rough' ? 'thoughtful' : 'playful';
  if (view.lastJudgment === 'miss') return 'surprised';
  if (view.combo >= STREAK_STEP || view.hype > 0.75) return 'playful';
  return 'determined';
}

function readParams(params: unknown): RidgeConcertGigPanelView | null {
  if (!params || typeof params !== 'object') return null;
  const value = params as RidgeConcertGigPanelView;
  return typeof value.phase === 'string' && typeof value.mode === 'string' ? value : null;
}
