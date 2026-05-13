import type { SceneUiSurfaceProps } from '@/game/sceneUi/registry';
import type { StampedeHudSnapshot } from '../runtime/hudPresentation';

export function StampedeStatusStrip({ params }: SceneUiSurfaceProps) {
  const snapshot = readStatusParams(params);
  const noise = clamp(snapshot.pageNoise ?? 0, 0, 1);
  const feedback = formatFeedback(snapshot.feedback);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[#1a1a1a] [@media(max-height:420px)]:max-w-sm [@media(max-height:420px)]:gap-x-2 [@media(max-height:420px)]:gap-y-0">
      <p className="font-mono text-xl font-bold leading-none [@media(max-height:420px)]:text-base md:text-2xl">
        {formatTimer(snapshot.timeRemainingSeconds ?? snapshot.timerSeconds ?? 0)}
      </p>
      <div className="min-w-[8rem] flex-1 text-left [@media(max-height:420px)]:min-w-[5.5rem]">
        <p className="font-mono text-xs font-bold uppercase leading-tight tracking-widest text-[#4b4337] [@media(max-height:420px)]:text-[10px] md:text-sm">
          {snapshot.phaseLabel ?? 'Kite ideas'}
        </p>
        {feedback && (
          <p className="font-mono text-[10px] font-bold uppercase leading-tight tracking-wider text-[#1a1a1a]/75 [@media(max-height:420px)]:hidden md:text-xs">
            {feedback}
          </p>
        )}
      </div>
      <div className="flex min-w-[8rem] items-center gap-2 [@media(max-height:420px)]:min-w-[5.5rem] [@media(max-height:420px)]:gap-1">
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#4b4337] [@media(max-height:420px)]:text-[10px] md:text-sm">
          Noise
        </span>
        <div
          className="h-3 min-w-[4rem] flex-1 rounded-sm border-2 border-[#1a1a1a] bg-white [@media(max-height:420px)]:min-w-[3rem]"
          role="progressbar"
          aria-label="Page noise"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(noise * 100)}
        >
          <div
            className="h-full bg-[#1a1a1a]"
            style={{ width: `${Math.round(noise * 100)}%` }}
          />
        </div>
      </div>
      {typeof snapshot.scrapsCollected === 'number' && typeof snapshot.scrapGoal === 'number' ? (
        <p className="font-mono text-xs font-bold uppercase leading-tight tracking-widest text-[#4b4337] [@media(max-height:420px)]:hidden md:text-sm">
          Scraps {snapshot.scrapsCollected}/{snapshot.scrapGoal}
        </p>
      ) : null}
    </div>
  );
}

function readStatusParams(params: unknown): StampedeHudSnapshot {
  if (!params || typeof params !== 'object') return {};
  return params as StampedeHudSnapshot;
}

function formatTimer(seconds: number): string {
  const wholeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(wholeSeconds / 60);
  const paddedSeconds = `${wholeSeconds % 60}`.padStart(2, '0');

  return `${minutes}:${paddedSeconds}`;
}

function formatFeedback(feedback: StampedeHudSnapshot['feedback']): string {
  if (!feedback) return '';

  switch (feedback) {
    case 'smudged':
      return 'Smudged';
    case 'blanketHeld':
      return 'Blanket held';
    case 'crowded':
      return 'Page got crowded';
    default:
      return String(feedback);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
