import { useEffect } from 'react';
import type {
  CickaAttackKind,
  CickaDuelPhase,
  CickaStrikeResult,
  RidgeEmotion
} from '@/game/core/ridge';
import type { SceneUiSurfaceProps } from '@/game/sceneUi/registry';
import { useMessages } from '@/shared/i18n';
import { cn } from '@/shared/ui/utils';
import { PortraitChip } from './conversationPortraits';

export interface RidgeCickaDuelPanelView {
  phase: CickaDuelPhase;
  hearts: number;
  maxHearts: number;
  strikesDone: number;
  strikesTotal: number;
  canDodge: boolean;
  /** Wind-up in progress (kind only; the ring in the scene carries the timing). */
  windup: CickaAttackKind | null;
  lastResult: CickaStrikeResult | null;
}

type Copy = ReturnType<typeof useMessages>['ridge']['cickaDuel'];

/**
 * Cicka's Standoff chrome: what she's doing, your nerve, and a big Dodge
 * button for touch. Timing lives in the scene (the closing ring); this panel
 * never needs per-frame updates.
 */
export function RidgeCickaDuelPanel({ params, dispatchAction }: SceneUiSurfaceProps) {
  const view = readParams(params);
  const copy = useMessages().ridge.cickaDuel;
  const fighting = view?.phase === 'fighting';

  useEffect(() => {
    if (!fighting) return;
    const onKey = (event: KeyboardEvent) => {
      if (!isDodgeKey(event)) return;
      event.preventDefault();
      dispatchAction('ridgeDuelDodge');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fighting, dispatchAction]);

  if (!view) return null;

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-2 sm:p-3 short:p-1.5">
      <div className="flex items-start gap-2">
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none flex max-w-[min(28rem,62%)] items-center gap-2 rounded-lg border-[3px] border-[#1a1a1a] bg-[#fbfbf9] p-1.5 pr-3 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] sm:gap-3 sm:p-2 sm:pr-4 short:p-1 short:pr-2"
        >
          <PortraitChip
            portrait="cicka"
            emotion={cickaEmotion(view)}
            className="h-10 w-10 sm:h-12 sm:w-12 short:h-7 short:w-7 short:border-2"
          />
          <p
            key={statusText(view, copy)}
            className="animate-ridge-enter-center text-[12px] font-bold leading-snug text-[#1a1a1a] motion-reduce:animate-none sm:text-sm short:text-[11px]"
          >
            {statusText(view, copy)}
          </p>
        </div>
        <div className="pointer-events-none ml-auto flex shrink-0 flex-col items-end gap-1.5">
          <span className="-rotate-2 rounded border-2 border-[#1a1a1a] bg-[#1a1a1a] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#fbfbf9] shadow-[3px_3px_0px_0px_rgba(75,67,55,1)] sm:text-xs">
            {copy.title}
          </span>
          <Nerve hearts={view.hearts} max={view.maxHearts} label={copy.hearts} />
          <span className="rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#1a1a1a] tabular-nums">
            {copy.strikes} {view.strikesDone}/{view.strikesTotal}
          </span>
        </div>
      </div>

      {fighting ? (
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            aria-label={copy.dodge}
            title={`${copy.dodge} (Space)`}
            onPointerDown={(event) => {
              // Fire on press, not release: timing is the whole game.
              event.preventDefault();
              dispatchAction('ridgeDuelDodge');
            }}
            onClick={(event) => {
              // Keyboard activation (Enter on a focused button) has no pointer press.
              if (event.detail === 0) dispatchAction('ridgeDuelDodge');
            }}
            className={cn(
              'pointer-events-auto h-16 touch-manipulation select-none rounded-full border-[3px] border-[#1a1a1a] bg-[#1a1a1a] px-8 text-base font-black uppercase tracking-wider text-[#fbfbf9] shadow-[4px_4px_0px_0px_rgba(75,67,55,1)] transition-all duration-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a] sm:h-20 sm:px-10 sm:text-lg short:h-12 short:px-6 short:text-sm',
              !view.canDodge && 'translate-y-1 opacity-60 shadow-none'
            )}
          >
            ⤺ {copy.dodge}
            <span className="ml-2 hidden text-[10px] opacity-70 pointer-fine:inline short:hidden">{copy.keys}</span>
          </button>
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}

/** Nerve as little paw-print pips: filled while you still have it. */
function Nerve({ hearts, max, label }: { hearts: number; max: number; label: string }) {
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={hearts}
      className="flex items-center gap-1.5 rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] px-1.5 py-1 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
    >
      <span className="text-[10px] font-black uppercase tracking-wider text-[#1a1a1a]">{label}</span>
      {Array.from({ length: max }, (_, index) => (
        <span
          key={index}
          className={cn(
            'h-3 w-3 rounded-full border-2 border-[#1a1a1a] transition-colors duration-150',
            index < hearts ? 'bg-[#1a1a1a]' : 'bg-transparent'
          )}
        />
      ))}
    </div>
  );
}

const DODGE_KEYS = new Set([' ', 'e', 'w', 'arrowup']);

function isDodgeKey(event: KeyboardEvent): boolean {
  const target = event.target;
  if (event.repeat || target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return false;
  // Space on a focused button already clicks it; do not dodge twice.
  if (event.key === ' ' && target instanceof HTMLButtonElement) return false;
  return DODGE_KEYS.has(event.key.toLowerCase());
}

function statusText(view: RidgeCickaDuelPanelView, copy: Copy): string {
  if (view.phase === 'won') return copy.won;
  if (view.phase === 'lost') return copy.lost;
  if (view.windup === 'pounce') return copy.windupPounce;
  if (view.windup === 'feint') return copy.windupFeint;
  if (view.windup === 'swipe') return copy.windupSwipe;
  if (view.lastResult) return copy[view.lastResult];
  return copy.intro;
}

function cickaEmotion(view: RidgeCickaDuelPanelView): RidgeEmotion {
  if (view.phase === 'won') return 'curious';
  if (view.phase === 'lost') return 'playful';
  if (view.lastResult === 'perfect') return 'surprised';
  return 'determined';
}

function readParams(params: unknown): RidgeCickaDuelPanelView | null {
  if (!params || typeof params !== 'object') return null;
  const value = params as RidgeCickaDuelPanelView;
  return typeof value.phase === 'string' && typeof value.hearts === 'number' ? value : null;
}
